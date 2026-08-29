/**
 * Upload de imagens de flashcards direto para o Vercel Blob.
 *
 * O caminho antigo (`/api/upload`) grava em `public/uploads`, que é um disco
 * efêmero e somente-leitura em produção serverless: na prática as imagens de
 * cartão só sobreviviam se o usuário as hospedasse fora (Imgur) e colasse a
 * URL. Esta rota autoriza o upload client-side — o arquivo vai do navegador
 * para o Blob sem passar pela função, o que também tira o limite de 4,5 MB de
 * corpo de requisição e permite mandar dezenas de imagens de uma vez.
 *
 * POST /api/flashcards/upload → gera token de upload (handleUpload).
 * Qualquer usuário autenticado pode usar.
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const FLASHCARD_BLOB_PREFIX = 'flashcards/'
const FLASHCARD_IMAGE_MAX_BYTES = 8 * 1024 * 1024

/**
 * O store PÚBLICO de imagens, nunca o padrão do SDK.
 *
 * Sem `token` explícito, o SDK lê `BLOB_READ_WRITE_TOKEN`, que neste projeto é
 * o store PRIVADO dos PDFs de materiais (veja `.env.example` e
 * `lib/midia/deposito.ts`). Pedir `access: 'public'` naquele store faz a API do
 * Blob recusar o PUT com 400 — e como a resposta de erro não traz cabeçalho de
 * CORS, o navegador só mostra "blocked by CORS policy", que não diz nada sobre
 * a causa. Foi exatamente esse o sintoma que trouxe este comentário aqui.
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
          // O nome carrega um sufixo aleatório, então a URL é imutável: vale
          // cachear pelo máximo. É a mesma imagem em toda revisão do cartão.
          cacheControlMaxAge: 31_536_000,
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
