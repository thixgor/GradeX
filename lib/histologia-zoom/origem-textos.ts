import type { CategoriaDeOrigem } from './especies'

/**
 * Os textos fixos da origem da peça. Fora de `especies.ts` porque o selo e o
 * bloco de origem (`components/histologia-zoom/origem.tsx`) são desenhados no
 * navegador, e importar de lá levaria junto a tabela de origem de cada peça e
 * as comparações espécie × órgão para o JavaScript público.
 */

export const TEXTO_NAO_INFORMADA =
  'A fonte original não registra a espécie desta peça. Coleções didáticas misturam material humano e animal; por isso não a apresentamos como humana. A ficha de características descreve o órgão humano — confira nela os critérios que valem para qualquer mamífero.'

export const TEXTO_HUMANA = 'Peça humana, conforme registrado pela fonte original.'

export const ROTULO_DA_CATEGORIA: Record<CategoriaDeOrigem, string> = {
  humana: 'Peça humana',
  'nao-humana': 'Peça não humana',
  vegetal: 'Peça vegetal',
  'nao-informada': 'Espécie não informada',
}
