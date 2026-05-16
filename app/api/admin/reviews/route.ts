import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { isValidObjectId, sanitizeHtml } from '@/lib/api-security'
import {
  REVIEWS_COLLECTION,
  REVIEW_TARGET_TYPES,
  ReviewDoc,
  getTargetCollectionName,
  getTargetReviewsLocked,
  isValidRating,
  isValidTargetType,
  sanitizeAvatarUrl,
  sanitizeDisplayName,
  sanitizeReviewComment,
  toPublicReview,
} from '@/lib/reviews'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ADMIN_PAGE_SIZE = 30

async function ensureAdmin() {
  const session = await getSession()
  if (!session) return { error: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) }
  if (session.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) }
  }
  return { session }
}

export async function GET(request: NextRequest) {
  const auth = await ensureAdmin()
  if ('error' in auth) return auth.error

  try {
    const url = new URL(request.url)
    const targetTypeParam = url.searchParams.get('targetType')
    const targetIdParam = url.searchParams.get('targetId')
    const search = (url.searchParams.get('search') || '').trim().slice(0, 200)
    const cursor = url.searchParams.get('cursor')
    const limit = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get('limit') || String(ADMIN_PAGE_SIZE), 10) || ADMIN_PAGE_SIZE),
    )

    const db = await getDb()
    const collection = db.collection<ReviewDoc>(REVIEWS_COLLECTION)

    const filter: any = {}
    if (targetTypeParam && isValidTargetType(targetTypeParam)) {
      filter.targetType = targetTypeParam
    }
    if (targetIdParam && isValidObjectId(targetIdParam)) {
      filter.targetId = targetIdParam
    }
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.$or = [
        { displayName: { $regex: escaped, $options: 'i' } },
        { comment: { $regex: escaped, $options: 'i' } },
      ]
    }
    if (cursor && isValidObjectId(cursor)) {
      const cursorDoc = await collection.findOne({ _id: new ObjectId(cursor) }, { projection: { createdAt: 1 } })
      if (cursorDoc) {
        const cursorClause = {
          $or: [
            { createdAt: { $lt: cursorDoc.createdAt } },
            { createdAt: cursorDoc.createdAt, _id: { $lt: new ObjectId(cursor) } },
          ],
        }
        if (filter.$or) {
          filter.$and = [{ $or: filter.$or }, cursorClause]
          delete filter.$or
        } else {
          Object.assign(filter, cursorClause)
        }
      }
    }

    const items = await collection
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .toArray()

    const hasMore = items.length > limit
    const pageItems = hasMore ? items.slice(0, limit) : items
    const nextCursor = hasMore ? String(pageItems[pageItems.length - 1]._id) : null

    // Carrega títulos dos targets (lookup leve em duas queries por tipo)
    const titlesByKey = new Map<string, string>()
    const targetsByType: Record<string, Set<string>> = { material: new Set(), flashcard_deck: new Set() }
    pageItems.forEach(r => {
      if (REVIEW_TARGET_TYPES.includes(r.targetType) && isValidObjectId(r.targetId)) {
        targetsByType[r.targetType].add(r.targetId)
      }
    })
    await Promise.all(
      Object.entries(targetsByType).map(async ([type, ids]) => {
        if (ids.size === 0) return
        const collName = getTargetCollectionName(type as any)
        const objectIds = Array.from(ids).map(id => new ObjectId(id))
        const docs = await db
          .collection(collName)
          .find({ _id: { $in: objectIds } })
          .project({ title: 1, slug: 1 })
          .toArray()
        docs.forEach((d: any) => {
          titlesByKey.set(`${type}:${String(d._id)}`, d.title || d.slug || '(sem título)')
        })
      }),
    )

    return NextResponse.json({
      reviews: pageItems.map(r => ({
        ...toPublicReview(r),
        targetTitle: titlesByKey.get(`${r.targetType}:${r.targetId}`) || '(item removido)',
      })),
      nextCursor,
    })
  } catch (error) {
    console.error('GET /api/admin/reviews error:', error)
    return NextResponse.json({ error: 'Erro ao listar avaliações' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await ensureAdmin()
  if ('error' in auth) return auth.error
  const session = auth.session!

  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }
    const {
      targetType,
      targetId,
      rating,
      comment,
      displayName,
      avatarUrl,
      createdAt,
      isFeatured,
      isVerified,
    } = body as Record<string, unknown>

    if (!isValidTargetType(targetType)) {
      return NextResponse.json({ error: 'targetType inválido' }, { status: 400 })
    }
    if (typeof targetId !== 'string' || !isValidObjectId(targetId)) {
      return NextResponse.json({ error: 'targetId inválido' }, { status: 400 })
    }
    if (!isValidRating(rating)) {
      return NextResponse.json({ error: 'Nota inválida' }, { status: 400 })
    }

    const db = await getDb()
    const target = await getTargetReviewsLocked(db, targetType, targetId)
    if (!target.exists) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
    }

    const cleanedName = sanitizeDisplayName(displayName, 'Aluno DomineAqui')
    const cleanedComment = sanitizeReviewComment(comment)
    const cleanedAvatar = sanitizeAvatarUrl(avatarUrl)
    const customDate = typeof createdAt === 'string' ? new Date(createdAt) : null
    const validDate = customDate && !isNaN(customDate.getTime()) ? customDate : new Date()
    const now = new Date()

    const doc: Omit<ReviewDoc, '_id'> = {
      targetType,
      targetId,
      rating,
      comment: cleanedComment,
      userId: null,
      displayName: cleanedName,
      avatarUrl: cleanedAvatar,
      isAdminCreated: true,
      isFeatured: !!isFeatured,
      isVerified: !!isVerified,
      createdAt: validDate,
      updatedAt: now,
      createdByAdminId: session.userId,
    }

    const collection = db.collection<ReviewDoc>(REVIEWS_COLLECTION)
    const inserted = await collection.insertOne(doc as any)

    return NextResponse.json({
      success: true,
      review: toPublicReview({ ...doc, _id: inserted.insertedId } as ReviewDoc),
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/reviews error:', error)
    return NextResponse.json({ error: 'Erro ao criar avaliação manual' }, { status: 500 })
  }
}
