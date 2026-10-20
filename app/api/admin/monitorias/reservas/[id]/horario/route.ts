import { NextRequest } from 'next/server'
import { z } from 'zod'
import { audit } from '@/lib/payments/audit'
import { erro, idDe, lerJson } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { alterarHorarioPeloSuporte, carregarReserva } from '@/lib/monitorias/reservas'

export const dynamic = 'force-dynamic'

const Corpo = z
  .object({
    inicio: z.union([z.literal('agora'), z.string().datetime({ offset: true })]),
    duracaoMin: z.number().int().min(15).max(480).optional(),
  })
  .strict()

/**
 * POST {inicio: ISO | 'agora', duracaoMin?} — o suporte muda o horário da
 * monitoria. "agora" abre a sala na hora (adiantar uma aula, testar).
 */
export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async ({ sessao, ip }) => {
    const corpo = Corpo.safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, 'Horário inválido.')
    const reserva = await carregarReserva(params.id, { incluirExcluida: true })
    const agora = new Date()
    const inicio = corpo.data.inicio === 'agora' ? agora : new Date(corpo.data.inicio)
    const duracaoMin = corpo.data.duracaoMin ?? reserva.proposta?.duracaoMin ?? 60
    const antes = { inicio: reserva.inicio || null, fim: reserva.fim || null }
    const nova = await alterarHorarioPeloSuporte({ reserva, inicio, duracaoMin, agora })
    await audit({
      action: 'monitoria_horario_suporte',
      actorUserId: sessao.userId,
      resourceType: 'monitoria_reserva',
      resourceId: idDe(reserva),
      metadata: { antes, depois: { inicio: nova.inicio, fim: nova.fim }, duracaoMin, pedido: corpo.data.inicio },
      ip,
    })
    return ok({ inicio: nova.inicio, fim: nova.fim })
  })
}
