import type { Question, Alternative } from '@/lib/types'

/**
 * Embaralhar a prova sem perder a prova.
 *
 * ## O defeito que isto conserta
 *
 * O embaralhamento acontecia na tela da prova, com `Math.random()`:
 *
 *   for (let i = shuffled.length - 1; i > 0; i--) {
 *     const j = Math.floor(Math.random() * (i + 1))
 *     ...
 *   }
 *
 * Fisher-Yates está correto — o problema é a fonte. Sem semente, a ordem é
 * sorteada **a cada montagem do componente**, e isso quebra três coisas de uma
 * vez:
 *
 *  1. **Recarregar troca a prova.** A pessoa recarrega a página na questão 12 e
 *     recebe outra ordem: a "questão 12" agora é outra. Com a retomada de prova
 *     (o aluno que caiu volta e continua), isso deixa de ser um incômodo e vira
 *     perda de trabalho — o progresso é gravado por `questionId`, mas a pessoa
 *     não reconhece mais onde estava.
 *  2. **O relatório não bate com a prova.** As respostas são gravadas por
 *     `questionId`, então a nota sai certa; mas a numeração que o aluno viu
 *     (`q.number` reescrito 1..n) não é gravada em lugar nenhum. Ele reclama da
 *     "questão 7" e o admin abre uma questão 7 diferente.
 *  3. **Não embaralhava alternativas.** Só a ordem das questões mudava, e a
 *     letra da resposta continuava a mesma para todo mundo — que é justamente o
 *     que se copia numa sala.
 *
 * ## Como está agora
 *
 * A ordem vem de uma semente estável — `examId:userId` —, então:
 *
 *  - é a mesma em toda recarga, em toda aba e depois de uma retomada;
 *  - é diferente entre dois alunos, que é o ponto do embaralhamento;
 *  - é reproduzível no servidor, para conferir o que o aluno viu.
 *
 * A ordem efetiva também é gravada na submissão (`questionOrder`), para o
 * relatório e o PDF numerarem como o aluno viu.
 */

/**
 * xmur3 + mulberry32: gerador determinístico pequeno o suficiente para viver
 * aqui e bom o suficiente para embaralhar uma prova. Não é criptográfico — e
 * não precisa ser: a semente não é segredo (o aluno sabe o próprio id), o que
 * importa é a ordem ser estável para ele e diferente da do colega.
 */
function semearGerador(semente: string): () => number {
  let h = 1779033703 ^ semente.length
  for (let i = 0; i < semente.length; i++) {
    h = Math.imul(h ^ semente.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let estado = (h ^= h >>> 16) >>> 0

  return function proximo() {
    estado = (estado + 0x6d2b79f5) >>> 0
    let t = estado
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher-Yates com gerador injetado. Não altera o array recebido. */
export function embaralharCom<T>(itens: readonly T[], proximo: () => number): T[] {
  const copia = [...itens]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(proximo() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

export function sementeDaProva(examId: string, userId: string): string {
  return `${examId}:${userId}`
}

/** Letras na ordem em que a prova as apresenta: A, B, C, ... */
function letraDoIndice(indice: number): string {
  return String.fromCharCode(65 + indice)
}

/**
 * Reordena as alternativas de UMA questão e reatribui as letras.
 *
 * O `id` de cada alternativa é preservado — é ele que a resposta grava e o
 * gabarito compara. Só a letra muda, porque a letra é posição, não identidade:
 * mantê-la depois de mover a alternativa faria a prova exibir "C) ..." antes de
 * "A) ...".
 */
export function embaralharAlternativas(
  alternativas: readonly Alternative[],
  proximo: () => number,
): Alternative[] {
  return embaralharCom(alternativas, proximo).map((alternativa, indice) => ({
    ...alternativa,
    letter: letraDoIndice(indice),
  }))
}

export interface OpcoesDeEmbaralhamento {
  embaralharQuestoes?: boolean
  embaralharAlternativas?: boolean
}

export interface ProvaEmbaralhada {
  questions: Question[]
  /** Os `id` das questões na ordem em que o aluno as viu. */
  ordem: string[]
}

/**
 * A prova como esta pessoa a vê.
 *
 * As questões são renumeradas de 1 a n **depois** do embaralhamento (é o número
 * que o aluno lê na tela), e `ordem` guarda a correspondência para quem for
 * remontar isso depois — o relatório, o PDF e a tela de correção.
 *
 * Questões `essay` e `discursive` participam do sorteio de questões, mas nunca
 * do de alternativas (não têm).
 */
export function montarProvaParaAluno(
  questoes: readonly Question[],
  semente: string,
  opcoes: OpcoesDeEmbaralhamento = {},
): ProvaEmbaralhada {
  const lista = Array.isArray(questoes) ? questoes : []

  // Um gerador por dimensão: ligar o embaralhamento de alternativas não pode
  // mudar a ordem das questões de quem já estava fazendo a prova.
  const ordenadas = opcoes.embaralharQuestoes
    ? embaralharCom(lista, semearGerador(`${semente}:questoes`))
    : [...lista]

  const questions = ordenadas.map((questao, indice) => {
    const numerada: Question = { ...questao, number: indice + 1 }

    if (
      opcoes.embaralharAlternativas &&
      questao.type === 'multiple-choice' &&
      Array.isArray(questao.alternatives) &&
      questao.alternatives.length > 1
    ) {
      numerada.alternatives = embaralharAlternativas(
        questao.alternatives,
        // A semente inclui o id da questão: assim a ordem das alternativas de
        // uma questão não depende da posição dela no sorteio anterior.
        semearGerador(`${semente}:alternativas:${questao.id}`),
      )
    }

    return numerada
  })

  return { questions, ordem: questions.map((q) => q.id) }
}

/**
 * Reordena questões pela ordem gravada na submissão, renumerando como o aluno
 * viu. Questões que não estão na ordem (adicionadas depois da entrega) vão para
 * o fim, para nunca sumirem do relatório.
 */
export function aplicarOrdemDaSubmissao(
  questoes: readonly Question[],
  ordem: readonly string[] | null | undefined,
): Question[] {
  if (!ordem || ordem.length === 0) return [...questoes]

  const porId = new Map(questoes.map((q) => [q.id, q]))
  const reordenadas: Question[] = []

  for (const id of ordem) {
    const questao = porId.get(id)
    if (questao) {
      reordenadas.push(questao)
      porId.delete(id)
    }
  }
  for (const restante of porId.values()) reordenadas.push(restante)

  return reordenadas.map((questao, indice) => ({ ...questao, number: indice + 1 }))
}
