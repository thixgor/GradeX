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

    if (body.periodoId !== undefined) {
      updateData.periodoId = new ObjectId(body.periodoId)
    }

    const result = await db.collection('banco_modulos').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Módulo não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ sucesso: true })
  } catch (error) {
    console.error('Erro ao atualizar módulo:', error)
    return NextResponse.json({ error: 'Erro ao atualizar módulo' }, { status: 500 })
  }
}

/**
 * Excluir um módulo.
 *
 * ## O que estava quebrado
 *
 * Um módulo com qualquer coisa dentro era impossível de apagar. A rota recusava
 * com "Existem itens vinculados a este módulo" e só aceitava seguir com
 * `?cascata=true` — parâmetro que nenhuma tela mandava. Na prática, o botão de
 * excluir da tela de hierarquia funcionava apenas em módulo vazio, e o admin
 * ficava com módulos criados por engano (uma importação com o nome errado, por
 * exemplo) presos para sempre.
 *
 * Agora a tela mostra o que vai junto e manda `cascata=true` quando o admin
 * confirma. A recusa sem o parâmetro continua existindo, mas com 409 e a
 * contagem no corpo: é o que a tela usa para montar o aviso, não uma parede.
 *
 * ## O que "cascata" leva junto
 *
 * Tópicos, subtópicos e as questões do módulo — e, com elas, as resoluções, as
 * listas e o saldo gratuito que apontavam para essas questões
 * (ver lib/banco/exclusao.ts). Apagar a questão sem apagar essas referências
 * deixa histórico órfão e queima crédito de aluno.
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
    const moduloId = new ObjectId(id)

    const modulo = await db.collection('banco_modulos').findOne({ _id: moduloId })
    if (!modulo) {
      return NextResponse.json({ error: 'Módulo não encontrado' }, { status: 404 })
    }

    const topicos = await db
      .collection('banco_topicos')
      .find({ moduloId }, { projection: { _id: 1 } })
      .toArray()
    const topicoIds = topicos.map((t) => t._id)

    // A questão é do módulo por `moduloId`, mas dado antigo pode ter só o
    // tópico certo. Os dois caminhos entram no filtro para não sobrar questão
    // apontando para um tópico que acabou de deixar de existir.
    const filtroDasQuestoes =
      topicoIds.length > 0
        ? { $or: [{ moduloId }, { topicoId: { $in: topicoIds } }] }
        : { moduloId }

    const questoesVinculadas = await db.collection('banco_questoes').countDocuments(filtroDasQuestoes)
    const subtopicosVinculados =
      topicoIds.length > 0
        ? await db.collection('banco_subtopicos').countDocuments({ topicoId: { $in: topicoIds } })
        : 0

    if (!cascata && (questoesVinculadas > 0 || topicoIds.length > 0)) {
      return NextResponse.json(
        {
          error: 'Existem itens vinculados a este módulo',
          precisaCascata: true,
          detalhes: {
            questoes: questoesVinculadas,
            topicos: topicoIds.length,
            subtopicos: subtopicosVinculados,
          },
          mensagem: `Este módulo tem ${topicoIds.length} tópico(s) e ${questoesVinculadas} questão(ões). Confirme para excluir tudo.`,
        },
        { status: 409 },
      )
    }

    const removidas = cascata
      ? await removerQuestoes(db, filtroDasQuestoes)
      : { questoes: 0, resolucoes: 0, listas: 0, relatos: 0, saldos: 0 }

    if (cascata && topicoIds.length > 0) {
      await db.collection('banco_subtopicos').deleteMany({ topicoId: { $in: topicoIds } })
      await db.collection('banco_topicos').deleteMany({ moduloId })
    }

    await db.collection('banco_modulos').deleteOne({ _id: moduloId })

    console.warn(
      `[banco] Admin ${session.userId} excluiu o módulo "${modulo.nome}" ` +
        `(${removidas.questoes} questões, ${topicoIds.length} tópicos, ${subtopicosVinculados} subtópicos)`,
    )

    return NextResponse.json({
      sucesso: true,
      excluidos: {
        questoes: removidas.questoes,
        topicos: cascata ? topicoIds.length : 0,
        subtopicos: cascata ? subtopicosVinculados : 0,
        resolucoes: removidas.resolucoes,
        listas: removidas.listas,
      },
    })
  } catch (error) {
    console.error('Erro ao excluir módulo:', error)
    return NextResponse.json({ error: 'Erro ao excluir módulo' }, { status: 500 })
  }
}
