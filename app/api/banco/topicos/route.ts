import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { BancoTopico, BancoTopicoComContagem } from '@/lib/types/banco-questoes'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const moduloId = searchParams.get('moduloId')

    const db = await getDb()

    const pipeline: any[] = []

    // Filtrar por módulo se fornecido
    if (moduloId) {
      pipeline.push({
        $match: { moduloId: new ObjectId(moduloId) }
      })
    }

    // Adicionar lookups e contagens
    pipeline.push(
      {
        $lookup: {
          from: 'banco_questoes',
          localField: '_id',
          foreignField: 'topicoId',
          as: 'questoes'
        }
      },
      {
        $lookup: {
          from: 'banco_subtopicos',
          localField: '_id',
          foreignField: 'topicoId',
          as: 'subtopicos'
        }
      },
      {
        $lookup: {
          from: 'banco_modulos',
          localField: 'moduloId',
          foreignField: '_id',
          as: 'modulo'
        }
      },
      {
        $addFields: {
          totalQuestoes: { $size: '$questoes' },
          totalSubtopicos: { $size: '$subtopicos' },
          moduloNome: { $arrayElemAt: ['$modulo.nome', 0] }
        }
      },
      {
        $project: {
          questoes: 0,
          subtopicos: 0,
          modulo: 0
        }
      },
      { $sort: { ordem: 1 } }
    )

    const topicos = await db.collection<BancoTopico>('banco_topicos')
      .aggregate<BancoTopicoComContagem>(pipeline)
      .toArray()

    return NextResponse.json({ topicos })
  } catch (error) {
    console.error('Erro ao buscar tópicos:', error)
    return NextResponse.json({ error: 'Erro ao buscar tópicos' }, { status: 500 })
  }
}
