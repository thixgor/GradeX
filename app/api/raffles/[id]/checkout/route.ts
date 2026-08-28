import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { getPaymentProvider, deriveIdempotencyKey } from '@/lib/payments'
import { applyPaymentResult } from '@/lib/payments/effects'
import { audit } from '@/lib/payments/audit'
import { DEFAULT_PAYMENT_METHODS } from '@/lib/payment-methods'
import { chargeMetadata, computeCheckoutCharge, getFeePolicy } from '@/lib/payments/fees'
import { resolveCheckoutCpf } from '@/lib/payments/checkout-identity'
import { findRaffleByIdOrSlug, canPurchase, reserveNumbers, releaseReservation, RAFFLE_RESERVATION_MINUTES, sanitizeRaffleText } from '@/lib/raffles'
import type { PaymentOrder, RaffleParticipant, RafflePurchase } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_NUMBERS_PER_PURCHASE = 200

const Schema = z.object({
  numbers: z.array(z.number().int().positive()).min(1).max(MAX_NUMBERS_PER_PURCHASE),
  name: z.string().min(2).max(120),
  email: z.string().email().max(160),
  phone: z.string().min(8).max(30),
  paymentMethodId: z.string().min(1),
  cardToken: z.string().optional(),
  installments: z.number().int().min(1).max(12).optional(),
  issuer: z.string().optional(),
  payerDocumentType: z.enum(['CPF', 'CNPJ']).optional(),
  payerDocumentNumber: z.string().optional(),
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await checkRateLimit(ip, 'raffles_checkout', 15, 60_000)
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

  const db = await getDb()
  const raffle = await findRaffleByIdOrSlug(db, params.id)
  if (!raffle) {
    return NextResponse.json({ error: 'Rifa não encontrada' }, { status: 404 })
  }

  if (raffle.visibility === 'private') {
    const session = await getSession()
    if (session?.role !== 'admin') {
      return NextResponse.json({ error: 'Rifa não disponível' }, { status: 403 })
    }
  }

  if (!canPurchase(raffle)) {
    return NextResponse.json({ error: 'Esta rifa não está aberta para compras.' }, { status: 400 })
  }

  // Normaliza números: únicos, dentro da faixa válida.
  const numbers = Array.from(new Set(data.numbers))
  const outOfRange = numbers.filter(n => n < 1 || n > raffle.totalNumbers)
  if (outOfRange.length > 0) {
    return NextResponse.json({ error: 'Há números fora da faixa válida.', invalid: outOfRange }, { status: 400 })
  }

  // Verifica métodos de pagamento habilitados (mesma lógica do checkout geral).
  const adminSettings = await db.collection('admin_settings').findOne({})
  const enabledMethods = { ...DEFAULT_PAYMENT_METHODS, ...(adminSettings?.paymentMethods || {}) }
  const method = data.paymentMethodId
  if (method === 'pix' && !enabledMethods.pix) {
    return NextResponse.json({ error: 'Pagamento por Pix não está disponível no momento.' }, { status: 400 })
  }
  if ((method === 'credit_card' || method === 'debit_card') && !enabledMethods.credit_card) {
    return NextResponse.json({ error: 'Pagamento por cartão não está disponível no momento.' }, { status: 400 })
  }
  if ((method === 'boleto' || method === 'bolbradesco') && !enabledMethods.boleto) {
    return NextResponse.json({ error: 'Pagamento por boleto não está disponível no momento.' }, { status: 400 })
  }

  const session = await getSession()

  // SERVIDOR recalcula o valor — nunca confia no cliente.
  const amount = Math.round(raffle.pricePerNumber * numbers.length * 100) / 100
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
  }

  // CPF obrigatório (nota fiscal). A rifa aceita compra sem conta, então aqui
  // ele pode ser só validado — sem perfil para vincular.
  const cpfResult = await resolveCheckoutCpf(db, {
    cpf: data.payerDocumentNumber,
    documentType: data.payerDocumentType,
    userId: session?.userId,
  })
  if (!cpfResult.ok) {
    return NextResponse.json({ error: cpfResult.error }, { status: cpfResult.status })
  }

  // Taxa operacional / juros do parcelamento. `amount` continua sendo o valor
  // dos números (é o que a rifa vale e o que a apuração usa); `chargedAmount`
  // é o que sai do bolso do comprador.
  const charge = computeCheckoutCharge({
    baseAmount: amount,
    paymentMethodId: data.paymentMethodId,
    installments: data.installments,
    hasCardToken: !!data.cardToken,
    policy: getFeePolicy(),
  })
  const chargedAmount = charge.totalAmount

  const now = new Date()
  const name = sanitizeRaffleText(data.name, 120)
  const email = data.email.toLowerCase().trim()
  const phone = sanitizeRaffleText(data.phone, 30)

  // 1) Participante
  const participantDoc: Omit<RaffleParticipant, '_id'> = {
    raffleId: String(raffle._id),
    userId: session?.userId,
    name,
    email,
    phone,
    createdAt: now,
  }
  const participantRes = await db.collection<RaffleParticipant>('raffle_participants').insertOne(participantDoc as any)
  const participantId = participantRes.insertedId.toString()

  // 2) Order interna (external_reference)
  const sessionId = randomUUID()
  const orderDoc: Omit<PaymentOrder, '_id'> = {
    userId: session?.userId,
    payerEmail: email,
    payerName: name,
    provider: 'mercado_pago',
    type: 'raffle',
    refId: String(raffle._id),
    refSlug: raffle.slug,
    amount: chargedAmount,
    baseAmount: amount,
    feeAmount: charge.feeAmount,
    currency: 'BRL',
    status: 'pending',
    idempotencyKey: '',
    metadata: {
      ...chargeMetadata(charge),
      raffleId: String(raffle._id),
      raffleName: raffle.name,
      numbers,
      participantId,
      sessionId,
    },
    createdAt: now,
    updatedAt: now,
  }
  const orderRes = await db.collection<PaymentOrder>('payment_orders').insertOne(orderDoc as any)
  const orderId = orderRes.insertedId.toString()
  const idempotencyKey = deriveIdempotencyKey(orderId)
  await db.collection<PaymentOrder>('payment_orders').updateOne(
    { _id: orderRes.insertedId },
    { $set: { idempotencyKey } },
  )

  // 3) Reserva atômica dos números.
  const reservation = await reserveNumbers(db, String(raffle._id), numbers, {
    sessionId,
    orderId,
    purchaseId: undefined,
  })
  if (!reservation.ok) {
    // Rollback: remove order + participante (números reservados já sofreram rollback interno).
    await db.collection('payment_orders').deleteOne({ _id: orderRes.insertedId as any })
    await db.collection('raffle_participants').deleteOne({ _id: participantRes.insertedId as any })
    return NextResponse.json(
      {
        error: 'Alguns números já foram escolhidos por outra pessoa. Atualize e tente novamente.',
        conflicting: reservation.conflicting,
      },
      { status: 409 },
    )
  }

  // 4) Registro de compra (pendente).
  const reservedUntil = new Date(now.getTime() + RAFFLE_RESERVATION_MINUTES * 60 * 1000)
  const purchaseDoc: Omit<RafflePurchase, '_id'> = {
    raffleId: String(raffle._id),
    participantId,
    participantName: name,
    participantEmail: email,
    participantPhone: phone,
    userId: session?.userId,
    numbers,
    amount,
    pricePerNumber: raffle.pricePerNumber,
    status: 'pending',
    orderId,
    reservedBySessionId: sessionId,
    reservedUntil,
    createdAt: now,
    updatedAt: now,
  }
  const purchaseRes = await db.collection<RafflePurchase>('raffle_purchases').insertOne(purchaseDoc as any)
  const purchaseId = purchaseRes.insertedId.toString()
  await db.collection('raffle_numbers').updateMany(
    { raffleId: String(raffle._id), orderId, status: 'reserved' },
    { $set: { purchaseId, participantId } },
  )

  // 5) Cria o pagamento no Mercado Pago.
  try {
    const provider = getPaymentProvider()
    const result = await provider.createPayment({
      externalReference: orderId,
      amount: chargedAmount,
      // A comissão do sócio incide sobre a rifa, não sobre a taxa do MP.
      commissionableAmount: amount,
      currency: 'BRL',
      description: `Rifa: ${raffle.name} — ${numbers.length} número(s)`,
      payerEmail: email,
      payerName: name,
      idempotencyKey,
      paymentMethodId: data.paymentMethodId,
      cardToken: data.cardToken,
      installments: data.installments,
      issuer: data.issuer,
      payerDocumentType: 'CPF',
      payerDocumentNumber: cpfResult.cpf,
      metadata: {
        orderId,
        type: 'raffle',
        raffleId: String(raffle._id),
        purchaseId,
      },
    })

    await db.collection<RafflePurchase>('raffle_purchases').updateOne(
      { _id: purchaseRes.insertedId },
      { $set: { mercadoPagoPaymentId: result.providerOrderId, updatedAt: new Date() } },
    )

    // Aplica resultado (idempotente). Cartão aprovado → marca vendido na hora.
    await applyPaymentResult(orderId, result)

    await audit({
      action: 'order_created',
      actorUserId: session?.userId,
      resourceType: 'raffle',
      resourceId: String(raffle._id),
      metadata: { orderId, amount: chargedAmount, numbers, paymentMethod: data.paymentMethodId, ...chargeMetadata(charge) },
      ip,
    })

    return NextResponse.json({
      orderId,
      purchaseId,
      providerPaymentId: result.providerOrderId,
      status: result.status,
      paymentMethod: result.paymentMethod,
      pix: result.pix || null,
      boleto: result.boleto || null,
      statusDetail: result.statusDetail,
      amount: chargedAmount,
      baseAmount: amount,
      feeAmount: charge.feeAmount,
      feeLabel: charge.label,
      successRedirect: `/rifas/${raffle.slug}?compra=ok`,
    })
  } catch (err: any) {
    console.error('[raffle-checkout] erro ao criar payment:', err)
    // Libera reserva e marca order como rejeitada.
    await releaseReservation(db, String(raffle._id), orderId)
    await db.collection<PaymentOrder>('payment_orders').updateOne(
      { _id: orderRes.insertedId },
      { $set: { status: 'rejected', statusDetail: 'provider_error', updatedAt: new Date() } },
    )
    await db.collection<RafflePurchase>('raffle_purchases').updateOne(
      { _id: purchaseRes.insertedId },
      { $set: { status: 'cancelled', updatedAt: new Date() } },
    )
    return NextResponse.json(
      { error: err?.message || 'Falha ao criar pagamento', code: err?.cause?.error || err?.error },
      { status: 502 },
    )
  }
}
