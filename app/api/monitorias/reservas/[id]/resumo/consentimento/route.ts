import { NextRequest } from 'next/server'
import { z } from 'zod'
import { erro, lerJson } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { carregarReserva } from '@/lib/monitorias/reservas'
import { registrarConsentimento } from '@/lib/monitorias/resumo/tarefa'

export const dynamic = 'force-dynamic'

const Corpo = z.object({ aceito: z.boolean() }).strict()

/** POST {aceito} — o monitor autoriza (ou não) a transcrição da própria voz nesta aula. Definitivo. */
export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  return rotaAutenticada(request, { limite: 'WRITE' }, async ({ sessao, ip }) => {
    const corpo = Corpo.safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, 'Pedido inválido.')
    const reserva = await carregarReserva(params.id)
    const estado = await registrarConsentimento(reserva, sessao.userId, corpo.data.aceito, ip)
    return ok({ resumo: estado })
  })
}
