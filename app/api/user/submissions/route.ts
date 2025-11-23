import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ExamSubmission, Exam } from '@/lib/types'

// GET - Buscar todas as submissoes do usuario logado
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const submissionsCollection = db.collection<ExamSubmission>('submissions')
    const examsCollection = db.collection<Exam>('exams')

    // Buscar todas as submissoes do usuario
    const submissions = await submissionsCollection
      .find({ userId: session.userId })
      .sort({ submittedAt: -1 })
      .toArray()

    // Buscar informacoes das provas
    const submissionsWithExams = await Promise.all(
      submissions.map(async (submission) => {
        const exam = await examsCollection.findOne({ _id: submission.examId })
        return {
          ...submission,
          examName: exam?.name || 'Prova nao encontrada',
          examTitle: exam?.title || 'Prova nao encontrada',
          hasDiscursiveQuestions: exam?.questions.some(q => q.type === 'discursive') || false,
          examEndTime: exam?.endTime, // Adicionar endTime para verificar se prova terminou
        }
      })
    )

    return NextResponse.json({ submissions: submissionsWithExams })
  } catch (error) {
    console.error('Get user submissions error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar submissoes' },
      { status: 500 }
    )
  }
}
