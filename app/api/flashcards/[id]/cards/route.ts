import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { FlashcardCard } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const cardsCollection = db.collection<FlashcardCard>('flashcardCards')

    const cards = await cardsCollection
      .find({ deckId: params.id })
      .sort({ index: 1 })
      .toArray()

    return NextResponse.json({ cards })
  } catch (error) {
    console.error('Erro ao obter cartões do flashcard:', error)
    return NextResponse.json({ error: 'Erro ao carregar cartões' }, { status: 500 })
  }
}
