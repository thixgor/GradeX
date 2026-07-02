import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ExamSubmission } from '@/lib/types'
import { ObjectId } from 'mongodb'
import { computeStreak } from '@/lib/streak'

export const dynamic = 'force-dynamic'

// GET - Obter estatísticas do usuário atual
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const submissionsCollection = db.collection<ExamSubmission>('submissions')

    // Buscar todas as submissões do usuário (provas)
    const submissions = await submissionsCollection
      .find({ userId: session.userId })
      .toArray()

    // Contar número de provas resolvidas
    const examsCompleted = submissions.length

    // Contar número de questões respondidas em provas
    let questionsAnsweredExams = 0
    for (const submission of submissions) {
      questionsAnsweredExams += submission.answers.length
    }

    // Datas de atividade para o cálculo do streak (dias de estudo).
    const activityDates: Array<Date | null | undefined> = submissions.map(
      (s) => (s.submittedAt ? new Date(s.submittedAt) : null),
    )

    // Contar questões do Banco de Questões
    let questionsAnsweredBank = 0
    let questionsCorrectBank = 0
    let questionsWrongBank = 0

    try {
      const bancoResolucoes = await db.collection('banco_resolucoes')
        .find({ userId: new ObjectId(session.userId) })
        .toArray()

      questionsAnsweredBank = bancoResolucoes.length

      // Contar acertos e erros
      for (const resolucao of bancoResolucoes) {
        if (resolucao.correta === true) {
          questionsCorrectBank++
        } else if (resolucao.correta === false) {
          questionsWrongBank++
        }
        if (resolucao.createdAt) activityDates.push(new Date(resolucao.createdAt))
      }
    } catch (err) {
      // Se a coleção não existir, ignora
      console.log('Coleção banco_resolucoes não encontrada ou vazia')
    }

    // Streak real a partir das datas de atividade (provas + banco).
    const streak = computeStreak(activityDates)

    // Total de questões (provas + banco)
    const questionsAnswered = questionsAnsweredExams + questionsAnsweredBank

    return NextResponse.json({
      examsCompleted,
      questionsAnswered,
      // Streak de dias de estudo (alimenta o card e os insights do dashboard)
      streakDays: streak.current,
      longestStreak: streak.longest,
      studiedToday: streak.activeToday,
      // Detalhamento
      questionsAnsweredExams,
      questionsAnsweredBank,
      questionsCorrectBank,
      questionsWrongBank,
      // Taxa de acerto no banco
      bankAccuracyRate: questionsAnsweredBank > 0
        ? Math.round((questionsCorrectBank / questionsAnsweredBank) * 100)
        : 0
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    console.error('Get user statistics error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    )
  }
}
