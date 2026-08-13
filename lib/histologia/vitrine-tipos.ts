/**
 * Contratos da landing de vendas do Manual da Histologia.
 *
 * Ficam num arquivo à parte, e não junto do montador, porque a vitrine é um
 * componente de cliente: `lib/histologia/vitrine.ts` abre com `server-only` e
 * importá-lo do navegador — ainda que só pelo tipo — é o tipo de erro que só
 * aparece no build de produção. Mesma separação de `lib/anatomia/tipos.ts`.
 */

export interface CamadaDaAmostra {
  id: string
  rotulo: string
  /** O rótulo veio do glossário editorial? A interface marca o que não veio. */
  traduzido: boolean
  explicacao: string | null
  url: string
}

export interface AmostraDaVitrine {
  titulo: string
  /** Trilha legível até a lâmina, para a amostra ter endereço no currículo. */
  trilha: string
  url: string
  alt: string
  coloracoes: string[]
  camadas: CamadaDaAmostra[]
}

export interface SetorDaVitrine {
  slug: string
  titulo: string
  laminas: number
  estruturas: number
  capa: string | null
}

export interface TotaisDaVitrine {
  laminas: number
  estruturas: number
  setores: number
  subsetores: number
  quizzes: number
  questoes: number
  laboratorios: number
  doencas: number
  capitulosVisuais: number
  sistemasPatologicos: number
}

export interface DadosDaVitrine {
  amostra: AmostraDaVitrine | null
  setores: SetorDaVitrine[]
  totais: TotaisDaVitrine
}

/** Plano do Manual Clínico, no recorte que a vitrine precisa para o preço. */
export interface PlanoDaVitrine {
  key: string
  label: string
  durationMonths: number | null
  price: number
  enabled: boolean
  pricingEventId: string | null
}

export interface ProdutoDaVitrine {
  label: string
  ctaText: string
  isActive: boolean
  currentPrice: number
  price: number
  hasActivePromotion: boolean
  pricingEventId: string | null
  plans: PlanoDaVitrine[]
}

export interface AcessoDaVitrine {
  autenticado: boolean
  /** Preso do lado de fora com sessão, sem sessão, ou por falha de serviço. */
  motivo: 'locked' | 'guest' | 'indisponivel'
  produto: ProdutoDaVitrine | null
}
