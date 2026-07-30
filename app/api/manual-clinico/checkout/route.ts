import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { getPaymentProvider, deriveIdempotencyKey } from '@/lib/payments'
import { applyPaymentResult } from '@/lib/payments/effects'
import { audit } from '@/lib/payments/audit'
import {
  buildManualClinicoCouponItem,
  computePlanExpiresAt,
  getActiveManualClinicoPurchase,
  getManualClinicoConfig,
  getManualClinicoPlan,
  grantManualClinicoAccess,
  MANUAL_CLINICO_PRODUCT_ID,
  MANUAL_CLINICO_PRODUCT_TYPE,
} from '@/lib/manual-clinico-product'
import {
  couponAnalyticsMetadata,
  CouponError,
  reserveCouponRedemption,
  releaseCouponRedemption,
  validateCouponForCheckout,
  type CouponValidationResult,
} from '@/lib/coupons'
import {
  combineTierAndCouponDiscount,
  getPricingEventStateById,
} from '@/lib/pricing-events'
import { getRequestAnalyticsMeta, recordCheckoutEvent, recordOrderCheckoutEvent } from '@/lib/analytics'
import { sendManualClinicoPurchasedEmail } from '@/lib/mail'
import type { PaymentOrder } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const Schema = z.object({
  paymentMethodId: z.string().min(1),
  cardToken: z.string().optional(),
  installments: z.number().int().min(1).max(12).optional(),
  issuer: z.string().optional(),
  payerDocumentType: z.enum(['CPF', 'CNPJ']).optional(),
  payerDocumentNumber: z.string().optional(),
  couponCode: z.string().max(80).optional(),
  planKey: z.enum(['semestral', 'anual', 'vitalicio']).optional(),
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await checkRateLimit(ip, 'manual_clinico_checkout', 20, 60_000)
  if (!rl.success) return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })

  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  const data = parsed.data

  const db = await getDb()
  const [config, activePurchase] = await Promise.all([
    getManualClinicoConfig(db),
    getActiveManualClinicoPurchase(db, session),
  ])

  if (!config.isActive) {
    return NextResponse.json({ error: 'O Manual Clinico Completo esta indisponivel no momento.' }, { status: 400 })
  }

  const planKey = data.planKey || 'vitalicio'
  const plan = getManualClinicoPlan(config, planKey)
  if (!plan.enabled) {
    return NextResponse.json({ error: 'Este plano nao esta disponivel.' }, { status: 400 })
  }

  // Bloqueia apenas se o usuário já tem vitalício ativo (não pode comprar mais).
  // Permite renovação se o plano atual é temporário (prolonga acesso pelo novo plano).
  if (activePurchase && activePurchase.accessType === 'lifetime') {
    return NextResponse.json({
      error: 'Voce ja possui o Manual Clinico Completo vitalicio.',
      alreadyOwned: true,
      redirectTo: '/manual-clinico',
    }, { status: 409 })
  }

  let amount = Number(plan.price || 0)
  let couponValidation: CouponValidationResult | null = null

  const pricingEventId = plan.pricingEventId || config.pricingEventId
  const pricingEventState = pricingEventId
    ? await getPricingEventStateById(db, String(pricingEventId))
    : null
  let tierDiscountAmount = 0
  if (pricingEventState?.activeTier && amount > 0) {
    tierDiscountAmount = Math.max(
      0,
      Math.round(amount * (pricingEventState.activeTier.discountPercent / 100) * 100) / 100
    )
  }

  // Cupom: usa o explícito do usuário se informado, senão o defaultCouponCode do plano.
  const couponCodeFinal = (data.couponCode || plan.defaultCouponCode || '').trim() || undefined
  let couponDiscountAmount = 0
  if (couponCodeFinal && amount > 0) {
    if (!config.allowCoupons) {
      return NextResponse.json({ error: 'Cupons nao estao habilitados para este produto.' }, { status: 400 })
    }
    try {
      couponValidation = await validateCouponForCheckout(db, {
        code: couponCodeFinal,
        amountBeforeCoupon: amount,
        userId: session.userId,
        userEmail: session.email,
        manualPlanKey: plan.key,
        tierDiscountAmount,
        items: [buildManualClinicoCouponItem(config, amount)],
      })
      couponDiscountAmount = couponValidation.discountAmount
    } catch (error: any) {
      if (error instanceof CouponError) {
        // Se foi o cupom padrão do plano que falhou, ignora silenciosamente.
        if (!data.couponCode) {
          couponValidation = null
          couponDiscountAmount = 0
        } else {
          return NextResponse.json({ error: error.message }, { status: error.status })
        }
      } else {
        throw error
      }
    }
  }

  // Empilhamento (cupom sobre lote) quando o cupom é stackWithTier: aplica o
  // lote e, por cima, o cupom (já calculado sobre o preço pós-lote). Senão,
  // vale o "maior dos dois".
  const stackCoupon = couponValidation?.coupon.stackWithTier === true
  let appliedTierDiscount = 0
  if (stackCoupon && tierDiscountAmount > 0 && couponValidation) {
    appliedTierDiscount = tierDiscountAmount
    amount = Math.max(0, Math.round((amount - tierDiscountAmount - couponValidation.discountAmount) * 100) / 100)
  } else {
    const combined = combineTierAndCouponDiscount({
      basePrice: amount,
      tierDiscountAmount,
      couponDiscountAmount,
    })
    amount = combined.finalPrice
    if (combined.appliedSource !== 'coupon') {
      couponValidation = null
    }
    appliedTierDiscount = combined.appliedSource === 'tier' ? combined.appliedDiscountAmount : 0
  }

  if (amount <= 0 || data.paymentMethodId === 'free') {
    if (amount > 0 && data.paymentMethodId === 'free') {
      return NextResponse.json({ error: 'Produto pago requer uma forma de pagamento valida.' }, { status: 400 })
    }
    if (couponValidation) {
      try {
        await reserveCouponRedemption(db, {
          validation: couponValidation,
          userId: session.userId,
          userName: session.name,
          userEmail: session.email,
          status: 'approved',
        })
      } catch (error: any) {
        if (error instanceof CouponError) {
          return NextResponse.json({ error: error.message }, { status: error.status })
        }
        throw error
      }
    }

    const freePurchase = await grantManualClinicoAccess(db, {
      userId: session.userId,
      userName: session.name,
      userEmail: session.email,
      config,
      plan,
      price: 0,
      provider: 'free',
      paymentMethod: 'free',
      couponValidation,
    })

    if (session.email) {
      sendManualClinicoPurchasedEmail({
        email: session.email,
        name: session.name || '',
        planLabel: plan.label,
        planKey: plan.key,
        durationMonths: plan.durationMonths,
        amount: 0,
        expiresAt: freePurchase.expiresAt || null,
        paymentMethod: 'free',
      }).catch(err => console.error('[manual-clinico/checkout] e-mail falhou:', err))
    }

    await recordCheckoutEvent({
      event: 'payment_approved',
      userId: session.userId,
      userName: session.name,
      userEmail: session.email,
      productId: MANUAL_CLINICO_PRODUCT_ID,
      productTitle: `${config.label} - ${plan.label}`,
      productType: 'product',
      amount: 0,
      paymentMethod: 'free',
      status: 'approved',
      source: 'Manual Clinico',
      metadata: {
        productType: MANUAL_CLINICO_PRODUCT_TYPE,
        planKey: plan.key,
        planLabel: plan.label,
        planDurationMonths: plan.durationMonths,
        accessType: plan.durationMonths ? 'temporary' : 'lifetime',
        ...couponAnalyticsMetadata(couponValidation),
      },
      ...getRequestAnalyticsMeta(request),
    })

    return NextResponse.json({
      free: true,
      success: true,
      amount: 0,
      successRedirect: `/manual-clinico?purchase=success&value=0&plan=${plan.key}`,
    })
  }

  const now = new Date()
  const plannedExpiresAt = computePlanExpiresAt(plan, now)
  const orderDoc: Omit<PaymentOrder, '_id'> = {
    userId: session.userId,
    payerEmail: session.email,
    payerName: session.name,
    provider: 'mercado_pago',
    type: 'product',
    refId: MANUAL_CLINICO_PRODUCT_ID,
    amount,
    currency: 'BRL',
    status: 'pending',
    idempotencyKey: '',
    metadata: {
      productType: MANUAL_CLINICO_PRODUCT_TYPE,
      itemTitle: `${config.label} - ${plan.label}`,
      originalPrice: plan.price,
      currentPrice: plan.price,
      accessType: plan.durationMonths ? 'temporary' : 'lifetime',
      planKey: plan.key,
      planLabel: plan.label,
      planDurationMonths: plan.durationMonths,
      plannedExpiresAt: plannedExpiresAt ? plannedExpiresAt.toISOString() : null,
      ...(appliedTierDiscount > 0 && pricingEventState?.activeTier
        ? {
            pricingEventId: pricingEventState.eventId,
            pricingEventName: pricingEventState.name,
            pricingEventTierIndex: pricingEventState.activeTier.index,
            pricingEventTierDiscountPercent: pricingEventState.activeTier.discountPercent,
            pricingEventTierDiscountAmount: appliedTierDiscount,
            pricingEventStackedWithCoupon: stackCoupon && !!couponValidation,
          }
        : {}),
      ...couponAnalyticsMetadata(couponValidation),
    },
    createdAt: now,
    updatedAt: now,
  }

  const inserted = await db.collection<PaymentOrder>('payment_orders').insertOne(orderDoc as any)
  const orderId = inserted.insertedId.toString()
  const idempotencyKey = deriveIdempotencyKey(orderId)
  await db.collection<PaymentOrder>('payment_orders').updateOne(
    { _id: inserted.insertedId },
    { $set: { idempotencyKey } }
  )

  if (couponValidation) {
    try {
      await reserveCouponRedemption(db, {
        validation: couponValidation,
        userId: session.userId,
        userName: session.name,
        userEmail: session.email,
        orderId,
      })
    } catch (error: any) {
      await db.collection<PaymentOrder>('payment_orders').updateOne(
        { _id: inserted.insertedId },
        { $set: { status: 'rejected', statusDetail: 'coupon_unavailable', updatedAt: new Date() } }
      )
      if (error instanceof CouponError) {
        return NextResponse.json({ error: error.message }, { status: error.status })
      }
      throw error
    }
  }

  await recordOrderCheckoutEvent('order_created', { ...orderDoc, _id: inserted.insertedId, idempotencyKey } as PaymentOrder, {
    productId: MANUAL_CLINICO_PRODUCT_ID,
    productTitle: config.label,
    productType: 'product',
    paymentMethod: data.paymentMethodId,
    source: 'Manual Clinico',
    metadata: { productType: MANUAL_CLINICO_PRODUCT_TYPE },
    ...getRequestAnalyticsMeta(request),
  })

  try {
    const provider = getPaymentProvider()
    const result = await provider.createPayment({
      externalReference: orderId,
      amount,
      currency: 'BRL',
      description: `${config.label} - ${plan.label}`,
      payerEmail: session.email,
      payerName: session.name,
      idempotencyKey,
      paymentMethodId: data.paymentMethodId,
      cardToken: data.cardToken,
      installments: data.installments,
      issuer: data.issuer,
      payerDocumentType: data.payerDocumentType,
      payerDocumentNumber: data.payerDocumentNumber,
      metadata: {
        orderId,
        type: 'product',
        productType: MANUAL_CLINICO_PRODUCT_TYPE,
        productId: MANUAL_CLINICO_PRODUCT_ID,
        planKey: plan.key,
        ...(couponValidation ? { couponCode: couponValidation.code } : {}),
      },
    })

    await applyPaymentResult(orderId, result)
    await audit({
      action: 'order_created',
      actorUserId: session.userId,
      targetUserId: session.userId,
      resourceType: 'product',
      resourceId: MANUAL_CLINICO_PRODUCT_ID,
      metadata: {
        amount,
        paymentMethod: data.paymentMethodId,
        providerPaymentId: result.providerOrderId,
        ...couponAnalyticsMetadata(couponValidation),
      },
      ip,
    })

    return NextResponse.json({
      orderId,
      providerPaymentId: result.providerOrderId,
      status: result.status,
      paymentMethod: result.paymentMethod,
      pix: result.pix || null,
      boleto: result.boleto || null,
      statusDetail: result.statusDetail,
      amount,
      successRedirect: `/manual-clinico?purchase=success&value=${amount}&plan=${plan.key}&oid=${orderId}`,
    })
  } catch (error: any) {
    console.error('[manual-clinico/checkout] erro:', error)
    if (couponValidation) {
      await releaseCouponRedemption(db, orderId, 'provider_error')
    }
    await db.collection<PaymentOrder>('payment_orders').updateOne(
      { _id: inserted.insertedId },
      { $set: { status: 'rejected', statusDetail: 'provider_error', updatedAt: new Date() } }
    )
    return NextResponse.json({ error: error?.message || 'Falha ao criar pagamento' }, { status: 502 })
  }
}
