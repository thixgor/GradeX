import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { prepararTermoDeBusca } from '@/lib/utils/escape-regex'
import { FLASHCARD_MANUAL_COLLECTIONS, normalizeDeckForResponse, PUBLIC_DECK_LISTING_FILTER } from '@/lib/flashcard-manual'
import type { FlashcardManualDeck } from '@/lib/types'

export const dynamic = 'force-dynamic'

// GET /api/flashcards/manual/community?q=...&sort=trending|new|featured
export async function GET(request: NextRequest) {
  try {
    // Sem exigir login: o que está público é público. A página do deck já abre
    // em prévia para visitante, e a lista não devolve nada que não seja público.
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const sort = searchParams.get('sort') || 'trending'
    const tag = searchParams.get('tag')

    const db = await getDb()
    const filter: any = {
      ...PUBLIC_DECK_LISTING_FILTER,
      // Decks pagos não aparecem na comunidade gratuita; aparecem no /materiais e na "loja" do hub
      pricing: { $ne: 'paid' },
    }
    const termo = prepararTermoDeBusca(q)
    if (termo) {
      filter.$or = [
        { title: { $regex: termo, $options: 'i' } },
        { description: { $regex: termo, $options: 'i' } },
        { tags: { $regex: termo, $options: 'i' } },
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
    // Sem cache de resposta: publicar um deck e não vê-lo na lista pelos 60s
    // seguintes é indistinguível do bug que este endpoint acabou de deixar de ter.
    res.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
    return res
  } catch (error) {
    console.error('Erro ao listar comunidade:', error)
    return NextResponse.json({ error: 'Erro ao listar comunidade' }, { status: 500 })
  }
}
