import type { Exam, ExamSubmission } from '@/lib/types'
import { fimDaProva } from './janela-da-prova'
import { podeVerGabarito, type ContextoDoGabarito } from './sanitizar-prova'

/**
 * A nota de uma prova avaliativa não sai antes de a prova terminar.
 *
 * ## O problema
 *
 * `POST /api/exams/[id]/submit` calculava a nota, gravava a submissão e
 * devolvia `{ score }` no JSON da resposta. A tela de finalização (`/exam/[id]`)
 * pegava esse número e desenhava o anel: **"72 pontos", em letras garrafais,
 * segundos depois da entrega** — numa prova que a turma ainda estava fazendo
 * até as 16h.
 *
 * A nota é o gabarito dito de outro jeito. Quem entrega às 14h05 e recebe
 * "8 de 10" sabe que errou duas; quem entrega às 14h06, muda duas marcações
 * antes de clicar e recebe "10 de 10" descobriu exatamente quais eram. Com duas
 * ou três pessoas comparando notas no grupo da turma, o gabarito inteiro se
 * reconstrói por subtração, sem ninguém precisar abrir o console.
 *
 * E o sistema já sabia disso em todo o resto: o gabarito é removido do JSON da
 * prova (`sanitizarProvaParaAluno`), os PDFs de gabarito esperam o término
 * (`resolverDownloadsDaProva`), `/exam/[id]/results` recusa a classificação
 * antes do fim. A nota era o furo que sobrou — a única porta em que a resposta
 * certa saía, em forma de número, pela mão do próprio servidor.
 *
 * ## O critério: o mesmo do gabarito
 *
 * Não há regra nova aqui, de propósito. `podeVerGabarito` já responde "para
 * quem a resposta ainda é uma resposta", nos quatro casos em que ela pode sair
 * (admin, quem criou a prova, treino/prova pessoal, prova encerrada). A nota
 * segue exatamente esse veredito — porque ela é derivada do gabarito, e duas
 * regras separadas para a mesma informação só existem até uma delas ser
 * esquecida.
 *
 * Treino e prova pessoal continuam com feedback imediato: não há turma
 * esperando neles.
 *
 * ## O que NÃO muda
 *
 * A nota continua sendo calculada e **gravada** na entrega, como sempre. O
 * admin a vê na hora, a correção automática roda na hora, o ranking do término
 * sai da mesma coluna. O que espera é a entrega dela ao aluno: o número não
 * viaja até o navegador dele antes da hora, e nenhuma tela precisa lembrar de
 * esconder o que nunca recebeu.
 *
 * E o aluno não fica sem nada: as respostas dele são dele e saem na hora (a
 * folha com as letras que marcou, o resumo da própria prova). O que espera o
 * fim é o julgamento delas.
 */

/** Por que a nota ainda não está aqui — pronto para a tela. */
export const MOTIVO_NOTA_PRESA =
  'Sua nota é liberada quando a prova termina, para não circular enquanto a turma ainda responde.'

export type ContextoDaNota = ContextoDoGabarito

export interface VereditoDaNota {
  /** A nota pode ser mostrada a esta pessoa agora? */
  liberada: boolean
  /** Quando ela sai, quando a espera é de tempo. `null` quando não há término. */
  liberaEm: Date | null
  /** Frase pronta para a tela. `null` quando liberada. */
  motivo: string | null
}

/**
 * Esta pessoa pode ver a nota desta prova agora?
 *
 * Delega a `podeVerGabarito` — ver o cabeçalho. Se algum dia a regra do
 * gabarito mudar, a da nota muda com ela, que é o ponto.
 */
export function notaLiberadaParaOAluno(
  prova: Partial<Exam> | null | undefined,
  contexto: ContextoDaNota,
): boolean {
  return podeVerGabarito(prova, contexto)
}

export function resolverNotaDaProva(
  prova: Partial<Exam> | null | undefined,
  contexto: ContextoDaNota,
): VereditoDaNota {
  if (notaLiberadaParaOAluno(prova, contexto)) {
    return { liberada: true, liberaEm: null, motivo: null }
  }
  return { liberada: false, liberaEm: fimDaProva(prova), motivo: MOTIVO_NOTA_PRESA }
}

/**
 * Os campos de uma submissão que SÃO a nota.
 *
 * `corrections` entra na lista: cada correção traz a pontuação da questão e o
 * comentário do corretor, que é resposta comentada com outro nome.
 *
 * `correctionStatus` fica de fora de propósito — "aguardando correção" é um
 * estado do processo, não um julgamento das respostas, e é a informação que
 * impede a tela de prometer uma nota que nem existe ainda.
 */
export const CAMPOS_DE_NOTA = ['score', 'triScore', 'discursiveScore', 'corrections'] as const

/** A submissão como ela deve chegar a quem ainda não pode ver a nota. */
export function sanitizarNotaDaSubmissao<T extends Partial<ExamSubmission>>(
  submissao: T,
): T & { notaPresaAteOTermino: true } {
  const copia = { ...submissao } as Record<string, unknown>
  for (const campo of CAMPOS_DE_NOTA) delete copia[campo]
  /*
   * A tela precisa saber a DIFERENÇA entre "sem nota porque ainda não terminou"
   * e "sem nota porque a correção não saiu". Sem esta marca o relatório lia a
   * ausência de `score` como correção pendente e anunciava "Aguardando
   * correção" numa prova de múltipla escolha já corrigida — uma explicação
   * errada para uma espera real.
   */
  return { ...copia, notaPresaAteOTermino: true } as T & { notaPresaAteOTermino: true }
}

/** Aplica o veredito: devolve a submissão como ela deve chegar a esta pessoa. */
export function prepararSubmissaoParaEntrega<T extends Partial<ExamSubmission>>(
  submissao: T,
  prova: Partial<Exam> | null | undefined,
  contexto: ContextoDaNota,
): T | (T & { notaPresaAteOTermino: true }) {
  return notaLiberadaParaOAluno(prova, contexto) ? submissao : sanitizarNotaDaSubmissao(submissao)
}
