/**
 * Upload de PDF/HTML para um ITEM COMPLEMENTAR avulso (não um material).
 *
 * Espelha `app/api/materiais/upload/route.ts` e `.../html-upload/route.ts`
 * (mesmo padrão de client-side upload do Vercel Blob), mas o arquivo é
 * anexado a um elemento específico de `material.complementaryItems` em vez
 * do material inteiro — permite anexar PDF/HTML a um "Você também leva…"
 * sem precisar criar um material avulso.
 *
 * Pré-requisito: o item precisa já existir no array `complementaryItems` do
 * material (ou seja, o admin salvou o material com o item criado) antes de
 * poder subir o arquivo — mesmo padrão de "salve primeiro" usado no PDF/HTML
 * do material.
 *
 * GET    ?materialId=&itemId=&fileKind=pdf|html   → info do arquivo atual
 * POST   { fileKind }                             → gera token de upload
 * PUT                                              → confirma upload e grava metadados
 * DELETE ?materialId=&itemId=&fileKind=pdf|html   → remove o arquivo do item
 */

import { NextRequest, NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { isValidObjectId } from '@/lib/api-security'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

type FileKind = 'pdf' | 'html'

function isFileKind(v: any): v is FileKind {
  return v === 'pdf' || v === 'html'
}

function getMaxUploadBytes(fileKind: FileKind): number {
  if (fileKind === 'pdf') {
    const envMb = parseInt(process.env.MATERIAL_UPLOAD_MAX_MB || '100', 10)
    const mb = isNaN(envMb) || envMb <= 0 ? 100 : Math.min(envMb, 2048)
    return mb * 1024 * 1024
  }
  const envMb = parseInt(process.env.MATERIAL_HTML_UPLOAD_MAX_MB || '25', 10)
  const mb = isNaN(envMb) || envMb <= 0 ? 25 : Math.min(envMb, 100)
  return mb * 1024 * 1024
}

function blobPrefixFor(materialId: string, itemId: string): string {
  return `material-complementary/${materialId}/${itemId}/`
}

async function findItem(db: any, materialId: string, itemId: string) {
  const material = await db.collection('materials').findOne(
    { _id: new ObjectId(materialId) },
    { projection: { complementaryItems: 1 } }
  )
  if (!material) return { material: null, item: null }
  const item = (material.complementaryItems || []).find((it: any) => String(it.id) === itemId)
  return { material, item: item || null }
}

// ─── GET: Info do arquivo atual de um item (admin) ─────────────────────────

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const materialId = request.nextUrl.searchParams.get('materialId') || ''
    const itemId = request.nextUrl.searchParams.get('itemId') || ''
    const fileKind = request.nextUrl.searchParams.get('fileKind')
    if (!materialId || !isValidObjectId(materialId) || !itemId || !isFileKind(fileKind)) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
    }

    const db = await getDb()
    const { item } = await findItem(db, materialId, itemId)
    if (!item) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
    }

    const file = fileKind === 'pdf' ? item.pdfFile : item.htmlFile
    if (!file) {
      return NextResponse.json({ hasFile: false })
    }

    return NextResponse.json({
      hasFile: true,
      file: {
        originalFilename: file.originalFilename,
        sizeBytes: file.sizeBytes,
        uploadedByName: file.uploadedByName,
        uploadedAt: file.uploadedAt,
      },
    })
  } catch (error) {
    console.error('[complementary-upload] GET error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ─── POST: Gera o token de autorização para upload client-side ─────────────

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = (await request.json()) as HandleUploadBody

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
          throw new Error('Não autorizado')
        }

        let materialId = ''
        let itemId = ''
        let fileKind: FileKind = 'pdf'
        try {
          const payload = JSON.parse(clientPayload || '{}')
          materialId = payload.materialId || ''
          itemId = payload.itemId || ''
          fileKind = payload.fileKind
        } catch {
          throw new Error('Payload inválido')
        }
        if (!materialId || !isValidObjectId(materialId)) throw new Error('materialId inválido')
        if (!itemId) throw new Error('itemId inválido')
        if (!isFileKind(fileKind)) throw new Error('fileKind inválido')

        if (!pathname.startsWith(blobPrefixFor(materialId, itemId))) {
          throw new Error('Caminho de upload inválido')
        }

        const db = await getDb()
        const { item } = await findItem(db, materialId, itemId)
        if (!item) {
          throw new Error('Item complementar não encontrado — salve o material primeiro')
        }

        return {
          access: 'private',
          addRandomSuffix: false,
          allowedContentTypes: [fileKind === 'pdf' ? 'application/pdf' : 'text/html'],
          maximumSizeInBytes: getMaxUploadBytes(fileKind),
          tokenPayload: JSON.stringify({ materialId, itemId, fileKind, userId: session.userId, userName: session.name }),
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao autorizar upload'
    console.error('[complementary-upload] POST error:', error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

// ─── PUT: Confirma o upload e grava os metadados no item ───────────────────

export async function PUT(request: NextRequest): Promise<Response> {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const payload = await request.json().catch(() => null)
    const materialId = payload?.materialId as string | undefined
    const itemId = payload?.itemId as string | undefined
    const fileKind = payload?.fileKind as string | undefined
    const blobUrl = payload?.blobUrl as string | undefined
    const blobPathname = payload?.blobPathname as string | undefined
    const originalFilename = (payload?.originalFilename as string | undefined) || (fileKind === 'pdf' ? 'arquivo.pdf' : 'index.html')
    const sizeBytes = Number(payload?.sizeBytes) || 0

    if (!materialId || !isValidObjectId(materialId) || !itemId || !isFileKind(fileKind)) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
    }
    if (!blobUrl || !blobPathname) {
      return NextResponse.json({ error: 'Dados do blob ausentes' }, { status: 400 })
    }
    if (!blobPathname.startsWith(blobPrefixFor(materialId, itemId))) {
      return NextResponse.json({ error: 'Caminho de blob inválido' }, { status: 400 })
    }

    const db = await getDb()
    const { item } = await findItem(db, materialId, itemId)
    if (!item) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
    }

    const fieldName = fileKind === 'pdf' ? 'pdfFile' : 'htmlFile'
    const previous = fileKind === 'pdf' ? item.pdfFile : item.htmlFile
    if (previous?.blobUrl && previous.blobUrl !== blobUrl) {
      try {
        await del(previous.blobUrl)
      } catch (e) {
        console.warn('[complementary-upload] Falha ao remover blob anterior:', e)
      }
    }

    await db.collection('materials').updateOne(
      { _id: new ObjectId(materialId), 'complementaryItems.id': itemId },
      {
        $set: {
          [`complementaryItems.$.${fieldName}`]: {
            blobPathname,
            blobUrl,
            originalFilename,
            sizeBytes,
            uploadedBy: session.userId,
            uploadedByName: session.name,
            uploadedAt: new Date(),
          },
          updatedAt: new Date(),
        },
      }
    )

    await db.collection('audit_logs').insertOne({
      action: 'material_complementary_upload',
      adminId: session.userId,
      adminName: session.name,
      materialId,
      itemId,
      fileKind,
      blobPathname,
      sizeBytes,
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao confirmar upload'
    console.error('[complementary-upload] PUT error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ─── DELETE: Remove o arquivo de um item ────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const materialId = request.nextUrl.searchParams.get('materialId') || ''
    const itemId = request.nextUrl.searchParams.get('itemId') || ''
    const fileKind = request.nextUrl.searchParams.get('fileKind')
    if (!materialId || !isValidObjectId(materialId) || !itemId || !isFileKind(fileKind)) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
    }

    const db = await getDb()
    const { item } = await findItem(db, materialId, itemId)
    if (!item) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
    }

    const fieldName = fileKind === 'pdf' ? 'pdfFile' : 'htmlFile'
    const file = fileKind === 'pdf' ? item.pdfFile : item.htmlFile
    if (!file?.blobUrl) {
      return NextResponse.json({ error: 'Este item não possui arquivo' }, { status: 404 })
    }

    try {
      await del(file.blobUrl)
    } catch (e) {
      console.warn('[complementary-upload] Falha ao deletar blob:', e)
    }

    await db.collection('materials').updateOne(
      { _id: new ObjectId(materialId), 'complementaryItems.id': itemId },
      {
        $unset: { [`complementaryItems.$.${fieldName}`]: '' },
        $set: { [`complementaryItems.$.viewerEnabled`]: false, updatedAt: new Date() },
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[complementary-upload] DELETE error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
