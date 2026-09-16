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

/** Um alvo de avaliação: o par (tipo, id) que identifica material ou deck. */
export interface ReviewTargetRef {
  targetType: ReviewTargetType
  targetId: string
}

/**
 * Um deck pago vive em duas páginas: `/flashcards/d/<slug>` e o espelho em
 * `/materiais/<linkedMaterialId>` criado por `syncMaterialForFlashcardDeck`.
 * São duas portas para o mesmo produto — quem compra, estuda e opina não faz
 * ideia de que existem duas. Logo: uma opinião só, compartilhada pelas duas.
 *
 * O grupo é o conjunto de alvos que dividem essa opinião. Leitura soma todos
 * os membros (média, distribuição, lista e "já avaliei" ficam idênticos nas
 * duas páginas); escrita vai para o canônico, para não haver dois baldes novos.
 */
export interface ReviewTargetGroup {
  exists: boolean
  /** Alvo onde novas avaliações do grupo são gravadas. */
  canonical: ReviewTargetRef
  /** Todos os alvos do grupo, incluindo o canônico. */
  members: ReviewTargetRef[]
  /** Travado se QUALQUER membro estiver travado — travar uma página trava o produto. */
  locked: boolean
  /** Título do alvo pedido (não do canônico): é o nome da página que perguntou. */
  title: string | null
}

/** Filtro de coleção para um grupo: direto quando é um alvo só, `$or` quando são dois. */
export function reviewTargetFilter(members: ReviewTargetRef[]): Record<string, unknown> {
  if (members.length === 1) {
    return { targetType: members[0].targetType, targetId: members[0].targetId }
  }
  return {
    $or: members.map(member => ({ targetType: member.targetType, targetId: member.targetId })),
  }
}

/**
 * Resolve o grupo do alvo pedido. Material e deck espelhado apontam um para o
 * outro (`linkedDeckId` / `linkedMaterialId`); materiais antigos podem não ter
 * o `linkedDeckId` gravado, então o deck também é procurado pelo lado dele.
 */
export async function resolveReviewTargetGroup(
  db: Db,
  targetType: ReviewTargetType,
  targetId: string,
): Promise<ReviewTargetGroup> {
  const requested: ReviewTargetRef = { targetType, targetId }
  const missing: ReviewTargetGroup = {
    exists: false,
    canonical: requested,
    members: [requested],
    locked: false,
    title: null,
  }
  if (!ObjectId.isValid(targetId)) return missing

  if (targetType === 'material') {
    const material = await db.collection('materials').findOne(
      { _id: new ObjectId(targetId) },
      { projection: { reviewsLocked: 1, title: 1, linkedDeckId: 1 } },
    )
    if (!material) return missing

    const linkedDeckId = String(material.linkedDeckId || '')
    const deckOr: any[] = [{ linkedMaterialId: targetId }]
    if (ObjectId.isValid(linkedDeckId)) deckOr.push({ _id: new ObjectId(linkedDeckId) })
    const deck = await db.collection('flashcardManualDecks').findOne(
      { $or: deckOr },
      { projection: { reviewsLocked: 1 } },
    )

    return buildGroup({
      requestedTitle: material.title ?? null,
      material: { targetType: 'material', targetId },
      materialLocked: material.reviewsLocked === true,
      deck: deck ? { targetType: 'flashcard_deck', targetId: String(deck._id) } : null,
      deckLocked: deck?.reviewsLocked === true,
    })
  }

  const deck = await db.collection('flashcardManualDecks').findOne(
    { _id: new ObjectId(targetId) },
    { projection: { reviewsLocked: 1, title: 1, linkedMaterialId: 1 } },
  )
  if (!deck) return missing

  const linkedMaterialId = String(deck.linkedMaterialId || '')
  const material = ObjectId.isValid(linkedMaterialId)
    ? await db.collection('materials').findOne(
        { _id: new ObjectId(linkedMaterialId) },
        { projection: { reviewsLocked: 1 } },
      )
    : null

  return buildGroup({
    requestedTitle: deck.title ?? null,
    material: material ? { targetType: 'material', targetId: String(material._id) } : null,
    materialLocked: material?.reviewsLocked === true,
    deck: { targetType: 'flashcard_deck', targetId },
    deckLocked: deck.reviewsLocked === true,
  })
}

/**
 * O material é o canônico quando existe: ele é a unidade de venda (compra,
 * pacote, preço) e onde já moram as avaliações de todo o resto do catálogo.
 */
function buildGroup(input: {
  requestedTitle: string | null
  material: ReviewTargetRef | null
  materialLocked: boolean
  deck: ReviewTargetRef | null
  deckLocked: boolean
}): ReviewTargetGroup {
  const members = [input.material, input.deck].filter(Boolean) as ReviewTargetRef[]
  return {
    exists: true,
    canonical: members[0],
    members,
    locked: input.materialLocked || input.deckLocked,
    title: input.requestedTitle,
  }
}

export async function computeReviewSummary(
  db: Db,
  targets: ReviewTargetRef[],
): Promise<ReviewSummary> {
  const cursor = db.collection<ReviewDoc>(REVIEWS_COLLECTION).aggregate<{ _id: number; count: number }>([
    { $match: reviewTargetFilter(targets) },
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

/**
 * A avaliação que esta pessoa já deixou no grupo — venha ela da página do deck
 * ou do espelho em /materiais. É o que impede a mesma pessoa de avaliar o mesmo
 * produto duas vezes, uma por porta de entrada.
 */
export async function findUserReview(
  db: Db,
  targets: ReviewTargetRef[],
  userId: string,
): Promise<ReviewDoc | null> {
  return db.collection<ReviewDoc>(REVIEWS_COLLECTION).findOne({
    ...reviewTargetFilter(targets),
    userId,
    isAdminCreated: { $ne: true },
  } as any)
}

export async function getTargetReviewsLocked(
  db: Db,
  targetType: ReviewTargetType,
  targetId: string,
): Promise<{ exists: boolean; locked: boolean; title: string | null }> {
  const group = await resolveReviewTargetGroup(db, targetType, targetId)
  return { exists: group.exists, locked: group.locked, title: group.title }
}

export function getTargetCollectionName(targetType: ReviewTargetType): 'materials' | 'flashcardManualDecks' {
  return targetType === 'material' ? 'materials' : 'flashcardManualDecks'
}
