import type { EtapaDoEstudo, ItemDoManual, ModuloIntegrado, Natureza } from './tipos'
import { naturezasDoTexto, orgaosDoTexto, orgaosNaOrdemDoTexto, termosDoTexto } from './vocabulario'

/**
 * A tradução de um item de qualquer manual para o formato comum do índice.
 *
 * Fica num arquivo leve, sem importar acervo nenhum, porque é usada tanto pelo
 * gerador do índice estático (que lê os módulos inteiros) quanto pela rota,
 * que monta as fichas do banco em tempo de requisição.
 */

const LIMITE_SUBTITULO = 110

function curto(texto: string | undefined): string | undefined {
  if (!texto) return undefined
  const limpo = texto.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim()
  return limpo.length > LIMITE_SUBTITULO ? `${limpo.slice(0, LIMITE_SUBTITULO - 1).trimEnd()}…` : limpo
}

export interface Rascunho {
  ref: string
  modulo: ModuloIntegrado
  tipo: string
  titulo: string
  subtitulo?: string
  href: string
  etapa: EtapaDoEstudo
  /** Textos que nomeiam o assunto: o título primeiro, depois os sinônimos. */
  nomes: string[]
  /** Texto de apoio, consultado só quando os nomes não dizem o órgão. */
  contexto?: string
  orgaosExtras?: string[]
  /** Substitui a leitura de órgãos pelos nomes. */
  orgaosDefinidos?: string[]
  naturezasExtras?: Natureza[]
  referencia?: boolean
  ligados?: string[]
}

export function unicos<T>(lista: T[]): T[] {
  return Array.from(new Set(lista))
}

export function montarItem(r: Rascunho): ItemDoManual {
  let orgaos = r.orgaosDefinidos ?? orgaosDoTexto(...r.nomes)
  if (orgaos.length === 0 && r.contexto) orgaos = orgaosNaOrdemDoTexto(r.contexto).slice(0, 1)
  orgaos = unicos([...orgaos, ...(r.orgaosExtras ?? [])])

  const naturezas = unicos([...naturezasDoTexto(...r.nomes), ...(r.naturezasExtras ?? [])])

  const item: ItemDoManual = {
    ref: r.ref,
    modulo: r.modulo,
    tipo: r.tipo,
    titulo: r.titulo,
    href: r.href,
    etapa: r.etapa,
    orgaos,
    naturezas,
    termos: termosDoTexto(r.nomes[0]),
  }
  const extras = termosDoTexto(...r.nomes.slice(1)).filter((t) => !item.termos.includes(t))
  if (extras.length > 0) item.termosExtras = extras
  if (r.subtitulo) item.subtitulo = curto(r.subtitulo)
  if (r.referencia) item.referencia = true
  if (r.ligados && r.ligados.length > 0) item.ligados = unicos(r.ligados)
  return item
}

