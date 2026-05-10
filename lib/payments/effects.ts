/**
 * Aplicação idempotente dos efeitos de um pagamento aprovado/recusado/etc.
 *
 * Chamado tanto pelo webhook quanto pelos endpoints de criação que recebem
 * resposta imediata com status `approved` (ex.: cartão aprovado na hora).
 *
 * Toda lógica que libera benefício passa por aqui — nunca confiamos no client.
 */

import { ObjectId } from 'mongodb'
import { getDb } from '../mongodb'
import { sendPlanPurchasedEmail } from '../mail'
import { getPersonalExamsQuota } from '../tier-limits'
import type {
  PaymentOrder,
  PaymentRecord,
  SubscriptionRecord,
  DonationPayment,
  MaterialPurchase,
  User,
  AccountType,
} from '../types'
import type { PaymentStatus, ProviderOrder } from './types'
import { audit } from './audit'

const TERMINAL_APPROVED: PaymentStatus[] = ['approved']
const TERMINAL_FAILED: PaymentStatus[] = ['rejected', 'cancelled', 'expired', 'refunded', 'charged_back']

/**
 * Aplica o estado canônico ao banco (atualiza order + payment) e dispara
 * o efeito apropriado conforme o tipo da order. Idempotente.
 */
export async function applyPaymentResult(
  orderId: string,
  result: ProviderOrder
): Promise<{ applied: boolean; reason?: string; order: PaymentOrder | null }> {
  const db = await getDb()
  const orders = db.collection<PaymentOrder>('payment_orders')

  const order = await orders.findOne({ _id: new ObjectId(orderId) as any })
  if (!order) return { applied: false, reason: 'order não encontrada', order: null }

  const prevStatus = order.status
  const newStatus = result.status

  // Atualiza order
  const update: Partial<PaymentOrder> = {
    status: newStatus,
    statusDetail: result.statusDetail,
    paymentMethod: result.paymentMethod,
    providerPaymentId: result.providerOrderId || order.providerPaymentId,
    providerOrderId: result.providerOrderId || order.providerOrderId,
    paidAt: result.paidAt || order.paidAt,
    pix: result.pix || order.pix,
    boleto: result.boleto || order.boleto,
    updatedAt: new Date(),
  }
  await orders.updateOne({ _id: order._id as any }, { $set: update })

  // Registra/atualiza payment
  if (result.providerOrderId) {
    await db.collection<PaymentRecord>('payments').updateOne(
      { providerPaymentId: result.providerOrderId },
      {
        $set: {
          orderId: String(order._id),
          userId: order.userId,
          provider: 'mercado_pago',
          providerPaymentId: result.providerOrderId,
          amount: result.amount || order.amount,
          currency: 'BRL',
          status: newStatus,
          paymentMethod: result.paymentMethod,
          statusDetail: result.statusDetail,
          paidAt: result.paidAt,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    )
  }

  // Idempotência: se já estava aprovado ou já é terminal igual, não reaplica.
  if (prevStatus === newStatus) {
    return { applied: false, reason: 'status inalterado', order: { ...order, ...update } as PaymentOrder }
  }

  // Disparar efeito apenas em transição para approved (1ª vez)
  if (TERMINAL_APPROVED.includes(newStatus) && !TERMINAL_APPROVED.includes(prevStatus)) {
    await runApprovedEffects(order, result)
  }

  // Em refund/chargeback de plano/material, revogar (best-effort)
  if (
    TERMINAL_FAILED.includes(newStatus) &&
    TERMINAL_APPROVED.includes(prevStatus) &&
    (newStatus === 'refunded' || newStatus === 'charged_back')
  ) {
    await runRevocationEffects(order, newStatus)
  }

  return { applied: true, order: { ...order, ...update } as PaymentOrder }
}

async function runApprovedEffects(order: PaymentOrder, result: ProviderOrder) {
  switch (order.type) {
    case 'plan':
      await applyPlanPurchase(order)
      break
    case 'material':
      await applyMaterialPurchase(order)
      break
    case 'donation':
      await applyDonationApproved(order, result)
      break
    case 'subscription':
      // Cobrança recorrente da preapproval — atualiza próxima cobrança
      await applySubscriptionPayment(order)
      break
  }
}

async function runRevocationEffects(order: PaymentOrder, newStatus: PaymentStatus) {
  if (order.type === 'plan' && order.userId) {
    await audit({
      action: 'role_revoked',
      targetUserId: order.userId,
      resourceType: 'plan',
      resourceId: order.refId,
      metadata: { reason: newStatus, orderId: String(order._id) },
    })
    // Revogação dura: o cron de assinaturas + o próximo login refletirão
  }
  if (order.type === 'material' && order.userId && order.refId) {
    const db = await getDb()
    await db.collection<MaterialPurchase>('material_purchases').updateOne(
      { userId: order.userId, itemId: order.refId, providerOrderId: String(order._id) },
      { $set: { status: 'refunded', refundedAt: new Date() } }
    )
  }
}

// ── Plano (Order única, ex.: vitalício) ──

async function applyPlanPurchase(order: PaymentOrder) {
  if (!order.userId || !order.refId) return
  const db = await getDb()
  const settings = await db.collection('admin_settings').findOne({})
  const planos = (settings?.planos || []) as any[]
  const planoConfig = planos.find(p => p.tipo === order.refId)
  if (!planoConfig) {
    console.warn('[effects] plano não encontrado:', order.refId)
    return
  }

  const now = new Date()
  let expiresAt: Date | undefined
  if (planoConfig.durationMonths && planoConfig.durationMonths > 0) {
    expiresAt = new Date(now)
    expiresAt.setMonth(expiresAt.getMonth() + planoConfig.durationMonths)
  }
  const role: AccountType = (planoConfig.role as AccountType) || 'premium'

  const usersCol = db.collection<User>('users')
  const user = await usersCol.findOne({ _id: new ObjectId(order.userId) as any })
  if (!user) return

  await usersCol.updateOne(
    { _id: new ObjectId(order.userId) as any },
    {
      $set: {
        accountType: role,
        premiumPlanType: order.refId as any,
        premiumActivatedAt: now,
        premiumExpiresAt: expiresAt,
        premiumPrice: order.amount,
        dailyPersonalExamsCreated: 0,
        dailyPersonalExamsRemaining: getPersonalExamsQuota(role),
        lastDailyReset: now,
      },
    }
  )

  await audit({
    action: 'role_granted',
    targetUserId: order.userId,
    resourceType: 'plan',
    resourceId: order.refId,
    metadata: { orderId: String(order._id), amount: order.amount, expiresAt },
  })

  sendPlanPurchasedEmail(
    user.email,
    user.name,
    planoConfig.nome || 'Plano Premium',
    planoConfig.durationMonths || 0
  ).catch(err => console.error('[effects] e-mail plano falhou:', err))
}

// ── Material/Pacote ──

async function applyMaterialPurchase(order: PaymentOrder) {
  if (!order.userId || !order.refId) return
  const db = await getDb()
  const itemType = (order.metadata?.itemType as 'material' | 'package') || 'material'
  const collection = itemType === 'package' ? 'material_packages' : 'materials'

  const item = await db.collection(collection).findOne({ _id: new ObjectId(order.refId) })
  if (!item) return

  await db.collection<MaterialPurchase>('material_purchases').updateOne(
    {
      userId: order.userId,
      itemType,
      itemId: order.refId,
      providerOrderId: String(order._id),
    },
    {
      $set: {
        userId: order.userId,
        userName: order.payerName || '',
        userEmail: order.payerEmail || '',
        itemType,
        itemId: order.refId,
        itemTitle: item.title || '',
        price: order.amount,
        provider: 'mercado_pago',
        providerOrderId: String(order._id),
        providerPaymentId: order.providerPaymentId,
        status: 'completed',
        purchasedAt: new Date(),
      },
    },
    { upsert: true }
  )

  await db.collection(collection).updateOne(
    { _id: new ObjectId(order.refId) },
    { $inc: { downloadCount: 1 } }
  )

  await audit({
    action: 'material_unlocked',
    targetUserId: order.userId,
    resourceType: itemType,
    resourceId: order.refId,
    metadata: { orderId: String(order._id), amount: order.amount },
  })
}

// ── Doação ──

async function applyDonationApproved(order: PaymentOrder, _result: ProviderOrder) {
  const db = await getDb()
  const donation = await db.collection<DonationPayment>('donation_payments').findOne({
    providerOrderId: String(order._id),
  })
  if (!donation) return
  if (donation.status === 'approved' && donation.publicDoacaoId) return // idempotente

  // Cria registro público em `doacoes` para aparecer no ranking
  const publicDoc = {
    nomeCompleto: donation.nomeCompleto || donation.apelido || 'Anônimo',
    apelido: donation.apelido || donation.nomeCompleto || 'Anônimo',
    valor: donation.amount,
    mensagem: donation.mensagem,
    dataDoacao: donation.paidAt || new Date(),
    status: 'approved' as const,
    userId: donation.userId,
    paymentSource: 'online' as const,
    providerOrderId: donation.providerOrderId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const inserted = await db.collection('doacoes').insertOne(publicDoc)

  await db.collection<DonationPayment>('donation_payments').updateOne(
    { _id: donation._id as any },
    {
      $set: {
        status: 'approved',
        paidAt: donation.paidAt || new Date(),
        publicDoacaoId: inserted.insertedId.toString(),
        updatedAt: new Date(),
      },
    }
  )

  await audit({
    action: 'donation_approved',
    targetUserId: donation.userId,
    resourceType: 'donation',
    resourceId: String(donation._id),
    metadata: { orderId: String(order._id), amount: donation.amount },
  })
}

// ── Pagamento recorrente (preapproval) ──

async function applySubscriptionPayment(order: PaymentOrder) {
  if (!order.userId || !order.refId) return
  const db = await getDb()
  const sub = await db.collection<SubscriptionRecord>('subscriptions').findOne({
    providerSubscriptionId: order.refId,
  })
  if (!sub) return

  const now = new Date()
  const months = sub.billingIntervalMonths || 1
  const newPeriodEnd = new Date(now)
  newPeriodEnd.setMonth(newPeriodEnd.getMonth() + months)

  await db.collection<SubscriptionRecord>('subscriptions').updateOne(
    { _id: sub._id as any },
    {
      $set: {
        status: 'authorized',
        lastPaymentAt: now,
        currentPeriodEndsAt: newPeriodEnd,
        nextBillingAt: newPeriodEnd,
        updatedAt: now,
      },
    }
  )

  // Renova cargo no usuário
  const role: AccountType = (sub.role as AccountType) || 'premium'
  await db.collection<User>('users').updateOne(
    { _id: new ObjectId(sub.userId) as any },
    {
      $set: {
        accountType: role,
        premiumPlanType: sub.planId as any,
        premiumActivatedAt: sub.createdAt,
        premiumExpiresAt: newPeriodEnd,
        mercadoPagoPreapprovalId: sub.providerSubscriptionId,
        dailyPersonalExamsRemaining: getPersonalExamsQuota(role),
        lastDailyReset: now,
      },
    }
  )

  await audit({
    action: 'subscription_renewed',
    targetUserId: sub.userId,
    resourceType: 'subscription',
    resourceId: sub.providerSubscriptionId,
    metadata: { orderId: String(order._id), nextBillingAt: newPeriodEnd },
  })
}
