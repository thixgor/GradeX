import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()

    const anos = await db.collection('banco_questoes')
      .distinct('ano', { ano: { $ne: null } })

    // Sort descending (most recent first)
    const anosSorted = (anos as number[]).sort((a, b) => b - a)

    return NextResponse.json({ anos: anosSorted })
  } catch (error) {
    console.error('Erro ao buscar anos:', error)
    return NextResponse.json({ error: 'Erro ao buscar anos' }, { status: 500 })
  }
}
