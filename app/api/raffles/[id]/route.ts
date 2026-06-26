import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { findRaffleByIdOrSlug, getTakenNumbers, serializeRaffle } from '@/lib/raffles'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Detalhe público de uma rifa (por slug ou id), incluindo os números tomados
 * (vendidos e reservados) para montar o grid. Respeita a visibilidade:
 *  - public/unlisted: acessível por link
 *  - private: apenas admin
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await checkRateLimit(ip, 'raffles_detail', 120, 60_000)
  if (!rl.success) {
    return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })
  }

  const db = await getDb()
  const raffle = await findRaffleByIdOrSlug(db, params.id)
  if (!raffle) {
    return NextResponse.json({ error: 'Rifa não encontrada' }, { status: 404 })
  }

  const session = await getSession()
  const isAdmin = session?.role === 'admin'

  // Rascunho e privada: apenas admin.
  if ((raffle.visibility === 'private' || raffle.status === 'draft') && !isAdmin) {
    return NextResponse.json({ error: 'Rifa não encontrada' }, { status: 404 })
  }

  const taken = await getTakenNumbers(db, String(raffle._id))
  const serialized = serializeRaffle(raffle, taken)

  return NextResponse.json({
    raffle: serialized,
    soldNumbers: taken.sold,
    reservedNumbers: taken.reserved,
  })
}
