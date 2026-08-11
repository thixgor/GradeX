import type { CategoriaEstrutura } from './tipos'

/**
 * Contrato do recorte magro do Manual de Tomografia usado pela tela de índice —
 * e a busca que roda sobre ele no navegador.
 *
 * Este arquivo não importa dado nenhum de propósito: quem o carrega é um
 * componente de cliente, e um único `import` de valor vindo de `lib/tomografia`
 * arrastaria os 780 KB do atlas (vinte séries, 272 fichas, roteiros, quizzes)
 * para dentro do bundle. Quem monta o catálogo é `montar-catalogo.ts`, que só o
 * servidor carrega.
 */

export interface SerieResumo {
  id: string
  titulo: string
  subtitulo: string
  icone: string
  cor: string
  totalCortes: number
  totalEstruturas: number
  /** Corte do meio da série — costuma ser o mais representativo. */
  capa: string
}

export interface SecaoResumo {
  id: string
  titulo: string
  descricao: string
  icone: string
  cor: string
  totalEstruturas: number
  totalCortes: number
  series: SerieResumo[]
}

/** Entrada da busca por estrutura. Só o que a lista de resultados exibe. */
export interface EstruturaIndexada {
  id: string
  nome: string
  resumo: string
  categoria: CategoriaEstrutura
  sinonimos: string[]
  serieId: string
  serieTitulo: string
}

export interface CatalogoTC {
  secoes: SecaoResumo[]
  indice: EstruturaIndexada[]
  totais: {
    series: number
    estruturas: number
    cortes: number
    questoes: number
  }
}

/** Busca sobre o índice já enviado — pura, para rodar no navegador. */
export function buscarNoIndice(indice: EstruturaIndexada[], termo: string): EstruturaIndexada[] {
  const consulta = termo.trim().toLowerCase()
  if (consulta.length < 2) return []
  return indice.filter(
    (estrutura) =>
      estrutura.nome.toLowerCase().includes(consulta) ||
      estrutura.sinonimos.some((sinonimo) => sinonimo.toLowerCase().includes(consulta)),
  )
}
