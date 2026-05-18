import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import {
  PRICING_EVENTS_COLLECTION,
  resolvePricingEventState,
  serializePricingEventState,
  type PricingEvent,
} from '@/lib/pricing-events'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
// 60s de revalidação no edge — o lote atual muda no máximo na virada de semana/dia.
export const revalidate = 60

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }
  const db = await getDb()
  const event = await db.collection<PricingEvent>(PRICING_EVENTS_COLLECTION).findOne({
    _id: new ObjectId(params.id) as any,
  })
  if (!event) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
  if (event.isActive === false) {
    return NextResponse.json({ state: null, inactive: true })
  }

  const state = resolvePricingEventState(event)
  return NextResponse.json({ state: serializePricingEventState(state) }, {
    headers: {
      // Cache curto na CDN; OK reusar entre usuários porque depende só do tempo absoluto.
      'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
    },
  })
}
