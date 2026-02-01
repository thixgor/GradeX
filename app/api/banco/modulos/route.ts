import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { BancoModulo, BancoModuloComContagem } from '@/lib/types/banco-questoes'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const periodoId = searchParams.get('periodoId')

    const db = await getDb()

    const pipeline: any[] = []

    // Filtrar por período se fornecido
    if (periodoId) {
      pipeline.push({
        $match: { periodoId: new ObjectId(periodoId) }
      })
    }

    // Adicionar lookups e contagens
    pipeline.push(
      {
        $lookup: {
          from: 'banco_questoes',
          localField: '_id',
          foreignField: 'moduloId',
          as: 'questoes'
        }
      },
      {
        $lookup: {
          from: 'banco_topicos',
          localField: '_id',
          foreignField: 'moduloId',
          as: 'topicos'
        }
      },
      {
        $lookup: {
          from: 'banco_periodos',
          localField: 'periodoId',
          foreignField: '_id',
          as: 'periodo'
        }
      },
      {
        $addFields: {
          totalQuestoes: { $size: '$questoes' },
          totalTopicos: { $size: '$topicos' },
          periodoNome: { $arrayElemAt: ['$periodo.nome', 0] }
        }
      },
      {
        $project: {
          questoes: 0,
          topicos: 0,
          periodo: 0
        }
      },
      { $sort: { ordem: 1 } }
    )

    const modulos = await db.collection<BancoModulo>('banco_modulos')
      .aggregate<BancoModuloComContagem>(pipeline)
      .toArray()

    return NextResponse.json({ modulos })
  } catch (error) {
    console.error('Erro ao buscar módulos:', error)
    return NextResponse.json({ error: 'Erro ao buscar módulos' }, { status: 500 })
  }
}
