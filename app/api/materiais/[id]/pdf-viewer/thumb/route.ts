import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { checkRateLimitSync } from '@/lib/api-security'
import {
  extractRawSinglePagePdf,
  fetchMaterialPdfBytes,
  getClientIp,
  isPreviewPageAllowed,
  validateMaterialPdfAccess,
} from '@/lib/material-pdf-viewer'
import {
  buscarPaginaDerivada,
  fonteDoPdf,
  gravarPaginaDerivada,
} from '@/lib/material-pdf-pages'

export const dynamic = 'force-dynamic'

/**
 * Miniaturas do painel lateral do leitor de materiais.
 *
 * ## Por que esta rota existe separada de `../page`
 *
 * O painel abre ligado por padrão no desktop e desenha miniaturas de 150 px de
 * largura. Até aqui elas chamavam `/pdf-viewer/page` — a rota mais cara do app.
 * Cada quadradinho de 150 px custava: parse do pdf-lib, composição da marca
 * d'água, geração do QR de auditoria, uma escrita no Mongo e uma resposta
 * única por usuário, de algumas centenas de KB, que nenhum cache podia
 * reaproveitar. A marca d'água que justificava tudo isso é ilegível no tamanho
 * em que a miniatura é exibida.
 *
 * Esta rota devolve a mesma página **nua**. Como ela não depende de quem pediu,
 * é imutável dentro de uma versão do material: o navegador guarda por um dia e
 * reusa em cada volta ao painel, em vez de refazer a rodada inteira.
 *
 * ## O que NÃO muda
 *
 * A autorização é a mesma, na mesma ordem: sessão, `validateMaterialPdfAccess`
 * e, para quem está na prévia, o bloqueio por faixa de páginas liberadas. Uma
 * página que a pessoa não pode ver continua devolvendo 403 aqui — a miniatura
 * não é uma porta lateral para o conteúdo.
 *
 * O caminho de leitura segue intocado: `/pdf-viewer/page` continua marcando
 * cada página com nome, e-mail, horário e QR, e continua registrando o acesso.
 * Só a miniatura deixou de pagar por um carimbo que ninguém consegue ler.
 */

// Mais folgado que o da leitura: o painel preenche vários quadradinhos ao
// rolar, e cada um é bem mais barato do que uma página marcada. Continua
// existindo como barreira contra varredura automatizada do acervo.
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

    const fonte = fonteDoPdf(access.material.pdfFile)

    // A versão do material entra na etiqueta: reenviar o arquivo muda `fonte.chave`
    // e, com ela, o ETag — nenhum navegador continua mostrando a miniatura antiga.
    const etag = `W/"thumb-${fonte?.chave || access.materialId}-${requestedPage}"`
    if (request.headers.get('if-none-match') === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: etag, 'Cache-Control': 'private, max-age=86400' },
      })
    }

    const pagina = await extractRawSinglePagePdf({
      knownTotalPages: cachedPageCount,
      loadSlice: fonte ? () => buscarPaginaDerivada(fonte, requestedPage) : undefined,
      loadFull: () => fetchMaterialPdfBytes(access.material.pdfFile.blobUrl),
      onSliceReady: fonte
        ? (p, bytes) => gravarPaginaDerivada(fonte, p, bytes)
        : undefined,
    }, {
      pageNumber: requestedPage,
      sourceCacheKey: fonte?.chave || access.material.pdfFile.blobUrl,
    })

    if (requestedPage > pagina.totalPages) {
      return NextResponse.json({ error: 'Pagina fora do intervalo' }, { status: 400 })
    }

    return new NextResponse(Buffer.from(pagina.bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(pagina.bytes.byteLength),
        // Um dia de cache no navegador, com uma semana de tolerância. A página
        // nua não muda enquanto o material for o mesmo, e o ETag acima cobre o
        // caso em que muda. `private` porque a autorização acima é por pessoa:
        // a resposta não pode ficar num cache compartilhado.
        'Cache-Control': 'private, max-age=86400, stale-while-revalidate=604800',
        ETag: etag,
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
        'X-DomineAqui-Page-Count': String(pagina.totalPages),
      },
    })
  } catch (error) {
    console.error('[pdf-viewer/thumb] Erro:', error)
    return NextResponse.json(
      { error: 'Nao foi possivel carregar esta miniatura.' },
      { status: 500 }
    )
  }
}
