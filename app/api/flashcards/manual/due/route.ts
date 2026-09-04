import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { FLASHCARD_SPACED_PROGRESS_COLLECTION } from '@/lib/flashcard-spaced-repetition'

export const dynamic = 'force-dynamic'

/**
 * Quantos cards estão vencidos em cada deck do usuário.
 *
 * A repetição espaçada só vale a pena se a pessoa souber que tem revisão para
 * fazer ANTES de abrir o deck — por isso este contador alimenta o aviso
 * "revisar hoje" e os selos da grade em /flashcards. Uma agregação só, apoiada
 * no índice (userId, nextReviewAt).
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ decks: {}, total: 0 })

    const db = await getDb()
    const now = new Date()

    const rows = await db
      .collection(FLASHCARD_SPACED_PROGRESS_COLLECTION)
      .aggregate([
        { $match: { userId: session.userId, nextReviewAt: { $lte: now } } },
        { $group: { _id: '$deckId', due: { $sum: 1 } } },
        { $sort: { due: -1 } },
        { $limit: 200 },
      ])
      .toArray()

    const decks: Record<string, number> = {}
    let total = 0
    for (const row of rows) {
      const deckId = String(row._id || '')
      if (!deckId) continue
      decks[deckId] = row.due
      total += row.due
    }

    const res = NextResponse.json({ decks, total })
    res.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
    return res
  } catch (error) {
    console.error('Erro ao contar revisões pendentes:', error)
    return NextResponse.json({ decks: {}, total: 0 })
  }
}
