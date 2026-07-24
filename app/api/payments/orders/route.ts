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
import { DEFAULT_PAYMENT_METHODS } from '@/lib/payment-methods'
import type { PaymentOrder, MaterialPurchase } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Cria uma Order (pagamento único) no Mercado Pago.
 * Suporta: plano vitalício, materiais e compras avulsas.
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

  // Captação de doações descontinuada. O tipo 'donation' segue no schema para
  // que pedidos antigos continuem sendo lidos e reconciliados, mas esta rota é
  // pública e dispensava sessão para esse tipo — sem a página /doar, ficaria um
  // endpoint aberto de criação de doação sem nenhuma tela que o alimentasse.
  if (data.type === 'donation') {
    return NextResponse.json({ error: 'Tipo de pedido indisponível' }, { status: 410 })
  }

  const session = await getSession()

  if (!session) {
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
  // Comissão do sócio (split): materiais/pacotes marcados ficam de fora.
  let commissionExcluded = false

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
    commissionExcluded = item.excludeFromCommission === true
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

  // Chamar provider
  try {
    const provider = getPaymentProvider()
    const result = await provider.createPayment({
      externalReference: orderId,
      amount,
      ...(commissionExcluded ? { commissionableAmount: 0 } : {}),
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
