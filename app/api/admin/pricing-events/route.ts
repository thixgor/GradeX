import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  PRICING_EVENTS_COLLECTION,
  PricingEventError,
  normalizePricingEventInput,
  resolvePricingEventState,
  serializePricingEvent,
  serializePricingEventState,
  type PricingEvent,
} from '@/lib/pricing-events'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const db = await getDb()
  const events = await db.collection<PricingEvent>(PRICING_EVENTS_COLLECTION)
    .find({})
    .sort({ eventDate: 1, createdAt: -1 })
    .limit(500)
    .toArray()

  const now = new Date()
  return NextResponse.json({
    events: events.map((event) => ({
      ...serializePricingEvent(event),
      state: serializePricingEventState(resolvePricingEventState(event, now)),
    })),
  })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  try {
    const doc = normalizePricingEventInput(body, { userId: session.userId, name: session.name || '' })
    const db = await getDb()
    const inserted = await db.collection<PricingEvent>(PRICING_EVENTS_COLLECTION).insertOne(doc as any)
    const event: PricingEvent = { ...doc, _id: inserted.insertedId }
    return NextResponse.json({
      event: {
        ...serializePricingEvent(event),
        state: serializePricingEventState(resolvePricingEventState(event)),
      },
    }, { status: 201 })
  } catch (error: any) {
    if (error instanceof PricingEventError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[admin/pricing-events] POST erro:', error)
    return NextResponse.json({ error: error?.message || 'Erro ao criar evento' }, { status: 500 })
  }
}
