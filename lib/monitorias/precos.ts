/**
 * Preço de uma aula — conta pura, a MESMA no navegador (para mostrar) e no
 * servidor (para cobrar). O servidor nunca aceita valor vindo do cliente:
 * recalcula daqui.
 */

import type { ConteudoAnuncio, FaixaGrupo } from './tipos'

/** Faixa de grupo que vale para `alunos` — a de maior `minAlunos` ≤ alunos. */
export function faixaPara(faixas: FaixaGrupo[], alunos: number): FaixaGrupo | null {
  let melhor: FaixaGrupo | null = null
  for (const faixa of faixas) {
    if (faixa.minAlunos <= alunos && (!melhor || faixa.minAlunos > melhor.minAlunos)) melhor = faixa
  }
  return melhor
}

/**
 * Preço por pessoa de uma aula do anúncio.
 *
 * - Individual: preço do anúncio (por aula, ou por hora × duração).
 * - Grupo: o valor da faixa vale para a mesma base (aula ou hora).
 *
 * Exemplo: R$ 60/h, 90 min, 3 alunos com faixa "3+ → R$ 40/h" → R$ 60 por pessoa.
 */
export function precoPorPessoaCentavos(
  anuncio: Pick<ConteudoAnuncio, 'preco' | 'grupo'>,
  duracaoMin: number,
  vagas: number,
): number {
  let base = anuncio.preco.valorCentavos
  if (vagas > 1 && anuncio.grupo.ativo) {
    const faixa = faixaPara(anuncio.grupo.faixas, vagas)
    if (faixa) base = faixa.valorPorPessoaCentavos
  }
  if (anuncio.preco.modo === 'hora') {
    return Math.round((base * duracaoMin) / 60)
  }
  return base
}

/** "Economia" de cada aluno no grupo em relação à aula individual, em %. */
export function economiaGrupoPercent(anuncio: Pick<ConteudoAnuncio, 'preco' | 'grupo'>, vagas: number): number {
  const individual = anuncio.preco.valorCentavos
  if (individual <= 0 || vagas <= 1) return 0
  const faixa = faixaPara(anuncio.grupo.faixas, vagas)
  if (!faixa) return 0
  return Math.max(0, Math.round((1 - faixa.valorPorPessoaCentavos / individual) * 100))
}

/** Faixas válidas: começam em 2+, crescem em alunos e caem em preço. */
export function validarFaixas(faixas: FaixaGrupo[], valorIndividualCentavos: number, maxAlunos: number): string | null {
  const ordenadas = [...faixas].sort((a, b) => a.minAlunos - b.minAlunos)
  let anterior = valorIndividualCentavos
  let minAnterior = 1
  for (const faixa of ordenadas) {
    if (faixa.minAlunos < 2) return 'Faixas de grupo começam em 2 alunos.'
    if (faixa.minAlunos > maxAlunos) return `Há faixa acima do máximo de ${maxAlunos} alunos.`
    if (faixa.minAlunos === minAnterior) return 'Duas faixas com o mesmo número de alunos.'
    if (faixa.valorPorPessoaCentavos >= anterior) {
      return 'Cada faixa de grupo deve ser mais barata por pessoa que a anterior.'
    }
    anterior = faixa.valorPorPessoaCentavos
    minAnterior = faixa.minAlunos
  }
  return null
}
