import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { getPaymentProvider, deriveIdempotencyKey } from '@/lib/payments'
import { applyPaymentResult } from '@/lib/payments/effects'
import { audit } from '@/lib/payments/audit'
import { getRequestAnalyticsMeta, recordOrderCheckoutEvent } from '@/lib/analytics'
import { DEFAULT_PAYMENT_METHODS } from '@/lib/payment-methods'
import {
  resolveSerialKeyProduct,
  parseBuyerInfo,
  isSerialKeyProductType,
  generateReceiptToken,
  getSuccessUrl,
  logSerialKeySecurity,
  productTypeLabel,
} from '@/lib/serial-keys'
import {
  MAX_MATERIAL_CART_ITEMS,
  resolveMaterialCart,
  type MaterialCartSession,
} from '@/lib/material-cart'
import { computeCartTierDiscounts, combineTierAndCouponDiscount, getPricingEventStateById } from '@/lib/pricing-events'
import {
  applyCouponDiscountsToItems,
  couponAnalyticsMetadata,
  CouponError,
  reserveCouponRedemption,
  releaseCouponRedemption,
  validateCouponForCheckout,
  type CouponValidationResult,
} from '@/lib/coupons'
import type { PaymentOrder, SerialKeyProductType, SerialKeyGrant } from '@/lib/types'
import type { PaymentOrderType } from '@/lib/payments/types'
import type { AnalyticsProductType } from '@/lib/analytics'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Checkout de compra avulsa com geração de Serial Key. Funciona SEM login:
 * o comprador informa nome completo, e-mail e telefone. O produto é liberado
 * somente na ativação da key (após o pagamento aprovado).
 *
 * Segurança:
 *  - Rate limiting por IP (checkout).
 *  - Validação/sanitização server-side de todos os dados.
 *  - Preço SEMPRE recalculado na fonte autoritativa — nunca do client.
 *  - IP/user-agent/horário registrados na order (e depois na serial key).
 */

const Schema = z.object({
  productType: z.enum(['manual_clinico', 'material', 'flashcard', 'package', 'premium', 'essential']),
  productId: z.string().max(80).optional(),
  planKey: z.string().max(40).optional(),
  itemType: z.enum(['material', 'package']).optional(),
  // Comprador (obrigatório neste fluxo)
  buyerName: z.string().max(140),
  buyerEmail: z.string().max(180),
  buyerPhone: z.string().max(40),
  // Pagamento
  paymentMethodId: z.string().min(1),
  cardToken: z.string().optional(),
  installments: z.number().int().min(1).max(12).optional(),
  issuer: z.string().optional(),
  payerDocumentType: z.enum(['CPF', 'CNPJ']).optional(),
  payerDocumentNumber: z.string().max(20).optional(),
  couponCode: z.string().max(80).optional(),
})

const buyerFields = {
  buyerName: z.string().max(140),
  buyerEmail: z.string().max(180),
  buyerPhone: z.string().max(40),
}
const paymentFields = {
  paymentMethodId: z.string().min(1),
  cardToken: z.string().optional(),
  installments: z.number().int().min(1).max(12).optional(),
  issuer: z.string().optional(),
  payerDocumentType: z.enum(['CPF', 'CNPJ']).optional(),
  payerDocumentNumber: z.string().max(20).optional(),
  couponCode: z.string().max(80).optional(),
}

const CartSchema = z.object({
  cart: z.array(z.object({
    itemType: z.enum(['material', 'package']),
    itemId: z.string().min(1),
  })).min(1).max(MAX_MATERIAL_CART_ITEMS),
  ...buyerFields,
  ...paymentFields,
})

/** Mapeia o tipo de produto da serial key para o tipo de order de pagamento. */
function orderTypeFor(productType: SerialKeyProductType): PaymentOrderType {
  if (productType === 'premium' || productType === 'essential') return 'plan'
  if (productType === 'manual_clinico') return 'product'
  return 'material'
}

/** Mapeia para o tipo de produto usado nos eventos de analytics. */
function analyticsTypeFor(productType: SerialKeyProductType): AnalyticsProductType {
  if (productType === 'package') return 'package'
  if (productType === 'flashcard') return 'flashcard'
  if (productType === 'material') return 'material'
  if (productType === 'manual_clinico') return 'product'
  return 'plan'
}

// GET — resolve produto e preço para exibição no checkout (sem criar order).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const productType = searchParams.get('productType') || ''
  if (!isSerialKeyProductType(productType)) {
    return NextResponse.json({ error: 'Tipo de produto inválido' }, { status: 400 })
  }
  try {
    const db = await getDb()
    const resolved = await resolveSerialKeyProduct(db, {
      productType,
      productId: searchParams.get('productId') || undefined,
      planKey: searchParams.get('planKey') || undefined,
      itemType: (searchParams.get('itemType') as 'material' | 'package') || undefined,
    })
    return NextResponse.json({
      productType: resolved.productType,
      productTypeLabel: productTypeLabel(resolved.productType),
      productId: resolved.productId,
      productTitle: resolved.productTitle,
      amount: resolved.amount,
      description: resolved.description,
      coverImageUrl: resolved.coverImageUrl,
      productDescription: resolved.productDescription,
    }, { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' } })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Produto indisponível' }, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const userAgent = request.headers.get('user-agent') || undefined

  // Rate limiting rígido para evitar flood/abuso na criação de pagamentos.
  const rl = await checkRateLimit(ip, 'serial_key_checkout', 10, 60_000)
  if (!rl.success) {
    await logSerialKeySecurity({ kind: 'rate_limited', ip, userAgent, detail: 'checkout' })
    return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em instantes.' }, { status: 429 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const session = await getSession()

  // Carrinho (vários produtos) → gera uma Serial Key por item.
  if (Array.isArray(body?.cart)) {
    const parsedCart = CartSchema.safeParse(body)
    if (!parsedCart.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsedCart.error.format() }, { status: 400 })
    }
    return handleCartCheckout(request, ip, userAgent, session, parsedCart.data)
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.format() }, { status: 400 })
  }
  const data = parsed.data

  // Valida/sanitiza o comprador (server-side).
  const buyerParsed = parseBuyerInfo({ name: data.buyerName, email: data.buyerEmail, phone: data.buyerPhone })
  if (!buyerParsed.ok) {
    return NextResponse.json({ error: buyerParsed.error }, { status: 400 })
  }
  const buyer = buyerParsed.buyer

  const db = await getDb()

  // Métodos de pagamento habilitados.
  const adminSettings = await db.collection('admin_settings').findOne({})
  const enabledMethods = { ...DEFAULT_PAYMENT_METHODS, ...(adminSettings?.paymentMethods || {}) }
  const method = data.paymentMethodId
  if (method === 'pix' && !enabledMethods.pix) {
    return NextResponse.json({ error: 'Pagamento por Pix não está disponível no momento.' }, { status: 400 })
  }
  if ((method === 'credit_card' || method === 'debit_card') && !enabledMethods.credit_card) {
    return NextResponse.json({ error: 'Pagamento por cartão não está disponível no momento.' }, { status: 400 })
  }
  if (method === 'boleto' && !enabledMethods.boleto) {
    return NextResponse.json({ error: 'Pagamento por boleto não está disponível no momento.' }, { status: 400 })
  }

  // Resolve produto + preço na fonte autoritativa.
  let resolved
  try {
    resolved = await resolveSerialKeyProduct(db, {
      productType: data.productType,
      productId: data.productId,
      planKey: data.planKey,
      itemType: data.itemType,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Produto indisponível' }, { status: 400 })
  }

  let amount = resolved.amount
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
  }

  // Lote dinâmico (pricing event) — hoje só o manual clínico usa isso na
  // compra avulsa. Mesma regra do checkout autenticado: o maior desconto
  // entre lote e cupom vence (ver combineTierAndCouponDiscount abaixo).
  let tierDiscountAmount = 0
  if (resolved.productType === 'manual_clinico' && resolved.pricingEventId) {
    const pricingEventState = await getPricingEventStateById(db, resolved.pricingEventId)
    if (pricingEventState?.activeTier && pricingEventState.isActive !== false && amount > 0) {
      tierDiscountAmount = Math.max(
        0,
        Math.round(amount * (pricingEventState.activeTier.discountPercent / 100) * 100) / 100
      )
    }
  }

  // Cupom de desconto (compra sem login). O preço é sempre validado aqui na
  // fonte, nunca vem do client.
  let couponValidation: CouponValidationResult | null = null
  const couponEligibleType =
    resolved.productType === 'material' ||
    resolved.productType === 'flashcard' ||
    resolved.productType === 'package' ||
    resolved.productType === 'manual_clinico'
  let couponDiscountAmount = 0
  if (data.couponCode && couponEligibleType && amount > 0) {
    if (resolved.productType === 'manual_clinico' && resolved.allowCoupons === false) {
      return NextResponse.json({ error: 'Cupons não estão habilitados para este produto.' }, { status: 400 })
    }
    const couponItemType: 'material' | 'package' | 'manual_clinico' =
      resolved.productType === 'manual_clinico'
        ? 'manual_clinico'
        : (resolved.grant.itemType === 'package' ? 'package' : 'material')
    try {
      couponValidation = await validateCouponForCheckout(db, {
        code: data.couponCode,
        amountBeforeCoupon: amount,
        userId: session?.userId,
        userEmail: buyer.email,
        items: [{
          itemType: couponItemType,
          itemId: resolved.productId,
          itemTitle: resolved.productTitle,
          materialType: resolved.productType === 'flashcard' ? 'flashcard_deck' : undefined,
          price: amount,
        }],
      })
      couponDiscountAmount = couponValidation.discountAmount
    } catch (err: any) {
      if (err instanceof CouponError) {
        return NextResponse.json({ error: err.message }, { status: err.status })
      }
      throw err
    }
  }

  if (tierDiscountAmount > 0 || couponDiscountAmount > 0) {
    const combined = combineTierAndCouponDiscount({
      basePrice: amount,
      tierDiscountAmount,
      couponDiscountAmount,
    })
    amount = combined.finalPrice
    if (combined.appliedSource !== 'coupon') {
      couponValidation = null
    }
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Valor inválido após o desconto.' }, { status: 400 })
  }

  const receiptToken = generateReceiptToken()
  const now = new Date()

  const orderDoc: Omit<PaymentOrder, '_id'> = {
    userId: session?.userId,
    payerEmail: buyer.email,
    payerName: buyer.name,
    provider: 'mercado_pago',
    type: orderTypeFor(resolved.productType),
    refId: resolved.productId,
    amount,
    currency: 'BRL',
    status: 'pending',
    idempotencyKey: '',
    metadata: {
      serialKeyPurchase: true,
      serialKeyGrant: resolved.grant,
      productType: resolved.productType,
      itemType: data.itemType,
      itemTitle: resolved.productTitle,
      buyerName: buyer.name,
      buyerEmail: buyer.email,
      buyerPhone: buyer.phone,
      receiptToken,
      guest: !session,
      ip,
      userAgent,
      source: 'Serial Key',
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

  // Reserva o cupom vinculado à order. Aprovação/liberação ocorrem em
  // applyPaymentResult conforme o status do pagamento (por orderId).
  if (couponValidation) {
    try {
      await reserveCouponRedemption(db, {
        validation: couponValidation,
        userId: session?.userId || '',
        userName: buyer.name,
        userEmail: buyer.email,
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
    productType: analyticsTypeFor(resolved.productType),
    productTitle: resolved.productTitle,
    paymentMethod: data.paymentMethodId,
    source: 'Serial Key',
    ...getRequestAnalyticsMeta(request),
  })

  try {
    const provider = getPaymentProvider()
    const result = await provider.createPayment({
      externalReference: orderId,
      amount,
      currency: 'BRL',
      description: resolved.description,
      payerEmail: buyer.email,
      payerName: buyer.name,
      idempotencyKey,
      paymentMethodId: data.paymentMethodId,
      cardToken: data.cardToken,
      installments: data.installments,
      issuer: data.issuer,
      payerDocumentType: data.payerDocumentType,
      payerDocumentNumber: data.payerDocumentNumber,
      metadata: {
        orderId,
        type: 'serial_key',
        productType: resolved.productType,
      },
    })

    // Aplica resultado (idempotente). Se aprovado (cartão), a serial key já é
    // gerada e o e-mail enviado aqui. Pix/boleto: acontece no webhook.
    await applyPaymentResult(orderId, result)

    await audit({
      action: 'order_created',
      actorUserId: session?.userId,
      resourceType: 'serial_key',
      resourceId: orderId,
      metadata: { amount, productType: resolved.productType, paymentMethod: data.paymentMethodId, guest: !session },
      ip,
      userAgent,
    })

    return NextResponse.json({
      orderId,
      receiptToken,
      providerPaymentId: result.providerOrderId,
      status: result.status,
      paymentMethod: result.paymentMethod,
      pix: result.pix || null,
      boleto: result.boleto || null,
      statusDetail: result.statusDetail,
      amount,
      successRedirect: getSuccessUrl(orderId, receiptToken),
    })
  } catch (err: any) {
    console.error('[serial-keys/checkout] erro ao criar payment:', err)
    if (couponValidation) {
      await releaseCouponRedemption(db, orderId, 'provider_error')
    }
    await db.collection<PaymentOrder>('payment_orders').updateOne(
      { _id: inserted.insertedId },
      { $set: { status: 'rejected', statusDetail: 'provider_error', updatedAt: new Date() } }
    )
    return NextResponse.json(
      { error: err?.message || 'Falha ao criar pagamento' },
      { status: 502 }
    )
  }
}

/**
 * Checkout de CARRINHO com Serial Keys: uma Serial Key por produto.
 * Resolve os itens na fonte autoritativa (preços + lote dinâmico), soma o
 * total e cria uma única order que, ao ser aprovada, gera N keys.
 */
async function handleCartCheckout(
  request: NextRequest,
  ip: string,
  userAgent: string | undefined,
  session: Awaited<ReturnType<typeof getSession>>,
  data: z.infer<typeof CartSchema>
) {
  const buyerParsed = parseBuyerInfo({ name: data.buyerName, email: data.buyerEmail, phone: data.buyerPhone })
  if (!buyerParsed.ok) return NextResponse.json({ error: buyerParsed.error }, { status: 400 })
  const buyer = buyerParsed.buyer

  const db = await getDb()

  // Métodos de pagamento habilitados.
  const adminSettings = await db.collection('admin_settings').findOne({})
  const enabledMethods = { ...DEFAULT_PAYMENT_METHODS, ...(adminSettings?.paymentMethods || {}) }
  const method = data.paymentMethodId
  if (method === 'pix' && !enabledMethods.pix) return NextResponse.json({ error: 'Pagamento por Pix não está disponível no momento.' }, { status: 400 })
  if ((method === 'credit_card' || method === 'debit_card') && !enabledMethods.credit_card) return NextResponse.json({ error: 'Pagamento por cartão não está disponível no momento.' }, { status: 400 })
  if (method === 'boleto' && !enabledMethods.boleto) return NextResponse.json({ error: 'Pagamento por boleto não está disponível no momento.' }, { status: 400 })

  // Resolve o carrinho na fonte autoritativa (guest não possui nada).
  // Para visitante (sem sessão) não checamos posse por e-mail — mantém o preço
  // idêntico ao preview público. Logado usa a própria sessão.
  const cartSession: MaterialCartSession = {
    userId: session?.userId || '',
    name: session ? undefined : buyer.name,
    email: session?.email,
    role: session?.role,
  }
  const resolution = await resolveMaterialCart(db, cartSession, data.cart)
  if (resolution.payableItems.length === 0) {
    return NextResponse.json({ error: 'Nenhum item pago disponível no carrinho.' }, { status: 400 })
  }

  // Lote dinâmico — desconto por item.
  const tierCalc = await computeCartTierDiscounts(
    db,
    resolution.payableItems.map((item) => ({
      itemType: item.itemType,
      itemId: item.itemId,
      price: item.price,
      pricingEventId: item.pricingEventId,
    }))
  )
  const tierDiscountById = new Map(
    tierCalc.perItem.map((entry) => [`${entry.itemType}:${entry.itemId}`, entry.tierDiscountAmount])
  )

  // Cupom (compra sem login). Validamos sobre os itens a preço cheio; depois
  // escolhemos o MAIOR desconto entre lote e cupom ("maior dos dois").
  let couponValidation: CouponValidationResult | null = null
  let couponDiscountAmount = 0
  if (data.couponCode && resolution.amount > 0) {
    try {
      couponValidation = await validateCouponForCheckout(db, {
        code: data.couponCode,
        amountBeforeCoupon: resolution.amount,
        userId: session?.userId,
        userEmail: buyer.email,
        items: resolution.payableItems.map((item) => ({
          itemType: item.itemType,
          itemId: item.itemId,
          itemTitle: item.itemTitle,
          materialType: item.materialType,
          price: item.price,
        })),
      })
      couponDiscountAmount = couponValidation.discountAmount
    } catch (err: any) {
      if (err instanceof CouponError) {
        return NextResponse.json({ error: err.message }, { status: err.status })
      }
      throw err
    }
  }

  const combined = combineTierAndCouponDiscount({
    basePrice: resolution.amount,
    tierDiscountAmount: tierCalc.totalTierDiscount,
    couponDiscountAmount,
  })

  // Preço final por item conforme a fonte de desconto vencedora.
  let pricedItems = resolution.payableItems.map((item) => ({ ...item }))
  if (combined.appliedSource === 'coupon' && couponValidation) {
    pricedItems = applyCouponDiscountsToItems(resolution.payableItems, couponValidation.items)
  } else {
    // Lote (ou nenhum): aplica o desconto de lote por item.
    couponValidation = null
    pricedItems = resolution.payableItems.map((item) => {
      const discount = tierDiscountById.get(`${item.itemType}:${item.itemId}`) || 0
      return { ...item, price: Math.max(0, Math.round((item.price - discount) * 100) / 100) }
    })
  }

  // Monta as entradas de Serial Key (uma por item pago) com o preço final.
  const serialKeyCart = pricedItems.map((item) => {
    const isFlashcard = item.materialType === 'flashcard_deck' || Boolean(item.linkedDeckSlug)
    const productType: SerialKeyProductType = item.itemType === 'package' ? 'package' : (isFlashcard ? 'flashcard' : 'material')
    const grant: SerialKeyGrant = {
      productType,
      itemType: item.itemType,
      itemId: item.itemId,
      itemTitle: item.itemTitle,
      linkedDeckSlug: item.linkedDeckSlug,
    }
    return { grant, productTitle: item.itemTitle, amount: Math.max(0, Math.round(item.price * 100) / 100) }
  })

  const amount = Math.round(serialKeyCart.reduce((s, i) => s + i.amount, 0) * 100) / 100
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
  }

  const receiptToken = generateReceiptToken()
  const now = new Date()
  const itemCount = serialKeyCart.length
  const description = `Carrinho DomineAqui - ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`

  const orderDoc: Omit<PaymentOrder, '_id'> = {
    userId: session?.userId,
    payerEmail: buyer.email,
    payerName: buyer.name,
    provider: 'mercado_pago',
    type: 'material',
    refId: serialKeyCart[0]?.grant.itemId,
    amount,
    currency: 'BRL',
    status: 'pending',
    idempotencyKey: '',
    metadata: {
      serialKeyPurchase: true,
      serialKeyCart,
      productType: 'material',
      itemType: 'cart',
      itemTitle: description,
      buyerName: buyer.name,
      buyerEmail: buyer.email,
      buyerPhone: buyer.phone,
      receiptToken,
      guest: !session,
      ip,
      userAgent,
      source: 'Serial Key (carrinho)',
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
        userId: session?.userId || '',
        userName: buyer.name,
        userEmail: buyer.email,
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
    productId: 'cart',
    productTitle: description,
    productType: 'material',
    paymentMethod: data.paymentMethodId,
    source: 'Serial Key',
    metadata: { itemType: 'cart', cartSize: itemCount },
    ...getRequestAnalyticsMeta(request),
  })

  try {
    const provider = getPaymentProvider()
    const result = await provider.createPayment({
      externalReference: orderId,
      amount,
      currency: 'BRL',
      description,
      payerEmail: buyer.email,
      payerName: buyer.name,
      idempotencyKey,
      paymentMethodId: data.paymentMethodId,
      cardToken: data.cardToken,
      installments: data.installments,
      issuer: data.issuer,
      payerDocumentType: data.payerDocumentType,
      payerDocumentNumber: data.payerDocumentNumber,
      metadata: { orderId, type: 'serial_key_cart', cartSize: String(itemCount) },
    })

    await applyPaymentResult(orderId, result)
    await audit({
      action: 'order_created',
      actorUserId: session?.userId,
      resourceType: 'serial_key',
      resourceId: orderId,
      metadata: { amount, cartSize: itemCount, paymentMethod: data.paymentMethodId, guest: !session },
      ip,
      userAgent,
    })

    return NextResponse.json({
      orderId,
      receiptToken,
      providerPaymentId: result.providerOrderId,
      status: result.status,
      paymentMethod: result.paymentMethod,
      pix: result.pix || null,
      boleto: result.boleto || null,
      statusDetail: result.statusDetail,
      amount,
      successRedirect: getSuccessUrl(orderId, receiptToken),
    })
  } catch (err: any) {
    console.error('[serial-keys/checkout/cart] erro ao criar payment:', err)
    if (couponValidation) {
      await releaseCouponRedemption(db, orderId, 'provider_error')
    }
    await db.collection<PaymentOrder>('payment_orders').updateOne(
      { _id: inserted.insertedId },
      { $set: { status: 'rejected', statusDetail: 'provider_error', updatedAt: new Date() } }
    )
    return NextResponse.json({ error: err?.message || 'Falha ao criar pagamento' }, { status: 502 })
  }
}
