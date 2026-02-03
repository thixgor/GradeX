import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { User } from '@/lib/types'
import { BancoListaUsuario, BancoQuestaoComHierarquia } from '@/lib/types/banco-questoes'

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

    if (user.role !== 'admin' && user.accountType !== 'premium') {
      return NextResponse.json({
        error: 'Acesso restrito a usuários Premium',
        requiresPremium: true
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

    if (user.role !== 'admin' && user.accountType !== 'premium') {
      return NextResponse.json({
        error: 'Acesso restrito a usuários Premium',
        requiresPremium: true
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
      if (body.nome.trim() === '') {
        return NextResponse.json({ error: 'Nome da lista é obrigatório' }, { status: 400 })
      }
      updateData.nome = body.nome.trim()
    }

    if (body.questaoIds !== undefined) {
      updateData.questaoIds = body.questaoIds.map((qid: string) => new ObjectId(qid))
    }

    // Se está adicionando uma questão específica
    if (body.adicionarQuestao) {
      await db.collection('banco_listas_usuario').updateOne(
        { _id: new ObjectId(id) },
        {
          $addToSet: { questaoIds: new ObjectId(body.adicionarQuestao) },
          $set: { updatedAt: new Date() }
        }
      )
    } else if (body.removerQuestao) {
      await db.collection('banco_listas_usuario').updateOne(
        { _id: new ObjectId(id) },
        {
          $pull: { questaoIds: new ObjectId(body.removerQuestao) } as any,
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

    if (user.role !== 'admin' && user.accountType !== 'premium') {
      return NextResponse.json({
        error: 'Acesso restrito a usuários Premium',
        requiresPremium: true
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
