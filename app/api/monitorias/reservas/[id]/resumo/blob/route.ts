import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { obterColecoes } from '@/lib/monitorias/db'
import { BYTES_MAX_SEGMENTO } from '@/lib/monitorias/resumo/regras'
import { caminhoNoBlob } from '@/lib/monitorias/resumo/tarefa'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Reserva do envio de voz: quando o navegador não consegue mandar o trecho
 * direto ao Google, ele vai para o Blob PRIVADO (upload direto do navegador,
 * como os comprovantes do PROUNI) e o processador repassa ao Google e apaga.
 *
 * O token só sai para um trecho que a pessoa abriu agora (status "enviando",
 * reserva marcada como Blob), no caminho exato daquele trecho e com o tamanho
 * declarado — ninguém usa a rota como disco.
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = (await request.json()) as HandleUploadBody
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const session = await getSession()
        if (!session) throw new Error('Não autorizado')
        const rl = await checkRateLimit(session.userId, 'monitorias_resumo_blob', 40, 3_600_000)
        if (!rl.success) throw new Error('Muitos envios. Tente mais tarde.')
        let reservaId = ''
        let seq = -1
        try {
          const p = JSON.parse(clientPayload || '{}')
          reservaId = String(p.reservaId || '')
          seq = Number(p.seq)
        } catch {
          throw new Error('Payload inválido')
        }
        const c = await obterColecoes()
        const seg = await c.resumosSegmentos.findOne({ reservaId, userId: session.userId, seq, status: 'enviando', origem: 'blob' })
        const nonce = String(seg?.nomeDeExibicao || '').split('-').pop() || ''
        if (!seg || !nonce || pathname !== caminhoNoBlob(reservaId, session.userId, seq, nonce)) throw new Error('Trecho inválido')
        return {
          access: 'private',
          addRandomSuffix: true,
          allowedContentTypes: ['audio/webm', 'audio/ogg', 'audio/mp4', 'application/octet-stream'],
          maximumSizeInBytes: Math.min(BYTES_MAX_SEGMENTO, seg.bytes + 1024),
          tokenPayload: JSON.stringify({ userId: session.userId, reservaId, seq }),
        }
      },
    })
    return NextResponse.json(jsonResponse)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao autorizar envio'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
