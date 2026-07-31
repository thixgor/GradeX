import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import {
  TESTIMONIALS_COLLECTION,
  TestimonialDoc,
  toPublicTestimonial,
} from '@/lib/testimonials'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET público — só depoimentos habilitados, ordenados. Consumido pela landing.
export async function GET() {
  try {
    const db = await getDb()
    const docs = await db
      .collection<TestimonialDoc>(TESTIMONIALS_COLLECTION)
      .find({ enabled: { $ne: false } })
      .sort({ order: 1, createdAt: 1 })
      .limit(24)
      .toArray()

    return NextResponse.json(
      { testimonials: docs.map(toPublicTestimonial) },
      {
        headers: {
          // Cache curto na borda: a landing não paga o banco a cada visita, mas
          // uma edição no admin aparece em ~1 min.
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    )
  } catch (error) {
    console.error('GET /api/testimonials error:', error)
    // Falha de banco não pode derrubar a landing: devolve lista vazia.
    return NextResponse.json({ testimonials: [] }, { status: 200 })
  }
}
