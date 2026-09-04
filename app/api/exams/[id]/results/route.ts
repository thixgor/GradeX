import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { Exam, ExamSubmission } from '@/lib/types'
import { ObjectId } from 'mongodb'
import { calculateTRIScores } from '@/lib/tri-calculator'
import { resolverJanelaDaProva } from '@/lib/provas/janela-da-prova'

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

    const db = await getDb()
    const examsCollection = db.collection<Exam>('exams')
    const submissionsCollection = db.collection<ExamSubmission>('submissions')

    const exam = await examsCollection.findOne({ _id: new ObjectId(id) })
    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    const isAdmin = session.role === 'admin'

    /*
     * Quem pode ver os resultados.
     *
     * A rota era exclusiva de admin — e a tela da prova mandava o ALUNO para
     * `/exam/[id]/results` assim que a prova terminava. Ele chegava, tomava um
     * 403 ("Apenas administradores podem ver os resultados") e era jogado para
     * a página inicial: a "área de resultados" era, para o aluno, um beco.
     *
     * Agora o aluno que participou vê o resultado da prova que fez, e só depois
     * que ela termina — que é quando o gabarito já é público de qualquer forma.
     * Quem não fez a prova continua sem nada para ver aqui.
     */
    const janela = resolverJanelaDaProva(exam)
    if (!isAdmin && !janela.encerrada && !exam.isPracticeExam) {
      return NextResponse.json(
        { error: 'Os resultados são liberados quando a prova termina.' },
        { status: 403 }
      )
    }

    if (!isAdmin) {
      const participou = await submissionsCollection.findOne(
        { examId: id, userId: session.userId },
        { projection: { _id: 1 } },
      )
      if (!participou) {
        return NextResponse.json(
          { error: 'Só quem fez a prova vê os resultados dela.' },
          { status: 403 }
        )
      }
    }

    // Provas práticas não têm término a esperar; as demais, sim — inclusive
    // para o admin, cujo painel tem o relatório completo em /admin/exams.
    const now = new Date()
    if (!exam.isPracticeExam && now < exam.endTime) {
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
        encerrada: janela.encerrada || !!exam.isPracticeExam,
        souAdmin: isAdmin,
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
      encerrada: janela.encerrada || !!exam.isPracticeExam,
      souAdmin: isAdmin,
    })
  } catch (error) {
    console.error('Get results error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar resultados' },
      { status: 500 }
    )
  }
}
