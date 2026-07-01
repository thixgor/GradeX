import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { checkRateLimitSync } from '@/lib/api-security'
import {
  createWatermarkedSinglePagePdf,
  fetchMaterialPdfBytes,
  getClientIp,
  guestFingerprint,
  isPreviewPageAllowed,
  validateMaterialPdfAccess,
} from '@/lib/material-pdf-viewer'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Esta rota é a mais cara em CPU do app (parse + copyPages + watermark por
// página). Agora aceita visitante (sem login) para a prévia, então o limite
// por IP é a única barreira contra flood — sem ele, um script anônimo
// derrubaria a instância só de request. O teto geral fica folgado o
// suficiente para não travar leitores legítimos em modo contínuo (várias
// páginas carregam de uma vez); o teto de visitante é bem mais apertado.
const PAGE_RATE_LIMIT_IP = { limit: 90, windowMs: 60_000 }
const PAGE_RATE_LIMIT_GUEST = { limit: 24, windowMs: 60_000 }

function rateLimitedPdfResponse(retryAfterMs: number) {
  const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000))
  return NextResponse.json(
    { error: 'Muitas paginas carregadas em pouco tempo. Aguarde um instante.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ip = getClientIp(request)
    const generalLimit = checkRateLimitSync(ip, 'pdf-viewer-page', PAGE_RATE_LIMIT_IP)
    if (!generalLimit.success) {
      return rateLimitedPdfResponse(generalLimit.retryAfterMs || 60_000)
    }

    const session = await getSession()

    if (!session) {
      const guestLimit = checkRateLimitSync(ip, 'pdf-viewer-page-guest', PAGE_RATE_LIMIT_GUEST)
      if (!guestLimit.success) {
        return rateLimitedPdfResponse(guestLimit.retryAfterMs || 60_000)
      }
    }

    const access = await validateMaterialPdfAccess(params.id, session, {
      requireViewerEnabled: true,
      requirePdf: true,
      allowPreview: true,
    })

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const pageParam = request.nextUrl.searchParams.get('page') || '1'
    const requestedPage = Number.parseInt(pageParam, 10)
    if (!Number.isFinite(requestedPage) || requestedPage < 1) {
      return NextResponse.json({ error: 'Pagina invalida' }, { status: 400 })
    }

    // SEGURANÇA: quem está no modo prévia (não comprou) só pode buscar os bytes
    // das páginas liberadas pelo admin. Qualquer outra página é bloqueada AQUI,
    // no servidor — não há como burlar pelo cliente/viewer, pois o PDF nunca é
    // enviado por inteiro; cada página é uma requisição separada.
    if (access.accessLevel === 'preview' && !isPreviewPageAllowed(requestedPage, access.previewRanges)) {
      return NextResponse.json(
        { error: 'Esta pagina nao esta disponivel na previa. Adquira o material para acessar o conteudo completo.' },
        { status: 403 }
      )
    }

    const cachedPageCount = Number(access.material.pdfFile?.pageCount || 0)
    if (cachedPageCount > 0 && requestedPage > cachedPageCount) {
      return NextResponse.json({ error: 'Pagina fora do intervalo' }, { status: 400 })
    }

    const viewedAt = new Date()
    // Visitante (sem login) não tem userId — usa um fingerprint estável de
    // IP+User-Agent no lugar, tanto para o token/cache quanto pro watermark.
    const identityId = session ? session.userId.slice(-8) : guestFingerprint(ip, request.headers.get('user-agent') || 'unknown')
    // Token determinístico por (user, material, page, janela de 5min).
    // Antes era randomUUID() em cada call — isso impedia qualquer cache,
    // mesmo quando o mesmo usuário virava página pra trás e voltava.
    // Agora a resposta é estável dentro da janela e o browser/CDN
    // consegue reutilizar via Cache-Control abaixo (private, max-age=300).
    const cacheWindow = Math.floor(viewedAt.getTime() / (5 * 60 * 1000))
    const auditToken = `${identityId}-${access.materialId.slice(-8)}-${requestedPage}-${cacheWindow}`
    const pdfBytes = await fetchMaterialPdfBytes(access.material.pdfFile.blobUrl)
    const pagePdf = await createWatermarkedSinglePagePdf(pdfBytes, {
      pageNumber: requestedPage,
      userName: session ? (access.user?.name || session.name || 'Usuario DomineAqui') : 'Visitante (previa gratuita)',
      userEmail: session ? (access.user?.email || session.email || 'email nao informado') : `previa-${identityId}`,
      userId: session ? session.userId : identityId,
      materialId: access.materialId,
      materialTitle: access.material.title || 'Material DomineAqui',
      viewedAt,
      auditToken,
      sourceCacheKey: access.material.pdfFile.blobUrl,
    })

    if (requestedPage > pagePdf.totalPages) {
      return NextResponse.json({ error: 'Pagina fora do intervalo' }, { status: 400 })
    }

    if (!cachedPageCount && pagePdf.totalPages > 0) {
      access.db.collection('materials').updateOne(
        { _id: new ObjectId(access.materialId) },
        { $set: { 'pdfFile.pageCount': pagePdf.totalPages, updatedAt: new Date() } }
      ).catch((error) => console.error('[pdf-viewer/page] Falha ao salvar pageCount:', error))
    }

    access.db.collection('material_pdf_viewer_logs').insertOne({
      userId: session?.userId || null,
      userName: session?.name || 'Visitante (sem login)',
      userEmail: session?.email || null,
      isGuest: !session,
      materialId: access.materialId,
      materialTitle: access.material.title,
      action: 'page_render',
      pageNumber: requestedPage,
      auditToken,
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      createdAt: viewedAt,
    }).catch((error) => console.error('[pdf-viewer/page] Falha ao logar pagina:', error))

    return new NextResponse(Buffer.from(pagePdf.bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="domineaqui-page-${requestedPage}.pdf"`,
        'Content-Length': String(pagePdf.bytes.byteLength),
        // Cache privado de 5min — uma sessão de leitura de PDF acessa
        // a mesma página várias vezes (zoom/scroll/page-flip). Antes:
        // cada interação chamava a função. Agora: 1 render por janela.
        // O auditToken acima é alinhado à mesma janela, então o conteúdo
        // permanece consistente dentro do TTL.
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=60',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
        'X-DomineAqui-Page-Count': String(pagePdf.totalPages),
      },
    })
  } catch (error) {
    console.error('[pdf-viewer/page] Erro:', error)
    return NextResponse.json(
      { error: 'Nao foi possivel carregar esta pagina do PDF.' },
      { status: 500 }
    )
  }
}
