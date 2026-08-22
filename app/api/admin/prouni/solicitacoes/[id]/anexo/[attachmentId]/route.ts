import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  PROUNI_ALLOWED_CONTENT_TYPES,
  PROUNI_REQUESTS_COLLECTION,
  type ProuniRequest,
} from '@/lib/prouni-fies'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Leitura de um comprovante pelo admin.
 *
 * O arquivo mora no Blob com acesso privado e é buscado aqui com a credencial
 * do servidor. A URL do Blob nunca chega ao navegador — nem para o admin: uma
 * URL que abre sozinha é uma URL que vaza em histórico, em print, em
 * compartilhamento de tela, e continua abrindo depois que a pessoa deixou de
 * ser admin.
 *
 * Cabeçalhos defensivos porque o conteúdo é de terceiro:
 *
 * - `Content-Type` sai da lista de aceitos e do que está gravado, não do que o
 *   Blob devolve — nada é servido como HTML a partir daqui;
 * - `nosniff` impede o navegador de "descobrir" outro tipo;
 * - CSP `sandbox` neutraliza script em PDF (PDF executa JavaScript);
 * - `no-store` mantém documento pessoal fora do cache do navegador e de
 *   qualquer proxy no caminho.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const rl = await checkRateLimit(session.userId, 'prouni_anexo_admin', 120, 60_000)
  if (!rl.success) return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })

  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: 'Solicitação inválida' }, { status: 400 })
  }

  try {
    const db = await getDb()
    const solicitacao = await db.collection<ProuniRequest>(PROUNI_REQUESTS_COLLECTION).findOne({
      _id: new ObjectId(params.id) as any,
    })
    if (!solicitacao) return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })

    const anexo = (solicitacao.attachments || []).find((file) => file.id === params.attachmentId)
    if (!anexo) {
      return NextResponse.json(
        { error: solicitacao.attachmentsPurgedAt ? 'Os arquivos desta solicitação já foram apagados.' : 'Anexo não encontrado' },
        { status: 404 }
      )
    }

    const contentType = (PROUNI_ALLOWED_CONTENT_TYPES as readonly string[]).includes(anexo.contentType)
      ? anexo.contentType
      : 'application/octet-stream'

    const token = process.env.BLOB_READ_WRITE_TOKEN
    const resposta = await fetch(anexo.blobUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: 'no-store',
    })
    if (!resposta.ok || !resposta.body) {
      console.warn('[admin/prouni/anexo] blob indisponível:', resposta.status)
      return NextResponse.json({ error: 'Arquivo indisponível' }, { status: 404 })
    }

    return new NextResponse(resposta.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${anexo.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}"`,
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    })
  } catch (error) {
    console.error('[admin/prouni/anexo] erro:', error)
    return NextResponse.json({ error: 'Erro ao abrir anexo' }, { status: 500 })
  }
}
