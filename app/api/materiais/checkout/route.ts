import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { getPaymentProvider, deriveIdempotencyKey } from '@/lib/payments'
import { applyPaymentResult } from '@/lib/payments/effects'
import { audit } from '@/lib/payments/audit'
import { getRequestAnalyticsMeta, recordCheckoutEvent, recordOrderCheckoutEvent } from '@/lib/analytics'
import { computeEffectivePackagePrice } from '@/lib/material-package-pricing'
import {
  applyCouponDiscountsToItems,
  couponAnalyticsMetadata,
  CouponError,
  reserveCouponRedemption,
  releaseCouponRedemption,
  validateCouponForCheckout,
  type CouponValidationResult,
} from '@/lib/coupons'
import {
  MAX_MATERIAL_CART_ITEMS,
  grantMaterialCartItems,
  resolveMaterialCart,
  serializeMaterialCartItem,
} from '@/lib/material-cart'
import {
  computeCartTierDiscounts,
  combineTierAndCouponDiscount,
  getPricingEventStateById,
  serializePricingEventState,
} from '@/lib/pricing-events'
import type { PaymentOrder, MaterialPurchase } from '@/lib/types'
import { buildPhysicalShopOrder } from '@/lib/shop-order'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Cria pagamento para material/pacote via Mercado Pago.
 * Para itens gratuitos, libera diretamente.
 */
const paymentFields = {
  paymentMethodId: z.string().min(1),
  cardToken: z.string().optional(),
  installments: z.number().int().min(1).max(12).optional(),
  issuer: z.string().optional(),
  payerDocumentType: z.enum(['CPF', 'CNPJ']).optional(),
  payerDocumentNumber: z.string().optional(),
  couponCode: z.string().max(80).optional(),
}

const Schema = z.object({
  itemType: z.enum(['material', 'package']),
  itemId: z.string().min(1),
  ...paymentFields,
})

const CartSchema = z.object({
  items: z.array(z.object({
    itemType: z.enum(['material', 'package']),
    itemId: z.string().min(1),
  })).min(1).max(MAX_MATERIAL_CART_ITEMS),
  ...paymentFields,
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await checkRateLimit(ip, 'materiais_checkout', 20, 60_000)
  if (!rl.success) return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })

  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }) }

  const parsedCart = CartSchema.safeParse(body)
  if (parsedCart.success) {
    // physical é passado à parte (zod remove chaves desconhecidas do schema).
    return handleCartCheckout(request, ip, session, { ...parsedCart.data, physical: body?.physical } as any)
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  const data = parsed.data

  const db = await getDb()
  if (!ObjectId.isValid(data.itemId)) {
    return NextResponse.json({ error: 'itemId inválido' }, { status: 400 })
  }
  const collection = data.itemType === 'package' ? 'material_packages' : 'materials'
  const item = await db.collection(collection).findOne({ _id: new ObjectId(data.itemId) })
  if (!item) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })

  const userPurchaseOr: any[] = [{ userId: session.userId }]
  if (session.email) {
    userPurchaseOr.push({
      userEmail: {
        $regex: new RegExp(`^${session.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      },
    })
  }

  const alreadyOwnedRedirect = item.type === 'flashcard_deck' && item.linkedDeckSlug
    ? `/flashcards/d/${item.linkedDeckSlug}`
    : data.itemType === 'package'
      ? `/pacotes/${data.itemId}`
      : `/materiais/${data.itemId}`

  if (session.role === 'admin') {
    return NextResponse.json({
      error: data.itemType === 'package'
        ? 'Você já possui acesso a este pacote.'
        : 'Você já possui acesso a este material.',
      alreadyOwned: true,
      redirectTo: alreadyOwnedRedirect,
    }, { status: 409 })
  }

  // Bloqueia recompra
  const existing = await db.collection<MaterialPurchase>('material_purchases').findOne({
    itemType: data.itemType,
    itemId: data.itemId,
    status: 'completed',
    $or: userPurchaseOr,
  })
  if (existing) {
    return NextResponse.json({
      error: 'Você já adquiriu este item',
      alreadyOwned: true,
      redirectTo: alreadyOwnedRedirect,
    }, { status: 409 })
  }

  // Material individual também é considerado adquirido quando o usuário
  // comprou algum pacote que contém esse material. Isso fecha URL direta
  // de checkout e mantém a regra no servidor.
  if (data.itemType === 'material') {
    const packages = await db.collection('material_packages')
      .find({ materialIds: data.itemId, isHidden: { $ne: true } })
      .project({ _id: 1 })
      .toArray()
    const packageIds = packages.map((pkg: any) => String(pkg._id))

    if (packageIds.length > 0) {
      const packagePurchase = await db.collection<MaterialPurchase>('material_purchases').findOne({
        itemType: 'package',
        itemId: { $in: packageIds },
        status: 'completed',
        $or: userPurchaseOr,
      } as any)

      if (packagePurchase) {
        return NextResponse.json({
          error: 'Você já possui este material por meio de um pacote',
          alreadyOwned: true,
          redirectTo: alreadyOwnedRedirect,
        }, { status: 409 })
      }
    }
  }

  // ─── Anti-burla: desconto proporcional em pacotes ─────────────
  // Se o usuário já comprou algum material que faz parte do pacote,
  // descontamos proporcionalmente. Calculamos no servidor — nunca confiamos
  // em valores enviados pelo cliente.
  let effectivePrice = Number(item.price || 0)
  let pricingMeta: ReturnType<typeof computeEffectivePackagePrice> | null = null

  if (data.itemType === 'package' && Array.isArray(item.materialIds) && item.materialIds.length > 0) {
    const materialObjectIds = (item.materialIds as string[])
      .map((mid) => { try { return new ObjectId(mid) } catch { return null } })
      .filter(Boolean) as ObjectId[]

    const pkgMaterials = materialObjectIds.length > 0
      ? await db.collection('materials')
          .find({ _id: { $in: materialObjectIds } })
          .project({ pricing: 1, price: 1 })
          .toArray()
      : []

    const materialIdsStr = pkgMaterials.map((m: any) => String(m._id))
    const materialIdsSet = new Set(materialIdsStr)
    const ownedSet = new Set<string>()
    if (materialIdsStr.length > 0) {
      // 1) Materiais do pacote comprados individualmente.
      const baseFilter = {
        itemType: 'material',
        status: 'completed',
        itemId: { $in: materialIdsStr },
      }
      const byUserId = await db.collection('material_purchases')
        .find({ ...baseFilter, userId: session.userId })
        .project({ itemId: 1 })
        .toArray()
      let byEmail: any[] = []
      if (session.email) {
        const emailRegex = new RegExp(
          `^${session.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
          'i'
        )
        byEmail = await db.collection('material_purchases')
          .find({ ...baseFilter, userEmail: { $regex: emailRegex } })
          .project({ itemId: 1 })
          .toArray()
      }
      for (const p of [...byUserId, ...byEmail]) ownedSet.add(String(p.itemId))

      // 2) Materiais do pacote que o usuário já possui por meio de OUTROS pacotes.
      const ownedPackages = await db.collection('material_purchases')
        .find({ itemType: 'package', status: 'completed', $or: userPurchaseOr } as any)
        .project({ itemId: 1 })
        .toArray()
      const ownedPkgObjectIds = ownedPackages
        .map((p: any) => String(p.itemId))
        .filter((id: string) => id !== data.itemId && ObjectId.isValid(id))
        .map((id: string) => new ObjectId(id))
      if (ownedPkgObjectIds.length > 0) {
        const otherPkgs = await db.collection('material_packages')
          .find({ _id: { $in: ownedPkgObjectIds } })
          .project({ materialIds: 1 })
          .toArray()
        for (const pkg of otherPkgs as any[]) {
          for (const mid of pkg.materialIds || []) {
            const midStr = String(mid)
            if (materialIdsSet.has(midStr)) ownedSet.add(midStr)
          }
        }
      }
    }
    const purchasedMaterialIds = Array.from(ownedSet)

    pricingMeta = computeEffectivePackagePrice({
      pkgPrice: Number(item.price || 0),
      materials: pkgMaterials.map((m: any) => ({
        _id: String(m._id),
        pricing: m.pricing,
        price: m.price,
      })),
      ownedMaterialIds: purchasedMaterialIds,
    })
    effectivePrice = pricingMeta.effectivePrice

    // Já possui TODOS os materiais pagos do pacote → bloqueia (mesma regra do carrinho).
    // Evita "comprar"/adquirir um pacote cujo conteúdo o usuário já tem por inteiro.
    if (
      item.pricing !== 'free' &&
      pricingMeta.totalPaidIndividualValue > 0 &&
      pricingMeta.ownedValue >= pricingMeta.totalPaidIndividualValue
    ) {
      return NextResponse.json({
        error: 'Você já possui todos os materiais deste pacote.',
        alreadyOwned: true,
        redirectTo: '/materiais?tab=mine',
      }, { status: 409 })
    }
  }

  let amount = Number(effectivePrice)
  let couponValidation: CouponValidationResult | null = null

  // Lote dinâmico por evento — aplica desconto progressivo se houver evento ativo.
  const pricingEventState = item.pricingEventId
    ? await getPricingEventStateById(db, String(item.pricingEventId))
    : null
  let tierDiscountAmount = 0
  if (pricingEventState?.activeTier && amount > 0) {
    tierDiscountAmount = Math.max(
      0,
      Math.round(amount * (pricingEventState.activeTier.discountPercent / 100) * 100) / 100
    )
  }

  let couponDiscountAmount = 0
  if (data.couponCode && amount > 0) {
    try {
      couponValidation = await validateCouponForCheckout(db, {
        code: data.couponCode,
        amountBeforeCoupon: amount,
        userId: session.userId,
        userEmail: session.email,
        items: [{
          itemType: data.itemType,
          itemId: data.itemId,
          itemTitle: item.title || 'Item',
          materialType: item.type,
          price: amount,
        }],
      })
      couponDiscountAmount = couponValidation.discountAmount
    } catch (error: any) {
      if (error instanceof CouponError) {
        return NextResponse.json({ error: error.message }, { status: error.status })
      }
      throw error
    }
  }

  // "Maior dos dois": lote OU cupom, o que der mais desconto vence.
  const combined = combineTierAndCouponDiscount({
    basePrice: amount,
    tierDiscountAmount,
    couponDiscountAmount,
  })
  amount = combined.finalPrice

  // Se o lote venceu, não reserva o cupom (mantém disponível para o usuário).
  if (combined.appliedSource !== 'coupon') {
    couponValidation = null
  }

  // ── Parte física (add-ons/produtos impressos pagos junto ao digital) ──
  let physicalShopOrderId: string | undefined
  let physicalTotal = 0
  const rawPhysical = body?.physical
  if (rawPhysical && Array.isArray(rawPhysical.items) && rawPhysical.items.length > 0) {
    // Materiais elegíveis desta compra (para validar add-ons "só junto ao material").
    const eligibleMaterialIds = new Set<string>()
    if (data.itemType === 'material') {
      eligibleMaterialIds.add(data.itemId)
    } else if (Array.isArray(item.materialIds)) {
      for (const mid of item.materialIds) eligibleMaterialIds.add(String(mid))
    }
    const built = await buildPhysicalShopOrder(
      db,
      { userId: session.userId, name: session.name, email: session.email },
      {
        items: rawPhysical.items.map((i: any) => ({
          productId: String(i.productId),
          quantity: Math.max(1, Math.min(20, Math.floor(Number(i.quantity) || 1))),
          versionId: i.versionId ? String(i.versionId) : undefined,
        })),
        deliveryType: rawPhysical.deliveryType === 'shipping' ? 'shipping' : 'pickup',
        pickupPointId: rawPhysical.pickupPointId,
        shippingAddress: rawPhysical.shippingAddress,
        deliveryMethodId: rawPhysical.deliveryMethodId,
      },
      { eligibleMaterialIds }
    )
    if (!built.ok) {
      return NextResponse.json({ error: built.error }, { status: built.status })
    }
    if (!built.empty) {
      physicalShopOrderId = built.shopOrderId
      physicalTotal = built.total
    }
  }

  // Free path — só quando digital gratuito E sem parte física a pagar.
  const digitalFree =
    item.pricing === 'free' ||
    !item.price ||
    item.price <= 0 ||
    effectivePrice <= 0 ||
    amount <= 0
  const isFreePath = digitalFree && physicalTotal <= 0

  if (isFreePath) {
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

    await db.collection<MaterialPurchase>('material_purchases').insertOne({
      userId: session.userId,
      userName: session.name,
      userEmail: session.email,
      itemType: data.itemType,
      itemId: data.itemId,
      itemTitle: item.title,
      price: 0,
      provider: 'mercado_pago',
      status: 'completed',
      purchasedAt: new Date(),
    } as any)
    await db.collection(collection).updateOne(
      { _id: new ObjectId(data.itemId) },
      { $inc: { downloadCount: 1 } }
    )
    await audit({
      action: 'material_unlocked',
      targetUserId: session.userId,
      resourceType: data.itemType,
      resourceId: data.itemId,
      metadata: {
        free: true,
        ...couponAnalyticsMetadata(couponValidation),
        ...(pricingMeta && pricingMeta.discountApplied > 0
          ? {
              packageDiscountApplied: pricingMeta.discountApplied,
              packageOriginalPrice: pricingMeta.originalPackagePrice,
              ownedMaterialIds: pricingMeta.ownedMaterialIds,
            }
          : {}),
      },
    })
    await recordCheckoutEvent({
      event: 'payment_approved',
      userId: session.userId,
      userName: session.name,
      userEmail: session.email,
      productId: data.itemId,
      productTitle: item.title,
      productType: item.type === 'flashcard_deck' ? 'flashcard' : data.itemType,
      amount: 0,
      paymentMethod: 'free',
      status: 'approved',
      source: data.itemType === 'package' ? 'Pacote' : 'Compra direta',
      metadata: {
        free: true,
        itemType: data.itemType,
        materialType: item.type,
        ...couponAnalyticsMetadata(couponValidation),
        ...(pricingMeta && pricingMeta.discountApplied > 0
          ? {
              packageDiscountApplied: pricingMeta.discountApplied,
              packageOriginalPrice: pricingMeta.originalPackagePrice,
            }
          : {}),
      },
      ...getRequestAnalyticsMeta(request),
    })
    return NextResponse.json({
      free: true,
      success: true,
      redirectTo: item.type === 'flashcard_deck' && item.linkedDeckSlug
        ? `/flashcards/d/${item.linkedDeckSlug}`
        : null,
    })
  }

  const description = item.title
  const paidAmount = Math.round((amount + physicalTotal) * 100) / 100

  // Cria order interna
  const now = new Date()
  const orderDoc: Omit<PaymentOrder, '_id'> = {
    userId: session.userId,
    payerEmail: session.email,
    payerName: session.name,
    provider: 'mercado_pago',
    type: 'material',
    refId: data.itemId,
    refSlug: item.linkedDeckSlug || undefined,
    amount: paidAmount,
    currency: 'BRL',
    status: 'pending',
    idempotencyKey: '',
    metadata: {
      itemType: data.itemType,
      itemTitle: item.title,
      ...(physicalShopOrderId ? { shopOrderId: physicalShopOrderId } : {}),
      ...(pricingMeta && pricingMeta.discountApplied > 0
        ? {
            packageOriginalPrice: pricingMeta.originalPackagePrice,
            packageDiscountApplied: pricingMeta.discountApplied,
            ownedMaterialIds: pricingMeta.ownedMaterialIds,
          }
        : {}),
      ...(combined.appliedSource === 'tier' && pricingEventState?.activeTier
        ? {
            pricingEventId: pricingEventState.eventId,
            pricingEventName: pricingEventState.name,
            pricingEventTierIndex: pricingEventState.activeTier.index,
            pricingEventTierDiscountPercent: pricingEventState.activeTier.discountPercent,
            pricingEventTierDiscountAmount: combined.appliedDiscountAmount,
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
  if (physicalShopOrderId) {
    await db.collection('shop_orders').updateOne(
      { _id: new ObjectId(physicalShopOrderId) },
      { $set: { providerOrderId: orderId, updatedAt: new Date() } }
    )
  }
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
    productTitle: item.title,
    productType: item.type === 'flashcard_deck' ? 'flashcard' : data.itemType,
    paymentMethod: data.paymentMethodId,
    metadata: { itemType: data.itemType, itemTitle: item.title, materialType: item.type },
    ...getRequestAnalyticsMeta(request),
  })

  try {
    const provider = getPaymentProvider()
    const result = await provider.createPayment({
      externalReference: orderId,
      amount: paidAmount,
      currency: 'BRL',
      description,
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
        type: 'material',
        itemType: data.itemType,
        itemId: data.itemId,
        ...(couponValidation ? { couponCode: couponValidation.code } : {}),
      },
    })

    await applyPaymentResult(orderId, result)
    await audit({
      action: 'order_created',
      actorUserId: session.userId,
      targetUserId: session.userId,
      resourceType: data.itemType,
      resourceId: data.itemId,
      metadata: { amount, paymentMethod: data.paymentMethodId, providerPaymentId: result.providerOrderId, ...couponAnalyticsMetadata(couponValidation) },
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
      amount: paidAmount,
      successRedirect: physicalShopOrderId
        ? '/profile?tab=pedidos'
        : item.type === 'flashcard_deck' && item.linkedDeckSlug
          ? `/flashcards/d/${item.linkedDeckSlug}`
          : '/materiais',
    })
  } catch (err: any) {
    console.error('[materiais/checkout] erro:', err)
    if (couponValidation) {
      await releaseCouponRedemption(db, orderId, 'provider_error')
    }
    if (physicalShopOrderId) {
      await db.collection('shop_orders').updateOne(
        { _id: new ObjectId(physicalShopOrderId) },
        { $set: { paymentStatus: 'rejected', updatedAt: new Date() } }
      )
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

async function handleCartCheckout(
  request: NextRequest,
  ip: string,
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>,
  data: z.infer<typeof CartSchema>
) {
  const db = await getDb()
  const resolution = await resolveMaterialCart(db, session, data.items)
  const serializedItems = resolution.items.map(serializeMaterialCartItem)
  const serializedFreeItems = resolution.freeItems.map(serializeMaterialCartItem)
  const serializedPayableItems = resolution.payableItems.map(serializeMaterialCartItem)

  if (resolution.items.length === 0) {
    const allAlreadyOwned = resolution.skippedItems.length > 0 &&
      resolution.skippedItems.every(item => item.reason === 'already_owned')
    return NextResponse.json({
      error: allAlreadyOwned
        ? 'Você já possui todos os itens deste carrinho.'
        : 'Nenhum item disponível para compra no carrinho',
      alreadyOwned: allAlreadyOwned || resolution.skippedItems.some(item => item.reason === 'already_owned'),
      redirectTo: '/materiais?tab=mine',
      skippedItems: resolution.skippedItems,
    }, { status: 409 })
  }

  const alreadyOwnedItems = resolution.skippedItems.filter(item => item.reason === 'already_owned')
  if (alreadyOwnedItems.length > 0) {
    return NextResponse.json({
      error: 'Você já possui alguns itens deste carrinho. Remova-os antes de finalizar a compra.',
      alreadyOwned: true,
      skippedItems: resolution.skippedItems,
    }, { status: 409 })
  }

  let amount = Number(resolution.amount)
  let couponValidation: CouponValidationResult | null = null
  let payableItemsForOrder = resolution.payableItems
  let serializedPayableItemsForOrder = serializedPayableItems

  // Lote dinâmico — soma de descontos por item (cada item pode ter evento diferente).
  const tierCalc = await computeCartTierDiscounts(
    db,
    resolution.payableItems.map((item) => ({
      itemType: item.itemType,
      itemId: item.itemId,
      price: item.price,
      pricingEventId: item.pricingEventId,
    }))
  )
  let couponDiscountAmount = 0
  if (data.couponCode && amount > 0) {
    try {
      couponValidation = await validateCouponForCheckout(db, {
        code: data.couponCode,
        amountBeforeCoupon: amount,
        userId: session.userId,
        userEmail: session.email,
        items: resolution.payableItems.map((item) => ({
          itemType: item.itemType,
          itemId: item.itemId,
          itemTitle: item.itemTitle,
          materialType: item.materialType,
          price: item.price,
        })),
      })
      couponDiscountAmount = couponValidation.discountAmount
    } catch (error: any) {
      if (error instanceof CouponError) {
        return NextResponse.json({ error: error.message }, { status: error.status })
      }
      throw error
    }
  }

  const combined = combineTierAndCouponDiscount({
    basePrice: amount,
    tierDiscountAmount: tierCalc.totalTierDiscount,
    couponDiscountAmount,
  })

  if (combined.appliedSource === 'coupon' && couponValidation) {
    amount = couponValidation.amountAfterCoupon
    payableItemsForOrder = applyCouponDiscountsToItems(resolution.payableItems, couponValidation.items)
    serializedPayableItemsForOrder = payableItemsForOrder.map(serializeMaterialCartItem)
  } else if (combined.appliedSource === 'tier') {
    amount = combined.finalPrice
    couponValidation = null
    // Atualiza preço por item refletindo o desconto do lote, para registro do pedido.
    const tierDiscountById = new Map(
      tierCalc.perItem.map((entry) => [`${entry.itemType}:${entry.itemId}`, entry.tierDiscountAmount])
    )
    payableItemsForOrder = resolution.payableItems.map((item) => {
      const discount = tierDiscountById.get(`${item.itemType}:${item.itemId}`) || 0
      return {
        ...item,
        price: Math.max(0, Math.round((item.price - discount) * 100) / 100),
        discountApplied: Math.round((item.discountApplied + discount) * 100) / 100,
      }
    })
    serializedPayableItemsForOrder = payableItemsForOrder.map(serializeMaterialCartItem)
  } else {
    couponValidation = null
  }

  // ── Parte física do carrinho (add-ons/produtos impressos pagos junto) ──
  let physicalShopOrderId: string | undefined
  let physicalTotal = 0
  const rawPhysical = (data as any).physical
  if (rawPhysical && Array.isArray(rawPhysical.items) && rawPhysical.items.length > 0) {
    const eligibleMaterialIds = new Set<string>()
    for (const it of resolution.items) {
      if (it.itemType === 'material') eligibleMaterialIds.add(String(it.itemId))
      const matIds = (it as any).materialIds
      if (Array.isArray(matIds)) for (const m of matIds) eligibleMaterialIds.add(String(m))
    }
    const built = await buildPhysicalShopOrder(
      db,
      { userId: session.userId, name: session.name, email: session.email },
      {
        items: rawPhysical.items.map((i: any) => ({
          productId: String(i.productId),
          quantity: Math.max(1, Math.min(20, Math.floor(Number(i.quantity) || 1))),
          versionId: i.versionId ? String(i.versionId) : undefined,
        })),
        deliveryType: rawPhysical.deliveryType === 'shipping' ? 'shipping' : 'pickup',
        pickupPointId: rawPhysical.pickupPointId,
        shippingAddress: rawPhysical.shippingAddress,
        deliveryMethodId: rawPhysical.deliveryMethodId,
      },
      { eligibleMaterialIds }
    )
    if (!built.ok) {
      return NextResponse.json({ error: built.error }, { status: built.status })
    }
    if (!built.empty) {
      physicalShopOrderId = built.shopOrderId
      physicalTotal = built.total
    }
  }

  if (resolution.freeItems.length > 0) {
    await grantMaterialCartItems(db, session, resolution.freeItems, {
      auditMetadata: { free: true, source: 'cart' },
    })
  }

  if (amount <= 0 && physicalTotal <= 0) {
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

    if (payableItemsForOrder.length > 0) {
      await grantMaterialCartItems(db, session, payableItemsForOrder, {
        auditMetadata: { free: true, source: 'cart', ...couponAnalyticsMetadata(couponValidation) },
      })
    }

    const unlockedItems = [...resolution.freeItems, ...payableItemsForOrder]
    await recordCheckoutEvent({
      event: 'payment_approved',
      userId: session.userId,
      userName: session.name,
      userEmail: session.email,
      productId: 'cart',
      productTitle: `Carrinho (${resolution.items.length} itens)`,
      productType: 'material',
      amount: 0,
      paymentMethod: 'free',
      status: 'approved',
      source: 'Carrinho',
      metadata: {
        free: true,
        itemType: 'cart',
        items: unlockedItems.map(serializeMaterialCartItem),
        skippedItems: resolution.skippedItems,
        ...couponAnalyticsMetadata(couponValidation),
      },
      ...getRequestAnalyticsMeta(request),
    })

    return NextResponse.json({
      free: true,
      success: true,
      amount: 0,
      unlockedItems: unlockedItems.map(serializeMaterialCartItem),
      skippedItems: resolution.skippedItems,
      redirectTo: '/materiais?tab=mine&purchase=success',
    })
  }

  if (data.paymentMethodId === 'free') {
    return NextResponse.json({ error: 'Carrinho pago requer uma forma de pagamento válida.' }, { status: 400 })
  }

  const itemCount = payableItemsForOrder.length
  const description = `Carrinho DomineAqui - ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`
  const paidAmount = Math.round((amount + physicalTotal) * 100) / 100
  const now = new Date()
  const orderDoc: Omit<PaymentOrder, '_id'> = {
    userId: session.userId,
    payerEmail: session.email,
    payerName: session.name,
    provider: 'mercado_pago',
    type: 'material',
    refId: payableItemsForOrder[0]?.itemId,
    amount: paidAmount,
    currency: 'BRL',
    status: 'pending',
    idempotencyKey: '',
    metadata: {
      itemType: 'cart',
      itemTitle: description,
      ...(physicalShopOrderId ? { shopOrderId: physicalShopOrderId } : {}),
      cartItems: serializedPayableItemsForOrder,
      freeItems: serializedFreeItems,
      skippedItems: resolution.skippedItems,
      ...(combined.appliedSource === 'tier' && combined.appliedDiscountAmount > 0
        ? {
            pricingEventDiscountAmount: combined.appliedDiscountAmount,
            pricingEventPerItem: tierCalc.perItem
              .filter((entry) => entry.tierDiscountAmount > 0 && entry.state)
              .map((entry) => ({
                itemType: entry.itemType,
                itemId: entry.itemId,
                eventId: entry.state?.eventId,
                eventName: entry.state?.name,
                tierIndex: entry.state?.activeTier?.index,
                discountPercent: entry.state?.activeTier?.discountPercent,
                discountAmount: entry.tierDiscountAmount,
              })),
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
  if (physicalShopOrderId) {
    await db.collection('shop_orders').updateOne(
      { _id: new ObjectId(physicalShopOrderId) },
      { $set: { providerOrderId: orderId, updatedAt: new Date() } }
    )
  }

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
    productId: 'cart',
    productTitle: description,
    productType: 'material',
    paymentMethod: data.paymentMethodId,
    source: 'Carrinho',
    metadata: {
      itemType: 'cart',
      cartSize: resolution.items.length,
      payableSize: resolution.payableItems.length,
      freeSize: resolution.freeItems.length,
      skippedItems: resolution.skippedItems,
    },
    ...getRequestAnalyticsMeta(request),
  })

  try {
    const provider = getPaymentProvider()
    const result = await provider.createPayment({
      externalReference: orderId,
      amount: paidAmount,
      currency: 'BRL',
      description,
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
        type: 'material',
        itemType: 'cart',
        cartSize: String(payableItemsForOrder.length),
        ...(couponValidation ? { couponCode: couponValidation.code } : {}),
      },
    })

    await applyPaymentResult(orderId, result)
    await audit({
      action: 'order_created',
      actorUserId: session.userId,
      targetUserId: session.userId,
      resourceType: 'material_cart',
      resourceId: orderId,
      metadata: { amount, paymentMethod: data.paymentMethodId, providerPaymentId: result.providerOrderId, ...couponAnalyticsMetadata(couponValidation) },
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
      amount: paidAmount,
      freeItems: serializedFreeItems,
      skippedItems: resolution.skippedItems,
      successRedirect: physicalShopOrderId ? '/profile?tab=pedidos' : '/materiais?tab=mine&purchase=success',
    })
  } catch (err: any) {
    console.error('[materiais/checkout/cart] erro:', err)
    if (couponValidation) {
      await releaseCouponRedemption(db, orderId, 'provider_error')
    }
    if (physicalShopOrderId) {
      await db.collection('shop_orders').updateOne(
        { _id: new ObjectId(physicalShopOrderId) },
        { $set: { paymentStatus: 'rejected', updatedAt: new Date() } }
      )
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
