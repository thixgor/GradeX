import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import {
  SERIAL_KEYS_COLLECTION,
  SERIAL_KEY_SECURITY_LOGS,
  productTypeLabel,
  getActivationUrl,
} from '@/lib/serial-keys'
import type { SerialKey } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Painel administrativo de compras via Serial Key: lista com filtros + métricas.
 * Somente admin. Alimenta a aba "Serial Keys" em /admin/analytics.
 */
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const productType = searchParams.get('productType') || ''
  const status = searchParams.get('status') || ''
  const q = (searchParams.get('q') || '').trim()
  const dateFrom = searchParams.get('dateFrom') || ''
  const dateTo = searchParams.get('dateTo') || ''

  const db = await getDb()
  const col = db.collection<SerialKey>(SERIAL_KEYS_COLLECTION)

  const filter: any = { origin: 'purchase' }
  if (productType) filter.productType = productType
  if (status) filter.status = status
  if (dateFrom || dateTo) {
    filter.generatedAt = {}
    if (dateFrom) filter.generatedAt.$gte = new Date(dateFrom)
    if (dateTo) {
      const end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
      filter.generatedAt.$lte = end
    }
  }
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ buyerName: rx }, { buyerEmail: rx }, { buyerPhone: rx }, { key: rx }, { orderId: q }]
  }

  const keys = await col.find(filter).sort({ generatedAt: -1 }).limit(500).toArray()

  const rows = keys.map((k) => ({
    id: String(k._id),
    key: k.key,
    buyerName: k.buyerName || '',
    buyerFirstName: k.buyerFirstName || '',
    buyerEmail: k.buyerEmail || '',
    buyerPhone: k.buyerPhone || '',
    productType: k.productType,
    productTypeLabel: productTypeLabel(k.productType),
    productTitle: k.productTitle || '',
    amount: k.amount || 0,
    paymentStatus: k.paymentStatus || '',
    status: k.status || 'unactivated',
    purchasedAt: k.generatedAt,
    activatedAt: k.activatedAt || null,
    activatedByUserId: k.activatedByUserId || null,
    activatedByEmail: k.activatedByEmail || null,
    activationUrl: k.activationToken ? getActivationUrl(k.activationToken) : null,
    providerPaymentId: k.providerPaymentId || null,
    orderId: k.orderId || null,
    source: k.source || null,
    ip: k.ip || null,
    userAgent: k.userAgent || null,
    emailHistory: (k.emailHistory || []).map((e) => ({
      to: e.to, status: e.status, kind: e.kind, sentAt: e.sentAt, error: e.error,
    })),
    guest: !k.generatedBy || k.generatedBy === 'system',
  }))

  // ── Métricas (sobre todo o universo de compras, não só a página) ──────────
  const allPurchases = await col.find({ origin: 'purchase' }).project({
    status: 1, amount: 1, productType: 1, generatedAt: 1, paymentStatus: 1, generatedBy: 1, emailHistory: 1,
  }).toArray()

  const totalGenerated = allPurchases.length
  const totalActivated = allPurchases.filter((k) => k.status === 'activated').length
  const totalPending = allPurchases.filter((k) => (k.status || 'unactivated') === 'unactivated').length
  const totalGuest = allPurchases.filter((k) => !k.generatedBy || k.generatedBy === 'system').length
  const activationRate = totalGenerated > 0 ? totalActivated / totalGenerated : 0

  const revenueByProduct: Record<string, number> = {}
  const revenueByType: Record<string, number> = {}
  const salesByDay: Record<string, number> = {}
  const productSales: Record<string, number> = {}
  let emailsResent = 0

  for (const k of allPurchases as any[]) {
    const amt = Number(k.amount || 0)
    const ptLabel = productTypeLabel(k.productType)
    revenueByType[ptLabel] = (revenueByType[ptLabel] || 0) + amt
    revenueByProduct[k.productTitle || ptLabel] = (revenueByProduct[k.productTitle || ptLabel] || 0) + amt
    productSales[ptLabel] = (productSales[ptLabel] || 0) + 1
    const day = new Date(k.generatedAt).toISOString().slice(0, 10)
    salesByDay[day] = (salesByDay[day] || 0) + 1
    emailsResent += (k.emailHistory || []).filter((e: any) => e.kind === 'resend').length
  }

  const totalRevenue = Object.values(revenueByType).reduce((a, b) => a + b, 0)

  // Segurança: tentativas suspeitas / bloqueadas
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const suspicious = await db.collection(SERIAL_KEY_SECURITY_LOGS).countDocuments({ createdAt: { $gte: since } })
  const recentSecurityLogs = await db.collection(SERIAL_KEY_SECURITY_LOGS)
    .find({}).sort({ createdAt: -1 }).limit(20).toArray()

  const toSeries = (obj: Record<string, number>) =>
    Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }))

  return NextResponse.json({
    rows,
    metrics: {
      totalGuest,
      totalGenerated,
      totalActivated,
      totalPending,
      activationRate,
      totalRevenue,
      emailsResent,
      suspiciousAttempts: suspicious,
    },
    charts: {
      revenueByProduct: toSeries(revenueByProduct).slice(0, 12),
      revenueByType: toSeries(revenueByType),
      salesByDay: Object.entries(salesByDay).sort((a, b) => a[0].localeCompare(b[0])).map(([label, value]) => ({ label, value })),
      productSales: toSeries(productSales),
    },
    securityLogs: recentSecurityLogs.map((l: any) => ({
      kind: l.kind, ip: l.ip, email: l.email, detail: l.detail, createdAt: l.createdAt,
    })),
  })
}
