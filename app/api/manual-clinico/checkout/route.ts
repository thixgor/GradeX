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
  getManualClinicoAccess,
  getManualClinicoConfig,
  getManualClinicoCurrentPrice,
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
import { getRequestAnalyticsMeta, recordCheckoutEvent, recordOrderCheckoutEvent } from '@/lib/analytics'
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
  const [config, access] = await Promise.all([
    getManualClinicoConfig(db),
    getManualClinicoAccess(db, session),
  ])

  if (!config.isActive) {
    return NextResponse.json({ error: 'O Manual Clinico Premium esta indisponivel no momento.' }, { status: 400 })
  }
  if (access.hasFullAccess) {
    return NextResponse.json({
      error: 'Voce ja possui o Manual Clinico Premium.',
      alreadyOwned: true,
      redirectTo: '/manual-clinico',
    }, { status: 409 })
  }

  let amount = getManualClinicoCurrentPrice(config)
  let couponValidation: CouponValidationResult | null = null

  if (data.couponCode && amount > 0) {
    if (!config.allowCoupons) {
      return NextResponse.json({ error: 'Cupons nao estao habilitados para este produto.' }, { status: 400 })
    }
    try {
      couponValidation = await validateCouponForCheckout(db, {
        code: data.couponCode,
        amountBeforeCoupon: amount,
        userId: session.userId,
        userEmail: session.email,
        items: [buildManualClinicoCouponItem(config, amount)],
      })
      amount = couponValidation.amountAfterCoupon
    } catch (error: any) {
      if (error instanceof CouponError) {
        return NextResponse.json({ error: error.message }, { status: error.status })
      }
      throw error
    }
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

    await grantManualClinicoAccess(db, {
      userId: session.userId,
      userName: session.name,
      userEmail: session.email,
      config,
      price: 0,
      provider: 'free',
      paymentMethod: 'free',
      couponValidation,
    })

    await recordCheckoutEvent({
      event: 'payment_approved',
      userId: session.userId,
      userName: session.name,
      userEmail: session.email,
      productId: MANUAL_CLINICO_PRODUCT_ID,
      productTitle: config.label,
      productType: 'product',
      amount: 0,
      paymentMethod: 'free',
      status: 'approved',
      source: 'Manual Clinico',
      metadata: {
        productType: MANUAL_CLINICO_PRODUCT_TYPE,
        accessType: config.lifetimeAccess ? 'lifetime' : 'temporary',
        ...couponAnalyticsMetadata(couponValidation),
      },
      ...getRequestAnalyticsMeta(request),
    })

    return NextResponse.json({
      free: true,
      success: true,
      amount: 0,
      successRedirect: '/manual-clinico?purchase=success',
    })
  }

  const now = new Date()
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
      itemTitle: config.label,
      originalPrice: config.price,
      currentPrice: getManualClinicoCurrentPrice(config),
      accessType: config.lifetimeAccess ? 'lifetime' : 'temporary',
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
      description: config.label,
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
      successRedirect: '/manual-clinico?purchase=success',
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
