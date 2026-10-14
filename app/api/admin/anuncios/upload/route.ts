/**
 * Upload da mídia do anúncio (imagem ou vídeo) direto do computador para o
 * Vercel Blob.
 *
 * Antes desta rota o único caminho era colar uma URL — na prática, subir a arte
 * no Imgur e colar o link aqui. Isso deixava o banner dependente de um serviço
 * de terceiros que pode expirar, hotlinkar ou simplesmente sair do ar levando
 * junto o anúncio de uma campanha paga.
 *
 * O envio é client-side (`@vercel/blob/client`): o arquivo vai do navegador
 * para o Blob sem passar pela função, o que evita o limite de 4,5 MB de corpo
 * de requisição das rotas serverless.
 *
 * O arquivo que chega aqui JÁ foi comprimido no navegador
 * (`lib/anuncio-midia-otimizar.ts`): o original nunca é enviado. Os limites
 * abaixo valem para a versão otimizada.
 *
 * POST /api/admin/anuncios/upload → gera o token de upload. Admin apenas.
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ANUNCIO_BLOB_PREFIX = 'anuncios/'
/** Vídeos moram numa pasta própria: é o caminho que libera o tipo e o limite de vídeo. */
const ANUNCIO_VIDEO_PREFIX = 'anuncios/videos/'
const ANUNCIO_IMAGE_MAX_BYTES = 8 * 1024 * 1024
const ANUNCIO_VIDEO_MAX_BYTES = 80 * 1024 * 1024
const ANUNCIO_VIDEO_CONTENT_TYPES = ['video/mp4']

const ANUNCIO_IMAGE_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]

/**
 * O store PÚBLICO de imagens, nunca o padrão do SDK.
 *
 * Sem `token` explícito o SDK usa `BLOB_READ_WRITE_TOKEN`, que neste projeto é
 * o store PRIVADO dos PDFs de materiais. Pedir `access: 'public'` naquele store
 * faz a API do Blob recusar o PUT com 400 — e, como a resposta de erro não traz
 * cabeçalho de CORS, o navegador mostra apenas "blocked by CORS policy", que
 * não diz nada sobre a causa. Mesmo raciocínio de `app/api/flashcards/upload`.
 */
function getPublicImageToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN_MIDIA
  if (!token) {
    throw new Error(
      'BLOB_READ_WRITE_TOKEN_MIDIA ausente — é o token do store público de imagens. ' +
        'Não use BLOB_READ_WRITE_TOKEN: aquele store é privado e guarda os PDFs de materiais.',
    )
  }
  return token
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = (await request.json()) as HandleUploadBody

    const jsonResponse = await handleUpload({
      body,
      request,
      token: getPublicImageToken(),
      onBeforeGenerateToken: async (pathname) => {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
          throw new Error('Acesso negado')
        }
        if (!pathname.startsWith(ANUNCIO_BLOB_PREFIX)) {
          throw new Error('Caminho de upload inválido')
        }
        const video = pathname.startsWith(ANUNCIO_VIDEO_PREFIX)
        return {
          access: 'public',
          addRandomSuffix: true,
          allowedContentTypes: video ? ANUNCIO_VIDEO_CONTENT_TYPES : ANUNCIO_IMAGE_CONTENT_TYPES,
          maximumSizeInBytes: video ? ANUNCIO_VIDEO_MAX_BYTES : ANUNCIO_IMAGE_MAX_BYTES,
          // O nome carrega sufixo aleatório, então a URL é imutável e pode ser
          // cacheada pelo máximo: trocar a arte cria outro blob, outra URL. O
          // vídeo é servido direto do CDN do Blob (com Range), sem passar por
          // função nenhuma — zero Fast Origin Transfer.
          cacheControlMaxAge: 31_536_000,
          tokenPayload: JSON.stringify({ userId: session.userId }),
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao autorizar upload'
    console.error('[admin/anuncios/upload] error:', error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
