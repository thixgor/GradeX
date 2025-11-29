import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// PATCH - Marcar cronograma como concluído
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()

    const result = await db.collection('cronogramas').updateOne(
      {
        _id: new ObjectId(params.id),
        usuarioId: session.userId
      },
      {
        $set: {
          concluido: true,
          dataConclusao: new Date(),
          dataAtualizacao: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Cronograma não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao marcar cronograma como concluído:', error)
    return NextResponse.json(
      { error: 'Erro ao marcar cronograma como concluído' },
      { status: 500 }
    )
  }
}
