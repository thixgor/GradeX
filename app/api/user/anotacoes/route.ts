import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// Interface para Anotacao
interface Anotacao {
  _id?: ObjectId
  userId: ObjectId
  questaoId: string // ID da questao (banco ou prova)
  tipoQuestao: 'banco' | 'prova' // origem da questao
  examId?: string // se for questao de prova
  // Conteudo da anotacao
  textoMarcado?: string // texto que o usuario marcou/selecionou
  nota?: string // anotacao do usuario
  cor?: string // cor do destaque (yellow, green, blue, pink)
  // Meta
  criadoEm: Date
  atualizadoEm: Date
}

// GET - Retornar anotacoes do usuario (filtrar por questaoId opcional via query param)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const anotacoesCollection = db.collection<Anotacao>('user_anotacoes')

    const { searchParams } = new URL(request.url)
    const questaoId = searchParams.get('questaoId')
    const tipoQuestao = searchParams.get('tipoQuestao')
    const examId = searchParams.get('examId')

    // Construir filtro
    const filter: Record<string, unknown> = {
      userId: new ObjectId(session.userId)
    }

    if (questaoId) {
      filter.questaoId = questaoId
    }

    if (tipoQuestao && (tipoQuestao === 'banco' || tipoQuestao === 'prova')) {
      filter.tipoQuestao = tipoQuestao
    }

    if (examId) {
      filter.examId = examId
    }

    // Buscar anotacoes
    const anotacoes = await anotacoesCollection
      .find(filter)
      .sort({ atualizadoEm: -1 })
      .toArray()

    return NextResponse.json({ anotacoes })
  } catch (error) {
    console.error('Get anotacoes error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar anotacoes' },
      { status: 500 }
    )
  }
}

// POST - Criar/atualizar anotacao (upsert por questaoId + userId)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { questaoId, tipoQuestao, examId, textoMarcado, nota, cor } = body

    // Validacoes
    if (!questaoId) {
      return NextResponse.json(
        { error: 'questaoId e obrigatorio' },
        { status: 400 }
      )
    }

    if (!tipoQuestao || (tipoQuestao !== 'banco' && tipoQuestao !== 'prova')) {
      return NextResponse.json(
        { error: 'tipoQuestao deve ser "banco" ou "prova"' },
        { status: 400 }
      )
    }

    if (tipoQuestao === 'prova' && !examId) {
      return NextResponse.json(
        { error: 'examId e obrigatorio para questoes de prova' },
        { status: 400 }
      )
    }

    // Validar cor se fornecida
    const coresValidas = ['yellow', 'green', 'blue', 'pink']
    if (cor && !coresValidas.includes(cor)) {
      return NextResponse.json(
        { error: 'Cor invalida. Use: yellow, green, blue ou pink' },
        { status: 400 }
      )
    }

    // Deve ter pelo menos textoMarcado ou nota
    if (!textoMarcado && !nota) {
      return NextResponse.json(
        { error: 'Deve fornecer textoMarcado ou nota' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const anotacoesCollection = db.collection<Anotacao>('user_anotacoes')

    const userId = new ObjectId(session.userId)
    const agora = new Date()

    // Preparar dados para upsert
    const updateData: Partial<Anotacao> = {
      atualizadoEm: agora
    }

    if (textoMarcado !== undefined) {
      updateData.textoMarcado = textoMarcado
    }

    if (nota !== undefined) {
      updateData.nota = nota
    }

    if (cor !== undefined) {
      updateData.cor = cor
    }

    if (examId) {
      updateData.examId = examId
    }

    // Upsert - atualiza se existir, cria se nao existir
    const result = await anotacoesCollection.findOneAndUpdate(
      {
        userId,
        questaoId,
        tipoQuestao
      },
      {
        $set: updateData,
        $setOnInsert: {
          userId,
          questaoId,
          tipoQuestao,
          criadoEm: agora
        }
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    )

    return NextResponse.json({
      message: 'Anotacao salva com sucesso',
      anotacao: result
    })
  } catch (error) {
    console.error('POST anotacao error:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar anotacao' },
      { status: 500 }
    )
  }
}

// DELETE - Remover anotacao (via query param ?questaoId=)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const questaoId = searchParams.get('questaoId')
    const tipoQuestao = searchParams.get('tipoQuestao')

    if (!questaoId) {
      return NextResponse.json(
        { error: 'questaoId e obrigatorio' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const anotacoesCollection = db.collection<Anotacao>('user_anotacoes')

    // Construir filtro
    const filter: Record<string, unknown> = {
      userId: new ObjectId(session.userId),
      questaoId
    }

    // Se tipoQuestao fornecido, incluir no filtro
    if (tipoQuestao && (tipoQuestao === 'banco' || tipoQuestao === 'prova')) {
      filter.tipoQuestao = tipoQuestao
    }

    const result = await anotacoesCollection.deleteOne(filter)

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Anotacao nao encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Anotacao removida com sucesso'
    })
  } catch (error) {
    console.error('DELETE anotacao error:', error)
    return NextResponse.json(
      { error: 'Erro ao remover anotacao' },
      { status: 500 }
    )
  }
}
