import { NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { erro } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { carregarUsuario, termosAceitos } from '@/lib/monitorias/servidor'
import { criarCheckoutPix } from '@/lib/monitorias/pagamento'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * POST (sem corpo) — gera (ou reaproveita) o PIX do MEU assento nesta reserva.
 * Não há valor no corpo de propósito: o preço é o que ficou no assento.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { limite: 'WRITE', emailVerificado: true }, async ({ sessao, ip }) => {
    const limite = await checkRateLimit(`mon-checkout:${sessao.userId}`, 'monitorias_checkout', 8, 10 * 60_000)
    if (!limite.success) return erro(429, 'Muitas tentativas de pagamento. Aguarde alguns minutos.')
    const [aluno, aceitos] = await Promise.all([carregarUsuario(sessao.userId), termosAceitos(sessao.userId, 'aluno')])
    if (!aluno || aluno.banned) return erro(403, 'Conta indisponível.')
    if (!aceitos) return erro(409, 'Aceite os Termos de Serviço do Aluno antes de pagar.')
    const resposta = await criarCheckoutPix({ reservaId: params.id, aluno, ip })
    return ok(resposta)
  })
}
