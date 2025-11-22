import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { Exam, ExamSubmission, UserAnswer } from '@/lib/types'
import { ObjectId } from 'mongodb'

// POST - Submeter respostas da prova
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { userName, themeTranscription, answers, signature } = body

    if (!userName || !answers) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const examsCollection = db.collection<Exam>('exams')
    const submissionsCollection = db.collection<ExamSubmission>('submissions')

    const exam = await examsCollection.findOne({ _id: new ObjectId(id) })
    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    // Verifica se a prova já terminou
    const now = new Date()
    if (now > exam.endTime) {
      return NextResponse.json(
        { error: 'Prova já encerrada' },
        { status: 400 }
      )
    }

    // Verifica se já existe submissão
    const existingSubmission = await submissionsCollection.findOne({
      examId: id,
      userId: session.userId,
    })

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'Você já submeteu esta prova' },
        { status: 400 }
      )
    }

    let score: number | undefined
    let correctionStatus: 'pending' | 'corrected' | undefined

    // Verificar se há questões discursivas
    const hasDiscursiveQuestions = exam.questions.some(q => q.type === 'discursive')

    // Calcula pontuação para método normal (apenas questões de múltipla escolha)
    if (exam.scoringMethod === 'normal' && !hasDiscursiveQuestions) {
      let correctAnswers = 0

      for (const answer of answers as UserAnswer[]) {
        const question = exam.questions.find(q => q.id === answer.questionId)
        if (question && question.type === 'multiple-choice') {
          const correctAlt = question.alternatives.find(alt => alt.isCorrect)
          if (correctAlt && answer.selectedAlternative === correctAlt.id) {
            correctAnswers++
          }
        }
      }

      const multipleChoiceCount = exam.questions.filter(q => q.type === 'multiple-choice').length
      if (multipleChoiceCount > 0) {
        const totalPoints = exam.totalPoints || 100
        score = (correctAnswers / multipleChoiceCount) * totalPoints
        score = Math.round(score * 100) / 100 // 2 casas decimais
      }
    }

    // Se tem questões discursivas, marcar como pendente de correção
    if (hasDiscursiveQuestions) {
      correctionStatus = 'pending'
    }

    const submission: ExamSubmission = {
      examId: id,
      userId: session.userId,
      userName,
      themeTranscription,
      answers,
      signature,
      score,
      corrections: hasDiscursiveQuestions ? [] : undefined,
      correctionStatus,
      submittedAt: new Date(),
    }

    const result = await submissionsCollection.insertOne(submission)

    // Se tem questões discursivas, avisa que aguarda correção
    if (hasDiscursiveQuestions) {
      return NextResponse.json({
        success: true,
        message: 'Prova submetida! As questões discursivas serão corrigidas em breve. Você será notificado quando a correção estiver pronta.',
        submissionId: result.insertedId.toString(),
      })
    }

    // Se for método normal (sem discursivas), retorna a pontuação
    if (exam.scoringMethod === 'normal') {
      return NextResponse.json({
        success: true,
        score,
        submissionId: result.insertedId.toString(),
      })
    }

    // Se for TRI, apenas confirma submissão
    return NextResponse.json({
      success: true,
      message: 'Prova submetida! A pontuação TRI será calculada após o término.',
      submissionId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error('Submit exam error:', error)
    return NextResponse.json(
      { error: 'Erro ao submeter prova' },
      { status: 500 }
    )
  }
}
