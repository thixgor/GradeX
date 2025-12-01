import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { FlashcardDeck } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const db = await getDb()
    const decksCollection = db.collection<FlashcardDeck>('flashcardDecks')

    const deck = await decksCollection.findOne({ _id: new ObjectId(params.id), userId: session.userId })
    if (!deck) {
      return NextResponse.json({ error: 'Flashcard não encontrado' }, { status: 404 })
    }

    await decksCollection.updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          status: 'concluido',
          updatedAt: new Date(),
        },
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao arquivar flashcard:', error)
    return NextResponse.json({ error: 'Erro ao arquivar flashcard' }, { status: 500 })
  }
}
