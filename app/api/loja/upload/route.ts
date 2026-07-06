/**
 * Upload de imagens da galeria de produtos físicos (loja).
 *
 * Usa client-side upload do Vercel Blob (mesmo padrão de
 * app/api/materiais/upload). As imagens são PÚBLICAS (renderizadas via <img>),
 * então o token gera blobs com access 'public'. O cliente recebe a URL do blob
 * diretamente do upload() e a adiciona ao array `images` do produto — não é
 * necessário um passo de confirmação (PUT).
 *
 * POST /api/loja/upload → gera token de upload (handleUpload), admin only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const BLOB_PREFIX = 'shop-products/'

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = (await request.json()) as HandleUploadBody

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
          throw new Error('Não autorizado')
        }
        if (!pathname.startsWith(BLOB_PREFIX)) {
          throw new Error('Caminho de upload inválido')
        }
        return {
          access: 'public',
          addRandomSuffix: true,
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          maximumSizeInBytes: 15 * 1024 * 1024,
          tokenPayload: JSON.stringify({ userId: session.userId }),
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao autorizar upload'
    console.error('[loja/upload] error:', error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
