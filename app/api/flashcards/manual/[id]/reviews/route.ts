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
  clampRetention,
  getReviewFeedbackMessage,
  normalizeSpacedProgressForResponse,
  normalizeSpacedRating,
  toLegacyRating,
  type SpacedReviewResult,
} from '@/lib/flashcard-spaced-repetition'
import type { FlashcardManualDeck, FlashcardSpacedProgress, FlashcardSpacedRating } from '@/lib/types'

export const dynamic = 'force-dynamic'

/**
 * Janela aceita para `reviewedAt` enviado pelo cliente. A avaliação é gravada
 * em segundo plano e pode ficar na fila do navegador (aba fechada, celular sem
 * sinal); o que não pode é uma data inventada reescrever a agenda do usuário.
 */
const MAX_BACKLOG_MS = 7 * 24 * 60 * 60 * 1000

interface ParsedReview {
  cardId: string
  rating: FlashcardSpacedRating
  reviewedAt: Date
  retention: number
}

async function loadDeck(db: any, idOrSlug: string): Promise<(FlashcardManualDeck & { _id: ObjectId }) | null> {
  if (isValidObjectId(idOrSlug)) {
    const byId = await db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks).findOne({ _id: new ObjectId(idOrSlug) })
    if (byId) return byId
  }
  return db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks).findOne({ slug: idOrSlug })
}

/** Aceita tanto uma avaliação solta quanto o lote que a fila do cliente envia. */
function parseReviews(body: any, now: Date): ParsedReview[] {
  const raw = Array.isArray(body?.reviews) ? body.reviews : [body]
  const parsed: ParsedReview[] = []

  for (const entry of raw.slice(0, 200)) {
    const cardId = String(entry?.cardId || '')
    const rating = normalizeSpacedRating(entry?.rating)
    if (!isValidObjectId(cardId) || !rating) continue

    const sent = entry?.reviewedAt ? new Date(entry.reviewedAt) : now
    const reviewedAt = Number.isNaN(sent.getTime())
      ? now
      : new Date(Math.min(Math.max(sent.getTime(), now.getTime() - MAX_BACKLOG_MS), now.getTime()))

    parsed.push({
      cardId,
      rating,
      reviewedAt,
      retention: clampRetention(entry?.retention ?? body?.retention),
    })
  }

  // Ordem cronológica: duas avaliações do mesmo card precisam ser aplicadas na
  // sequência em que aconteceram, senão a segunda agenda a partir do estado errado.
  return parsed.sort((a, b) => a.reviewedAt.getTime() - b.reviewedAt.getTime())
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

    const now = new Date()
    const body = await request.json()
    const reviews = parseReviews(body, now)
    if (reviews.length === 0) {
      return NextResponse.json({ error: 'Avaliação inválida' }, { status: 400 })
    }

    const deckId = String(deck._id)
    const cardDocs = await db
      .collection(FLASHCARD_MANUAL_COLLECTIONS.cards)
      .find({ _id: { $in: reviews.map(r => new ObjectId(r.cardId)) }, deckId })
      .project({ _id: 1 })
      .toArray()
    const validCardIds = new Set(cardDocs.map((card: any) => String(card._id)))
    const applicable = reviews.filter(review => validCardIds.has(review.cardId))
    if (applicable.length === 0) {
      return NextResponse.json({ error: 'Card não encontrado neste deck' }, { status: 404 })
    }

    const progressCollection = db.collection<FlashcardSpacedProgress>(FLASHCARD_SPACED_PROGRESS_COLLECTION)
    // Índices idempotentes: garantem a unicidade por (usuário, card) e a busca
    // por vencimento que alimenta a fila e os contadores de "revisar hoje".
    await Promise.all([
      progressCollection.createIndex({ userId: 1, cardId: 1 }, { unique: true }),
      progressCollection.createIndex({ userId: 1, deckId: 1, nextReviewAt: 1 }),
      progressCollection.createIndex({ userId: 1, nextReviewAt: 1 }),
    ]).catch(() => {})

    const previousDocs = await progressCollection
      .find({ userId: session.userId, cardId: { $in: applicable.map(r => r.cardId) } })
      .toArray()
    const previousByCardId = new Map(previousDocs.map(doc => [doc.cardId, doc]))

    const results: Array<{ cardId: string; result: SpacedReviewResult }> = []
    let duplicates = 0

    for (const review of applicable) {
      const previous = previousByCardId.get(review.cardId) || null

      // Reenvio da mesma avaliação (a fila do cliente tentou de novo depois de
      // uma resposta perdida, ou o `sendBeacon` correu junto com o POST):
      // aplicar duas vezes empurraria o card para uma agenda que ele não merece.
      if (previous?.lastReviewedAt && new Date(previous.lastReviewedAt).getTime() === review.reviewedAt.getTime()) {
        duplicates += 1
        continue
      }

      const next = calculateNextSpacedReview(previous, review.rating, review.reviewedAt, {
        retention: review.retention,
        seed: review.cardId,
      })

      const document = {
        userId: session.userId,
        cardId: review.cardId,
        deckId,
        rating: next.rating,
        reviewCount: next.reviewCount,
        correctStreak: next.correctStreak,
        easeFactor: next.easeFactor,
        intervalDays: next.intervalDays,
        stability: next.stability,
        difficulty: next.difficulty,
        state: next.state,
        learningStep: next.learningStep,
        lapses: next.lapses,
        retention: next.retention,
        nextReviewAt: next.nextReviewAt,
        lastReviewedAt: next.lastReviewedAt,
        updatedAt: now,
      }

      await progressCollection.updateOne(
        { userId: session.userId, cardId: review.cardId },
        { $set: document, $setOnInsert: { createdAt: now } },
        { upsert: true }
      )

      // O próximo item do lote que tocar este card precisa enxergar o estado
      // recém-gravado — sem isso, duas avaliações seguidas partiriam da mesma base.
      previousByCardId.set(review.cardId, { ...(previous || {}), ...document } as any)
      results.push({ cardId: review.cardId, result: next })
    }

    if (results.length === 0) {
      // Tudo já estava gravado: responde sucesso para a fila do cliente poder
      // descartar o lote em vez de ficar tentando para sempre.
      return NextResponse.json({ success: true, applied: 0, duplicates, progresses: [] })
    }

    // Uma sessão por requisição (e não uma por card): o lote da fila é uma
    // sessão de estudo só, e era isso que enchia a coleção de documentos soltos.
    await db.collection(FLASHCARD_MANUAL_COLLECTIONS.sessions).insertOne({
      deckId,
      userId: session.userId,
      startedAt: results[0].result.lastReviewedAt,
      finishedAt: results[results.length - 1].result.lastReviewedAt,
      entries: results.map(({ cardId, result }) => ({
        cardId,
        rating: toLegacyRating(result.rating),
        completedAt: result.lastReviewedAt,
      })),
      mode: 'spaced_repetition',
    })

    const saved = await progressCollection
      .find({ userId: session.userId, cardId: { $in: results.map(r => r.cardId) } })
      .toArray()
    const savedByCardId = new Map(saved.map(doc => [doc.cardId, normalizeSpacedProgressForResponse(doc)]))
    const last = results[results.length - 1]

    return NextResponse.json({
      success: true,
      applied: results.length,
      duplicates,
      ignored: reviews.length - applicable.length,
      // Campos no singular: é o que a avaliação avulsa sempre recebeu.
      feedbackMessage: getReviewFeedbackMessage(last.result),
      nextReviewAt: last.result.nextReviewAt.toISOString(),
      intervalDays: last.result.intervalDays,
      progress: savedByCardId.get(last.cardId) || null,
      // E o lote inteiro, para o cliente reconciliar o que enviou.
      progresses: results.map(({ cardId }) => savedByCardId.get(cardId)).filter(Boolean),
    })
  } catch (error: any) {
    console.error('Erro ao registrar revisão espaçada:', error)
    return NextResponse.json({ error: error.message || 'Erro ao registrar revisão' }, { status: 500 })
  }
}
