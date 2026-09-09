import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { lerPeriodoDoAluno } from '@/lib/provas/periodo-do-aluno'
import { provaExisteParaPessoa } from '@/lib/provas/visibilidade-da-prova'
import { Exam, ExamSubmission } from '@/lib/types'
import { ObjectId } from 'mongodb'
import { calculateTRIScores } from '@/lib/tri-calculator'
import { resolverJanelaDaProva } from '@/lib/provas/janela-da-prova'
import { mostraClassificacao, posicaoNaTurma, resumirTurma } from '@/lib/provas/classificacao'
import { permiteTreinoAposTermino } from '@/lib/provas/treino-pos-termino'

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
     * Antes de qualquer regra de resultado: esta prova existe para esta pessoa?
     *
     * Esta rota não checava visibilidade nenhuma. Uma prova oculta (ou aplicada
     * a outro período) entregava aqui o ranking, as notas e os nomes de quem a
     * fez para qualquer conta que tivesse o id — a única barreira era "já
     * terminou", que o tempo derruba sozinha.
     */
    if (!isAdmin) {
      const periodo = await lerPeriodoDoAluno(db, session.userId)
      if (!provaExisteParaPessoa(exam, { userId: session.userId, isAdmin, periodo })) {
        return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
      }
    }

    /*
     * Quem pode ver os resultados.
     *
     * A rota era exclusiva de admin — e a tela da prova mandava o ALUNO para
     * `/exam/[id]/results` assim que a prova terminava. Ele chegava, tomava um
     * 403 ("Apenas administradores podem ver os resultados") e era jogado para
     * a página inicial: a "área de resultados" era, para o aluno, um beco.
     *
     * Agora o aluno vê o resultado da prova, e só depois que ela termina — que
     * é quando o gabarito já é público de qualquer forma. Quem NÃO participou é
     * tratado logo abaixo, pelo que a prova publica.
     */
    const janela = resolverJanelaDaProva(exam)
    if (!isAdmin && !janela.encerrada && !exam.isPracticeExam) {
      return NextResponse.json(
        { error: 'Os resultados são liberados quando a prova termina.' },
        { status: 403 }
      )
    }

    /*
     * Quem NÃO fez a prova.
     *
     * A regra era simples e errada: sem submissão, 403 — "Só quem fez a prova
     * vê os resultados dela." O aluno que faltou, o que chegou depois do
     * portão, o que entrou na turma no meio do semestre: todos clicavam em
     * **Ver resultados** numa prova encerrada e recebiam uma tela dizendo que
     * não havia entrega dele. A frase é verdadeira e não era a pergunta: ele
     * não estava procurando a nota dele, estava procurando a da TURMA.
     *
     * E a classificação, quando o admin a deixa ligada, é justamente a parte
     * pública deste resultado. Ela sai com nome e nota para os oitenta que
     * fizeram a prova; esconder a mesma lista de quem faltou não protege
     * ninguém — protege da pessoa exatamente aquilo que os colegas dela estão
     * vendo na tela ao lado.
     *
     * Então o critério passa a ser o que a prova publica, não quem está
     * pedindo: com a classificação ligada, qualquer aluno para quem a prova
     * existe vê o resultado dela depois do término. Com a classificação
     * desligada não há nada de público a mostrar — aí, sim, sem entrega não há
     * o que ver, e a recusa diz isso em vez de acusar a pessoa de não ter
     * feito a prova.
     *
     * `participou` continua sendo lido: ele é o que separa "a sua nota" do
     * resto da tela.
     */
    const participou = isAdmin
      ? null
      : await submissionsCollection.findOne(
          { examId: id, userId: session.userId },
          { projection: { _id: 1 } },
        )

    if (!isAdmin && !participou && !mostraClassificacao(exam, false)) {
      return NextResponse.json(
        {
          error:
            'Esta prova não publica a classificação da turma, e você não tem uma entrega registrada nela — não há resultado para mostrar.',
        },
        { status: 403 }
      )
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
      /*
       * A tela precisa distinguir "você não fez esta prova" de "ainda estamos
       * carregando a sua entrega". Sem este campo ela mostrava, para quem
       * faltou, os mesmos cartões de "minhas respostas" desligados com o aviso
       * de erro — como se algo tivesse falhado.
       */
      participei: isAdmin ? undefined : !!participou,
      // Refazer como treino: a tela da prova encerrada e esta oferecem o mesmo
      // botão, e as duas precisam saber que ele existe.
      treinoLiberado: permiteTreinoAposTermino(exam, now),
    })
  } catch (error) {
    console.error('Get results error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar resultados' },
      { status: 500 }
    )
  }
}
