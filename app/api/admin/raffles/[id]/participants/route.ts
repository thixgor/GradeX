import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { isValidObjectId } from '@/lib/api-security'
import { decodeHtmlEntities } from '@/lib/raffles'
import type { RafflePurchase } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Lista participantes com pelo menos uma compra paga e seus números. */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  if (!isValidObjectId(params.id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const db = await getDb()
  const purchases = await db
    .collection<RafflePurchase>('raffle_purchases')
    .find({ raffleId: params.id, status: 'paid' })
    .sort({ paidAt: -1 })
    .limit(2000)
    .toArray()

  // Agrupa por participante/e-mail.
  const map = new Map<string, { name: string; email: string; phone: string; numbers: number[]; total: number }>()
  for (const p of purchases) {
    const key = p.participantId || p.participantEmail
    const entry = map.get(key) || {
      name: p.participantName,
      email: p.participantEmail,
      phone: p.participantPhone,
      numbers: [],
      total: 0,
    }
    entry.numbers.push(...p.numbers)
    entry.total += p.amount
    map.set(key, entry)
  }

  const participants = Array.from(map.values()).map(e => ({
    ...e,
    name: decodeHtmlEntities(e.name),
    phone: decodeHtmlEntities(e.phone),
    numbers: e.numbers.sort((a, b) => a - b),
    count: e.numbers.length,
  }))

  return NextResponse.json({ participants, totalParticipants: participants.length })
}
