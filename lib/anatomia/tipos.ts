import type { AtlasMarker } from '@/lib/atlas-anatomia/estrutura'
import type { MarkerInsight } from '@/lib/atlas-anatomia/insights'

/**
 * Contrato entre `/api/anatomia` e as telas da seção.
 *
 * A seção é privativa, então o navegador de quem não assina não pode receber o
 * catálogo — só este resumo. Os tipos vivem aqui, e não na rota, para a landing
 * e o hub poderem importá-los sem arrastar junto o acervo do Atlas.
 */

export interface SistemaResumo {
  slug: string
  titulo: string
  capa: string
  pranchas: number
  colecoes: number
  marcadores: number
}

export interface CategoriaResumo {
  id: string
  titulo: string
  subtitulo: string
  icone: string
  cor: string
  quantidade: number
}

export interface DestaqueResumo {
  slug: string
  titulo: string
  legenda: string
  categoriaId: string
  sketchfabId: string | null
}

/** Prancha liberada como amostra, com as fichas de todos os seus marcadores. */
export interface AmostraAnatomia {
  sistema: string
  colecao: string
  prancha: { id: string; title: string; image: string; markers: AtlasMarker[] }
  indiceDestaque: number
  fichas: MarkerInsight[]
}

export interface ResumoAnatomia {
  sistemas: SistemaResumo[]
  totalSistemas: number
  totalPranchas: number
  totalMarcadores: number
  totalModelos: number
  categorias: CategoriaResumo[]
  destaques: DestaqueResumo[]
  amostra: AmostraAnatomia | null
}

export interface PlanoProduto {
  key: string
  label?: string
  price: number
  enabled: boolean
  durationMonths?: number | null
  pricingEventId?: string | null
}

export interface RespostaAcessoAnatomia {
  isAuthenticated: boolean
  access: {
    hasFullAccess: boolean
    reason: string
    includedPlan: string | null
  }
  /** `null` quando o banco não respondeu — a landing renderiza sem preço. */
  product: {
    label: string
    ctaText: string
    isActive: boolean
    currentPrice: number
    hasActivePromotion: boolean
    price: number
    pricingEventId?: string | null
    plans?: PlanoProduto[]
  } | null
  catalogo: ResumoAnatomia
}
