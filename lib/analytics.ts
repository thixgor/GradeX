import { ObjectId } from 'mongodb'
import { getDb } from './mongodb'
import type { PaymentOrder, SubscriptionRecord } from './types'

export type CheckoutEventName =
  | 'lead_signup'
  | 'buy_click'
  | 'checkout_view'
  | 'checkout_submit'
  | 'order_created'
  | 'payment_approved'
  | 'payment_failed'
  | 'subscription_created'
  | 'subscription_cancelled'
  | 'subscription_expired'

export type AnalyticsProductType =
  | 'material'
  | 'flashcard'
  | 'package'
  | 'subscription'
  | 'plan'
  | 'donation'
  | 'product'
  | 'unknown'

export interface CheckoutEventRecord {
  _id?: string | ObjectId
  event: CheckoutEventName
  userId?: string
  userName?: string
  userEmail?: string
  productId?: string
  productTitle?: string
  productType: AnalyticsProductType
  amount?: number
  currency?: 'BRL'
  orderId?: string
  provider?: 'mercado_pago'
  providerPaymentId?: string
  providerSubscriptionId?: string
  paymentMethod?: string
  status?: string
  source?: string
  metadata?: Record<string, any>
  ip?: string
  userAgent?: string
  createdAt: Date
}

export function getRequestAnalyticsMeta(request?: Request) {
  if (!request) return {}
  return {
    ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined,
    userAgent: request.headers.get('user-agent') || undefined,
  }
}

export async function recordCheckoutEvent(input: Omit<CheckoutEventRecord, '_id' | 'createdAt'>) {
  try {
    const db = await getDb()
    await db.collection<CheckoutEventRecord>('checkout_events').insertOne({
      ...input,
      currency: input.currency || 'BRL',
      provider: input.provider || 'mercado_pago',
      createdAt: new Date(),
    })
  } catch (error) {
    console.error('[analytics] falha ao registrar evento:', error)
  }
}

export async function recordOrderCheckoutEvent(
  event: CheckoutEventName,
  order: PaymentOrder,
  extra: Partial<CheckoutEventRecord> = {}
) {
  await recordCheckoutEvent({
    event,
    userId: order.userId,
    userName: order.payerName,
    userEmail: order.payerEmail,
    productId: order.refId,
    productTitle: order.metadata?.itemTitle || order.metadata?.planName,
    productType: inferOrderProductType(order),
    amount: order.amount,
    orderId: String(order._id || extra.orderId || ''),
    providerPaymentId: order.providerPaymentId || order.providerOrderId,
    paymentMethod: order.paymentMethod,
    status: order.status,
    source: order.type === 'material' ? 'Compra direta' : order.type === 'plan' ? 'Assinatura' : order.type,
    metadata: {
      ...(order.metadata || {}),
      ...(extra.metadata || {}),
    },
    ...extra,
  })
}

export async function recordSubscriptionCheckoutEvent(
  event: CheckoutEventName,
  subscription: SubscriptionRecord,
  user?: { name?: string; email?: string },
  extra: Partial<CheckoutEventRecord> = {}
) {
  await recordCheckoutEvent({
    event,
    userId: subscription.userId,
    userName: user?.name,
    userEmail: user?.email,
    productId: subscription.planId,
    productTitle: subscription.planId,
    productType: 'subscription',
    amount: subscription.amount,
    providerSubscriptionId: subscription.providerSubscriptionId,
    status: subscription.status,
    source: 'Assinatura',
    metadata: {
      billingIntervalMonths: subscription.billingIntervalMonths,
      role: subscription.role,
      ...(extra.metadata || {}),
    },
    ...extra,
  })
}

export function inferOrderProductType(order: PaymentOrder): AnalyticsProductType {
  if (order.type === 'donation') return 'donation'
  if (order.type === 'subscription') return 'subscription'
  if (order.type === 'plan') return 'plan'
  if (order.type === 'product') return 'product'
  if (order.type === 'material') {
    if (order.metadata?.itemType === 'package') return 'package'
    if (order.metadata?.materialType === 'flashcard_deck' || order.refSlug || order.metadata?.linkedDeckSlug) {
      return 'flashcard'
    }
    return 'material'
  }
  return 'unknown'
}
