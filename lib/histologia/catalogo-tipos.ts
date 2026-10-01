import type { LaminaResumida } from '@/lib/histologia-zoom/tipos'

/**
 * Tipos do catálogo, sem dependências de servidor: o cartão é usado também na
 * fileira de cliente "Continue estudando". Ver `catalogo.ts`.
 */

export type AreaDoCatalogo = 'histologia' | 'histopatologia' | 'praticar'

export interface ItemDoCatalogo {
  /** Chave estável dentro de uma fileira. */
  id: string
  href: string
  titulo: string
  /** Linha de categoria: "Histologia · Sistema nervoso". */
  categoria: string
  area: AreaDoCatalogo
  /** Miniatura real; `null` vira capa tipográfica, nunca imagem inventada. */
  imagem: string | null
  /** Lâminas DZI: mosaico de até 2×2 tiles, nítido no cartão. */
  mosaico?: LaminaResumida['mosaico']
  /** Há visualização com zoom interativo (lâmina inteira)? */
  zoom: boolean
  /** Informação extra revelada no hover: contagens, coloração. */
  detalhe?: string
  /** Cor de acento da capa tipográfica. */
  cor?: string
  /** Ícone da capa tipográfica (nome do lucide, resolvido no componente). */
  icone?: string
}
