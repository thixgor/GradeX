/** Teto do título, o mesmo que `POST /api/exams` aplica. */
export const LIMITE_DO_TITULO = 150

/**
 * O título de uma cópia de prova.
 *
 * ## Por que não é só `'Cópia de ' + título`
 *
 * Duplicar a mesma prova três vezes produziria "Cópia de Cópia de Cópia de
 * Anatomia I". O prefixo cresce pela ESQUERDA e o que identifica a prova está
 * à direita — que é exatamente o pedaço cortado quando o título estoura o
 * limite de 150 caracteres. Depois de algumas cópias sobram três títulos que
 * começam iguais, terminam cortados e não se distinguem na lista.
 *
 * Aqui o prefixo é numerado em vez de empilhado: "Cópia de Anatomia I", depois
 * "Cópia 2 de Anatomia I". Duplicar uma cópia volta ao nome original antes de
 * numerar, então a segunda geração não herda o prefixo da primeira.
 *
 * O corte por tamanho é feito no NOME, antes de colar o prefixo: cortar o
 * título já montado devolveria duas cópias com o mesmo texto numa prova de
 * nome longo, porque a diferença ("2 de") ficaria no pedaço que sobrevive
 * enquanto o fim — igual nas duas — seria descartado.
 */
export function tituloDaCopia(original: string, existentes: readonly string[]): string {
  const semPrefixo = original.replace(/^Cópia(\s+\d+)? de\s+/i, '')
  const jaUsados = new Set(existentes)

  for (let n = 1; n <= 99; n++) {
    const prefixo = n === 1 ? 'Cópia de ' : `Cópia ${n} de `
    const nome = semPrefixo.slice(0, LIMITE_DO_TITULO - prefixo.length)
    const candidato = `${prefixo}${nome}`
    if (!jaUsados.has(candidato)) return candidato
  }

  return `Cópia de ${semPrefixo}`.slice(0, LIMITE_DO_TITULO)
}
