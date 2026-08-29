/**
 * Upload de imagens de flashcards direto para o Vercel Blob.
 *
 * O caminho antigo (`/api/upload`) grava em `public/uploads`, que é um disco
 * efêmero e somente-leitura em produção serverless: na prática as imagens de
 * cartão só sobreviviam se o usuário as hospedasse fora (Imgur) e colasse a
 * URL. Esta rota autoriza o upload client-side — o arquivo vai do navegador
 * para o Blob sem passar pela função, o que também tira o limite de corpo de
 * requisição do caminho e permite mandar dezenas de imagens de uma vez.
 *
 * POST /api/flashcards/upload → gera token de upload (handleUpload).
 * Qualquer usuário autenticado pode usar; o teto por arquivo é o mesmo do
 * seletor de imagem do editor de cartões.
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const FLASHCARD_BLOB_PREFIX = 'flashcards/'
const FLASHCARD_IMAGE_MAX_BYTES = 8 * 1024 * 1024

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = (await request.json()) as HandleUploadBody

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const session = await getSession()
        if (!session) {
          throw new Error('Não autenticado')
        }
        if (!pathname.startsWith(FLASHCARD_BLOB_PREFIX)) {
          throw new Error('Caminho de upload inválido')
        }
        return {
          access: 'public',
          addRandomSuffix: true,
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
          maximumSizeInBytes: FLASHCARD_IMAGE_MAX_BYTES,
          tokenPayload: JSON.stringify({ userId: session.userId }),
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao autorizar upload'
    console.error('[flashcards/upload] error:', error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
