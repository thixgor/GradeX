import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// PATCH - Atualizar status de atividade
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; atividadeId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const db = await getDb()

    // Atualizar a atividade dentro do cronograma
    const result = await db.collection('cronogramas').updateOne(
      {
        _id: new ObjectId(params.id),
        usuarioId: session.userId,
        'cronograma.atividades.id': params.atividadeId
      },
      {
        $set: {
          'cronograma.$[].atividades.$[ativ].concluido': body.concluido,
          dataAtualizacao: new Date()
        }
      },
      {
        arrayFilters: [{ 'ativ.id': params.atividadeId }]
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Atividade não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar atividade:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar atividade' },
      { status: 500 }
    )
  }
}
