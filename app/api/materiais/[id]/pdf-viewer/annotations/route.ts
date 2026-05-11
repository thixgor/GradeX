import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { validateMaterialPdfAccess } from '@/lib/material-pdf-viewer'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = new Set(['highlight', 'note', 'drawing', 'bookmark', 'text'])

function normalizeAnnotationBody(body: any) {
  const type = typeof body.type === 'string' ? body.type : 'note'
  const pageNumber = Number.parseInt(String(body.pageNumber || '1'), 10)

  return {
    pageNumber: Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1,
    type: ALLOWED_TYPES.has(type) ? type : 'note',
    position: body.position && typeof body.position === 'object' ? body.position : {},
    content: typeof body.content === 'string' ? body.content.slice(0, 4000) : '',
    color: typeof body.color === 'string' ? body.color.slice(0, 40) : '#10b981',
    data: body.data && typeof body.data === 'object' ? body.data : {},
  }
}

async function getAccess(params: { id: string }) {
  const session = await getSession()
  if (!session) return { session: null, response: NextResponse.json({ error: 'Nao autenticado' }, { status: 401 }) }

  const access = await validateMaterialPdfAccess(params.id, session, {
    requireViewerEnabled: true,
    requirePdf: true,
  })

  if (!access.ok) {
    return {
      session,
      response: NextResponse.json({ error: access.error }, { status: access.status }),
    }
  }

  return { session, access }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getAccess(params)
    if ('response' in result) return result.response

    const annotations = await result.access.db
      .collection('material_pdf_annotations')
      .find({ userId: result.session!.userId, materialId: result.access.materialId })
      .sort({ pageNumber: 1, updatedAt: -1 })
      .toArray()

    return NextResponse.json({
      annotations: annotations.map((annotation: any) => ({
        ...annotation,
        _id: String(annotation._id),
        id: String(annotation._id),
      })),
    }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, private' },
    })
  } catch (error) {
    console.error('[pdf-viewer/annotations] GET erro:', error)
    return NextResponse.json({ error: 'Erro ao listar anotacoes' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getAccess(params)
    if ('response' in result) return result.response

    const body = await request.json().catch(() => ({}))
    const now = new Date()
    const annotation = {
      ...normalizeAnnotationBody(body),
      userId: result.session!.userId,
      materialId: result.access.materialId,
      createdAt: now,
      updatedAt: now,
    }

    const inserted = await result.access.db.collection('material_pdf_annotations').insertOne(annotation)

    return NextResponse.json({
      annotation: {
        ...annotation,
        _id: String(inserted.insertedId),
        id: String(inserted.insertedId),
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[pdf-viewer/annotations] POST erro:', error)
    return NextResponse.json({ error: 'Erro ao criar anotacao' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getAccess(params)
    if ('response' in result) return result.response

    const body = await request.json().catch(() => ({}))
    const annotationId = String(body.id || body._id || '')
    if (!ObjectId.isValid(annotationId)) {
      return NextResponse.json({ error: 'ID da anotacao invalido' }, { status: 400 })
    }

    const update = {
      ...normalizeAnnotationBody(body),
      updatedAt: new Date(),
    }

    const updated = await result.access.db.collection('material_pdf_annotations').findOneAndUpdate(
      {
        _id: new ObjectId(annotationId),
        userId: result.session!.userId,
        materialId: result.access.materialId,
      },
      { $set: update },
      { returnDocument: 'after' }
    )

    if (!updated) {
      return NextResponse.json({ error: 'Anotacao nao encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      annotation: {
        ...updated,
        _id: String(updated._id),
        id: String(updated._id),
      },
    })
  } catch (error) {
    console.error('[pdf-viewer/annotations] PATCH erro:', error)
    return NextResponse.json({ error: 'Erro ao atualizar anotacao' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getAccess(params)
    if ('response' in result) return result.response

    const annotationId = request.nextUrl.searchParams.get('id')
    const deleteAll = request.nextUrl.searchParams.get('all') === 'true'

    if (deleteAll) {
      const deleted = await result.access.db.collection('material_pdf_annotations').deleteMany({
        userId: result.session!.userId,
        materialId: result.access.materialId,
      })
      return NextResponse.json({ success: true, deletedCount: deleted.deletedCount })
    }

    if (!annotationId || !ObjectId.isValid(annotationId)) {
      return NextResponse.json({ error: 'ID da anotacao invalido' }, { status: 400 })
    }

    const deleted = await result.access.db.collection('material_pdf_annotations').deleteOne({
      _id: new ObjectId(annotationId),
      userId: result.session!.userId,
      materialId: result.access.materialId,
    })

    if (!deleted.deletedCount) {
      return NextResponse.json({ error: 'Anotacao nao encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[pdf-viewer/annotations] DELETE erro:', error)
    return NextResponse.json({ error: 'Erro ao deletar anotacao' }, { status: 500 })
  }
}
