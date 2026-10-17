import { NextRequest } from 'next/server'
import { z } from 'zod'
import { audit } from '@/lib/payments/audit'
import { erro, idDe, lerJson } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { cancelarPeloSuporte, carregarReserva } from '@/lib/monitorias/reservas'
import { acaoDoSuporte } from '@/lib/monitorias/sala/servidor'
import { limparTexto } from '@/lib/monitorias/validacao'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const Corpo = z.object({ motivo: z.string().min(5).max(1000), culpaDoMonitor: z.boolean() }).strict()

/**
 * POST {motivo, culpaDoMonitor} — o suporte cancela a monitoria: reembolso
 * integral de quem pagou, agenda e contratos liberados, aviso a todos e a sala
 * de vídeo encerrada (quem estiver dentro sai no próximo pulso).
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async ({ sessao, ip }) => {
    const corpo = Corpo.safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, 'Escreva o motivo (ele vai para o monitor e os alunos).')
    const reserva = await carregarReserva(params.id, { incluirExcluida: true })
    const motivo = limparTexto(corpo.data.motivo)
    const { reembolsos } = await cancelarPeloSuporte({ reserva, adminId: sessao.userId, motivo, culpaDoMonitor: corpo.data.culpaDoMonitor })
    if (reserva.fim) await acaoDoSuporte(reserva, { acao: 'encerrar' })
    await audit({
      action: 'monitoria_cancelada_suporte',
      actorUserId: sessao.userId,
      resourceType: 'monitoria_reserva',
      resourceId: idDe(reserva),
      metadata: { motivo, culpaDoMonitor: corpo.data.culpaDoMonitor, statusAnterior: reserva.status, reembolsos },
      ip,
    })
    return ok({ status: 'cancelada_suporte', reembolsos })
  })
}
