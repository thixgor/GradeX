import type { EntradaDaGaleriaWebPathUtah } from '@/components/histopatologia/galeria-webpath-utah'

import type { MecanismoGeral, MidiaExibivel, ReferenciaNormal, ResumoDeDoenca, ResumoDeEntrada } from './esquemas'
import type { CapituloWebPathUtahResumo } from './webpath-utah/catalogo'

/**
 * Contratos das páginas da Histopatologia que não são a home, o capítulo de
 * doença nem a área com zoom: atlas, entrada do atlas, capítulo do
 * WebPath/Utah, comparador, créditos, mecanismos e sistema.
 *
 * Sem `server-only`: as páginas são cascos estáticos desenhados no navegador.
 * Quem monta é `lib/histopatologia/paginas.ts`, depois do portão, pela rota
 * `/api/manual-clinico/histologia/histopatologia/…`.
 */

/**
 * Rota de dados de uma página da área. `filtros` são os parâmetros que a página
 * lia da URL (página, modalidade, busca…): o casco os lê no navegador e os
 * repassa, e é a rota que os valida.
 */
export function rotaDosDadosDaHistopatologia(segmentos: string[], filtros: Record<string, string | null | undefined> = {}) {
  const caminho = ['/api/manual-clinico/histologia/histopatologia', ...segmentos.map(encodeURIComponent)].join('/')
  const busca = new URLSearchParams()
  for (const [nome, valor] of Object.entries(filtros)) if (valor) busca.set(nome, valor)
  const consulta = busca.toString()
  return consulta ? `${caminho}?${consulta}` : caminho
}

export interface DadosDoAtlasDaPatologia {
  totalDeItens: number
  totalWebPath: number
  capitulosWebPath: Array<Pick<CapituloWebPathUtahResumo, 'id' | 'nome' | 'descricao' | 'total'>>
  sistemas: Array<{ id: string; nome: string; entradas: number }>
  fontes: Array<{ id: string; nome: string; atribuicaoCatalogada: string; politicaInicial: string; url: string }>
  falhasDeColeta: number
}

export interface DadosDaEntradaDoAtlas {
  entrada: Omit<ResumoDeEntrada, 'fragmentosDeMidia'>
  fonte: { nome: string; atribuicaoCatalogada: string }
  sistema: string | null
  doenca: { slug: string; nome: string } | null
  inventario: { acervoDisponivel: boolean; itens: MidiaExibivel[]; total: number; descartadasPorAllowlist: number }
  pagina: number
  porPagina: number
  totalDePaginas: number
  avisoDeAcervoIndisponivel: string
}

export interface DadosDoCapituloWebPath {
  resumo: Pick<CapituloWebPathUtahResumo, 'id' | 'grupo' | 'nome' | 'nomeOriginal' | 'descricao' | 'roteiro' | 'total'>
  macros: number
  micros: number
  encontradas: number
  /** Os filtros como a rota os aceitou (busca, modalidade, referência). */
  consulta: string
  modalidade: 'todas' | 'macroscopia' | 'microscopia'
  referencia: string
  pagina: number
  paginas: number
  entradas: EntradaDaGaleriaWebPathUtah[]
}

export interface DadosDaComparacaoComNormal {
  doenca: { slug: string; nome: string }
  referencia: ReferenciaNormal
  midias: MidiaExibivel[]
  linhasComparativas: Array<{ aspecto: string; normal: string; patologico: string }>
}

export interface DadosDosCreditos {
  creditoBase: string
  avisoEducacional: string
  alteracoes: string[]
  fontes: Array<{
    id: string
    creditoCurto: string
    situacaoDeDireitos: string
    atribuicaoCatalogada: string
    url: string
    doi?: string
  }>
}

export interface DadosDosMecanismos {
  total: number
  mecanismos: MecanismoGeral[]
  contagemPorMecanismo: Record<string, number>
}

export interface DadosDoMecanismo {
  mecanismo: MecanismoGeral
  familia: { id: MecanismoGeral['familia']; nome: string } | null
  doencas: ResumoDeDoenca[]
  irmaos: Array<{ id: string; nome: string }>
}

export interface DadosDoSistemaDaPatologia {
  sistema: { id: string; nome: string; descricao: string; entradas: number; midias: number; doencas: number; caminhoNormal: string[] | null }
  doencas: ResumoDeDoenca[]
  totalDoInventario: number
  /** Os capítulos do atlas que têm entradas neste sistema, com a contagem — os filtros. */
  capitulos: Array<{ id: string; nome: string; total: number }>
  capituloSelecionado: string | null
  grupos: Array<{
    id: string
    nome: string
    descricao: string
    entradas: Array<Pick<ResumoDeEntrada, 'id' | 'nome' | 'descricao' | 'midias' | 'temLaminaVirtual' | 'doencaSlug'>>
  }>
  pagina: number
  totalDePaginas: number
}
