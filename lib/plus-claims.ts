/**
 * Ciclo de vida dos resgates do Plus+.
 *
 * ## O que é um "resgate"
 *
 * O Plus+ inclui o acervo, mas o acesso não é implícito: o assinante resgata
 * cada item (`/api/materiais/resgatar`), e o resgate grava um registro em
 * `material_purchases` com `price: 0` e `source: 'plus'`. Esse registro é o que
 * todos os caminhos de acesso — leitor, download, "Meus materiais", catálogo —
 * consultam depois.
 *
 * ## Por que revogar
 *
 * O resgate é um benefício da assinatura, não uma compra. Sem revogação, quem
 * assinasse um mês e resgatasse o acervo ficava com tudo para sempre — o
 * teto de resgates da janela de arrependimento (`plus-guard`) segurava o
 * volume, mas não a permanência.
 *
 * Então: quando a assinatura cai (expira, é cancelada, é reembolsada ou o admin
 * rebaixa o cargo), todo resgate vira `status: 'plus_revoked'` e o acesso some
 * junto com o cargo. O registro **não** é apagado — fica guardado com
 * `plusRevokedAt`/`plusRevokedReason` para que a renovação devolva exatamente o
 * que a pessoa já tinha, e para auditoria.
 *
 * ## O que nunca é tocado
 *
 * Só documentos com `source: 'plus'` entram no filtro. Compra avulsa (material
 * ou pacote pago, com ou sem `source: 'purchase'`, incluindo os registros
 * legados sem o campo) é vitalícia e passa longe daqui — é receita, não
 * benefício de assinatura.
 */

import { Db, ObjectId } from 'mongodb'
import { getDb } from './mongodb'
import { audit } from './payments/audit'
import type { MaterialPurchase } from './types'

/**
 * Status de um resgate suspenso. É um valor próprio (e não `'refunded'`) de
 * propósito: `'refunded'` marca compra estornada, que nunca deve voltar sozinha
 * numa renovação. Como todo caminho de acesso filtra por `status: 'completed'`,
 * o resgate suspenso deixa de dar acesso em todos eles de uma vez.
 */
export const PLUS_CLAIM_REVOKED_STATUS = 'plus_revoked' as const

export interface PlusClaimItem {
  itemType: 'material' | 'package'
  itemId: string
  itemTitle?: string
}

export interface PlusClaimsResult {
  /** Quantos resgates mudaram de estado nesta chamada. */
  count: number
  items: PlusClaimItem[]
}

const EMPTY: PlusClaimsResult = { count: 0, items: [] }

/** Filtro base — a garantia de que compra avulsa jamais é alcançada. */
function claimFilter(userId: string, status: string) {
  return { userId, source: 'plus', status } as Record<string, unknown>
}

function toItems(docs: Array<Partial<MaterialPurchase>>): PlusClaimItem[] {
  return docs.map(doc => ({
    itemType: (doc.itemType as 'material' | 'package') || 'material',
    itemId: String(doc.itemId),
    itemTitle: doc.itemTitle,
  }))
}

/**
 * Suspende todos os resgates do Plus+ da conta.
 *
 * Chamado em todo ponto que tira o cargo Plus+: expiração pelo cron, expiração
 * detectada no login, cancelamento, clawback de reembolso e rebaixamento pelo
 * admin. Idempotente — rodar de novo não encontra nada para suspender.
 *
 * Propaga erro de banco: quem chama decide se aborta (rota do admin) ou apenas
 * registra e segue (cron, varrendo várias contas).
 */
export async function revokePlusClaims(
  userId: string,
  reason: string,
  db?: Db,
): Promise<PlusClaimsResult> {
  if (!userId) return EMPTY

  const database = db ?? (await getDb())
  const purchases = database.collection<MaterialPurchase>('material_purchases')
  const filter = claimFilter(userId, 'completed')

  const claims = await purchases
    .find(filter as any, { projection: { itemType: 1, itemId: 1, itemTitle: 1 } })
    .toArray()
  if (claims.length === 0) return EMPTY

  const now = new Date()
  await purchases.updateMany(filter as any, {
    $set: {
      status: PLUS_CLAIM_REVOKED_STATUS,
      plusRevokedAt: now,
      plusRevokedReason: reason.slice(0, 200),
    },
  } as any)

  const items = toItems(claims)
  await audit({
    action: 'plus_claims_revoked',
    targetUserId: userId,
    resourceType: 'material_purchases',
    metadata: { reason, count: items.length, itemIds: items.map(i => i.itemId) },
  })

  return { count: items.length, items }
}

/**
 * Devolve os resgates suspensos quando o Plus+ volta (renovação, nova compra do
 * plano, serial key ou concessão do admin).
 *
 * Itens que a pessoa passou a ter por compra avulsa enquanto o resgate estava
 * suspenso ficam de fora: a compra já garante o acesso e reativar o resgate só
 * duplicaria a linha no histórico.
 */
export async function restorePlusClaims(
  userId: string,
  reason: string,
  db?: Db,
): Promise<PlusClaimsResult> {
  if (!userId) return EMPTY

  const database = db ?? (await getDb())
  const purchases = database.collection<MaterialPurchase>('material_purchases')

  const revoked = await purchases
    .find(claimFilter(userId, PLUS_CLAIM_REVOKED_STATUS) as any, {
      projection: { _id: 1, itemType: 1, itemId: 1, itemTitle: 1 },
    })
    .toArray()
  if (revoked.length === 0) return EMPTY

  const ownedOutright = await purchases
    .find(
      {
        userId,
        status: 'completed',
        source: { $ne: 'plus' },
        itemId: { $in: revoked.map(doc => String(doc.itemId)) },
      } as any,
      { projection: { itemType: 1, itemId: 1 } },
    )
    .toArray()
  const ownedKeys = new Set(ownedOutright.map(doc => `${doc.itemType}:${doc.itemId}`))

  const toRestore = revoked.filter(doc => !ownedKeys.has(`${doc.itemType}:${doc.itemId}`))
  if (toRestore.length === 0) return EMPTY

  await purchases.updateMany(
    { _id: { $in: toRestore.map(doc => doc._id as ObjectId) } } as any,
    {
      $set: { status: 'completed', plusRestoredAt: new Date() },
      $unset: { plusRevokedAt: '', plusRevokedReason: '' },
    } as any,
  )

  const items = toItems(toRestore)
  await audit({
    action: 'plus_claims_restored',
    targetUserId: userId,
    resourceType: 'material_purchases',
    metadata: { reason, count: items.length, itemIds: items.map(i => i.itemId) },
  })

  return { count: items.length, items }
}

/** Quantos resgates estão suspensos aguardando renovação. */
export async function countRevokedPlusClaims(userId: string, db?: Db): Promise<number> {
  if (!userId) return 0
  const database = db ?? (await getDb())
  return database
    .collection<MaterialPurchase>('material_purchases')
    .countDocuments(claimFilter(userId, PLUS_CLAIM_REVOKED_STATUS) as any)
}
