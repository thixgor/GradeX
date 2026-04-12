import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

// GET - Listar compras do usuário
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()

    const purchases = await db
      .collection('material_purchases')
      .find({
        userId: session.userId,
        status: 'completed',
      })
      .sort({ purchasedAt: -1 })
      .toArray()

    return NextResponse.json({ purchases })
  } catch (error) {
    console.error('Error fetching purchases:', error)
    return NextResponse.json({ error: 'Erro ao buscar compras' }, { status: 500 })
  }
}
