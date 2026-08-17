import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { BancoQuestao, BancoQuestaoComHierarquia, BancoQuestaoFormData } from '@/lib/types/banco-questoes'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)

    // Filtros
    const periodoId = searchParams.get('periodoId')
    const moduloId = searchParams.get('moduloId')
    const topicoId = searchParams.get('topicoId')
    const tipo = searchParams.get('tipo')
    const dificuldade = searchParams.get('dificuldade')
    const busca = searchParams.get('busca')

    // Paginação
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const skip = (page - 1) * limit

    const db = await getDb()

    const matchStage: any = {}

    if (periodoId) matchStage.periodoId = new ObjectId(periodoId)
    if (moduloId) matchStage.moduloId = new ObjectId(moduloId)
    if (topicoId) matchStage.topicoId = new ObjectId(topicoId)
    if (tipo) matchStage.tipo = tipo
    if (dificuldade) matchStage.dificuldade = dificuldade
    if (busca) matchStage.enunciado = { $regex: busca, $options: 'i' }

    const pipeline = [
      { $match: matchStage },
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
          topicoNome: { $arrayElemAt: ['$topico.nome', 0] }
        }
      },
      {
        $project: {
          periodo: 0,
          modulo: 0,
          topico: 0
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]

    const questoes = await db.collection<BancoQuestao>('banco_questoes')
      .aggregate<BancoQuestaoComHierarquia>(pipeline)
      .toArray()

    const total = await db.collection('banco_questoes').countDocuments(matchStage)

    return NextResponse.json({
      questoes,
      paginacao: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar questões:', error)
    return NextResponse.json({ error: 'Erro ao buscar questões' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body: BancoQuestaoFormData = await request.json()

    // Validações
    if (!body.tipo || !['objetiva', 'discursiva'].includes(body.tipo)) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
    }

    // Período saiu da hierarquia (ver lib/banco/hierarquia.ts): módulo é o topo.
    if (!body.moduloId || !body.topicoId) {
      return NextResponse.json({ error: 'Módulo e tópico são obrigatórios' }, { status: 400 })
    }

    if (!body.enunciado || body.enunciado.trim() === '') {
      return NextResponse.json({ error: 'Enunciado é obrigatório' }, { status: 400 })
    }

    if (body.tipo === 'objetiva') {
      if (!body.alternativas || body.alternativas.length < 2) {
        return NextResponse.json({ error: 'Questões objetivas precisam de pelo menos 2 alternativas' }, { status: 400 })
      }

      const temCorreta = body.alternativas.some(alt => alt.correta)
      if (!temCorreta) {
        return NextResponse.json({ error: 'É necessário marcar uma alternativa como correta' }, { status: 400 })
      }
    }

    if (body.tipo === 'discursiva' && !body.respostaModelo) {
      return NextResponse.json({ error: 'Resposta modelo é obrigatória para questões discursivas' }, { status: 400 })
    }

    const db = await getDb()

    // Verificar se hierarquia existe
    const modulo = await db.collection('banco_modulos').findOne({ _id: new ObjectId(body.moduloId) })
    if (!modulo) {
      return NextResponse.json({ error: 'Módulo não encontrado' }, { status: 404 })
    }

    const topico = await db.collection('banco_topicos').findOne({ _id: new ObjectId(body.topicoId) })
    if (!topico) {
      return NextResponse.json({ error: 'Tópico não encontrado' }, { status: 404 })
    }

    const novaQuestao: Omit<BancoQuestao, '_id'> = {
      tipo: body.tipo,
      // Só é gravado quando vier: questão nova não tem período nenhum.
      ...(body.periodoId ? { periodoId: new ObjectId(body.periodoId) } : {}),
      moduloId: new ObjectId(body.moduloId),
      topicoId: new ObjectId(body.topicoId),
      subtopicoid: body.subtopicoId ? new ObjectId(body.subtopicoId) : undefined,
      enunciado: body.enunciado.trim(),
      explicacao: body.explicacao?.trim() || undefined,
      imagemUrl: body.imagemUrl?.trim() || undefined,
      alternativas: body.tipo === 'objetiva' ? body.alternativas : undefined,
      respostaModelo: body.tipo === 'discursiva' ? body.respostaModelo?.trim() : undefined,
      dificuldade: body.dificuldade || undefined,
      tags: body.tags || undefined,
      fonte: body.fonte?.trim() || undefined,
      ano: body.ano || undefined,
      totalRespostas: 0,
      totalAcertos: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: new ObjectId(session.userId)
    }

    const result = await db.collection('banco_questoes').insertOne(novaQuestao)

    return NextResponse.json({
      sucesso: true,
      questao: { ...novaQuestao, _id: result.insertedId }
    })
  } catch (error) {
    console.error('Erro ao criar questão:', error)
    return NextResponse.json({ error: 'Erro ao criar questão' }, { status: 500 })
  }
}
