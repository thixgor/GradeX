import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { Exam, ExamSubmission } from '@/lib/types'
import { ObjectId } from 'mongodb'
import { calculateTRIScores } from '@/lib/tri-calculator'
import { resolverJanelaDaProva } from '@/lib/provas/janela-da-prova'
import { mostraClassificacao, posicaoNaTurma, resumirTurma } from '@/lib/provas/classificacao'

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

    const scoringMethod: 'tri' | 'normal' = exam.scoringMethod === 'tri' ? 'tri' : 'normal'

    let resultados: { userId: string; userName: string; nota: number }[]

    if (scoringMethod === 'tri') {
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

      resultados = triResults.map(r => ({ userId: r.userId, userName: r.userName, nota: r.triScore }))
    } else {
      resultados = submissions.map(sub => ({
        userId: sub.userId,
        userName: sub.userName,
        nota: sub.score || 0,
      }))
    }

    /*
     * A classificação é decidida AQUI, não na tela.
     *
     * Com `showRanking: false` a rota devolvia a mesma lista de sempre — nome e
     * nota de toda a turma — e esconder a seção no React deixaria a lista a um
     * `fetch` de distância, no console ou na aba de rede. O que a tela não
     * mostra, esta rota não manda.
     *
     * O que continua saindo é o resumo ANÔNIMO da turma e a nota de quem está
     * pedindo: desligar a classificação tira os nomes, não o retorno.
     */
    const podeVerClassificacao = mostraClassificacao(exam, isAdmin)
    const notaMaxima = scoringMethod === 'tri' ? 1000 : exam.totalPoints || 100
    const notas = resultados.map(r => r.nota)

    const minhaLinha = resultados.find(r => r.userId === session.userId) || null

    return NextResponse.json({
      scoringMethod,
      // Ordenada por nota: a tela lista por colocação, e ordenar por nome aqui
      // só obrigava o cliente a reordenar tudo de novo.
      results: podeVerClassificacao
        ? [...resultados]
            .sort((a, b) => b.nota - a.nota)
            .map(r => (scoringMethod === 'tri'
              ? { userId: r.userId, userName: r.userName, triScore: r.nota }
              : { userId: r.userId, userName: r.userName, score: r.nota }))
        : [],
      mostrarClassificacao: podeVerClassificacao,
      // O resumo vem do servidor mesmo quando a lista vai junto: sem ele, a
      // tela com a classificação desligada não teria como calcular a média de
      // notas que ela não recebeu.
      estatisticas: resumirTurma(notas, notaMaxima),
      minhaNota: minhaLinha ? minhaLinha.nota : null,
      minhaPosicao: minhaLinha && podeVerClassificacao
        ? posicaoNaTurma(notas, minhaLinha.nota)
        : null,
      notaMaxima,
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
