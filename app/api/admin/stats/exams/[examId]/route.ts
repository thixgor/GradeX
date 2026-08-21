import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { andFilters, REAL_SUBMISSION_FILTER, requireAdmin } from '@/lib/admin-stats/common'
import {
  attemptElapsedMs,
  attemptProgressPct,
  deriveAttemptStatus,
  EXAM_ATTEMPTS_COLLECTION,
  type ExamAttempt,
} from '@/lib/tracking/exam-attempts'
import type { Exam, ExamSubmission, UserAnswer } from '@/lib/types'

export const dynamic = 'force-dynamic'

/** Teto de linhas carregadas — protege o painel de uma prova com base gigante. */
const ROSTER_LIMIT = 2000

/**
 * Raio-X de uma prova: quem abriu, quem começou, onde cada um parou, quem
 * entregou, quem acertou mais e qual questão derruba a turma.
 *
 * A correção por questão é recalculada aqui a partir do gabarito, e não lida
 * de `score`: a nota final mistura pesos, discursivas e autoavaliação, então
 * ela não responde "quantas questões essa pessoa acertou".
 */
export async function GET(request: NextRequest, { params }: { params: { examId: string } }) {
  const guard = await requireAdmin()
  if (!guard.ok || !guard.db) return guard.response!
  const db = guard.db

  try {
    const { examId } = params
    if (!ObjectId.isValid(examId)) {
      return NextResponse.json({ error: 'Prova inválida' }, { status: 400 })
    }

    const exam = (await db.collection('exams').findOne({ _id: new ObjectId(examId) })) as Exam | null
    if (!exam) return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })

    const [submissions, attempts, downloads] = await Promise.all([
      db
        .collection('submissions')
        .find(andFilters({ examId }, REAL_SUBMISSION_FILTER) as any)
        .sort({ submittedAt: -1 })
        .limit(ROSTER_LIMIT)
        .toArray() as Promise<ExamSubmission[]>,
      db
        .collection(EXAM_ATTEMPTS_COLLECTION)
        .find({ examId })
        .sort({ lastSeenAt: -1 })
        .limit(ROSTER_LIMIT)
        .toArray() as unknown as Promise<ExamAttempt[]>,
      db
        .collection('download_logs')
        .aggregate([
          { $match: { resourceId: examId } },
          { $group: { _id: '$type', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
        .toArray(),
    ])

    const questions = exam.questions || []
    const mcQuestions = questions.filter(q => q.type === 'multiple-choice')

    // ─── Correção por questão ───────────────────────────────────
    const correctByQuestion = new Map<string, string>()
    for (const q of mcQuestions) {
      const correct = q.alternatives?.find(a => a.isCorrect)
      if (correct) correctByQuestion.set(q.id, correct.id)
    }

    const perQuestion = questions.map((q, index) => ({
      id: q.id,
      numero: q.number ?? index + 1,
      indice: index,
      tipo: q.type,
      enunciado: (q.statement || '').replace(/<[^>]*>/g, ' ').slice(0, 180),
      acertos: 0,
      erros: 0,
      embranco: 0,
      respostas: 0,
      taxaAcerto: null as number | null,
      /** Quantas vezes cada alternativa foi marcada — revela o distrator forte. */
      alternativas: (q.alternatives || []).map(a => ({
        id: a.id,
        letra: a.letter,
        correta: !!a.isCorrect,
        marcacoes: 0,
      })),
    }))
    const questionIndex = new Map(perQuestion.map((q, i) => [q.id, i]))

    // ─── Ranking dos alunos ─────────────────────────────────────
    const ranking = submissions.map(sub => {
      let acertos = 0
      let respondidas = 0

      for (const answer of (sub.answers || []) as UserAnswer[]) {
        const qi = questionIndex.get(answer.questionId)
        if (qi === undefined) continue
        const stats = perQuestion[qi]
        const question = questions[qi]

        if (question.type === 'multiple-choice') {
          if (!answer.selectedAlternative) {
            stats.embranco++
            continue
          }
          respondidas++
          stats.respostas++
          const alt = stats.alternativas.find(a => a.id === answer.selectedAlternative)
          if (alt) alt.marcacoes++
          if (correctByQuestion.get(answer.questionId) === answer.selectedAlternative) {
            acertos++
            stats.acertos++
          } else {
            stats.erros++
          }
        } else {
          const texto = answer.discursiveText?.trim() || answer.essayText?.trim() || ''
          if (texto) {
            respondidas++
            stats.respostas++
          } else {
            stats.embranco++
          }
        }
      }

      return {
        posicao: 0, // preenchido depois da ordenação
        submissionId: sub._id?.toString() || '',
        userId: sub.userId,
        nome: sub.userName || 'Sem nome',
        nota: sub.score ?? null,
        acertos,
        totalObjetivas: mcQuestions.length,
        aproveitamento: mcQuestions.length > 0 ? Number(((acertos / mcQuestions.length) * 100).toFixed(1)) : null,
        respondidas,
        embranco: questions.length - respondidas,
        correcaoPendente: sub.correctionStatus === 'pending',
        enviadaEm: sub.submittedAt || null,
        iniciadaEm: sub.startedAt || null,
        duracaoMs:
          sub.startedAt && sub.submittedAt
            ? Math.max(0, new Date(sub.submittedAt).getTime() - new Date(sub.startedAt).getTime())
            : null,
      }
    })

    for (const stats of perQuestion) {
      const respondidas = stats.acertos + stats.erros
      stats.taxaAcerto = respondidas > 0 ? Number(((stats.acertos / respondidas) * 100).toFixed(1)) : null
    }

    ranking.sort((a, b) => {
      if (b.acertos !== a.acertos) return b.acertos - a.acertos
      return (b.nota ?? -1) - (a.nota ?? -1)
    })
    ranking.forEach((row, i) => { row.posicao = i + 1 })

    // ─── Roster de tentativas ───────────────────────────────────
    const now = Date.now()
    const roster = attempts.map(a => {
      const status = deriveAttemptStatus(a, now)
      return {
        attemptId: a.attemptId,
        userId: a.userId,
        nome: a.userName || 'Sem nome',
        email: a.userEmail || '',
        plano: a.accountType || 'gratuito',
        status,
        abriuEm: a.openedAt || null,
        comecouEm: a.startedAt || null,
        ultimoSinal: a.lastSeenAt || null,
        enviouEm: a.submittedAt || null,
        respondidas: a.answeredCount || 0,
        totalQuestoes: a.totalQuestions || questions.length,
        progresso: attemptProgressPct({
          answeredCount: a.answeredCount || 0,
          totalQuestions: a.totalQuestions || questions.length,
        }),
        parouNaQuestao: (a.furthestQuestion ?? 0) + 1,
        saiuDaAba: a.awayCount || 0,
        duracaoMs: attemptElapsedMs(a),
        dispositivo: a.device || 'desconhecido',
      }
    })

    const resumo = roster.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Onde a turma trava: histograma da última questão alcançada por quem
    // abandonou. É o dado que aponta a questão que faz o aluno desistir.
    const abandonoPorQuestao = Array.from({ length: questions.length || 1 }, (_, i) => ({
      questao: i + 1,
      abandonos: 0,
    }))
    for (const r of roster) {
      if (r.status !== 'abandoned') continue
      const idx = Math.min(abandonoPorQuestao.length - 1, Math.max(0, r.parouNaQuestao - 1))
      abandonoPorQuestao[idx].abandonos++
    }

    // ─── Distribuição de notas da prova ─────────────────────────
    const faixas = ['0-19', '20-39', '40-59', '60-79', '80-100']
    const distribuicaoNotas = faixas.map(label => ({ label, count: 0 }))
    for (const r of ranking) {
      if (r.nota == null) continue
      const idx = Math.min(4, Math.max(0, Math.floor(r.nota / 20)))
      distribuicaoNotas[idx].count++
    }

    const notas = ranking.map(r => r.nota).filter((n): n is number => n != null)
    const mediaNotas = notas.length ? notas.reduce((s, n) => s + n, 0) / notas.length : null

    const iniciadas = roster.filter(r => r.comecouEm).length
    const entregues = roster.filter(r => r.status === 'submitted').length
    const abandonadas = roster.filter(r => r.status === 'abandoned').length

    return NextResponse.json({
      prova: {
        examId,
        titulo: exam.title || 'Prova sem título',
        metodo: exam.scoringMethod,
        questoes: questions.length,
        objetivas: mcQuestions.length,
        criadaEm: exam.createdAt || null,
        criadaPor: exam.createdBy || '',
        oculta: !!exam.isHidden,
        treino: !!exam.isPracticeExam,
        proctoring: !!exam.proctoring?.enabled,
        duracao: exam.duration || null,
        janela: { inicio: exam.startTime || null, fim: exam.endTime || null },
        truncado: submissions.length >= ROSTER_LIMIT || attempts.length >= ROSTER_LIMIT,
      },
      resumo: {
        aberturas: roster.length,
        iniciadas,
        entregues,
        abandonadas,
        acontecendoAgora: roster.filter(r => r.status === 'in_progress').length,
        soAbriram: roster.filter(r => r.status === 'opened').length,
        submissoes: ranking.length,
        media: mediaNotas,
        aproveitamentoMedio:
          mcQuestions.length && ranking.length
            ? Number(
                (ranking.reduce((s, r) => s + (r.aproveitamento ?? 0), 0) / ranking.length).toFixed(1)
              )
            : null,
        taxaConclusao: iniciadas > 0 ? Number(((entregues / iniciadas) * 100).toFixed(1)) : null,
        taxaAbandono: iniciadas > 0 ? Number(((abandonadas / iniciadas) * 100).toFixed(1)) : null,
        porStatus: resumo,
        downloads: (downloads as any[]).map(d => ({ tipo: d._id, count: d.count })),
      },
      ranking,
      tentativas: roster,
      porQuestao: perQuestion,
      abandonoPorQuestao,
      distribuicaoNotas,
    })
  } catch (error: any) {
    console.error('[stats/exams/:id]', error)
    return NextResponse.json({ error: error?.message || 'Erro ao carregar prova' }, { status: 500 })
  }
}
