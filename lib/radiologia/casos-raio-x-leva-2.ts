import type { CategoriaCasoRaioX } from './casos-raio-x'
import { LEVA_2_TORAX } from './casos-raio-x-leva-2-torax'
import { LEVA_2_TRAUMA_PEDIATRIA } from './casos-raio-x-leva-2-trauma-pediatria'
import { LEVA_2_ABDOME } from './casos-raio-x-leva-2-abdome'
import { LEVA_2_OSTEOARTICULAR } from './casos-raio-x-leva-2-osteoarticular'

/**
 * Segunda leva de casos de Raio-X — 100 temas com imagens do Radiopaedia.
 *
 * Mesmo esqueleto da primeira leva (título, resumo, explicação, sinais,
 * armadilhas e os títulos das imagens, na ordem do manifesto
 * `data/radiologia/casos-raio-x-leva-2.json`). A diferença é o acervo: cada
 * imagem é uma radiografia única, sem a metade anotada — por isso os títulos
 * dizem a incidência e o achado que o aluno deve procurar sozinho.
 */
export interface DefinicaoCasoRaioX {
  categoria: CategoriaCasoRaioX
  slug: string
  titulo: string
  resumo: string
  explicacao: string
  imagens: string[]
  sinais?: string[]
  armadilhas?: string[]
}

export const DEFINICOES_LEVA_2: DefinicaoCasoRaioX[] = [
  ...LEVA_2_TORAX,
  ...LEVA_2_TRAUMA_PEDIATRIA,
  ...LEVA_2_ABDOME,
  ...LEVA_2_OSTEOARTICULAR,
]
