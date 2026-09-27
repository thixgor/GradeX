import 'server-only'

import acervo from '@/data/histologia-zoom/acervo-histoviewer.json'
import acervoDzi from '@/data/histologia-zoom/acervo-dzi.json'
import acervoImagens from '@/data/histologia-zoom/acervo-imagens.json'

import { coloracaoDe } from './coloracoes'
import { CURADORIA } from './curadoria'
import { ORIGEM_POR_PECA, ROTULO_DA_CATEGORIA, origemDaPeca, type OrigemDaPeca } from './especies'

const temOrigemMapeada = (root: string) => root in ORIGEM_POR_PECA
import { urlDoEspecime } from './fonte'
import { ORGAOS_BASE } from './orgaos/base'
import { ORGAOS_COMPLEMENTARES } from './orgaos/complementares'
import { ORGAOS_DIGESTORIO } from './orgaos/digestorio'
import { ORGAOS_NEURO_CARDIO_LINFOIDE } from './orgaos/neuro-cardio-linfoide'
import { ORGAOS_TEGUMENTO_RESPIRATORIO_ORAL } from './orgaos/tegumento-respiratorio-oral'
import { ORGAOS_URO_ENDO_REPRO } from './orgaos/uro-endo-repro'
import { estruturasDaLamina } from './estruturas'
import { SISTEMAS } from './sistemas'
import type {
  EspecimeColetado,
  LaminaResumida,
  LaminaZoom,
  Orgao,
  SistemaId,
} from './tipos'

/**
 * Repositório da Histologia com Zoom — só servidor.
 *
 * Importa o JSON inteiro do acervo (~240 KB), por isso o `server-only`: o
 * cliente recebe apenas a lâmina aberta (via prop) e o índice leve de
 * `resumosParaBusca()`.
 */

export const ORGAOS: Orgao[] = [
  ...ORGAOS_BASE,
  ...ORGAOS_NEURO_CARDIO_LINFOIDE,
  ...ORGAOS_TEGUMENTO_RESPIRATORIO_ORAL,
  ...ORGAOS_DIGESTORIO,
  ...ORGAOS_URO_ENDO_REPRO,
  ...ORGAOS_COMPLEMENTARES,
]

const ORIGEM_GTEX: OrigemDaPeca = { categoria: 'humana', especie: 'Humana', cientifico: 'Homo sapiens' }

const ORGAO_POR_ID = new Map(ORGAOS.map((o) => [o.id, o]))
const ORDEM_DO_SISTEMA = new Map(SISTEMAS.map((s, i) => [s.id, i]))
const ORDEM_DO_ORGAO = new Map(ORGAOS.map((o, i) => [o.id, i]))
const ORDEM_DA_CURADORIA = new Map(Object.keys(CURADORIA).map((root, i) => [root, i]))

function montarLaminas(): LaminaZoom[] {
  const especimes = [
    ...(acervo as { especimes: EspecimeColetado[] }).especimes,
    ...(acervoDzi as { especimes: EspecimeColetado[] }).especimes,
    ...(acervoImagens as { especimes: EspecimeColetado[] }).especimes,
  ]
  const brutas: Array<{ root: string; lamina: Omit<LaminaZoom, 'slug'> }> = []

  for (const e of especimes) {
    const cur = CURADORIA[e.root]
    if (!cur) continue
    const orgao = ORGAO_POR_ID.get(cur.orgao)
    if (!orgao) continue
    const topo = e.niveis[e.niveis.length - 1]
    const dzi = e.formato === 'dzi'
    const imagem = e.formato === 'imagem'
    const base = imagem ? '' : (e.base ?? urlDoEspecime(e.root))
    // GTEx: doadores humanos, declarado pela própria fonte para todo o acervo.
    // Imagens avulsas: vale o que o autor declarou; o mapa de origem tem
    // precedência (é onde mora a comparação com o humano das peças animais).
    const origem =
      e.fonte === 'gtex'
        ? ORIGEM_GTEX
        : imagem && e.especieDeclarada === 'humana' && !temOrigemMapeada(e.root)
          ? ORIGEM_GTEX
          : origemDaPeca(e.root)
    brutas.push({
      root: e.root,
      lamina: {
        orgao: orgao.id,
        sistema: orgao.sistema,
        fonte: e.fonte ?? 'histoviewer',
        credito: e.credito ?? null,
        titulo: orgao.nome,
        subtitulo: cur.subtitulo,
        coloracao: coloracaoDe(e.coloracao).nome,
        coloracaoId: coloracaoDe(e.coloracao).id,
        especie: origem.especie,
        origem,
        objetiva: e.objetiva,
        ampliacaoMaxima: topo.magn,
        nota: cur.nota ?? null,
        rotuloOriginal: e.texto && e.texto !== e.nome ? `${e.nome} — ${e.texto}` : e.nome,
        hv: { caixa: e.caixa, id: e.hvId, nr: e.nr },
        piramide: {
          base,
          ...(dzi ? { formato: 'dzi' as const, extensao: e.extensao, sobreposicao: e.sobreposicao } : {}),
          ...(imagem ? { formato: 'imagem' as const } : {}),
          miniatura: {
            url: dzi || imagem ? e.miniatura : `${base}${e.miniatura}`,
            largura: e.miniaturaL,
            altura: e.miniaturaA,
          },
          niveis: e.niveis,
        },
        largura: topo.largura,
        altura: topo.altura,
      },
    })
  }

  brutas.sort((a, b) => {
    const s =
      (ORDEM_DO_SISTEMA.get(a.lamina.sistema) ?? 99) - (ORDEM_DO_SISTEMA.get(b.lamina.sistema) ?? 99)
    if (s) return s
    const o =
      (ORDEM_DO_ORGAO.get(a.lamina.orgao) ?? 999) - (ORDEM_DO_ORGAO.get(b.lamina.orgao) ?? 999)
    if (o) return o
    return (ORDEM_DA_CURADORIA.get(a.root) ?? 9999) - (ORDEM_DA_CURADORIA.get(b.root) ?? 9999)
  })

  // Slug: órgão + coloração, com sufixo numérico para as repetições. Estável
  // enquanto a ordem da curadoria for respeitada (ver `curadoria.ts`).
  const contagem = new Map<string, number>()
  return brutas.map(({ lamina }) => {
    const raiz = `${lamina.orgao}-${lamina.coloracaoId}`
    const n = (contagem.get(raiz) ?? 0) + 1
    contagem.set(raiz, n)
    return { ...lamina, slug: n === 1 ? raiz : `${raiz}-${n}` }
  })
}

export const LAMINAS: LaminaZoom[] = montarLaminas()

const LAMINA_POR_SLUG = new Map(LAMINAS.map((l) => [l.slug, l]))

export function orgaoPorId(id: string): Orgao | undefined {
  return ORGAO_POR_ID.get(id)
}

export function laminaPorSlug(slug: string): LaminaZoom | undefined {
  return LAMINA_POR_SLUG.get(slug)
}

export function laminasDoOrgao(orgao: string): LaminaZoom[] {
  return LAMINAS.filter((l) => l.orgao === orgao)
}

export function orgaosDoSistema(sistema: SistemaId): Orgao[] {
  const comLamina = new Set(LAMINAS.map((l) => l.orgao))
  return ORGAOS.filter((o) => o.sistema === sistema && comLamina.has(o.id))
}

export function laminasDoSistema(sistema: SistemaId): LaminaZoom[] {
  return LAMINAS.filter((l) => l.sistema === sistema)
}

function mosaicoDzi(l: LaminaZoom): LaminaResumida['mosaico'] {
  const p = l.piramide
  if (p.formato !== 'dzi') return undefined
  const nivel = [...p.niveis].reverse().find((n) => n.nx <= 2 && n.ny <= 2)
  if (!nivel || (nivel.nx === 1 && nivel.ny === 1)) return undefined
  const ov = p.sobreposicao ?? 0
  const t = nivel.tileL
  const tiles = []
  for (let y = 0; y < nivel.ny; y++) {
    for (let x = 0; x < nivel.nx; x++) {
      const x0 = x * t - (x ? ov : 0)
      const y0 = y * t - (y ? ov : 0)
      const x1 = Math.min(nivel.largura, (x + 1) * t + ov)
      const y1 = Math.min(nivel.altura, (y + 1) * t + ov)
      tiles.push({ url: `${p.base}${nivel.pasta}${x}_${y}.${p.extensao ?? 'jpeg'}`, x: x0, y: y0, l: x1 - x0, a: y1 - y0 })
    }
  }
  return { largura: nivel.largura, altura: nivel.altura, tiles }
}

export function resumir(l: LaminaZoom): LaminaResumida {
  return {
    slug: l.slug,
    orgao: l.orgao,
    orgaoNome: ORGAO_POR_ID.get(l.orgao)?.nome ?? l.titulo,
    sistema: l.sistema,
    titulo: l.titulo,
    subtitulo: l.subtitulo,
    coloracao: l.coloracao,
    especie: l.especie,
    categoriaDeOrigem: l.origem.categoria,
    ampliacaoMaxima: l.ampliacaoMaxima,
    miniatura: l.piramide.miniatura.url,
    miniaturaL: l.piramide.miniatura.largura,
    miniaturaA: l.piramide.miniatura.altura,
    mosaico: mosaicoDzi(l),
  }
}

/** Índice leve para a busca no cliente. */
export function resumosParaBusca(): Array<LaminaResumida & { termos: string }> {
  return LAMINAS.map((l) => {
    const orgao = ORGAO_POR_ID.get(l.orgao)
    const termos = [
      l.titulo,
      l.subtitulo ?? '',
      l.coloracao,
      l.especie,
      l.origem.cientifico ?? '',
      ROTULO_DA_CATEGORIA[l.origem.categoria],
      l.origem.categoria === 'nao-humana' ? 'animal nao humana' : '',
      l.fonte === 'gtex' ? 'humano gtex' : '',
      // Estruturas marcadas nesta lâmina: "purkinje" encontra o cerebelo.
      ...estruturasDaLamina(l.slug).flatMap((e) => [e.verbete.nome, ...(e.verbete.sinonimos ?? [])]),
      l.rotuloOriginal,
      SISTEMAS.find((s) => s.id === l.sistema)?.nome ?? '',
      ...(orgao?.sinonimos ?? []),
    ].join(' ')
    return { ...resumir(l), termos }
  })
}

export const TOTAIS = {
  laminas: LAMINAS.length,
  orgaos: new Set(LAMINAS.map((l) => l.orgao)).size,
  sistemas: new Set(LAMINAS.map((l) => l.sistema)).size,
  humanas: LAMINAS.filter((l) => l.origem.categoria === 'humana').length,
  naoHumanas: LAMINAS.filter((l) => l.origem.categoria === 'nao-humana' || l.origem.categoria === 'vegetal').length,
  naoInformadas: LAMINAS.filter((l) => l.origem.categoria === 'nao-informada').length,
}
