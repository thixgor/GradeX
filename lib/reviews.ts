import { Db, ObjectId } from 'mongodb'
export type { ReviewTargetType, PublicReview, ReviewSummary } from './reviews-shared'
export { REVIEW_TARGET_TYPES, REVIEW_COMMENT_MAX, REVIEW_DISPLAY_NAME_MAX, REVIEW_AVATAR_URL_MAX } from './reviews-shared'
import type { ReviewTargetType, PublicReview, ReviewSummary } from './reviews-shared'
import { REVIEW_COMMENT_MAX, REVIEW_DISPLAY_NAME_MAX, REVIEW_AVATAR_URL_MAX } from './reviews-shared'

const HTML_ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '`': '&#x60;', '=': '&#x3D;', '/': '&#x2F;' }
function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return ''
  return input.replace(/[&<>"'`=/]/g, char => HTML_ENTITIES[char] || char)
}

export const REVIEWS_COLLECTION = 'reviews'

export interface ReviewDoc {
  _id: ObjectId
  targetType: ReviewTargetType
  targetId: string
  rating: 1 | 2 | 3 | 4 | 5
  comment: string

  userId: string | null
  displayName: string
  avatarUrl?: string | null

  isAdminCreated: boolean
  isFeatured: boolean
  isVerified: boolean

  createdAt: Date
  updatedAt: Date
  createdByAdminId?: string | null
}

const EMPTY_DISTRIBUTION = (): ReviewSummary['distribution'] => ({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })

export function isValidRating(value: unknown): value is 1 | 2 | 3 | 4 | 5 {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5
}

export function isValidTargetType(value: unknown): value is ReviewTargetType {
  return value === 'material' || value === 'flashcard_deck'
}

export function sanitizeReviewComment(input: unknown): string {
  if (input === undefined || input === null) return ''
  if (typeof input !== 'string') return ''
  const trimmed = input.trim()
  if (!trimmed) return ''
  return sanitizeHtml(trimmed.slice(0, REVIEW_COMMENT_MAX))
}

export function sanitizeDisplayName(input: unknown, fallback = 'Usuário'): string {
  if (typeof input !== 'string') return fallback
  const trimmed = input.replace(/\s+/g, ' ').trim().slice(0, REVIEW_DISPLAY_NAME_MAX)
  if (!trimmed) return fallback
  return sanitizeHtml(trimmed)
}

export function sanitizeAvatarUrl(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const trimmed = input.trim().slice(0, REVIEW_AVATAR_URL_MAX)
  if (!trimmed) return null
  // Aceita apenas http(s) ou caminhos relativos seguros (/uploads/..., /images/...)
  if (/^https?:\/\//i.test(trimmed) || /^\/[a-z0-9_\-./]+$/i.test(trimmed)) {
    return trimmed
  }
  return null
}

/**
 * Para LGPD: nunca expor sobrenome publicamente. "Thiago Ferreira Rodrigues" -> "Thiago".
 * Mantém a primeira palavra "real" do nome; ignora preposições isoladas (de, da, do, dos, das).
 */
export function publicFirstName(displayName: string): string {
  if (!displayName) return 'Usuário'
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'Usuário'
  const skip = new Set(['de', 'da', 'do', 'dos', 'das'])
  const first = parts.find(p => !skip.has(p.toLowerCase())) || parts[0]
  return first
}

export function toPublicReview(doc: ReviewDoc): PublicReview {
  return {
    _id: String(doc._id),
    targetType: doc.targetType,
    targetId: doc.targetId,
    rating: doc.rating,
    comment: doc.comment || '',
    userId: doc.userId,
    displayName: publicFirstName(doc.displayName),
    avatarUrl: doc.avatarUrl ?? null,
    isAdminCreated: !!doc.isAdminCreated,
    isFeatured: !!doc.isFeatured,
    isVerified: !!doc.isVerified,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }
}

export async function computeReviewSummary(
  db: Db,
  targetType: ReviewTargetType,
  targetId: string,
): Promise<ReviewSummary> {
  const cursor = db.collection<ReviewDoc>(REVIEWS_COLLECTION).aggregate<{ _id: number; count: number }>([
    { $match: { targetType, targetId } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ])

  const distribution = EMPTY_DISTRIBUTION()
  let total = 0
  let sum = 0

  for await (const row of cursor) {
    const rating = row._id as 1 | 2 | 3 | 4 | 5
    if (rating >= 1 && rating <= 5) {
      distribution[rating] = row.count
      total += row.count
      sum += rating * row.count
    }
  }

  const avg = total > 0 ? Math.round((sum / total) * 10) / 10 : 0
  return { count: total, avg, distribution }
}

export async function findUserReview(
  db: Db,
  targetType: ReviewTargetType,
  targetId: string,
  userId: string,
): Promise<ReviewDoc | null> {
  return db.collection<ReviewDoc>(REVIEWS_COLLECTION).findOne({
    targetType,
    targetId,
    userId,
    isAdminCreated: { $ne: true },
  })
}

export async function getTargetReviewsLocked(
  db: Db,
  targetType: ReviewTargetType,
  targetId: string,
): Promise<{ exists: boolean; locked: boolean; title: string | null }> {
  if (!ObjectId.isValid(targetId)) return { exists: false, locked: false, title: null }
  if (targetType === 'material') {
    const doc = await db.collection('materials').findOne(
      { _id: new ObjectId(targetId) },
      { projection: { reviewsLocked: 1, title: 1, isHidden: 1 } },
    )
    if (!doc) return { exists: false, locked: false, title: null }
    return { exists: true, locked: doc.reviewsLocked === true, title: doc.title ?? null }
  }
  // flashcard_deck
  const doc = await db.collection('flashcardManualDecks').findOne(
    { _id: new ObjectId(targetId) },
    { projection: { reviewsLocked: 1, title: 1, isHidden: 1 } },
  )
  if (!doc) return { exists: false, locked: false, title: null }
  return { exists: true, locked: doc.reviewsLocked === true, title: doc.title ?? null }
}

export function getTargetCollectionName(targetType: ReviewTargetType): 'materials' | 'flashcardManualDecks' {
  return targetType === 'material' ? 'materials' : 'flashcardManualDecks'
}
