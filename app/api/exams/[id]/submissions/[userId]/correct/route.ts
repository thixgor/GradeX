import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { Exam, ExamSubmission, Correction } from '@/lib/types'
import { correctWithGemini } from '@/lib/gemini-corrector'
import { ObjectId } from 'mongodb'

// POST - Corrigir questões discursivas (manual ou AI)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await params
    const session = await getSession()

    // Apenas admin pode corrigir
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const { method, questionId, score, feedback, rigor } = body

    if (!method || !questionId) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    if (method !== 'manual' && method !== 'ai') {
      return NextResponse.json(
        { error: 'Método inválido. Use "manual" ou "ai"' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const examsCollection = db.collection<Exam>('exams')
    const submissionsCollection = db.collection<ExamSubmission>('submissions')

    // Buscar prova
    const exam = await examsCollection.findOne({ _id: new ObjectId(id) })
    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    // Buscar submissão
    const submission = await submissionsCollection.findOne({
      examId: id,
      userId: userId,
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submissão não encontrada' }, { status: 404 })
    }

    // Buscar questão
    const question = exam.questions.find(q => q.id === questionId)
    if (!question) {
      return NextResponse.json({ error: 'Questão não encontrada' }, { status: 404 })
    }

    if (question.type !== 'discursive') {
      return NextResponse.json(
        { error: 'Questão não é discursiva' },
        { status: 400 }
      )
    }

    // Buscar resposta do aluno
    const answer = submission.answers.find(a => a.questionId === questionId)
    if (!answer || !answer.discursiveText) {
      return NextResponse.json(
        { error: 'Resposta não encontrada' },
        { status: 404 }
      )
    }

    let correction: Correction

    if (method === 'ai') {
      // Correção por IA
      try {
        const result = await correctWithGemini(
          question,
          answer.discursiveText,
          rigor || 0.45
        )

        correction = {
          questionId,
          score: result.score,
          maxScore: result.maxScore,
          feedback: result.feedback,
          method: 'ai',
          correctedAt: new Date(),
          keyPointsFound: result.keyPointsFound,
        }
      } catch (error: any) {
        console.error('Erro ao corrigir com IA:', error)
        return NextResponse.json(
          { error: `Erro na correção automática: ${error.message}` },
          { status: 500 }
        )
      }
    } else {
      // Correção manual
      if (typeof score !== 'number' || !feedback) {
        return NextResponse.json(
          { error: 'Para correção manual, forneça score e feedback' },
          { status: 400 }
        )
      }

      correction = {
        questionId,
        score,
        maxScore: question.maxScore || 10,
        feedback,
        method: 'manual',
        correctedBy: session.userId,
        correctedAt: new Date(),
      }
    }

    // Adicionar ou atualizar correção
    const corrections = submission.corrections || []
    const existingIndex = corrections.findIndex(c => c.questionId === questionId)

    if (existingIndex >= 0) {
      corrections[existingIndex] = correction
    } else {
      corrections.push(correction)
    }

    // Calcular pontuação discursiva total
    const discursiveScore = corrections.reduce((sum, c) => sum + c.score, 0)

    // Verificar se todas as questões discursivas foram corrigidas
    const discursiveQuestions = exam.questions.filter(q => q.type === 'discursive')
    const allCorrected = discursiveQuestions.every(q =>
      corrections.some(c => c.questionId === q.id)
    )

    // Atualizar submissão
    await submissionsCollection.updateOne(
      { examId: id, userId: userId },
      {
        $set: {
          corrections,
          discursiveScore,
          correctionStatus: allCorrected ? 'corrected' : 'pending',
        },
      }
    )

    // Se todas foram corrigidas, criar notificação
    if (allCorrected) {
      const notificationsCollection = db.collection('notifications')
      await notificationsCollection.insertOne({
        userId: userId,
        examId: id,
        examTitle: exam.title,
        type: 'correction_ready',
        message: `A correção da sua prova "${exam.title}" está pronta!`,
        read: false,
        createdAt: new Date(),
      })
    }

    return NextResponse.json({
      success: true,
      correction,
      allCorrected,
      discursiveScore,
    })
  } catch (error) {
    console.error('Correction error:', error)
    return NextResponse.json(
      { error: 'Erro ao corrigir questão' },
      { status: 500 }
    )
  }
}

// POST - Corrigir TODAS as questões discursivas de uma submissão com IA
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await params
    const session = await getSession()

    // Apenas admin pode corrigir
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const { rigor } = body

    const db = await getDb()
    const examsCollection = db.collection<Exam>('exams')
    const submissionsCollection = db.collection<ExamSubmission>('submissions')

    // Buscar prova
    const exam = await examsCollection.findOne({ _id: new ObjectId(id) })
    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    // Buscar submissão
    const submission = await submissionsCollection.findOne({
      examId: id,
      userId: userId,
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submissão não encontrada' }, { status: 404 })
    }

    // Buscar todas as questões discursivas
    const discursiveQuestions = exam.questions.filter(q => q.type === 'discursive')

    if (discursiveQuestions.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma questão discursiva nesta prova' },
        { status: 400 }
      )
    }

    const corrections: Correction[] = []
    const errors: string[] = []

    // Corrigir cada questão discursiva
    for (const question of discursiveQuestions) {
      const answer = submission.answers.find(a => a.questionId === question.id)

      if (!answer || !answer.discursiveText) {
        errors.push(`Questão ${question.number}: Resposta não encontrada`)
        continue
      }

      try {
        const result = await correctWithGemini(
          question,
          answer.discursiveText,
          rigor || 0.45
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
      } catch (error: any) {
        console.error(`Erro ao corrigir questão ${question.number}:`, error)
        errors.push(`Questão ${question.number}: ${error.message}`)
      }
    }

    if (corrections.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma questão foi corrigida', errors },
        { status: 500 }
      )
    }

    // Calcular pontuação discursiva total
    const discursiveScore = corrections.reduce((sum, c) => sum + c.score, 0)

    // Atualizar submissão
    await submissionsCollection.updateOne(
      { examId: id, userId: userId },
      {
        $set: {
          corrections,
          discursiveScore,
          correctionStatus: 'corrected',
        },
      }
    )

    // Criar notificação
    const notificationsCollection = db.collection('notifications')
    await notificationsCollection.insertOne({
      userId: userId,
      examId: id,
      examTitle: exam.title,
      type: 'correction_ready',
      message: `A correção da sua prova "${exam.title}" está pronta!`,
      read: false,
      createdAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      corrected: corrections.length,
      total: discursiveQuestions.length,
      discursiveScore,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Bulk correction error:', error)
    return NextResponse.json(
      { error: 'Erro ao corrigir questões' },
      { status: 500 }
    )
  }
}
