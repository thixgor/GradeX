import type { MecanismoGeral } from '../esquemas'

/**
 * As oito famílias de mecanismo: nome e ordem. Fora de `mecanismos.ts` porque
 * o mapa dos mecanismos é desenhado no navegador, e importar de lá levaria o
 * texto de todos os mecanismos para o JavaScript público — o mapa recebe os
 * mecanismos pela rota de dados, depois do portão.
 */
export const FAMILIAS_DE_MECANISMO: Array<{ id: MecanismoGeral['familia']; nome: string }> = [
  { id: 'lesao-celular', nome: 'Lesão e morte celular' },
  { id: 'inflamacao', nome: 'Inflamação' },
  { id: 'hemodinamica', nome: 'Distúrbios hemodinâmicos' },
  { id: 'imunopatologia', nome: 'Imunopatologia' },
  { id: 'infeccao', nome: 'Infecção' },
  { id: 'reparo-fibrose', nome: 'Reparo e fibrose' },
  { id: 'genetica', nome: 'Alterações genéticas' },
  { id: 'neoplasia', nome: 'Neoplasia' },
]
