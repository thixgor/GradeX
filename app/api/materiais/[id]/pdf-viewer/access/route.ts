import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import {
  fetchMaterialPdfBytes,
  getClientIp,
  getPdfPageCount,
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

    const cachedPageCount = Number(access.material.pdfFile?.pageCount || 0)
    let totalPages = cachedPageCount > 0 ? cachedPageCount : 0

    if (!totalPages) {
      const pdfBytes = await fetchMaterialPdfBytes(access.material.pdfFile.blobUrl)
      totalPages = await getPdfPageCount(pdfBytes)
      await access.db.collection('materials').updateOne(
        { _id: new ObjectId(access.materialId) },
        { $set: { 'pdfFile.pageCount': totalPages, updatedAt: new Date() } }
      )
    }

    const now = new Date()
    const auditToken = crypto.randomUUID()

    await access.db.collection('material_pdf_viewer_logs').insertOne({
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
    })

    return NextResponse.json(
      {
        material: {
          id: access.materialId,
          title: access.material.title,
          pageCount: totalPages,
          viewerEnabled: access.material.pdfViewerEnabled === true,
          downloadEnabled: access.material.pdfDownloadEnabled !== false,
        },
        audit: {
          openedAt: now.toISOString(),
        },
        viewer: {
          defaultMode: 'continuous',
          minZoom: 0.55,
          maxZoom: 2.6,
        },
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
