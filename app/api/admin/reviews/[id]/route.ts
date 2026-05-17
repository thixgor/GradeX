import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { isValidObjectId } from '@/lib/api-security'
import {
  REVIEWS_COLLECTION,
  ReviewDoc,
  isValidRating,
  sanitizeAvatarUrl,
  sanitizeDisplayName,
  sanitizeReviewComment,
  toPublicReview,
} from '@/lib/reviews'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function ensureAdmin() {
  const session = await getSession()
  if (!session) return { error: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) }
  if (session.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) }
  }
  return { session }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAdmin()
  if ('error' in auth) return auth.error

  try {
    const { id } = params
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }
    const {
      rating,
      comment,
      displayName,
      avatarUrl,
      createdAt,
      isFeatured,
      isVerified,
    } = body as Record<string, unknown>

    const db = await getDb()
    const collection = db.collection<ReviewDoc>(REVIEWS_COLLECTION)
    const existing = await collection.findOne({ _id: new ObjectId(id) })
    if (!existing) {
      return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 })
    }

    const update: Record<string, any> = { updatedAt: new Date() }

    if (rating !== undefined) {
      if (!isValidRating(rating)) {
        return NextResponse.json({ error: 'Nota inválida' }, { status: 400 })
      }
      update.rating = rating
    }
    if (comment !== undefined) {
      update.comment = sanitizeReviewComment(comment)
    }
    if (displayName !== undefined) {
      // Edição de displayName só faz sentido para avaliações criadas pelo admin
      if (!existing.isAdminCreated) {
        return NextResponse.json(
          { error: 'Não é permitido alterar o autor de uma avaliação real' },
          { status: 403 },
        )
      }
      update.displayName = sanitizeDisplayName(displayName, existing.displayName)
    }
    if (avatarUrl !== undefined) {
      if (!existing.isAdminCreated) {
        return NextResponse.json(
          { error: 'Não é permitido adicionar foto a avaliação de usuário' },
          { status: 403 },
        )
      }
      update.avatarUrl = sanitizeAvatarUrl(avatarUrl)
    }
    if (createdAt !== undefined) {
      if (!existing.isAdminCreated) {
        return NextResponse.json(
          { error: 'Não é permitido alterar a data de avaliação real' },
          { status: 403 },
        )
      }
      if (typeof createdAt === 'string') {
        const d = new Date(createdAt)
        if (!isNaN(d.getTime())) update.createdAt = d
      }
    }
    if (isFeatured !== undefined) update.isFeatured = !!isFeatured
    if (isVerified !== undefined) update.isVerified = !!isVerified

    await collection.updateOne({ _id: existing._id }, { $set: update })
    const merged = { ...existing, ...update } as ReviewDoc
    return NextResponse.json({
      success: true,
      review: { ...toPublicReview(merged), displayName: merged.displayName },
    })
  } catch (error) {
    console.error('PATCH /api/admin/reviews/[id] error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar avaliação' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAdmin()
  if ('error' in auth) return auth.error

  try {
    const { id } = params
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    const db = await getDb()
    const result = await db.collection(REVIEWS_COLLECTION).deleteOne({ _id: new ObjectId(id) })
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/reviews/[id] error:', error)
    return NextResponse.json({ error: 'Erro ao excluir avaliação' }, { status: 500 })
  }
}
