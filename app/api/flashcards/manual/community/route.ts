import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { FLASHCARD_MANUAL_COLLECTIONS, normalizeDeckForResponse } from '@/lib/flashcard-manual'
import type { FlashcardManualDeck } from '@/lib/types'

export const dynamic = 'force-dynamic'

// GET /api/flashcards/manual/community?q=...&sort=trending|new|featured
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const sort = searchParams.get('sort') || 'trending'
    const tag = searchParams.get('tag')

    const db = await getDb()
    const filter: any = {
      visibility: 'public',
      isPublished: true,
      isHidden: false,
      // Decks pagos não aparecem na comunidade gratuita; aparecem no /materiais e na "loja" do hub
      pricing: { $ne: 'paid' },
    }
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
      ]
    }
    if (tag) filter.tags = tag

    const sortOption: any = sort === 'new'
      ? { createdAt: -1 }
      : sort === 'featured'
        ? { isFeatured: -1, likeCount: -1, createdAt: -1 }
        : { likeCount: -1, viewCount: -1, createdAt: -1 } // trending

    const decks = await db
      .collection<FlashcardManualDeck>(FLASHCARD_MANUAL_COLLECTIONS.decks)
      .find(filter)
      .sort(sortOption)
      .limit(120)
      .toArray()

    const res = NextResponse.json({ decks: decks.map(normalizeDeckForResponse) })
    res.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=120')
    return res
  } catch (error) {
    console.error('Erro ao listar comunidade:', error)
    return NextResponse.json({ error: 'Erro ao listar comunidade' }, { status: 500 })
  }
}
