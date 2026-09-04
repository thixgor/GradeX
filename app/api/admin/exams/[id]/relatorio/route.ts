import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import type { Exam, ExamSubmission } from '@/lib/types'
import { resolverJanelaDaProva } from '@/lib/provas/janela-da-prova'
import { normalizarPublico, rotuloDoPublico } from '@/lib/provas/publico-da-prova'
import { COLECAO_DE_PROGRESSO } from '@/lib/provas/retomada'
import {
  EXAM_ATTEMPTS_COLLECTION,
  deriveAttemptStatus,
  type ExamAttempt,
} from '@/lib/tracking/exam-attempts'
import { getUserCurrentPeriodo } from '@/lib/user-periodo'

export const dynamic = 'force-dynamic'

/**
 * O relatório da prova, do ponto de vista de quem a aplicou.
 *
 * ## O que existia
 *
 * `/exam/[id]/results` — um ranking de nomes e notas, e só depois que a prova
 * terminava. Para saber se a turma estava conseguindo entrar, quantos já
 * entregaram, ou qual questão derrubou todo mundo, não havia tela: o caminho
 * era abrir o relatório de um aluno por vez.
 *
 * Aqui o admin recebe as três coisas que uma prova aplicada a uma turma exige
 * responder, e recebe **durante** a prova, não só no fim:
 *
 *  1. **Quem chegou.** Convocados, presentes, entregues, em andamento e quem
 *     sumiu no meio — vindo de `exam_attempts`, que já acompanha a tentativa
 *     desde a abertura da tela (e não só a entrega).
 *  2. **Como foi.** Média, mediana, maior e menor nota, e a distribuição por
 *     faixa — a curva da turma, não uma lista ordenada.
 *  3. **Qual questão.** O percentual de acerto de cada questão e quanto cada
 *     alternativa puxou. É o que separa "a turma não estudou" de "a questão 12
 *     está mal escrita".
 *
 * Nada disto vaza para o aluno: a rota é `/api/admin/...` e exige `role`.
 */

interface EstatisticaDeQuestao {
  questionId: string
  number: number
  type: string
  enunciado: string
  respondidas: number
  acertos: number
  percentualDeAcerto: number | null
  /** Quantos escolheram cada alternativa, na ordem canônica da prova. */
  porAlternativa: { id: string; letter: string; isCorrect: boolean; escolhas: number }[]
  emBranco: number
}

/** Faixas de 0-20, 20-40, ... em percentual da pontuação total. */
const FAIXAS = [
  { rotulo: '0–20%', min: 0, max: 20 },
  { rotulo: '20–40%', min: 20, max: 40 },
  { rotulo: '40–60%', min: 40, max: 60 },
  { rotulo: '60–80%', min: 60, max: 80 },
  { rotulo: '80–100%', min: 80, max: 100.0001 },
]

function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null
  const ordenados = [...valores].sort((a, b) => a - b)
  const meio = Math.floor(ordenados.length / 2)
  return ordenados.length % 2 === 0
    ? (ordenados[meio - 1] + ordenados[meio]) / 2
    : ordenados[meio]
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    const db = await getDb()
    const exam = await db.collection<Exam>('exams').findOne({ _id: new ObjectId(id) })
    if (!exam) return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })

    const [submissoes, tentativas, emAndamento] = await Promise.all([
      db.collection<ExamSubmission>('submissions').find({ examId: id }).toArray(),
      db.collection<ExamAttempt>(EXAM_ATTEMPTS_COLLECTION).find({ examId: id }).toArray(),
      db.collection(COLECAO_DE_PROGRESSO).countDocuments({ examId: id }),
    ])

    const publico = normalizarPublico((exam as any).audience)

    /*
     * Quantos DEVERIAM fazer esta prova.
     *
     * Só existe resposta quando a prova foi aplicada a períodos: numa prova
     * aberta à plataforma "convocados" seria a base de usuários inteira, um
     * número que não diz nada sobre presença. Aí o denominador é a própria
     * turma que apareceu.
     */
    let convocados: number | null = null
    if (publico.modo === 'periodos') {
      const alunos = await db
        .collection('users')
        .find(
          { banned: { $ne: true }, periodoBase: { $exists: true, $ne: null } },
          { projection: { periodoBase: 1, periodoBaseRef: 1 } },
        )
        .toArray()
      convocados = alunos.filter((u) => {
        const periodo = getUserCurrentPeriodo(u as any)
        return periodo !== null && publico.periodos.includes(periodo)
      }).length
    }

    const agora = Date.now()
    const porStatus = { opened: 0, in_progress: 0, idle: 0, abandoned: 0, submitted: 0 }
    for (const tentativa of tentativas) {
      porStatus[deriveAttemptStatus(tentativa, agora)] += 1
    }

    // ── Notas ──────────────────────────────────────────────────────────────
    const usaTri = exam.scoringMethod === 'tri'
    const notaMaxima = usaTri ? 1000 : exam.totalPoints || 100
    const notas = submissoes
      .map((s) => (usaTri ? s.triScore : s.score))
      .filter((n): n is number => typeof n === 'number' && Number.isFinite(n))

    const media = notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : null
    const distribuicao = FAIXAS.map((faixa) => ({
      rotulo: faixa.rotulo,
      quantidade: notas.filter((n) => {
        const pct = notaMaxima > 0 ? (n / notaMaxima) * 100 : 0
        return pct >= faixa.min && pct < faixa.max
      }).length,
    }))

    // ── Questões ───────────────────────────────────────────────────────────
    const estatisticas: EstatisticaDeQuestao[] = (exam.questions || []).map((questao) => {
      const respostas = submissoes
        .map((s) => s.answers?.find((a) => a.questionId === questao.id))
        .filter(Boolean) as NonNullable<ExamSubmission['answers'][number]>[]

      if (questao.type !== 'multiple-choice') {
        const respondidas = respostas.filter(
          (r) => !!r.discursiveText?.trim() || !!r.essayText?.trim(),
        ).length
        return {
          questionId: questao.id,
          number: questao.number,
          type: questao.type,
          enunciado: (questao.statement || '').slice(0, 220),
          respondidas,
          acertos: 0,
          percentualDeAcerto: null,
          porAlternativa: [],
          emBranco: submissoes.length - respondidas,
        }
      }

      const correta = questao.alternatives?.find((a) => a.isCorrect)
      const escolhas = new Map<string, number>()
      let respondidas = 0

      for (const resposta of respostas) {
        if (!resposta.selectedAlternative) continue
        respondidas += 1
        escolhas.set(resposta.selectedAlternative, (escolhas.get(resposta.selectedAlternative) || 0) + 1)
      }

      const acertos = correta ? escolhas.get(correta.id) || 0 : 0

      return {
        questionId: questao.id,
        number: questao.number,
        type: questao.type,
        enunciado: (questao.statement || '').slice(0, 220),
        respondidas,
        acertos,
        // Sobre quem RESPONDEU, não sobre quem entregou: uma questão respondida
        // por 5 de 40 alunos com 4 acertos é 80%, e o "em branco" ao lado é que
        // conta a outra metade da história.
        percentualDeAcerto: respondidas > 0 ? (acertos / respondidas) * 100 : null,
        porAlternativa: (questao.alternatives || []).map((alternativa) => ({
          id: alternativa.id,
          letter: alternativa.letter,
          isCorrect: !!alternativa.isCorrect,
          escolhas: escolhas.get(alternativa.id) || 0,
        })),
        emBranco: submissoes.length - respondidas,
      }
    })

    // ── Participantes ──────────────────────────────────────────────────────
    const participantes = submissoes
      .map((s) => ({
        userId: s.userId,
        userName: s.userName,
        score: usaTri ? s.triScore ?? null : s.score ?? null,
        correctionStatus: s.correctionStatus || null,
        startedAt: s.startedAt || null,
        submittedAt: s.submittedAt,
        resumesUsed: s.resumesUsed || 0,
        submittedFromSavedProgress: !!s.submittedFromSavedProgress,
        duracaoMin:
          s.startedAt && s.submittedAt
            ? Math.max(
                0,
                Math.round(
                  (new Date(s.submittedAt).getTime() - new Date(s.startedAt).getTime()) / 60000,
                ),
              )
            : null,
      }))
      .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))

    return NextResponse.json({
      prova: {
        id,
        title: exam.title,
        scoringMethod: exam.scoringMethod,
        notaMaxima,
        numberOfQuestions: exam.numberOfQuestions,
        startTime: exam.startTime,
        endTime: exam.endTime,
        gatesOpen: exam.gatesOpen || null,
        gatesClose: exam.gatesClose || null,
        isHidden: exam.isHidden,
        shuffleQuestions: !!exam.shuffleQuestions,
        shuffleAlternatives: !!(exam as any).shuffleAlternatives,
        publico: { ...publico, rotulo: rotuloDoPublico(publico) },
        freeDownloads: (exam as any).freeDownloads || null,
      },
      janela: resolverJanelaDaProva(exam),
      presenca: {
        convocados,
        // Pessoas distintas que abriram a prova, não tentativas.
        presentes: new Set(tentativas.map((t) => t.userId)).size,
        entregaram: submissoes.length,
        rascunhosAbertos: emAndamento,
        porStatus,
        // Quem precisou da retomada — o número que diz se a prova está caindo
        // para a turma ou se foi um azar isolado.
        retomaram: submissoes.filter((s) => (s.resumesUsed || 0) > 0).length,
      },
      notas: {
        total: notas.length,
        media,
        mediana: mediana(notas),
        maior: notas.length > 0 ? Math.max(...notas) : null,
        menor: notas.length > 0 ? Math.min(...notas) : null,
        distribuicao,
        aguardandoCorrecao: submissoes.filter((s) => s.correctionStatus === 'pending').length,
      },
      questoes: estatisticas,
      participantes,
    })
  } catch (error) {
    console.error('Exam report error:', error)
    return NextResponse.json({ error: 'Erro ao montar relatório' }, { status: 500 })
  }
}
