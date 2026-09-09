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
 * quantos acertaram e quantos deixaram em branco — nunca quem.
 *
 * ## Duas versões, de propósito
 *
 * O que está aqui em cima é a versão do PROFESSOR, com as contagens. O aluno
 * recebe `analiseParaOAluno`, mais abaixo: só o percentual de acerto por
 * questão, sem nenhum número de cabeças. Saber que 31 de 34 erraram a questão
 * 12 e saber que 12% acertaram a questão 12 respondem à mesma pergunta sobre a
 * PROVA; só a primeira conta quantas pessoas fizeram a prova, e esse é um dado
 * da turma, não da questão.
 *
 * É o que permite entregar a análise a qualquer aluno da prova encerrada sem
 * depender de a classificação estar publicada: o ranking é sobre pessoas, isto
 * é sobre questões.
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

/**
 * ═══ O que o ALUNO recebe ═══
 *
 * As contagens absolutas — quantos entregaram, quantos responderam cada
 * questão, quantos acertaram, quantos deixaram em branco — são do professor.
 * Para o aluno sai o percentual de acerto e mais nada: ele responde "essa
 * questão pegou a turma?" sem dizer o tamanho da turma.
 *
 * ## Por que a separação é aqui, e não na tela
 *
 * Porque esconder um número no JSX o deixa a um `fetch` de distância — no
 * console, na aba de rede, sem ferramenta nenhuma. É a mesma decisão que
 * `showRanking` já tinha tomado: o que a tela não mostra, a rota não manda.
 *
 * ## Por que o destaque é calculado aqui
 *
 * A mais errada e a mais acertada desempatam pela mais RESPONDIDA — e
 * `respondidas` é justamente uma das contagens que não viajam. Se o ranking
 * fosse feito no navegador, ou ele receberia o número que não pode receber, ou
 * desempataria errado. Ele sai pronto do servidor, com só o número da questão e
 * o percentual dela.
 */

/** Uma questão em destaque, reduzida ao que pode ser dito ao aluno. */
export interface DestaqueDaTurma {
  number: number
  percentualDeAcerto: number
}

/** Uma questão vista pelo aluno: o percentual, sem cabeças por trás. */
export interface LinhaPublicaDaTurma {
  questionId: string
  number: number
  type: string
  percentualDeAcerto: number | null
}

export interface AnalisePublicaDaTurma {
  questoes: LinhaPublicaDaTurma[]
  totalDeQuestoes: number
  objetivas: number
  discursivas: number
  /**
   * Houve alguma entrega? — e só isso.
   *
   * A tela precisa saber se há o que mostrar; ela não precisa saber se foram
   * três ou trezentas pessoas. Um booleano responde a primeira pergunta sem
   * responder a segunda.
   */
  temEntregas: boolean
  maisErrada: DestaqueDaTurma | null
  maisAcertada: DestaqueDaTurma | null
}

function destaque(linha: LinhaDaTurma | null): DestaqueDaTurma | null {
  if (!linha || linha.percentualDeAcerto === null) return null
  return { number: linha.number, percentualDeAcerto: linha.percentualDeAcerto }
}

export function analiseParaOAluno(
  resumo: ResumoDaTurmaPorQuestao | null | undefined,
): AnalisePublicaDaTurma | null {
  if (!resumo) return null
  return {
    questoes: resumo.questoes.map((q) => ({
      questionId: q.questionId,
      number: q.number,
      type: q.type,
      percentualDeAcerto: q.percentualDeAcerto,
    })),
    totalDeQuestoes: resumo.totalDeQuestoes,
    objetivas: resumo.objetivas,
    discursivas: resumo.discursivas,
    temEntregas: resumo.entregas > 0,
    maisErrada: destaque(questaoMaisErradaDaTurma(resumo.questoes)),
    maisAcertada: destaque(questaoMaisAcertadaDaTurma(resumo.questoes)),
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
