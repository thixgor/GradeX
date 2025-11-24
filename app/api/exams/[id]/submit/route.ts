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

    // Verificar se há questões discursivas ou redações
    const hasDiscursiveQuestions = exam.questions.some(q => q.type === 'discursive')
    const hasEssayQuestions = exam.questions.some(q => q.type === 'essay')
    const needsCorrection = hasDiscursiveQuestions || hasEssayQuestions

    // Calcula pontuação para método normal (apenas questões de múltipla escolha)
    if (exam.scoringMethod === 'normal' && !needsCorrection) {
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

    // Se tem questões que precisam de correção, marcar como pendente
    if (needsCorrection) {
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
      corrections: needsCorrection ? [] : undefined,
      correctionStatus,
      submittedAt: new Date(),
    }

    const result = await submissionsCollection.insertOne(submission)

    // Se tem questões com correção automática (discursivas ou redações), corrigir agora
    if (needsCorrection) {
      const shouldAutoCorrectDiscursive = hasDiscursiveQuestions && exam.discursiveCorrectionMethod === 'ai'
      const hasAutoCorrectEssay = hasEssayQuestions && exam.questions.some(q => q.type === 'essay' && q.essayCorrectionMethod === 'ai')

      if (shouldAutoCorrectDiscursive || hasAutoCorrectEssay) {
        try {
          const corrections: any[] = []

          // Corrigir questões discursivas
          if (shouldAutoCorrectDiscursive) {
            const { correctWithGemini } = await import('@/lib/gemini-corrector')

            for (const question of exam.questions.filter(q => q.type === 'discursive')) {
              const answer = answers.find((a: any) => a.questionId === question.id)
              if (answer && answer.discursiveText) {
                try {
                  const result = await correctWithGemini(
                    question,
                    answer.discursiveText,
                    exam.aiRigor || 0.45
                  )

                  corrections.push({
                    questionId: question.id,
                    score: result.score,
                    maxScore: result.maxScore,
                    feedback: result.feedback,
                    method: 'ai',
                    correctedAt: new Date(),
                    keyPointsFound: result.keyPointsFound,
                  })
                } catch (error) {
                  console.error(`Erro ao corrigir questão discursiva ${question.number}:`, error)
                }
              }
            }
          }

          // Corrigir redações com IA
          if (hasAutoCorrectEssay) {
            const { correctEssayWithGemini } = await import('@/lib/essay-corrector')

            for (const question of exam.questions.filter(q => q.type === 'essay' && q.essayCorrectionMethod === 'ai')) {
              const answer = answers.find((a: any) => a.questionId === question.id)
              if (answer && answer.essayText) {
                try {
                  const result = await correctEssayWithGemini(
                    question,
                    answer.essayText,
                    question.essayAiRigor || 0.45
                  )

                  corrections.push({
                    questionId: question.id,
                    score: result.score,
                    maxScore: result.maxScore,
                    feedback: result.generalFeedback,
                    method: 'ai',
                    correctedAt: new Date(),
                    essayCompetences: result.competences,
                    essayGeneralFeedback: result.generalFeedback,
                  })
                } catch (error) {
                  console.error(`Erro ao corrigir redação ${question.number}:`, error)
                }
              }
            }
          }

          // Atualizar submissão com correções
          if (corrections.length > 0) {
            const discursiveScore = corrections.reduce((sum, c) => sum + c.score, 0)

            // Verificar se TODAS as questões que precisam de correção foram corrigidas
            const totalQuestionsNeedingCorrection = exam.questions.filter(
              q => q.type === 'discursive' || (q.type === 'essay' && q.essayCorrectionMethod === 'ai')
            ).length

            const newCorrectionStatus = corrections.length === totalQuestionsNeedingCorrection ? 'corrected' : 'pending'

            await submissionsCollection.updateOne(
              { _id: result.insertedId },
              {
                $set: {
                  corrections,
                  discursiveScore,
                  correctionStatus: newCorrectionStatus,
                },
              }
            )

            return NextResponse.json({
              success: true,
              message: 'Prova submetida e corrigida automaticamente!',
              score: discursiveScore,
              submissionId: result.insertedId.toString(),
            })
          }
        } catch (error) {
          console.error('Erro na correção automática:', error)
          // Se falhar, continua com status pending
        }
      }
    }

    // Se tem questões que precisam de correção manual, avisa que aguarda correção
    if (needsCorrection) {
      const messageType = hasDiscursiveQuestions && hasEssayQuestions
        ? 'As questões discursivas e redações'
        : hasEssayQuestions
        ? 'A redação'
        : 'As questões discursivas'

      return NextResponse.json({
        success: true,
        message: `Prova submetida! ${messageType} serão corrigidas em breve. Você será notificado quando a correção estiver pronta.`,
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
