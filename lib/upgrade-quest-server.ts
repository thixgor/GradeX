import 'server-only'

import { ObjectId } from 'mongodb'
import type { Db } from 'mongodb'

import { normalizeAccountType, PLUS_TIER } from './account-tier'
import { invalidarCacheDeServidor, memoizarPorTempo } from './cache-de-servidor'
import { getPaymentProvider } from './payments'
import { audit } from './payments/audit'
import { recordSubscriptionCheckoutEvent } from './analytics'
import { combineDiscountsWithProuni, type ProuniDiscountType } from './prouni-shared'
import {
  normalizarConfigDoUpgrade,
  planoElegivelAoUpgrade,
  precoDeUpgrade,
  precoDoBolsista,
  questVigente,
  retornoAoQuest,
  type ConfigDoUpgradeQuest,
  type PlanoDoUpgrade,
  type QuestAntesDoUpgrade,
} from './upgrade-quest'
import type { PlanConfig, SubscriptionRecord, User } from './types'

/**
 * O lado do servidor do upgrade Quest+ → Plus+. As regras estão no cabeçalho
 * de `lib/upgrade-quest.ts`; aqui mora só o que lê e grava o banco.
 */

const CHAVE_DO_CATALOGO = 'upgrade-quest:catalogo'
const STATUS_ATIVOS: SubscriptionRecord['status'][] = ['authorized', 'pending', 'paused']

/**
 * Planos + configuração do upgrade, iguais para todo mundo. Memória curta:
 * a página de upgrade, o perfil e o checkout pedem isto em rajada. Quem cobra
 * (`/api/payments/orders`) NÃO lê daqui — lê o documento fresco.
 */
export function lerCatalogoDoUpgrade(db: Db): Promise<{ planos: PlanConfig[]; config: ConfigDoUpgradeQuest }> {
  return memoizarPorTempo(CHAVE_DO_CATALOGO, 15_000, async () => {
    const settings = await db.collection('admin_settings').findOne({}, { projection: { planos: 1, upgradeQuest: 1 } })
    return {
      planos: (settings?.planos || []) as PlanConfig[],
      config: normalizarConfigDoUpgrade(settings?.upgradeQuest),
    }
  })
}

/** Chamado por quem grava planos ou a configuração do upgrade. */
export function invalidarCatalogoDoUpgrade(): void {
  invalidarCacheDeServidor(CHAVE_DO_CATALOGO)
}

/**
 * Contas Quest+ vigentes — o público da oferta e do e-mail de upgrade. Mesma
 * definição de `questVigente`, escrita como filtro do Mongo.
 */
export function filtroDeQuestVigente(agora: Date = new Date()): Record<string, unknown> {
  return {
    role: { $ne: 'admin' },
    banned: { $ne: true },
    accountType: { $in: ['quest', 'quest+', 'Quest', 'Quest+'] },
    $or: [{ premiumExpiresAt: { $exists: false } }, { premiumExpiresAt: null }, { premiumExpiresAt: { $gt: agora } }],
  }
}

export interface UpgradeDaCompra {
  descontoPercentual: number
  /** Preço de tabela do plano. */
  precoBase: number
  /** Preço com o desconto de upgrade. */
  precoUpgrade: number
  /** Extra do bolsista (pontos percentuais); `null` com o extra desligado. */
  descontoExtraBolsista: number | null
  /** Preço só com o PROUNI/FIES; `null` sem concessão para este plano. */
  precoComProuni: number | null
  /** PROUNI/FIES + extra; `null` sem concessão ou com o extra desligado. */
  precoBolsista: number | null
}

/** A concessão PROUNI/FIES como `resolveProuniForCheckout`/`ForCart` devolvem. */
export interface ConcessaoParaUpgrade {
  discountType: ProuniDiscountType
  discountValue: number
  stackWithTier: boolean
}

/**
 * Os preços de bolsista de um plano. A conta é a do checkout:
 * `combineDiscountsWithProuni` dá o preço com o PROUNI, e o extra incide
 * sobre ele. Planos não têm lote, então o `stackWithTier` não pesa aqui.
 */
export function precosDoBolsista(
  precoBase: number,
  concessao: ConcessaoParaUpgrade | null | undefined,
  descontoExtra: number | null,
): { precoComProuni: number | null; precoBolsista: number | null } {
  if (!concessao) return { precoComProuni: null, precoBolsista: null }
  const comProuni = combineDiscountsWithProuni({ basePrice: precoBase, prouni: concessao })
  if (comProuni.prouniDiscountApplied <= 0) return { precoComProuni: null, precoBolsista: null }
  return {
    precoComProuni: comProuni.finalPrice,
    precoBolsista: descontoExtra != null ? precoDoBolsista(comProuni.finalPrice, descontoExtra) : null,
  }
}

/**
 * O preço de upgrade que ESTA compra pode ter — ou `null`.
 *
 * Confere tudo de novo, sem confiar na tela: oferta ligada, plano na oferta e
 * conta Quest+ vigente agora. `upgradeQuestBruto` é o campo do mesmo
 * `admin_settings` que a rota de pagamento já leu para achar o plano.
 */
export async function upgradeParaACompra(
  db: Db,
  input: {
    userId: string
    plano: PlanoDoUpgrade
    upgradeQuestBruto: unknown
    /** A concessão PROUNI/FIES deste plano, já resolvida pela rota. */
    prouni?: ConcessaoParaUpgrade | null
  },
): Promise<UpgradeDaCompra | null> {
  const config = normalizarConfigDoUpgrade(input.upgradeQuestBruto)
  if (!config.ativo || !planoElegivelAoUpgrade(input.plano, config)) return null
  if (!ObjectId.isValid(input.userId)) return null

  const user = await db
    .collection<User>('users')
    .findOne({ _id: new ObjectId(input.userId) as any }, { projection: { accountType: 1, premiumExpiresAt: 1 } })
  if (!questVigente(user, new Date())) return null

  const precoBase = Number(input.plano.preco)
  const descontoExtraBolsista = config.bolsista.ativo ? config.bolsista.descontoExtra : null
  return {
    descontoPercentual: config.descontoPercentual,
    precoBase,
    precoUpgrade: precoDeUpgrade(precoBase, config.descontoPercentual),
    descontoExtraBolsista,
    ...precosDoBolsista(precoBase, input.prouni, descontoExtraBolsista),
  }
}

/** A assinatura recorrente do Quest+ ainda viva (a que cobraria de novo). */
export function buscarRecorrenciaDoQuest(db: Db, userId: string): Promise<SubscriptionRecord | null> {
  return db
    .collection<SubscriptionRecord>('subscriptions')
    .find({ userId, status: { $in: STATUS_ATIVOS }, cancelAtPeriodEnd: { $ne: true } })
    .toArray()
    .then((subs) => subs.find((s) => normalizeAccountType(s.role) !== PLUS_TIER) || null)
}

/** O registro do Quest+ que o upgrade substitui. */
export function questGuardado(
  user: Pick<User, 'premiumExpiresAt' | 'premiumPlanType'>,
  orderId: string,
  agora: Date,
): QuestAntesDoUpgrade {
  return {
    expiresAt: user.premiumExpiresAt ? new Date(user.premiumExpiresAt) : null,
    planType: (user.premiumPlanType as string | undefined) || null,
    orderId,
    em: agora,
  }
}

/**
 * Encerra a renovação automática do Quest+ depois de um upgrade aprovado.
 *
 * Sem isto a pessoa pagaria os dois — e pior: a próxima cobrança do Quest+
 * gravaria `accountType: 'quest'` por cima do Plus+ recém-comprado. O Quest+
 * que já foi pago continua valendo até o fim (está em `questAntesDoUpgrade`).
 *
 * Se o Mercado Pago não responder, a intenção fica gravada
 * (`cancelAtPeriodEnd`) e o cron de assinaturas refaz o cancelamento — o
 * mesmo caminho do "Cancelar assinatura" do perfil. Nunca lança.
 */
export async function encerrarRecorrenciaDoQuest(db: Db, userId: string, orderId: string): Promise<number> {
  let encerradas = 0
  try {
    const subs = await db
      .collection<SubscriptionRecord>('subscriptions')
      .find({ userId, status: { $in: STATUS_ATIVOS }, cancelAtPeriodEnd: { $ne: true } })
      .toArray()

    for (const sub of subs) {
      // Só a do Quest+. Uma recorrência do próprio Plus+ não é assunto daqui.
      if (normalizeAccountType(sub.role) === PLUS_TIER) continue
      try {
        await getPaymentProvider().cancelPreapproval(sub.providerSubscriptionId)
      } catch (err) {
        console.error('[upgrade-quest] cancelar recorrência no MP falhou (o cron refaz):', sub.providerSubscriptionId, err)
      }
      const agora = new Date()
      await db.collection('subscriptions').updateOne(
        { _id: sub._id as any },
        { $set: { cancelAtPeriodEnd: true, canceledAt: agora, cancelReason: 'upgrade_plus', updatedAt: agora } },
      )
      encerradas++
      await audit({
        action: 'subscription_canceled',
        targetUserId: userId,
        resourceType: 'subscription',
        resourceId: sub.providerSubscriptionId,
        metadata: { reason: 'upgrade_plus', orderId, keepUntil: sub.currentPeriodEndsAt },
      })
      await recordSubscriptionCheckoutEvent('subscription_cancelled', sub, undefined, {
        status: 'cancel_pending',
        metadata: { cancellationOrigin: 'Upgrade para o Plus+', orderId },
      }).catch(() => {})
    }
  } catch (err) {
    console.error('[upgrade-quest] encerrar recorrência do Quest+ falhou:', userId, err)
  }
  return encerradas
}

/**
 * Estorno do pedido de upgrade: depois do clawback do Plus+, a conta volta ao
 * Quest+ que tinha (se ele ainda vale). Só age quando o pedido estornado é o
 * mesmo que criou o registro — estornar outra compra não devolve nada.
 */
export async function devolverQuestAposEstorno(db: Db, userId: string, ids: string[]): Promise<boolean> {
  if (!ObjectId.isValid(userId)) return false
  const users = db.collection<User>('users')
  const user = await users.findOne(
    { _id: new ObjectId(userId) as any },
    { projection: { accountType: 1, questAntesDoUpgrade: 1 } },
  )
  const guardado = user?.questAntesDoUpgrade
  if (!user || !guardado || !ids.includes(guardado.orderId)) return false
  const orderId = guardado.orderId

  // O clawback deixou a conta gratuita; `retornoAoQuest` só olha quem está no
  // Plus+, então a pergunta é feita como se ainda estivesse.
  const retorno = retornoAoQuest({ ...user, accountType: PLUS_TIER }, new Date())
  if (!retorno || normalizeAccountType(user.accountType) === PLUS_TIER) {
    // Clawback desligado (a conta ficou com o Plus+) ou Quest+ já vencido.
    if (normalizeAccountType(user.accountType) !== PLUS_TIER) {
      await users.updateOne({ _id: user._id as any }, { $unset: { questAntesDoUpgrade: '' } })
    }
    return false
  }

  await users.updateOne(
    { _id: user._id as any },
    {
      $set: {
        accountType: retorno.accountType,
        premiumExpiresAt: retorno.premiumExpiresAt as any,
        premiumPlanType: retorno.premiumPlanType as any,
      },
      $unset: { questAntesDoUpgrade: '' },
    },
  )
  await audit({
    action: 'role_granted',
    targetUserId: userId,
    resourceType: 'plan',
    metadata: { reason: 'upgrade_refunded_quest_restored', orderId, expiresAt: retorno.premiumExpiresAt },
  })
  return true
}
