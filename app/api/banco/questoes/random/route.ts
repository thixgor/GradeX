import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

    const db = await getDb()

    // Build match stage from filters
    const matchStage: any = {}

    const periodoId = searchParams.get('periodoId')
    const moduloId = searchParams.get('moduloId')
    const topicoId = searchParams.get('topicoId')
    const subtopicoId = searchParams.get('subtopicoId')
    const tipo = searchParams.get('tipo')
    const dificuldade = searchParams.get('dificuldade')
    const anosParam = searchParams.get('anos')

    if (periodoId) matchStage.periodoId = new ObjectId(periodoId)
    if (moduloId) matchStage.moduloId = new ObjectId(moduloId)
    if (topicoId) matchStage.topicoId = new ObjectId(topicoId)
    if (subtopicoId) matchStage.subtopicoId = new ObjectId(subtopicoId)
    if (tipo) matchStage.tipo = tipo
    if (dificuldade) matchStage.dificuldade = dificuldade
    if (anosParam) {
      const anos = anosParam.split(',').map(Number).filter(n => !isNaN(n))
      if (anos.length > 0) matchStage.ano = { $in: anos }
    }

    // Only fetch objetiva questions (they have alternatives) unless explicitly filtered
    if (!tipo) {
      matchStage.tipo = 'objetiva'
    }

    const pipeline: any[] = [
      { $match: matchStage },
      { $sample: { size: limit } },
      {
        $lookup: {
          from: 'banco_periodos',
          localField: 'periodoId',
          foreignField: '_id',
          as: 'periodo'
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
        $lookup: {
          from: 'banco_topicos',
          localField: 'topicoId',
          foreignField: '_id',
          as: 'topico'
        }
      },
      {
        $addFields: {
          periodoNome: { $arrayElemAt: ['$periodo.nome', 0] },
          moduloNome: { $arrayElemAt: ['$modulo.nome', 0] },
          topicoNome: { $arrayElemAt: ['$topico.nome', 0] },
        }
      },
      {
        $project: {
          periodo: 0,
          modulo: 0,
          topico: 0,
        }
      }
    ]

    const rawQuestions = await db.collection('banco_questoes')
      .aggregate(pipeline)
      .toArray()

    // Transform to exam Question format
    const questions = rawQuestions.map((q, index) => ({
      id: q._id.toString(),
      number: index + 1,
      statement: q.enunciado,
      command: '',
      alternatives: (q.alternativas || []).map((alt: any) => ({
        id: `${q._id}-${alt.letra}`,
        letter: alt.letra,
        text: alt.texto,
        isCorrect: alt.correta,
      })),
      explanation: q.explicacao || '',
      origin: 'banco',
      sourceInfo: [q.periodoNome, q.moduloNome, q.topicoNome].filter(Boolean).join(' > '),
      ano: q.ano,
      dificuldade: q.dificuldade,
      imagemUrl: q.imagemUrl,
    }))

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Erro ao buscar questoes aleatorias:', error)
    return NextResponse.json({ error: 'Erro ao buscar questoes' }, { status: 500 })
  }
}
