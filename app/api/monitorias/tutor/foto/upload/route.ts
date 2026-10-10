import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { pastaDaFoto } from '@/lib/monitorias/cripto'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * Autoriza o envio da foto de monitor direto do navegador para o Blob PÚBLICO
 * de imagens (mesmo store das imagens de flashcard). Cada conta só escreve na
 * própria pasta (`pastaDaFoto`: apelido opaco da conta, não o userId) — é o que a rota de salvar a foto
 * confere depois.
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN_MIDIA
    if (!token) throw new Error('Envio de imagens indisponível no momento.')
    const body = (await request.json()) as HandleUploadBody
    const json = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async (pathname) => {
        const session = await getSession()
        if (!session) throw new Error('Não autenticado')
        const limite = await checkRateLimit(`mon-foto:${session.userId}`, 'monitorias_foto', 10, 60 * 60_000)
        if (!limite.success) throw new Error('Muitos envios. Tente mais tarde.')
        if (!pathname.startsWith(pastaDaFoto(session.userId))) throw new Error('Caminho de upload inválido')
        return {
          access: 'public',
          addRandomSuffix: true,
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          maximumSizeInBytes: 3 * 1024 * 1024,
          cacheControlMaxAge: 31_536_000,
          tokenPayload: JSON.stringify({ userId: session.userId }),
        }
      },
    })
    return NextResponse.json(json)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao autorizar upload'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
