import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const db = await getDb()

    const questoes = await db.collection('banco_questoes')
      .aggregate([
        {
          $group: {
            _id: { $trim: { input: '$enunciado' } },
            questoes: { $push: '$_id' },
            count: { $sum: 1 }
          }
        },
        { $match: { count: { $gt: 1 } } }
      ])
      .toArray()

    const duplicatas = await Promise.all(
      questoes.map(async (grupo) => {
        const questoesIds = grupo.questoes.map((id: ObjectId) => new ObjectId(id))
        const questoesDetalhes = await db.collection('banco_questoes')
          .find({ _id: { $in: questoesIds } })
          .project({
            _id: 1,
            enunciado: 1,
            periodoId: 1,
            moduloId: 1,
            topicoId: 1,
            createdAt: 1
          })
          .toArray()

        return {
          enunciado: grupo._id,
          count: grupo.count,
          questoes: questoesDetalhes
        }
      })
    )

    return NextResponse.json({ duplicatas })
  } catch (error) {
    console.error('Erro ao buscar questões duplicadas:', error)
    return NextResponse.json({ error: 'Erro ao buscar questões duplicadas' }, { status: 500 })
  }
}
