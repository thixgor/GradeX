import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { isValidObjectId } from '@/lib/api-security'
import { manualSellNumbers, sanitizeRaffleText } from '@/lib/raffles'
import { audit } from '@/lib/payments/audit'
import type { Raffle } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BodySchema = z.object({
  name: z.string().min(2).max(140),
  email: z.string().email().max(200),
  phone: z.string().min(6).max(40),
  numbers: z.array(z.number().int().positive()).min(1).max(2000),
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  if (!isValidObjectId(params.id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.format() }, { status: 400 })
  }
  const d = parsed.data

  const db = await getDb()
  const raffle = await db.collection<Raffle>('raffles').findOne({ _id: new ObjectId(params.id) as any })
  if (!raffle) return NextResponse.json({ error: 'Rifa não encontrada' }, { status: 404 })

  const result = await manualSellNumbers(db, raffle, {
    name: sanitizeRaffleText(d.name.trim(), 140),
    email: d.email.trim().toLowerCase(),
    phone: sanitizeRaffleText(d.phone.trim(), 40),
    numbers: d.numbers,
    soldBy: session.name,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error, conflicting: result.conflicting }, { status: 409 })
  }

  await audit({
    action: 'raffle_numbers_sold',
    actorUserId: session.userId,
    resourceType: 'raffle',
    resourceId: params.id,
    metadata: { manual: true, count: d.numbers.length, conflicting: result.conflicting || [] },
  })

  return NextResponse.json({ ok: true, soldCount: result.soldCount, conflicting: result.conflicting || [] })
}
