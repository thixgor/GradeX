import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { User } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()

    // Verificar se usuário é premium ou admin
    const user = await db.collection<User>('users').findOne({ _id: new ObjectId(session.userId) })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    if (user.role !== 'admin' && user.accountType !== 'premium') {
      return NextResponse.json({
        error: 'Acesso restrito a usuários Premium',
        requiresPremium: true
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const skip = (page - 1) * limit

    // Filtros opcionais
    const tipo = searchParams.get('tipo')
    const apenasCorretas = searchParams.get('apenasCorretas') === 'true'
    const apenasErradas = searchParams.get('apenasErradas') === 'true'

    const matchStage: any = {
      userId: new ObjectId(session.userId)
    }

    if (tipo) {
      matchStage.tipo = tipo
    }
    if (apenasCorretas) {
      matchStage.correta = true
    }
    if (apenasErradas) {
      matchStage.correta = false
    }

    // Contar total
    const total = await db.collection('banco_resolucoes').countDocuments(matchStage)

    // Buscar resoluções com dados da questão
    const historico = await db.collection('banco_resolucoes')
      .aggregate([
        { $match: matchStage },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'banco_questoes',
            localField: 'questaoId',
            foreignField: '_id',
            as: 'questao'
          }
        },
        {
          $lookup: {
            from: 'banco_periodos',
            let: { periodoId: { $arrayElemAt: ['$questao.periodoId', 0] } },
            pipeline: [
              { $match: { $expr: { $eq: ['$_id', '$$periodoId'] } } }
            ],
            as: 'periodo'
          }
        },
        {
          $addFields: {
            questao: { $arrayElemAt: ['$questao', 0] },
            periodoNome: { $arrayElemAt: ['$periodo.nome', 0] }
          }
        },
        {
          $project: {
            periodo: 0,
            'questao.alternativas': 0,
            'questao.explicacao': 0,
            'questao.respostaModelo': 0
          }
        }
      ])
      .toArray()

    return NextResponse.json({
      historico,
      paginacao: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar histórico:', error)
    return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 })
  }
}
