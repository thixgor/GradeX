import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { User } from '@/lib/types'
import { BancoQuestao, BancoQuestaoComHierarquia } from '@/lib/types/banco-questoes'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const db = await getDb()

    // Verificar se usuário é premium ou admin
    const user = await db.collection<User>('users').findOne({ _id: new ObjectId(session.userId) })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const isAdmin = user.role === 'admin'
    const isPremiumOrTrial = user.accountType === 'premium' || user.accountType === 'trial'
    const isFreeUser = !isAdmin && !isPremiumOrTrial

    // Verificar acesso para usuários gratuitos
    if (isFreeUser) {
      // Verificar se a questão está na lista de questões permitidas para o usuário
      const freeQuestions = user.freeQuestionsByPeriod || {}
      const allAllowedQuestionIds = Object.values(freeQuestions).flat()

      if (!allAllowedQuestionIds.includes(id)) {
        return NextResponse.json({
          error: 'Acesso restrito a usuários Premium',
          requiresPremium: true
        }, { status: 403 })
      }
    }

    // Buscar questão com hierarquia
    const pipeline = [
      { $match: { _id: new ObjectId(id) } },
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
        $lookup: {
          from: 'banco_subtopicos',
          localField: 'subtopicoid',
          foreignField: '_id',
          as: 'subtopico'
        }
      },
      {
        $lookup: {
          from: 'banco_resolucoes',
          let: { questaoId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$questaoId', '$$questaoId'] },
                    { $eq: ['$userId', new ObjectId(session.userId)] }
                  ]
                }
              }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'resolucoes'
        }
      },
      {
        $addFields: {
          periodoNome: { $arrayElemAt: ['$periodo.nome', 0] },
          moduloNome: { $arrayElemAt: ['$modulo.nome', 0] },
          topicoNome: { $arrayElemAt: ['$topico.nome', 0] },
          subtopicoNome: { $arrayElemAt: ['$subtopico.nome', 0] },
          jaResolvida: { $gt: [{ $size: '$resolucoes' }, 0] },
          ultimaResolucao: { $arrayElemAt: ['$resolucoes', 0] }
        }
      },
      {
        $project: {
          periodo: 0,
          modulo: 0,
          topico: 0,
          subtopico: 0,
          resolucoes: 0
        }
      }
    ]

    const questoes = await db.collection<BancoQuestao>('banco_questoes')
      .aggregate<BancoQuestaoComHierarquia>(pipeline)
      .toArray()

    if (questoes.length === 0) {
      return NextResponse.json({ error: 'Questão não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ questao: questoes[0] })
  } catch (error) {
    console.error('Erro ao buscar questão:', error)
    return NextResponse.json({ error: 'Erro ao buscar questão' }, { status: 500 })
  }
}
