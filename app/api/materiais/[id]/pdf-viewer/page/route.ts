import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import {
  createWatermarkedSinglePagePdf,
  fetchMaterialPdfBytes,
  getClientIp,
  validateMaterialPdfAccess,
} from '@/lib/material-pdf-viewer'

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

    const viewedAt = new Date()
    const auditToken = crypto.randomUUID()
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
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
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
