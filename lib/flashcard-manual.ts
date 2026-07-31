import { Db, ObjectId } from 'mongodb'
import { FlashcardManualDeck, FlashcardManualCard, FlashcardManualFolder, MaterialAccessGroup } from './types'
import { expandUserAccessGroups } from './account-tier'

export const FLASHCARD_MANUAL_COLLECTIONS = {
  decks: 'flashcardManualDecks',
  cards: 'flashcardManualCards',
  folders: 'flashcardManualFolders',
  shares: 'flashcardManualShares',
  likes: 'flashcardManualLikes',
  sessions: 'flashcardManualSessions',
} as const

const SLUG_MAX = 60

export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, SLUG_MAX)
}

function shortId(): string {
  return Math.random().toString(36).slice(2, 8)
}

export async function generateUniqueSlug(db: Db, base: string): Promise<string> {
  const decks = db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks)
  let slug = slugify(base) || `deck-${shortId()}`
  let attempt = 0
  while (await decks.findOne({ slug })) {
    attempt += 1
    slug = `${slugify(base) || 'deck'}-${shortId()}`
    if (attempt > 8) {
      slug = `deck-${Date.now().toString(36)}-${shortId()}`
      break
    }
  }
  return slug
}

export type DeckAccessReason =
  | 'owner'
  | 'admin'
  | 'public'
  | 'unlisted'
  | 'shared'
  | 'purchased'
  | 'group'
  | 'free_admin_deck'

export interface DeckAccessResult {
  hasAccess: boolean
  isOwner: boolean
  isPurchased: boolean
  hasGroupAccess: boolean
  hasShareAccess: boolean
  reason: DeckAccessReason | null
  reasons: DeckAccessReason[]
}

interface ResolveDeckAccessParams {
  db: Db
  deck: FlashcardManualDeck & { _id?: any }
  userId: string | null
  userEmail: string | null
  userGroups: string[]
  isAdmin: boolean
}

export async function resolveDeckAccess({
  db,
  deck,
  userId,
  userEmail,
  userGroups,
  isAdmin,
}: ResolveDeckAccessParams): Promise<DeckAccessResult> {
  const reasons: DeckAccessReason[] = []
  const isOwner = !!userId && deck.ownerId === userId
  if (isOwner) reasons.push('owner')
  if (isAdmin) reasons.push('admin')

  // Compras (apenas decks de admin com pricing=paid e linkedMaterialId)
  let isPurchased = false
  if (deck.pricing === 'paid' && deck.linkedMaterialId && userId) {
    const baseFilter = { itemType: 'material', itemId: deck.linkedMaterialId, status: 'completed' }
    const byUserId = await db.collection('material_purchases').findOne({ ...baseFilter, userId })
    if (byUserId) {
      isPurchased = true
    } else if (userEmail) {
      const emailRegex = new RegExp(`^${userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
      const byEmail = await db.collection('material_purchases').findOne({ ...baseFilter, userEmail: { $regex: emailRegex } })
      if (byEmail) isPurchased = true
    }

    if (!isPurchased) {
      const packages = await db.collection('material_packages')
        .find({ materialIds: deck.linkedMaterialId, isHidden: { $ne: true } })
        .project({ _id: 1 })
        .toArray()
      const packageIds = packages.map((pkg: any) => String(pkg._id))

      if (packageIds.length > 0) {
        const packageFilter = {
          itemType: 'package',
          itemId: { $in: packageIds },
          status: 'completed',
        }
        const packageByUserId = await db.collection('material_purchases').findOne({ ...packageFilter, userId })
        if (packageByUserId) {
          isPurchased = true
        } else if (userEmail) {
          const emailRegex = new RegExp(`^${userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
          const packageByEmail = await db.collection('material_purchases').findOne({ ...packageFilter, userEmail: { $regex: emailRegex } })
          if (packageByEmail) isPurchased = true
        }
      }
    }

    if (isPurchased) reasons.push('purchased')
  }

  // Acesso por grupo (admin restringe via allowedGroups)
  const allowedGroups = (deck.allowedGroups || []) as string[]
  const hasGroupAccess = allowedGroups.length === 0
    ? deck.ownerType === 'admin' && deck.pricing === 'free'
    : userGroups.some(g => allowedGroups.includes(g))
  if (deck.ownerType === 'admin' && deck.pricing === 'free' && hasGroupAccess) {
    reasons.push(allowedGroups.length === 0 ? 'free_admin_deck' : 'group')
  }

  // Compartilhamento direto
  let hasShareAccess = false
  if (userId) {
    const share = await db.collection(FLASHCARD_MANUAL_COLLECTIONS.shares).findOne({
      deckId: String(deck._id),
      toUserId: userId,
      status: { $in: ['pending', 'accepted'] },
    })
    if (share) {
      hasShareAccess = true
      reasons.push('shared')
    }
  }

  // Visibilidade pública/unlisted
  if (deck.visibility === 'public' && deck.isPublished) reasons.push('public')
  if (deck.visibility === 'unlisted' && deck.isPublished) reasons.push('unlisted')

  const hasAccess =
    isOwner ||
    isAdmin ||
    isPurchased ||
    hasShareAccess ||
    // Admin free decks: requires isPublished to prevent access to private/draft decks
    (deck.ownerType === 'admin' && deck.pricing === 'free' && hasGroupAccess && !!deck.isPublished) ||
    ((deck.visibility === 'public' || deck.visibility === 'unlisted') && deck.isPublished && deck.pricing !== 'paid')

  return {
    hasAccess,
    isOwner,
    isPurchased,
    hasGroupAccess,
    hasShareAccess,
    reason: reasons[0] || null,
    reasons,
  }
}

export function normalizeDeckForResponse(deck: FlashcardManualDeck & { _id?: any }) {
  return {
    ...deck,
    _id: deck._id ? String(deck._id) : undefined,
    folderId: deck.folderId ? String(deck.folderId) : null,
    linkedMaterialId: deck.linkedMaterialId ? String(deck.linkedMaterialId) : null,
  }
}

export function normalizeCardForResponse(card: FlashcardManualCard & { _id?: any }) {
  return {
    ...card,
    _id: card._id ? String(card._id) : undefined,
  }
}

export function normalizeFolderForResponse(folder: FlashcardManualFolder & { _id?: any }) {
  return {
    ...folder,
    _id: folder._id ? String(folder._id) : undefined,
    parentFolderId: folder.parentFolderId ? String(folder.parentFolderId) : null,
  }
}

export function sanitizeDeckTitle(title: string): string {
  return String(title || '').replace(/\s+/g, ' ').trim().slice(0, 120)
}

export function sanitizeDescription(text: string, max = 600): string {
  return String(text || '').trim().slice(0, max)
}

export function sanitizeCardSide(side: any): { text: string; image?: string } {
  return {
    text: String(side?.text || '').slice(0, 1500),
    image: side?.image ? String(side.image).slice(0, 500) : undefined,
  }
}

export function sanitizeHiddenWord(payload: any): { phrase: string; word: string; hint?: string } | undefined {
  if (!payload) return undefined
  const phrase = String(payload.phrase || '').slice(0, 600).trim()
  const word = String(payload.word || '').slice(0, 80).trim()
  if (!phrase || !word) return undefined
  return {
    phrase,
    word,
    hint: payload.hint ? String(payload.hint).slice(0, 200) : undefined,
  }
}

export function isValidObjectId(id: string | undefined | null): boolean {
  return !!id && ObjectId.isValid(id)
}

export const FLASHCARD_MANUAL_TAG_LIMIT = 8
export const FLASHCARD_MANUAL_TAG_MAX_LENGTH = 24

export function sanitizeTags(tags: any): string[] {
  if (!Array.isArray(tags)) return []
  return tags
    .map((t: any) => String(t || '').trim().slice(0, FLASHCARD_MANUAL_TAG_MAX_LENGTH))
    .filter(Boolean)
    .slice(0, FLASHCARD_MANUAL_TAG_LIMIT)
}

/**
 * Grupos do usuário para casar com `allowedGroups`.
 *
 * Um assinante `plus` recebe também os aliases legados, senão perderia acesso
 * a decks marcados como `premium`/`essential` antes da consolidação dos cargos.
 */
export function getUserGroups(user: { accountType?: string | null; secondaryRole?: string | null } | null): string[] {
  if (!user) return []
  return expandUserAccessGroups(user.accountType, user.secondaryRole)
}

export const FLASHCARD_MANUAL_VALID_GROUPS: MaterialAccessGroup[] = [
  'gratuito',
  'trial',
  'plus',
  'monitor',
  // Legado — aceito em payloads antigos, nunca oferecido na interface.
  'essential',
  'premium',
]
