import type { LinhaDeAchado } from '@/components/histopatologia-zoom/lamina-patologica'
import type { Visto } from '@/lib/histologia/vistos'
import type { PiramideDaLamina, SistemaId } from '@/lib/histologia-zoom/tipos'

import type { DoencaZoom, LaminaPatologica, MarcacaoExibida } from './tipos'

/**
 * Contratos das páginas da Histopatologia com Zoom
 * (`/manual-clinico/histologia/histopatologia/zoom/…`).
 *
 * Sem `server-only`: as páginas são cascos estáticos desenhados no navegador.
 * Quem monta é `lib/histopatologia-zoom/paginas.ts`, depois do portão, pela rota
 * `/api/manual-clinico/histologia/histopatologia/zoom/…`.
 */

/**
 * Rota de dados: `[]` catálogo, `[doença]`, `[doença, lâmina]`,
 * `[doença, lâmina, 'comparar']` (com `?normal=` opcional).
 */
export function rotaDosDadosDaPatologiaComZoom(segmentos: string[], normal?: string | null): string {
  const caminho = ['/api/manual-clinico/histologia/histopatologia/zoom', ...segmentos.map(encodeURIComponent)].join('/')
  return normal ? `${caminho}?normal=${encodeURIComponent(normal)}` : caminho
}

type Vizinha = { href: string; rotulo: string } | null

export interface DadosDoCatalogoDaPatologiaComZoom {
  totais: { doencas: number; laminas: number; marcacoes: number }
  sistemas: Array<{
    id: SistemaId
    nome: string
    cor: string
    icone: string
    doencas: Array<{ id: string; nome: string; resumo: string; miniatura: string; laminas: number; achados: number }>
  }>
}

export interface DadosDaDoencaComZoom {
  doenca: DoencaZoom
  nomesDosAchados: Record<string, string>
  orgao: string | null
  /** Rota do capítulo escrito da mesma doença, quando existe. */
  capitulo: string | null
  laminas: Array<{ slug: string; nome: string; miniatura: string; caso: string; achadosPresentes: number }>
  normal: { sistema: SistemaId; slug: string; titulo: string; subtitulo: string | null; coloracao: string } | null
  visto: Omit<Visto, 'em'>
}

export interface DadosDaLaminaPatologica {
  doenca: DoencaZoom
  nomesDosAchados: Record<string, string>
  lamina: LaminaPatologica
  anotacao: { resumo: string; semMarcacoes: boolean; conferencias: number } | null
  marcacoes: MarcacaoExibida[]
  linhas: LinhaDeAchado[]
  normal: { sistema: SistemaId; slug: string; titulo: string; coloracao: string } | null
  anterior: Vizinha
  proxima: Vizinha
  urlDaLamina: string
  visto: Omit<Visto, 'em'>
}

interface LadoDaComparacao {
  titulo: string
  subtitulo: string | null
  piramide: PiramideDaLamina
  ampliacaoMaxima: number
  marcacoes: MarcacaoExibida[]
}

export interface DadosDaComparacaoPatologica {
  doenca: { id: string; nome: string; comparacaoComNormal: string[] }
  lamina: { slug: string; subtitulo: string | null }
  normal: { slug: string; titulo: string; rotulo: string; credito: string }
  doente: LadoDaComparacao
  sadio: LadoDaComparacao
  /** As lâminas normais do órgão que podem ficar do lado direito. */
  opcoes: Array<{ slug: string; rotulo: string }>
}
