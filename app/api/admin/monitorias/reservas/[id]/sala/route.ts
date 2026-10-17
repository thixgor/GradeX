import { NextRequest } from 'next/server'
import { z } from 'zod'
import { audit } from '@/lib/payments/audit'
import { erro, idDe, lerJson } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { carregarReserva } from '@/lib/monitorias/reservas'
import { acaoDoSuporte } from '@/lib/monitorias/sala/servidor'

export const dynamic = 'force-dynamic'

const Pid = z.string().regex(/^[A-Za-z0-9_-]{16}$/)
const Corpo = z.discriminatedUnion('acao', [
  z.object({ acao: z.literal('encerrar') }).strict(),
  z.object({ acao: z.literal('reabrir') }).strict(),
  z.object({ acao: z.literal('remover'), pid: Pid }).strict(),
  z.object({ acao: z.literal('readmitir'), pid: Pid }).strict(),
])

/**
 * POST {acao} — o suporte encerra/reabre a aula ou tira/libera alguém da sala.
 * Não mexe na reserva (para cancelar com reembolso: `…/cancelar`).
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async ({ sessao, ip }) => {
    const corpo = Corpo.safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, 'Ação inválida.')
    const reserva = await carregarReserva(params.id)
    const r = await acaoDoSuporte(reserva, corpo.data)
    if (!r.ok) return erro(r.status, r.mensagem)
    await audit({ action: 'monitoria_sala_suporte', actorUserId: sessao.userId, resourceType: 'monitoria_reserva', resourceId: idDe(reserva), metadata: { ...corpo.data }, ip })
    return ok({ ok: true })
  })
}
