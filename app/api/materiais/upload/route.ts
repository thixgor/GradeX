/**
 * API de upload de PDF para materiais.
 *
 * Usa Edge runtime + Vercel Blob server-side para evitar problemas de CORS.
 * O browser envia o arquivo diretamente para esta rota via multipart/form-data,
 * e o servidor faz o put() no Vercel Blob internamente.
 *
 * Edge runtime não tem limite de body size (diferente dos 4.5 MB do serverless).
 *
 * GET    /api/materiais/upload?materialId=xxx  → info do PDF atual (admin)
 * POST   /api/materiais/upload                 → recebe arquivo + salva no Blob
 * DELETE /api/materiais/upload?materialId=xxx  → remove PDF do material
 */

import { NextRequest, NextResponse } from 'next/server'
import { put, del } from '@vercel/blob'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { isValidObjectId } from '@/lib/api-security'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

function getMaxUploadBytes(): number {
  const envMb = parseInt(process.env.MATERIAL_UPLOAD_MAX_MB || '100', 10)
  const mb = isNaN(envMb) || envMb <= 0 ? 100 : Math.min(envMb, 500)
  return mb * 1024 * 1024
}

// ─── GET: Info do PDF atual de um material (admin) ────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const materialId = request.nextUrl.searchParams.get('materialId')
    if (!materialId || !isValidObjectId(materialId)) {
      return NextResponse.json({ error: 'materialId inválido' }, { status: 400 })
    }

    const db = await getDb()
    const material = await db.collection('materials').findOne(
      { _id: new ObjectId(materialId) },
      { projection: { pdfFile: 1, title: 1 } }
    )

    if (!material) {
      return NextResponse.json({ error: 'Material não encontrado' }, { status: 404 })
    }

    if (!material.pdfFile) {
      return NextResponse.json({ hasPdf: false })
    }

    return NextResponse.json({
      hasPdf: true,
      pdfFile: {
        originalFilename: material.pdfFile.originalFilename,
        sizeBytes: material.pdfFile.sizeBytes,
        uploadedBy: material.pdfFile.uploadedByName,
        uploadedAt: material.pdfFile.uploadedAt,
      },
    })
  } catch (error) {
    console.error('[pdf-upload] GET error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ─── POST: Recebe o arquivo e faz upload ao Vercel Blob server-side ───────────

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const materialId = formData.get('materialId') as string | null

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
    }
    if (!materialId || !isValidObjectId(materialId)) {
      return NextResponse.json({ error: 'materialId inválido' }, { status: 400 })
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Apenas PDFs são permitidos' }, { status: 400 })
    }

    const maxBytes = getMaxUploadBytes()
    if (file.size > maxBytes) {
      const maxMb = Math.round(maxBytes / 1024 / 1024)
      return NextResponse.json({ error: `Arquivo muito grande. Máximo: ${maxMb} MB.` }, { status: 400 })
    }

    const db = await getDb()
    const exists = await db.collection('materials').findOne(
      { _id: new ObjectId(materialId) },
      { projection: { _id: 1, pdfFile: 1 } }
    )
    if (!exists) {
      return NextResponse.json({ error: 'Material não encontrado' }, { status: 404 })
    }

    const pathname = `material-originals/${materialId}/${Date.now()}-${crypto.randomUUID()}.pdf`

    const blob = await put(pathname, file, {
      access: 'private',
      addRandomSuffix: false,
      contentType: 'application/pdf',
    })

    // Remove blob anterior se existia
    if (exists.pdfFile?.blobUrl) {
      try {
        await del(exists.pdfFile.blobUrl)
      } catch (e) {
        console.warn('[pdf-upload] Falha ao remover blob anterior:', e)
      }
    }

    await db.collection('materials').updateOne(
      { _id: new ObjectId(materialId) },
      {
        $set: {
          pdfFile: {
            blobPathname: blob.pathname,
            blobUrl: blob.url,
            originalFilename: file.name,
            sizeBytes: file.size,
            uploadedBy: session.userId,
            uploadedByName: session.name,
            uploadedAt: new Date(),
          },
          updatedAt: new Date(),
        },
      }
    )

    await db.collection('audit_logs').insertOne({
      action: 'material_pdf_upload',
      adminId: session.userId,
      adminName: session.name,
      materialId,
      blobPathname: blob.pathname,
      sizeBytes: file.size,
      createdAt: new Date(),
    })

    console.log(`[pdf-upload] PDF salvo: material=${materialId} size=${file.size} pathname=${blob.pathname}`)

    return NextResponse.json({ success: true, url: blob.url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno no upload'
    console.error('[pdf-upload] POST error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ─── DELETE: Remover PDF de um material ──────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const materialId = request.nextUrl.searchParams.get('materialId')
    if (!materialId || !isValidObjectId(materialId)) {
      return NextResponse.json({ error: 'materialId inválido' }, { status: 400 })
    }

    const db = await getDb()
    const material = await db.collection('materials').findOne(
      { _id: new ObjectId(materialId) },
      { projection: { pdfFile: 1, title: 1 } }
    )

    if (!material) {
      return NextResponse.json({ error: 'Material não encontrado' }, { status: 404 })
    }

    if (!material.pdfFile?.blobUrl) {
      return NextResponse.json({ error: 'Este material não possui PDF interno' }, { status: 404 })
    }

    try {
      await del(material.pdfFile.blobUrl)
    } catch (e) {
      console.warn('[pdf-upload] Falha ao deletar blob:', e)
    }

    await db.collection('materials').updateOne(
      { _id: new ObjectId(materialId) },
      { $unset: { pdfFile: '' }, $set: { updatedAt: new Date() } }
    )

    await db.collection('audit_logs').insertOne({
      action: 'material_pdf_delete',
      adminId: session.userId,
      adminName: session.name,
      materialId,
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[pdf-upload] DELETE error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
