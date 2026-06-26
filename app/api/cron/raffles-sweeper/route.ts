import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { drawRaffle, getEffectiveStatus } from '@/lib/raffles'
import type { Raffle, RafflePurchase } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Cron das rifas. Roda periodicamente e:
 *  1. Libera reservas expiradas (números voltam a ficar disponíveis) e marca
 *     as compras pendentes correspondentes como expiradas.
 *  2. Encerra rifas cujo `endsAt` já passou (status → closed).
 *  3. Sorteia automaticamente rifas encerradas que ainda não têm todos os
 *     ganhadores (sorteio automático ao chegar no horário final).
 *
 * Autenticação: header `x-vercel-cron` (Vercel) ou Bearer ${CRON_SECRET}.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const db = await getDb()
  const now = new Date()
  const stats = { releasedReservations: 0, closed: 0, drawn: 0, errors: 0 }

  // 1) Libera reservas expiradas.
  const expired = await db.collection('raffle_numbers').find(
    { status: 'reserved', reservedUntil: { $lt: now } },
    { projection: { orderId: 1 } },
  ).limit(5000).toArray()

  if (expired.length > 0) {
    const orderIds = Array.from(new Set(expired.map(e => (e as any).orderId).filter(Boolean)))
    const del = await db.collection('raffle_numbers').deleteMany({ status: 'reserved', reservedUntil: { $lt: now } })
    stats.releasedReservations = del.deletedCount || 0
    if (orderIds.length > 0) {
      await db.collection<RafflePurchase>('raffle_purchases').updateMany(
        { orderId: { $in: orderIds }, status: 'pending' },
        { $set: { status: 'expired', updatedAt: new Date() } },
      )
    }
  }

  // 2 + 3) Encerra e sorteia rifas vencidas.
  const candidates = await db.collection<Raffle>('raffles').find({
    status: { $in: ['open', 'scheduled', 'closed', 'drawing'] },
    endsAt: { $lte: now },
  }).limit(50).toArray()

  for (const raffle of candidates) {
    try {
      const effective = getEffectiveStatus(raffle, now)
      const alreadyDrawn = (raffle.winners || []).length

      // Transição para closed/drawing se ainda estava aberta.
      if (raffle.status === 'open' || raffle.status === 'scheduled') {
        await db.collection<Raffle>('raffles').updateOne(
          { _id: raffle._id as any },
          { $set: { status: 'drawing', updatedAt: new Date() } },
        )
        raffle.status = 'drawing'
        stats.closed += 1
      }

      // Sorteio automático se faltam ganhadores.
      if (alreadyDrawn < (raffle.winnersCount || 1)) {
        const result = await drawRaffle(db, raffle, {
          drawMethod: 'automatic',
          drawnBy: 'Sistema (automático)',
        })
        if (result.ok) stats.drawn += result.winners.length
      } else if (raffle.status !== 'finished') {
        await db.collection<Raffle>('raffles').updateOne(
          { _id: raffle._id as any },
          { $set: { status: 'finished', updatedAt: new Date() } },
        )
      }
    } catch (err) {
      console.error('[raffles-sweeper] erro ao processar rifa', String(raffle._id), err)
      stats.errors += 1
    }
  }

  return NextResponse.json({ ok: true, stats })
}

function isAuthorized(request: NextRequest): boolean {
  if (request.headers.get('x-vercel-cron')) return true
  const auth = request.headers.get('authorization') || ''
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`
  return !!process.env.CRON_SECRET && auth === expected
}
