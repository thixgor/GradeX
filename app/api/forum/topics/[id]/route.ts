import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação usando getSession (não fetch)
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    if (session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem deletar tópicos' },
        { status: 403 }
      )
    }

    const db = await getDb()
    const { id } = await params

    const result = await db.collection('forumTopics').deleteOne({
      _id: new ObjectId(id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Tópico não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Tópico deletado com sucesso'
    })
  } catch (error: any) {
    console.error('Erro ao deletar tópico:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar tópico' },
      { status: 500 }
    )
  }
}
