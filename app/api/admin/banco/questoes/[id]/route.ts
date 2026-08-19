import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { Db, ObjectId } from 'mongodb'
import { ehObjectId, lerQuestao, questaoDoBanco } from '@/lib/banco/questao-admin'
import { conferirHierarquia } from '@/lib/banco/questao-hierarquia'

export const dynamic = 'force-dynamic'

/**
 * A questão com os nomes da hierarquia já resolvidos.
 *
 * A mesma leitura serve ao GET e à resposta do PUT: depois de salvar, a tela
 * precisa da linha atualizada (o caminho mudou? o tipo mudou?) e recarregar a
 * página inteira para descobrir isso é uma viagem a mais por edição.
 */
async function lerQuestaoComHierarquia(db: Db, id: ObjectId) {
  const resultado = await db
    .collection('banco_questoes')
    .aggregate([
      { $match: { _id: id } },
      { $lookup: { from: 'banco_modulos', localField: 'moduloId', foreignField: '_id', as: 'modulo' } },
      { $lookup: { from: 'banco_topicos', localField: 'topicoId', foreignField: '_id', as: 'topico' } },
      {
        $lookup: {
          from: 'banco_subtopicos',
          // `subtopicoid` — minúsculo no fim. É o nome no banco desde a
          // primeira versão; ver lib/banco/questao-admin.ts.
          localField: 'subtopicoid',
          foreignField: '_id',
          as: 'subtopico',
        },
      },
      {
        $addFields: {
          moduloNome: { $arrayElemAt: ['$modulo.nome', 0] },
          topicoNome: { $arrayElemAt: ['$topico.nome', 0] },
          subtopicoNome: { $arrayElemAt: ['$subtopico.nome', 0] },
        },
      },
      { $project: { modulo: 0, topico: 0, subtopico: 0 } },
    ])
    .toArray()

  return resultado[0] || null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = await params

    if (!ehObjectId(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const db = await getDb()
    const questao = await lerQuestaoComHierarquia(db, new ObjectId(id))

    if (!questao) {
      return NextResponse.json({ error: 'Questão não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ questao })
  } catch (error) {
    console.error('Erro ao buscar questão:', error)
    return NextResponse.json({ error: 'Erro ao buscar questão' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = await params

    if (!ehObjectId(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const corpo = await request.json().catch(() => null)
    const db = await getDb()

    const atual = await db.collection('banco_questoes').findOne({ _id: new ObjectId(id) })
    if (!atual) {
      return NextResponse.json({ error: 'Questão não encontrada' }, { status: 404 })
    }

    // O corpo é misturado ao que já está gravado e a questão INTEIRA é
    // validada. Antes cada campo era conferido isoladamente e escrito na hora:
    // um id malformado só explodia no `new ObjectId`, dentro do `catch` geral,
    // e virava "Erro ao atualizar questão" sem dizer qual campo.
    const leitura = lerQuestao(corpo, questaoDoBanco(atual))
    if (!leitura.ok) {
      return NextResponse.json({ error: leitura.erro, campo: leitura.campo }, { status: 400 })
    }
    const questao = leitura.questao

    const hierarquia = await conferirHierarquia(db, questao)
    if (!hierarquia.ok) {
      return NextResponse.json(
        { error: hierarquia.erro, campo: hierarquia.campo },
        { status: hierarquia.status },
      )
    }

    await db.collection('banco_questoes').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          tipo: questao.tipo,
          moduloId: new ObjectId(questao.moduloId),
          topicoId: new ObjectId(questao.topicoId),
          subtopicoid: questao.subtopicoId ? new ObjectId(questao.subtopicoId) : null,
          enunciado: questao.enunciado,
          explicacao: questao.explicacao,
          imagemUrl: questao.imagemUrl,
          alternativas: questao.alternativas,
          respostaModelo: questao.respostaModelo,
          dificuldade: questao.dificuldade,
          tags: questao.tags,
          fonte: questao.fonte,
          ano: questao.ano,
          updatedAt: new Date(),
        },
      },
    )

    const atualizada = await lerQuestaoComHierarquia(db, new ObjectId(id))

    return NextResponse.json({ sucesso: true, questao: atualizada })
  } catch (error) {
    console.error('Erro ao atualizar questão:', error)
    return NextResponse.json({ error: 'Erro ao atualizar questão' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = await params

    if (!ehObjectId(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const db = await getDb()

    // Remover questão das listas de usuários
    await db.collection('banco_listas_usuario').updateMany(
      {},
      { $pull: { questaoIds: new ObjectId(id) } as any }
    )

    // Remover resoluções
    await db.collection('banco_resolucoes').deleteMany({
      questaoId: new ObjectId(id)
    })

    // Excluir questão
    const result = await db.collection('banco_questoes').deleteOne({
      _id: new ObjectId(id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Questão não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ sucesso: true })
  } catch (error) {
    console.error('Erro ao excluir questão:', error)
    return NextResponse.json({ error: 'Erro ao excluir questão' }, { status: 500 })
  }
}
