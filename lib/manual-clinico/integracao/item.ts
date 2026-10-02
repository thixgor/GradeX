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


/* ─────────────────────── Forma compacta do índice gerado ─────────────────────── */

/**
 * O que é igual para todos os itens de um mesmo prefixo de ref. O índice
 * gerado não repete esses campos item a item: o arquivo entra no pacote de
 * cada função que o lê, e manual, etapa e tipo repetidos 2.200 vezes eram
 * quase um quinto dele.
 */
export const PADRAO_DO_PREFIXO: Record<string, { modulo: ModuloIntegrado; etapa: EtapaDoEstudo; tipo: string }> = {
  tc: { modulo: 'radiologia', etapa: 'imagem', tipo: 'Caso de TC' },
  rx: { modulo: 'radiologia', etapa: 'imagem', tipo: 'Caso de Raio-X' },
  rxa: { modulo: 'radiologia', etapa: 'imagem', tipo: 'Caso de Raio-X' },
  sinal: { modulo: 'semiologia', etapa: 'exame-fisico', tipo: 'Sinal do exame físico' },
  vista: { modulo: 'semiologia', etapa: 'exame-fisico', tipo: 'Exame à beira do leito' },
  cena: { modulo: 'semiologia', etapa: 'exame-fisico', tipo: 'Cena de beira-leito' },
  us: { modulo: 'semiologia', etapa: 'imagem', tipo: 'Janela de ultrassom' },
  uscena: { modulo: 'semiologia', etapa: 'imagem', tipo: 'Ultrassom' },
  orgao: { modulo: 'histologia', etapa: 'base', tipo: 'Histologia normal' },
  histopato: { modulo: 'histopatologia', etapa: 'patologia', tipo: 'Doença (Histopatologia)' },
  patozoom: { modulo: 'histopatologia', etapa: 'patologia', tipo: 'Lâmina patológica' },
  'lab-marcador': { modulo: 'exames', etapa: 'laboratorio', tipo: 'Marcador' },
  'lab-alteracao': { modulo: 'exames', etapa: 'laboratorio', tipo: 'Alteração laboratorial' },
  'lab-padrao': { modulo: 'exames', etapa: 'laboratorio', tipo: 'Padrão laboratorial' },
  'lab-doenca': { modulo: 'exames', etapa: 'laboratorio', tipo: 'Doença e padrão esperado' },
  ecg: { modulo: 'eletrocardiograma', etapa: 'clinica', tipo: 'Traçado de ECG' },
  calc: { modulo: 'ferramentas', etapa: 'conduta', tipo: 'Calculadora' },
}

/** Item como fica no JSON gerado: sem o que o prefixo já diz, sem lista vazia. */
export type ItemCompacto = Omit<ItemDoManual, 'modulo' | 'etapa' | 'tipo' | 'orgaos' | 'naturezas' | 'termos'> & {
  tipo?: string
  orgaos?: string[]
  naturezas?: Natureza[]
  termos?: string[]
}

function prefixo(ref: string): string {
  return ref.slice(0, ref.indexOf(':'))
}

export function compactar(item: ItemDoManual): ItemCompacto {
  const padrao = PADRAO_DO_PREFIXO[prefixo(item.ref)]
  if (!padrao || padrao.modulo !== item.modulo || padrao.etapa !== item.etapa) {
    throw new Error(`Prefixo sem padrão ou divergente: ${item.ref}`)
  }
  const { modulo: _m, etapa: _e, tipo, orgaos, naturezas, termos, ...resto } = item
  const c: ItemCompacto = { ...resto }
  if (tipo !== padrao.tipo) c.tipo = tipo
  if (orgaos.length > 0) c.orgaos = orgaos
  if (naturezas.length > 0) c.naturezas = naturezas
  if (termos.length > 0) c.termos = termos
  return c
}

export function expandir(c: ItemCompacto): ItemDoManual {
  const padrao = PADRAO_DO_PREFIXO[prefixo(c.ref)]
  return {
    ...c,
    modulo: padrao.modulo,
    etapa: padrao.etapa,
    tipo: c.tipo ?? padrao.tipo,
    orgaos: c.orgaos ?? [],
    naturezas: c.naturezas ?? [],
    termos: c.termos ?? [],
  }
}
