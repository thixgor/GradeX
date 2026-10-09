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

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Flashcard não encontrado' }, { status: 404 })
    }

    const db = await getDb()
    const cardsCollection = db.collection<FlashcardCard>('flashcardCards')

    // O baralho gerado por IA é de quem o gerou. Sem conferir o dono, qualquer
    // conta logada lia os cartões de qualquer outra sabendo o id do deck — a
    // mesma regra que o DELETE de `../route.ts` já aplica. As duas consultas
    // são independentes e saem juntas; os cartões só são devolvidos se o dono
    // conferir.
    const [deck, cards] = await Promise.all([
      db.collection('flashcardDecks').findOne(
        {
          _id: new ObjectId(params.id),
          ...(session.role === 'admin' ? {} : { userId: session.userId }),
        },
        { projection: { _id: 1 } },
      ),
      cardsCollection.find({ deckId: params.id }).sort({ index: 1 }).toArray(),
    ])

    if (!deck) {
      return NextResponse.json({ error: 'Flashcard não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ cards })
  } catch (error) {
    console.error('Erro ao obter cartões do flashcard:', error)
    return NextResponse.json({ error: 'Erro ao carregar cartões' }, { status: 500 })
  }
}
