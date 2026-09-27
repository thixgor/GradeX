import 'server-only'

import { ObjectId } from 'mongodb'
import type { Db } from 'mongodb'

import { getPaymentProvider } from './index'
import { audit } from './audit'
import { normalizeAccountType } from '../account-tier'
import { contaEhPaga } from '../cargos-server'
import { restorePlusClaims } from '../plus-claims'
import type { ProviderSubscription } from './types'
import type { SubscriptionRecord, User } from '../types'

/**
 * Acesso de quem paga por ASSINATURA RECORRENTE.
 *
 * PROBLEMA QUE ISTO RESOLVE
 * -------------------------
 * `premiumExpiresAt` era gravado uma vez, na criação (hoje + N meses), e
 * NUNCA mais era estendido — nenhuma renovação cobrada pelo Mercado Pago
 * mexia nele. Quando a data passava, `/api/user/tier-limits` rebaixava a conta
 * para gratuita (sem olhar a assinatura), e o acesso a materiais e aulas, que
 * lê a mesma data, fechava. Quem pagava a segunda mensalidade perdia o Plus+.
 *
 * A REGRA AGORA
 * -------------
 * Enquanto o MP diz que a assinatura está `authorized` (e ninguém pediu para
 * cancelar), o acesso vale até a PRÓXIMA COBRANÇA + uma folga de
 * `SUBSCRIPTION_GRACE_DAYS` — a folga cobre o cron diário e as retentativas
 * de cobrança do MP. Parou de estar autorizada (cancelada, pausada por
 * falta de pagamento), a data para de andar e o acesso termina nela.
 *
 * Um único ponto aplica isso, chamado de três lugares: webhook de assinatura
 * (na hora), cron diário (rede de segurança) e a checagem de expiração do
 * `/api/user/tier-limits` (autocorreção antes de rebaixar alguém que paga).
 */

export const SUBSCRIPTION_GRACE_DAYS = 3
const DIA_MS = 24 * 60 * 60 * 1000

function data(v: Date | string | null | undefined): Date | null {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

function maisTarde(...ds: Array<Date | null>): Date | null {
  return ds.reduce<Date | null>((acc, d) => (d && (!acc || d > acc) ? d : acc), null)
}

/** Até quando vale o acesso de uma assinatura autorizada. Puro. */
export function accessUntilForSubscription(input: {
  nextBillingAt?: Date | string | null
  currentPeriodEndsAt?: Date | string | null
}): Date | null {
  const base = maisTarde(data(input.nextBillingAt), data(input.currentPeriodEndsAt))
  return base ? new Date(base.getTime() + SUBSCRIPTION_GRACE_DAYS * DIA_MS) : null
}

export interface SubscriptionSyncResult {
  status: SubscriptionRecord['status']
  /** Até quando o acesso foi garantido; `null` quando a assinatura não está valendo. */
  accessUntil: Date | null
  /** A conta foi estendida ou restaurada. */
  userUpdated: boolean
  /** Um cancelamento pedido e não registrado no MP foi refeito. */
  cancelRetried: boolean
}

/**
 * Traz a assinatura do MP e aplica ao nosso banco: status, próxima cobrança,
 * fim do período e o acesso da conta. `remote` evita uma segunda consulta
 * quando quem chama já buscou o preapproval.
 */
export async function syncSubscription(
  db: Db,
  sub: SubscriptionRecord,
  remote?: ProviderSubscription | null
): Promise<SubscriptionSyncResult> {
  const provider = getPaymentProvider()
  const r = remote ?? (await provider.getPreapproval(sub.providerSubscriptionId))
  const subs = db.collection<SubscriptionRecord>('subscriptions')
  const now = new Date()
  const set: Partial<SubscriptionRecord> = { status: r.status, updatedAt: now }
  if (r.nextBillingAt) set.nextBillingAt = r.nextBillingAt

  // A pessoa cancelou, mas o MP continua autorizado (a chamada de cancelar
  // falhou). Sem refazer, ele seguiria cobrando todo mês de quem já perdeu o
  // acesso — o caminho mais curto para um chargeback.
  if (sub.cancelAtPeriodEnd && r.status === 'authorized') {
    try {
      const cancelada = await provider.cancelPreapproval(sub.providerSubscriptionId)
      set.status = cancelada.status
    } catch (err) {
      console.error('[subscription-sync] refazer cancelamento no MP falhou:', sub.providerSubscriptionId, err)
    }
    await subs.updateOne({ _id: sub._id as any }, { $set: set })
    return { status: set.status!, accessUntil: null, userUpdated: false, cancelRetried: true }
  }

  let accessUntil: Date | null = null
  if (r.status === 'authorized' && !sub.cancelAtPeriodEnd) {
    const fimDoPeriodo = maisTarde(data(sub.currentPeriodEndsAt), data(r.nextBillingAt))
    if (fimDoPeriodo) set.currentPeriodEndsAt = fimDoPeriodo
    accessUntil = accessUntilForSubscription({
      nextBillingAt: r.nextBillingAt,
      currentPeriodEndsAt: sub.currentPeriodEndsAt,
    })
  }

  await subs.updateOne({ _id: sub._id as any }, { $set: set })
  const userUpdated = accessUntil ? await grantSubscriptionAccess(db, sub, accessUntil) : false
  return { status: set.status!, accessUntil, userUpdated, cancelRetried: false }
}

/**
 * Garante o acesso da conta até `accessUntil`. Só MEXE quando a assinatura é
 * quem sustenta o cargo — nunca encurta uma compra vitalícia ou um plano
 * avulso que já vai além disso.
 *
 * Também restaura quem foi rebaixado pelo defeito antigo: conta sem cargo
 * pago, com assinatura autorizada, volta ao cargo do plano.
 */
export async function grantSubscriptionAccess(
  db: Db,
  sub: SubscriptionRecord,
  accessUntil: Date
): Promise<boolean> {
  if (!sub.userId || !ObjectId.isValid(sub.userId)) return false
  const users = db.collection<User>('users')
  const user = await users.findOne(
    { _id: new ObjectId(sub.userId) as any },
    { projection: { accountType: 1, premiumExpiresAt: 1, mercadoPagoPreapprovalId: 1 } }
  )
  if (!user) return false

  const daAssinatura = user.mercadoPagoPreapprovalId === sub.providerSubscriptionId
  const temCargoPago = await contaEhPaga(user.accountType, db)
  const expiraEm = data(user.premiumExpiresAt as any)

  if (temCargoPago) {
    // Cargo pago sem data = vitalício de outra compra: não se toca.
    if (!expiraEm && !daAssinatura) return false
    // Já vale até lá ou depois (outro plano, ou esta assinatura já em dia).
    if (expiraEm && expiraEm >= accessUntil) return false
  }

  const now = new Date()
  const set: Record<string, unknown> = {
    premiumExpiresAt: accessUntil,
    mercadoPagoPreapprovalId: sub.providerSubscriptionId,
  }
  const restaurada = !temCargoPago
  if (restaurada) {
    set.accountType = normalizeAccountType(sub.role)
    set.premiumPlanType = sub.planId
    set.premiumActivatedAt = now
  }
  await users.updateOne({ _id: new ObjectId(sub.userId) as any }, { $set: set })

  if (restaurada) {
    const devolvidos = await restorePlusClaims(sub.userId, 'subscription_renewed', db).catch(err => {
      console.error('[subscription-sync] restaurar resgates Plus+ falhou:', err)
      return { count: 0, items: [] }
    })
    await audit({
      action: 'role_granted',
      targetUserId: sub.userId,
      resourceType: 'subscription',
      resourceId: sub.providerSubscriptionId,
      metadata: { reason: 'subscription_authorized_restore', accessUntil, plusClaimsRestored: devolvidos.count },
    })
  }
  return true
}

/**
 * Autocorreção para quem está prestes a ser rebaixado por data vencida: se a
 * pessoa tem assinatura autorizada, sincroniza com o MP antes. Devolve `true`
 * quando o acesso segue valendo (não rebaixar). Nunca lança.
 */
export async function keepAccessIfSubscribed(db: Db, userId: string): Promise<boolean> {
  try {
    const sub = await db.collection<SubscriptionRecord>('subscriptions').findOne(
      { userId, status: 'authorized', cancelAtPeriodEnd: { $ne: true } },
      { sort: { createdAt: -1 } }
    )
    if (!sub) return false
    const r = await syncSubscription(db, sub)
    return !!r.accessUntil && r.accessUntil > new Date()
  } catch (err) {
    console.error('[subscription-sync] autocorreção falhou:', userId, err)
    return false
  }
}

/** Id do preapproval de um pagamento de renovação, se o MP informar. */
export function preapprovalIdFromPayment(raw: any): string | null {
  const candidatos = [
    raw?.metadata?.preapproval_id,
    raw?.point_of_interaction?.transaction_data?.subscription_id,
    raw?.preapproval_id,
  ]
  const id = candidatos.find(v => typeof v === 'string' && v.trim())
  return id ? String(id).trim() : null
}
