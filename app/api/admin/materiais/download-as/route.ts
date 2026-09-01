/**
 * Baixa o PDF de um material JÁ COM A MARCA D'ÁGUA (e os metadados) do usuário
 * que tem o acesso — o mesmo arquivo que sairia para ele.
 *
 * Serve para quando o admin quer entregar o material por fora (WhatsApp, um
 * pendrive, um e-mail escrito à mão) sem depender do envio automático por
 * anexo: o rastreio forense continua valendo, porque o arquivo carrega o nome,
 * o e-mail cifrado, o id e o pedido daquela pessoa — não os do admin.
 *
 * POST /api/admin/materiais/download-as
 *   Body: { purchaseId?: string, serialKeyId?: string, materialId?: string }
 *   200 → PDF (stream)
 *   409 → o item tem vários PDFs; a resposta lista `materials` para escolher
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { Db, ObjectId } from 'mongodb'
import { isValidObjectId } from '@/lib/api-security'
import { fetchMaterialPdfBytes } from '@/lib/material-pdf-viewer'
import { applyWatermark } from '@/lib/pdf-watermark'
import { pdfBytesToStream } from '@/lib/pdf-response'
import { resolveMaterialsWithPdf, type WatermarkIdentity } from '@/lib/material-pdf-email'
import { resolvePurchaseTarget } from '@/lib/admin-material-delivery'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** `Material__Nome_do_Usuario.pdf` — o admin costuma baixar vários seguidos. */
function downloadFilename(materialTitle: string, userName: string): string {
  const clean = (value: string, max: number) =>
    (value || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9_\- ]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, max)
  const title = clean(materialTitle, 60) || 'material'
  const person = clean(userName, 40)
  return person ? `${title}__${person}.pdf` : `${title}.pdf`
}

/** Alvo do download: de quem é a marca d'água e qual item ele possui. */
interface DownloadAsTarget {
  identity: WatermarkIdentity
  itemType: string
  itemId: string
  audit: Record<string, unknown>
}

/**
 * Compra feita SEM login: a serial key ainda não foi ativada, então não existe
 * `material_purchases` — a identidade da marca d'água vem da própria chave.
 */
async function resolveSerialKeyTarget(
  db: Db,
  serialKeyId: string
): Promise<{ ok: true; target: DownloadAsTarget } | { ok: false; status: number; error: string }> {
  if (!isValidObjectId(serialKeyId)) {
    return { ok: false, status: 400, error: 'serialKeyId inválido' }
  }
  const serial = await db.collection('serial_keys').findOne({ _id: new ObjectId(serialKeyId) })
  if (!serial || serial.origin !== 'purchase') {
    return { ok: false, status: 404, error: 'Serial key de compra não encontrada' }
  }
  if (serial.status === 'cancelled') {
    return { ok: false, status: 422, error: 'Esta serial key foi cancelada.' }
  }

  const grant = serial.grant || {}
  const itemType: string = grant.itemType || (grant.productType === 'package' ? 'package' : 'material')
  const itemId: string = grant.itemId ? String(grant.itemId) : ''
  if (!itemId || !isValidObjectId(itemId) || (itemType !== 'material' && itemType !== 'package')) {
    return { ok: false, status: 422, error: 'Serial key sem material/pacote associado válido.' }
  }
  const buyerEmail = String(serial.buyerEmail || '').trim()
  if (!buyerEmail) {
    return { ok: false, status: 422, error: 'Serial key sem e-mail de compra.' }
  }

  return {
    ok: true,
    target: {
      identity: {
        userName: serial.buyerName || '',
        userEmail: buyerEmail,
        userId: String(serial._id),
        orderId: serial.providerPaymentId || serial.orderId || String(serial._id),
      },
      itemType,
      itemId,
      audit: { serialKeyId, guest: true },
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const purchaseId = typeof body?.purchaseId === 'string' ? body.purchaseId : ''
    const serialKeyId = typeof body?.serialKeyId === 'string' ? body.serialKeyId : ''
    const materialId = typeof body?.materialId === 'string' ? body.materialId : ''

    const db = await getDb()

    let target: DownloadAsTarget
    if (serialKeyId) {
      const resolved = await resolveSerialKeyTarget(db, serialKeyId)
      if (!resolved.ok) {
        return NextResponse.json({ error: resolved.error }, { status: resolved.status })
      }
      target = resolved.target
    } else {
      const resolved = await resolvePurchaseTarget(db, purchaseId)
      if (!resolved.ok) {
        return NextResponse.json({ error: resolved.error }, { status: resolved.status })
      }
      const t = resolved.target
      target = {
        identity: {
          userName: t.userName,
          userEmail: t.userEmail,
          userId: t.userId,
          orderId: t.orderId,
        },
        itemType: t.itemType,
        itemId: t.itemId,
        audit: { purchaseId, userId: t.userId, userEmail: t.userEmail },
      }
    }

    if (!target.identity.userEmail) {
      return NextResponse.json(
        { error: 'Este acesso não tem e-mail — sem ele a marca d\'água não identifica ninguém.' },
        { status: 422 }
      )
    }

    const materials = await resolveMaterialsWithPdf(db, target.itemType, target.itemId)
    if (materials.length === 0) {
      return NextResponse.json({ error: 'Nenhum PDF disponível neste item.' }, { status: 422 })
    }

    // Um pacote tem vários PDFs: sem saber qual, o admin escolheria por nós.
    let material = materials[0]
    if (materialId) {
      const picked = materials.find((m: any) => String(m._id) === materialId)
      if (!picked) {
        return NextResponse.json(
          { error: 'Este material não faz parte do item comprado.' },
          { status: 422 }
        )
      }
      material = picked
    } else if (materials.length > 1) {
      return NextResponse.json(
        {
          error: 'Este item tem mais de um PDF. Escolha qual baixar.',
          materials: materials.map((m: any) => ({ id: String(m._id), title: m.title || 'Material' })),
        },
        { status: 409 }
      )
    }

    let original: ArrayBuffer
    try {
      original = await fetchMaterialPdfBytes(material.pdfFile.blobUrl)
    } catch (error) {
      console.error('[admin-download-as] Falha ao buscar blob:', error)
      return NextResponse.json(
        { error: 'Erro ao recuperar o arquivo. Tente novamente.' },
        { status: 502 }
      )
    }

    const now = new Date()
    // Mesma marca d'água e mesmos metadados do download do próprio usuário —
    // é isso que faz o arquivo continuar rastreável até ele.
    const watermarked = await applyWatermark(original, {
      ...target.identity,
      downloadedAt: now,
    })

    db.collection('audit_logs').insertOne({
      action: 'material_pdf_admin_download_as_user',
      adminId: session.userId,
      adminName: session.name,
      ...target.audit,
      watermarkName: target.identity.userName,
      watermarkEmail: target.identity.userEmail,
      itemType: target.itemType,
      itemId: target.itemId,
      materialId: String(material._id),
      materialTitle: material.title,
      orderId: target.identity.orderId,
      downloadedAt: now,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
    }).catch((e) => console.error('[admin-download-as] Falha ao gravar auditoria:', e))

    const filename = downloadFilename(material.title || 'material', target.identity.userName)

    // Em pedaços, como no download do usuário: acima de ~4,5 MB a borda corta
    // uma resposta entregue de uma vez. Ver `lib/pdf-response.ts`.
    return new NextResponse(pdfBytesToStream(watermarked), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(watermarked.byteLength),
        'Content-Transfer-Encoding': 'binary',
        'Accept-Ranges': 'none',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error: any) {
    console.error('[admin-download-as] Erro inesperado:', error)
    return NextResponse.json(
      { error: `Erro ao gerar o PDF: ${error?.message || String(error)}` },
      { status: 500 }
    )
  }
}
