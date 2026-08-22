/**
 * Rede de segurança do endereço `/midia/<aa>/<sha256>.<ext>`.
 *
 * O caminho normal não passa por aqui: `next.config.js` reescreve `/midia/*`
 * direto para o CDN do armazenamento quando `BLOB_PUBLIC_BASE_URL` está
 * definida, e nenhuma função é invocada. Esta rota existe para o caso em que a
 * variável falta — num ambiente novo, num preview mal configurado, ou logo
 * depois de trocar de store.
 *
 * Sem ela, esquecer uma variável de ambiente apagaria todas as imagens do site
 * de uma vez. Com ela, o pior caso é um redirecionamento a mais por imagem, e
 * o `media_assets` — que já guarda a URL absoluta de cada arquivo — é a fonte
 * da resposta.
 *
 * O caminho é imutável por construção (o nome é o hash do conteúdo), então o
 * próprio redirecionamento pode ser cacheado por um ano.
 */

import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { COLECAO_ASSETS } from '@/lib/midia/deposito'
import { PREFIXO_MIDIA } from '@/lib/midia/urls'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * O formato é fechado: dois dígitos hexadecimais de prateleira, o SHA-256 e uma
 * extensão curta. Validar antes de consultar transforma qualquer tentativa de
 * path traversal ou de varredura em 404 sem tocar o banco.
 */
const FORMATO = /^[0-9a-f]{2}\/[0-9a-f]{64}\.[a-z0-9]{1,5}$/

const CACHE = 'public, max-age=31536000, s-maxage=31536000, immutable'

export async function GET(
  _request: Request,
  { params }: { params: { caminho?: string[] } },
) {
  const relativo = (params.caminho || []).join('/')
  if (!FORMATO.test(relativo)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const caminho = `${PREFIXO_MIDIA}/${relativo}`

  try {
    const db = await getDb()
    const asset = await db
      .collection(COLECAO_ASSETS)
      .findOne({ caminho }, { projection: { urlBlob: 1 } })

    const base = (process.env.BLOB_PUBLIC_BASE_URL || '').replace(/\/+$/, '')
    const destino = asset?.urlBlob || (base ? `${base}${caminho}` : '')

    if (!destino) {
      return new NextResponse('Not found', { status: 404 })
    }

    return NextResponse.redirect(destino, {
      status: 308,
      headers: { 'Cache-Control': CACHE },
    })
  } catch (erro) {
    console.error('[midia] falha ao resolver', caminho, erro)
    return new NextResponse('Erro ao resolver a imagem', { status: 502 })
  }
}
