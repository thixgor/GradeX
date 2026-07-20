import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { checkRateLimitSync, isValidObjectId } from '@/lib/api-security'
import {
  REVIEWS_COLLECTION,
  ReviewDoc,
  toPublicReview,
} from '@/lib/reviews'
import type { ReviewSummary } from '@/lib/reviews-shared'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  const real = req.headers.get('x-real-ip')
  return real || 'unknown'
}

const PAGE_SIZE_MAX = 50

const EMPTY_SUMMARY = (): ReviewSummary => ({
  count: 0,
  avg: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
})

/**
 * Avaliações agregadas de um pacote. Como as avaliações são feitas por
 * material, aqui reunimos todas as avaliações dos materiais que compõem o
 * pacote — média, distribuição e a lista paginada — para servir de prova
 * social pública na página /pacotes/<id>. Leitura pública (sem login).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const url = new URL(request.url)
    const cursor = url.searchParams.get('cursor')
    const limit = Math.min(
      PAGE_SIZE_MAX,
      Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10) || 20),
    )

    const ip = getClientIp(request)
    const rl = checkRateLimitSync(ip, 'reviews:package', { limit: 120, windowMs: 60_000 })
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente mais tarde.' },
        { status: 429 },
      )
    }

    const db = await getDb()

    const pkg = await db.collection('material_packages').findOne(
      { _id: new ObjectId(id) },
      { projection: { materialIds: 1, isHidden: 1 } },
    )
    if (!pkg || pkg.isHidden === true) {
      return NextResponse.json({ error: 'Pacote não encontrado' }, { status: 404 })
    }

    const materialIds: string[] = Array.isArray(pkg.materialIds)
      ? pkg.materialIds.map((m: unknown) => String(m)).filter((m: string) => isValidObjectId(m))
      : []

    if (materialIds.length === 0) {
      return NextResponse.json({ reviews: [], summary: EMPTY_SUMMARY(), nextCursor: null })
    }

    const collection = db.collection<ReviewDoc>(REVIEWS_COLLECTION)

    // Títulos dos materiais, para dar contexto de "sobre qual material" é a avaliação.
    const materialObjectIds = materialIds.map((m) => new ObjectId(m))
    const materialDocs = await db
      .collection('materials')
      .find({ _id: { $in: materialObjectIds } })
      .project({ title: 1 })
      .toArray()
    const titleById = new Map<string, string>(
      materialDocs.map((m: any) => [String(m._id), m.title || '']),
    )

    // ── Resumo agregado (média + distribuição) ────────────────
    const summaryCursor = collection.aggregate<{ _id: number; count: number }>([
      { $match: { targetType: 'material', targetId: { $in: materialIds } } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ])
    const summary = EMPTY_SUMMARY()
    let total = 0
    let sum = 0
    for await (const row of summaryCursor) {
      const rating = row._id as 1 | 2 | 3 | 4 | 5
      if (rating >= 1 && rating <= 5) {
        summary.distribution[rating] = row.count
        total += row.count
        sum += rating * row.count
      }
    }
    summary.count = total
    summary.avg = total > 0 ? Math.round((sum / total) * 10) / 10 : 0

    // ── Lista paginada (destaques primeiro, depois cronológico) ─
    const baseFilter: any = { targetType: 'material', targetId: { $in: materialIds } }
    if (cursor) {
      if (!isValidObjectId(cursor)) {
        return NextResponse.json({ error: 'cursor inválido' }, { status: 400 })
      }
      const cursorDoc = await collection.findOne(
        { _id: new ObjectId(cursor) },
        { projection: { createdAt: 1 } },
      )
      if (cursorDoc) {
        baseFilter.$or = [
          { createdAt: { $lt: cursorDoc.createdAt } },
          { createdAt: cursorDoc.createdAt, _id: { $lt: new ObjectId(cursor) } },
        ]
      }
    }

    const sort: any = cursor
      ? { createdAt: -1, _id: -1 }
      : { isFeatured: -1, createdAt: -1, _id: -1 }

    const items = await collection
      .find(baseFilter)
      .sort(sort)
      .limit(limit + 1)
      .toArray()

    const hasMore = items.length > limit
    const pageItems = hasMore ? items.slice(0, limit) : items
    const nextCursor = hasMore ? String(pageItems[pageItems.length - 1]._id) : null

    return NextResponse.json({
      reviews: pageItems.map((doc: ReviewDoc) => ({
        ...toPublicReview(doc),
        sourceTitle: titleById.get(doc.targetId) || null,
      })),
      summary,
      nextCursor,
    })
  } catch (error) {
    console.error('GET /api/materiais/packages/[id]/reviews error:', error)
    return NextResponse.json({ error: 'Erro ao listar avaliações do pacote' }, { status: 500 })
  }
}
