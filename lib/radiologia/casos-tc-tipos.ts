import type { DistratorClinico, VinhetaClinica } from './casos-clinicos'

export type CategoriaCasoTC = 'neuro' | 'cabeca-pescoco' | 'torax' | 'abdome' | 'trauma'

/**
 * Tradução de uma seta do autor do caso.
 *
 * A chave é o rótulo original em inglês, exatamente como veio do visualizador
 * do Radiopaedia; o valor é o nome em português e uma frase dizendo o que a seta
 * mostra naquele corte. `null` descarta a seta — rótulos vazios de sentido
 * ("right", "a") ou que apontam para achado alheio ao ensino do caso.
 */
export type TraducaoRotulo = [nome: string, explicacao: string] | null

/** O que se escreve à mão para cada pilha de TC. O resto vem do manifesto. */
export interface ConteudoCasoTC {
  titulo: string
  resumo: string
  /** Protocolo da série exibida: com ou sem contraste, fase, janela. */
  protocolo: string
  rotulos: Record<string, TraducaoRotulo>
  /** Leitura do exame, na ordem em que um radiologista a ditaria. */
  achados: string[]
  armadilhas: string[]
  conduta: string
  vinheta: VinhetaClinica
}

export const d = (nome: string, porQue: string): DistratorClinico => ({ nome, porQue })
