/**
 * API de upload de PDF para materiais.
 *
 * Usa Vercel Blob com upload direto pelo cliente (client-side upload),
 * contornando o limite de 4.5 MB do body de funções serverless.
 *
 * Fluxo:
 *   1. POST com { type: 'generate-token', ...} → servidor valida auth+admin,
 *      retorna token para upload direto ao Vercel Blob.
 *   2. Cliente envia arquivo diretamente ao Vercel Blob usando o token.
 *   3. Vercel Blob chama o callback onUploadCompleted → servidor salva
 *      metadados do PDF no documento do material (materials collection).
 *
 * GET  /api/materiais/upload?materialId=xxx  → info do PDF atual (admin)
 * POST /api/materiais/upload                 → handle upload token + callback
 * DELETE /api/materiais/upload?materialId=xxx → remove PDF do material
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { del } from '@vercel/blob'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { isValidObjectId } from '@/lib/api-security'

export const dynamic = 'force-dynamic'

// Limite máximo configurável via env (padrão: 100 MB)
function getMaxUploadBytes(): number {
  const envMb = parseInt(process.env.MATERIAL_UPLOAD_MAX_MB || '100', 10)
  const mb = isNaN(envMb) || envMb <= 0 ? 100 : Math.min(envMb, 500) // hard cap 500 MB
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

    // Retorna metadados sem expor blobUrl ao cliente
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

// ─── POST: Token de upload + callback do Vercel Blob ─────────────────────────

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // O handleUpload lida tanto com a geração do token quanto com o callback
    const body = (await request.json()) as HandleUploadBody

    const jsonResponse = await handleUpload({
      body,
      request,

      // ── 1. Geração de token (chamado pelo cliente antes do upload) ──────
      onBeforeGenerateToken: async (pathname: string, clientPayload: string | null) => {
        // Verificar autenticação e role de admin
        const session = await getSession()
        if (!session || session.role !== 'admin') {
          throw new Error('Não autorizado: apenas administradores podem fazer upload de PDFs')
        }

        // Validar payload do cliente
        let materialId: string
        let adminName: string
        let fileSize: number = 0
        try {
          const payload = JSON.parse(clientPayload || '{}')
          materialId = payload.materialId
          adminName = payload.adminName || session.name
          fileSize = typeof payload.fileSize === 'number' ? payload.fileSize : 0
        } catch {
          throw new Error('clientPayload inválido')
        }

        if (!materialId || !isValidObjectId(materialId)) {
          throw new Error('materialId inválido no payload')
        }

        // Confirmar que o material existe
        const db = await getDb()
        const exists = await db.collection('materials').findOne(
          { _id: new ObjectId(materialId) },
          { projection: { _id: 1 } }
        )
        if (!exists) {
          throw new Error('Material não encontrado')
        }

        const maxBytes = getMaxUploadBytes()

        // Origens permitidas para o upload direto ao Vercel Blob.
        // Combina múltiplas fontes para garantir que a origem do browser seja aceita:
        //   1. Header Origin da requisição (browser).
        //   2. Header Referer (fallback se Origin for stripado por proxy).
        //   3. Host header + scheme inferido (last-resort).
        //   4. NEXT_PUBLIC_APP_URL e BLOB_ALLOWED_ORIGINS (configuração explícita).
        // A segurança real é garantida pelo check de admin acima — não por CORS.
        const requestOrigin = request.headers.get('origin')
        const referer = request.headers.get('referer')
        let refererOrigin: string | null = null
        if (referer) {
          try { refererOrigin = new URL(referer).origin } catch {}
        }
        const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host')
        const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
        const hostOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : null

        const allowedOrigins = [
          requestOrigin,
          refererOrigin,
          hostOrigin,
          process.env.NEXT_PUBLIC_APP_URL || null,
          ...(process.env.BLOB_ALLOWED_ORIGINS
            ? process.env.BLOB_ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
            : []),
        ].filter((v): v is string => !!v)
         .filter((v, i, a) => a.indexOf(v) === i) // deduplica

        console.log('[pdf-upload] allowedOrigins:', allowedOrigins, 'origin:', requestOrigin)

        return {
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: maxBytes,
          // Caminho no Vercel Blob (não-adivinhável desde fora)
          pathname: `material-originals/${materialId}/${Date.now()}-${crypto.randomUUID()}.pdf`,
          // Passar dados para o callback
          tokenPayload: JSON.stringify({
            materialId,
            adminId: session.userId,
            adminName: session.name,
            fileSize,
          }),
          addRandomSuffix: false,
          allowedOrigins,
        }
      },

      // ── 2. Callback pós-upload (chamado pelo Vercel após upload bem-sucedido) ──
      onUploadCompleted: async ({ blob, tokenPayload }: { blob: { pathname: string; url: string; downloadUrl: string; contentType: string }; tokenPayload?: string | null }) => {
        let parsed: { materialId: string; adminId: string; adminName: string; fileSize?: number }
        try {
          parsed = JSON.parse(tokenPayload || '{}')
        } catch {
          console.error('[pdf-upload] tokenPayload inválido no callback')
          throw new Error('tokenPayload inválido')
        }

        const { materialId, adminId, adminName, fileSize = 0 } = parsed

        if (!materialId || !isValidObjectId(materialId)) {
          throw new Error('materialId inválido no callback')
        }

        // Determinar nome original do arquivo a partir do pathname do blob
        const pathParts = blob.pathname.split('/')
        const rawFilename = pathParts[pathParts.length - 1]
        // Remove prefixo timestamp-uuid para obter nome legível
        const originalFilename = rawFilename.replace(/^\d+-[a-f0-9-]+\.pdf$/, rawFilename) || rawFilename

        const db = await getDb()

        // Antes de salvar o novo, remover o blob anterior (se houver) para liberar storage
        const existing = await db.collection('materials').findOne(
          { _id: new ObjectId(materialId) },
          { projection: { pdfFile: 1 } }
        )
        if (existing?.pdfFile?.blobUrl) {
          try {
            await del(existing.pdfFile.blobUrl)
          } catch (e) {
            // Não crítico — blob pode já não existir
            console.warn('[pdf-upload] Falha ao remover blob anterior:', e)
          }
        }

        // Salvar metadados do PDF no documento do material
        await db.collection('materials').updateOne(
          { _id: new ObjectId(materialId) },
          {
            $set: {
              pdfFile: {
                blobPathname: blob.pathname,
                blobUrl: blob.url,
                originalFilename,
                sizeBytes: fileSize,
                uploadedBy: adminId,
                uploadedByName: adminName,
                uploadedAt: new Date(),
              },
              updatedAt: new Date(),
            },
          }
        )

        // Log de auditoria
        await db.collection('audit_logs').insertOne({
          action: 'material_pdf_upload',
          adminId,
          adminName,
          materialId,
          blobPathname: blob.pathname,
          sizeBytes: fileSize,
          createdAt: new Date(),
        })

        console.log(`[pdf-upload] PDF salvo: material=${materialId} size=${fileSize} pathname=${blob.pathname}`)
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno no upload'
    console.error('[pdf-upload] POST error:', error)
    return NextResponse.json({ error: message }, { status: 400 })
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

    // Remover blob do Vercel Storage
    try {
      await del(material.pdfFile.blobUrl)
    } catch (e) {
      console.warn('[pdf-upload] Falha ao deletar blob:', e)
    }

    // Remover pdfFile do documento
    await db.collection('materials').updateOne(
      { _id: new ObjectId(materialId) },
      { $unset: { pdfFile: '' }, $set: { updatedAt: new Date() } }
    )

    // Log de auditoria
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
