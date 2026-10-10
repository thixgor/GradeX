import { NextRequest } from 'next/server'
import { z } from 'zod'
import { erro, idDe, lerJson } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { carregarUsuario } from '@/lib/monitorias/servidor'
import { responderDemanda } from '@/lib/monitorias/demandas'
import { limparTexto } from '@/lib/monitorias/validacao'
import { mascararContato } from '@/lib/monitorias/contato'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const Corpo = z.object({ anuncioId: z.string().length(24), mensagem: z.string().trim().min(5).max(1000) }).strict()

/** POST — o monitor responde um pedido: abre a conversa com o aluno. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { limite: 'WRITE' }, async ({ sessao }) => {
    // Cada resposta manda e-mail ao aluno: teto por monitor.
    const lim = await checkRateLimit(`mon-resp-demanda:${sessao.userId}`, 'monitorias_resposta_demanda', 20, 24 * 60 * 60_000)
    if (!lim.success) return erro(429, 'Você respondeu muitos pedidos hoje. Tente de novo amanhã.')
    const corpo = Corpo.safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, 'Escolha o anúncio e escreva uma mensagem curta.')
    const monitor = await carregarUsuario(sessao.userId)
    if (!monitor || monitor.banned) return erro(403, 'Sua conta não pode responder pedidos agora.')
    const reserva = await responderDemanda({
      demandaId: params.id,
      anuncioId: corpo.data.anuncioId,
      monitor,
      mensagem: mascararContato(limparTexto(corpo.data.mensagem)).texto,
    })
    return ok({ reservaId: idDe(reserva) }, 201)
  })
}
