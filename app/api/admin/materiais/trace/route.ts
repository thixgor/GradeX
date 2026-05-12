import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { emailFingerprint } from '@/lib/watermark-fingerprint'

export const dynamic = 'force-dynamic'

const OBJECT_ID_RE = /\b[a-f0-9]{24}\b/gi

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function serializeDate(value: unknown): string | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function parseTraceQuery(raw: string) {
  const q = raw.trim()
  const objectIds = Array.from(new Set((q.match(OBJECT_ID_RE) || []).map((id) => id.toLowerCase())))
  const uidSuffix =
    q.match(/\bUID\s+([a-f0-9]{6,24})\b/i)?.[1]?.toLowerCase() ||
    q.match(/\bID[:\s]+([a-f0-9]{6,24})\b/i)?.[1]?.toLowerCase() ||
    ''
  const mailFingerprint = q.match(/\bmail-[a-z0-9]{3,16}\b/i)?.[0]?.toLowerCase() || ''
  const orderId = q.match(/\bPedido:\s*([^\s|]+)/i)?.[1]?.trim() || ''
  const licensedName = q.match(/Licenciado para:\s*([^|]+)/i)?.[1]?.trim() || ''
  const materialId =
    q.match(/\bMaterial\s+([a-f0-9]{24})\b/i)?.[1]?.toLowerCase() ||
    q.match(/\bmaterialId[:\s]+([a-f0-9]{24})\b/i)?.[1]?.toLowerCase() ||
    ''

  return {
    q,
    objectIds,
    uidSuffix,
    mailFingerprint,
    orderId,
    licensedName,
    explicitMaterialIds: Array.from(new Set([materialId].filter(Boolean))),
  }
}

async function findUsers(db: any, parsed: ReturnType<typeof parseTraceQuery>) {
  const projection = {
    _id: 1,
    name: 1,
    email: 1,
    role: 1,
    accountType: 1,
    secondaryRole: 1,
    cpf: 1,
    dateOfBirth: 1,
    isAfyaMedicineStudent: 1,
    afyaUnit: 1,
    createdAt: 1,
    lastLoginAt: 1,
  }

  let candidates: any[] = []
  const matchOr: any[] = []

  if (parsed.uidSuffix) {
    matchOr.push({ idString: { $regex: `${escapeRegex(parsed.uidSuffix)}$`, $options: 'i' } })
  }

  for (const id of parsed.objectIds) {
    if (ObjectId.isValid(id)) {
      matchOr.push({ _id: new ObjectId(id) })
      matchOr.push({ idString: { $regex: `${escapeRegex(id.slice(-8))}$`, $options: 'i' } })
    }
  }

  if (parsed.licensedName.length >= 2) {
    matchOr.push({ name: { $regex: escapeRegex(parsed.licensedName), $options: 'i' } })
  }

  if (parsed.q.includes('@') && parsed.q.length >= 5) {
    matchOr.push({ email: { $regex: escapeRegex(parsed.q), $options: 'i' } })
  }

  if (matchOr.length > 0) {
    candidates = await db.collection('users').aggregate([
      { $addFields: { idString: { $toString: '$_id' } } },
      { $match: { $or: matchOr } },
      { $project: projection },
      { $limit: 80 },
    ]).toArray()
  }

  if (parsed.mailFingerprint) {
    const pool = candidates.length > 0
      ? candidates
      : await db.collection('users').find({}, { projection }).limit(20000).toArray()

    candidates = pool.filter((user: any) => emailFingerprint(user.email) === parsed.mailFingerprint)
  }

  const seen = new Set<string>()
  return candidates
    .filter((user: any) => {
      const id = String(user._id)
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })
    .map((user: any) => ({
      id: String(user._id),
      name: user.name || '',
      email: user.email || '',
      emailFingerprint: emailFingerprint(user.email),
      role: user.role || 'user',
      accountType: user.accountType || 'gratuito',
      secondaryRole: user.secondaryRole || '',
      cpf: user.cpf || '',
      dateOfBirth: serializeDate(user.dateOfBirth),
      isAfyaMedicineStudent: !!user.isAfyaMedicineStudent,
      afyaUnit: user.afyaUnit || '',
      createdAt: serializeDate(user.createdAt),
      lastLoginAt: serializeDate(user.lastLoginAt),
    }))
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const rawQuery = (searchParams.get('q') || '').trim()
    if (rawQuery.length < 3) {
      return NextResponse.json({ error: 'Informe ao menos 3 caracteres para rastrear.' }, { status: 400 })
    }

    const db = await getDb()
    const parsed = parseTraceQuery(rawQuery)
    const users = await findUsers(db, parsed)
    const userIds = users.map((user) => user.id)
    const orderId = parsed.orderId
    const nonAdminOrderId = orderId && orderId.toUpperCase() !== 'ADMIN' ? orderId : ''

    const materialLookupIds = Array.from(new Set([
      ...parsed.explicitMaterialIds,
      ...parsed.objectIds,
    ].filter(Boolean)))

    const materialObjectIds = materialLookupIds
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id))

    const materialFilter: any[] = []
    if (materialObjectIds.length) materialFilter.push({ _id: { $in: materialObjectIds } })
    if (rawQuery.length >= 3) materialFilter.push({ title: { $regex: escapeRegex(rawQuery), $options: 'i' } })

    const materials = materialFilter.length
      ? await db.collection('materials')
          .find({ $or: materialFilter }, { projection: { title: 1, type: 1, pricing: 1, price: 1, pdfFile: 1 } })
          .limit(20)
          .toArray()
      : []

    const materialIds = Array.from(new Set([
      ...parsed.explicitMaterialIds,
      ...materials.map((material: any) => String(material._id)),
    ].filter(Boolean)))

    const purchaseOr: any[] = []
    if (userIds.length) purchaseOr.push({ userId: { $in: userIds } })
    if (materialIds.length) purchaseOr.push({ itemId: { $in: materialIds } })
    if (nonAdminOrderId) {
      purchaseOr.push({ providerPaymentId: nonAdminOrderId })
      purchaseOr.push({ providerOrderId: nonAdminOrderId })
      if (ObjectId.isValid(nonAdminOrderId)) purchaseOr.push({ _id: new ObjectId(nonAdminOrderId) })
    }
    if (parsed.licensedName.length >= 2) {
      purchaseOr.push({ userName: { $regex: escapeRegex(parsed.licensedName), $options: 'i' } })
    }

    const purchases = purchaseOr.length
      ? await db.collection('material_purchases')
          .find({ $or: purchaseOr })
          .sort({ purchasedAt: -1 })
          .limit(80)
          .toArray()
      : []

    const purchaseOrderIds = purchases.map((purchase: any) => purchase.providerOrderId).filter(Boolean)
    const purchasePaymentIds = purchases.map((purchase: any) => purchase.providerPaymentId).filter(Boolean)

    const paymentOrderOr: any[] = []
    for (const providerOrderId of purchaseOrderIds) {
      if (ObjectId.isValid(providerOrderId)) paymentOrderOr.push({ _id: new ObjectId(providerOrderId) })
      paymentOrderOr.push({ providerOrderId })
      paymentOrderOr.push({ providerPaymentId: providerOrderId })
    }
    for (const providerPaymentId of purchasePaymentIds) {
      paymentOrderOr.push({ providerPaymentId })
      paymentOrderOr.push({ providerOrderId: providerPaymentId })
    }
    if (nonAdminOrderId) {
      if (ObjectId.isValid(nonAdminOrderId)) paymentOrderOr.push({ _id: new ObjectId(nonAdminOrderId) })
      paymentOrderOr.push({ providerOrderId: nonAdminOrderId })
      paymentOrderOr.push({ providerPaymentId: nonAdminOrderId })
    }

    const paymentOrders = paymentOrderOr.length
      ? await db.collection('payment_orders').find({ $or: paymentOrderOr }).limit(40).toArray()
      : []

    const paymentOr: any[] = []
    for (const order of paymentOrders) {
      paymentOr.push({ orderId: String(order._id) })
      if (order.providerPaymentId) paymentOr.push({ providerPaymentId: order.providerPaymentId })
      if (order.providerOrderId) paymentOr.push({ providerPaymentId: order.providerOrderId })
    }
    for (const providerPaymentId of purchasePaymentIds) {
      paymentOr.push({ providerPaymentId })
    }
    if (nonAdminOrderId) {
      paymentOr.push({ providerPaymentId: nonAdminOrderId })
      if (ObjectId.isValid(nonAdminOrderId)) paymentOr.push({ orderId: nonAdminOrderId })
    }

    const payments = paymentOr.length
      ? await db.collection('payments').find({ $or: paymentOr }).limit(40).toArray()
      : []

    const logOr: any[] = []
    if (userIds.length) logOr.push({ userId: { $in: userIds } })
    if (materialIds.length) logOr.push({ materialId: { $in: materialIds } })
    if (orderId) logOr.push({ orderId })
    if (parsed.licensedName.length >= 2) {
      logOr.push({ userName: { $regex: escapeRegex(parsed.licensedName), $options: 'i' } })
    }

    const downloads = logOr.length
      ? await db.collection('audit_logs')
          .find({ action: 'material_pdf_download', $or: logOr })
          .sort({ downloadedAt: -1, ts: -1 })
          .limit(80)
          .toArray()
      : []

    return NextResponse.json({
      parsed: {
        uidSuffix: parsed.uidSuffix,
        mailFingerprint: parsed.mailFingerprint,
        orderId: parsed.orderId,
        licensedName: parsed.licensedName,
        materialIds,
      },
      users,
      materials: materials.map((material: any) => ({
        id: String(material._id),
        title: material.title || '',
        type: material.type || '',
        pricing: material.pricing || '',
        price: Number(material.price || 0),
        hasPdf: !!material.pdfFile?.blobUrl,
      })),
      purchases: purchases.map((purchase: any) => ({
        id: String(purchase._id),
        userId: purchase.userId || '',
        userName: purchase.userName || '',
        userEmail: purchase.userEmail || '',
        itemType: purchase.itemType || '',
        itemId: purchase.itemId || '',
        itemTitle: purchase.itemTitle || '',
        price: Number(purchase.price || 0),
        status: purchase.status || '',
        purchasedAt: serializeDate(purchase.purchasedAt),
        provider: purchase.provider || '',
        providerOrderId: purchase.providerOrderId || '',
        providerPaymentId: purchase.providerPaymentId || '',
      })),
      paymentOrders: paymentOrders.map((order: any) => ({
        id: String(order._id),
        userId: order.userId || '',
        payerName: order.payerName || '',
        payerEmail: order.payerEmail || '',
        type: order.type || '',
        refId: order.refId || '',
        amount: Number(order.amount || 0),
        status: order.status || '',
        paymentMethod: order.paymentMethod || '',
        providerOrderId: order.providerOrderId || '',
        providerPaymentId: order.providerPaymentId || '',
        createdAt: serializeDate(order.createdAt),
        paidAt: serializeDate(order.paidAt),
      })),
      payments: payments.map((payment: any) => ({
        id: String(payment._id),
        orderId: payment.orderId || '',
        userId: payment.userId || '',
        providerPaymentId: payment.providerPaymentId || '',
        amount: Number(payment.amount || 0),
        status: payment.status || '',
        paymentMethod: payment.paymentMethod || '',
        installments: payment.installments || null,
        createdAt: serializeDate(payment.createdAt),
        paidAt: serializeDate(payment.paidAt),
      })),
      downloads: downloads.map((log: any) => ({
        id: String(log._id),
        userId: log.userId || '',
        userName: log.userName || '',
        userEmail: log.userEmail || '',
        materialId: log.materialId || '',
        materialTitle: log.materialTitle || '',
        orderId: log.orderId || '',
        downloadedAt: serializeDate(log.downloadedAt || log.ts),
        ip: log.ip || '',
      })),
    })
  } catch (error) {
    console.error('[admin-material-trace] Erro ao rastrear watermark:', error)
    return NextResponse.json({ error: 'Erro ao rastrear o identificador.' }, { status: 500 })
  }
}
