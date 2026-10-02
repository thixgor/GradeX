import manifesto from '@/data/radiologia/casos-tc.json'
import type { VinhetaClinica } from './casos-clinicos'
import type { CategoriaCasoTC, ConteudoCasoTC } from './casos-tc-tipos'
import { CASOS_TC_NEURO } from './casos-tc-neuro'
import { CASOS_TC_CABECA_PESCOCO } from './casos-tc-cabeca-pescoco'
import { CASOS_TC_TORAX } from './casos-tc-torax'
import { CASOS_TC_ABDOME_1 } from './casos-tc-abdome-1'
import { CASOS_TC_ABDOME_2 } from './casos-tc-abdome-2'
import { CASOS_TC_TRAUMA } from './casos-tc-trauma'

export type { CategoriaCasoTC } from './casos-tc-tipos'

/**
 * Casos clínicos de tomografia.
 *
 * Cada caso é uma pilha real de cortes contíguos (Radiopaedia, termo conjunto
 * de 18/09/2026) espelhada no Blob, com as setas que o autor do caso desenhou
 * — corte, posição e rotação — redesenhadas aqui com rótulo em português e uma
 * frase sobre o que cada uma mostra. O texto clínico (leitura, armadilhas,
 * conduta e a consulta do quiz) é escrito à mão em `casos-tc-*.ts`.
 */

interface CasoManifesto {
  slug: string
  categoria: string
  urlDoCaso: string
  autoria: string
  perspectiva: string
  largura: number
  altura: number
  totalFatias: number
  anotacoes: { rotulo: string; pontos: number[][] }[]
}

export interface ApontamentoTC {
  id: string
  nome: string
  explicacao: string
  rotuloOriginal: string
  /** Pontos da seta: corte (0-based), x, y em pixels da imagem, rotação em graus. */
  pontos: { corte: number; x: number; y: number; rotacao: number }[]
}

export interface CasoTC extends Omit<ConteudoCasoTC, 'rotulos' | 'vinheta'> {
  slug: string
  categoria: CategoriaCasoTC
  categoriaTitulo: string
  urlDoCaso: string
  autoria: string
  perspectiva: string
  largura: number
  altura: number
  totalFatias: number
  apontamentos: ApontamentoTC[]
  /** Corte que abre o visualizador: o que concentra mais setas. */
  corteInicial: number
}

export interface GuiaCategoriaTC {
  id: CategoriaCasoTC
  titulo: string
  descricao: string
}

export const GUIAS_CASOS_TC: Record<CategoriaCasoTC, GuiaCategoriaTC> = {
  neuro: { id: 'neuro', titulo: 'Crânio', descricao: 'AVC, hemorragias, coleções extra-axiais, hidrocefalia, infecção e tumores.' },
  'cabeca-pescoco': { id: 'cabeca-pescoco', titulo: 'Face e pescoço', descricao: 'Órbita, seios da face e espaços profundos do pescoço.' },
  torax: { id: 'torax', titulo: 'Tórax', descricao: 'Vasos, parênquima, pleura e pericárdio.' },
  abdome: { id: 'abdome', titulo: 'Abdome', descricao: 'Abdome agudo, vias biliares, fígado, rim, vasos e cólon.' },
  trauma: { id: 'trauma', titulo: 'Trauma', descricao: 'Órgãos sólidos, hemoperitônio, lesão vascular e coluna.' },
}

export const ORDEM_CATEGORIAS_TC: CategoriaCasoTC[] = ['neuro', 'cabeca-pescoco', 'torax', 'abdome', 'trauma']

const CONTEUDO: Record<string, ConteudoCasoTC> = {
  ...CASOS_TC_NEURO,
  ...CASOS_TC_CABECA_PESCOCO,
  ...CASOS_TC_TORAX,
  ...CASOS_TC_ABDOME_1,
  ...CASOS_TC_ABDOME_2,
  ...CASOS_TC_TRAUMA,
}

export const LICENCA_CASOS_TC: string = manifesto.licenca

function montar(bruto: CasoManifesto): CasoTC | null {
  const conteudo = CONTEUDO[bruto.slug]
  if (!conteudo) return null
  const { rotulos, vinheta: _vinheta, ...texto } = conteudo
  const apontamentos: ApontamentoTC[] = []
  bruto.anotacoes.forEach((anotacao, i) => {
    const traducao = rotulos[anotacao.rotulo.trim()]
    if (!traducao) return
    apontamentos.push({
      id: `a${i}`,
      nome: traducao[0],
      explicacao: traducao[1],
      rotuloOriginal: anotacao.rotulo,
      pontos: anotacao.pontos.map(([corte, x, y, rotacao]) => ({ corte, x, y, rotacao })),
    })
  })
  const contagem = new Map<number, number>()
  for (const a of apontamentos) for (const p of a.pontos) contagem.set(p.corte, (contagem.get(p.corte) ?? 0) + 1)
  const corteInicial = [...contagem.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] ?? Math.floor(bruto.totalFatias / 2)
  const categoria = bruto.categoria as CategoriaCasoTC
  return {
    ...texto,
    slug: bruto.slug,
    categoria,
    categoriaTitulo: GUIAS_CASOS_TC[categoria].titulo,
    urlDoCaso: bruto.urlDoCaso,
    autoria: bruto.autoria,
    perspectiva: bruto.perspectiva,
    largura: bruto.largura,
    altura: bruto.altura,
    totalFatias: bruto.totalFatias,
    apontamentos,
    corteInicial,
  }
}

const MANIFESTO_CASOS = manifesto.casos as CasoManifesto[]

export const CASOS_TC: CasoTC[] = ORDEM_CATEGORIAS_TC.flatMap((categoria) =>
  MANIFESTO_CASOS.filter((caso) => caso.categoria === categoria)
    .map(montar)
    .filter((caso): caso is CasoTC => caso !== null),
)

export const CASOS_TC_POR_SLUG = new Map(CASOS_TC.map((caso) => [caso.slug, caso]))

export function vinhetaDoCasoTC(slug: string): VinhetaClinica | null {
  return CONTEUDO[slug]?.vinheta ?? null
}

/** Conteúdo bruto, para testes: inclui rótulos descartados (`null`). */
export function conteudoDoCasoTC(slug: string): ConteudoCasoTC | undefined {
  return CONTEUDO[slug]
}

export function slugsDoManifestoTC(): { slug: string; rotulos: string[] }[] {
  return MANIFESTO_CASOS.map((caso) => ({ slug: caso.slug, rotulos: caso.anotacoes.map((a) => a.rotulo.trim()) }))
}

export function casoTCVizinho(slug: string, passo: 1 | -1): CasoTC | null {
  const i = CASOS_TC.findIndex((caso) => caso.slug === slug)
  if (i < 0) return null
  return CASOS_TC[i + passo] ?? null
}

/** URL de um corte (1-based) no espelho do Blob. */
export function urlDoCorteTC(slug: string, corte: number): string {
  const base = (process.env.NEXT_PUBLIC_SEMIOLOGIA_MIDIA_BASE ?? 'https://fsyr6dn1vkygglkd.public.blob.vercel-storage.com').replace(/\/$/, '')
  return `${base}/radiologia/tc/${slug}/${corte}.jpg`
}
