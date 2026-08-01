import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { checkRateLimitSync } from '@/lib/api-security'
import { REVIEWS_COLLECTION, ReviewDoc, toPublicReview } from '@/lib/reviews'
import type { PublicReview, ReviewSummary } from '@/lib/reviews-shared'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  const real = req.headers.get('x-real-ip')
  return real || 'unknown'
}

/** Teto de itens devolvidos para a esteira da landing. */
const LIST_MAX = 60
/** Teto de alvos considerados — protege o $in de crescer sem limite. */
const TARGET_MAX = 3000

const EMPTY_SUMMARY = (): ReviewSummary => ({
  count: 0,
  avg: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
})

export interface ShowcaseReview extends PublicReview {
  sourceTitle: string | null
}

/**
 * Vitrine pública de avaliações: junta o que os alunos escreveram sobre TODOS
 * os materiais e decks visíveis da plataforma. Alimenta a esteira de prova
 * social da landing, logo abaixo dos depoimentos em vídeo.
 *
 * Diferente de /api/reviews (que é por item e exige targetId), aqui não há
 * login nem alvo: é leitura agregada, anônima e cacheada na borda.
 *
 * A lista traz só avaliações COM texto — nota solta não convence ninguém —,
 * mas a média e a contagem consideram todas as avaliações dos itens visíveis,
 * para o número exibido continuar sendo o número real.
 */
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rl = checkRateLimitSync(ip, 'reviews:showcase', { limit: 60, windowMs: 60_000 })
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente mais tarde.' },
        { status: 429 },
      )
    }

    const url = new URL(request.url)
    const limit = Math.min(
      LIST_MAX,
      Math.max(1, parseInt(url.searchParams.get('limit') || '40', 10) || 40),
    )

    const db = await getDb()

    // Só entram itens que o público consegue ver: material não oculto e deck
    // publicado fora do modo privado. Assim uma avaliação de rascunho ou de
    // material despublicado não vaza o título dele na home.
    const [materialDocs, deckDocs] = await Promise.all([
      db
        .collection('materials')
        .find({ isHidden: { $ne: true } })
        .project({ title: 1 })
        .limit(TARGET_MAX)
        .toArray(),
      db
        .collection('flashcardManualDecks')
        .find({ isPublished: true, visibility: { $ne: 'private' } })
        .project({ title: 1 })
        .limit(TARGET_MAX)
        .toArray(),
    ])

    const materialIds = materialDocs.map((d: any) => String(d._id))
    const deckIds = deckDocs.map((d: any) => String(d._id))

    if (materialIds.length === 0 && deckIds.length === 0) {
      return NextResponse.json({ reviews: [], summary: EMPTY_SUMMARY() })
    }

    const titleById = new Map<string, string>()
    for (const d of materialDocs) titleById.set(`material:${String(d._id)}`, (d as any).title || '')
    for (const d of deckDocs) titleById.set(`flashcard_deck:${String(d._id)}`, (d as any).title || '')

    const visibleFilter = {
      $or: [
        { targetType: 'material', targetId: { $in: materialIds } },
        { targetType: 'flashcard_deck', targetId: { $in: deckIds } },
      ],
    }

    const collection = db.collection<ReviewDoc>(REVIEWS_COLLECTION)

    const [items, summaryRows] = await Promise.all([
      collection
        .find({ ...visibleFilter, comment: { $exists: true, $ne: '' } } as any)
        .sort({ isFeatured: -1, rating: -1, createdAt: -1, _id: -1 })
        .limit(limit)
        .toArray(),
      collection
        .aggregate<{ _id: number; count: number }>([
          { $match: visibleFilter },
          { $group: { _id: '$rating', count: { $sum: 1 } } },
        ])
        .toArray(),
    ])

    const summary = EMPTY_SUMMARY()
    let total = 0
    let sum = 0
    for (const row of summaryRows) {
      const rating = row._id as 1 | 2 | 3 | 4 | 5
      if (rating >= 1 && rating <= 5) {
        summary.distribution[rating] = row.count
        total += row.count
        sum += rating * row.count
      }
    }
    summary.count = total
    summary.avg = total > 0 ? Math.round((sum / total) * 10) / 10 : 0

    const reviews: ShowcaseReview[] = items.map((doc) => ({
      ...toPublicReview(doc),
      sourceTitle: titleById.get(`${doc.targetType}:${doc.targetId}`) || null,
    }))

    return NextResponse.json(
      { reviews, summary },
      {
        headers: {
          // Mesma política do /api/testimonials: a landing não paga o banco a
          // cada visita e uma avaliação nova aparece em poucos minutos.
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900',
        },
      },
    )
  } catch (error) {
    console.error('GET /api/reviews/showcase error:', error)
    // Falha de banco não pode derrubar a landing.
    return NextResponse.json({ reviews: [], summary: EMPTY_SUMMARY() }, { status: 200 })
  }
}
