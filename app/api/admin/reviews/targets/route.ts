import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { isValidTargetType } from '@/lib/reviews'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Busca por título nos targets (material ou flashcard deck) — uso interno do
 * /admin/avaliacoes para escolher onde anexar uma avaliação manual / travar.
 */
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const url = new URL(request.url)
  const targetType = url.searchParams.get('targetType')
  const q = (url.searchParams.get('q') || '').trim().slice(0, 100)

  if (!isValidTargetType(targetType)) {
    return NextResponse.json({ error: 'targetType inválido' }, { status: 400 })
  }

  const db = await getDb()
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const filter: any = q ? { title: { $regex: escaped, $options: 'i' } } : {}

  const collName = targetType === 'material' ? 'materials' : 'flashcardManualDecks'
  const docs = await db
    .collection(collName)
    .find(filter)
    .project({ title: 1, slug: 1, coverImage: 1, reviewsLocked: 1 })
    .sort({ title: 1 })
    .limit(40)
    .toArray()

  return NextResponse.json({
    targets: docs.map((d: any) => ({
      _id: String(d._id),
      title: d.title || d.slug || '(sem título)',
      slug: d.slug || null,
      coverImage: d.coverImage || null,
      reviewsLocked: !!d.reviewsLocked,
    })),
  })
}
