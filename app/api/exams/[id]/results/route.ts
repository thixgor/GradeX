import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { Exam, ExamSubmission } from '@/lib/types'
import { ObjectId } from 'mongodb'
import { calculateTRIScores } from '@/lib/tri-calculator'

export const dynamic = 'force-dynamic'

// GET - Buscar resultados da prova
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Apenas admins podem ver os resultados
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem ver os resultados' }, { status: 403 })
    }

    const db = await getDb()
    const examsCollection = db.collection<Exam>('exams')
    const submissionsCollection = db.collection<ExamSubmission>('submissions')

    const exam = await examsCollection.findOne({ _id: new ObjectId(id) })
    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    // Verifica se a prova terminou
    const now = new Date()
    if (now < exam.endTime) {
      return NextResponse.json(
        { error: 'Prova ainda não terminou' },
        { status: 400 }
      )
    }

    const submissions = await submissionsCollection
      .find({ examId: id })
      .toArray()

    // Se for TRI, calcula as notas
    if (exam.scoringMethod === 'tri') {
      const triResults = calculateTRIScores(
        exam.questions,
        submissions.map(sub => ({
          userId: sub.userId,
          userName: sub.userName,
          answers: sub.answers,
        }))
      )

      // Atualiza as submissões com as notas TRI
      for (const result of triResults) {
        await submissionsCollection.updateOne(
          { examId: id, userId: result.userId },
          { $set: { triScore: result.triScore } }
        )
      }

      return NextResponse.json({
        scoringMethod: 'tri',
        results: triResults,
      })
    }

    // Se for método normal, retorna as pontuações
    const normalResults = submissions
      .map(sub => ({
        userId: sub.userId,
        userName: sub.userName,
        score: sub.score || 0,
      }))
      .sort((a, b) => a.userName.localeCompare(b.userName, 'pt-BR'))

    return NextResponse.json({
      scoringMethod: 'normal',
      results: normalResults,
    })
  } catch (error) {
    console.error('Get results error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar resultados' },
      { status: 500 }
    )
  }
}
