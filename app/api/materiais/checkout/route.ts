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
import type { PaymentOrder, MaterialPurchase } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Cria pagamento para material/pacote via Mercado Pago.
 * Para itens gratuitos, libera diretamente.
 */
const Schema = z.object({
  itemType: z.enum(['material', 'package']),
  itemId: z.string().min(1),
  paymentMethodId: z.string().min(1),
  cardToken: z.string().optional(),
  installments: z.number().int().min(1).max(12).optional(),
  issuer: z.string().optional(),
  payerDocumentType: z.enum(['CPF', 'CNPJ']).optional(),
  payerDocumentNumber: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await checkRateLimit(ip, 'materiais_checkout', 20, 60_000)
  if (!rl.success) return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })

  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }) }
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  const data = parsed.data

  const db = await getDb()
  const collection = data.itemType === 'package' ? 'material_packages' : 'materials'
  const item = await db.collection(collection).findOne({ _id: new ObjectId(data.itemId) })
  if (!item) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })

  // Bloqueia recompra
  const existing = await db.collection<MaterialPurchase>('material_purchases').findOne({
    userId: session.userId,
    itemType: data.itemType,
    itemId: data.itemId,
    status: 'completed',
  })
  if (existing) return NextResponse.json({ error: 'Você já adquiriu este item' }, { status: 400 })

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
    let purchasedMaterialIds: string[] = []
    if (materialIdsStr.length > 0) {
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
      purchasedMaterialIds = Array.from(new Set([...byUserId, ...byEmail].map((p: any) => String(p.itemId))))
    }

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
  }

  // Free path — item gratuito OR pacote ficou totalmente coberto pelo desconto
  const isFreePath =
    item.pricing === 'free' ||
    !item.price ||
    item.price <= 0 ||
    effectivePrice <= 0

  if (isFreePath) {
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

  const amount = Number(effectivePrice)
  const description = item.title

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
    amount,
    currency: 'BRL',
    status: 'pending',
    idempotencyKey: '',
    metadata: {
      itemType: data.itemType,
      itemTitle: item.title,
      ...(pricingMeta && pricingMeta.discountApplied > 0
        ? {
            packageOriginalPrice: pricingMeta.originalPackagePrice,
            packageDiscountApplied: pricingMeta.discountApplied,
            ownedMaterialIds: pricingMeta.ownedMaterialIds,
          }
        : {}),
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
      amount,
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
      },
    })

    await applyPaymentResult(orderId, result)
    await audit({
      action: 'order_created',
      actorUserId: session.userId,
      targetUserId: session.userId,
      resourceType: data.itemType,
      resourceId: data.itemId,
      metadata: { amount, paymentMethod: data.paymentMethodId, providerPaymentId: result.providerOrderId },
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
      successRedirect: item.type === 'flashcard_deck' && item.linkedDeckSlug
        ? `/flashcards/d/${item.linkedDeckSlug}`
        : '/materiais',
    })
  } catch (err: any) {
    console.error('[materiais/checkout] erro:', err)
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
