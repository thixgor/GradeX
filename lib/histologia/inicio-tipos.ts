import type { ItemDoCatalogo } from './catalogo-tipos'
import type { AcessoDaVitrine, DadosDaVitrine } from './vitrine-tipos'

/**
 * Contratos da home do Manual da Histologia.
 *
 * Num arquivo à parte, sem `server-only`, porque quem desenha a home é um
 * componente de cliente: `lib/histologia/inicio.ts` monta o objeto no
 * servidor, a rota o entrega, e o navegador só conhece o formato. Mesma
 * separação de `vitrine-tipos.ts`.
 */

export interface DadosDoInicio {
  /** A Histopatologia está aberta neste ambiente? Sem ela, nenhuma porta, fileira ou aba dela. */
  comPatologia: boolean
  hero: { href: string; imagem: string | null; credito: string | null }
  portas: {
    histologia: { href: string; imagem: string | null; laminas: number; comZoom: number; assuntos: number }
    histopatologia: { href: string; imagem: string | null; doencas: number; comZoom: number } | null
  }
  destaques: ItemDoCatalogo[]
  assuntos: ItemDoCatalogo[]
  doencas: ItemDoCatalogo[]
  comZoom: ItemDoCatalogo[]
  sistemas: ItemDoCatalogo[]
  recentes: ItemDoCatalogo[]
  praticar: ItemDoCatalogo[]
  totais: { quizzes: number; questoes: number }
}

/** A rota que decide a home. O casco pede o pré-carregamento dela junto com o HTML. */
export const ROTA_DO_INICIO = '/api/manual-clinico/histologia/inicio'

/**
 * O que `/api/manual-clinico/histologia/inicio` responde: o catálogo para quem
 * tem acesso, a vitrine para quem não tem. Nunca os dois.
 */
export type RespostaDoInicio =
  | { liberado: true; catalogo: DadosDoInicio }
  | { liberado: false; acesso: AcessoDaVitrine; vitrine: DadosDaVitrine }
