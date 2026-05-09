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
import type { FlashcardManualCard, FlashcardManualDeck } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function loadDeck(db: any, idOrSlug: string): Promise<(FlashcardManualDeck & { _id: ObjectId }) | null> {
  if (isValidObjectId(idOrSlug)) {
    const byId = await db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks).findOne({ _id: new ObjectId(idOrSlug) })
    if (byId) return byId
  }
  return await db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks).findOne({ slug: idOrSlug })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string; cardId: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    if (!isValidObjectId(params.cardId)) return NextResponse.json({ error: 'Card inválido' }, { status: 400 })

    const db = await getDb()
    const deck = await loadDeck(db, params.id)
    if (!deck) return NextResponse.json({ error: 'Deck não encontrado' }, { status: 404 })

    const isAdmin = session.role === 'admin'
    if (deck.ownerId !== session.userId && !isAdmin) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const updates: any = { updatedAt: new Date() }
    if (body.kind === 'standard' || body.kind === 'hidden_word') updates.kind = body.kind
    if (body.front) updates.front = sanitizeCardSide(body.front)
    if (body.back) updates.back = sanitizeCardSide(body.back)
    if (body.hiddenWord !== undefined) updates.hiddenWord = body.hiddenWord ? sanitizeHiddenWord(body.hiddenWord) : null
    if (body.comment !== undefined) updates.comment = body.comment ? String(body.comment).slice(0, 2500) : ''

    const cardId = new ObjectId(params.cardId)
    await db.collection<FlashcardManualCard>(FLASHCARD_MANUAL_COLLECTIONS.cards).updateOne(
      { _id: cardId, deckId: String(deck._id) },
      { $set: updates }
    )
    const updated = await db.collection<FlashcardManualCard>(FLASHCARD_MANUAL_COLLECTIONS.cards).findOne({ _id: cardId })
    return NextResponse.json({ card: updated ? normalizeCardForResponse(updated) : null })
  } catch (error: any) {
    console.error('Erro ao atualizar card:', error)
    return NextResponse.json({ error: error.message || 'Erro ao atualizar card' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; cardId: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    if (!isValidObjectId(params.cardId)) return NextResponse.json({ error: 'Card inválido' }, { status: 400 })

    const db = await getDb()
    const deck = await loadDeck(db, params.id)
    if (!deck) return NextResponse.json({ error: 'Deck não encontrado' }, { status: 404 })

    const isAdmin = session.role === 'admin'
    if (deck.ownerId !== session.userId && !isAdmin) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const cardId = new ObjectId(params.cardId)
    const card = await db.collection<FlashcardManualCard>(FLASHCARD_MANUAL_COLLECTIONS.cards).findOne({ _id: cardId, deckId: String(deck._id) })
    if (!card) return NextResponse.json({ error: 'Card não encontrado' }, { status: 404 })

    await db.collection<FlashcardManualCard>(FLASHCARD_MANUAL_COLLECTIONS.cards).deleteOne({ _id: cardId })
    // Reordenar índices
    await db.collection<FlashcardManualCard>(FLASHCARD_MANUAL_COLLECTIONS.cards).updateMany(
      { deckId: String(deck._id), index: { $gt: card.index } },
      { $inc: { index: -1 } }
    )
    await db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks).updateOne(
      { _id: deck._id },
      { $inc: { cardCount: -1 }, $set: { updatedAt: new Date() } }
    )
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao deletar card:', error)
    return NextResponse.json({ error: error.message || 'Erro ao deletar card' }, { status: 500 })
  }
}
