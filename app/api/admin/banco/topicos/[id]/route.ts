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

    if (body.moduloId !== undefined) {
      updateData.moduloId = new ObjectId(body.moduloId)
    }

    const result = await db.collection('banco_topicos').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Tópico não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ sucesso: true })
  } catch (error) {
    console.error('Erro ao atualizar tópico:', error)
    return NextResponse.json({ error: 'Erro ao atualizar tópico' }, { status: 500 })
  }
}

/**
 * Excluir um tópico.
 *
 * Mesma história do módulo (ver ../../modulos/[id]/route.ts): a rota só aceitava
 * apagar tópico vazio, e o `?cascata=true` que destravava o resto não era
 * mandado por tela nenhuma. Com a confirmação da tela de hierarquia, o tópico
 * cai com os subtópicos e as questões dele.
 *
 * A questão não sobrevive à perda do tópico: `topicoId` é obrigatório e todo
 * filtro do banco passa por ele. Uma questão sem tópico continuaria ocupando
 * espaço sem aparecer em lugar nenhum — nem na lista do admin, nem na busca do
 * aluno. Por isso aqui é exclusão, e não desvínculo (o subtópico, que é
 * opcional, se comporta ao contrário).
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
    const topicoId = new ObjectId(id)

    const topico = await db.collection('banco_topicos').findOne({ _id: topicoId })
    if (!topico) {
      return NextResponse.json({ error: 'Tópico não encontrado' }, { status: 404 })
    }

    const questoesVinculadas = await db.collection('banco_questoes').countDocuments({ topicoId })
    const subtopicosVinculados = await db.collection('banco_subtopicos').countDocuments({ topicoId })

    if (!cascata && (questoesVinculadas > 0 || subtopicosVinculados > 0)) {
      return NextResponse.json(
        {
          error: 'Existem itens vinculados a este tópico',
          precisaCascata: true,
          detalhes: {
            questoes: questoesVinculadas,
            subtopicos: subtopicosVinculados,
          },
          mensagem: `Este tópico tem ${subtopicosVinculados} subtópico(s) e ${questoesVinculadas} questão(ões). Confirme para excluir tudo.`,
        },
        { status: 409 },
      )
    }

    const removidas = cascata
      ? await removerQuestoes(db, { topicoId })
      : { questoes: 0, resolucoes: 0, listas: 0, relatos: 0, saldos: 0 }

    if (cascata) {
      await db.collection('banco_subtopicos').deleteMany({ topicoId })
    }

    await db.collection('banco_topicos').deleteOne({ _id: topicoId })

    console.warn(
      `[banco] Admin ${session.userId} excluiu o tópico "${topico.nome}" ` +
        `(${removidas.questoes} questões, ${subtopicosVinculados} subtópicos)`,
    )

    return NextResponse.json({
      sucesso: true,
      excluidos: {
        questoes: removidas.questoes,
        subtopicos: cascata ? subtopicosVinculados : 0,
        resolucoes: removidas.resolucoes,
        listas: removidas.listas,
      },
    })
  } catch (error) {
    console.error('Erro ao excluir tópico:', error)
    return NextResponse.json({ error: 'Erro ao excluir tópico' }, { status: 500 })
  }
}
