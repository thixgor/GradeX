import type { Visto } from '@/lib/histologia/vistos'

import type { Coloracao } from './coloracoes'
import type { EstruturaMarcada } from './estruturas/tipos'
import type { DescricaoDeTecido } from './tecidos'
import type { LaminaResumida, LaminaZoom, Orgao, SistemaId, TipoDeTecido } from './tipos'

/**
 * Contratos das páginas da Histologia com Zoom (`/manual-clinico/histologia/zoom/…`).
 *
 * Sem `server-only`: as páginas são cascos estáticos desenhados no navegador, e
 * só o formato atravessa. Quem monta é `lib/histologia-zoom/paginas.ts`, depois
 * do portão, pela rota `/api/manual-clinico/histologia/zoom/…`.
 */

/** Rota de dados de uma página do zoom: `[]` catálogo, `['quiz']`, `[sistema]`, `[sistema, lamina]`. */
export function rotaDosDadosDoZoom(segmentos: string[]): string {
  return ['/api/manual-clinico/histologia/zoom', ...segmentos.map(encodeURIComponent)].join('/')
}

export interface DadosDoCatalogoDoZoom {
  totais: { laminas: number; orgaos: number; sistemas: number; humanas: number; naoHumanas: number; naoInformadas: number }
  /** "macaco, gato, …" — as espécies não humanas do acervo, para a nota de transparência. */
  especiesNaoHumanas: string
  destaques: Array<{ slug: string; sistema: SistemaId; titulo: string; coloracao: string; miniatura: string }>
  /** Índice leve da busca no cliente. */
  indice: Array<LaminaResumida & { termos: string }>
  sistemas: Array<{
    id: SistemaId
    nome: string
    cor: string
    icone: string
    capa: string | null
    laminas: number
    orgaos: Array<{ id: string; nome: string }>
  }>
}

export interface DadosDoSistemaDoZoom {
  sistema: { id: SistemaId; nome: string; descricao: string; cor: string; icone: string }
  total: number
  orgaos: Array<{
    id: string
    nome: string
    resumo: string
    /** Os três tecidos mais abundantes, já com o rótulo curto. */
    tecidos: Array<{ tipo: TipoDeTecido; curto: string; pct: number }>
    laminas: LaminaResumida[]
  }>
  vizinhos: [{ id: SistemaId; nome: string } | null, { id: SistemaId; nome: string } | null]
}

export interface DadosDaLaminaDoZoom {
  lamina: LaminaZoom
  orgao: Orgao
  sistema: { id: SistemaId; nome: string }
  /** Classificação só dos tecidos que a ficha deste órgão cita. */
  descricoes: Partial<Record<TipoDeTecido, DescricaoDeTecido>>
  coloracao: Coloracao | null
  estruturas: EstruturaMarcada[]
  irmas: LaminaResumida[]
  outrosOrgaos: Array<{ id: string; nome: string; href: string }>
  anterior: { href: string; rotulo: string } | null
  proxima: { href: string; rotulo: string } | null
  urlDaLamina: string
  visto: Omit<Visto, 'em'>
}

export interface DadosDoQuizDoZoom {
  sistemas: Array<{ sistema: SistemaId; nome: string; estrutura: number; orgao: number }>
  estruturas: number
  orgaos: number
}
