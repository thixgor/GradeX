import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import {
  createWatermarkedSinglePagePdf,
  fetchMaterialPdfBytes,
  getClientIp,
  validateMaterialPdfAccess,
} from '@/lib/material-pdf-viewer'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const access = await validateMaterialPdfAccess(params.id, session, {
      requireViewerEnabled: true,
      requirePdf: true,
    })

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const pageParam = request.nextUrl.searchParams.get('page') || '1'
    const requestedPage = Number.parseInt(pageParam, 10)
    if (!Number.isFinite(requestedPage) || requestedPage < 1) {
      return NextResponse.json({ error: 'Pagina invalida' }, { status: 400 })
    }

    const cachedPageCount = Number(access.material.pdfFile?.pageCount || 0)
    if (cachedPageCount > 0 && requestedPage > cachedPageCount) {
      return NextResponse.json({ error: 'Pagina fora do intervalo' }, { status: 400 })
    }

    const viewedAt = new Date()
    // Token determinístico por (user, material, page, janela de 5min).
    // Antes era randomUUID() em cada call — isso impedia qualquer cache,
    // mesmo quando o mesmo usuário virava página pra trás e voltava.
    // Agora a resposta é estável dentro da janela e o browser/CDN
    // consegue reutilizar via Cache-Control abaixo (private, max-age=300).
    const cacheWindow = Math.floor(viewedAt.getTime() / (5 * 60 * 1000))
    const auditToken = `${session.userId.slice(-8)}-${access.materialId.slice(-8)}-${requestedPage}-${cacheWindow}`
    const pdfBytes = await fetchMaterialPdfBytes(access.material.pdfFile.blobUrl)
    const pagePdf = await createWatermarkedSinglePagePdf(pdfBytes, {
      pageNumber: requestedPage,
      userName: access.user?.name || session.name || 'Usuario DomineAqui',
      userEmail: access.user?.email || session.email || 'email nao informado',
      userId: session.userId,
      materialId: access.materialId,
      materialTitle: access.material.title || 'Material DomineAqui',
      viewedAt,
      auditToken,
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
      userId: session.userId,
      userName: session.name,
      userEmail: session.email,
      materialId: access.materialId,
      materialTitle: access.material.title,
      action: 'page_render',
      pageNumber: requestedPage,
      auditToken,
      ip: getClientIp(request),
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
