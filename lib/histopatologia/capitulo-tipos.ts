import type { AplicacaoDeMecanismoResolvida } from '@/components/histopatologia/tipos'
import type { LaminaDaDoenca } from '@/components/histopatologia-zoom/laminas-da-doenca'
import type { Visto } from '@/lib/histologia/vistos'

import type { ReferenciaVisualExterna } from './editorial/referencias-visuais'
import type { DoencaCanonica, FragmentoDeDoenca, MidiaExibivel } from './esquemas'

/**
 * Contrato do capítulo de doença (`/manual-clinico/histologia/histopatologia/doencas/<slug>`).
 *
 * Sem `server-only`: o capítulo é um casco estático desenhado no navegador.
 * Quem monta é `lib/histopatologia/capitulo.ts`, depois do portão, pela rota
 * `/api/manual-clinico/histologia/histopatologia/doencas/<slug>`.
 */

export function rotaDosDadosDoCapitulo(slug: string): string {
  return `/api/manual-clinico/histologia/histopatologia/doencas/${encodeURIComponent(slug)}`
}

export interface DadosDoCapitulo {
  doenca: DoencaCanonica
  sistema: { id: string; nome: string } | null
  trilha: Array<{ titulo: string; caminho: string }>
  /** Mecanismos gerais resolvidos: o objeto pronto, sem acesso ao repositório. */
  mecanismos: AplicacaoDeMecanismoResolvida[]
  /** Seleção editorial primeiro; o restante da galeria depois. */
  principais: MidiaExibivel[]
  restantes: MidiaExibivel[]
  referenciasVisuaisExternas: ReferenciaVisualExterna[]
  entradas: FragmentoDeDoenca['entradas']
  /** Só as fontes citadas nesta doença. */
  fontes: Array<{ id: string; creditoCurto: string; atribuicaoCatalogada: string; url: string }>
  /** A mesma doença com lâmina de zoom, quando existe. */
  zoom: { doenca: string; laminas: LaminaDaDoenca[] } | null
  /** Os mecanismos do rodapé de navegação. */
  mecanismosDoRodape: Array<{ id: string; nome: string }>
  visto: Omit<Visto, 'em'>
  jsonLd: Record<string, unknown>[]
}
