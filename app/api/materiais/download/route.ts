/**
 * API de download seguro de PDF com marca d'água personalizada.
 *
 * Segurança:
 *   - Requer autenticação
 *   - Verifica compra aprovada (ou acesso por grupo para materiais gratuitos)
 *   - Nunca expõe a URL original do blob ao cliente
 *   - Gera PDF personalizado com dados do usuário em cada download
 *   - Loga cada download para auditoria
 *
 * GET /api/materiais/download?materialId=...
 *   Response: PDF stream com marca d'água
 *
 * POST /api/materiais/download
 *   Body: { materialId: string }
 *   Response: PDF stream com marca d'água
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { isValidObjectId } from '@/lib/api-security'
import { fetchMaterialPdfBytes } from '@/lib/material-pdf-viewer'
import { applyWatermark } from '@/lib/pdf-watermark'

export const dynamic = 'force-dynamic'

// Tempo máximo de geração antes de timeout (Vercel: 60s no plano Pro)
export const maxDuration = 60

export async function POST(request: NextRequest) {
  let body: { materialId?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { materialId } = body
  if (!materialId || typeof materialId !== 'string' || !isValidObjectId(materialId)) {
    return NextResponse.json({ error: 'materialId inválido' }, { status: 400 })
  }

  return createMaterialPdfDownloadResponse(request, materialId)
}

export async function GET(request: NextRequest) {
  const materialId = request.nextUrl.searchParams.get('materialId')
  if (!materialId || !isValidObjectId(materialId)) {
    return NextResponse.json({ error: 'materialId inválido' }, { status: 400 })
  }

  return createMaterialPdfDownloadResponse(request, materialId)
}

async function createMaterialPdfDownloadResponse(request: NextRequest, materialId: string) {
  try {
    // ── 1. Autenticação ───────────────────────────────────────────────────
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // ── 3. Buscar material do banco (fonte da verdade) ────────────────────
    const db = await getDb()
    const material = await db.collection('materials').findOne(
      { _id: new ObjectId(materialId) },
      {
        projection: {
          title: 1,
          type: 1,
          pricing: 1,
          allowedGroups: 1,
          isHidden: 1,
          pdfFile: 1,
          pdfDownloadEnabled: 1,
          downloadCount: 1,
        },
      }
    )

    if (!material) {
      return NextResponse.json({ error: 'Material não encontrado' }, { status: 404 })
    }

    if (material.isHidden && session.role !== 'admin') {
      return NextResponse.json({ error: 'Material não encontrado' }, { status: 404 })
    }

    // ── 4. Verificar se o material tem PDF interno ────────────────────────
    if (!material.pdfFile?.blobUrl) {
      return NextResponse.json(
        { error: 'Este material não possui PDF para download direto' },
        { status: 422 }
      )
    }

    if (material.pdfDownloadEnabled === false && session.role !== 'admin') {
      return NextResponse.json(
        { error: 'O download deste PDF foi desabilitado. Use o visualizador protegido quando disponivel.' },
        { status: 403 }
      )
    }

    // ── 5. Verificar autorização de acesso ────────────────────────────────
    const isAdmin = session.role === 'admin'
    let hasAccess = isAdmin
    let purchaseForAudit: any = null

    if (!hasAccess) {
      if (material.pricing === 'paid') {
        // Exige compra aprovada
        const emailRegex = session.email
          ? new RegExp(
              `^${session.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
              'i'
            )
          : null
        const purchase = await db.collection('material_purchases').findOne({
          userId: session.userId,
          itemId: materialId,
          itemType: 'material',
          status: 'completed',
        })

        if (purchase) {
          hasAccess = true
          purchaseForAudit = purchase
        } else {
          // Tentar via email como fallback (grants manuais antigos)
          if (emailRegex) {
            const byEmail = await db.collection('material_purchases').findOne({
              userEmail: { $regex: emailRegex },
              itemId: materialId,
              itemType: 'material',
              status: 'completed',
            })
            hasAccess = !!byEmail
            purchaseForAudit = byEmail
          }

          if (!hasAccess) {
            const packages = await db.collection('material_packages')
              .find({ materialIds: materialId, isHidden: { $ne: true } })
              .project({ _id: 1 })
              .toArray()
            const packageIds = packages.map((pkg: any) => String(pkg._id))

            if (packageIds.length > 0) {
              const packageFilter = {
                itemType: 'package',
                itemId: { $in: packageIds },
                status: 'completed',
              }
              const packageByUserId = await db.collection('material_purchases').findOne({
                ...packageFilter,
                userId: session.userId,
              })

              if (packageByUserId) {
                hasAccess = true
                purchaseForAudit = packageByUserId
              } else if (emailRegex) {
                const packageByEmail = await db.collection('material_purchases').findOne({
                  ...packageFilter,
                  userEmail: { $regex: emailRegex },
                })
                hasAccess = !!packageByEmail
                purchaseForAudit = packageByEmail
              }
            }
          }
        }
      } else {
        // Material gratuito: verificar grupo do usuário
        if (!material.allowedGroups || material.allowedGroups.length === 0) {
          // Sem restrição de grupo — qualquer usuário autenticado tem acesso
          hasAccess = true
        } else {
          const user = await db.collection('users').findOne(
            { _id: new ObjectId(session.userId) },
            { projection: { accountType: 1, secondaryRole: 1 } }
          )
          const userGroups: string[] = []
          if (user?.accountType) userGroups.push(user.accountType)
          if (user?.secondaryRole === 'monitor') userGroups.push('monitor')
          hasAccess = userGroups.some((g) => material.allowedGroups.includes(g))
        }
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso negado. Adquira o material para fazer o download.' },
        { status: 403 }
      )
    }

    // ── 6. Buscar orderId para metadados da marca d'água ──────────────────
    let orderId = 'ADMIN'
    if (!isAdmin) {
      const purchase = purchaseForAudit || await db.collection('material_purchases').findOne(
        {
          userId: session.userId,
          itemId: materialId,
          status: 'completed',
        },
        { projection: { _id: 1, providerPaymentId: 1, providerOrderId: 1 } }
      )
      orderId = purchase?.providerPaymentId
        || purchase?.providerOrderId
        || String(purchase?._id)
        || session.userId
    }

    // ── 7. Baixar PDF original do Vercel Blob ─────────────────────────────
    // Nunca expor material.pdfFile.blobUrl ao cliente — apenas usar aqui no servidor.
    let pdfArrayBuffer: ArrayBuffer
    try {
      pdfArrayBuffer = await fetchMaterialPdfBytes(material.pdfFile.blobUrl)
    } catch (error) {
      console.error('[pdf-download] Falha ao buscar blob:', error)
      return NextResponse.json(
        { error: 'Erro ao recuperar o arquivo. Tente novamente.' },
        { status: 502 }
      )
    }

    // ── 8. Aplicar marca d'água personalizada ─────────────────────────────
    const now = new Date()
    const watermarkedPdf = await applyWatermark(pdfArrayBuffer, {
      userName: session.name,
      userEmail: session.email,
      userId: session.userId,
      orderId,
      downloadedAt: now,
    })

    // ── 9. Incrementar contador e logar auditoria (fire-and-forget) ───────
    Promise.all([
      db.collection('materials').updateOne(
        { _id: new ObjectId(materialId) },
        { $inc: { downloadCount: 1 } }
      ),
      db.collection('audit_logs').insertOne({
        action: 'material_pdf_download',
        userId: session.userId,
        userName: session.name,
        userEmail: session.email,
        materialId,
        materialTitle: material.title,
        orderId,
        downloadedAt: now,
        ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
      }),
    ]).catch((e) => console.error('[pdf-download] Erro no log/counter:', e))

    // ── 10. Retornar PDF personalizado ─────────────────────────────────────
    // Nome do arquivo: título do material normalizado
    const safeTitle = (material.title as string)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9_\- ]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 80)
    const filename = `${safeTitle}.pdf`

    return new NextResponse(Buffer.from(watermarkedPdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(watermarkedPdf.byteLength),
        'Content-Transfer-Encoding': 'binary',
        'Accept-Ranges': 'none',
        // Nunca armazenar em cache — cada download é personalizado
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        // Prevenir embedding do PDF em iframes de outros domínios
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('[pdf-download] Erro inesperado:', error)
    return NextResponse.json(
      { error: 'Erro interno ao gerar o PDF. Tente novamente.' },
      { status: 500 }
    )
  }
}
