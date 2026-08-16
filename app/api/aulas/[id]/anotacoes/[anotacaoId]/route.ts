import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { isValidObjectId } from '@/lib/api-security'
import { normalizarAnotacao, type AnotacaoDaAula } from '@/lib/aulas/anotacoes'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const COLECAO = 'aulas_anotacoes'

/**
 * Editar e apagar uma anotação.
 *
 * O filtro carrega SEMPRE `usuarioId` da sessão junto do `_id`. É o que impede
 * alguém de editar a anotação de outra pessoa chutando IDs: um id que não seja
 * dono simplesmente não casa, e a resposta é 404 — sem confirmar que aquele
 * documento existe.
 */

function filtroDoDono(anotacaoId: string, usuarioId: string, aulaId: string) {
  return { _id: new ObjectId(anotacaoId) as any, usuarioId, aulaId }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; anotacaoId: string } },
) {
  try {
    if (!isValidObjectId(params.id) || !isValidObjectId(params.anotacaoId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    const session = await getSession()
    if (!session?.userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const dados = normalizarAnotacao(body as any)
    if (!dados) return NextResponse.json({ error: 'Escreva algo na anotação.' }, { status: 400 })

    const db = await getDb()
    const resultado = await db.collection<AnotacaoDaAula>(COLECAO).findOneAndUpdate(
      filtroDoDono(params.anotacaoId, session.userId, params.id),
      {
        $set: {
          conteudo: dados.conteudo,
          segundo: dados.segundo,
          destacada: dados.destacada,
          atualizadoEm: new Date(),
        },
      },
      { returnDocument: 'after' },
    )

    if (!resultado) return NextResponse.json({ error: 'Anotação não encontrada' }, { status: 404 })
    return NextResponse.json({ anotacao: resultado })
  } catch (error) {
    console.error('[aulas/anotacoes] erro ao editar:', error)
    return NextResponse.json({ error: 'Erro ao editar anotação' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; anotacaoId: string } },
) {
  try {
    if (!isValidObjectId(params.id) || !isValidObjectId(params.anotacaoId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    const session = await getSession()
    if (!session?.userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const db = await getDb()
    const resultado = await db.collection<AnotacaoDaAula>(COLECAO).deleteOne(
      filtroDoDono(params.anotacaoId, session.userId, params.id),
    )

    if (resultado.deletedCount === 0) {
      return NextResponse.json({ error: 'Anotação não encontrada' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[aulas/anotacoes] erro ao excluir:', error)
    return NextResponse.json({ error: 'Erro ao excluir anotação' }, { status: 500 })
  }
}
