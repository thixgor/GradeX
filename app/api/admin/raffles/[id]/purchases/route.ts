import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { isValidObjectId } from '@/lib/api-security'
import { decodeHtmlEntities } from '@/lib/raffles'
import type { RafflePurchase } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Histórico de compras (pagamentos) de uma rifa. */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  if (!isValidObjectId(params.id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')?.trim()

  const db = await getDb()
  const query: Record<string, any> = { raffleId: params.id }
  if (statusFilter) query.status = statusFilter

  const purchases = await db
    .collection<RafflePurchase>('raffle_purchases')
    .find(query)
    .sort({ createdAt: -1 })
    .limit(1000)
    .toArray()

  const data = purchases.map(p => ({
    id: String(p._id),
    name: decodeHtmlEntities(p.participantName),
    email: p.participantEmail,
    phone: decodeHtmlEntities(p.participantPhone),
    numbers: p.numbers,
    amount: p.amount,
    status: p.status,
    mercadoPagoPaymentId: p.mercadoPagoPaymentId || null,
    createdAt: p.createdAt,
    paidAt: p.paidAt || null,
  }))

  const paidTotal = purchases.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)

  return NextResponse.json({ purchases: data, paidTotal })
}
