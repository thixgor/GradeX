import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { topicoOrigem, topicoDestino } = body

    if (!topicoOrigem || !topicoDestino) {
      return NextResponse.json({ error: 'Tópico de origem e destino são obrigatórios' }, { status: 400 })
    }

    if (topicoOrigem === topicoDestino) {
      return NextResponse.json({ error: 'Tópico de origem e destino não podem ser iguais' }, { status: 400 })
    }

    const db = await getDb()

    const result = await db.collection('banco_questoes').updateMany(
      { topicoId: new ObjectId(topicoOrigem) },
      { $set: { topicoId: new ObjectId(topicoDestino), updatedAt: new Date() } }
    )

    return NextResponse.json({
      sucesso: true,
      totalMovidas: result.modifiedCount
    })
  } catch (error) {
    console.error('Erro ao mover questões:', error)
    return NextResponse.json({ error: 'Erro ao mover questões' }, { status: 500 })
  }
}
