import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import {
  FLASHCARD_MANUAL_COLLECTIONS,
  isValidObjectId,
  normalizeCardForResponse,
  sanitizeCardSide,
  sanitizeHiddenWord,
} from '@/lib/flashcard-manual'
import { getFlashcardManualLimits } from '@/lib/flashcard-limits'
import type { FlashcardManualCard, FlashcardManualDeck } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function loadDeck(db: any, idOrSlug: string): Promise<(FlashcardManualDeck & { _id: ObjectId }) | null> {
  if (isValidObjectId(idOrSlug)) {
    const byId = await db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks).findOne({ _id: new ObjectId(idOrSlug) })
    if (byId) return byId
  }
  return await db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks).findOne({ slug: idOrSlug })
}

function sanitizeCardPayload(body: any) {
  const kind: 'standard' | 'hidden_word' = body?.kind === 'hidden_word' ? 'hidden_word' : 'standard'
  return {
    kind,
    front: sanitizeCardSide(body?.front),
    back: sanitizeCardSide(body?.back),
    hiddenWord: kind === 'hidden_word' ? sanitizeHiddenWord(body?.hiddenWord) : undefined,
    comment: body?.comment ? String(body.comment).slice(0, 2500) : undefined,
  }
}

// GET — lista cards (apenas dono ou admin; visitantes obtêm via /api/flashcards/manual/[id])
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    const db = await getDb()
    const deck = await loadDeck(db, params.id)
    if (!deck) return NextResponse.json({ error: 'Deck não encontrado' }, { status: 404 })
    const isAdmin = session.role === 'admin'
    if (deck.ownerId !== session.userId && !isAdmin) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }
    const cards = await db
      .collection<FlashcardManualCard>(FLASHCARD_MANUAL_COLLECTIONS.cards)
      .find({ deckId: String(deck._id) })
      .sort({ index: 1 })
      .toArray()
    return NextResponse.json({ cards: cards.map(normalizeCardForResponse) })
  } catch (error) {
    console.error('Erro ao listar cards:', error)
    return NextResponse.json({ error: 'Erro ao listar cards' }, { status: 500 })
  }
}

// POST — adiciona um card ao deck
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    const db = await getDb()
    const deck = await loadDeck(db, params.id)
    if (!deck) return NextResponse.json({ error: 'Deck não encontrado' }, { status: 404 })
    const isAdmin = session.role === 'admin'
    if (deck.ownerId !== session.userId && !isAdmin) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const user = await db.collection('users').findOne({ _id: new ObjectId(session.userId) })
    const limits = getFlashcardManualLimits(user?.accountType, isAdmin)

    const cardsCol = db.collection<FlashcardManualCard>(FLASHCARD_MANUAL_COLLECTIONS.cards)
    const currentCount = await cardsCol.countDocuments({ deckId: String(deck._id) })
    if (currentCount >= limits.cardsPerDeck) {
      return NextResponse.json({
        error: `Limite de cartões por deck atingido (${limits.cardsPerDeck}).`,
        requiresUpgrade: true,
        limit: limits.cardsPerDeck,
      }, { status: 403 })
    }

    const body = await request.json()
    const sanitized = sanitizeCardPayload(body)
    if (!sanitized.front.text && !sanitized.front.image && sanitized.kind !== 'hidden_word') {
      return NextResponse.json({ error: 'Frente do cartão não pode ser vazia' }, { status: 400 })
    }
    if (sanitized.kind === 'hidden_word' && !sanitized.hiddenWord) {
      return NextResponse.json({ error: 'Modo palavra oculta exige frase e palavra' }, { status: 400 })
    }

    const card: FlashcardManualCard = {
      deckId: String(deck._id),
      index: currentCount,
      kind: sanitized.kind,
      front: sanitized.front,
      back: sanitized.back,
      hiddenWord: sanitized.hiddenWord,
      comment: sanitized.comment,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const inserted = await cardsCol.insertOne(card)
    await db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks).updateOne(
      { _id: deck._id },
      { $inc: { cardCount: 1 }, $set: { updatedAt: new Date() } }
    )

    return NextResponse.json({ card: normalizeCardForResponse({ ...card, _id: inserted.insertedId }) }, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar card:', error)
    return NextResponse.json({ error: error.message || 'Erro ao criar card' }, { status: 500 })
  }
}
