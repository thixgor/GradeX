import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { REVIEWS_COLLECTION, type ReviewDoc, type ReviewTargetType } from '@/lib/reviews'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_ITEMS = 6

interface PendingReviewItem {
  targetType: ReviewTargetType
  targetId: string
  title: string
  coverImage: string | null
  kind: 'material' | 'flashcard'
  href: string
  purchasedAt: string | null
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function rememberPurchaseDate(map: Map<string, Date>, id: string, purchasedAt: unknown) {
  const date = purchasedAt instanceof Date ? purchasedAt : purchasedAt ? new Date(String(purchasedAt)) : null
  if (!date || Number.isNaN(date.getTime())) return

  const current = map.get(id)
  if (!current || date.getTime() > current.getTime()) {
    map.set(id, date)
  }
}

function toObjectIds(ids: string[]) {
  return ids
    .filter(id => ObjectId.isValid(id))
    .map(id => new ObjectId(id))
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const purchaseOwnerFilter: any[] = [{ userId: session.userId }]

    if (session.email) {
      purchaseOwnerFilter.push({
        userEmail: { $regex: new RegExp(`^${escapeRegex(session.email)}$`, 'i') },
      })
    }

    const purchases = await db.collection('material_purchases')
      .find({
        status: 'completed',
        itemType: { $in: ['material', 'package'] },
        $or: purchaseOwnerFilter,
      })
      .project({ itemType: 1, itemId: 1, purchasedAt: 1 })
      .sort({ purchasedAt: -1 })
      .limit(250)
      .toArray()

    if (purchases.length === 0) {
      return NextResponse.json({ items: [], total: 0 })
    }

    const materialIds = new Set<string>()
    const packageIds = new Set<string>()
    const purchasedAtByMaterialId = new Map<string, Date>()
    const purchasedAtByPackageId = new Map<string, Date>()

    for (const purchase of purchases) {
      const itemId = String(purchase.itemId || '')
      if (!itemId) continue

      if (purchase.itemType === 'material') {
        materialIds.add(itemId)
        rememberPurchaseDate(purchasedAtByMaterialId, itemId, purchase.purchasedAt)
      } else if (purchase.itemType === 'package') {
        packageIds.add(itemId)
        rememberPurchaseDate(purchasedAtByPackageId, itemId, purchase.purchasedAt)
      }
    }

    const packageObjectIds = toObjectIds([...packageIds])
    if (packageObjectIds.length > 0) {
      const packages = await db.collection('material_packages')
        .find({ _id: { $in: packageObjectIds }, isHidden: { $ne: true } })
        .project({ _id: 1, materialIds: 1 })
        .toArray()

      for (const pkg of packages) {
        const packageDate = purchasedAtByPackageId.get(String(pkg._id))
        for (const materialId of Array.isArray(pkg.materialIds) ? pkg.materialIds : []) {
          const id = String(materialId)
          materialIds.add(id)
          if (packageDate) rememberPurchaseDate(purchasedAtByMaterialId, id, packageDate)
        }
      }
    }

    const materialObjectIds = toObjectIds([...materialIds])
    if (materialObjectIds.length === 0) {
      return NextResponse.json({ items: [], total: 0 })
    }

    const [materials, linkedDecks] = await Promise.all([
      db.collection('materials')
        .find({ _id: { $in: materialObjectIds }, isHidden: { $ne: true } })
        .project({ _id: 1, title: 1, coverImage: 1, type: 1, reviewsLocked: 1 })
        .toArray(),
      db.collection('flashcardManualDecks')
        .find({
          linkedMaterialId: { $in: [...materialIds] },
          isHidden: { $ne: true },
        })
        .project({ _id: 1, title: 1, coverImage: 1, slug: 1, linkedMaterialId: 1, reviewsLocked: 1 })
        .toArray(),
    ])

    const deckByMaterialId = new Map<string, any>()
    for (const deck of linkedDecks) {
      if (!deck.linkedMaterialId || deck.reviewsLocked === true || !deck.slug) continue
      deckByMaterialId.set(String(deck.linkedMaterialId), deck)
    }

    const candidates: PendingReviewItem[] = []

    for (const material of materials) {
      const materialId = String(material._id)
      const linkedDeck = deckByMaterialId.get(materialId)
      const purchasedAt = purchasedAtByMaterialId.get(materialId)

      if (linkedDeck) {
        candidates.push({
          targetType: 'flashcard_deck',
          targetId: String(linkedDeck._id),
          title: String(linkedDeck.title || material.title || 'Deck de flashcards'),
          coverImage: linkedDeck.coverImage || material.coverImage || null,
          kind: 'flashcard',
          href: `/flashcards/d/${linkedDeck.slug}#reviews-section`,
          purchasedAt: purchasedAt ? purchasedAt.toISOString() : null,
        })
        continue
      }

      if (material.reviewsLocked === true) continue

      candidates.push({
        targetType: 'material',
        targetId: materialId,
        title: String(material.title || 'Material'),
        coverImage: material.coverImage || null,
        kind: material.type === 'flashcard_deck' ? 'flashcard' : 'material',
        href: `/materiais/${materialId}#reviews-section`,
        purchasedAt: purchasedAt ? purchasedAt.toISOString() : null,
      })
    }

    if (candidates.length === 0) {
      return NextResponse.json({ items: [], total: 0 })
    }

    const materialTargetIds = candidates
      .filter(item => item.targetType === 'material')
      .map(item => item.targetId)
    const deckTargetIds = candidates
      .filter(item => item.targetType === 'flashcard_deck')
      .map(item => item.targetId)

    const reviewFilters: any[] = []
    if (materialTargetIds.length > 0) {
      reviewFilters.push({ targetType: 'material', targetId: { $in: materialTargetIds } })
    }
    if (deckTargetIds.length > 0) {
      reviewFilters.push({ targetType: 'flashcard_deck', targetId: { $in: deckTargetIds } })
    }

    const existingReviews = reviewFilters.length > 0
      ? await db.collection<ReviewDoc>(REVIEWS_COLLECTION)
          .find({
            userId: session.userId,
            isAdminCreated: { $ne: true },
            $or: reviewFilters,
          })
          .project({ targetType: 1, targetId: 1 })
          .toArray()
      : []

    const reviewed = new Set(existingReviews.map(review => `${review.targetType}:${review.targetId}`))
    const pending = candidates
      .filter(item => !reviewed.has(`${item.targetType}:${item.targetId}`))
      .sort((a, b) => new Date(b.purchasedAt || 0).getTime() - new Date(a.purchasedAt || 0).getTime())

    const res = NextResponse.json({
      items: pending.slice(0, MAX_ITEMS),
      total: pending.length,
    })
    res.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
    return res
  } catch (error) {
    console.error('GET /api/reviews/pending error:', error)
    return NextResponse.json({ error: 'Erro ao buscar avaliações pendentes' }, { status: 500 })
  }
}
