import type { Exam, Question, Alternative } from '@/lib/types'

/**
 * O gabarito de uma prova avaliativa não viaja até o navegador do aluno.
 *
 * ## O problema
 *
 * `GET /api/exams/[id]` devolvia o documento inteiro da prova para qualquer
 * pessoa autenticada. Dentro dele, cada questão de múltipla escolha traz
 * `alternatives[].isCorrect`, e várias trazem `explanation` e
 * `commentedFeedback` com o comentário de cada alternativa.
 *
 * Numa prova com nota e ranking, isso é o fim do produto. O aluno abre o
 * console durante a prova e digita uma linha:
 *
 *   (await (await fetch('/api/exams/<id>')).json())
 *     .exam.questions.map(q => q.alternatives.find(a => a.isCorrect).letter)
 *
 * e recebe o gabarito inteiro, em ordem. Não precisa de ferramenta, de extensão
 * nem de conhecimento de segurança — é a resposta que o próprio servidor já
 * mandava, só que ninguém tinha ido olhar. O monitoramento por câmera não vê
 * nada disso, e a nota de quem estudou passa a valer menos que a de quem
 * apertou F12.
 *
 * ## O critério
 *
 * A pergunta certa não é "esconder ou não", é **para quem a resposta ainda é
 * uma resposta**. Quando o aluno já entregou, ou quando a prova encerrou, o
 * gabarito é justamente o que ele foi buscar — a revisão comentada é metade do
 * valor da plataforma. Antes disso, é cola.
 *
 * Por isso `podeVerGabarito` libera em quatro casos e sanitiza no resto.
 *
 * ## Por que a correção continua no cliente
 *
 * Prova de treino e prova pessoal são do próprio aluno: ele escolheu os
 * assuntos, ele mandou gerar, e o feedback imediato é o recurso. Mandar cada
 * resposta ao servidor para ser corrigida gastaria uma invocação por clique
 * para reesconder algo que o dono da prova pode ver de qualquer forma. O
 * gabarito segue junto nesses casos e a correção continua onde estava.
 *
 * O que muda é só a prova avaliativa — a que tem nota, data e ranking.
 */

/** Campos de uma questão que revelam a resposta. */
type QuestaoSanitizada = Omit<Question, 'alternatives'> & { alternatives: Alternative[] }

export function sanitizarQuestaoParaAluno(questao: Question): QuestaoSanitizada {
  const {
    explanation: _explanation,
    commentedFeedback: _commentedFeedback,
    keyPoints: _keyPoints,
    ...resto
  } = questao

  return {
    ...resto,
    // `isCorrect: false` em todas, e não o campo ausente: o tipo `Alternative`
    // exige o booleano, e uma alternativa sem ele quebraria as telas que o leem
    // sem checar. Falso em todas não é uma pista — é o estado de "ninguém sabe".
    alternatives: (questao.alternatives || []).map((alternativa) => ({
      ...alternativa,
      isCorrect: false,
    })),
  } as QuestaoSanitizada
}

export function sanitizarProvaParaAluno<T extends Partial<Exam>>(prova: T): T {
  if (!prova || !Array.isArray(prova.questions)) return prova
  return {
    ...prova,
    questions: prova.questions.map(sanitizarQuestaoParaAluno),
  }
}

export interface ContextoDoGabarito {
  /** Quem está pedindo. */
  userId: string
  isAdmin: boolean
  /** O aluno já entregou esta prova? */
  jaSubmeteu?: boolean
  /** Momento da avaliação; injetável para teste. */
  agora?: Date
}

/**
 * Esta pessoa pode receber o gabarito desta prova agora?
 *
 * Os quatro casos em que sim:
 *
 * 1. **Admin.** Quem monta a prova precisa vê-la inteira.
 * 2. **Quem criou a prova.** Vale para a prova pessoal do próprio aluno: ele
 *    escolheu o conteúdo e mandou gerar; esconder dele o que ele mesmo pediu
 *    não protege nada.
 * 3. **Prova de treino ou pessoal.** Não tem nota valendo nem ranking; o
 *    feedback imediato é o recurso.
 * 4. **Já entregou, ou a prova encerrou.** O gabarito virou revisão, que é o
 *    que a pessoa veio buscar.
 */
export function podeVerGabarito(
  prova: Partial<Exam> | null | undefined,
  contexto: ContextoDoGabarito,
): boolean {
  if (!prova) return false
  if (contexto.isAdmin) return true
  if (prova.createdBy && prova.createdBy === contexto.userId) return true
  if (prova.isPracticeExam || prova.isPersonalExam) return true
  if (contexto.jaSubmeteu) return true

  const agora = contexto.agora ?? new Date()

  // Encerrada pelo portão de saída, quando existe; senão pelo fim da prova.
  const fim = prova.gatesClose ?? prova.endTime
  if (fim) {
    const fimEmMs = new Date(fim).getTime()
    if (Number.isFinite(fimEmMs) && fimEmMs <= agora.getTime()) return true
  }

  return false
}

/** Aplica o veredito: devolve a prova como ela deve chegar a esta pessoa. */
export function prepararProvaParaEntrega<T extends Partial<Exam>>(
  prova: T,
  contexto: ContextoDoGabarito,
): T {
  return podeVerGabarito(prova, contexto) ? prova : sanitizarProvaParaAluno(prova)
}
