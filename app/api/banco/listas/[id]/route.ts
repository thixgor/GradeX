import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { User } from '@/lib/types'
import { BancoListaUsuario, BancoQuestaoComHierarquia } from '@/lib/types/banco-questoes'
import { bancoLiberadoPeloPlano } from '@/lib/banco/acesso-servidor'

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

    if (!(await bancoLiberadoPeloPlano(db, user))) {
      return NextResponse.json({
        error: 'Acesso restrito a assinantes Plus+',
        requiresPlus: true
      }, { status: 403 })
    }

    // Buscar lista
    const lista = await db.collection<BancoListaUsuario>('banco_listas_usuario').findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(session.userId)
    })

    if (!lista) {
      return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 })
    }

    // Buscar questões da lista com hierarquia
    // Converter questaoIds para ObjectId (podem estar como strings)
    const questaoObjectIds = lista.questaoIds.map(qid =>
      typeof qid === 'string' ? new ObjectId(qid) : qid
    )

    const questoes = await db.collection('banco_questoes')
      .aggregate<BancoQuestaoComHierarquia>([
        { $match: { _id: { $in: questaoObjectIds } } },
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
        }
      ])
      .toArray()

    /*
     * A ordem devolvida é a da LISTA, não a do banco.
     *
     * `$match: { _id: { $in: [...] } }` devolve os documentos na ordem em que o
     * Mongo os encontra no índice — que não tem relação nenhuma com a ordem de
     * `questaoIds`. Para uma lista sorteada isso é o embaralhamento inteiro
     * jogado fora: a lista foi criada com uma ordem (ver a rota
     * `listas/aleatorias`), e a tela mostrava outra. Quem parava na questão 12
     * e voltava depois encontrava uma "questão 12" diferente — o relato de que
     * "se sai, perde a ordem".
     *
     * O reordenamento é feito aqui, em memória, e não com `$indexOfArray` no
     * pipeline: são no máximo algumas centenas de questões por lista, e um
     * passo a menos de agregação é um passo a menos para quebrar.
     */
    const posicaoNaLista = new Map(
      lista.questaoIds.map((qid, i) => [String(qid), i] as const),
    )
    questoes.sort(
      (a, b) =>
        (posicaoNaLista.get(String(a._id)) ?? Number.MAX_SAFE_INTEGER) -
        (posicaoNaLista.get(String(b._id)) ?? Number.MAX_SAFE_INTEGER),
    )

    return NextResponse.json({
      lista,
      questoes
    })
  } catch (error) {
    console.error('Erro ao buscar lista:', error)
    return NextResponse.json({ error: 'Erro ao buscar lista' }, { status: 500 })
  }
}

export async function PUT(
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

    if (!(await bancoLiberadoPeloPlano(db, user))) {
      return NextResponse.json({
        error: 'Acesso restrito a assinantes Plus+',
        requiresPlus: true
      }, { status: 403 })
    }

    // Verificar se lista existe e pertence ao usuário
    const listaExistente = await db.collection<BancoListaUsuario>('banco_listas_usuario').findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(session.userId)
    })

    if (!listaExistente) {
      return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 })
    }

    const body = await request.json()

    const updateData: any = {
      updatedAt: new Date()
    }

    if (body.nome !== undefined) {
      const nome = String(body.nome || '').slice(0, 100).trim()
      if (nome === '') {
        return NextResponse.json({ error: 'Nome da lista é obrigatório' }, { status: 400 })
      }
      updateData.nome = nome
    }

    if (body.questaoIds !== undefined) {
      updateData.questaoIds = body.questaoIds.map((qid: string) => new ObjectId(qid))
    }

    if (body.modoResposta === 'imediato' || body.modoResposta === 'final') {
      updateData.modoResposta = body.modoResposta
    }

    /*
     * Adicionar uma questão à lista.
     *
     * A tela sempre mandou `addQuestaoId`; esta rota só olhava
     * `adicionarQuestao`. O corpo caía no `else` lá embaixo, que grava apenas
     * `updatedAt` — a resposta era 200, a tela fechava o diálogo dizendo que
     * deu certo, e a questão nunca entrava na lista. Um erro que não parece
     * erro em lugar nenhum.
     *
     * Os dois nomes passam a valer: consertar só um lado deixaria a outra
     * ponta quebrada dependendo de quem chama.
     */
    const adicionar = body.addQuestaoId || body.adicionarQuestao
    const remover = body.removeQuestaoId || body.removerQuestao

    if (adicionar && ObjectId.isValid(String(adicionar))) {
      await db.collection('banco_listas_usuario').updateOne(
        { _id: new ObjectId(id) },
        {
          $addToSet: { questaoIds: new ObjectId(String(adicionar)) },
          $set: { updatedAt: new Date() }
        }
      )
    } else if (remover && ObjectId.isValid(String(remover))) {
      await db.collection('banco_listas_usuario').updateOne(
        { _id: new ObjectId(id) },
        {
          $pull: { questaoIds: new ObjectId(String(remover)) } as any,
          $set: { updatedAt: new Date() }
        }
      )
    } else {
      await db.collection('banco_listas_usuario').updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      )
    }

    return NextResponse.json({ sucesso: true })
  } catch (error) {
    console.error('Erro ao atualizar lista:', error)
    return NextResponse.json({ error: 'Erro ao atualizar lista' }, { status: 500 })
  }
}

export async function DELETE(
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

    if (!(await bancoLiberadoPeloPlano(db, user))) {
      return NextResponse.json({
        error: 'Acesso restrito a assinantes Plus+',
        requiresPlus: true
      }, { status: 403 })
    }

    const result = await db.collection('banco_listas_usuario').deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(session.userId)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ sucesso: true })
  } catch (error) {
    console.error('Erro ao excluir lista:', error)
    return NextResponse.json({ error: 'Erro ao excluir lista' }, { status: 500 })
  }
}
