import { NextRequest, NextResponse } from 'next/server'
import { invalidCheckoutPayload } from '@/lib/payments/invalid-payload'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { getPaymentProvider } from '@/lib/payments'
import { audit } from '@/lib/payments/audit'
import { describeMercadoPagoApiError } from '@/lib/payments/mercado-pago/errors'
import { isAmbiguousProviderError } from '@/lib/payments/provider-failure'
import { accessUntilForSubscription } from '@/lib/payments/subscription-sync'
import { getRequestAnalyticsMeta, recordSubscriptionCheckoutEvent } from '@/lib/analytics'
import { DEFAULT_PAYMENT_METHODS } from '@/lib/payment-methods'
import { computeSubscriptionCharge, getFeePolicy } from '@/lib/payments/fees'
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

/** Por quanto tempo uma assinatura `pending` impede criar outra. */
const PENDING_BLOQUEIA_MS = 30 * 60_000

/** Erro do MP na criação da assinatura, em português. */
function describeSubscriptionError(err: any): string {
  const traduzido = describeMercadoPagoApiError(err)
  if (traduzido) return traduzido
  const texto = `${err?.message || ''} ${JSON.stringify(err?.cause ?? '')}`
  if (/CC_VAL_433|card validation|credit card validation/i.test(texto)) {
    return 'O banco recusou o cartão para a assinatura. Tente outro cartão ou use o pagamento único (Pix ou cartão).'
  }
  if (isAmbiguousProviderError(err)) {
    return 'O Mercado Pago não respondeu a tempo. Confira no seu perfil em alguns minutos antes de tentar de novo.'
  }
  return 'Não foi possível criar a assinatura com este cartão. Confira os dados ou use o pagamento único (Pix ou cartão).'
}

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
    return invalidCheckoutPayload('subscriptions', parsed.error)
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

  const baseAmount = Number(plano.preco)
  if (!Number.isFinite(baseAmount) || baseAmount <= 0) {
    return NextResponse.json({ error: 'Plano com preço inválido' }, { status: 400 })
  }

  /*
   * Taxa operacional, igual ao pagamento avulso.
   *
   * A assinatura cobrava `plano.preco` limpo enquanto o pagamento único somava
   * a taxa do Mercado Pago — então o mesmo checkout tinha duas políticas de
   * preço, e a taxa da recorrência saía do nosso bolso em TODA renovação. O
   * preapproval é sempre crédito à vista, então é a taxa de crédito 1x.
   *
   * Este é o valor autoritativo: a tela mostra o mesmo número porque roda a
   * mesma função, mas quem manda no que o Mercado Pago cobra é esta linha.
   */
  const charge = computeSubscriptionCharge(baseAmount, getFeePolicy())
  const amount = charge.totalAmount

  // Bloqueia múltiplas assinaturas ativas. `pending` só conta enquanto é
  // recente: com o cartão já tokenizado o MP autoriza ou recusa na hora, e um
  // `pending` antigo é tentativa abandonada — antes ele barrava a pessoa de
  // assinar para sempre ("já possui uma assinatura ativa ou pendente").
  const existing = await db.collection<SubscriptionRecord>('subscriptions').findOne({
    userId: session.userId,
    $or: [
      { status: 'authorized' },
      { status: 'pending', createdAt: { $gte: new Date(Date.now() - PENDING_BLOQUEIA_MS) } },
    ],
  } as any)
  if (existing) {
    return NextResponse.json(
      { error: 'Você já possui uma assinatura ativa ou pendente.' },
      { status: 409 }
    )
  }

  const provider = getPaymentProvider()
  const externalReference = `${session.userId}:${planId}:${Date.now()}`
  let sub: Awaited<ReturnType<typeof provider.createPreapproval>>
  try {
    sub = await provider.createPreapproval({
      externalReference,
      payerEmail: session.email,
      amount,
      currency: 'BRL',
      reason: `${plano.nome} — ${plano.periodo || 'Assinatura'}`,
      frequencyMonths: months as MesesDeRecorrencia,
      cardTokenId,
      backUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile?subscription=success`,
      metadata: { userId: session.userId, planId },
    })
  } catch (err: any) {
    // Antes o erro subia sem tratamento: 500 sem corpo, e a tela dizia que a
    // resposta "não chegou a tempo" para um cartão que o MP simplesmente
    // recusou.
    console.warn('[subscriptions] criação da assinatura falhou:', err?.message, JSON.stringify(err?.cause ?? null))
    // Timeout/queda: a assinatura PODE existir no MP (e cobrar). Procura pela
    // nossa referência antes de dizer que falhou — senão a pessoa pagaria sem
    // ter o registro que libera o acesso.
    const encontrada = isAmbiguousProviderError(err)
      ? await provider.findPreapprovalByExternalReference?.(externalReference).catch(() => null)
      : null
    if (!encontrada) {
      return NextResponse.json(
        { error: describeSubscriptionError(err) },
        { status: isAmbiguousProviderError(err) ? 502 : 400 }
      )
    }
    sub = encontrada
  }

  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + months)

  const subDoc: Omit<SubscriptionRecord, '_id'> = {
    userId: session.userId,
    planId,
    role: normalizeAccountType(plano.role),
    // `amount` é o COBRADO (base + taxa), como em PaymentOrder. Guardamos as
    // duas parcelas para o painel poder separar receita de repasse.
    amount,
    baseAmount: charge.baseAmount,
    feeAmount: charge.feeAmount,
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
          // Próxima cobrança + folga: a renovação estende a partir daqui
          // (lib/payments/subscription-sync.ts).
          premiumExpiresAt:
            accessUntilForSubscription({ currentPeriodEndsAt: periodEnd, nextBillingAt: sub.nextBillingAt }) || periodEnd,
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
