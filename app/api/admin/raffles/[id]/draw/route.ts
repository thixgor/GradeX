import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { isValidObjectId } from '@/lib/api-security'
import { drawRaffle, getEffectiveStatus } from '@/lib/raffles'
import { audit } from '@/lib/payments/audit'
import type { Raffle } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const Schema = z.object({
  count: z.number().int().min(1).max(1000).optional(),
  allowUnsold: z.boolean().optional(),
  specificNumbers: z.array(z.number().int().positive()).max(1000).optional(),
})

/**
 * Sorteio manual (admin). Só funciona se a rifa estiver encerrada/sorteando,
 * ou aberta com `allowManualDrawWhileOpen`. Persiste o resultado.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  if (!isValidObjectId(params.id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  let body: any = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.format() }, { status: 400 })
  }

  const db = await getDb()
  const raffle = await db.collection<Raffle>('raffles').findOne({ _id: new ObjectId(params.id) as any })
  if (!raffle) return NextResponse.json({ error: 'Rifa não encontrada' }, { status: 404 })

  const effective = getEffectiveStatus(raffle)
  const canDraw =
    effective === 'closed' ||
    effective === 'drawing' ||
    raffle.status === 'closed' ||
    raffle.status === 'drawing' ||
    (effective === 'open' && raffle.allowManualDrawWhileOpen)

  if (!canDraw) {
    return NextResponse.json(
      { error: 'A rifa precisa estar encerrada (ou aberta com sorteio manual habilitado) para sortear.' },
      { status: 400 },
    )
  }

  if (raffle.status !== 'cancelled' && raffle.status !== 'finished') {
    // marca como "sorteando" para refletir a animação ao vivo
    await db.collection<Raffle>('raffles').updateOne(
      { _id: raffle._id as any },
      { $set: { status: 'drawing', updatedAt: new Date() } },
    )
    raffle.status = 'drawing'
  }

  const result = await drawRaffle(db, raffle, {
    count: parsed.data.count,
    drawMethod: 'manual',
    drawnBy: session.name || session.userId,
    allowUnsold: parsed.data.allowUnsold,
    specificNumbers: parsed.data.specificNumbers,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  await audit({
    action: 'raffle_drawn',
    actorUserId: session.userId,
    resourceType: 'raffle',
    resourceId: params.id,
    metadata: { method: 'manual', winners: result.winners.map(w => w.number) },
  })

  return NextResponse.json({ ok: true, winners: result.winners })
}
