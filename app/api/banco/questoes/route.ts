import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { User } from '@/lib/types'
import {
  BancoQuestao,
  BancoQuestaoComHierarquia,
  BancoQuestoesFiltros,
  BancoQuestoesResponse
} from '@/lib/types/banco-questoes'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se usuário é premium ou admin
    const db = await getDb()
    const user = await db.collection<User>('users').findOne({ _id: new ObjectId(session.userId) })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)

    // Verificar acesso premium (admin sempre tem acesso total)
    const periodoId = searchParams.get('periodoId')
    const isAdmin = user.role === 'admin'
    const isPremiumOrTrial = user.accountType === 'premium' || user.accountType === 'trial'

    // Usuários gratuitos podem ver até 5 questões FIXAS quando selecionam um período
    const isFreeUser = !isAdmin && !isPremiumOrTrial

    // Se for usuário gratuito SEM período selecionado, negar acesso
    if (isFreeUser && !periodoId) {
      return NextResponse.json({
        error: 'Acesso restrito a usuários Premium',
        requiresPremium: true
      }, { status: 403 })
    }

    // LÓGICA ESPECIAL PARA USUÁRIOS GRATUITOS: 5 questões fixas por período
    if (isFreeUser && periodoId) {
      // Verificar se já tem questões atribuídas para este período
      let assignedQuestionIds = user.freeQuestionsByPeriod?.[periodoId]

      if (!assignedQuestionIds || assignedQuestionIds.length === 0) {
        // Ainda não tem questões atribuídas - buscar 5 aleatórias e salvar permanentemente
        const randomQuestions = await db.collection<BancoQuestao>('banco_questoes')
          .aggregate([
            { $match: { periodoId: new ObjectId(periodoId) } },
            { $sample: { size: 5 } },
            { $project: { _id: 1 } }
          ])
          .toArray()

        if (randomQuestions.length < 5) {
          return NextResponse.json({
            error: 'Não há questões suficientes neste período',
            questoes: [],
            paginacao: { page: 1, limit: 5, total: 0, totalPages: 0 }
          })
        }

        // Salvar no perfil do usuário
        assignedQuestionIds = randomQuestions.map(q => q._id!.toString())
        await db.collection<User>('users').updateOne(
          { _id: new ObjectId(session.userId) },
          { $set: { [`freeQuestionsByPeriod.${periodoId}`]: assignedQuestionIds } }
        )
      }

      // Buscar as questões atribuídas
      const objectIds = assignedQuestionIds.map(id => new ObjectId(id))

      const pipeline: any[] = [
        { $match: { _id: { $in: objectIds } } },
        // Lookup para hierarquia
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
        // Lookup para resoluções do usuário
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

      return NextResponse.json({
        questoes,
        paginacao: {
          page: 1,
          limit: 5,
          total: questoes.length,
          totalPages: 1
        },
        isFreeUser: true // Flag para o frontend saber que é usuário gratuito
      })
    }

    // LÓGICA NORMAL PARA ADMIN E PREMIUM
    // Extrair filtros
    const filtros: BancoQuestoesFiltros = {
      periodoId: searchParams.get('periodoId') || undefined,
      moduloId: searchParams.get('moduloId') || undefined,
      topicoId: searchParams.get('topicoId') || undefined,
      subtopicoId: searchParams.get('subtopicoId') || undefined,
      tipo: searchParams.get('tipo') as BancoQuestoesFiltros['tipo'] || undefined,
      dificuldade: searchParams.get('dificuldade') as BancoQuestoesFiltros['dificuldade'] || undefined,
      apenasNaoResolvidas: searchParams.get('apenasNaoResolvidas') === 'true',
      busca: searchParams.get('busca') || undefined
    }

    // Parse anos param
    const anosParam = searchParams.get('anos')
    const anos = anosParam ? anosParam.split(',').map(Number).filter(n => !isNaN(n)) : undefined

    // Paginação
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const skip = (page - 1) * limit

    // Construir query
    const matchStage: any = {}

    if (filtros.periodoId) {
      matchStage.periodoId = new ObjectId(filtros.periodoId)
    }
    if (filtros.moduloId) {
      matchStage.moduloId = new ObjectId(filtros.moduloId)
    }
    if (filtros.topicoId) {
      matchStage.topicoId = new ObjectId(filtros.topicoId)
    }
    if (filtros.subtopicoId) {
      matchStage.subtopicoid = new ObjectId(filtros.subtopicoId)
    }
    if (filtros.tipo) {
      matchStage.tipo = filtros.tipo
    }
    if (filtros.dificuldade) {
      matchStage.dificuldade = filtros.dificuldade
    }
    if (filtros.busca) {
      matchStage.enunciado = { $regex: filtros.busca, $options: 'i' }
    }
    if (anos && anos.length > 0) {
      matchStage.ano = { $in: anos }
    }

    const pipeline: any[] = [
      { $match: matchStage },
      // Lookup para hierarquia
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
      // Lookup para resoluções do usuário
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

    // Filtrar apenas não resolvidas se solicitado
    if (filtros.apenasNaoResolvidas) {
      pipeline.push({
        $match: { jaResolvida: false }
      })
    }

    // Contar total
    const countPipeline = [...pipeline, { $count: 'total' }]
    const countResult = await db.collection<BancoQuestao>('banco_questoes')
      .aggregate(countPipeline)
      .toArray()
    const total = countResult[0]?.total || 0

    // Paginação
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    )

    const questoes = await db.collection<BancoQuestao>('banco_questoes')
      .aggregate<BancoQuestaoComHierarquia>(pipeline)
      .toArray()

    const response: BancoQuestoesResponse = {
      questoes,
      paginacao: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erro ao buscar questões:', error)
    return NextResponse.json({ error: 'Erro ao buscar questões' }, { status: 500 })
  }
}
