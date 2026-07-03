/**
 * API de upload de HTML para materiais (leitor de experiências).
 *
 * Espelha o fluxo de upload de PDF (`app/api/materiais/upload/route.ts`):
 * usa CLIENT-SIDE UPLOAD do Vercel Blob — o navegador envia o arquivo .html
 * DIRETO para o Blob storage (sem passar pela função), eliminando o limite de
 * 4.5 MB do corpo de requisição das Vercel Functions.
 *
 * O arquivo esperado é um .html ÚNICO e autocontido (CSS/JS inline; imagens
 * como data-URI ou links https de CDN). O conteúdo nunca é servido direto do
 * Blob ao cliente — sempre passa pela rota de leitor com watermark indexada.
 *
 * GET    /api/materiais/html-upload?materialId=xxx  → info do HTML atual (admin)
 * POST   /api/materiais/html-upload                 → gera token de upload (handleUpload)
 * PUT    /api/materiais/html-upload                 → confirma upload e grava metadados
 * DELETE /api/materiais/html-upload?materialId=xxx  → remove HTML do material
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

function getMaxUploadBytes(): number {
  const envMb = parseInt(process.env.MATERIAL_HTML_UPLOAD_MAX_MB || '25', 10)
  // .html autocontido raramente passa de poucos MB; mantemos um teto
  // generoso (100 MB) só como salvaguarda contra erros de configuração.
  const mb = isNaN(envMb) || envMb <= 0 ? 25 : Math.min(envMb, 100)
  return mb * 1024 * 1024
}

function blobPrefixFor(materialId: string): string {
  return `material-html/${materialId}/`
}

// ─── GET: Info do HTML atual de um material (admin) ───────────────────────────

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
      { projection: { htmlFile: 1, title: 1 } }
    )

    if (!material) {
      return NextResponse.json({ error: 'Material não encontrado' }, { status: 404 })
    }

    if (!material.htmlFile) {
      return NextResponse.json({ hasHtml: false })
    }

    return NextResponse.json({
      hasHtml: true,
      htmlFile: {
        originalFilename: material.htmlFile.originalFilename,
        sizeBytes: material.htmlFile.sizeBytes,
        uploadedByName: material.htmlFile.uploadedByName,
        uploadedAt: material.htmlFile.uploadedAt,
      },
    })
  } catch (error) {
    console.error('[html-upload] GET error:', error)
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
          allowedContentTypes: ['text/html'],
          maximumSizeInBytes: getMaxUploadBytes(),
          tokenPayload: JSON.stringify({
            materialId,
            userId: session.userId,
            userName: session.name,
          }),
        }
      },
      // Sem onUploadCompleted: a gravação no Mongo acontece no PUT (confirm),
      // disparado pelo próprio admin autenticado.
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao autorizar upload'
    console.error('[html-upload] POST (handleUpload) error:', error)
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
    const originalFilename = (payload?.originalFilename as string | undefined) || 'index.html'
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
      { projection: { _id: 1, htmlFile: 1 } }
    )
    if (!exists) {
      return NextResponse.json({ error: 'Material não encontrado' }, { status: 404 })
    }

    // Remove o blob anterior (se houver e for diferente do novo).
    if (exists.htmlFile?.blobUrl && exists.htmlFile.blobUrl !== blobUrl) {
      try {
        await del(exists.htmlFile.blobUrl)
      } catch (e) {
        console.warn('[html-upload] Falha ao remover blob anterior:', e)
      }
    }

    await db.collection('materials').updateOne(
      { _id: new ObjectId(materialId) },
      {
        $set: {
          htmlFile: {
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
      action: 'material_html_upload',
      adminId: session.userId,
      adminName: session.name,
      materialId,
      blobPathname,
      sizeBytes,
      createdAt: new Date(),
    })

    console.log(`[html-upload] HTML confirmado: material=${materialId} size=${sizeBytes} pathname=${blobPathname}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao confirmar upload'
    console.error('[html-upload] PUT error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ─── DELETE: Remover HTML de um material ─────────────────────────────────────

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
      { projection: { htmlFile: 1, title: 1 } }
    )

    if (!material) {
      return NextResponse.json({ error: 'Material não encontrado' }, { status: 404 })
    }

    if (!material.htmlFile?.blobUrl) {
      return NextResponse.json({ error: 'Este material não possui HTML interno' }, { status: 404 })
    }

    try {
      await del(material.htmlFile.blobUrl)
    } catch (e) {
      console.warn('[html-upload] Falha ao deletar blob:', e)
    }

    await db.collection('materials').updateOne(
      { _id: new ObjectId(materialId) },
      {
        $unset: { htmlFile: '' },
        $set: { updatedAt: new Date(), htmlViewerEnabled: false },
      }
    )

    await db.collection('audit_logs').insertOne({
      action: 'material_html_delete',
      adminId: session.userId,
      adminName: session.name,
      materialId,
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[html-upload] DELETE error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
