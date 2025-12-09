import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { FlashcardCard } from '@/lib/types'

export const dynamic = 'force-dynamic'

/**
 * POST - Salva um cartão individual em um deck de flashcards
 * Usado para salvar cartões um por um durante a geração em lote
 * para evitar perda de dados se a IA falhar no meio do processo
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { deckId, card } = await request.json()

    if (!deckId || !card) {
      return NextResponse.json(
        { error: 'deckId e card são obrigatórios' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const decksCollection = db.collection('flashcardDecks')
    const cardsCollection = db.collection<FlashcardCard>('flashcardCards')

    // Validar se o deck existe e pertence ao usuário
    const deck = await decksCollection.findOne({
      _id: new ObjectId(deckId),
      userId: session.userId,
    })

    if (!deck) {
      return NextResponse.json(
        { error: 'Deck não encontrado ou sem permissão' },
        { status: 404 }
      )
    }

    // Salvar o cartão
    const cardToInsert: FlashcardCard = {
      ...card,
      deckId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await cardsCollection.insertOne(cardToInsert)

    if (!result.insertedId) {
      return NextResponse.json(
        { error: 'Falha ao salvar cartão' },
        { status: 500 }
      )
    }

    // Atualizar o contador de cartões gerados no deck
    await decksCollection.updateOne(
      { _id: new ObjectId(deckId) },
      {
        $inc: { cardsGenerated: 1 },
        $set: { updatedAt: new Date() },
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Cartão salvo com sucesso',
      cardId: result.insertedId,
    })
  } catch (error: any) {
    console.error('Erro ao salvar cartão:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao salvar cartão' },
      { status: 500 }
    )
  }
}
