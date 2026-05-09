import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { FLASHCARD_MANUAL_COLLECTIONS } from '@/lib/flashcard-manual'

export const dynamic = 'force-dynamic'

// GET /api/flashcards/manual/shares?direction=incoming|outgoing
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const direction = searchParams.get('direction') || 'incoming'

    const db = await getDb()
    const filter: any = direction === 'outgoing' ? { fromUserId: session.userId } : { toUserId: session.userId }

    const shares = await db
      .collection(FLASHCARD_MANUAL_COLLECTIONS.shares)
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray()

    // Enriquecer com dados do deck
    const deckIds = [...new Set(shares.map((s: any) => s.deckId))]
    const decks = deckIds.length
      ? await db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks)
          .find({ _id: { $in: deckIds.map((id: any) => {
            try { return new (require('mongodb').ObjectId)(id) } catch { return null }
          }).filter(Boolean) } })
          .project({ title: 1, slug: 1, coverImage: 1, ownerName: 1, cardCount: 1 })
          .toArray()
      : []
    const deckMap = new Map(decks.map((d: any) => [String(d._id), d]))

    const enriched = shares.map((s: any) => ({
      ...s,
      _id: String(s._id),
      deck: deckMap.get(s.deckId) ? { ...deckMap.get(s.deckId), _id: String((deckMap.get(s.deckId) as any)._id) } : null,
    }))

    return NextResponse.json({ shares: enriched })
  } catch (error) {
    console.error('Erro ao listar compartilhamentos:', error)
    return NextResponse.json({ error: 'Erro ao listar compartilhamentos' }, { status: 500 })
  }
}
