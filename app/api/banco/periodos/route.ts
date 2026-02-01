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
    const periodos = await db.collection<BancoPeriodo>('banco_periodos')
      .aggregate<BancoPeriodoComContagem>([
        {
          $lookup: {
            from: 'banco_questoes',
            localField: '_id',
            foreignField: 'periodoId',
            as: 'questoes'
          }
        },
        {
          $lookup: {
            from: 'banco_modulos',
            localField: '_id',
            foreignField: 'periodoId',
            as: 'modulos'
          }
        },
        {
          $addFields: {
            totalQuestoes: { $size: '$questoes' },
            totalModulos: { $size: '$modulos' }
          }
        },
        {
          $project: {
            questoes: 0,
            modulos: 0
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
