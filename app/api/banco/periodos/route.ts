import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { BancoPeriodo, BancoPeriodoComContagem } from '@/lib/types/banco-questoes'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()

    // Buscar períodos com contagem de questões e módulos
    // Uses sub-pipeline $lookup to count without loading full docs into memory
    const periodos = await db.collection<BancoPeriodo>('banco_periodos')
      .aggregate<BancoPeriodoComContagem>([
        {
          $lookup: {
            from: 'banco_questoes',
            let: { periodoId: '$_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$periodoId', '$$periodoId'] } } },
              { $count: 'count' }
            ],
            as: '_qCount'
          }
        },
        {
          $lookup: {
            from: 'banco_modulos',
            let: { periodoId: '$_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$periodoId', '$$periodoId'] } } },
              { $count: 'count' }
            ],
            as: '_mCount'
          }
        },
        {
          $addFields: {
            totalQuestoes: { $ifNull: [{ $arrayElemAt: ['$_qCount.count', 0] }, 0] },
            totalModulos: { $ifNull: [{ $arrayElemAt: ['$_mCount.count', 0] }, 0] }
          }
        },
        {
          $project: {
            _qCount: 0,
            _mCount: 0
          }
        },
        { $sort: { ordem: 1 } }
      ])
      .toArray()

    return NextResponse.json({ periodos })
  } catch (error) {
    console.error('Erro ao buscar períodos:', error)
    return NextResponse.json({ error: 'Erro ao buscar períodos' }, { status: 500 })
  }
}
