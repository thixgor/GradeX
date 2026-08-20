import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ehObjectId } from '@/lib/banco/questao-admin'

export const dynamic = 'force-dynamic'

/** Ids por operação, como no resto do módulo de banco — ver TAMANHO_DO_LOTE em importar/route.ts. */
const TAMANHO_DO_LOTE = 500

/**
 * Apaga todas as questões de UMA leva de importação (ver GET .../historico).
 *
 * Mesma limpeza de referências que a exclusão de uma questão avulsa faz
 * (app/api/admin/banco/questoes/[id]/route.ts), só que para o conjunto
 * inteiro da leva de uma vez: tira as questões das listas de usuário e apaga
 * as resoluções, para não sobrar histórico ou lista apontando para questão
 * que não existe mais.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = await params
    if (!ehObjectId(id)) {
      return NextResponse.json({ error: 'Leva inválida' }, { status: 400 })
    }
    const loteImportacaoId = new ObjectId(id)

    const db = await getDb()

    const questoes = await db
      .collection('banco_questoes')
      .find({ loteImportacaoId }, { projection: { _id: 1 } })
      .toArray()

    if (questoes.length === 0) {
      return NextResponse.json({ error: 'Nenhuma questão encontrada nesta leva' }, { status: 404 })
    }

    const ids = questoes.map((q) => q._id as ObjectId)

    for (let i = 0; i < ids.length; i += TAMANHO_DO_LOTE) {
      const fatia = ids.slice(i, i + TAMANHO_DO_LOTE)
      await db
        .collection('banco_listas_usuario')
        .updateMany({}, { $pull: { questaoIds: { $in: fatia } } } as any)
      await db.collection('banco_resolucoes').deleteMany({ questaoId: { $in: fatia } })
    }

    const apagadas = await db.collection('banco_questoes').deleteMany({ loteImportacaoId })

    console.warn(
      `[banco] Admin ${session.userId} apagou a leva de importação ${id}: ${apagadas.deletedCount} questões`,
    )

    return NextResponse.json({ sucesso: true, questoesApagadas: apagadas.deletedCount || 0 })
  } catch (error) {
    console.error('Erro ao apagar leva de importação:', error)
    return NextResponse.json({ error: 'Erro ao apagar leva de importação' }, { status: 500 })
  }
}
