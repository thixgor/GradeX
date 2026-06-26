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
import { sendPlanPurchasedEmail, sendDonationThanksEmail, sendMaterialPurchasedEmail, sendCartPurchasedEmail, sendManualClinicoPurchasedEmail, sendRafflePurchaseEmail } from '../mail'
import { markNumbersSold, releaseReservation } from '../raffles'
import type { Raffle, RafflePurchase } from '../types'
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
import { recordOrderCheckoutEvent } from '../analytics'
import { approveCouponRedemption, releaseCouponRedemption } from '../coupons'
import { grantMaterialCartItems, type MaterialCartResolvedItem } from '../material-cart'
import {
  getManualClinicoConfig,
  getManualClinicoPlan,
  grantManualClinicoAccess,
  MANUAL_CLINICO_PRODUCT_TYPE,
  revokeManualClinicoAccessForOrder,
} from '../manual-clinico-product'
import type { ManualClinicoPlanKey } from '../types'

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
  const updatedOrder = { ...order, ...update } as PaymentOrder

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
    return { applied: false, reason: 'status inalterado', order: updatedOrder }
  }

  // Disparar efeito apenas em transição para approved (1ª vez)
  if (TERMINAL_APPROVED.includes(newStatus) && !TERMINAL_APPROVED.includes(prevStatus)) {
    await approveCouponRedemption(db, String(order._id))
    await recordOrderCheckoutEvent('payment_approved', updatedOrder)
    await runApprovedEffects(order, result)
  }

  if (TERMINAL_FAILED.includes(newStatus) && !TERMINAL_APPROVED.includes(prevStatus)) {
    await releaseCouponRedemption(db, String(order._id), newStatus)
    await recordOrderCheckoutEvent('payment_failed', updatedOrder)
    if (order.type === 'raffle') {
      await releaseRafflePurchase(order, newStatus)
    }
  }

  // Em refund/chargeback de plano/material, revogar (best-effort)
  if (
    TERMINAL_FAILED.includes(newStatus) &&
    TERMINAL_APPROVED.includes(prevStatus) &&
    (newStatus === 'refunded' || newStatus === 'charged_back')
  ) {
    await releaseCouponRedemption(db, String(order._id), newStatus)
    await runRevocationEffects(order, newStatus)
  }

  return { applied: true, order: updatedOrder }
}

async function runApprovedEffects(order: PaymentOrder, result: ProviderOrder) {
  switch (order.type) {
    case 'plan':
      await applyPlanPurchase(order)
      break
    case 'material':
      await applyMaterialPurchase(order, result)
      break
    case 'donation':
      await applyDonationApproved(order, result)
      break
    case 'subscription':
      // Cobrança recorrente da preapproval — atualiza próxima cobrança
      await applySubscriptionPayment(order)
      break
    case 'product':
      await applyProductPurchase(order, result)
      break
    case 'raffle':
      await applyRafflePurchase(order, result)
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
    if (Array.isArray(order.metadata?.cartItems) && order.metadata.cartItems.length > 0) {
      await db.collection<MaterialPurchase>('material_purchases').updateMany(
        { userId: order.userId, providerOrderId: String(order._id) },
        { $set: { status: 'refunded', refundedAt: new Date() } }
      )
      return
    }

    await db.collection<MaterialPurchase>('material_purchases').updateOne(
      { userId: order.userId, itemId: order.refId, providerOrderId: String(order._id) },
      { $set: { status: 'refunded', refundedAt: new Date() } }
    )
  }
  if (order.type === 'product' && order.metadata?.productType === MANUAL_CLINICO_PRODUCT_TYPE) {
    const db = await getDb()
    await revokeManualClinicoAccessForOrder(db, order)
  }
  if (order.type === 'raffle') {
    const raffleId = order.metadata?.raffleId as string | undefined
    if (!raffleId) return
    const db = await getDb()
    // Libera os números vendidos desta order e marca a compra como reembolsada.
    await db.collection('raffle_numbers').deleteMany({
      raffleId,
      orderId: String(order._id),
      status: { $in: ['sold', 'reserved'] },
    })
    await db.collection<RafflePurchase>('raffle_purchases').updateOne(
      { orderId: String(order._id) },
      { $set: { status: 'refunded', updatedAt: new Date() } },
    )
    const soldCount = await db.collection('raffle_numbers').countDocuments({
      raffleId,
      status: { $in: ['sold', 'drawn'] },
    })
    await db.collection<Raffle>('raffles').updateOne(
      { _id: new ObjectId(raffleId) as any },
      { $set: { soldCount, updatedAt: new Date() } },
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
    planoConfig.durationMonths || 0,
    order.amount
  ).catch(err => console.error('[effects] e-mail plano falhou:', err))
}

// ── Material/Pacote ──

async function applyMaterialPurchase(order: PaymentOrder, result?: ProviderOrder) {
  if (!order.userId || !order.refId) return
  const db = await getDb()

  if (Array.isArray(order.metadata?.cartItems) && order.metadata.cartItems.length > 0) {
    const cartItems = order.metadata.cartItems
      .map((item: any): MaterialCartResolvedItem | null => {
        if (
          !item ||
          (item.itemType !== 'material' && item.itemType !== 'package') ||
          !item.itemId
        ) {
          return null
        }

        return {
          itemType: item.itemType,
          itemId: String(item.itemId),
          itemTitle: String(item.itemTitle || 'Item'),
          materialType: item.materialType,
          linkedDeckSlug: item.linkedDeckSlug,
          materialIds: Array.isArray(item.materialIds) ? item.materialIds.map(String) : undefined,
          price: Number(item.price || 0),
          originalPrice: Number(item.originalPrice || item.price || 0),
          discountApplied: Number(item.discountApplied || 0),
          ownedMaterialIds: Array.isArray(item.ownedMaterialIds) ? item.ownedMaterialIds.map(String) : [],
        }
      })
      .filter(Boolean) as MaterialCartResolvedItem[]

    if (cartItems.length === 0) return

    await grantMaterialCartItems(
      db,
      {
        userId: order.userId,
        name: order.payerName || '',
        email: order.payerEmail || '',
      },
      cartItems,
      {
        providerOrderId: String(order._id),
        providerPaymentId: result?.providerOrderId || order.providerPaymentId,
        auditMetadata: { orderId: String(order._id), cart: true },
      }
    )

    if (order.payerEmail) {
      const skippedItems = Array.isArray(order.metadata?.skippedItems)
        ? order.metadata.skippedItems.map((s: any) => ({
            itemType: s?.itemType === 'package' ? 'package' as const : 'material' as const,
            itemTitle: s?.itemTitle ? String(s.itemTitle) : undefined,
            reason: s?.reason,
            includedInPackageTitle: s?.includedInPackageTitle ? String(s.includedInPackageTitle) : undefined,
          }))
        : []

      sendCartPurchasedEmail(
        order.payerEmail,
        order.payerName || '',
        cartItems.map(item => ({
          itemType: item.itemType,
          itemTitle: item.itemTitle,
          price: item.price,
        })),
        order.amount,
        skippedItems
      ).catch(err => console.error('[effects] e-mail carrinho falhou:', err))
    }
    return
  }

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
        providerPaymentId: result?.providerOrderId || order.providerPaymentId,
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

  if (order.payerEmail) {
    sendMaterialPurchasedEmail(
      order.payerEmail,
      order.payerName || '',
      item.title || 'Material',
      order.amount
    ).catch(err => console.error('[effects] e-mail material falhou:', err))
  }
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

  // Envia comprovante para o e-mail do doador (se informado) ou do usuário logado
  const donorEmail = donation.email
  const donorName = donation.apelido || donation.nomeCompleto || 'Apoiador'
  if (donorEmail) {
    sendDonationThanksEmail(donorEmail, donorName, donation.amount, donation.paidAt).catch(
      err => console.error('[effects] e-mail doação falhou:', err)
    )
  } else if (donation.userId) {
    // Tenta buscar o e-mail do usuário autenticado
    getDb().then(async db => {
      const user = await db.collection<User>('users').findOne({ _id: new ObjectId(donation.userId!) as any })
      if (user?.email) {
        sendDonationThanksEmail(user.email, user.name || donorName, donation.amount, donation.paidAt).catch(
          err => console.error('[effects] e-mail doação (user) falhou:', err)
        )
      }
    }).catch(() => {})
  }
}

// ── Produto avulso: Manual Clínico ──

async function applyProductPurchase(order: PaymentOrder, result?: ProviderOrder) {
  if (!order.userId || order.metadata?.productType !== MANUAL_CLINICO_PRODUCT_TYPE) return

  const db = await getDb()
  const config = await getManualClinicoConfig(db)
  const couponValidation = order.metadata?.couponId
    ? {
        couponId: String(order.metadata.couponId),
        code: String(order.metadata.couponCode || ''),
        discountAmount: Number(order.metadata.couponDiscountAmount || 0),
      } as any
    : null

  const planKey = (order.metadata?.planKey as ManualClinicoPlanKey) || 'vitalicio'
  const plan = getManualClinicoPlan(config, planKey)

  const purchase = await grantManualClinicoAccess(db, {
    userId: order.userId,
    userName: order.payerName || '',
    userEmail: order.payerEmail || '',
    config,
    plan,
    price: order.amount,
    provider: 'mercado_pago',
    providerOrderId: String(order._id),
    providerPaymentId: result?.providerOrderId || order.providerPaymentId,
    paymentMethod: result?.paymentMethod || order.paymentMethod,
    couponValidation,
    order,
  })

  await audit({
    action: 'manual_clinico_unlocked',
    targetUserId: order.userId,
    resourceType: 'product',
    resourceId: MANUAL_CLINICO_PRODUCT_TYPE,
    metadata: { orderId: String(order._id), amount: order.amount, planKey: plan.key },
  })

  if (order.payerEmail) {
    sendManualClinicoPurchasedEmail({
      email: order.payerEmail,
      name: order.payerName || '',
      planLabel: plan.label,
      planKey: plan.key,
      durationMonths: plan.durationMonths,
      amount: order.amount,
      expiresAt: purchase.expiresAt || null,
      paymentMethod: result?.paymentMethod || order.paymentMethod,
    }).catch(err => console.error('[effects] e-mail manual clinico falhou:', err))
  }
}

// ── Rifa ──

async function applyRafflePurchase(order: PaymentOrder, result?: ProviderOrder) {
  const raffleId = order.metadata?.raffleId as string | undefined
  if (!raffleId) return
  const db = await getDb()

  const purchase = await db.collection<RafflePurchase>('raffle_purchases').findOne({
    orderId: String(order._id),
  })
  if (!purchase) {
    console.warn('[effects] raffle purchase não encontrada para order', String(order._id))
    return
  }
  if (purchase.status === 'paid') return // idempotente

  const raffle = await db.collection<Raffle>('raffles').findOne({ _id: new ObjectId(raffleId) as any })
  if (!raffle) return

  // Marca números como vendidos (reserved → sold), atômico por updateMany.
  await markNumbersSold(db, raffleId, purchase.numbers, {
    participantId: purchase.participantId,
    purchaseId: String(purchase._id),
    orderId: String(order._id),
  })

  await db.collection<RafflePurchase>('raffle_purchases').updateOne(
    { _id: purchase._id as any },
    {
      $set: {
        status: 'paid',
        mercadoPagoPaymentId: result?.providerOrderId || order.providerPaymentId,
        paidAt: result?.paidAt || new Date(),
        updatedAt: new Date(),
      },
    },
  )

  // Atualiza cache de vendidos
  const soldCount = await db.collection('raffle_numbers').countDocuments({
    raffleId,
    status: { $in: ['sold', 'drawn'] },
  })
  await db.collection<Raffle>('raffles').updateOne(
    { _id: raffle._id as any },
    { $set: { soldCount, updatedAt: new Date() } },
  )

  await audit({
    action: 'raffle_numbers_sold',
    targetUserId: order.userId,
    resourceType: 'raffle',
    resourceId: raffleId,
    metadata: { orderId: String(order._id), numbers: purchase.numbers, amount: order.amount },
  })

  if (purchase.participantEmail) {
    sendRafflePurchaseEmail({
      email: purchase.participantEmail,
      name: purchase.participantName || '',
      raffleName: raffle.name,
      raffleSlug: raffle.slug,
      prizeName: raffle.prizeName,
      numbers: purchase.numbers,
      totalNumbers: raffle.totalNumbers,
      amount: order.amount,
    }).catch(err => console.error('[effects] e-mail rifa falhou:', err))
  }
}

async function releaseRafflePurchase(order: PaymentOrder, newStatus: PaymentStatus) {
  const raffleId = order.metadata?.raffleId as string | undefined
  if (!raffleId) return
  const db = await getDb()

  // Libera as reservas (números voltam a ficar disponíveis).
  await releaseReservation(db, raffleId, String(order._id))

  const mappedStatus = newStatus === 'cancelled' ? 'cancelled' : newStatus === 'refunded' ? 'refunded' : 'expired'
  await db.collection<RafflePurchase>('raffle_purchases').updateOne(
    { orderId: String(order._id), status: { $ne: 'paid' } },
    { $set: { status: mappedStatus as any, updatedAt: new Date() } },
  )

  await audit({
    action: 'raffle_numbers_released',
    targetUserId: order.userId,
    resourceType: 'raffle',
    resourceId: raffleId,
    metadata: { orderId: String(order._id), reason: newStatus },
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
