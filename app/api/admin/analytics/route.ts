import { NextResponse } from 'next/server'
import { formatarEmBrasilia, horaEmBrasilia, offsetDeBrasilia } from '@/lib/fuso-brasilia'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import type { AdminSettings, DonationPayment, Material, MaterialPackage, PaymentOrder, SubscriptionRecord, User } from '@/lib/types'
import type { CheckoutEventRecord } from '@/lib/analytics'
import type { Coupon, CouponRedemption } from '@/lib/coupons'
import { PLUS_TIER, getAccountTypeLabel, isPaidAccount, normalizeAccountType } from '@/lib/account-tier'
import {
  calcularReceitaRecorrente,
  classificarCobrancaDoPedido,
  type TipoDeCobranca,
} from '@/lib/payments/subscription-view'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type PeriodKey = 'day' | 'week' | 'month'
type DonationSource = 'platform' | 'bank_app' | 'admin' | 'unknown'

const APPROVED = new Set(['approved'])
const FAILED = new Set(['rejected', 'cancelled', 'expired', 'refunded', 'charged_back'])
const ACTIVE_SUBS = new Set(['authorized', 'pending', 'paused'])
const PLAN_CYCLE: Record<number, string> = { 1: 'Mensal', 3: 'Trimestral', 6: 'Semestral', 12: 'Anual' }

function serializeDate(value?: Date | string | null) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function normalizeText(value?: string | null) {
  return (value || '').toString().trim()
}

function formatDateKey(date: Date, period: PeriodKey) {
  if (period === 'day') return date.toISOString().slice(0, 10)
  if (period === 'month') return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  const weekStart = new Date(date)
  const day = weekStart.getDay()
  weekStart.setDate(weekStart.getDate() - day)
  weekStart.setHours(0, 0, 0, 0)
  return weekStart.toISOString().slice(0, 10)
}

/*
 * O rótulo do eixo, no fuso de quem lê o gráfico.
 *
 * `new Date(ano, mes, 1)` e `new Date("2026-05-10T00:00:00")` são lidos no fuso
 * de quem executa — o servidor, que roda em UTC. A chave "2026-05-10" virava
 * meia-noite UTC e o rótulo saía "09/05": o gráfico inteiro deslocado um dia
 * para trás.
 *
 * A chave já é uma data de calendário; o `T00:00:00-03:00` a ancora no dia que
 * ela realmente nomeia.
 */
function labelFromKey(key: string, period: PeriodKey) {
  if (period === 'month') {
    const [year, month] = key.split('-').map(Number)
    const primeiroDia = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00${offsetDeBrasilia()}`)
    return formatarEmBrasilia(primeiroDia, { month: 'short', year: '2-digit' })
  }
  return formatarEmBrasilia(new Date(`${key}T00:00:00${offsetDeBrasilia()}`), {
    day: '2-digit',
    month: '2-digit',
  })
}

function buildSeries<T>(
  items: T[],
  period: PeriodKey,
  getDate: (item: T) => Date | undefined,
  getValue: (item: T) => number
) {
  const buckets = new Map<string, { label: string; value: number; count: number }>()
  for (const item of items) {
    const date = getDate(item)
    if (!date || Number.isNaN(date.getTime())) continue
    const key = formatDateKey(date, period)
    const current = buckets.get(key) || { label: labelFromKey(key, period), value: 0, count: 0 }
    current.value += getValue(item)
    current.count += 1
    buckets.set(key, current)
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, bucket]) => ({ key, ...bucket }))
}

function sum(items: Array<{ amount?: number }>) {
  return items.reduce((total, item) => total + Number(item.amount || 0), 0)
}

function getUser(usersById: Map<string, User>, userId?: string) {
  return userId ? usersById.get(userId) : undefined
}

/**
 * Recorrente ou avulso — a distinção que o painel não fazia.
 *
 * Um plano pode ser vendido de dois jeitos, e os dois valem o mesmo dinheiro
 * na primeira cobrança e nada parecido depois:
 *
 *  - RECORRENTE: preapproval do Mercado Pago, na coleção `subscriptions`.
 *    Renova sozinho, entra no MRR, tem churn.
 *  - AVULSO: `payment_orders` com `type: 'plan'` (o modo "Pagamento único" do
 *    /buy/checkout) ou uma Serial Key comprada em /comprar. Cobra uma vez,
 *    nunca renova e não tem o que cancelar.
 *
 * O painel chamava os dois de "Assinatura", com a mesma origem "Assinatura".
 * Na tabela de pedidos e no gráfico de receita por tipo eles se misturavam, e
 * não havia como responder "quanto dessa receita volta mês que vem?" — que é a
 * única pergunta que a diferença existe para responder.
 */
/**
 * `checkout_events` guarda o productType em código ('plan', 'subscription',
 * 'material'…), e a lista de abandonos mostrava esses códigos crus. Desde que
 * o /buy/checkout passou a distinguir o modo escolhido, 'plan' e 'subscription'
 * chegam separados aqui — e vale traduzir os dois para o mesmo vocabulário das
 * outras tabelas, em vez de expor o código do banco.
 */
const ROTULO_DE_EVENTO: Record<string, { label: string; recurrence: TipoDeCobranca }> = {
  subscription: { label: 'Assinatura', recurrence: 'recorrente' },
  plan: { label: 'Plano avulso', recurrence: 'avulso' },
  material: { label: 'Material', recurrence: 'avulso' },
  flashcard: { label: 'Flashcard', recurrence: 'avulso' },
  package: { label: 'Pacote', recurrence: 'avulso' },
  donation: { label: 'Doação', recurrence: 'avulso' },
  product: { label: 'Produto', recurrence: 'avulso' },
  unknown: { label: 'Não identificado', recurrence: 'avulso' },
}

function rotuloDeEvento(productType?: string) {
  return ROTULO_DE_EVENTO[productType || 'unknown'] || {
    label: productType || 'Não identificado',
    recurrence: 'avulso' as TipoDeCobranca,
  }
}

function inferOrderProduct(
  order: PaymentOrder,
  materialsById: Map<string, Material>,
  packagesById: Map<string, MaterialPackage>,
  settings?: AdminSettings | null
) {
  if (order.type === 'plan') {
    const plan = (settings?.planos || []).find((item) => item.tipo === order.refId)
    return {
      title: plan?.nome || order.metadata?.planName || order.refId || 'Plano',
      // `type: 'plan'` em payment_orders é SEMPRE o pagamento único: a
      // recorrência não passa por /api/payments/orders, ela vira preapproval.
      type: 'Plano avulso',
      typeKey: 'plan_one_time',
      origin: 'Plano avulso',
      recurrence: classificarCobrancaDoPedido(order.type),
    }
  }

  if (order.type === 'subscription') {
    return {
      title: order.metadata?.planName || order.refId || 'Assinatura',
      type: 'Assinatura',
      typeKey: 'subscription',
      origin: 'Assinatura recorrente',
      recurrence: classificarCobrancaDoPedido(order.type),
    }
  }

  if (order.type === 'material') {
    if (order.metadata?.itemType === 'package') {
      const pkg = order.refId ? packagesById.get(order.refId) : undefined
      return {
        title: pkg?.title || order.metadata?.itemTitle || 'Pacote',
        type: 'Pacote',
        typeKey: 'package',
        origin: 'Pacote',
        recurrence: 'avulso' as TipoDeCobranca,
      }
    }

    const material = order.refId ? materialsById.get(order.refId) : undefined
    const isFlashcard = (material?.type as string | undefined) === 'flashcard_deck' || !!order.refSlug || !!order.metadata?.linkedDeckSlug
    return {
      title: material?.title || order.metadata?.itemTitle || (isFlashcard ? 'Flashcard' : 'Material'),
      type: isFlashcard ? 'Flashcard' : 'Material',
      typeKey: isFlashcard ? 'flashcard' : 'material',
      origin: 'Compra direta',
      recurrence: 'avulso' as TipoDeCobranca,
    }
  }

  return {
    title: order.metadata?.itemTitle || order.refId || 'Pedido',
    type: order.type === 'donation' ? 'Doação' : 'Pedido',
    typeKey: order.type || 'unknown',
    origin: order.type === 'donation' ? 'Doação' : 'Compra direta',
    recurrence: 'avulso' as TipoDeCobranca,
  }
}

function statusLabel(status?: string) {
  const labels: Record<string, string> = {
    pending: 'Pendente',
    in_process: 'Pendente',
    approved: 'Pago',
    rejected: 'Rejeitado',
    cancelled: 'Cancelado',
    expired: 'Expirado',
    refunded: 'Cancelado',
    charged_back: 'Cancelado',
    authorized: 'Ativa',
    paused: 'Pendente',
    past_due: 'Pendente',
  }
  return labels[status || ''] || 'Criado'
}

function cancellationRate(cancelled: number, total: number) {
  return total > 0 ? (cancelled / total) * 100 : 0
}

function donationSourceLabel(source: DonationSource) {
  const labels: Record<DonationSource, string> = {
    platform: 'Plataforma',
    bank_app: 'App do banco',
    admin: 'Admin/manual',
    unknown: 'Não informado',
  }
  return labels[source]
}

function inferDonationSource(donation: any): DonationSource {
  if (donation.paymentSource === 'online' || donation.provider === 'mercado_pago' || donation.providerOrderId || donation.providerPaymentId) {
    return 'platform'
  }
  if (donation.paymentSource === 'manual') return donation.addedByAdmin ? 'admin' : 'bank_app'
  if (donation.addedByAdmin) return 'admin'
  return 'unknown'
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const db = await getDb()
    const since = new Date()
    since.setFullYear(since.getFullYear() - 1)
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const [
      orders,
      subscriptions,
      users,
      materials,
      packages,
      settings,
      checkoutEvents,
      serialKeys,
      auditLogs,
      donations,
      donationPayments,
      coupons,
      couponRedemptions,
    ] = await Promise.all([
      db.collection<PaymentOrder>('payment_orders').find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(1000).toArray(),
      db.collection<SubscriptionRecord>('subscriptions').find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(1000).toArray(),
      db.collection<User>('users').find({}).project({ password: 0 }).toArray() as Promise<User[]>,
      db.collection<Material>('materials').find({}).project({ title: 1, type: 1, price: 1 }).toArray(),
      db.collection<MaterialPackage>('material_packages').find({}).project({ title: 1, price: 1 }).toArray(),
      db.collection<AdminSettings>('admin_settings').findOne({}),
      db.collection<CheckoutEventRecord>('checkout_events').find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(3000).toArray(),
      db.collection('serial_keys').find({ used: true }).project({ usedBy: 1, usedAt: 1, price: 1, premiumSubtype: 1, type: 1 }).toArray(),
      db.collection('audit_logs').find({ ts: { $gte: since }, action: { $in: ['subscription_canceled', 'subscription_expired', 'role_revoked'] } }).sort({ ts: -1 }).limit(500).toArray(),
      db.collection('doacoes').find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(1000).toArray(),
      db.collection<DonationPayment>('donation_payments').find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(1000).toArray(),
      db.collection<Coupon>('coupons').find({}).project({ code: 1, codeNormalized: 1, description: 1, usageLimit: 1, usageCount: 1, isActive: 1 }).toArray(),
      db.collection<CouponRedemption>('coupon_redemptions').find({
        status: 'approved',
        $or: [
          { approvedAt: { $gte: since } },
          { approvedAt: { $exists: false }, createdAt: { $gte: since } },
        ],
      } as any).sort({ approvedAt: -1, createdAt: -1 }).limit(5000).toArray(),
    ])

    const usersById = new Map(users.map((user) => [String(user._id), user]))
    const materialsById = new Map(materials.map((item: any) => [String(item._id), item as Material]))
    const packagesById = new Map(packages.map((item: any) => [String(item._id), item as MaterialPackage]))
    const serialByUser = new Map(serialKeys.map((key: any) => [String(key.usedBy), key]))
    const plansById = new Map((settings?.planos || []).map((plan) => [plan.tipo, plan]))
    const couponsById = new Map(coupons.map((coupon: any) => [String(coupon._id), coupon as Coupon]))

    const approvedOrders = orders.filter((order) => APPROVED.has(order.status) && order.type !== 'donation')
    const paidSubscriptionRecords = subscriptions.filter((sub) => sub.status === 'authorized')
    const recurringOrders = approvedOrders.filter((order) => order.type === 'subscription')
    const approvedNonRecurring = approvedOrders.filter((order) => order.type !== 'subscription')

    const virtualSubscriptionSales = paidSubscriptionRecords
      .filter((sub) => !recurringOrders.some((order) => order.refId === sub.providerSubscriptionId))
      .map((sub) => {
        const user = getUser(usersById, sub.userId)
        const plan = plansById.get(sub.planId)
        return {
          id: `sub-${sub.providerSubscriptionId}`,
          amount: sub.amount,
          createdAt: sub.lastPaymentAt || sub.createdAt,
          productTitle: plan?.nome || sub.planId,
          productType: 'Assinatura',
          typeKey: 'subscription',
          recurrence: 'recorrente' as TipoDeCobranca,
          userName: user?.name || '',
          userEmail: user?.email || '',
        }
      })

    const revenueItems = [
      ...approvedNonRecurring.map((order) => {
        const product = inferOrderProduct(order, materialsById, packagesById, settings)
        return {
          id: String(order._id),
          amount: order.amount,
          createdAt: order.paidAt || order.updatedAt || order.createdAt,
          productTitle: product.title,
          productType: product.type,
          typeKey: product.typeKey,
          recurrence: product.recurrence,
          userName: order.payerName || getUser(usersById, order.userId)?.name || '',
          userEmail: order.payerEmail || getUser(usersById, order.userId)?.email || '',
        }
      }),
      ...virtualSubscriptionSales,
    ]

    const totalRevenue = sum(revenueItems)
    const monthRevenue = sum(revenueItems.filter((item) => new Date(item.createdAt) >= monthStart))
    const weekRevenue = sum(revenueItems.filter((item) => new Date(item.createdAt) >= weekStart))
    const totalSales = revenueItems.length
    const activeSubscriptions = subscriptions.filter((sub) => ACTIVE_SUBS.has(sub.status) && (!sub.currentPeriodEndsAt || new Date(sub.currentPeriodEndsAt) >= now))
    const cancelledSubscriptions = subscriptions.filter((sub) => sub.status === 'cancelled' || !!sub.canceledAt || sub.cancelAtPeriodEnd)
    const pendingOrders = orders.filter((order) => ['pending', 'in_process'].includes(order.status)).length
    const abandonedOrders = orders.filter((order) => !APPROVED.has(order.status) && new Date(order.createdAt).getTime() <= now.getTime() - 30 * 60_000)

    const productStats = new Map<string, { label: string; type: string; sales: number; revenue: number }>()
    const typeStats = new Map<string, { label: string; value: number; count: number }>()
    for (const item of revenueItems) {
      const productKey = `${item.productType}:${item.productTitle}`
      const product = productStats.get(productKey) || { label: item.productTitle, type: item.productType, sales: 0, revenue: 0 }
      product.sales += 1
      product.revenue += item.amount
      productStats.set(productKey, product)

      const type = typeStats.get(item.productType) || { label: item.productType, value: 0, count: 0 }
      type.value += item.amount
      type.count += 1
      typeStats.set(item.productType, type)
    }

    const planStats = new Map<string, { label: string; count: number; revenue: number }>()
    for (const sub of subscriptions) {
      const plan = plansById.get(sub.planId)
      const label = plan?.nome || sub.planId
      const current = planStats.get(label) || { label, count: 0, revenue: 0 }
      current.count += 1
      current.revenue += Number(sub.amount || 0)
      planStats.set(label, current)
    }
    for (const order of approvedOrders.filter((item) => item.type === 'plan')) {
      const plan = plansById.get(order.refId || '')
      const label = plan?.nome || order.refId || 'Plano'
      const current = planStats.get(label) || { label, count: 0, revenue: 0 }
      current.count += 1
      current.revenue += Number(order.amount || 0)
      planStats.set(label, current)
    }

    const topProduct = [...productStats.values()].sort((a, b) => b.sales - a.sales)[0]?.label || 'Sem vendas'
    const topPlan = [...planStats.values()].sort((a, b) => b.count - a.count)[0]?.label || 'Sem assinaturas'

    const couponStatsMap = new Map<string, {
      couponId: string
      code: string
      description: string
      uses: number
      users: Set<string>
      revenueAttributed: number
      discountGiven: number
      lastUsedAt: Date | null
      usageLimit?: number | null
      usageCount?: number
      isActive?: boolean
    }>()

    for (const coupon of coupons as Coupon[]) {
      const couponId = String(coupon._id)
      couponStatsMap.set(couponId, {
        couponId,
        code: coupon.codeNormalized || coupon.code,
        description: coupon.description || '',
        uses: 0,
        users: new Set<string>(),
        revenueAttributed: 0,
        discountGiven: 0,
        lastUsedAt: null,
        usageLimit: coupon.usageLimit ?? null,
        usageCount: Number(coupon.usageCount || 0),
        isActive: coupon.isActive !== false,
      })
    }

    for (const redemption of couponRedemptions as CouponRedemption[]) {
      const coupon = couponsById.get(String(redemption.couponId))
      const key = String(redemption.couponId || redemption.code)
      const current = couponStatsMap.get(key) || {
        couponId: String(redemption.couponId || ''),
        code: redemption.code || coupon?.codeNormalized || coupon?.code || 'Cupom',
        description: coupon?.description || '',
        uses: 0,
        users: new Set<string>(),
        revenueAttributed: 0,
        discountGiven: 0,
        lastUsedAt: null,
        usageLimit: coupon?.usageLimit ?? null,
        usageCount: Number(coupon?.usageCount || 0),
        isActive: coupon?.isActive !== false,
      }
      current.uses += 1
      current.users.add(redemption.userId || redemption.userEmail || String(redemption._id))
      current.revenueAttributed += Number(redemption.amountAfterCoupon || 0)
      current.discountGiven += Number(redemption.discountAmount || 0)
      const usedAt = redemption.approvedAt || redemption.createdAt
      if (usedAt && (!current.lastUsedAt || new Date(usedAt) > current.lastUsedAt)) {
        current.lastUsedAt = new Date(usedAt)
      }
      couponStatsMap.set(key, current)
    }

    const couponStats = [...couponStatsMap.values()]
      .map((stat) => ({
        couponId: stat.couponId,
        code: stat.code,
        description: stat.description,
        uses: stat.uses,
        uniqueUsers: stat.users.size,
        revenueAttributed: stat.revenueAttributed,
        discountGiven: stat.discountGiven,
        lastUsedAt: serializeDate(stat.lastUsedAt),
        usageLimit: stat.usageLimit ?? null,
        usageCount: stat.usageCount || 0,
        isActive: stat.isActive !== false,
      }))
      .sort((a, b) => b.revenueAttributed - a.revenueAttributed || b.uses - a.uses)

    const publicDonationOrderIds = new Set(donations.map((donation: any) => String(donation.providerOrderId || '')).filter(Boolean))
    const donationRows = [
      ...donations.map((donation: any) => {
        const source = inferDonationSource(donation)
        const user = getUser(usersById, donation.userId)
        return {
          id: String(donation._id),
          donorName: normalizeText(donation.apelido || donation.nomeCompleto || user?.name || 'Anônimo'),
          donorEmail: normalizeText(donation.email || user?.email || ''),
          value: Number(donation.valor || donation.amount || 0),
          status: statusLabel(donation.status),
          rawStatus: donation.status || 'approved',
          source,
          sourceLabel: donationSourceLabel(source),
          paymentMethod: donation.paymentMethod || (source === 'bank_app' ? 'pix_banco' : source === 'platform' ? 'mercado_pago' : 'manual'),
          mercadoPagoPaymentId: donation.providerPaymentId || '',
          mercadoPagoOrderId: donation.providerOrderId || '',
          message: donation.mensagem || '',
          donatedAt: serializeDate(donation.dataDoacao || donation.paidAt || donation.createdAt),
          createdAt: serializeDate(donation.createdAt),
        }
      }),
      ...donationPayments
        .filter((payment) => !payment.publicDoacaoId && !publicDonationOrderIds.has(payment.providerOrderId))
        .map((payment) => {
          const source: DonationSource = 'platform'
          const user = getUser(usersById, payment.userId)
          return {
            id: String(payment._id),
            donorName: normalizeText(payment.apelido || payment.nomeCompleto || user?.name || 'Anônimo'),
            donorEmail: normalizeText(payment.email || user?.email || ''),
            value: Number(payment.amount || 0),
            status: statusLabel(payment.status),
            rawStatus: payment.status || 'pending',
            source,
            sourceLabel: donationSourceLabel(source),
            paymentMethod: payment.paymentMethod || 'mercado_pago',
            mercadoPagoPaymentId: payment.providerPaymentId || '',
            mercadoPagoOrderId: payment.providerOrderId || '',
            message: payment.mensagem || '',
            donatedAt: serializeDate(payment.paidAt || payment.createdAt),
            createdAt: serializeDate(payment.createdAt),
          }
        }),
    ].sort((a, b) => new Date(b.createdAt || b.donatedAt || 0).getTime() - new Date(a.createdAt || a.donatedAt || 0).getTime())

    const approvedDonations = donationRows.filter((donation) => donation.rawStatus === 'approved' || donation.status === 'Pago')
    const donationSourceStats = new Map<DonationSource, { label: string; value: number; count: number }>()
    for (const donation of approvedDonations) {
      const current = donationSourceStats.get(donation.source) || { label: donation.sourceLabel, value: 0, count: 0 }
      current.value += donation.value
      current.count += 1
      donationSourceStats.set(donation.source, current)
    }

    const checkoutEventRows = checkoutEvents.map((event) => ({
      id: String(event._id),
      event: event.event,
      userId: event.userId || '',
      userName: event.userName || '',
      userEmail: event.userEmail || '',
      productId: event.productId || '',
      productTitle: event.productTitle || '',
      productType: event.productType,
      amount: Number(event.amount || 0),
      orderId: event.orderId || '',
      status: event.status || '',
      source: event.source || '',
      couponCode: normalizeText(event.metadata?.couponCode),
      couponDiscountAmount: Number(event.metadata?.couponDiscountAmount || 0),
      createdAt: serializeDate(event.createdAt),
    }))

    const orderRows = orders.map((order) => {
      const product = inferOrderProduct(order, materialsById, packagesById, settings)
      const user = getUser(usersById, order.userId)
      return {
        id: String(order._id),
        userName: order.payerName || user?.name || '',
        userEmail: order.payerEmail || user?.email || '',
        product: product.title,
        productType: product.type,
        /** 'recorrente' = renova sozinho; 'avulso' = cobra uma vez e acabou. */
        recurrence: product.recurrence,
        value: Number(order.amount || 0),
        status: statusLabel(order.status),
        rawStatus: order.status,
        paymentMethod: order.paymentMethod || 'unknown',
        mercadoPagoPaymentId: order.providerPaymentId || order.providerOrderId || '',
        mercadoPagoPreferenceId: order.providerOrderId || '',
        createdAt: serializeDate(order.createdAt),
        paidAt: serializeDate(order.paidAt),
        endedAt: serializeDate(FAILED.has(order.status) ? order.updatedAt : null),
        origin: product.origin,
        couponCode: normalizeText(order.metadata?.couponCode),
        couponDiscountAmount: Number(order.metadata?.couponDiscountAmount || 0),
        couponAmountBefore: Number(order.metadata?.couponAmountBefore || 0),
      }
    })

    const subscriptionRows = [
      ...subscriptions.map((sub) => {
        const user = getUser(usersById, sub.userId)
        const plan = plansById.get(sub.planId)
        return {
          id: String(sub._id || sub.providerSubscriptionId),
          userName: user?.name || '',
          userEmail: user?.email || '',
          plan: plan?.nome || sub.planId,
          // O cargo que a assinatura concede, e não "Plus+" fixo: Quest+ cobra
          // pelo mesmo caminho e aparecia nesta tabela como se fosse Plus+.
          // Registro antigo sem `role` e plano já removido do catálogo caem no
          // Plus+, que era o único cargo recorrente quando foram gravados.
          type: getAccountTypeLabel(normalizeAccountType(sub.role || plan?.role || PLUS_TIER)),
          cycle: PLAN_CYCLE[sub.billingIntervalMonths] || `${sub.billingIntervalMonths} meses`,
          value: Number(sub.amount || 0),
          purchasedAt: serializeDate(sub.createdAt),
          expiresAt: serializeDate(sub.currentPeriodEndsAt),
          status: statusLabel(sub.status),
          rawStatus: sub.status,
          origin: 'MercadoPago',
          // Preapproval: é a única linha desta tabela que cobra de novo sozinha.
          recurrence: 'recorrente' as TipoDeCobranca,
          autoRenew: !sub.cancelAtPeriodEnd,
          /** Cancelada mas ainda vigente — não renova, e o acesso corre até vencer. */
          cancelAtPeriodEnd: !!sub.cancelAtPeriodEnd,
          lastPaymentAt: serializeDate(sub.lastPaymentAt),
          nextBillingAt: serializeDate(sub.nextBillingAt),
          canceledAt: serializeDate(sub.canceledAt),
        }
      }),
      ...users
        // `isPaidAccount`: a concessão manual e a Serial Key também dão Quest+,
        // e o filtro por Plus+ deixava essas contas fora da tabela inteira.
        .filter((user) => isPaidAccount(user.accountType) && !subscriptions.some((sub) => sub.userId === String(user._id)))
        .map((user) => {
          const key = serialByUser.get(String(user._id)) as any
          return {
            id: `user-${String(user._id)}`,
            userName: user.name || '',
            userEmail: user.email || '',
            plan: user.premiumPlanType || user.accountType || 'manual',
            type: getAccountTypeLabel(normalizeAccountType(user.accountType)),
            cycle: user.premiumPlanType === 'vitalicio' ? 'Vitalício' : 'Manual',
            value: Number(user.premiumPrice || key?.price || 0),
            purchasedAt: serializeDate(user.premiumActivatedAt || user.createdAt),
            expiresAt: serializeDate(user.premiumExpiresAt),
            status: user.premiumExpiresAt && new Date(user.premiumExpiresAt) < now ? 'Expirada' : 'Ativa',
            rawStatus: 'manual',
            origin: key ? 'Serial key' : 'Atribuição manual/admin',
            // Serial Key e concessão manual dão o mesmo cargo, mas nunca
            // cobram de novo — apareciam nesta tabela lado a lado com as
            // recorrentes, distinguidas só por um "Não" na coluna "Renova".
            recurrence: 'avulso' as TipoDeCobranca,
            autoRenew: false,
            cancelAtPeriodEnd: false,
            lastPaymentAt: serializeDate(user.premiumActivatedAt),
            nextBillingAt: null,
            canceledAt: null,
          }
        }),
    ]

    const cancellationRows = cancelledSubscriptions.map((sub) => {
      const user = getUser(usersById, sub.userId)
      const plan = plansById.get(sub.planId)
      const bought = new Date(sub.createdAt)
      const cancelled = sub.canceledAt ? new Date(sub.canceledAt) : new Date(sub.updatedAt)
      const days = Math.max(0, Math.round((cancelled.getTime() - bought.getTime()) / 86_400_000))
      return {
        id: String(sub._id || sub.providerSubscriptionId),
        userName: user?.name || '',
        userEmail: user?.email || '',
        plan: plan?.nome || sub.planId,
        purchasedAt: serializeDate(sub.createdAt),
        canceledAt: serializeDate(sub.canceledAt || sub.updatedAt),
        subscriberDays: days,
        value: Number(sub.amount || 0),
        reason: sub.status === 'past_due' ? 'Pagamento falhou' : sub.status === 'expired' ? 'Assinatura expirou' : 'Cancelamento registrado',
        origin: sub.cancelAtPeriodEnd ? 'Usuário cancelou' : sub.status === 'expired' ? 'Assinatura expirou' : 'MercadoPago cancelou',
      }
    })

    const abandonedRows = [
      ...abandonedOrders.slice(0, 200).map((order) => {
        const product = inferOrderProduct(order, materialsById, packagesById, settings)
        const relatedEvents = checkoutEvents.filter((event) => event.orderId === String(order._id))
        const lastEvent = relatedEvents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        return {
          id: String(order._id),
          userName: order.payerName || getUser(usersById, order.userId)?.name || '',
          userEmail: order.payerEmail || getUser(usersById, order.userId)?.email || '',
          product: product.title,
          productType: product.type,
          recurrence: product.recurrence,
          value: Number(order.amount || 0),
          startedAt: serializeDate(order.createdAt),
          lastStage: lastEvent?.event || 'order_created',
          minutesSinceAbandonment: Math.max(0, Math.round((now.getTime() - new Date(order.updatedAt || order.createdAt).getTime()) / 60_000)),
          sentence: `${order.payerName || 'Usuário'} abriu checkout de ${product.title} às ${horaEmBrasilia(order.createdAt)}, mas não pagou.`,
        }
      }),
      ...checkoutEvents
        .filter((event) => ['buy_click', 'checkout_view', 'checkout_submit'].includes(event.event) && !event.orderId && new Date(event.createdAt).getTime() <= now.getTime() - 30 * 60_000)
        .slice(0, 100)
        .map((event) => ({
          id: String(event._id),
          userName: event.userName || '',
          userEmail: event.userEmail || '',
          product: event.productTitle || 'Produto',
          productType: rotuloDeEvento(event.productType).label,
          recurrence: rotuloDeEvento(event.productType).recurrence,
          value: Number(event.amount || 0),
          startedAt: serializeDate(event.createdAt),
          lastStage: event.event,
          minutesSinceAbandonment: Math.max(0, Math.round((now.getTime() - new Date(event.createdAt).getTime()) / 60_000)),
          sentence: `${event.userName || 'Usuário'} demonstrou intenção em ${event.productTitle || 'um produto'}, mas não chegou ao pagamento.`,
        })),
    ]

    /*
     * MRR estimado — só o que REALMENTE vai cobrar de novo.
     *
     * `activeSubscriptions` inclui assinaturas já canceladas: o cancelamento
     * grava `cancelAtPeriodEnd` e MANTÉM `status: 'authorized'` de propósito,
     * porque é o que preserva o acesso até o fim do período pago. Somar essas
     * no MRR inflava a projeção justamente com quem acabou de sair — o número
     * subia quando deveria cair.
     */
    const recorrencia = calcularReceitaRecorrente(activeSubscriptions)
    const renewEstimate = recorrencia.total
    const canceladasAindaVigentes = recorrencia.canceladasVigentes

    /*
     * A receita de planos partida em duas: a que volta e a que não volta.
     * É a leitura que o painel não permitia — "Assinatura" cobria os dois.
     */
    const receitaDePlanos = revenueItems.filter(
      (item) => item.typeKey === 'subscription' || item.typeKey === 'plan_one_time'
    )
    const planRevenueSplit = {
      recurring: {
        count: receitaDePlanos.filter((item) => item.recurrence === 'recorrente').length,
        revenue: sum(receitaDePlanos.filter((item) => item.recurrence === 'recorrente')),
      },
      oneTime: {
        count: receitaDePlanos.filter((item) => item.recurrence === 'avulso').length,
        revenue: sum(receitaDePlanos.filter((item) => item.recurrence === 'avulso')),
      },
    }
    const expiring7 = subscriptionRows.filter((row) => row.expiresAt && new Date(row.expiresAt) <= new Date(now.getTime() + 7 * 86_400_000) && new Date(row.expiresAt) >= now).length
    const expiring30 = subscriptionRows.filter((row) => row.expiresAt && new Date(row.expiresAt) <= new Date(now.getTime() + 30 * 86_400_000) && new Date(row.expiresAt) >= now).length

    const funnelCounts = {
      leadSignup: checkoutEvents.filter((event) => event.event === 'lead_signup').length,
      buyClick: checkoutEvents.filter((event) => event.event === 'buy_click').length,
      checkoutSubmit: checkoutEvents.filter((event) => event.event === 'checkout_submit').length,
      orderCreated: orders.length + subscriptions.length,
      paymentApproved: revenueItems.length,
      paymentFailed: orders.filter((order) => FAILED.has(order.status)).length + checkoutEvents.filter((event) => event.event === 'payment_failed').length,
    }
    // payment_failed é um desfecho paralelo (não uma etapa depois de "aprovado"),
    // então fica de fora da cadeia sequencial — encadeá-lo gerava conversões
    // "da etapa anterior" acima de 100% (parecia que o funil estava quebrado).
    // "lead_signup" (conta grátis criada) é o topo real do funil de ADS: mostra
    // a jornada completa do teste grátis até a compra.
    const funnel = [
      { key: 'lead_signup', label: 'Criou conta grátis (teste grátis)', count: funnelCounts.leadSignup },
      { key: 'buy_click', label: 'Usuário clicou para comprar', count: funnelCounts.buyClick },
      { key: 'checkout_submit', label: 'Usuário clicou em finalizar compra', count: funnelCounts.checkoutSubmit },
      { key: 'order_created', label: 'Pedido foi criado no MercadoPago', count: funnelCounts.orderCreated },
      { key: 'payment_approved', label: 'Pagamento foi aprovado', count: funnelCounts.paymentApproved },
    ].map((step, index, all) => ({
      ...step,
      conversionFromPrevious: index === 0 ? 100 : all[index - 1].count > 0 ? (step.count / all[index - 1].count) * 100 : 0,
      conversionFromStart: all[0].count > 0 ? (step.count / all[0].count) * 100 : 0,
    }))
    const funnelFailed = funnelCounts.paymentFailed
    // Conversão geral do funil de aquisição: cadastros grátis que viraram venda.
    const leadToSaleRate = funnelCounts.leadSignup > 0
      ? (funnelCounts.paymentApproved / funnelCounts.leadSignup) * 100
      : 0
    // Estado do rastreamento de conversão do Meta (para o admin saber se o
    // Pixel/Conversions API estão ligados). O ID do Pixel é público; o token do
    // CAPI é secreto — aqui só expomos se ESTÁ configurado, nunca os valores.
    const tracking = {
      metaPixel: Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID),
      metaCapi: Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID && process.env.META_CONVERSIONS_API_TOKEN),
      leadSignups: funnelCounts.leadSignup,
      leadToSaleRate,
    }

    return NextResponse.json({
      updatedAt: now.toISOString(),
      cards: {
        totalRevenue,
        monthRevenue,
        weekRevenue,
        totalSales,
        activeSubscriptions: activeSubscriptions.length,
        cancellations: cancelledSubscriptions.length,
        cancellationRate: cancellationRate(cancelledSubscriptions.length, Math.max(subscriptions.length, 1)),
        pendingOrders,
        abandonedCheckouts: abandonedRows.length,
        topProduct,
        topPlan,
      },
      donationSummary: {
        totalApproved: approvedDonations.reduce((total, donation) => total + donation.value, 0),
        platformTotal: approvedDonations.filter((donation) => donation.source === 'platform').reduce((total, donation) => total + donation.value, 0),
        bankAppTotal: approvedDonations.filter((donation) => donation.source === 'bank_app').reduce((total, donation) => total + donation.value, 0),
        adminTotal: approvedDonations.filter((donation) => donation.source === 'admin').reduce((total, donation) => total + donation.value, 0),
        approvedCount: approvedDonations.length,
        pendingCount: donationRows.filter((donation) => ['pending', 'in_process'].includes(donation.rawStatus)).length,
      },
      charts: {
        salesByDay: buildSeries(revenueItems, 'day', (item) => new Date(item.createdAt), () => 1).slice(-30),
        salesByWeek: buildSeries(revenueItems, 'week', (item) => new Date(item.createdAt), () => 1).slice(-12),
        salesByMonth: buildSeries(revenueItems, 'month', (item) => new Date(item.createdAt), () => 1).slice(-12),
        revenueByPeriod: buildSeries(revenueItems, 'month', (item) => new Date(item.createdAt), (item) => item.amount).slice(-12),
        productSales: [...productStats.values()].sort((a, b) => b.sales - a.sales).slice(0, 12).map((item) => ({ label: item.label, value: item.sales, type: item.type })),
        productRevenue: [...productStats.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 12).map((item) => ({ label: item.label, value: item.revenue, type: item.type })),
        revenueByType: [...typeStats.values()].map((item) => ({ label: item.label, value: item.value, count: item.count })),
        subscriptionNew: buildSeries(subscriptions, 'month', (item) => new Date(item.createdAt), () => 1).slice(-12),
        subscriptionActive: [
          { label: 'Ativas', value: activeSubscriptions.length },
          { label: 'Canceladas', value: cancelledSubscriptions.length },
          { label: 'Pendentes', value: subscriptions.filter((sub) => sub.status === 'pending').length },
          { label: 'Expiradas', value: subscriptions.filter((sub) => sub.status === 'expired').length },
        ],
        subscriptionCancelled: buildSeries(cancelledSubscriptions, 'month', (item) => item.canceledAt ? new Date(item.canceledAt) : new Date(item.updatedAt), () => 1).slice(-12),
        planSales: [...planStats.values()].sort((a, b) => b.count - a.count).slice(0, 10).map((item) => ({ label: item.label, value: item.count, revenue: item.revenue })),
        churn: buildSeries(cancelledSubscriptions, 'month', (item) => item.canceledAt ? new Date(item.canceledAt) : new Date(item.updatedAt), () => 1).slice(-12),
        donationsByPeriod: buildSeries(approvedDonations, 'month', (item) => item.donatedAt ? new Date(item.donatedAt) : undefined, (item) => item.value).slice(-12),
        donationsBySource: [...donationSourceStats.values()].map((item) => ({ label: item.label, value: item.value, count: item.count })),
      },
      subscriptionSummary: {
        active: activeSubscriptions.length,
        expiring7,
        expiring30,
        cancelled: cancelledSubscriptions.length,
        cancellationRate: cancellationRate(cancelledSubscriptions.length, Math.max(subscriptions.length, 1)),
        estimatedRecurringRevenue: renewEstimate,
        /** Vigentes que renovam de fato (base do MRR acima). */
        renewing: recorrencia.renovando,
        /** Vigentes já canceladas: contam como ativas hoje, mas não renovam. */
        cancelledStillActive: canceladasAindaVigentes,
      },
      planRevenueSplit,
      couponStats,
      funnel,
      funnelFailed,
      tracking,
      orders: orderRows,
      abandoned: abandonedRows.sort((a, b) => new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime()).slice(0, 250),
      subscriptions: subscriptionRows.sort((a, b) => new Date(b.purchasedAt || 0).getTime() - new Date(a.purchasedAt || 0).getTime()).slice(0, 500),
      cancellations: cancellationRows,
      donations: donationRows.slice(0, 500),
      checkoutEvents: checkoutEventRows.slice(0, 500),
      audit: auditLogs.map((log: any) => ({
        id: String(log._id),
        action: log.action,
        targetUserId: log.targetUserId,
        createdAt: serializeDate(log.ts),
        metadata: log.metadata || {},
      })),
    })
  } catch (error: any) {
    console.error('Erro ao buscar analytics:', error)
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}
