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
// Vercel Free (Hobby) limita a duração; 60s é o teto. O handler ainda se
// autolimita a um orçamento de tempo bem menor (default 25s) para responder
// antes do timeout de 30s do cron-job.org.
export const maxDuration = 60

/**
 * Cron de reentrega de material/serial key (rede de segurança de fulfillment).
 *
 * Disparado por um agendador EXTERNO (ex.: cron-job.org), já que o Vercel Free
 * não roda cron nativo. Como o cron-job.org corta a conexão em ~30s, este
 * handler trabalha por LOTES com ORÇAMENTO DE TEMPO: processa poucas ordens por
 * chamada e retorna antes do timeout. Chamado a cada poucos minutos, drena o
 * backlog aos poucos. É idempotente — reprocessar não duplica key nem e-mail.
 *
 * Problema que resolve: quando um pagamento é aprovado, geramos a serial key e
 * disparamos o e-mail com o material (PDF) + a key de ativação. Se esse e-mail
 * falha (SMTP fora do ar, rajada, geração de PDF, timeout), o comprador fica
 * sem receber nada — e nada reenvia sozinho, porque:
 *   - o webhook do MP não reexecuta efeitos em ordens já `approved`
 *     (idempotência por `prevStatus === newStatus`);
 *   - o payments-sweeper só varre ordens `pending`/`in_process`.
 *
 * Para cada compra de serial key JÁ APROVADA cujo e-mail ainda não teve sucesso:
 *   1. reexecuta `fulfillSerialKeyOrder` (idempotente): gera a key se faltar e
 *      reenvia o e-mail com backoff;
 *   2. respeita um cooldown para não reenviar em execuções muito próximas;
 *   3. alerta os admins (uma vez) a partir de N falhas;
 *   4. desiste após `MAX_FULFILLMENT_EMAIL_ATTEMPTS` tentativas (o admin ainda
 *      pode reenviar manualmente pelo painel — a key já existe e é ativável).
 *
 * Autenticação (qualquer uma serve): header `Authorization: Bearer ${CRON_SECRET}`,
 * header `x-cron-secret: ${CRON_SECRET}`, query-param `?secret=${CRON_SECRET}`
 * (mais simples no cron-job.org — sem precisar configurar header), ou o header
 * `x-vercel-cron`. Exige `CRON_SECRET` definida no ambiente.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const startedAt = Date.now()
  // Orçamento de tempo: para de pegar novas ordens quando estourar, garantindo
  // resposta antes do timeout de 30s do cron-job.org (margem de segurança).
  const TIME_BUDGET_MS = Number(process.env.FULFILLMENT_SWEEPER_BUDGET_MS) || 25_000
  // Teto de ordens efetivamente reprocessadas por chamada (cada reenvio pode
  // envolver marca d'água de PDF, que é pesado). Ajustável por env.
  const MAX_PER_RUN = Number(process.env.FULFILLMENT_SWEEPER_MAX_PER_RUN) || 5

  const db = await getDb()
  const ordersCol = db.collection<PaymentOrder>('payment_orders')
  const keysCol = db.collection<SerialKey>(SERIAL_KEYS_COLLECTION)

  const now = Date.now()
  // Janela: cobre retries perdidos sem varrer o histórico inteiro.
  const since = new Date(now - 14 * 24 * 60 * 60 * 1000)
  // Evita reenvio duplicado quando o cron é disparado logo após uma execução.
  const COOLDOWN_MS = 10 * 60 * 1000

  const stats = { checked: 0, retried: 0, recovered: 0, missingKeys: 0, alerted: 0, givenUp: 0, errors: 0, budgetHit: false }

  // Candidatos: compras de serial key aprovadas na janela. Ordenadas da mais
  // antiga para a mais nova para drenar o backlog sem "starvation".
  const candidates = await ordersCol
    .find({
      status: 'approved',
      'metadata.serialKeyPurchase': true,
      createdAt: { $gte: since },
    } as any)
    .sort({ createdAt: 1 })
    .limit(100)
    .toArray()

  for (const order of candidates) {
    // Orçamento de tempo estourado: encerra e deixa o resto para a próxima call.
    if (Date.now() - startedAt > TIME_BUDGET_MS) {
      stats.budgetHit = true
      break
    }
    if (stats.retried >= MAX_PER_RUN) break

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

  return NextResponse.json({ ok: true, tookMs: Date.now() - startedAt, ...stats })
}

function isAuthorized(request: NextRequest): boolean {
  if (request.headers.get('x-vercel-cron')) return true

  const secret = (process.env.CRON_SECRET || '').trim()
  if (!secret) return false

  const url = new URL(request.url)
  // Aceita o segredo por várias vias — tolerante a como o cron-job.org é
  // configurado (com ou sem prefixo "Bearer", em header dedicado ou na URL).
  const candidates = [
    (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''),
    request.headers.get('x-cron-secret') || '',
    url.searchParams.get('secret') || '',
    url.searchParams.get('token') || '',
  ].map(s => s.trim())

  return candidates.some(c => c.length > 0 && safeEqual(c, secret))
}

/** Comparação de tempo constante para o segredo. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
