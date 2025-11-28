import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ExamSubmission } from '@/lib/types'

// GET - Obter estatísticas do usuário atual
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const submissionsCollection = db.collection<ExamSubmission>('submissions')

    // Buscar todas as submissões do usuário
    const submissions = await submissionsCollection
      .find({ userId: session.userId })
      .toArray()

    // Contar número de provas resolvidas
    const examsCompleted = submissions.length

    // Contar número de questões respondidas
    let questionsAnswered = 0
    for (const submission of submissions) {
      questionsAnswered += submission.answers.length
    }

    return NextResponse.json({
      examsCompleted,
      questionsAnswered,
    })
  } catch (error) {
    console.error('Get user statistics error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    )
  }
}
