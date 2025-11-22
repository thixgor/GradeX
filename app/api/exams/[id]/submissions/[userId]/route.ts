import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ExamSubmission } from '@/lib/types'

// GET - Buscar submissão de um usuário específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await params
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Apenas o próprio usuário ou admin pode ver
    if (session.userId !== userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const db = await getDb()
    const submissionsCollection = db.collection<ExamSubmission>('submissions')

    const submission = await submissionsCollection.findOne({
      examId: id,
      userId: userId,
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submissão não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Get submission error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar submissão' },
      { status: 500 }
    )
  }
}
