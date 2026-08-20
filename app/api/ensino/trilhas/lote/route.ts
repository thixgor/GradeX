import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { COLECOES } from '@/lib/ensino/compatibilidade'
import { podeEditarEnsino } from '@/lib/ensino/repositorio'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Exclusão em massa de Trilhas (§1, §6).
 *
 * Espelha `/api/aulas/lote`, mas é mais simples do que ela: apagar uma Trilha
 * nunca apaga aula nenhuma — a Trilha é só uma sequência de referências, e as
 * aulas que ela apontava continuam existindo em qualquer outro lugar que as
 * use (§1). Não há progresso, anotação nem vínculo de conteúdo para limpar;
 * só o próprio documento da Trilha e o estado de quem a tinha começado
 * (`ensino_trilha_estado`).
 *
 * `confirmar: true` é obrigatório pelo mesmo motivo da rota de aulas: é o
 * único ponto que destrói dado de verdade, e um clique de "selecionar todas"
 * feito sem querer não pode apagar o trabalho de semanas sozinho.
 */
export async function POST(request: Request) {
  try {
    const db = await getDb()
    const sessao = await getSession()
    if (!(await podeEditarEnsino(db, sessao as any))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const corpo = await request.json().catch(() => ({}))
    if (corpo?.confirmar !== true) {
      return NextResponse.json({ error: 'Confirme a exclusão para prosseguir.' }, { status: 428 })
    }

    const ids = Array.isArray(corpo?.ids) ? corpo.ids : []
    const objectIds = ids.filter((id: unknown) => typeof id === 'string' && ObjectId.isValid(id))
      .map((id: string) => new ObjectId(id))

    if (objectIds.length === 0) {
      return NextResponse.json({ error: 'Nenhuma Trilha válida selecionada' }, { status: 400 })
    }

    const r = await db.collection(COLECOES.trilhas).deleteMany({ _id: { $in: objectIds } as any })
    await db
      .collection(COLECOES.trilhaEstado)
      .deleteMany({ trilhaId: { $in: objectIds.map((id: ObjectId) => String(id)) } })

    return NextResponse.json({ success: true, afetadas: r.deletedCount })
  } catch (erro) {
    console.error('[ensino/trilhas/lote] POST:', erro)
    return NextResponse.json({ error: 'Erro ao excluir as Trilhas' }, { status: 500 })
  }
}
