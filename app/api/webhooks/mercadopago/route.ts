import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { getPaymentProvider } from '@/lib/payments'
import { applyPaymentResult } from '@/lib/payments/effects'
import { audit } from '@/lib/payments/audit'
import { mapMpPreapprovalStatus } from '@/lib/payments/mercado-pago/status-mapper'
import { getMpPreApproval, getMpPayment } from '@/lib/payments/mercado-pago/client'
import type {
  PaymentOrder,
  SubscriptionRecord,
  WebhookEventRecord,
} from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Endpoint único de webhook do Mercado Pago.
 * Doc: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 *
 * Pipeline:
 *  1. Lê body bruto + headers + query.
 *  2. Insere em webhook_events (índice único impede duplicidade).
 *  3. Valida assinatura HMAC.
 *  4. Busca recurso direto na API do MP (não confia no payload).
 *  5. Reconcilia: order, payment, subscription.
 *  6. Aplica efeitos via lib/payments/effects.
 *  7. Responde 200 sempre que possível (para evitar retries do MP em erro nosso).
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const headers: Record<string, string> = {}
  request.headers.forEach((v, k) => { headers[k] = v })

  const url = new URL(request.url)
  const queryParams: Record<string, string> = {}
  url.searchParams.forEach((v, k) => { queryParams[k] = v })

  // O simulador do painel MP envia live_mode=false com IDs fictícios e sem
  // x-signature. Respondemos 200 sem processar para não gerar erro no painel.
  try {
    const parsed = JSON.parse(rawBody)
    if (parsed.live_mode === false) {
      console.log('[mp-webhook] notificação de teste (live_mode=false) — ignorada')
      return NextResponse.json({ ok: true, test: true })
    }
  } catch {}

  const provider = getPaymentProvider()
  const validation = await provider.validateWebhook({ rawBody, headers, queryParams })

  const db = await getDb()
  const eventsCol = db.collection<WebhookEventRecord>('webhook_events')

  const eventId =
    validation.eventId ||
    `${queryParams.type || ''}:${queryParams['data.id'] || queryParams.id || ''}:${Date.now()}`

  // Idempotência: insere; se duplicado, retorna 200 sem reprocessar.
  try {
    await eventsCol.insertOne({
      provider: 'mercado_pago',
      eventId,
      topic: validation.topic || queryParams.type || queryParams.topic || '',
      resourceId: validation.resourceId || queryParams['data.id'] || queryParams.id || '',
      rawBody,
      headers: pickRelevantHeaders(headers),
      signatureValid: validation.valid,
      attempts: 1,
      createdAt: new Date(),
    })
  } catch (err: any) {
    // Duplicate key — já processado. Responder 200.
    if (err?.code === 11000) {
      await eventsCol.updateOne({ provider: 'mercado_pago', eventId }, { $inc: { attempts: 1 } })
      return NextResponse.json({ ok: true, deduped: true })
    }
    console.error('[mp-webhook] erro ao gravar evento:', err)
  }

  if (!validation.valid) {
    await audit({
      action: 'webhook_invalid',
      metadata: { topic: validation.topic, eventId, headers: pickRelevantHeaders(headers) },
    })
    await eventsCol.updateOne(
      { provider: 'mercado_pago', eventId },
      { $set: { processedAt: new Date(), processingError: 'assinatura inválida' } }
    )
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  await audit({
    action: 'webhook_received',
    metadata: { topic: validation.topic, resourceId: validation.resourceId, eventId },
  })

  // Processar conforme topic
  try {
    const topic = (validation.topic || '').toLowerCase()
    const resourceId = validation.resourceId || ''

    if (topic.startsWith('payment')) {
      await handlePaymentEvent(resourceId)
    } else if (topic.includes('preapproval') || topic.includes('subscription_preapproval')) {
      await handlePreapprovalEvent(resourceId)
    } else if (topic.includes('subscription_authorized_payment')) {
      // Cobrança recorrente realizada — vem como payment id em outro evento.
      // Aqui apenas logamos.
    } else if (topic.includes('merchant_order')) {
      // Não usamos diretamente. payment.created/updated cobre o que precisamos.
    } else {
      console.log('[mp-webhook] topic não tratado:', topic)
    }

    await eventsCol.updateOne(
      { provider: 'mercado_pago', eventId },
      { $set: { processedAt: new Date() } }
    )
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[mp-webhook] erro ao processar:', err)
    await eventsCol.updateOne(
      { provider: 'mercado_pago', eventId },
      { $set: { processingError: String(err?.message || err) } }
    )
    // 500 faz o MP reentregar — usamos 200 só quando temos certeza.
    return NextResponse.json({ error: 'processing failed' }, { status: 500 })
  }
}

function pickRelevantHeaders(h: Record<string, string>): Record<string, string> {
  const allow = ['x-signature', 'x-request-id', 'user-agent']
  const out: Record<string, string> = {}
  for (const k of allow) if (h[k]) out[k] = h[k]
  return out
}

// ── Handlers por topic ───────────────────────────────────────

async function handlePaymentEvent(paymentId: string) {
  if (!paymentId) return
  const provider = getPaymentProvider()
  const result = await provider.getPayment(paymentId)
  const db = await getDb()

  // Buscar a order interna pela external_reference (raw.external_reference)
  // ou pelo providerPaymentId já vinculado.
  const raw = (result.raw || {}) as any
  const externalReference = raw.external_reference

  let orderDoc: PaymentOrder | null = null
  if (externalReference) {
    try {
      orderDoc = await db.collection<PaymentOrder>('payment_orders').findOne({
        _id: new ObjectId(externalReference) as any,
      })
    } catch {
      orderDoc = null
    }
  }
  if (!orderDoc) {
    orderDoc = await db.collection<PaymentOrder>('payment_orders').findOne({
      providerPaymentId: paymentId,
    })
  }
  if (!orderDoc) {
    console.warn('[mp-webhook] order não encontrada para payment', paymentId)
    return
  }

  await applyPaymentResult(String(orderDoc._id), result)
}

async function handlePreapprovalEvent(preapprovalId: string) {
  if (!preapprovalId) return
  const pre = getMpPreApproval()
  const data = await pre.get({ id: preapprovalId })
  const db = await getDb()
  const sub = await db.collection<SubscriptionRecord>('subscriptions').findOne({
    providerSubscriptionId: preapprovalId,
  })
  if (!sub) {
    console.warn('[mp-webhook] preapproval sem sub interna:', preapprovalId)
    return
  }

  const newStatus = mapMpPreapprovalStatus((data as any)?.status)
  const nextBilling = (data as any)?.next_payment_date
    ? new Date((data as any).next_payment_date)
    : sub.nextBillingAt

  await db.collection<SubscriptionRecord>('subscriptions').updateOne(
    { _id: sub._id as any },
    {
      $set: {
        status: newStatus,
        nextBillingAt: nextBilling,
        updatedAt: new Date(),
      },
    }
  )

  // Cancelamento server-side ou expiração: registra audit
  if (newStatus === 'cancelled' || newStatus === 'expired') {
    await audit({
      action: newStatus === 'cancelled' ? 'subscription_canceled' : 'subscription_expired',
      targetUserId: sub.userId,
      resourceType: 'subscription',
      resourceId: preapprovalId,
    })
  }
}
