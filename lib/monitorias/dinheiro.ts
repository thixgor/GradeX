/**
 * Dinheiro das monitorias: centavos inteiros e a divisão 10% / 90%.
 *
 * Exemplo: aula de R$ 125,55 → 12555 centavos.
 *  - taxa da plataforma = floor(12555 × 10%) = 1255 (R$ 12,55)
 *  - monitor            = 12555 − 1255     = 11300 (R$ 113,00)
 * A soma das partes é SEMPRE o total — o centavo que sobra do arredondamento
 * fica com o monitor, nunca some.
 */

/** Percentual da plataforma (inteiro, em %). */
export const TAXA_PLATAFORMA_PERCENT = 10

export const VALOR_MINIMO_CENTAVOS = 1_000 // R$ 10,00
export const VALOR_MAXIMO_CENTAVOS = 500_000 // R$ 5.000,00 por assento

export function reaisParaCentavos(reais: number): number {
  return Math.round(Number(reais || 0) * 100)
}

export function centavosParaReais(centavos: number): number {
  return Math.round(Number(centavos || 0)) / 100
}

export function formatarCentavos(centavos: number): string {
  const reais = centavosParaReais(centavos)
  return reais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export interface Divisao {
  brutoCentavos: number
  taxaPlataformaCentavos: number
  liquidoTutorCentavos: number
}

export function dividirValor(brutoCentavos: number): Divisao {
  const bruto = Math.max(0, Math.round(brutoCentavos))
  const taxa = Math.floor((bruto * TAXA_PLATAFORMA_PERCENT) / 100)
  return { brutoCentavos: bruto, taxaPlataformaCentavos: taxa, liquidoTutorCentavos: bruto - taxa }
}

/** Aceita "125,50", "125.50", "R$ 1.250,00" ou número — devolve centavos ou null. */
export function interpretarValorEmReais(entrada: unknown): number | null {
  if (typeof entrada === 'number') return Number.isFinite(entrada) ? reaisParaCentavos(entrada) : null
  if (typeof entrada !== 'string') return null
  let texto = entrada.replace(/[R$\s]/g, '')
  if (!texto) return null
  if (texto.includes(',')) texto = texto.replace(/\./g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(texto)) return null
  return reaisParaCentavos(Number(texto))
}
