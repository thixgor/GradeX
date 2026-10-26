import type { Question, UserAnswer } from '@/lib/types'

/**
 * Quanto de uma prova entregue foi de fato respondido, e quanto acertou.
 *
 * O perfil contava `answers.length` como "questões respondidas" — mas a lista
 * de respostas leva também as questões deixadas em branco (o rascunho grava a
 * entrada vazia assim que a pessoa passa por ela), e acerto não era contado
 * em lugar nenhum: a nota da submissão é um número ponderado, não "acertou 12
 * de 20". Esta função lê as duas coisas da mesma fonte que a correção usa —
 * a alternativa marcada contra a alternativa certa da prova.
 *
 * Pura e sem I/O: quem chama decide se o acerto pode ser mostrado agora (ver
 * `notaLiberadaParaOAluno`). Contar o acerto antes do término da prova é dizer
 * a nota antes da hora.
 */

export type QuestaoParaMedir = Pick<Question, 'id' | 'type'> & {
  alternatives?: Array<{ id: string; isCorrect?: boolean }>
}

/** Só o que a medição lê de cada resposta — a projeção da consulta é esta. */
export type RespostaParaMedir = Pick<UserAnswer, 'questionId' | 'selectedAlternative'> & {
  /** O texto discursivo/redação tem algo além de espaço. */
  temTexto?: boolean
  discursiveText?: string
  essayText?: string
}

export interface DesempenhoDaEntrega {
  /** Questões com alguma resposta (alternativa marcada ou texto escrito). */
  respondidas: number
  /** Objetivas com alternativa marcada — o denominador do acerto. */
  objetivasRespondidas: number
  /** Objetivas marcadas na alternativa certa. */
  acertos: number
}

function temConteudo(texto: unknown): boolean {
  return typeof texto === 'string' && texto.trim().length > 0
}

export function medirEntrega(
  questoes: QuestaoParaMedir[] | null | undefined,
  respostas: RespostaParaMedir[] | null | undefined,
): DesempenhoDaEntrega {
  const porId = new Map((questoes || []).map(questao => [questao.id, questao]))
  const vistas = new Set<string>()
  let respondidas = 0
  let objetivasRespondidas = 0
  let acertos = 0

  for (const resposta of respostas || []) {
    if (!resposta?.questionId || vistas.has(resposta.questionId)) continue
    const questao = porId.get(resposta.questionId)
    // Resposta de uma questão que saiu da prova depois da entrega: não há
    // como saber se ela valia, então não entra em nenhuma das contas.
    if (!questao) continue

    if (questao.type === 'multiple-choice') {
      if (!temConteudo(resposta.selectedAlternative)) continue
      vistas.add(resposta.questionId)
      respondidas++
      objetivasRespondidas++
      const certa = questao.alternatives?.find(alternativa => alternativa.isCorrect)
      if (certa && certa.id === resposta.selectedAlternative) acertos++
      continue
    }

    const escreveu =
      resposta.temTexto === true || temConteudo(resposta.discursiveText) || temConteudo(resposta.essayText)
    if (!escreveu) continue
    vistas.add(resposta.questionId)
    respondidas++
  }

  return { respondidas, objetivasRespondidas, acertos }
}
