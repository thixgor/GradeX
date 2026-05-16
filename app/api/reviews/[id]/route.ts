import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { checkRateLimitSync, isValidObjectId } from '@/lib/api-security'
import {
  REVIEWS_COLLECTION,
  ReviewDoc,
  getTargetReviewsLocked,
  isValidRating,
  sanitizeReviewComment,
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

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id } = params
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const ip = getClientIp(request)
    const rl = checkRateLimitSync(ip, 'reviews:update', { limit: 10, windowMs: 60_000 })
    if (!rl.success) {
      return NextResponse.json({ error: 'Muitas requisições. Aguarde.' }, { status: 429 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }
    const { rating, comment } = body as { rating?: unknown; comment?: unknown }
    if (!isValidRating(rating)) {
      return NextResponse.json({ error: 'Nota inválida' }, { status: 400 })
    }
    const safeComment = sanitizeReviewComment(comment)

    const db = await getDb()
    const collection = db.collection<ReviewDoc>(REVIEWS_COLLECTION)
    const existing = await collection.findOne({ _id: new ObjectId(id) })
    if (!existing) {
      return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 })
    }
    if (existing.isAdminCreated || existing.userId !== session.userId) {
      // Apenas o dono comum pode usar PATCH; admin usa /api/admin/reviews/[id]
      return NextResponse.json({ error: 'Sem permissão para editar' }, { status: 403 })
    }

    const target = await getTargetReviewsLocked(db, existing.targetType, existing.targetId)
    if (target.locked) {
      return NextResponse.json({ error: 'Avaliações desativadas para este item' }, { status: 423 })
    }

    const updatedAt = new Date()
    await collection.updateOne(
      { _id: existing._id },
      { $set: { rating, comment: safeComment, updatedAt } },
    )
    const updated = { ...existing, rating, comment: safeComment, updatedAt } as ReviewDoc
    return NextResponse.json({ success: true, review: toPublicReview(updated) })
  } catch (error) {
    console.error('PATCH /api/reviews/[id] error:', error)
    return NextResponse.json({ error: 'Erro ao editar avaliação' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id } = params
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const ip = getClientIp(request)
    const rl = checkRateLimitSync(ip, 'reviews:delete', { limit: 10, windowMs: 60_000 })
    if (!rl.success) {
      return NextResponse.json({ error: 'Muitas requisições. Aguarde.' }, { status: 429 })
    }

    const db = await getDb()
    const collection = db.collection<ReviewDoc>(REVIEWS_COLLECTION)
    const existing = await collection.findOne({ _id: new ObjectId(id) })
    if (!existing) {
      return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 })
    }

    const isAdmin = session.role === 'admin'
    const isOwner = existing.userId === session.userId && !existing.isAdminCreated
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Sem permissão para excluir' }, { status: 403 })
    }

    await collection.deleteOne({ _id: existing._id })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/reviews/[id] error:', error)
    return NextResponse.json({ error: 'Erro ao excluir avaliação' }, { status: 500 })
  }
}
