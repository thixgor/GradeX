import manifestoImagem from '@/data/radiologia/casos-imagem.json'
import type { CasoManifesto, CategoriaCaso, ConteudoCaso } from './casos-imagem-tipos'
import { criarColecao } from './casos-imagem-colecao'
import { CASOS_RX_APONTADOS } from './casos-rx-apontados'

/**
 * Casos clínicos de Raio-X com apontamentos.
 *
 * Diferentes da galeria "Casos e alterações" (filme limpo ao lado do filme
 * marcado), aqui cada radiografia traz as setas que o autor do caso desenhou no
 * Radiopaedia, redesenhadas com rótulo em português e comentário didático, e o
 * caso começa pela consulta inteira, como os casos de TC.
 */

export const ORDEM_CATEGORIAS_RX: CategoriaCaso[] = ['torax', 'cardio', 'abdome', 'pediatrico', 'osteoarticular']

export const TEMAS_RX: Record<string, string[]> = {
  torax: ['Infecção', 'Edema e vascular', 'Tumores', 'Malformações', 'Vias aéreas'],
  cardio: ['Cardiopatias', 'Aorta'],
  abdome: ['Cálculos e calcificações', 'Obstrução'],
  pediatrico: ['Abdome do lactente', 'Tórax', 'Osso em crescimento', 'Quadril'],
  osteoarticular: ['Fraturas e luxações', 'Coluna', 'Artropatias', 'Doenças metabólicas', 'Tumores ósseos'],
}

export const LICENCA_CASOS_RX: string = manifestoImagem.licenca

export const COLECAO_RX = criarColecao(
  'rx',
  ORDEM_CATEGORIAS_RX,
  TEMAS_RX,
  manifestoImagem.casos as CasoManifesto[],
  CASOS_RX_APONTADOS as Record<string, ConteudoCaso>,
)
