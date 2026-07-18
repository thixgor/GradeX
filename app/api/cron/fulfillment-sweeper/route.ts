import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { SERIAL_KEYS_COLLECTION } from '@/lib/serial-keys'
import {
  fulfillSerialKeyOrder,
  getFulfillmentEmailState,
  MAX_FULFILLMENT_EMAIL_ATTEMPTS,
  FULFILLMENT_ALERT_AFTER_ATTEMPTS,
} from '@/lib/serial-key-fulfillment'
import { sendFulfillmentFailureAlert } from '@/lib/mail'
import type { PaymentOrder, SerialKey } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Cron de reentrega de material/serial key (rede de segurança de fulfillment).
 *
 * Problema que resolve: quando um pagamento é aprovado, geramos a serial key e
 * disparamos o e-mail com o material (PDF) + a key de ativação. Se esse e-mail
 * falha (SMTP fora do ar, rajada, geração de PDF, timeout), o comprador fica
 * sem receber nada — e nada reenvia sozinho, porque:
 *   - o webhook do MP não reexecuta efeitos em ordens já `approved`
 *     (idempotência por `prevStatus === newStatus`);
 *   - o payments-sweeper só varre ordens `pending`/`in_process`.
 *
 * Este sweeper varre as compras de serial key JÁ APROVADAS cujo e-mail de
 * entrega ainda não teve sucesso e:
 *   1. reexecuta `fulfillSerialKeyOrder` (idempotente): gera a key se faltar e
 *      reenvia o e-mail com backoff;
 *   2. respeita um cooldown para não reenviar em execuções muito próximas;
 *   3. alerta os admins (uma vez) a partir de N falhas;
 *   4. desiste após `MAX_FULFILLMENT_EMAIL_ATTEMPTS` tentativas (o admin ainda
 *      pode reenviar manualmente pelo painel — a key já existe e é ativável).
 *
 * Autenticação: header `x-vercel-cron` (Vercel Cron) ou
 * `Authorization: Bearer ${CRON_SECRET}`.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const db = await getDb()
  const ordersCol = db.collection<PaymentOrder>('payment_orders')
  const keysCol = db.collection<SerialKey>(SERIAL_KEYS_COLLECTION)

  const now = Date.now()
  // Janela: cobre retries perdidos sem varrer o histórico inteiro.
  const since = new Date(now - 14 * 24 * 60 * 60 * 1000)
  // Evita reenvio duplicado quando o cron é disparado manualmente logo após
  // uma execução (a cadência normal do cron já é bem maior que isto).
  const COOLDOWN_MS = 10 * 60 * 1000

  const stats = { checked: 0, retried: 0, recovered: 0, missingKeys: 0, alerted: 0, givenUp: 0, errors: 0 }

  const candidates = await ordersCol
    .find({
      status: 'approved',
      'metadata.serialKeyPurchase': true,
      createdAt: { $gte: since },
    } as any)
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray()

  for (const order of candidates) {
    stats.checked++
    try {
      const keys = await keysCol.find({ orderId: String(order._id) }).toArray()
      const state = getFulfillmentEmailState(keys)

      // Já entregue com sucesso: nada a fazer.
      if (state.alreadySent) continue
      if (!state.hasKeys) stats.missingKeys++

      // Alerta os admins (uma única vez) assim que acumula falhas suficientes.
      if (state.failedAttempts >= FULFILLMENT_ALERT_AFTER_ATTEMPTS && !order.fulfillmentAlertSentAt) {
        const first = keys[0]
        await sendFulfillmentFailureAlert({
          orderId: String(order._id),
          buyerEmail: first?.buyerEmail || order.payerEmail,
          buyerName: first?.buyerName || order.payerName,
          productTitle: first?.productTitle || (order.metadata?.itemTitle as string) || undefined,
          amount: order.amount,
          attempts: state.failedAttempts,
          transactionId: order.providerPaymentId,
          reason: state.lastError,
        })
        await ordersCol.updateOne(
          { _id: order._id as any },
          { $set: { fulfillmentAlertSentAt: new Date() } }
        )
        stats.alerted++
      }

      // Esgotou as tentativas: para de reenviar (reenvio manual pelo admin).
      if (state.failedAttempts >= MAX_FULFILLMENT_EMAIL_ATTEMPTS) {
        stats.givenUp++
        continue
      }

      // Cooldown entre tentativas.
      if (state.lastAttemptAt && now - state.lastAttemptAt.getTime() < COOLDOWN_MS) continue

      // Reexecuta o fulfillment (idempotente): gera key se faltar + reenvia.
      stats.retried++
      await fulfillSerialKeyOrder(order)

      const after = await keysCol.find({ orderId: String(order._id) }).toArray()
      if (getFulfillmentEmailState(after).alreadySent) stats.recovered++
    } catch (err) {
      stats.errors++
      console.error('[cron-fulfillment] reentrega falhou', String(order._id), err)
    }
  }

  return NextResponse.json({ ok: true, ...stats })
}

function isAuthorized(request: NextRequest): boolean {
  if (request.headers.get('x-vercel-cron')) return true
  const auth = request.headers.get('authorization') || ''
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`
  return !!process.env.CRON_SECRET && auth === expected
}
