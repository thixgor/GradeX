import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  PRICING_EVENTS_COLLECTION,
  resolvePricingEventState,
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
    .project({ name: 1, eventDate: 1, isActive: 1, mode: 1, weeklyTiers: 1, manualTiers: 1 })
    .sort({ eventDate: 1 })
    .limit(200)
    .toArray()
  const now = new Date()
  return NextResponse.json({
    options: events.map((event) => {
      const state = resolvePricingEventState(event as PricingEvent, now)
      return {
        id: String(event._id),
        name: event.name,
        eventDate: event.eventDate instanceof Date ? event.eventDate.toISOString() : new Date(event.eventDate).toISOString(),
        isActive: event.isActive !== false,
        daysUntilEvent: state.daysUntilEvent,
        activeDiscountPercent: state.activeTier?.discountPercent || 0,
      }
    }),
  })
}
