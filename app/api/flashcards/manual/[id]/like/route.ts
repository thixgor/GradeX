import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { FLASHCARD_MANUAL_COLLECTIONS, isValidObjectId } from '@/lib/flashcard-manual'

export const dynamic = 'force-dynamic'

async function findDeck(db: any, idOrSlug: string) {
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
    const deck = await findDeck(db, params.id)
    if (!deck) return NextResponse.json({ error: 'Deck não encontrado' }, { status: 404 })

    const deckId = String(deck._id)
    const likes = db.collection(FLASHCARD_MANUAL_COLLECTIONS.likes)
    const existing = await likes.findOne({ deckId, userId: session.userId })
    if (existing) {
      return NextResponse.json({ liked: true, likeCount: deck.likeCount || 0 })
    }
    await likes.insertOne({ deckId, userId: session.userId, createdAt: new Date() })
    const result = await db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks).findOneAndUpdate(
      { _id: deck._id },
      { $inc: { likeCount: 1 } },
      { returnDocument: 'after' }
    )
    return NextResponse.json({ liked: true, likeCount: (result as any)?.value?.likeCount ?? (deck.likeCount || 0) + 1 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao curtir' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    const db = await getDb()
    const deck = await findDeck(db, params.id)
    if (!deck) return NextResponse.json({ error: 'Deck não encontrado' }, { status: 404 })
    const deckId = String(deck._id)
    const likes = db.collection(FLASHCARD_MANUAL_COLLECTIONS.likes)
    const removed = await likes.deleteOne({ deckId, userId: session.userId })
    if (removed.deletedCount && removed.deletedCount > 0) {
      const result = await db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks).findOneAndUpdate(
        { _id: deck._id, likeCount: { $gt: 0 } },
        { $inc: { likeCount: -1 } },
        { returnDocument: 'after' }
      )
      return NextResponse.json({ liked: false, likeCount: (result as any)?.value?.likeCount ?? Math.max(0, (deck.likeCount || 0) - 1) })
    }
    return NextResponse.json({ liked: false, likeCount: deck.likeCount || 0 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao remover curtida' }, { status: 500 })
  }
}
