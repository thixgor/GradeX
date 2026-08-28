import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { getPaymentProvider, deriveIdempotencyKey } from '@/lib/payments'
import { applyPaymentResult } from '@/lib/payments/effects'
import { audit } from '@/lib/payments/audit'
import { chargeMetadata, computeCheckoutCharge, getFeePolicy } from '@/lib/payments/fees'
import { resolveCheckoutCpf } from '@/lib/payments/checkout-identity'
import { computeFreight, estimateDeliveryDate, generateOrderNumber, defaultShopSettings, physicalFullPrice } from '@/lib/shop'
import type { ProviderOrder } from '@/lib/payments/types'
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
    if (p.trackStock && typeof p.stock === 'number' && p.stock < line.quantity) {
      return NextResponse.json({ error: `Estoque insuficiente para "${p.title}"` }, { status: 409 })
    }

    // Checkout só-físico: sem material na compra → sempre preço cheio (avulso).
    let versionId: string | undefined
    let versionName: string | undefined
    let version: any
    if (Array.isArray(p.versions) && p.versions.length > 0) {
      version = p.versions.find((v) => v.id === line.versionId)
      if (!version) {
        return NextResponse.json({ error: `Selecione uma versão para "${p.title}"` }, { status: 400 })
      }
      versionId = version.id
      versionName = version.name
    }
    const unitPrice = physicalFullPrice(p, version)

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
      isAddon: p.linkMode === 'addon',
      linkedMaterialId: p.linkedMaterialId,
      linkedPackageId: p.linkedPackageId,
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
  if (total < 0) {
    return NextResponse.json({ error: 'Valor total inválido' }, { status: 400 })
  }
  // Pedido gratuito (produto grátis + frete grátis): concluído sem passar pelo
  // provedor de pagamento. Um produto pago nunca pode usar a via 'free'.
  const isFreeOrder = total === 0
  if (!isFreeOrder && data.paymentMethodId === 'free') {
    return NextResponse.json({ error: 'Pedido pago exige uma forma de pagamento válida.' }, { status: 400 })
  }

  // CPF obrigatório (nota fiscal), exceto no pedido 100% gratuito, que não
  // gera cobrança nem nota. Vinculado ao perfil quando a conta não tem um.
  let payerCpf = ''
  if (!isFreeOrder) {
    const cpfResult = await resolveCheckoutCpf(db, {
      cpf: data.payerDocumentNumber,
      documentType: data.payerDocumentType,
      userId: session.userId,
      paymentMethodId: data.paymentMethodId,
      hasCardToken: !!data.cardToken,
    })
    if (!cpfResult.ok) {
      return NextResponse.json({ error: cpfResult.error }, { status: cpfResult.status })
    }
    payerCpf = cpfResult.cpf
  }

  // Taxa operacional / juros do parcelamento, somados ao que será cobrado.
  // `total` (mercadoria + frete) segue sendo o valor do PEDIDO — é o número
  // com que a logística e o financeiro trabalham; `chargedTotal` é o que sai
  // do cartão do comprador.
  const charge = computeCheckoutCharge({
    baseAmount: total,
    paymentMethodId: data.paymentMethodId,
    installments: data.installments,
    hasCardToken: !!data.cardToken,
    policy: getFeePolicy(),
  })
  const chargedTotal = charge.totalAmount

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
    paymentFee: charge.feeAmount,
    chargedTotal,
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
    amount: chargedTotal,
    baseAmount: charge.baseAmount,
    feeAmount: charge.feeAmount,
    currency: 'BRL',
    status: 'pending',
    idempotencyKey: '',
    metadata: { shopOrderId, orderNumber, itemCount: orderItems.length, ...chargeMetadata(charge) },
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

  // ── Pedido gratuito: libera direto, sem provedor de pagamento ──
  if (isFreeOrder) {
    try {
      const result: ProviderOrder = {
        providerOrderId: `free-${orderId}`,
        status: 'approved',
        amount: 0,
        currency: 'BRL',
        paymentMethod: 'unknown',
        statusDetail: 'free_order',
        paidAt: now,
      }
      await db.collection('shop_orders').updateOne(
        { _id: shopInsert.insertedId },
        { $set: { providerPaymentId: result.providerOrderId, paymentStatus: 'approved', updatedAt: new Date() } }
      )
      await applyPaymentResult(orderId, result)

      await audit({
        action: 'order_created',
        actorUserId: session.userId,
        targetUserId: session.userId,
        resourceType: 'physical',
        resourceId: shopOrderId,
        metadata: { orderNumber, amount: 0, freight, paymentMethod: 'free', providerPaymentId: result.providerOrderId },
        ip,
      })

      return NextResponse.json({
        orderId,
        shopOrderId,
        orderNumber,
        providerPaymentId: result.providerOrderId,
        status: 'approved',
        amount: 0,
        freight,
        free: true,
        successRedirect: '/profile?tab=pedidos',
      })
    } catch (err: any) {
      console.error('[loja/checkout] erro (pedido gratuito):', err)
      await db.collection<PaymentOrder>('payment_orders').updateOne(
        { _id: inserted.insertedId },
        { $set: { status: 'rejected', statusDetail: 'free_order_error', updatedAt: new Date() } }
      )
      await db.collection('shop_orders').updateOne(
        { _id: shopInsert.insertedId },
        { $set: { paymentStatus: 'rejected', updatedAt: new Date() } }
      )
      return NextResponse.json({ error: err?.message || 'Falha ao concluir o pedido' }, { status: 500 })
    }
  }

  try {
    const provider = getPaymentProvider()
    const result = await provider.createPayment({
      externalReference: orderId,
      amount: chargedTotal,
      // A comissão do sócio incide sobre o pedido, não sobre a taxa do MP.
      commissionableAmount: total,
      currency: 'BRL',
      description: `Pedido ${orderNumber} — DomineAqui`,
      payerEmail: session.email,
      payerName: session.name,
      idempotencyKey,
      paymentMethodId: data.paymentMethodId,
      cardToken: data.cardToken,
      installments: data.installments,
      issuer: data.issuer,
      payerDocumentType: payerCpf ? 'CPF' : undefined,
      payerDocumentNumber: payerCpf || undefined,
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
      metadata: { orderNumber, amount: chargedTotal, freight, paymentMethod: data.paymentMethodId, providerPaymentId: result.providerOrderId, ...chargeMetadata(charge) },
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
      amount: chargedTotal,
      baseAmount: total,
      feeAmount: charge.feeAmount,
      feeLabel: charge.label,
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
