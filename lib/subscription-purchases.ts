/**
 * Histórico de compras de assinaturas (planos Premium / Essential).
 *
 * As compras de plano vivem em duas coleções distintas e, até então, não
 * apareciam no "Histórico de Compras" (que só lia material_purchases e
 * manual_clinico_purchases):
 *
 *  - `subscriptions`   → assinaturas recorrentes (mensal/trimestral/anual)
 *                        criadas em POST /api/subscriptions.
 *  - `payment_orders`  → planos de pagamento único (ex.: vitalício),
 *                        type='plan' e status='approved'.
 *
 * Este módulo normaliza ambas as fontes num formato único consumido tanto
 * pelo perfil do usuário quanto pelo painel de admin, incluindo a validade
 * (expiresAt) de cada assinatura.
 */

import type { Db } from 'mongodb'
import type { SubscriptionRecord, PaymentOrder, PlanConfig } from './types'

export interface SubscriptionPurchaseEntry {
  _id: string
  purchaseType: 'subscription'
  itemType: 'subscription'
  itemTitle: string
  planLabel: string // "Premium" | "Essential" | "Trial" | "Assinatura"
  planKey: string | null
  role: string // 'premium' | 'essential' | 'trial'
  recurring: boolean
  subscriptionStatus?: string
  price: number
  purchasedAt: Date
  status: 'completed'
  accessType: 'recurring' | 'lifetime' | 'fixed'
  expiresAt: Date | null
}

function roleLabel(role?: string): string {
  switch (role) {
    case 'premium':
      return 'Premium'
    case 'essential':
      return 'Essential'
    case 'trial':
      return 'Trial'
    default:
      return 'Assinatura'
  }
}

function resolvePlan(planos: PlanConfig[], planId?: string): PlanConfig | undefined {
  if (!planId) return undefined
  return planos.find((p) => p.tipo === planId)
}

function periodoFromMonths(months?: number): string {
  switch (months) {
    case 1:
      return 'Plano Mensal'
    case 3:
      return 'Plano Trimestral'
    case 6:
      return 'Plano Semestral'
    case 12:
      return 'Plano Anual'
    default:
      return 'Assinatura'
  }
}

/**
 * Retorna as compras de assinatura/plano de um usuário, normalizadas.
 * `email` é usado apenas para casar payment_orders antigas vinculadas só pelo
 * e-mail do pagador (assinaturas recorrentes são sempre keyed por userId).
 */
export async function getSubscriptionPurchases(
  db: Db,
  opts: { userId?: string; email?: string }
): Promise<SubscriptionPurchaseEntry[]> {
  const { userId, email } = opts
  if (!userId && !email) return []

  const settings = await db.collection('admin_settings').findOne({})
  const planos = (settings?.planos || []) as PlanConfig[]

  // ── Assinaturas recorrentes (subscriptions) ──
  const subs: SubscriptionRecord[] = userId
    ? await db
        .collection<SubscriptionRecord>('subscriptions')
        .find({
          userId,
          // Apenas assinaturas que de fato geraram acesso/cobrança.
          status: { $in: ['authorized', 'paused', 'cancelled', 'past_due', 'expired'] },
        })
        .sort({ createdAt: -1 })
        .toArray()
    : []

  const subEntries: SubscriptionPurchaseEntry[] = subs.map((sub) => {
    const plano = resolvePlan(planos, sub.planId)
    const role = (sub.role || plano?.role || 'premium') as string
    const label = roleLabel(role)
    const periodo = plano?.periodo || periodoFromMonths(sub.billingIntervalMonths)
    const baseName = plano?.nome || `DomineAqui ${label}`
    return {
      _id: `sub_${String(sub._id)}`,
      purchaseType: 'subscription',
      itemType: 'subscription',
      itemTitle: `${baseName} — ${periodo}`,
      planLabel: label,
      planKey: sub.planId || null,
      role,
      recurring: true,
      subscriptionStatus: sub.status,
      price: Number(sub.amount || 0),
      purchasedAt: sub.createdAt,
      status: 'completed',
      accessType: 'recurring',
      expiresAt: sub.currentPeriodEndsAt || sub.nextBillingAt || null,
    }
  })

  // ── Planos de pagamento único (payment_orders type='plan' aprovados) ──
  const orConditions: any[] = []
  if (userId) orConditions.push({ userId })
  if (email) {
    const safeEmail = String(email).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    orConditions.push({ payerEmail: { $regex: new RegExp(`^${safeEmail}$`, 'i') } })
  }

  const planOrders: PaymentOrder[] = orConditions.length
    ? await db
        .collection<PaymentOrder>('payment_orders')
        .find({ type: 'plan', status: 'approved', $or: orConditions })
        .sort({ paidAt: -1, createdAt: -1 })
        .toArray()
    : []

  const orderEntries: SubscriptionPurchaseEntry[] = planOrders.map((order) => {
    const plano = resolvePlan(planos, order.refId)
    const role = (plano?.role || 'premium') as string
    const label = roleLabel(role)
    const periodo = plano?.periodo || 'Plano'
    const baseName = plano?.nome || `DomineAqui ${label}`
    const purchasedAt = order.paidAt || order.createdAt
    const durationMonths = plano?.durationMonths

    let expiresAt: Date | null = null
    let accessType: 'lifetime' | 'fixed' = 'lifetime'
    if (durationMonths && durationMonths > 0) {
      const exp = new Date(purchasedAt)
      exp.setMonth(exp.getMonth() + durationMonths)
      expiresAt = exp
      accessType = 'fixed'
    }

    return {
      _id: `order_${String(order._id)}`,
      purchaseType: 'subscription',
      itemType: 'subscription',
      itemTitle: `${baseName} — ${periodo}`,
      planLabel: label,
      planKey: order.refId || null,
      role,
      recurring: false,
      price: Number(order.amount || 0),
      purchasedAt,
      status: 'completed',
      accessType,
      expiresAt,
    }
  })

  return [...subEntries, ...orderEntries]
}
