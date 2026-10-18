import { NextRequest } from 'next/server'
import { z } from 'zod'
import { erro, lerJson } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { carregarReserva } from '@/lib/monitorias/reservas'
import { concluirEnvioDeTrecho } from '@/lib/monitorias/resumo/tarefa'
import { dispararProcessador } from '@/lib/monitorias/resumo/disparo'

export const dynamic = 'force-dynamic'

const Corpo = z
  .object({ seq: z.number().int().min(0).max(400), arquivo: z.string().max(80).optional(), blobUrl: z.string().url().max(500).optional() })
  .strict()

/** POST — o trecho chegou ao Google (ou ao Blob): registra e dispara a transcrição (ninguém espera por ela). */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { limite: { limit: 40, windowMs: 10 * 60_000 } }, async ({ sessao }) => {
    const corpo = Corpo.safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, 'Pedido inválido.')
    const reserva = await carregarReserva(params.id)
    await concluirEnvioDeTrecho(reserva, sessao.userId, corpo.data)
    dispararProcessador(new URL(request.url).origin)
    return ok({ recebido: true })
  })
}
