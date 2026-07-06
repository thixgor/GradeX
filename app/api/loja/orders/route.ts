import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import type { ShopOrder } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/loja/orders
 *  - usuário: lista seus pedidos.
 *  - admin (?all=1): lista todos (com filtro opcional ?status=).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const db = await getDb()
    const { searchParams } = new URL(request.url)
    const wantAll = searchParams.get('all') === '1'
    const statusFilter = searchParams.get('status')

    const filter: any = {}
    if (wantAll && session.role === 'admin') {
      if (statusFilter) filter.status = statusFilter
    } else {
      filter.userId = session.userId
    }

    const orders = await db
      .collection<ShopOrder>('shop_orders')
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(wantAll ? 300 : 100)
      .toArray()

    return NextResponse.json({ orders: orders.map((o) => ({ ...o, _id: String(o._id) })) })
  } catch (error) {
    console.error('Error fetching shop orders:', error)
    return NextResponse.json({ error: 'Erro ao buscar pedidos' }, { status: 500 })
  }
}
