/**
 * Explicação APROFUNDADA de cada traçado do Manual do Eletrocardiograma.
 *
 * O painel clínico (`EcgClinicalPanel`) responde "o que é / o que fazer" em
 * listas curtas. Aqui é o oposto: texto corrido, didático, que explica POR QUE
 * o traçado tem exatamente aquele desenho — do fenômeno elétrico na célula até
 * a caneta do aparelho — e ensina a reconhecê-lo em segundos.
 *
 * A estrutura é a mesma para os 90 padrões, de propósito: quem estuda dez
 * traçados já sabe onde procurar cada informação no décimo primeiro.
 */

/** Bloco narrativo: um título curto e um parágrafo (ou dois) de texto corrido. */
export interface DeepDiveSection {
  titulo: string
  texto: string
}

/** Uma linha da leitura sistemática "onda a onda". */
export interface WaveRow {
  /** Elemento do traçado: Ritmo, Onda P, PR, QRS, ST, Onda T, QT… */
  onda: string
  /** O que se vê nesse elemento NESTE padrão, e o que isso significa. */
  achado: string
}

/** Par "confunde-se com X → o que separa". */
export interface DiffRow {
  de: string
  chave: string
}

export interface EcgDeepDive {
  /** A definição do padrão em uma frase — o que o torna ele e não outro. */
  emUmaFrase: string
  /** 3–6 blocos de texto: eletrofisiologia, gênese do traçado, clínica, evolução. */
  secoes: DeepDiveSection[]
  /** Leitura sistemática aplicada a este padrão. */
  ondaAOnda: WaveRow[]
  /** Roteiro de reconhecimento rápido, na ordem em que o olho deve percorrer. */
  roteiro: string[]
  /** Como não confundir com os vizinhos de prateleira. */
  separando?: DiffRow[]
  /** Âncoras de memória: analogias, mnemônicos, números que valem decorar. */
  fixacao?: string[]
}

export type DeepDiveMap = Record<string, EcgDeepDive>
