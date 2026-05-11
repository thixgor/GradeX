import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { getPaymentProvider, deriveIdempotencyKey } from '@/lib/payments'
import { applyPaymentResult } from '@/lib/payments/effects'
import { audit } from '@/lib/payments/audit'
import { getRequestAnalyticsMeta, recordOrderCheckoutEvent } from '@/lib/analytics'
import { DEFAULT_PAYMENT_METHODS } from '@/app/api/admin/settings/payment-methods/route'
import type { PaymentOrder, MaterialPurchase } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Cria uma Order (pagamento único) no Mercado Pago.
 * Suporta: plano vitalício, materiais, doações, compras avulsas.
 *
 * Para assinaturas recorrentes (mensal/trimestral/anual), use /api/subscriptions.
 *
 * O servidor SEMPRE recalcula o `amount` a partir da fonte autoritativa (admin_settings,
 * materials, etc.) — nunca aceita preço do cliente.
 */
const Schema = z.object({
  type: z.enum(['plan', 'material', 'donation']),
  // Identificador da fonte autoritativa
  refId: z.string().min(1),
  // Para material: 'material' | 'package'
  itemType: z.enum(['material', 'package']).optional(),
  // Forma de pagamento
  paymentMethodId: z.string().min(1),
  // Cartão (server-side com tokenização do Brick)
  cardToken: z.string().optional(),
  installments: z.number().int().min(1).max(12).optional(),
  issuer: z.string().optional(),
  payerDocumentType: z.enum(['CPF', 'CNPJ']).optional(),
  payerDocumentNumber: z.string().optional(),
  // Doação (anônima permitida)
  donationName: z.string().optional(),
  donationAlias: z.string().optional(),
  donationMessage: z.string().optional(),
  donationAmount: z.number().positive().optional(),
  donationEmail: z.string().email().optional(),
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await checkRateLimit(ip, 'payments_orders', 20, 60_000)
  if (!rl.success) {
    return NextResponse.json({ error: 'Muitas requisições. Tente novamente em instantes.' }, { status: 429 })
  }

  let body: any
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

  const session = await getSession()

  // Doação anônima é permitida; demais tipos exigem login.
  if (data.type !== 'donation' && !session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const db = await getDb()

  // Verificar métodos de pagamento habilitados
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

  // Resolver amount, descrição e validações específicas server-side.
  let amount = 0
  let description = ''
  let refId = data.refId
  const orderUserId = session?.userId
  let payerEmail = session?.email
  let payerName = session?.name

  if (data.type === 'plan') {
    const settings = await db.collection('admin_settings').findOne({})
    const plano = (settings?.planos || []).find((p: any) => p.tipo === data.refId)
    if (!plano) return NextResponse.json({ error: 'Plano não encontrado' }, { status: 400 })
    amount = Number(plano.preco)
    description = `${plano.nome} — ${plano.periodo || 'Plano'}`
  } else if (data.type === 'material') {
    if (!data.itemType) return NextResponse.json({ error: 'itemType obrigatório' }, { status: 400 })
    const col = data.itemType === 'package' ? 'material_packages' : 'materials'
    const item = await db.collection(col).findOne({ _id: new ObjectId(data.refId) })
    if (!item) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
    if (item.pricing === 'free' || !item.price || item.price <= 0) {
      return NextResponse.json({ error: 'Item gratuito não requer pagamento' }, { status: 400 })
    }
    // Bloqueia recompra
    const existing = await db.collection<MaterialPurchase>('material_purchases').findOne({
      userId: session!.userId,
      itemType: data.itemType,
      itemId: data.refId,
      status: 'completed',
    })
    if (existing) return NextResponse.json({ error: 'Você já adquiriu este item' }, { status: 400 })
    amount = Number(item.price)
    description = item.title
  } else if (data.type === 'donation') {
    const donAmt = Number(data.donationAmount || 0)
    if (!donAmt || donAmt < 1) {
      return NextResponse.json({ error: 'Valor mínimo de doação: R$ 1,00' }, { status: 400 })
    }
    if (donAmt > 10000) {
      return NextResponse.json({ error: 'Valor máximo de doação: R$ 10.000,00' }, { status: 400 })
    }
    amount = donAmt
    description = `Doação DomineAqui — ${data.donationAlias || 'Anônimo'}`
    payerEmail = data.donationEmail || session?.email
    payerName = data.donationName || session?.name
    refId = 'donation'
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
  }

  // Cria order interna primeiro (para usar o _id como external_reference)
  const now = new Date()
  const orderDoc: Omit<PaymentOrder, '_id'> = {
    userId: orderUserId,
    payerEmail,
    payerName,
    provider: 'mercado_pago',
    type: data.type,
    refId,
    refSlug: undefined,
    amount,
    currency: 'BRL',
    status: 'pending',
    idempotencyKey: '', // preenchido abaixo
    metadata: {
      itemType: data.itemType,
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
    paymentMethod: data.paymentMethodId,
    ...getRequestAnalyticsMeta(request),
  })

  // Para doação, criar registro espelho em donation_payments
  if (data.type === 'donation') {
    await db.collection('donation_payments').insertOne({
      userId: orderUserId,
      nomeCompleto: data.donationName,
      apelido: data.donationAlias,
      email: payerEmail,
      mensagem: data.donationMessage,
      amount,
      currency: 'BRL',
      provider: 'mercado_pago',
      providerOrderId: orderId,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    })
  }

  // Chamar provider
  try {
    const provider = getPaymentProvider()
    const result = await provider.createPayment({
      externalReference: orderId,
      amount,
      currency: 'BRL',
      description,
      payerEmail,
      payerName,
      idempotencyKey,
      paymentMethodId: data.paymentMethodId,
      cardToken: data.cardToken,
      installments: data.installments,
      issuer: data.issuer,
      payerDocumentType: data.payerDocumentType,
      payerDocumentNumber: data.payerDocumentNumber,
      metadata: {
        orderId,
        type: data.type,
        ...(data.itemType ? { itemType: data.itemType } : {}),
      },
    })

    // Aplicar resultado (idempotente). Para Pix/boleto, status virá pending — pendente OK.
    await applyPaymentResult(orderId, result)

    await audit({
      action: 'order_created',
      actorUserId: orderUserId,
      targetUserId: orderUserId,
      resourceType: data.type,
      resourceId: orderId,
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
    })
  } catch (err: any) {
    console.error('[orders] erro ao criar payment:', err)
    await db.collection<PaymentOrder>('payment_orders').updateOne(
      { _id: inserted.insertedId },
      { $set: { status: 'rejected', statusDetail: 'provider_error', updatedAt: new Date() } }
    )
    return NextResponse.json(
      { error: err?.message || 'Falha ao criar pagamento', code: err?.cause?.error || err?.error },
      { status: 502 }
    )
  }
}
