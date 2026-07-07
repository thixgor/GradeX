import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { getPaymentProvider, deriveIdempotencyKey } from '@/lib/payments'
import { applyPaymentResult } from '@/lib/payments/effects'
import { audit } from '@/lib/payments/audit'
import { computeFreight, estimateDeliveryDate, generateOrderNumber, defaultShopSettings } from '@/lib/shop'
import type { PaymentOrder, PhysicalProduct, ShopOrder, ShopOrderItem, ShopSettings } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const AddressSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().max(30).optional(),
  cep: z.string().min(8).max(9),
  street: z.string().min(1).max(160),
  number: z.string().min(1).max(20),
  complement: z.string().max(120).optional(),
  district: z.string().min(1).max(120),
  city: z.string().min(1).max(120),
  uf: z.string().length(2),
})

const Schema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1).max(20),
    versionId: z.string().optional(),
  })).min(1).max(20),
  deliveryType: z.enum(['pickup', 'shipping']),
  pickupPointId: z.string().optional(),
  shippingAddress: AddressSchema.optional(),
  deliveryMethodId: z.string().optional(),
  // Pagamento
  paymentMethodId: z.string().min(1),
  cardToken: z.string().optional(),
  installments: z.number().int().min(1).max(12).optional(),
  issuer: z.string().optional(),
  payerDocumentType: z.enum(['CPF', 'CNPJ']).optional(),
  payerDocumentNumber: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await checkRateLimit(ip, 'loja_checkout', 20, 60_000)
  if (!rl.success) return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })

  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }) }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data
  const db = await getDb()

  // ── Resolve produtos e valida estoque ──
  const ids = data.items.map((i) => i.productId).filter((id) => ObjectId.isValid(id))
  if (ids.length !== data.items.length) {
    return NextResponse.json({ error: 'Item inválido no carrinho' }, { status: 400 })
  }
  const products = await db
    .collection<PhysicalProduct>('physical_products')
    .find({ _id: { $in: ids.map((id) => new ObjectId(id)) } })
    .toArray()
  const byId = new Map(products.map((p) => [String(p._id), p]))

  const orderItems: ShopOrderItem[] = []
  let subtotal = 0
  let maxProductionDays = 0

  for (const line of data.items) {
    const p = byId.get(line.productId)
    if (!p || p.isHidden) {
      return NextResponse.json({ error: 'Produto indisponível' }, { status: 404 })
    }
    // Add-on só pode ser comprado junto ao material digital (via /materiais/checkout).
    if (p.linkMode === 'addon') {
      return NextResponse.json({
        error: `"${p.title}" só pode ser comprado junto ao material digital vinculado.`,
      }, { status: 400 })
    }
    if (p.trackStock && typeof p.stock === 'number' && p.stock < line.quantity) {
      return NextResponse.json({ error: `Estoque insuficiente para "${p.title}"` }, { status: 409 })
    }
    const baseUnit = p.price // add-ons já rejeitados acima

    // Resolve a versão escolhida (quando o produto tem versões).
    let versionId: string | undefined
    let versionName: string | undefined
    let unitPrice = baseUnit
    if (Array.isArray(p.versions) && p.versions.length > 0) {
      const version = p.versions.find((v) => v.id === line.versionId)
      if (!version) {
        return NextResponse.json({ error: `Selecione uma versão para "${p.title}"` }, { status: 400 })
      }
      versionId = version.id
      versionName = version.name
      unitPrice = typeof version.price === 'number' ? version.price : baseUnit
    }

    subtotal += unitPrice * line.quantity
    if (p.madeToOrder && p.productionDays) {
      maxProductionDays = Math.max(maxProductionDays, p.productionDays)
    }
    orderItems.push({
      productId: String(p._id),
      title: p.title,
      imageUrl: p.images?.[0],
      unitPrice,
      quantity: line.quantity,
      versionId,
      versionName,
      isAddon: false,
      linkedMaterialId: p.linkedMaterialId,
      madeToOrder: p.madeToOrder,
      productionDays: p.productionDays,
    })
  }
  subtotal = Math.round(subtotal * 100) / 100

  // ── Entrega + frete ──
  const settings =
    (await db.collection<ShopSettings>('shop_settings').findOne({ settingsId: 'shop' })) ||
    (defaultShopSettings() as ShopSettings)

  let freight = 0
  let deliveryMeta: Partial<ShopOrder> = {}

  if (data.deliveryType === 'pickup') {
    const point = (settings.pickupPoints || []).find((pp) => pp.id === data.pickupPointId && pp.enabled)
    if (!point) return NextResponse.json({ error: 'Ponto de retirada inválido' }, { status: 400 })
    deliveryMeta = {
      deliveryType: 'pickup',
      pickupPointId: point.id,
      pickupPointName: point.name,
      estimatedDeliveryDate: estimateDeliveryDate({ deliveryType: 'pickup', maxProductionDays }),
    }
  } else {
    if (!data.shippingAddress) {
      return NextResponse.json({ error: 'Endereço de entrega obrigatório' }, { status: 400 })
    }
    const method = (settings.deliveryMethods || []).find((m) => m.id === data.deliveryMethodId && m.enabled)
    if (!method) return NextResponse.json({ error: 'Método de entrega inválido' }, { status: 400 })
    freight = computeFreight({ method, uf: data.shippingAddress.uf, physicalSubtotal: subtotal, settings })
    deliveryMeta = {
      deliveryType: 'shipping',
      shippingAddress: { ...data.shippingAddress, uf: data.shippingAddress.uf.toUpperCase() },
      deliveryMethodId: method.id,
      deliveryMethodName: method.name,
      estimatedDeliveryDate: estimateDeliveryDate({ deliveryType: 'shipping', method, maxProductionDays }),
    }
  }

  const total = Math.round((subtotal + freight) * 100) / 100
  if (total <= 0) {
    return NextResponse.json({ error: 'Valor total inválido' }, { status: 400 })
  }

  const now = new Date()

  // ── Cria o pedido físico (draft) ──
  const orderNumber = generateOrderNumber()
  const shopOrderDoc: Omit<ShopOrder, '_id'> = {
    orderNumber,
    userId: session.userId,
    userName: session.name,
    userEmail: session.email,
    items: orderItems,
    subtotal,
    freight,
    discount: 0,
    total,
    ...(deliveryMeta as any),
    provider: 'mercado_pago',
    paymentStatus: 'pending',
    status: 'awaiting_payment',
    statusHistory: [{ status: 'awaiting_payment', at: now }],
    createdAt: now,
    updatedAt: now,
  }
  const shopInsert = await db.collection('shop_orders').insertOne(shopOrderDoc as any)
  const shopOrderId = String(shopInsert.insertedId)

  // ── Cria a order de pagamento ──
  const orderDoc: Omit<PaymentOrder, '_id'> = {
    userId: session.userId,
    payerEmail: session.email,
    payerName: session.name,
    provider: 'mercado_pago',
    type: 'physical',
    refId: shopOrderId,
    amount: total,
    currency: 'BRL',
    status: 'pending',
    idempotencyKey: '',
    metadata: { shopOrderId, orderNumber, itemCount: orderItems.length },
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
  await db.collection('shop_orders').updateOne(
    { _id: shopInsert.insertedId },
    { $set: { providerOrderId: orderId, updatedAt: new Date() } }
  )

  try {
    const provider = getPaymentProvider()
    const result = await provider.createPayment({
      externalReference: orderId,
      amount: total,
      currency: 'BRL',
      description: `Pedido ${orderNumber} — DomineAqui`,
      payerEmail: session.email,
      payerName: session.name,
      idempotencyKey,
      paymentMethodId: data.paymentMethodId,
      cardToken: data.cardToken,
      installments: data.installments,
      issuer: data.issuer,
      payerDocumentType: data.payerDocumentType,
      payerDocumentNumber: data.payerDocumentNumber,
      metadata: { orderId, type: 'physical', shopOrderId },
    })

    // Reflete status de pagamento no pedido físico e dispara efeitos (idempotente)
    await db.collection('shop_orders').updateOne(
      { _id: shopInsert.insertedId },
      { $set: { providerPaymentId: result.providerOrderId, paymentStatus: result.status, updatedAt: new Date() } }
    )
    await applyPaymentResult(orderId, result)

    await audit({
      action: 'order_created',
      actorUserId: session.userId,
      targetUserId: session.userId,
      resourceType: 'physical',
      resourceId: shopOrderId,
      metadata: { orderNumber, amount: total, freight, paymentMethod: data.paymentMethodId, providerPaymentId: result.providerOrderId },
      ip,
    })

    return NextResponse.json({
      orderId,
      shopOrderId,
      orderNumber,
      providerPaymentId: result.providerOrderId,
      status: result.status,
      paymentMethod: result.paymentMethod,
      pix: result.pix || null,
      boleto: result.boleto || null,
      statusDetail: result.statusDetail,
      amount: total,
      freight,
      successRedirect: '/profile?tab=pedidos',
    })
  } catch (err: any) {
    console.error('[loja/checkout] erro:', err)
    await db.collection<PaymentOrder>('payment_orders').updateOne(
      { _id: inserted.insertedId },
      { $set: { status: 'rejected', statusDetail: 'provider_error', updatedAt: new Date() } }
    )
    await db.collection('shop_orders').updateOne(
      { _id: shopInsert.insertedId },
      { $set: { paymentStatus: 'rejected', updatedAt: new Date() } }
    )
    return NextResponse.json({ error: err?.message || 'Falha ao criar pagamento' }, { status: 502 })
  }
}
