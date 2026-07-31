import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  TESTIMONIALS_COLLECTION,
  TestimonialDoc,
  buildEmbedUrl,
  extractYouTubeId,
  isShortsUrl,
  sanitizeTestimonialDescription,
  sanitizeTestimonialName,
  toPublicTestimonial,
} from '@/lib/testimonials'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const NO_STORE = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } as const

async function ensureAdmin() {
  const session = await getSession()
  if (!session) return { error: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) }
  if (session.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) }
  }
  return { session }
}

// GET — lista todos os depoimentos (habilitados ou não) para o painel.
export async function GET() {
  const auth = await ensureAdmin()
  if ('error' in auth) return auth.error

  try {
    const db = await getDb()
    const docs = await db
      .collection<TestimonialDoc>(TESTIMONIALS_COLLECTION)
      .find({})
      .sort({ order: 1, createdAt: 1 })
      .toArray()

    return NextResponse.json(
      { testimonials: docs.map(toPublicTestimonial) },
      { headers: NO_STORE }
    )
  } catch (error) {
    console.error('GET /api/admin/testimonials error:', error)
    return NextResponse.json({ error: 'Erro ao listar depoimentos' }, { status: 500 })
  }
}

// POST — cria um depoimento a partir de um link do YouTube.
export async function POST(request: NextRequest) {
  const auth = await ensureAdmin()
  if ('error' in auth) return auth.error

  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    const { embedUrl, name, description, enabled, order } = body as Record<string, unknown>

    const videoId = extractYouTubeId(embedUrl)
    if (!videoId) {
      return NextResponse.json(
        { error: 'Link do YouTube inválido. Cole um link de vídeo, Shorts ou embed.' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const collection = db.collection<TestimonialDoc>(TESTIMONIALS_COLLECTION)

    // Novo item vai para o fim da lista por padrão.
    let nextOrder: number
    if (typeof order === 'number' && Number.isFinite(order)) {
      nextOrder = order
    } else {
      const last = await collection.find({}).sort({ order: -1 }).limit(1).toArray()
      nextOrder = last.length ? (last[0].order ?? 0) + 1 : 0
    }

    const now = new Date()
    const doc: TestimonialDoc = {
      embedUrl: buildEmbedUrl(videoId),
      videoId,
      vertical: isShortsUrl(embedUrl),
      name: sanitizeTestimonialName(name),
      description: sanitizeTestimonialDescription(description),
      order: nextOrder,
      enabled: enabled !== false,
      createdAt: now,
      updatedAt: now,
    }

    const inserted = await collection.insertOne(doc as any)
    return NextResponse.json(
      { success: true, testimonial: toPublicTestimonial({ ...doc, _id: inserted.insertedId }) },
      { status: 201, headers: NO_STORE }
    )
  } catch (error) {
    console.error('POST /api/admin/testimonials error:', error)
    return NextResponse.json({ error: 'Erro ao criar depoimento' }, { status: 500 })
  }
}
