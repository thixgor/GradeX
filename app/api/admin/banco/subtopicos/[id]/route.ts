import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { removerQuestoes } from '@/lib/banco/exclusao'

export const dynamic = 'force-dynamic'

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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await request.json()
    const db = await getDb()

    const updateData: any = {
      updatedAt: new Date()
    }

    if (body.nome !== undefined) {
      if (body.nome.trim() === '') {
        return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
      }
      updateData.nome = body.nome.trim()
    }

    if (body.codigo !== undefined) {
      updateData.codigo = body.codigo
    }

    if (body.ordem !== undefined) {
      updateData.ordem = body.ordem
    }

    if (body.topicoId !== undefined) {
      updateData.topicoId = new ObjectId(body.topicoId)
    }

    const result = await db.collection('banco_subtopicos').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Subtópico não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ sucesso: true })
  } catch (error) {
    console.error('Erro ao atualizar subtópico:', error)
    return NextResponse.json({ error: 'Erro ao atualizar subtópico' }, { status: 500 })
  }
}

/**
 * Excluir um subtópico.
 *
 * Antes, subtópico com questão dentro simplesmente não podia ser apagado: a
 * rota devolvia "Não é possível excluir: existem N questões vinculadas" e
 * acabava ali. Um subtópico criado com o nome errado numa importação ficava no
 * banco para sempre, e a única saída era editar questão por questão.
 *
 * O padrão agora é **desvincular**: as questões continuam existindo, no mesmo
 * módulo e no mesmo tópico, só sem o subtópico. Isso é possível aqui — e não
 * nos níveis de cima — porque `subtopicoid` é opcional: uma questão sem
 * subtópico continua aparecendo em todo filtro e em toda busca. Nada se perde.
 *
 * Quem quiser mesmo apagar as questões pede `?cascata=true`, e aí elas caem com
 * as resoluções e listas que apontavam para elas (ver lib/banco/exclusao.ts).
 */
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
    const { searchParams } = new URL(request.url)
    const cascata = searchParams.get('cascata') === 'true'

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const db = await getDb()
    const subtopicoid = new ObjectId(id)

    const subtopico = await db.collection('banco_subtopicos').findOne({ _id: subtopicoid })
    if (!subtopico) {
      return NextResponse.json({ error: 'Subtópico não encontrado' }, { status: 404 })
    }

    let questoesExcluidas = 0
    let questoesDesvinculadas = 0

    if (cascata) {
      questoesExcluidas = (await removerQuestoes(db, { subtopicoid })).questoes
    } else {
      const soltas = await db
        .collection('banco_questoes')
        .updateMany({ subtopicoid }, { $unset: { subtopicoid: '' }, $set: { updatedAt: new Date() } })
      questoesDesvinculadas = soltas.modifiedCount || 0
    }

    await db.collection('banco_subtopicos').deleteOne({ _id: subtopicoid })

    return NextResponse.json({
      sucesso: true,
      excluidos: { questoes: questoesExcluidas },
      questoesDesvinculadas,
    })
  } catch (error) {
    console.error('Erro ao excluir subtópico:', error)
    return NextResponse.json({ error: 'Erro ao excluir subtópico' }, { status: 500 })
  }
}
