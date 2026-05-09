import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { FLASHCARD_MANUAL_COLLECTIONS, isValidObjectId, getUserGroups, resolveDeckAccess } from '@/lib/flashcard-manual'
import type { FlashcardManualSession } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function loadDeck(db: any, idOrSlug: string) {
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
    const deck = await loadDeck(db, params.id)
    if (!deck) return NextResponse.json({ error: 'Deck não encontrado' }, { status: 404 })

    const userDoc = await db.collection('users').findOne(
      { _id: new ObjectId(session.userId) },
      { projection: { accountType: 1, secondaryRole: 1, email: 1 } }
    )
    const userGroups = getUserGroups(userDoc as any)
    const access = await resolveDeckAccess({
      db,
      deck,
      userId: session.userId,
      userEmail: userDoc?.email || session.email,
      userGroups,
      isAdmin: session.role === 'admin',
    })
    if (!access.hasAccess) return NextResponse.json({ error: 'Sem acesso' }, { status: 403 })

    const body = await request.json()
    const entries = Array.isArray(body.entries) ? body.entries : []

    const sessionDoc: FlashcardManualSession = {
      deckId: String(deck._id),
      userId: session.userId,
      startedAt: body.startedAt ? new Date(body.startedAt) : new Date(),
      finishedAt: new Date(),
      entries: entries
        .filter((e: any) => e && e.cardId && ['facil', 'equilibrado', 'porrada'].includes(e.rating))
        .slice(0, 1000)
        .map((e: any) => ({
          cardId: String(e.cardId),
          rating: e.rating,
          completedAt: e.completedAt ? new Date(e.completedAt) : new Date(),
        })),
    }

    await db.collection(FLASHCARD_MANUAL_COLLECTIONS.sessions).insertOne(sessionDoc as any)
    await db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks).updateOne(
      { _id: deck._id },
      { $inc: { studyCount: 1 } }
    )
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao salvar sessão:', error)
    return NextResponse.json({ error: error.message || 'Erro ao salvar sessão' }, { status: 500 })
  }
}
