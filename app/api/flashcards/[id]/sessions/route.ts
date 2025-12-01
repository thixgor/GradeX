import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { FlashcardDeck, FlashcardSession, FlashcardSessionEntry, FlashcardCard } from '@/lib/types'

export const dynamic = 'force-dynamic'

function summarizeObjectives(entries: FlashcardSessionEntry[], cards: any[]) {
  const counter: Record<string, number> = {}
  const objectiveNames: Record<string, string> = {}
  
  // Mapear IDs de objetivos para seus nomes
  for (const card of cards) {
    if (card.objectives) {
      for (const obj of card.objectives) {
        objectiveNames[obj.id] = obj.text
      }
    }
  }
  
  // Contar frequência dos objetivos
  for (const entry of entries) {
    for (const objectiveId of entry.objectivesStruggled || []) {
      counter[objectiveId] = (counter[objectiveId] || 0) + 1
    }
  }
  
  // Retorna todos os objetivos com seus nomes, ordenados por frequência
  return Object.entries(counter)
    .sort((a, b) => b[1] - a[1])
    .map(([objectiveId]) => objectiveNames[objectiveId] || objectiveId)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const deckId = params.id
    const { entries } = await request.json()
    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: 'Envie pelo menos um cartão' }, { status: 400 })
    }

    const db = await getDb()
    const decksCollection = db.collection<FlashcardDeck>('flashcardDecks')
    const sessionsCollection = db.collection<FlashcardSession>('flashcardSessions')
    const cardsCollection = db.collection<FlashcardCard>('flashcardCards')

    const deck = await decksCollection.findOne({ _id: new ObjectId(deckId), userId: session.userId })
    if (!deck) {
      return NextResponse.json({ error: 'Flashcard não encontrado' }, { status: 404 })
    }

    // Validar cards pertencem ao deck
    const cardIds = entries.map((entry: FlashcardSessionEntry) => entry.cardId)
    const cards = await cardsCollection
      .find({ deckId, id: { $in: cardIds } })
      .toArray()

    if (cards.length !== cardIds.length) {
      return NextResponse.json({ error: 'Cartões inválidos enviados' }, { status: 400 })
    }

    const sanitizedEntries: FlashcardSessionEntry[] = entries.map((entry: FlashcardSessionEntry) => ({
      cardId: entry.cardId,
      difficulty: entry.difficulty,
      objectivesStruggled: entry.objectivesStruggled || [],
      completedAt: new Date(entry.completedAt || Date.now()),
    }))

    const dominantObjectives = summarizeObjectives(sanitizedEntries, cards)

    const sessionDoc: FlashcardSession = {
      deckId,
      userId: session.userId,
      startedAt: sanitizedEntries[0].completedAt,
      finishedAt: sanitizedEntries[sanitizedEntries.length - 1].completedAt,
      entries: sanitizedEntries,
      dominantObjectives,
    }

    await sessionsCollection.insertOne(sessionDoc)

    await decksCollection.updateOne(
      { _id: new ObjectId(deckId) },
      {
        $set: {
          status: 'concluido',
          updatedAt: new Date(),
        }
      }
    )

    return NextResponse.json({ success: true, dominantObjectives })
  } catch (error) {
    console.error('Erro ao registrar sessão de flashcards:', error)
    return NextResponse.json({ error: 'Erro ao registrar sessão' }, { status: 500 })
  }
}

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
    const sessionsCollection = db.collection<FlashcardSession>('flashcardSessions')

    const sessionDocs = await sessionsCollection
      .find({ deckId: params.id, userId: session.userId })
      .sort({ finishedAt: -1 })
      .toArray()

    return NextResponse.json({ sessions: sessionDocs })
  } catch (error) {
    console.error('Erro ao listar sessões de flashcards:', error)
    return NextResponse.json({ error: 'Erro ao listar sessões' }, { status: 500 })
  }
}
