import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { colecaoDeGrupos, colecaoDeProvas } from '@/lib/provas/colecoes'
import { ObjectId } from 'mongodb'
import { isValidObjectId } from '@/lib/api-security'
import { podeMoverProva } from '@/lib/provas/mover-provas'
import type { GrupoNaArvore } from '@/lib/provas/arvore-grupos'

export const dynamic = 'force-dynamic'

/** Teto por chamada. Alto o bastante para um período inteiro, baixo o bastante para não virar uma escrita de banco sem fim. */
const MAXIMO_POR_LEVA = 200

/**
 * Mover VÁRIAS provas para um grupo de uma vez.
 *
 * Organizar um curso é mover dezenas de provas para o mesmo lugar. Uma
 * requisição por prova fazia disso dezenas de idas ao servidor e um estado
 * intermediário em que metade já mudou — se a rede cai no meio, ninguém sabe
 * onde parou.
 *
 * A permissão continua sendo decidida PROVA A PROVA. Uma decisão só para a
 * leva inteira deixaria uma prova de grupo geral entrar junto na seleção de um
 * usuário comum sem ninguém notar. As recusadas voltam nomeadas na resposta,
 * porque um lote que move 38 de 40 e não diz nada é pior do que um erro.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const groupId = body?.groupId ? String(body.groupId) : null
    const brutos: unknown[] = Array.isArray(body?.examIds) ? body.examIds : []

    const examIds = Array.from(
      new Set(brutos.map((i) => String(i)).filter(isValidObjectId)),
    ).slice(0, MAXIMO_POR_LEVA)

    if (examIds.length === 0) {
      return NextResponse.json({ error: 'Nenhuma prova válida informada' }, { status: 400 })
    }
    if (groupId && !isValidObjectId(groupId)) {
      return NextResponse.json({ error: 'Grupo inválido' }, { status: 400 })
    }

    // Provas e grupos vivem em bancos diferentes (ver lib/provas/colecoes.ts).
    // Pegar os grupos do banco errado não dá erro: a busca volta vazia e a rota
    // responde "Grupo não encontrado" para um grupo que está na tela.
    const [examsCollection, groupsCollection] = await Promise.all([
      colecaoDeProvas(),
      colecaoDeGrupos(),
    ])

    const [provas, todosGrupos] = await Promise.all([
      examsCollection
        .find({ _id: { $in: examIds.map((i) => new ObjectId(i)) } as any })
        .project({ groupId: 1, createdBy: 1, isPersonalExam: 1 })
        .toArray(),
      groupsCollection.find({}).project({ name: 1, type: 1, createdBy: 1, parentGroupId: 1 }).toArray(),
    ])

    const porGrupoId = new Map<string, GrupoNaArvore>(
      todosGrupos.map((g: any) => [
        String(g._id),
        {
          _id: String(g._id),
          name: g.name,
          type: g.type,
          createdBy: g.createdBy,
          parentGroupId: g.parentGroupId ? String(g.parentGroupId) : null,
        },
      ]),
    )

    if (groupId && !porGrupoId.has(groupId)) {
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })
    }
    const destino = groupId ? porGrupoId.get(groupId)! : null
    const usuario = { id: session.userId, ehAdmin: session.role === 'admin' }

    const permitidas: ObjectId[] = []
    const recusadas: Array<{ examId: string; motivo: string }> = []

    for (const prova of provas) {
      const atual = prova.groupId ? porGrupoId.get(String(prova.groupId)) : null
      const veredito = podeMoverProva(prova as any, atual, destino, usuario)
      if (veredito.ok) permitidas.push(prova._id as ObjectId)
      else recusadas.push({ examId: String(prova._id), motivo: veredito.motivo || 'Sem permissão' })
    }

    // Provas que sumiram entre a tela e o servidor: a seleção do admin pode ser
    // mais velha do que o banco, e isso não é motivo para falhar a leva toda.
    const encontradas = new Set(provas.map((p) => String(p._id)))
    for (const id of examIds) {
      if (!encontradas.has(id)) recusadas.push({ examId: id, motivo: 'Prova não encontrada' })
    }

    if (permitidas.length > 0) {
      await examsCollection.updateMany(
        { _id: { $in: permitidas } as any },
        { $set: { groupId: groupId || null, updatedAt: new Date() } },
      )
    }

    return NextResponse.json({
      success: true,
      movidas: permitidas.map((i) => String(i)),
      recusadas,
    })
  } catch (error: any) {
    console.error('Erro ao mover provas:', error)
    return NextResponse.json({ error: 'Erro ao mover provas' }, { status: 500 })
  }
}
