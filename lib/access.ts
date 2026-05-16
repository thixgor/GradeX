import { Db, ObjectId } from 'mongodb'
import { getDb } from './mongodb'
import { TokenPayload } from './auth'
import { resolveDeckAccess, getUserGroups } from './flashcard-manual'
import { FlashcardManualDeck } from './types'
import { ReviewTargetType } from './reviews'

export type AccessReason =
  | 'admin'
  | 'owner'
  | 'purchased'
  | 'package_purchased'
  | 'group_free'
  | 'shared'
  | 'public_free'
  | 'unlisted_free'
  | 'not_found'
  | 'not_authenticated'
  | 'no_access'

export interface AccessResult {
  allowed: boolean
  reason: AccessReason
  /** Indica que o usuário comprou (não apenas plano/grupo) — usado para selo "verificado" */
  isPurchased: boolean
}

interface CheckParams {
  session: TokenPayload | null
  targetType: ReviewTargetType
  targetId: string
  db?: Db
}

/**
 * Helper unificado: o usuário tem acesso ao material/deck?
 * Reutiliza a lógica já existente em `app/api/materiais/[id]/route.ts`
 * (para `material`) e `resolveDeckAccess()` (para `flashcard_deck`).
 */
export async function hasAccessToTarget({
  session,
  targetType,
  targetId,
  db,
}: CheckParams): Promise<AccessResult> {
  if (!ObjectId.isValid(targetId)) {
    return { allowed: false, reason: 'not_found', isPurchased: false }
  }
  const database = db ?? (await getDb())
  const isAdmin = session?.role === 'admin'

  if (targetType === 'material') {
    return checkMaterialAccess(database, session, targetId, isAdmin)
  }
  return checkDeckAccess(database, session, targetId, isAdmin)
}

async function checkMaterialAccess(
  db: Db,
  session: TokenPayload | null,
  materialId: string,
  isAdmin: boolean,
): Promise<AccessResult> {
  const material = await db.collection('materials').findOne(
    { _id: new ObjectId(materialId) },
    { projection: { pricing: 1, allowedGroups: 1, isHidden: 1 } },
  )
  if (!material) return { allowed: false, reason: 'not_found', isPurchased: false }

  if (isAdmin) return { allowed: true, reason: 'admin', isPurchased: false }
  if (!session) return { allowed: false, reason: 'not_authenticated', isPurchased: false }

  if (material.isHidden) {
    // Conteúdo escondido: só permite com purchase explícito
  }

  // Grupos do usuário
  const userDoc = await db.collection('users').findOne(
    { _id: new ObjectId(session.userId) },
    { projection: { accountType: 1, secondaryRole: 1 } },
  )
  const userGroups: string[] = []
  if (userDoc?.accountType) userGroups.push(userDoc.accountType)
  if (userDoc?.secondaryRole === 'monitor') userGroups.push('monitor')

  const allowedGroups: string[] = Array.isArray(material.allowedGroups) ? material.allowedGroups : []
  const matchesGroup =
    allowedGroups.length === 0 ? true : userGroups.some(g => allowedGroups.includes(g))

  // Material gratuito + grupo permitido → acesso liberado (não é compra)
  if (material.pricing === 'free' && matchesGroup) {
    return { allowed: true, reason: 'group_free', isPurchased: false }
  }

  // Verifica compra direta
  const baseFilter = { itemId: materialId, itemType: 'material', status: 'completed' }
  const byUserId = await db.collection('material_purchases').findOne({
    ...baseFilter,
    userId: session.userId,
  })
  if (byUserId) return { allowed: true, reason: 'purchased', isPurchased: true }

  if (session.email) {
    const emailRegex = new RegExp(
      `^${session.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
      'i',
    )
    const byEmail = await db.collection('material_purchases').findOne({
      ...baseFilter,
      userEmail: { $regex: emailRegex },
    })
    if (byEmail) return { allowed: true, reason: 'purchased', isPurchased: true }
  }

  // Verifica compra via pacote
  const packages = await db
    .collection('material_packages')
    .find({ materialIds: materialId, isHidden: { $ne: true } })
    .project({ _id: 1 })
    .toArray()
  const packageIds = packages.map((pkg: any) => String(pkg._id))

  if (packageIds.length > 0) {
    const packageFilter = {
      itemType: 'package',
      itemId: { $in: packageIds },
      status: 'completed',
    }
    const packageByUserId = await db.collection('material_purchases').findOne({
      ...packageFilter,
      userId: session.userId,
    })
    if (packageByUserId) return { allowed: true, reason: 'package_purchased', isPurchased: true }

    if (session.email) {
      const emailRegex = new RegExp(
        `^${session.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
        'i',
      )
      const packageByEmail = await db.collection('material_purchases').findOne({
        ...packageFilter,
        userEmail: { $regex: emailRegex },
      })
      if (packageByEmail) return { allowed: true, reason: 'package_purchased', isPurchased: true }
    }
  }

  return { allowed: false, reason: 'no_access', isPurchased: false }
}

async function checkDeckAccess(
  db: Db,
  session: TokenPayload | null,
  deckId: string,
  isAdmin: boolean,
): Promise<AccessResult> {
  const deck = await db.collection<FlashcardManualDeck>('flashcardManualDecks').findOne({
    _id: new ObjectId(deckId),
  } as any)
  if (!deck) return { allowed: false, reason: 'not_found', isPurchased: false }

  if (isAdmin) return { allowed: true, reason: 'admin', isPurchased: false }
  if (!session) {
    // Decks públicos gratuitos podem ser vistos sem login, mas só logado pode avaliar
    return { allowed: false, reason: 'not_authenticated', isPurchased: false }
  }

  const userDoc = await db.collection('users').findOne(
    { _id: new ObjectId(session.userId) },
    { projection: { accountType: 1, secondaryRole: 1 } },
  )
  const userGroups = getUserGroups(userDoc as any)

  const result = await resolveDeckAccess({
    db,
    deck: deck as any,
    userId: session.userId,
    userEmail: session.email ?? null,
    userGroups,
    isAdmin: false,
  })

  if (!result.hasAccess) {
    return { allowed: false, reason: 'no_access', isPurchased: false }
  }
  if (result.isOwner) return { allowed: true, reason: 'owner', isPurchased: false }
  if (result.isPurchased) return { allowed: true, reason: 'purchased', isPurchased: true }
  if (result.hasShareAccess) return { allowed: true, reason: 'shared', isPurchased: false }
  if (result.hasGroupAccess) return { allowed: true, reason: 'group_free', isPurchased: false }
  if (deck.visibility === 'public') return { allowed: true, reason: 'public_free', isPurchased: false }
  if (deck.visibility === 'unlisted') return { allowed: true, reason: 'unlisted_free', isPurchased: false }
  return { allowed: true, reason: 'no_access', isPurchased: false }
}
