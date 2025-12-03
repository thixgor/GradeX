import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { AulaPostagem } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { concluida } = body

    const db = await getDb()
    const aulasCollection = db.collection<AulaPostagem>('aulas_postagens')

    if (concluida) {
      // Adicionar usuário à lista de concluídos
      const result = await aulasCollection.updateOne(
        { _id: new ObjectId(params.id) },
        {
          $addToSet: { usuariosConcluidos: session.userId },
          $set: { atualizadoEm: new Date() }
        }
      )

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: 'Aula não encontrada' },
          { status: 404 }
        )
      }
    } else {
      // Remover usuário da lista de concluídos
      const result = await aulasCollection.updateOne(
        { _id: new ObjectId(params.id) },
        {
          $pull: { usuariosConcluidos: session.userId },
          $set: { atualizadoEm: new Date() }
        }
      )

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: 'Aula não encontrada' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao marcar conclusão:', error)
    return NextResponse.json(
      { error: 'Erro ao marcar conclusão' },
      { status: 500 }
    )
  }
}
