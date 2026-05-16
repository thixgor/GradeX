import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { checkRateLimitSync, isValidObjectId } from '@/lib/api-security'
import { hasAccessToTarget } from '@/lib/access'
import {
  REVIEWS_COLLECTION,
  ReviewDoc,
  computeReviewSummary,
  findUserReview,
  getTargetReviewsLocked,
  isValidRating,
  isValidTargetType,
  sanitizeReviewComment,
  sanitizeDisplayName,
  toPublicReview,
} from '@/lib/reviews'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  const real = req.headers.get('x-real-ip')
  return real || 'unknown'
}

const PAGE_SIZE_MAX = 50

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const targetType = url.searchParams.get('targetType')
    const targetId = url.searchParams.get('targetId')
    const cursor = url.searchParams.get('cursor')
    const limit = Math.min(
      PAGE_SIZE_MAX,
      Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10) || 20),
    )

    if (!isValidTargetType(targetType)) {
      return NextResponse.json({ error: 'targetType inválido' }, { status: 400 })
    }
    if (!targetId || !isValidObjectId(targetId)) {
      return NextResponse.json({ error: 'targetId inválido' }, { status: 400 })
    }

    const ip = getClientIp(request)
    const rl = checkRateLimitSync(ip, 'reviews:list', { limit: 120, windowMs: 60_000 })
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente mais tarde.' },
        { status: 429 },
      )
    }

    const session = await getSession()
    const db = await getDb()

    const target = await getTargetReviewsLocked(db, targetType, targetId)
    if (!target.exists) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
    }

    const collection = db.collection<ReviewDoc>(REVIEWS_COLLECTION)

    // Filtro principal — para a primeira página, busca: destaques primeiro, depois cronológico.
    // Para cursor, paginamos por _id de forma estável dentro da ordenação composta.
    const baseFilter: any = { targetType, targetId }
    if (cursor) {
      if (!isValidObjectId(cursor)) {
        return NextResponse.json({ error: 'cursor inválido' }, { status: 400 })
      }
      // Paginação simples baseada em createdAt < cursorTimestamp do cursor _id
      const cursorDoc = await collection.findOne({ _id: new ObjectId(cursor) }, { projection: { createdAt: 1 } })
      if (cursorDoc) {
        baseFilter.$or = [
          { createdAt: { $lt: cursorDoc.createdAt } },
          { createdAt: cursorDoc.createdAt, _id: { $lt: new ObjectId(cursor) } },
        ]
      }
    }

    // Para primeira página: featured DESC, createdAt DESC, _id DESC.
    // Para páginas seguintes: descarta destaques (já vieram na 1ª) e usa só createdAt.
    const sort: any = cursor
      ? { createdAt: -1, _id: -1 }
      : { isFeatured: -1, createdAt: -1, _id: -1 }

    const items = await collection
      .find(baseFilter)
      .sort(sort)
      .limit(limit + 1)
      .toArray()

    const hasMore = items.length > limit
    const pageItems = hasMore ? items.slice(0, limit) : items
    const nextCursor = hasMore ? String(pageItems[pageItems.length - 1]._id) : null

    const [summary, userReview, access] = await Promise.all([
      computeReviewSummary(db, targetType, targetId),
      session ? findUserReview(db, targetType, targetId, session.userId) : Promise.resolve(null),
      session
        ? hasAccessToTarget({ session, targetType, targetId, db })
        : Promise.resolve({ allowed: false, reason: 'not_authenticated' as const, isPurchased: false }),
    ])

    return NextResponse.json({
      reviews: pageItems.map(toPublicReview),
      summary,
      userReview: userReview ? toPublicReview(userReview) : null,
      canReview: !!session && access.allowed && !target.locked,
      hasAccess: access.allowed,
      isAuthenticated: !!session,
      reviewsLocked: target.locked,
      nextCursor,
    })
  } catch (error) {
    console.error('GET /api/reviews error:', error)
    return NextResponse.json({ error: 'Erro ao listar avaliações' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const ip = getClientIp(request)
    const rl = checkRateLimitSync(ip, 'reviews:create', { limit: 5, windowMs: 60_000 })
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Muitas avaliações enviadas. Tente novamente em instantes.' },
        { status: 429 },
      )
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    const { targetType, targetId, rating, comment } = body as {
      targetType?: unknown
      targetId?: unknown
      rating?: unknown
      comment?: unknown
    }

    if (!isValidTargetType(targetType)) {
      return NextResponse.json({ error: 'targetType inválido' }, { status: 400 })
    }
    if (typeof targetId !== 'string' || !isValidObjectId(targetId)) {
      return NextResponse.json({ error: 'targetId inválido' }, { status: 400 })
    }
    if (!isValidRating(rating)) {
      return NextResponse.json({ error: 'Nota deve ser entre 1 e 5' }, { status: 400 })
    }

    const safeComment = sanitizeReviewComment(comment)
    const db = await getDb()

    const target = await getTargetReviewsLocked(db, targetType, targetId)
    if (!target.exists) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
    }
    if (target.locked) {
      return NextResponse.json({ error: 'Avaliações desativadas para este item' }, { status: 423 })
    }

    const access = await hasAccessToTarget({ session, targetType, targetId, db })
    if (!access.allowed) {
      return NextResponse.json(
        { error: 'Você precisa ter acesso a este conteúdo para avaliar' },
        { status: 403 },
      )
    }

    const existing = await findUserReview(db, targetType, targetId, session.userId)
    if (existing) {
      return NextResponse.json(
        { error: 'Você já avaliou este item. Edite sua avaliação existente.' },
        { status: 409 },
      )
    }

    const now = new Date()
    const displayName = sanitizeDisplayName(session.name, 'Usuário')

    const doc: Omit<ReviewDoc, '_id'> = {
      targetType,
      targetId,
      rating,
      comment: safeComment,
      userId: session.userId,
      displayName,
      avatarUrl: null,
      isAdminCreated: false,
      isFeatured: false,
      isVerified: access.isPurchased,
      createdAt: now,
      updatedAt: now,
    }

    const collection = db.collection<ReviewDoc>(REVIEWS_COLLECTION)
    let inserted
    try {
      inserted = await collection.insertOne(doc as any)
    } catch (e: any) {
      if (e?.code === 11000) {
        return NextResponse.json(
          { error: 'Você já avaliou este item' },
          { status: 409 },
        )
      }
      throw e
    }

    return NextResponse.json({
      success: true,
      review: toPublicReview({ ...doc, _id: inserted.insertedId } as ReviewDoc),
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/reviews error:', error)
    return NextResponse.json({ error: 'Erro ao criar avaliação' }, { status: 500 })
  }
}
