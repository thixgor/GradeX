import { NextRequest } from 'next/server'
import { z } from 'zod'
import { erro, lerJson } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { carregarReserva } from '@/lib/monitorias/reservas'
import { registrarFimDaVoz } from '@/lib/monitorias/resumo/tarefa'
import { dispararProcessador } from '@/lib/monitorias/resumo/disparo'

export const dynamic = 'force-dynamic'

const Corpo = z.object({ ultimoSeq: z.number().int().min(-1).max(400) }).strict()

/** POST {ultimoSeq} — a pessoa saiu da sala: o resumo não precisa esperar mais trechos dela. */
export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  return rotaAutenticada(request, { limite: { limit: 20, windowMs: 10 * 60_000 } }, async ({ sessao }) => {
    const corpo = Corpo.safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, 'Pedido inválido.')
    const reserva = await carregarReserva(params.id)
    await registrarFimDaVoz(reserva, sessao.userId, corpo.data.ultimoSeq)
    dispararProcessador(new URL(request.url).origin)
    return ok({ ok: true })
  })
}
