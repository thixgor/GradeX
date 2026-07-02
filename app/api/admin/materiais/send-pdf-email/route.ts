/**
 * Envio manual de PDF (com marca d'água do usuário) para o e-mail do
 * comprador, disparado por um administrador.
 *
 * Contorna casos em que o usuário só tem acesso ao visualizador protegido
 * (download desabilitado) e não consegue baixar o arquivo — evitando pedidos
 * de reembolso. O PDF chega anexado, com a mesma marca d'água aplicada nos
 * downloads normais, então o rastreio forense continua funcionando.
 *
 * POST /api/admin/materiais/send-pdf-email
 *   Body: { purchaseId: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { isValidObjectId } from '@/lib/api-security'
import { fetchMaterialPdfBytes } from '@/lib/material-pdf-viewer'
import { applyWatermark } from '@/lib/pdf-watermark'
import { sendMaterialPdfDeliveryEmail } from '@/lib/mail'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function safeFilename(title: string): string {
  return (title || 'material')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9_\- ]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 80) + '.pdf'
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const purchaseId = body?.purchaseId
    if (!purchaseId || typeof purchaseId !== 'string' || !isValidObjectId(purchaseId)) {
      return NextResponse.json({ error: 'purchaseId inválido' }, { status: 400 })
    }

    const db = await getDb()
    const purchase = await db.collection('material_purchases').findOne({ _id: new ObjectId(purchaseId) })
    if (!purchase || purchase.status !== 'completed') {
      return NextResponse.json({ error: 'Compra não encontrada' }, { status: 404 })
    }

    // Dados do usuário: prioriza o cadastro atual (nome/email podem ter mudado).
    let userId = purchase.userId ? String(purchase.userId) : ''
    let userName = purchase.userName || ''
    let userEmail = purchase.userEmail || ''
    if (userId && isValidObjectId(userId)) {
      const user = await db.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { name: 1, email: 1 } }
      )
      if (user) {
        userName = user.name || userName
        userEmail = user.email || userEmail
      }
    }
    if (!userEmail) {
      return NextResponse.json({ error: 'Usuário sem e-mail cadastrado' }, { status: 422 })
    }

    // Resolver material(is) com PDF associado(s) à compra.
    let materials: any[] = []
    if (purchase.itemType === 'material') {
      const material = await db.collection('materials').findOne(
        { _id: new ObjectId(purchase.itemId) },
        { projection: { title: 1, pdfFile: 1 } }
      )
      if (material) materials = [material]
    } else if (purchase.itemType === 'package') {
      const pkg = await db.collection('material_packages').findOne(
        { _id: new ObjectId(purchase.itemId) },
        { projection: { materialIds: 1 } }
      )
      const materialIds: string[] = Array.isArray(pkg?.materialIds) ? pkg!.materialIds : []
      if (materialIds.length > 0) {
        const objectIds = materialIds.filter(isValidObjectId).map((id) => new ObjectId(id))
        materials = await db.collection('materials')
          .find({ _id: { $in: objectIds } }, { projection: { title: 1, pdfFile: 1 } })
          .toArray()
      }
    }

    const materialsWithPdf = materials.filter((m) => m.pdfFile?.blobUrl)
    if (materialsWithPdf.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum PDF disponível para envio neste item.' },
        { status: 422 }
      )
    }

    const orderId = purchase.providerPaymentId || purchase.providerOrderId || String(purchase._id)
    const now = new Date()

    const items: { title: string; filename: string; buffer: Buffer }[] = []
    for (const material of materialsWithPdf) {
      const original = await fetchMaterialPdfBytes(material.pdfFile.blobUrl)
      const watermarked = await applyWatermark(original, {
        userName,
        userEmail,
        userId: userId || String(purchase._id),
        orderId,
        downloadedAt: now,
      })
      items.push({
        title: material.title || 'Material',
        filename: safeFilename(material.title),
        buffer: Buffer.from(watermarked),
      })
    }

    await sendMaterialPdfDeliveryEmail({ email: userEmail, name: userName, items })

    await db.collection('audit_logs').insertOne({
      action: 'material_pdf_email_delivery',
      adminId: session.userId,
      adminName: session.name,
      userId,
      userName,
      userEmail,
      purchaseId,
      itemType: purchase.itemType,
      itemId: purchase.itemId,
      materialIds: materialsWithPdf.map((m) => String(m._id)),
      orderId,
      sentAt: now,
    })

    return NextResponse.json({ success: true, sentTo: userEmail, materialsCount: items.length })
  } catch (error) {
    console.error('[admin-send-pdf-email] Erro ao enviar PDF por e-mail:', error)
    return NextResponse.json({ error: 'Erro ao enviar o PDF por e-mail.' }, { status: 500 })
  }
}
