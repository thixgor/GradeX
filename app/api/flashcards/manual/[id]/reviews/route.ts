import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import {
  FLASHCARD_MANUAL_COLLECTIONS,
  getUserGroups,
  isValidObjectId,
  resolveDeckAccess,
} from '@/lib/flashcard-manual'
import {
  FLASHCARD_SPACED_PROGRESS_COLLECTION,
  calculateNextSpacedReview,
  getReviewFeedbackMessage,
  normalizeSpacedProgressForResponse,
  normalizeSpacedRating,
  toLegacyRating,
} from '@/lib/flashcard-spaced-repetition'
import type { FlashcardManualDeck, FlashcardSpacedProgress } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function loadDeck(db: any, idOrSlug: string): Promise<(FlashcardManualDeck & { _id: ObjectId }) | null> {
  if (isValidObjectId(idOrSlug)) {
    const byId = await db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks).findOne({ _id: new ObjectId(idOrSlug) })
    if (byId) return byId
  }
  return db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks).findOne({ slug: idOrSlug })
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const db = await getDb()
    const deck = await loadDeck(db, params.id)
    if (!deck) return NextResponse.json({ error: 'Deck não encontrado' }, { status: 404 })

    const userDoc = await db.collection('users').findOne(
      { _id: new ObjectId(session.userId) },
      { projection: { accountType: 1, secondaryRole: 1, email: 1 } }
    )
    const access = await resolveDeckAccess({
      db,
      deck,
      userId: session.userId,
      userEmail: userDoc?.email || session.email,
      userGroups: getUserGroups(userDoc as any),
      isAdmin: session.role === 'admin',
    })
    if (!access.hasAccess) return NextResponse.json({ error: 'Sem acesso' }, { status: 403 })

    const body = await request.json()
    const cardId = String(body?.cardId || '')
    const rating = normalizeSpacedRating(body?.rating)
    if (!isValidObjectId(cardId) || !rating) {
      return NextResponse.json({ error: 'Avaliação inválida' }, { status: 400 })
    }

    const card = await db.collection(FLASHCARD_MANUAL_COLLECTIONS.cards).findOne({
      _id: new ObjectId(cardId),
      deckId: String(deck._id),
    })
    if (!card) return NextResponse.json({ error: 'Card não encontrado neste deck' }, { status: 404 })

    const progressCollection = db.collection<FlashcardSpacedProgress>(FLASHCARD_SPACED_PROGRESS_COLLECTION)
    await progressCollection.createIndex({ userId: 1, cardId: 1 }, { unique: true })
    await progressCollection.createIndex({ userId: 1, deckId: 1, nextReviewAt: 1 })

    const now = new Date()
    const previous = await progressCollection.findOne({ userId: session.userId, cardId })
    const next = calculateNextSpacedReview(previous, rating, now)

    await progressCollection.updateOne(
      { userId: session.userId, cardId },
      {
        $set: {
          userId: session.userId,
          cardId,
          deckId: String(deck._id),
          rating: next.rating,
          reviewCount: next.reviewCount,
          correctStreak: next.correctStreak,
          easeFactor: next.easeFactor,
          intervalDays: next.intervalDays,
          nextReviewAt: next.nextReviewAt,
          lastReviewedAt: next.lastReviewedAt,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    )

    const saved = await progressCollection.findOne({ userId: session.userId, cardId })

    await db.collection(FLASHCARD_MANUAL_COLLECTIONS.sessions).insertOne({
      deckId: String(deck._id),
      userId: session.userId,
      startedAt: now,
      finishedAt: now,
      entries: [{
        cardId,
        rating: toLegacyRating(rating),
        completedAt: now,
      }],
      mode: 'spaced_repetition',
    })

    return NextResponse.json({
      success: true,
      feedbackMessage: getReviewFeedbackMessage(next),
      nextReviewAt: next.nextReviewAt.toISOString(),
      intervalDays: next.intervalDays,
      progress: saved ? normalizeSpacedProgressForResponse(saved) : null,
    })
  } catch (error: any) {
    console.error('Erro ao registrar revisão espaçada:', error)
    return NextResponse.json({ error: error.message || 'Erro ao registrar revisão' }, { status: 500 })
  }
}
