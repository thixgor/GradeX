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

    /*
     * Mover o tópico para dentro de outro módulo — com os subtópicos e as
     * questões dele.
     *
     * O subtópico não precisa de nada: ele só guarda `topicoId`, então segue o
     * tópico automaticamente. A questão é diferente — `banco_questoes` grava
     * `moduloId` e `topicoId` os dois, direto no documento (é o que permite
     * filtrar por módulo sem um JOIN a cada busca). Sem este `updateMany`, a
     * árvore mostraria o tópico no módulo novo mas as questões dele ainda
     * contariam para o módulo antigo — um total que não bate em nenhum dos
     * dois lugares.
     */
    let moduloDestino: { _id: ObjectId; nome: string } | null = null
    if (body.moduloId !== undefined) {
      if (!ObjectId.isValid(String(body.moduloId))) {
        return NextResponse.json({ error: 'Módulo de destino inválido' }, { status: 400 })
      }
      const destino = await db
        .collection('banco_modulos')
        .findOne({ _id: new ObjectId(String(body.moduloId)) }, { projection: { nome: 1 } })
      if (!destino) {
        return NextResponse.json({ error: 'Módulo de destino não encontrado' }, { status: 404 })
      }
      moduloDestino = { _id: destino._id, nome: destino.nome }
      updateData.moduloId = destino._id
    }

    const result = await db.collection('banco_topicos').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Tópico não encontrado' }, { status: 404 })
    }

    let questoesMovidas = 0
    if (moduloDestino) {
      const cascata = await db
        .collection('banco_questoes')
        .updateMany(
          { topicoId: new ObjectId(id) },
          { $set: { moduloId: moduloDestino._id, updatedAt: new Date() } },
        )
      questoesMovidas = cascata.modifiedCount || 0
    }

    return NextResponse.json({ sucesso: true, questoesMovidas })
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
