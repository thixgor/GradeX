import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { descreverReset, zerarDadosDaProva } from '@/lib/provas/reset-da-prova'

export const dynamic = 'force-dynamic'

/**
 * DELETE — zerar a prova: apagar tudo o que os alunos deixaram nela.
 *
 * Só `submissions` era apagado aqui, e a prova voltava meio zerada: o rascunho
 * da retomada sobrevivia com a retomada já gasta e o cronômetro da tentativa
 * antiga, e a tentativa continuava aberta no painel ao vivo. O que entra e o
 * que não entra está em `lib/provas/reset-da-prova.ts`.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()

    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Sem permissão' },
        { status: 403 }
      )
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    const db = await getDb()

    // A prova precisa existir: zerar um id inválido devolvia "0 submissões
    // deletadas" com cara de sucesso, e o admin ia embora achando que apagou.
    const exam = await db.collection('exams').findOne({ _id: new ObjectId(id) }, { projection: { _id: 1 } })
    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    const contagem = await zerarDadosDaProva(db, id)

    return NextResponse.json({
      success: true,
      message: descreverReset(contagem),
      contagem,
      // Mantido para quem já lia este campo.
      deletedCount: contagem.submissoes,
    })
  } catch (error) {
    console.error('Reset submissions error:', error)
    return NextResponse.json(
      { error: 'Erro ao zerar a prova' },
      { status: 500 }
    )
  }
}
