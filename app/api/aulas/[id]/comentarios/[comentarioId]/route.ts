import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { AulaPostagem } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; comentarioId: string } }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const db = await getDb()
    const aulasCollection = db.collection<AulaPostagem>('aulas_postagens')

    const result = await aulasCollection.updateOne(
      { _id: new ObjectId(params.id) },
      {
        $pull: { comentarios: { _id: new ObjectId(params.comentarioId) } },
        $set: { atualizadoEm: new Date() }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Aula não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar comentário:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar comentário' },
      { status: 500 }
    )
  }
}
