import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { BancoSubtopico, BancoSubtopicoComContagem } from '@/lib/types/banco-questoes'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const topicoId = searchParams.get('topicoId')

    const db = await getDb()

    const pipeline: any[] = []

    // Filtrar por tópico se fornecido
    if (topicoId) {
      pipeline.push({
        $match: { topicoId: new ObjectId(topicoId) }
      })
    }

    // Adicionar lookups e contagens
    pipeline.push(
      {
        $lookup: {
          from: 'banco_questoes',
          localField: '_id',
          foreignField: 'subtopicoid',
          as: 'questoes'
        }
      },
      {
        $lookup: {
          from: 'banco_topicos',
          localField: 'topicoId',
          foreignField: '_id',
          as: 'topico'
        }
      },
      {
        $addFields: {
          totalQuestoes: { $size: '$questoes' },
          topicoNome: { $arrayElemAt: ['$topico.nome', 0] }
        }
      },
      {
        $project: {
          questoes: 0,
          topico: 0
        }
      },
      { $sort: { ordem: 1 } }
    )

    const subtopicos = await db.collection<BancoSubtopico>('banco_subtopicos')
      .aggregate<BancoSubtopicoComContagem>(pipeline)
      .toArray()

    return NextResponse.json({ subtopicos })
  } catch (error) {
    console.error('Erro ao buscar subtópicos:', error)
    return NextResponse.json({ error: 'Erro ao buscar subtópicos' }, { status: 500 })
  }
}
