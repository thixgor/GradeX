import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { getPaymentProvider } from '@/lib/payments'
import { audit } from '@/lib/payments/audit'
import { getRequestAnalyticsMeta, recordSubscriptionCheckoutEvent } from '@/lib/analytics'
import { DEFAULT_PAYMENT_METHODS } from '@/lib/payment-methods'
import { checkRefundCooldown } from '@/lib/plus-guard'
import { restorePlusClaims } from '@/lib/plus-claims'
import { normalizeAccountType } from '@/lib/account-tier'
import {
  MESES_DE_RECORRENCIA,
  planoEhRecorrente,
  type MesesDeRecorrencia,
} from '@/lib/payments/subscription-view'
import type { SubscriptionRecord, User } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Cria uma assinatura recorrente (Preapproval) no Mercado Pago.
 * Usado para planos com durationMonths em {1, 3, 12}.
 *
 * Fluxo:
 *  - Frontend tokeniza o cartão (Brick / mp.js v2) e envia o cardTokenId.
 *  - Backend cria preapproval com status=authorized.
 *  - MP cobra o cartão imediatamente; webhook confirma e aplica o cargo.
 *  - Demais cobranças: MP processa nas datas pré-definidas; webhook renova.
 */
const Schema = z.object({
  planId: z.string().min(1),
  cardTokenId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await checkRateLimit(ip, 'subscriptions_create', 10, 60_000)
  if (!rl.success) {
    return NextResponse.json({ error: 'Muitas requisições. Tente novamente em instantes.' }, { status: 429 })
  }

  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }) }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }
  const { planId, cardTokenId } = parsed.data

  const db = await getDb()

  // Carência pós-reembolso: sem isso, o mesmo usuário reassina no dia seguinte
  // e repete o ciclo "baixa tudo → pede o dinheiro de volta" todo mês.
  const cooldown = await checkRefundCooldown(session.userId, db)
  if (cooldown.blocked) {
    return NextResponse.json({ error: cooldown.message, until: cooldown.until }, { status: 403 })
  }

  const settings = await db.collection('admin_settings').findOne({})

  const enabledMethods = { ...DEFAULT_PAYMENT_METHODS, ...(settings?.paymentMethods || {}) }
  if (!enabledMethods.subscriptions) {
    return NextResponse.json({ error: 'Assinaturas não estão disponíveis no momento.' }, { status: 400 })
  }

  const plano = (settings?.planos || []).find((p: any) => p.tipo === planId)
  if (!plano) return NextResponse.json({ error: 'Plano não encontrado' }, { status: 400 })

  const months = plano.durationMonths
  if (!planoEhRecorrente(months)) {
    return NextResponse.json(
      {
        error: `Este plano não é recorrente — só ${MESES_DE_RECORRENCIA.join(', ')} meses viram assinatura. Use /api/payments/orders.`,
      },
      { status: 400 }
    )
  }

  const amount = Number(plano.preco)
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Plano com preço inválido' }, { status: 400 })
  }

  // Bloqueia múltiplas assinaturas ativas
  const existing = await db.collection<SubscriptionRecord>('subscriptions').findOne({
    userId: session.userId,
    status: { $in: ['authorized', 'pending'] },
  })
  if (existing) {
    return NextResponse.json(
      { error: 'Você já possui uma assinatura ativa ou pendente.' },
      { status: 409 }
    )
  }

  const provider = getPaymentProvider()
  const sub = await provider.createPreapproval({
    externalReference: `${session.userId}:${planId}:${Date.now()}`,
    payerEmail: session.email,
    amount,
    currency: 'BRL',
    reason: `${plano.nome} — ${plano.periodo || 'Assinatura'}`,
    frequencyMonths: months as MesesDeRecorrencia,
    cardTokenId,
    backUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile?subscription=success`,
    metadata: { userId: session.userId, planId },
  })

  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + months)

  const subDoc: Omit<SubscriptionRecord, '_id'> = {
    userId: session.userId,
    planId,
    role: normalizeAccountType(plano.role),
    amount,
    currency: 'BRL',
    billingIntervalMonths: months as MesesDeRecorrencia,
    provider: 'mercado_pago',
    providerSubscriptionId: sub.providerSubscriptionId,
    status: sub.status,
    currentPeriodEndsAt: sub.status === 'authorized' ? periodEnd : undefined,
    nextBillingAt: sub.nextBillingAt || periodEnd,
    lastPaymentAt: sub.status === 'authorized' ? now : undefined,
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now,
  }
  await db.collection<SubscriptionRecord>('subscriptions').insertOne(subDoc as any)
  await recordSubscriptionCheckoutEvent('subscription_created', subDoc as SubscriptionRecord, {
    name: session.name,
    email: session.email,
  }, {
    status: sub.status,
    ...getRequestAnalyticsMeta(request),
  })

  // Se já autorizada (cartão aprovado), refletir no usuário imediatamente
  if (sub.status === 'authorized') {
    await db.collection<User>('users').updateOne(
      { _id: new ObjectId(session.userId) as any },
      {
        $set: {
          accountType: normalizeAccountType(plano.role),
          premiumPlanType: planId as any,
          premiumActivatedAt: now,
          premiumExpiresAt: periodEnd,
          premiumPrice: amount,
          mercadoPagoPreapprovalId: sub.providerSubscriptionId,
        },
      }
    )
    await audit({
      action: 'subscription_created',
      actorUserId: session.userId,
      targetUserId: session.userId,
      resourceType: 'subscription',
      resourceId: sub.providerSubscriptionId,
      metadata: { planId, amount, months },
    })
    // Reassinou: os materiais resgatados numa assinatura anterior, suspensos
    // quando ela caiu, voltam para a conta.
    const restoredClaims = await restorePlusClaims(session.userId, 'subscription_created', db)
      .catch(err => {
        console.error('[subscriptions] restaurar resgates Plus+ falhou:', err)
        return { count: 0, items: [] }
      })

    await audit({
      action: 'role_granted',
      targetUserId: session.userId,
      resourceType: 'plan',
      resourceId: planId,
      metadata: { source: 'subscription', plusClaimsRestored: restoredClaims.count },
    })
    await recordSubscriptionCheckoutEvent('payment_approved', subDoc as SubscriptionRecord, {
      name: session.name,
      email: session.email,
    }, {
      status: 'authorized',
      ...getRequestAnalyticsMeta(request),
    })
  }

  return NextResponse.json({
    subscriptionId: sub.providerSubscriptionId,
    status: sub.status,
    initPoint: sub.initPoint,
    nextBillingAt: sub.nextBillingAt,
  })
}
