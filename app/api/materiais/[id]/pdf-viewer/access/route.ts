import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import {
  expandPreviewPages,
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
      allowPreview: true,
    })

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const cachedPageCount = Number(access.material.pdfFile?.pageCount || 0)
    const totalPages = cachedPageCount > 0 ? cachedPageCount : 1

    // Configuração de capa / sumário / navegação definida pelo admin. Recorta as
    // páginas ao intervalo conhecido para nunca apontar para fora do documento.
    const viewerConfig = access.material.pdfViewerConfig || {}
    const clampPage = (page: any) => {
      const n = Math.floor(Number(page))
      if (!Number.isFinite(n) || n < 1) return null
      return totalPages > 1 ? Math.min(n, totalPages) : n
    }
    const summary = Array.isArray(viewerConfig.summary)
      ? viewerConfig.summary
          .map((item: any) => {
            const page = clampPage(item?.page)
            const title = String(item?.title || '').trim()
            if (!page || !title) return null
            return {
              id: String(item?.id || `${title}-${page}`),
              title,
              page,
              level: Math.min(2, Math.max(0, Math.floor(Number(item?.level) || 0))),
            }
          })
          .filter(Boolean)
      : []
    const navigation = Array.isArray(viewerConfig.navigation)
      ? viewerConfig.navigation
          .map((item: any) => {
            const page = clampPage(item?.page)
            const label = String(item?.label || '').trim()
            if (!page || !label) return null
            return { id: String(item?.id || `${label}-${page}`), label, page }
          })
          .filter(Boolean)
      : []
    let coverPage = clampPage(viewerConfig.coverPage) || undefined

    // Modo prévia: usuário sem acesso pleno vê apenas as páginas liberadas.
    // Recortamos os intervalos ao total real e enviamos a lista achatada para o
    // cliente restringir navegação/miniaturas. O bloqueio de verdade continua no
    // route /page (servidor); isto aqui é só para a UX não oferecer o proibido.
    const isPreview = access.accessLevel === 'preview'
    // Usa a contagem real (cachedPageCount); quando ainda desconhecida (0), não
    // recorta — o cliente ajusta ao descobrir o total ao renderizar as páginas.
    const previewPages = isPreview ? expandPreviewPages(access.previewRanges, cachedPageCount) : []
    const previewRanges = isPreview
      ? access.previewRanges
          .map((range) => ({
            start: cachedPageCount > 0 ? Math.min(range.start, cachedPageCount) : range.start,
            end: cachedPageCount > 0 ? Math.min(range.end, cachedPageCount) : range.end,
          }))
          .filter((range) => range.start <= range.end)
      : []

    // Na prévia, a capa/sumário/navegação só podem apontar para páginas liberadas.
    if (isPreview) {
      if (coverPage && !previewPages.includes(coverPage)) {
        coverPage = previewPages[0]
      }
    }
    const previewSummary = isPreview
      ? summary.filter((item: any) => previewPages.includes(item.page))
      : summary
    const previewNavigation = isPreview
      ? navigation.filter((item: any) => previewPages.includes(item.page))
      : navigation

    const now = new Date()
    const auditToken = crypto.randomUUID()

    access.db.collection('material_pdf_viewer_logs').insertOne({
      userId: session.userId,
      userName: session.name,
      userEmail: session.email,
      materialId: access.materialId,
      materialTitle: access.material.title,
      action: 'viewer_open',
      auditToken,
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      createdAt: now,
    }).catch((error) => console.error('[pdf-viewer/access] Falha ao logar abertura:', error))

    return NextResponse.json(
      {
        material: {
          id: access.materialId,
          title: access.material.title,
          pageCount: totalPages,
          viewerEnabled: access.material.pdfViewerEnabled === true,
          // Prévia nunca permite download do arquivo completo.
          downloadEnabled: isPreview ? false : access.material.pdfDownloadEnabled !== false,
        },
        audit: {
          openedAt: now.toISOString(),
        },
        viewer: {
          defaultMode: 'single',
          minZoom: 0.35,
          maxZoom: 2.8,
          coverPage,
          summary: previewSummary,
          navigation: previewNavigation,
        },
        // Presente apenas quando o usuário está em modo prévia (não comprou).
        preview: isPreview
          ? {
              active: true,
              pages: previewPages,
              ranges: previewRanges,
              totalPages,
            }
          : null,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    )
  } catch (error) {
    console.error('[pdf-viewer/access] Erro:', error)
    return NextResponse.json(
      { error: 'Nao foi possivel abrir o visualizador. Tente novamente.' },
      { status: 500 }
    )
  }
}
