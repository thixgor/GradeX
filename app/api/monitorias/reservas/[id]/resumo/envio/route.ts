import { NextRequest } from 'next/server'
import { z } from 'zod'
import { erro, lerJson } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { carregarReserva } from '@/lib/monitorias/reservas'
import { abrirEnvioDeTrecho } from '@/lib/monitorias/resumo/tarefa'

export const dynamic = 'force-dynamic'

const Corpo = z
  .object({
    seq: z.number().int().min(0).max(400),
    bytes: z.number().int().min(1),
    mime: z.string().max(80),
    duracaoAudioMs: z.number().min(0),
    duracaoRealMs: z.number().min(0),
    inicio: z.string().max(40),
    marcas: z.array(z.tuple([z.number(), z.number()])).max(3000),
    /** O navegador não alcançou o Google: pede o caminho no Blob privado. */
    viaBlob: z.boolean().optional(),
    /** Por que o envio direto falhou (status HTTP ou rede/CORS), para o diagnóstico do admin. */
    erroDireto: z.string().max(200).optional(),
  })
  .strict()

/**
 * POST — URL de envio de um trecho de voz. O áudio vai do navegador DIRETO
 * para o Google (Files API, upload resumable): nenhum byte passa pela função.
 * Se o Google não abrir a sessão, devolve o caminho no Blob privado (reserva).
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { limite: { limit: 40, windowMs: 10 * 60_000 } }, async ({ sessao }) => {
    const corpo = Corpo.safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, 'Trecho inválido.')
    const reserva = await carregarReserva(params.id)
    const origem = request.headers.get('origin') || new URL(request.url).origin
    const { viaBlob, erroDireto, ...trecho } = corpo.data
    return ok(await abrirEnvioDeTrecho(reserva, sessao.userId, trecho, origem, new Date(), !!viaBlob, erroDireto))
  })
}
