import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { checkRateLimitSync } from '@/lib/api-security'
import {
  getClientIp,
  isPreviewPageAllowed,
  validateMaterialPdfAccess,
} from '@/lib/material-pdf-viewer'
import { responderPaginaMarcada } from '@/lib/material-pdf-leitura'

export const dynamic = 'force-dynamic'

/**
 * Miniaturas do painel lateral do leitor de materiais.
 *
 * ## A miniatura é a página marcada
 *
 * Esta rota já devolveu a página NUA, com a justificativa de que a marca
 * d'água é ilegível a 150 px. Só que o que saía daqui não era uma imagem de
 * 150 px: era o PDF da página inteira, em resolução total, sem marca e sem
 * registro de auditoria. Quem tinha acesso ao material podia pedir
 * `?page=1…N` e baixar o livro limpo, o que anulava a proteção da leitura.
 *
 * Agora ela entrega exatamente o que `../page` entrega (ver
 * `lib/material-pdf-leitura.ts`): a página marcada com os dados de quem pediu,
 * com log. Sendo a mesma página, o leitor reaproveita os bytes nos dois
 * sentidos, e a página que aparece no leitor e no painel é baixada uma vez só.
 *
 * ## O que continua separado
 *
 * O limite por IP é mais folgado que o da leitura, porque o painel pede várias
 * miniaturas de uma vez ao rolar. A autorização é a mesma, na mesma ordem:
 * sessão, `validateMaterialPdfAccess` e, para quem está na prévia, o bloqueio
 * por faixa de páginas liberadas.
 */

const THUMB_RATE_LIMIT_IP = { limit: 180, windowMs: 60_000 }
const THUMB_RATE_LIMIT_GUEST = { limit: 48, windowMs: 60_000 }

function rateLimited(retryAfterMs: number) {
  const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000))
  return NextResponse.json(
    { error: 'Muitas miniaturas carregadas em pouco tempo. Aguarde um instante.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ip = getClientIp(request)
    const geral = checkRateLimitSync(ip, 'pdf-viewer-thumb', THUMB_RATE_LIMIT_IP)
    if (!geral.success) return rateLimited(geral.retryAfterMs || 60_000)

    const session = await getSession()
    if (!session) {
      const visitante = checkRateLimitSync(ip, 'pdf-viewer-thumb-guest', THUMB_RATE_LIMIT_GUEST)
      if (!visitante.success) return rateLimited(visitante.retryAfterMs || 60_000)
    }

    const access = await validateMaterialPdfAccess(params.id, session, {
      requireViewerEnabled: true,
      requirePdf: true,
      allowPreview: true,
    })
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const requestedPage = Number.parseInt(request.nextUrl.searchParams.get('page') || '1', 10)
    if (!Number.isFinite(requestedPage) || requestedPage < 1) {
      return NextResponse.json({ error: 'Pagina invalida' }, { status: 400 })
    }

    // Mesma trava da rota de leitura: na prévia, só as faixas que o admin
    // liberou. Sem isto, a miniatura mostraria em 150 px o que a leitura
    // recusa em tamanho cheio.
    if (access.accessLevel === 'preview' && !isPreviewPageAllowed(requestedPage, access.previewRanges)) {
      return NextResponse.json(
        { error: 'Esta pagina nao esta disponivel na previa.' },
        { status: 403 }
      )
    }

    const cachedPageCount = Number(access.material.pdfFile?.pageCount || 0)
    if (cachedPageCount > 0 && requestedPage > cachedPageCount) {
      return NextResponse.json({ error: 'Pagina fora do intervalo' }, { status: 400 })
    }

    return await responderPaginaMarcada({
      request,
      session,
      access,
      ip,
      pagina: requestedPage,
      origem: 'miniatura',
    })
  } catch (error) {
    console.error('[pdf-viewer/thumb] Erro:', error)
    return NextResponse.json(
      { error: 'Nao foi possivel carregar esta miniatura.' },
      { status: 500 }
    )
  }
}
