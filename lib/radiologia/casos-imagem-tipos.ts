import type { DistratorClinico, VinhetaClinica } from './casos-clinicos'

export type Modalidade = 'tc' | 'rx'

export type CategoriaCaso =
  | 'neuro'
  | 'cabeca-pescoco'
  | 'torax'
  | 'cardio'
  | 'abdome'
  | 'trauma'
  | 'pediatrico'
  | 'osteoarticular'

/**
 * Tradução e comentário de uma seta do autor do caso.
 *
 * - `nome`: como a estrutura ou o achado se chama em português.
 * - `resumo`: uma linha, o que a seta mostra naquele corte.
 * - `explicacao`: o comentário didático — por que a imagem fica assim
 *   (densidade, física da aquisição, fisiopatologia), como reconhecer sem a
 *   seta e o que o achado muda no raciocínio.
 * - `dica`: a armadilha ou o diferencial que aquele ponto da imagem costuma
 *   provocar.
 */
export interface RotuloDetalhado {
  nome: string
  resumo: string
  explicacao: string
  dica?: string
}

/**
 * Chave: o rótulo original em inglês, exatamente como veio do Radiopaedia.
 * A forma em tupla (nome, resumo) é a da primeira leva, cuja explicação
 * aprofundada mora em `casos-tc-explicacoes.ts`. `null` descarta a seta.
 */
export type TraducaoRotulo = [nome: string, resumo: string] | RotuloDetalhado | null

/**
 * Seta acrescentada por nós onde o autor não apontou uma alteração importante.
 * A posição é uma fração da imagem (0 a 1), para não depender da resolução
 * do arquivo; a rotação segue a convenção do visor (0 aponta para a esquerda).
 */
export interface ApontamentoProprio extends RotuloDetalhado {
  serie: number
  /** Corte 0-based; nas radiografias é sempre 0. */
  corte?: number
  x: number
  y: number
  rotacao?: number
}

/** O que se escreve à mão para cada caso. O resto vem do manifesto. */
export interface ConteudoCaso {
  /** Subgrupo dentro da região: "Vascular", "Trauma", "Infecção"… */
  tema?: string
  titulo: string
  resumo: string
  /** Protocolo das séries exibidas: com ou sem contraste, fase, incidência. */
  protocolo: string
  rotulos: Record<string, TraducaoRotulo>
  /** Alterações sem seta do autor, apontadas por nós. */
  apontamentosProprios?: ApontamentoProprio[]
  /** Nome de cada série, quando o caso tem mais de uma (0-based). */
  series?: string[]
  /** Leitura do exame, na ordem em que um radiologista a ditaria. */
  achados: string[]
  armadilhas: string[]
  conduta: string
  vinheta: VinhetaClinica
}

export const d = (nome: string, porQue: string): DistratorClinico => ({ nome, porQue })

/** Atalho para escrever um rótulo detalhado. */
/** Atalho para escrever uma seta própria: série, posição em fração da imagem e rotação. */
export const p = (
  serie: number,
  x: number,
  y: number,
  rotacao: number,
  nome: string,
  resumo: string,
  explicacao: string,
  dica?: string,
): ApontamentoProprio => ({ serie, x, y, rotacao, nome, resumo, explicacao, dica })

export const r = (nome: string, resumo: string, explicacao: string, dica?: string): RotuloDetalhado => ({
  nome,
  resumo,
  explicacao,
  dica,
})

/* ─────────────────────────── Manifesto (v2) ─────────────────────────── */

export interface AnotacaoManifesto {
  rotulo: string
  /** [corte 0-based, x, y, rotação] em pixels da imagem original. */
  pontos: number[][]
}

export interface SerieManifesto {
  perspectiva: string
  largura: number
  altura: number
  totalFatias: number
  /** Caminho no espelho antes do número do corte: `radiologia/tc/<slug>/`. */
  prefixo: string
  anotacoes: AnotacaoManifesto[]
}

export interface CasoManifesto {
  slug: string
  modalidade: Modalidade
  categoria: CategoriaCaso
  urlDoCaso: string
  autoria: string
  series: SerieManifesto[]
}
