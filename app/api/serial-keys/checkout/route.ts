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
import type { PaymentOrder, SerialKeyProductType } from '@/lib/types'
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
    })
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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
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

  const session = await getSession()
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

  const amount = resolved.amount
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
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
