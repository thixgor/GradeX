import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { FLASHCARD_MANUAL_COLLECTIONS, isValidObjectId } from '@/lib/flashcard-manual'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const db = await getDb()
    const decks = db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks)
    const deck = isValidObjectId(params.id)
      ? await decks.findOne({ _id: new ObjectId(params.id) })
      : await decks.findOne({ slug: params.id })
    if (!deck) return NextResponse.json({ error: 'Deck não encontrado' }, { status: 404 })

    const isAdmin = session.role === 'admin'
    if (deck.ownerId !== session.userId && !isAdmin) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { orderedIds } = await request.json()
    if (!Array.isArray(orderedIds)) return NextResponse.json({ error: 'orderedIds inválido' }, { status: 400 })

    const cards = db.collection(FLASHCARD_MANUAL_COLLECTIONS.cards)
    await Promise.all(
      orderedIds.map((id: string, index: number) => {
        if (!isValidObjectId(id)) return null
        return cards.updateOne(
          { _id: new ObjectId(id), deckId: String(deck._id) },
          { $set: { index, updatedAt: new Date() } }
        )
      })
    )
    await decks.updateOne({ _id: deck._id }, { $set: { updatedAt: new Date() } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao reordenar cards:', error)
    return NextResponse.json({ error: error.message || 'Erro ao reordenar' }, { status: 500 })
  }
}
