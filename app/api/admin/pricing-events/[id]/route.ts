import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
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

function badId() {
  return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  if (!ObjectId.isValid(params.id)) return badId()

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  try {
    const doc = normalizePricingEventInput(body, { userId: session.userId, name: session.name || '' })
    const db = await getDb()
    const update = {
      name: doc.name,
      description: doc.description,
      bannerUrl: doc.bannerUrl,
      eventDate: doc.eventDate,
      mode: doc.mode,
      weeklyTiers: doc.weeklyTiers,
      manualTiers: doc.manualTiers,
      isActive: doc.isActive,
      updatedAt: new Date(),
    }
    const result = await db.collection<PricingEvent>(PRICING_EVENTS_COLLECTION).findOneAndUpdate(
      { _id: new ObjectId(params.id) as any },
      { $set: update },
      { returnDocument: 'after' }
    )
    if (!result) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
    return NextResponse.json({
      event: {
        ...serializePricingEvent(result),
        state: serializePricingEventState(resolvePricingEventState(result)),
      },
    })
  } catch (error: any) {
    if (error instanceof PricingEventError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[admin/pricing-events] PUT erro:', error)
    return NextResponse.json({ error: error?.message || 'Erro ao atualizar evento' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  if (!ObjectId.isValid(params.id)) return badId()

  const db = await getDb()
  const eventId = params.id

  // Desvincula referências antes de remover.
  await Promise.all([
    db.collection('materials').updateMany(
      { pricingEventId: eventId },
      { $set: { pricingEventId: null } }
    ),
    db.collection('material_packages').updateMany(
      { pricingEventId: eventId },
      { $set: { pricingEventId: null } }
    ),
    db.collection('manual_clinico_product_settings').updateMany(
      { pricingEventId: eventId },
      { $set: { pricingEventId: null } }
    ),
  ])

  await db.collection(PRICING_EVENTS_COLLECTION).deleteOne({ _id: new ObjectId(eventId) as any })
  return NextResponse.json({ ok: true })
}
