import type { Question, UserAnswer } from '@/lib/types'

/**
 * Como a turma foi, questão a questão.
 *
 * ## Por que isto saiu do painel do admin
 *
 * O cálculo já existia — dentro de `GET /api/admin/exams/[id]/relatorio`, que é
 * exclusivo de admin e devolve, junto, o nome e a nota de cada aluno. Ele
 * alimenta o PDF de análise (`lib/pdf/analise-da-prova.ts`).
 *
 * O aluno não tem como chegar nesse número por nenhum caminho, e ele é
 * justamente o que a conversa da turma depois da prova gira em torno: "qual foi
 * a que todo mundo errou?". A resposta existia, calculada, e só o professor
 * podia vê-la.
 *
 * Aqui o cálculo vira uma função pura, sem banco e sem sessão, para que as duas
 * rotas — a do admin e a do aluno — produzam o MESMO número. Duas somas
 * separadas do mesmo percentual de acerto é como este projeto já teve três
 * "médias da turma" diferentes.
 *
 * ## O que ele NÃO carrega
 *
 * Nada que identifique alguém. A linha de uma questão diz quantos responderam,
 * quantos acertaram e quantos deixaram em branco — nunca quem. É o que permite
 * entregá-la a qualquer aluno da prova encerrada sem depender de a
 * classificação estar publicada: o ranking é sobre pessoas, isto é sobre
 * questões.
 */

/**
 * A forma mínima de uma linha, para as funções de destaque.
 *
 * Estrutural de propósito: `DadosDaAnalise['questoes'][number]`, do PDF do
 * admin, tem mais campos e se encaixa aqui sem conversão nenhuma. É o que
 * permite que os dois lados usem o mesmo desempate.
 */
export interface QuestaoRanqueavel {
  type: string
  respondidas: number
  percentualDeAcerto: number | null
}

/** Uma questão vista pela turma — sem nada que diga QUEM respondeu o quê. */
export interface LinhaDaTurma extends QuestaoRanqueavel {
  questionId: string
  number: number
  /** Quantos acertaram (0 nas discursivas, que não têm gabarito automático). */
  acertos: number
  /** Quantos entregaram sem responder esta questão. */
  emBranco: number
}

export interface ResumoDaTurmaPorQuestao {
  questoes: LinhaDaTurma[]
  totalDeQuestoes: number
  objetivas: number
  discursivas: number
  /** Entregas consideradas — o denominador de "em branco". */
  entregas: number
}

/** Uma entrega, reduzida ao que este cálculo precisa. */
export interface EntregaParaAnalise {
  answers?: UserAnswer[] | null
}

/**
 * O percentual de acerto é sobre quem RESPONDEU, não sobre quem entregou.
 *
 * Uma questão respondida por 5 de 40 alunos, com 4 acertos, é 80% de acerto — e
 * o "em branco: 35" ao lado é que conta a outra metade da história. Misturar as
 * duas num número só produziria 10%, que descreve a adesão à questão e não a
 * dificuldade dela.
 */
export function resumirTurmaPorQuestao(
  questoes: readonly Question[] | null | undefined,
  entregas: readonly EntregaParaAnalise[] | null | undefined,
): ResumoDaTurmaPorQuestao {
  const listaDeQuestoes = questoes || []
  const listaDeEntregas = entregas || []

  const linhas: LinhaDaTurma[] = listaDeQuestoes.map((questao) => {
    const respostas = listaDeEntregas
      .map((entrega) => (entrega.answers || []).find((a) => a.questionId === questao.id))
      .filter(Boolean) as UserAnswer[]

    if (questao.type !== 'multiple-choice') {
      /*
       * Discursiva e redação não têm acerto automático: o que se pode contar é
       * quem escreveu alguma coisa. `percentualDeAcerto: null` é o que as tira
       * do ranking de mais errada / mais acertada — uma discursiva "0% de
       * acerto" seria uma afirmação que ninguém calculou.
       */
      const respondidas = respostas.filter(
        (r) => !!r.discursiveText?.trim() || !!r.essayText?.trim(),
      ).length
      return {
        questionId: questao.id,
        number: questao.number,
        type: questao.type,
        respondidas,
        acertos: 0,
        percentualDeAcerto: null,
        emBranco: listaDeEntregas.length - respondidas,
      }
    }

    const correta = questao.alternatives?.find((a) => a.isCorrect)
    let respondidas = 0
    let acertos = 0

    for (const resposta of respostas) {
      if (!resposta.selectedAlternative) continue
      respondidas += 1
      if (correta && resposta.selectedAlternative === correta.id) acertos += 1
    }

    return {
      questionId: questao.id,
      number: questao.number,
      type: questao.type,
      respondidas,
      acertos,
      percentualDeAcerto: respondidas > 0 ? (acertos / respondidas) * 100 : null,
      emBranco: listaDeEntregas.length - respondidas,
    }
  })

  return {
    questoes: linhas,
    totalDeQuestoes: listaDeQuestoes.length,
    objetivas: listaDeQuestoes.filter((q) => q.type === 'multiple-choice').length,
    discursivas: listaDeQuestoes.filter((q) => q.type !== 'multiple-choice').length,
    entregas: listaDeEntregas.length,
  }
}

/** As objetivas com resposta — as únicas que podem ser ranqueadas. */
function ranqueaveis<T extends QuestaoRanqueavel>(questoes: readonly T[]): T[] {
  return questoes.filter(
    (q) => q.type === 'multiple-choice' && q.percentualDeAcerto !== null && q.respondidas > 0,
  )
}

/**
 * A que a turma mais errou.
 *
 * O empate desempata pela mais respondida: entre duas questões com 20% de
 * acerto, a que 40 pessoas erraram diz mais do que a que 3 erraram.
 */
export function questaoMaisErradaDaTurma<T extends QuestaoRanqueavel>(
  questoes: readonly T[] | null | undefined,
): T | null {
  const candidatas = ranqueaveis(questoes || [])
  if (candidatas.length === 0) return null
  return [...candidatas].sort(
    (a, b) => a.percentualDeAcerto! - b.percentualDeAcerto! || b.respondidas - a.respondidas,
  )[0]
}

/** A que a turma mais acertou — mesmo desempate. */
export function questaoMaisAcertadaDaTurma<T extends QuestaoRanqueavel>(
  questoes: readonly T[] | null | undefined,
): T | null {
  const candidatas = ranqueaveis(questoes || [])
  if (candidatas.length === 0) return null
  return [...candidatas].sort(
    (a, b) => b.percentualDeAcerto! - a.percentualDeAcerto! || b.respondidas - a.respondidas,
  )[0]
}
