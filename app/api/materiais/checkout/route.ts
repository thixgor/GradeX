import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { getPaymentProvider, deriveIdempotencyKey } from '@/lib/payments'
import { applyPaymentResult } from '@/lib/payments/effects'
import { audit } from '@/lib/payments/audit'
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

  // Free path
  if (item.pricing === 'free' || !item.price || item.price <= 0) {
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
      metadata: { free: true },
    })
    return NextResponse.json({
      free: true,
      success: true,
      redirectTo: item.type === 'flashcard_deck' && item.linkedDeckSlug
        ? `/flashcards/d/${item.linkedDeckSlug}`
        : null,
    })
  }

  const amount = Number(item.price)
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
    metadata: { itemType: data.itemType, itemTitle: item.title },
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
