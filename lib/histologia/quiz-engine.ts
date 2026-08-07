import type { Questao, Quiz } from './esquemas'
import { embaralharComSemente, semented } from './texto'

/**
 * Motor dos quizzes nativos.
 *
 * Substitui o player H5P por completo. O H5P original permanece no acervo como
 * prova de origem, mas não é executado: carregá-lo significaria embutir um
 * runtime de terceiros, um iframe e um modelo de acessibilidade sobre o qual
 * não temos controle — justamente as três coisas que este módulo não pode ter.
 *
 * Funções puras, sem React: o mesmo cálculo serve à renderização, ao teste e à
 * retomada de uma prova interrompida.
 */

export type Modo = 'pratica' | 'prova'

export interface QuestaoPreparada extends Questao {
  /** Alternativas na ordem em que serão exibidas nesta tentativa. */
  ordem: string[]
}

export interface EstadoDoQuiz {
  slug: string
  modo: Modo
  semente: number
  questoes: QuestaoPreparada[]
  /** Id da questão → ids das alternativas escolhidas. */
  respostas: Record<string, string[]>
  indice: number
}

/**
 * Semente determinística.
 *
 * A ordem das questões e das alternativas precisa sobreviver a um recarregamento
 * — o aluno que fecha a aba no meio da prova tem de reencontrar exatamente a
 * mesma prova. `Math.random()` tornaria a retomada incoerente ("a alternativa
 * certa era a C") e o resultado irreprodutível numa contestação.
 *
 * A semente combina o quiz e a tentativa, então refazer gera uma ordem nova.
 */
export function gerarSemente(slug: string, tentativa: number): number {
  return semented(`${slug}::${tentativa}`)
}

/**
 * Prepara uma tentativa.
 *
 * No modo prática as questões vêm na ordem do catálogo (a progressão pedagógica
 * do acervo é intencional); no modo prova são embaralhadas, junto das
 * alternativas, para que reconhecer a posição não substitua reconhecer a
 * estrutura.
 */
export function prepararQuiz(quiz: Quiz, modo: Modo, semente: number): EstadoDoQuiz {
  const questoes = modo === 'prova' ? embaralharComSemente(quiz.questoes, semente) : quiz.questoes

  return {
    slug: quiz.slug,
    modo,
    semente,
    questoes: questoes.map((q, i) => ({
      ...q,
      // Semente derivada por questão: embaralhar todas com a mesma semente
      // produziria a mesma permutação em todas elas.
      ordem: embaralharComSemente(
        q.alternativas.map((a) => a.id),
        semente + i * 7919,
      ),
    })),
    respostas: {},
    indice: 0,
  }
}

/** Uma questão foi respondida? */
export function respondida(estado: EstadoDoQuiz, idQuestao: string): boolean {
  return (estado.respostas[idQuestao]?.length ?? 0) > 0
}

/**
 * Registra uma resposta. Questão de resposta única substitui a escolha; questão
 * de múltipla resposta alterna a alternativa.
 */
export function responder(
  estado: EstadoDoQuiz,
  idQuestao: string,
  idAlternativa: string,
): EstadoDoQuiz {
  const questao = estado.questoes.find((q) => q.id === idQuestao)
  if (!questao) return estado

  const atuais = estado.respostas[idQuestao] ?? []
  const proximas = questao.multipla
    ? atuais.includes(idAlternativa)
      ? atuais.filter((a) => a !== idAlternativa)
      : [...atuais, idAlternativa]
    : [idAlternativa]

  return { ...estado, respostas: { ...estado.respostas, [idQuestao]: proximas } }
}

/**
 * Uma questão está correta?
 *
 * Múltipla resposta exige o conjunto exato — acertar duas de três não é acerto
 * parcial aqui, porque a pergunta é "quais destas", e responder metade é
 * responder outra coisa.
 */
export function questaoCorreta(questao: QuestaoPreparada, escolhidas: string[]): boolean {
  const corretas = questao.alternativas.filter((a) => a.correta).map((a) => a.id)
  if (escolhidas.length !== corretas.length) return false
  return corretas.every((c) => escolhidas.includes(c))
}

export interface Resultado {
  acertos: number
  total: number
  percentual: number
  aprovado: boolean
  erros: string[]
  /** Desempenho agrupado pelo assunto da questão (o rótulo da alternativa certa). */
  porAssunto: Array<{ assunto: string; acertos: number; total: number }>
}

export function calcularResultado(
  estado: EstadoDoQuiz,
  percentualAprovacao: number,
): Resultado {
  let acertos = 0
  const erros: string[] = []
  const assuntos = new Map<string, { acertos: number; total: number }>()

  for (const questao of estado.questoes) {
    const escolhidas = estado.respostas[questao.id] ?? []
    const certo = questaoCorreta(questao, escolhidas)
    if (certo) acertos++
    else erros.push(questao.id)

    // O assunto de uma questão de identificação é a estrutura da resposta
    // correta — é o único rótulo confiável que o acervo fornece, e é o que o
    // aluno precisa ver no relatório ("erra sempre em osso esponjoso").
    const assunto = questao.alternativas.find((a) => a.correta)?.texto ?? 'Sem assunto'
    const registro = assuntos.get(assunto) ?? { acertos: 0, total: 0 }
    registro.total++
    if (certo) registro.acertos++
    assuntos.set(assunto, registro)
  }

  const total = estado.questoes.length
  const percentual = total > 0 ? (100 * acertos) / total : 0

  return {
    acertos,
    total,
    percentual,
    aprovado: percentual >= percentualAprovacao,
    erros,
    porAssunto: [...assuntos.entries()]
      .map(([assunto, v]) => ({ assunto, ...v }))
      .sort((a, b) => a.acertos / a.total - b.acertos / b.total),
  }
}

/**
 * Alternativas seguras para o HTML inicial do modo prova.
 *
 * No modo prova, `correta` e `feedback` são removidos antes da serialização:
 * o componente é renderizado no servidor e "Ver código-fonte" entregaria o
 * gabarito inteiro. A conferência acontece depois, quando o aluno responde, com
 * os dados completos buscados sob demanda.
 *
 * No modo prática o gabarito pode ir junto — a devolutiva é imediata por
 * desenho, e esconder o que já vai aparecer no clique seguinte só custaria uma
 * viagem à rede.
 */
export function alternativasParaCliente(questao: Questao, modo: Modo) {
  if (modo === 'pratica') return questao.alternativas
  return questao.alternativas.map((a) => ({ id: a.id, texto: a.texto, correta: false, feedback: '' }))
}

/** Remove o gabarito de um quiz inteiro, para o modo prova. */
export function quizParaCliente(quiz: Quiz, modo: Modo): Quiz {
  if (modo === 'pratica') return quiz
  return {
    ...quiz,
    questoes: quiz.questoes.map((q) => ({ ...q, alternativas: alternativasParaCliente(q, modo) })),
  }
}
