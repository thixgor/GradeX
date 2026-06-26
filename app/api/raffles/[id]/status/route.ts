import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { findRaffleByIdOrSlug, getTakenNumbers, getEffectiveStatus, maskName } from '@/lib/raffles'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Status "ao vivo" leve para polling do front (grid + estado do sorteio).
 * Mantido enxuto para reduzir custo de CPU/transfer no Vercel.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await checkRateLimit(ip, 'raffles_status', 240, 60_000)
  if (!rl.success) {
    return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })
  }

  const db = await getDb()
  const raffle = await findRaffleByIdOrSlug(db, params.id)
  if (!raffle) {
    return NextResponse.json({ error: 'Rifa não encontrada' }, { status: 404 })
  }
  if (raffle.visibility === 'private' || raffle.status === 'draft') {
    // status público não expõe privadas/rascunhos
    return NextResponse.json({ error: 'Rifa não encontrada' }, { status: 404 })
  }

  const taken = await getTakenNumbers(db, String(raffle._id))
  const status = getEffectiveStatus(raffle)

  return NextResponse.json({
    status,
    soldCount: taken.sold.length,
    availableCount: Math.max(0, raffle.totalNumbers - taken.sold.length),
    soldNumbers: taken.sold,
    reservedNumbers: taken.reserved,
    drawAt: raffle.drawAt || null,
    winners: (raffle.winners || []).map(w => ({
      number: w.number,
      participantName: maskName(w.participantName),
      prizeName: w.prizeName,
      drawnAt: w.drawnAt,
    })),
  })
}
