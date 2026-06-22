/**
 * API de upload de PDF para materiais.
 *
 * Usa CLIENT-SIDE UPLOAD do Vercel Blob: o navegador envia o arquivo
 * DIRETO para o Blob storage (sem passar pela função), o que elimina o
 * limite de 4.5 MB do corpo de requisição das Vercel Functions. Suporta
 * arquivos de até 5 TB, sem compactação e sem perda de qualidade.
 *
 * Fluxo:
 *   1. O browser chama upload() do @vercel/blob/client, que faz um POST
 *      aqui para gerar um token de autorização (handleUpload).
 *   2. O browser sobe o arquivo direto para o Blob usando esse token.
 *   3. O browser chama PUT aqui ("confirm") para gravar os metadados no
 *      Mongo. Esse é o ÚNICO ponto que escreve no banco — evita depender
 *      do webhook onUploadCompleted (que não dispara em localhost) e
 *      qualquer corrida de escrita dupla.
 *
 * GET    /api/materiais/upload?materialId=xxx  → info do PDF atual (admin)
 * POST   /api/materiais/upload                 → gera token de upload (handleUpload)
 * PUT    /api/materiais/upload                 → confirma upload e grava metadados
 * DELETE /api/materiais/upload?materialId=xxx  → remove PDF do material
 */

import { NextRequest, NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { PDFDocument } from 'pdf-lib'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { isValidObjectId } from '@/lib/api-security'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

function getMaxUploadBytes(): number {
  const envMb = parseInt(process.env.MATERIAL_UPLOAD_MAX_MB || '100', 10)
  // Client-side upload com multipart suporta arquivos enormes; mantemos um
  // teto generoso (2 GB) só como salvaguarda contra erros de configuração.
  const mb = isNaN(envMb) || envMb <= 0 ? 100 : Math.min(envMb, 2048)
  return mb * 1024 * 1024
}

function blobPrefixFor(materialId: string): string {
  return `material-originals/${materialId}/`
}

// Limite acima do qual NÃO baixamos o PDF na confirmação só para contar
// páginas (evita pressão de memória na função com arquivos muito grandes).
// Nesses casos o pageCount fica vazio e o viewer o preenche sob demanda na
// primeira renderização de página.
function getPageCountMaxBytes(): number {
  const envMb = parseInt(process.env.MATERIAL_PAGECOUNT_MAX_MB || '80', 10)
  const mb = isNaN(envMb) || envMb <= 0 ? 80 : envMb
  return mb * 1024 * 1024
}

async function countPdfPagesFromUrl(blobUrl: string, sizeBytes: number): Promise<number | undefined> {
  if (sizeBytes > getPageCountMaxBytes()) return undefined
  try {
    const response = await fetch(blobUrl, {
      headers: {
        ...(process.env.BLOB_READ_WRITE_TOKEN
          ? { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
          : {}),
      },
    })
    if (!response.ok) {
      console.warn('[pdf-upload] Falha ao baixar PDF para contar paginas:', response.status)
      return undefined
    }
    const buffer = await response.arrayBuffer()
    const pdfDoc = await PDFDocument.load(buffer, { updateMetadata: false, ignoreEncryption: true })
    return pdfDoc.getPageCount()
  } catch (error) {
    console.warn('[pdf-upload] Falha ao contar paginas do PDF:', error)
    return undefined
  }
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
        uploadedByName: material.pdfFile.uploadedByName,
        uploadedAt: material.pdfFile.uploadedAt,
      },
      pageCount: Number(material.pdfFile.pageCount) || 0,
    })
  } catch (error) {
    console.error('[pdf-upload] GET error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ─── POST: Gera o token de autorização para upload client-side ───────────────

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = (await request.json()) as HandleUploadBody

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Autoriza somente admins. O cookie de sessão acompanha o fetch
        // same-origin que o upload() faz para cá.
        const session = await getSession()
        if (!session || session.role !== 'admin') {
          throw new Error('Não autorizado')
        }

        let materialId = ''
        try {
          materialId = JSON.parse(clientPayload || '{}').materialId || ''
        } catch {
          throw new Error('Payload inválido')
        }
        if (!materialId || !isValidObjectId(materialId)) {
          throw new Error('materialId inválido')
        }

        // Garante que o caminho do blob pertence a este material — o cliente
        // escolhe o pathname, então validamos o prefixo (defesa em profundidade).
        if (!pathname.startsWith(blobPrefixFor(materialId))) {
          throw new Error('Caminho de upload inválido')
        }

        const db = await getDb()
        const exists = await db.collection('materials').findOne(
          { _id: new ObjectId(materialId) },
          { projection: { _id: 1 } }
        )
        if (!exists) {
          throw new Error('Material não encontrado')
        }

        return {
          access: 'private',
          addRandomSuffix: false,
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: getMaxUploadBytes(),
          tokenPayload: JSON.stringify({
            materialId,
            userId: session.userId,
            userName: session.name,
          }),
        }
      },
      // Sem onUploadCompleted: a gravação no Mongo acontece no PUT (confirm),
      // disparado pelo próprio admin autenticado. Isso evita depender do
      // webhook (que não dispara em localhost) e qualquer corrida.
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao autorizar upload'
    console.error('[pdf-upload] POST (handleUpload) error:', error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

// ─── PUT: Confirma o upload e grava os metadados no Mongo ────────────────────

export async function PUT(request: NextRequest): Promise<Response> {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const payload = await request.json().catch(() => null)
    const materialId = payload?.materialId as string | undefined
    const blobUrl = payload?.blobUrl as string | undefined
    const blobPathname = payload?.blobPathname as string | undefined
    const originalFilename = (payload?.originalFilename as string | undefined) || 'arquivo.pdf'
    const sizeBytes = Number(payload?.sizeBytes) || 0

    if (!materialId || !isValidObjectId(materialId)) {
      return NextResponse.json({ error: 'materialId inválido' }, { status: 400 })
    }
    if (!blobUrl || !blobPathname) {
      return NextResponse.json({ error: 'Dados do blob ausentes' }, { status: 400 })
    }
    // O blob precisa pertencer a este material (mesmo prefixo usado no token).
    if (!blobPathname.startsWith(blobPrefixFor(materialId))) {
      return NextResponse.json({ error: 'Caminho de blob inválido' }, { status: 400 })
    }

    const db = await getDb()
    const exists = await db.collection('materials').findOne(
      { _id: new ObjectId(materialId) },
      { projection: { _id: 1, pdfFile: 1 } }
    )
    if (!exists) {
      return NextResponse.json({ error: 'Material não encontrado' }, { status: 404 })
    }

    const pageCount = await countPdfPagesFromUrl(blobUrl, sizeBytes)

    // Remove o blob anterior (se houver e for diferente do novo).
    if (exists.pdfFile?.blobUrl && exists.pdfFile.blobUrl !== blobUrl) {
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
            blobPathname,
            blobUrl,
            originalFilename,
            sizeBytes,
            uploadedBy: session.userId,
            uploadedByName: session.name,
            uploadedAt: new Date(),
            ...(pageCount ? { pageCount } : {}),
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
      blobPathname,
      sizeBytes,
      createdAt: new Date(),
    })

    console.log(`[pdf-upload] PDF confirmado: material=${materialId} size=${sizeBytes} pathname=${blobPathname}`)

    return NextResponse.json({ success: true, pageCount: pageCount || 0 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao confirmar upload'
    console.error('[pdf-upload] PUT error:', error)
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
      {
        $unset: { pdfFile: '' },
        $set: { updatedAt: new Date(), pdfViewerEnabled: false, pdfDownloadEnabled: true },
      }
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
