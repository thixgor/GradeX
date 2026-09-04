import type { Exam } from '@/lib/types'

/**
 * A classificação de uma prova: quem vê a lista, e o que sobra para quem não vê.
 *
 * ## O botão que faltava
 *
 * A tela de resultados sempre mostrou a lista de notas com nome, para toda a
 * turma. Nem toda prova quer isso: um simulado diagnóstico, uma prova de
 * recuperação ou uma turma pequena onde a última colocação tem nome e sobrenome
 * são casos em que o ranking público custa mais do que rende. `showRanking`
 * dá ao admin esse botão.
 *
 * ## Esconder de verdade
 *
 * A decisão é aplicada no SERVIDOR (`app/api/exams/[id]/results/route.ts`), não
 * no `if` da tela. A rota devolvia `results` com nome e nota de todo mundo, e
 * esconder a seção no React deixaria a lista inteira a um `fetch` de distância
 * — no console, ou na aba de rede, sem nenhuma ferramenta.
 *
 * ## O que continua aparecendo com o ranking desligado
 *
 * A nota da própria pessoa e a **distribuição anônima** da turma: quantos
 * ficaram em cada faixa, a média, a maior e a menor nota. Nada disso identifica
 * ninguém, e é o que responde "eu fui bem?" — a pergunta que traz o aluno à
 * tela. Desligar a classificação tira os nomes, não o retorno.
 */

/** Faixas da distribuição, em porcentagem da nota máxima. */
export const FAIXAS_DE_NOTA = [
  { rotulo: '0–20%', min: 0, max: 20 },
  { rotulo: '20–40%', min: 20, max: 40 },
  { rotulo: '40–60%', min: 40, max: 60 },
  { rotulo: '60–80%', min: 60, max: 80 },
  { rotulo: '80–100%', min: 80, max: 100.0001 },
] as const

export interface LinhaDeNota {
  userId: string
  userName: string
  nota: number
}

export interface EstatisticasDaTurma {
  participantes: number
  media: number
  maior: number
  menor: number
  distribuicao: { rotulo: string; quantidade: number }[]
}

/** A classificação desta prova aparece para quem não é admin? */
export function mostraClassificacao(
  prova: Partial<Exam> | null | undefined,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return true
  // Ausente = visível: é como todas as provas criadas antes do campo se
  // comportavam, e um documento antigo não pode perder o ranking em silêncio.
  return prova?.showRanking !== false
}

/**
 * O resumo anônimo da turma.
 *
 * Calculado no servidor mesmo quando a lista vai junto: com o ranking
 * desligado o cliente não tem as notas dos outros para somar, e ter duas
 * implementações do mesmo número — uma para cada caso — é como as três
 * "médias" diferentes que este projeto já teve.
 */
export function resumirTurma(
  notas: readonly number[],
  notaMaxima: number,
): EstatisticasDaTurma | null {
  if (notas.length === 0) return null

  const ordenadas = [...notas].sort((a, b) => b - a)
  const soma = ordenadas.reduce((a, b) => a + b, 0)

  return {
    participantes: ordenadas.length,
    media: soma / ordenadas.length,
    maior: ordenadas[0],
    menor: ordenadas[ordenadas.length - 1],
    distribuicao: FAIXAS_DE_NOTA.map((faixa) => ({
      rotulo: faixa.rotulo,
      quantidade: ordenadas.filter((n) => {
        const pct = notaMaxima > 0 ? (n / notaMaxima) * 100 : 0
        return pct >= faixa.min && pct < faixa.max
      }).length,
    })),
  }
}

/**
 * A posição de uma pessoa na lista ordenada, com empate contando como a mesma
 * colocação (duas notas 90 são as duas em 1º, e a seguinte é 3º).
 */
export function posicaoNaTurma(
  notas: readonly number[],
  minhaNota: number,
): { posicao: number; percentil: number } {
  const melhoresQueEu = notas.filter((n) => n > minhaNota).length
  const total = Math.max(1, notas.length)
  return {
    posicao: melhoresQueEu + 1,
    percentil: Math.round(((total - melhoresQueEu - 1) / Math.max(1, total - 1)) * 100),
  }
}
