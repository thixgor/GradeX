import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { COLECOES } from '@/lib/ensino/compatibilidade'
import { podeEditarEnsino } from '@/lib/ensino/repositorio'
import { validarPublicacao } from '@/lib/ensino/trilha'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Ações em massa sobre Trilhas (§1, §6).
 *
 * Espelha `/api/aulas/lote`. A exclusão é mais simples do que a de lá: apagar
 * uma Trilha nunca apaga aula nenhuma — a Trilha é só uma sequência de
 * referências, e as aulas que ela apontava continuam existindo em qualquer
 * outro lugar que as use (§1). Não há progresso, anotação nem vínculo de
 * conteúdo para limpar; só o próprio documento da Trilha e o estado de quem a
 * tinha começado (`ensino_trilha_estado`).
 *
 * `confirmar: true` é obrigatório para excluir, pelo mesmo motivo da rota de
 * aulas: é o único ponto que destrói dado de verdade, e um clique de
 * "selecionar todas" feito sem querer não pode apagar o trabalho de semanas
 * sozinho.
 *
 * PUBLICAR EM LOTE NÃO IGNORA A VALIDAÇÃO
 *
 * A publicação de uma Trilha isolada (`PATCH /api/ensino/trilhas/[id]`) recusa
 * quem não tem título ou nenhuma aula — ver `validarPublicacao` em
 * `lib/ensino/trilha.ts`. Selecionar "todas" e publicar não pode ser um jeito
 * de contornar essa regra: as Trilhas que ainda não têm o que o aluno vai abrir
 * ficam de fora, e a resposta diz quais foram, em vez de publicar um caminho
 * vazio silenciosamente.
 */
export async function POST(request: Request) {
  try {
    const db = await getDb()
    const sessao = await getSession()
    if (!(await podeEditarEnsino(db, sessao as any))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const corpo = await request.json().catch(() => ({}))
    const acao =
      corpo?.acao === 'publicar' || corpo?.acao === 'despublicar' ? corpo.acao : 'excluir'

    const ids = Array.isArray(corpo?.ids) ? corpo.ids : []
    const objectIds = ids
      .filter((id: unknown) => typeof id === 'string' && ObjectId.isValid(id))
      .map((id: string) => new ObjectId(id))

    if (objectIds.length === 0) {
      return NextResponse.json({ error: 'Nenhuma Trilha válida selecionada' }, { status: 400 })
    }

    if (acao === 'excluir') {
      if (corpo?.confirmar !== true) {
        return NextResponse.json({ error: 'Confirme a exclusão para prosseguir.' }, { status: 428 })
      }
      const r = await db.collection(COLECOES.trilhas).deleteMany({ _id: { $in: objectIds } as any })
      await db
        .collection(COLECOES.trilhaEstado)
        .deleteMany({ trilhaId: { $in: objectIds.map((id: ObjectId) => String(id)) } })
      return NextResponse.json({ success: true, afetadas: r.deletedCount })
    }

    if (acao === 'despublicar') {
      const r = await db
        .collection(COLECOES.trilhas)
        .updateMany(
          { _id: { $in: objectIds } as any },
          { $set: { situacao: 'rascunho', atualizadoEm: new Date() } },
        )
      return NextResponse.json({ success: true, afetadas: r.modifiedCount })
    }

    // acao === 'publicar'
    const candidatas = await db
      .collection(COLECOES.trilhas)
      .find(
        { _id: { $in: objectIds } as any },
        { projection: { titulo: 1, etapas: 1, publicadaEm: 1 } },
      )
      .toArray()

    const agora = new Date()
    const prontas = candidatas.filter((t: any) => validarPublicacao(t).length === 0)
    const semConteudo = candidatas
      .filter((t: any) => validarPublicacao(t).length > 0)
      .map((t: any) => t.titulo || 'Sem título')

    if (prontas.length > 0) {
      // `publicadaEm` é por documento — quem já tinha data mantém a original —
      // então só o `bulkWrite` escreve isso numa única ida ao banco.
      await db.collection(COLECOES.trilhas).bulkWrite(
        prontas.map((t: any) => ({
          updateOne: {
            filter: { _id: t._id },
            update: {
              $set: { situacao: 'publicada', publicadaEm: t.publicadaEm || agora, atualizadoEm: agora },
            },
          },
        })),
      )
    }

    return NextResponse.json({ success: true, afetadas: prontas.length, ignoradas: semConteudo })
  } catch (erro) {
    console.error('[ensino/trilhas/lote] POST:', erro)
    return NextResponse.json({ error: 'Erro ao aplicar a ação' }, { status: 500 })
  }
}
