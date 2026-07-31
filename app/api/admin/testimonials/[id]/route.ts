import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { isValidObjectId } from '@/lib/api-security'
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

// PATCH — atualiza campos do depoimento (link, nome, descrição, ordem, visível).
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAdmin()
  if ('error' in auth) return auth.error

  const { id } = params
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    const { embedUrl, name, description, enabled, order } = body as Record<string, unknown>
    const update: Partial<TestimonialDoc> = { updatedAt: new Date() }

    if (embedUrl !== undefined) {
      const videoId = extractYouTubeId(embedUrl)
      if (!videoId) {
        return NextResponse.json(
          { error: 'Link do YouTube inválido. Cole um link de vídeo, Shorts ou embed.' },
          { status: 400 }
        )
      }
      update.embedUrl = buildEmbedUrl(videoId)
      update.videoId = videoId
      update.vertical = isShortsUrl(embedUrl)
    }
    if (name !== undefined) update.name = sanitizeTestimonialName(name)
    if (description !== undefined) update.description = sanitizeTestimonialDescription(description)
    if (enabled !== undefined) update.enabled = enabled !== false
    if (typeof order === 'number' && Number.isFinite(order)) update.order = order

    const db = await getDb()
    const collection = db.collection<TestimonialDoc>(TESTIMONIALS_COLLECTION)
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: 'after' }
    )

    if (!result) {
      return NextResponse.json({ error: 'Depoimento não encontrado' }, { status: 404 })
    }

    return NextResponse.json(
      { success: true, testimonial: toPublicTestimonial(result as TestimonialDoc) },
      { headers: NO_STORE }
    )
  } catch (error) {
    console.error('PATCH /api/admin/testimonials/[id] error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar depoimento' }, { status: 500 })
  }
}

// DELETE — remove o depoimento.
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAdmin()
  if ('error' in auth) return auth.error

  const { id } = params
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  try {
    const db = await getDb()
    const result = await db
      .collection<TestimonialDoc>(TESTIMONIALS_COLLECTION)
      .deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Depoimento não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true }, { headers: NO_STORE })
  } catch (error) {
    console.error('DELETE /api/admin/testimonials/[id] error:', error)
    return NextResponse.json({ error: 'Erro ao excluir depoimento' }, { status: 500 })
  }
}
