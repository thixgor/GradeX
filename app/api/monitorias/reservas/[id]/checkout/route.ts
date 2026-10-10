import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rate-limit'
import { getDb } from '@/lib/mongodb'
import { erro, lerJson, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { carregarUsuario, termosAceitos } from '@/lib/monitorias/servidor'
import { criarCheckoutPix, ofertaDeMaterial } from '@/lib/monitorias/pagamento'
import { carregarReserva } from '@/lib/monitorias/reservas'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * GET — o que o checkout oferece a este aluno: o material oficial indicado no
 * anúncio (preço oficial do banco) e se ele já o tem; e, se já existe um PIX
 * aberto, se ele foi gerado com ou sem material (para reabrir o mesmo).
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { limite: 'READ' }, async ({ sessao }) => {
    const [reserva, aluno, c] = await Promise.all([carregarReserva(params.id), carregarUsuario(sessao.userId), obterColecoes()])
    if (!aluno) return erro(403, 'Conta indisponível.')
    const part = await c.participacoes.findOne({ reservaId: params.id, alunoId: sessao.userId }, { projection: { paymentOrderId: 1, status: 1, valorCentavos: 1 } })
    if (!part) return erro(404, 'Não encontrado.')
    const [oferta, pedido] = await Promise.all([
      part.valorCentavos > 0 ? ofertaDeMaterial(reserva, aluno) : Promise.resolve({ material: null, jaTem: false, interno: null }),
      part.paymentOrderId && ObjectId.isValid(part.paymentOrderId)
        ? (await getDb()).collection('payment_orders').findOne({ _id: new ObjectId(part.paymentOrderId) }, { projection: { status: 1, expiresAt: 1, metadata: 1 } })
        : Promise.resolve(null),
    ])
    const aberto = !!pedido && ['pending', 'in_process'].includes(pedido.status) && !!pedido.expiresAt && new Date(pedido.expiresAt) > new Date()
    return ok({
      material: oferta.material,
      jaTem: oferta.jaTem,
      valorAulaCentavos: part.valorCentavos,
      pixAberto: aberto ? { comMaterial: !!pedido?.metadata?.materialOficial } : null,
    })
  })
}

const Corpo = z.object({ incluirMaterial: z.boolean().optional() }).strict()

/**
 * POST {incluirMaterial?} — gera (ou reaproveita) o PIX do MEU assento nesta
 * reserva. Não há valor no corpo de propósito: o preço da aula é o do assento
 * e o do material é o oficial, lido do banco. Qualquer outro campo: 400.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { limite: 'WRITE' }, async ({ sessao, ip }) => {
    const limite = await checkRateLimit(`mon-checkout:${sessao.userId}`, 'monitorias_checkout', 8, 10 * 60_000)
    if (!limite.success) return erro(429, 'Muitas tentativas de pagamento. Aguarde alguns minutos.')
    const bruto = await lerJson(request).catch(() => ({}))
    const corpo = Corpo.safeParse(bruto ?? {})
    if (!corpo.success) return erro(400, 'Pedido inválido.')
    const [aluno, aceitos] = await Promise.all([carregarUsuario(sessao.userId), termosAceitos(sessao.userId, 'aluno')])
    if (!aluno || aluno.banned) return erro(403, 'Conta indisponível.')
    if (!aceitos) return erro(409, 'Aceite os Termos de Serviço do Aluno antes de pagar.')
    const resposta = await criarCheckoutPix({ reservaId: params.id, aluno, ip, incluirMaterial: !!corpo.data.incluirMaterial })
    return ok(resposta)
  })
}
