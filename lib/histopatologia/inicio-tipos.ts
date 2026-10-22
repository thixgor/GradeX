import type { ItemDoCatalogo } from '@/lib/histologia/catalogo-tipos'

/**
 * Contrato da home da Histopatologia (`/manual-clinico/histologia/histopatologia`).
 *
 * Sem `server-only`: quem desenha é um componente de cliente. Montado por
 * `lib/histopatologia/inicio.ts`, entregue depois do portão.
 */

/** A rota de dados da home da Histopatologia. */
export const ROTA_DA_HISTOPATOLOGIA = '/api/manual-clinico/histologia/histopatologia'

export interface DadosDaHistopatologia {
  /** Capa do banner: a primeira doença com lâmina de zoom. */
  imagem: string | null
  totais: {
    doencas: number
    laminasComZoom: number
    marcacoes: number
    itensDeAtlas: number
    mecanismos: number
  }
  comZoom: ItemDoCatalogo[]
  recentes: ItemDoCatalogo[]
  capitulos: ItemDoCatalogo[]
  /** `href`: a página do sistema unificado (normal e doente juntos). */
  porSistema: Array<{ id: string; nome: string; href: string; itens: ItemDoCatalogo[] }>
  atlasPorSistema: ItemDoCatalogo[]
  /** Os primeiros mecanismos gerais, para os atalhos. */
  mecanismos: Array<{ id: string; nome: string }>
}
