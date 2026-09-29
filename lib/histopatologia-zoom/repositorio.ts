import 'server-only'

import anotacoes from '@/data/histopatologia-zoom/anotacoes.gerado.json'
import { estruturaPorId } from '@/lib/histologia-zoom/estruturas'
import { LAMINAS as LAMINAS_NORMAIS, laminaPorSlug as laminaNormalPorSlug, laminasDoOrgao } from '@/lib/histologia-zoom/repositorio'
import type { LaminaZoom, NivelDaPiramide, PiramideDaLamina } from '@/lib/histologia-zoom/tipos'

import { achadoPorId } from './achados'
import { CURADORIA } from './curadoria'
import { doencaPorId, DOENCAS } from './doencas'
import { urlDoSvs } from './fonte'
import type {
  AchadoNaLamina,
  AnotacaoPatologica,
  CuradoriaDaLamina,
  DoencaZoom,
  LaminaPatologica,
  LaminaPatologicaResumida,
  MarcacaoExibida,
} from './tipos'

/**
 * Repositório da Histopatologia com Zoom — só servidor.
 *
 * Junta a curadoria (qual caso, qual lâmina), as anotações (marcações e
 * veredito de cada achado) e os glossários, e escolhe a lâmina normal para a
 * comparação.
 */

const TILE = 512
/** Largura-alvo da miniatura: uma única região pedida ao servidor. */
const MINIATURA = 640

export function piramideAperio(caminho: string, largura: number, altura: number, objetiva: number): PiramideDaLamina {
  const base = urlDoSvs(caminho)
  const niveis: NivelDaPiramide[] = []
  for (let r = 1; ; r *= 2) {
    const l = Math.ceil(largura / r)
    const a = Math.ceil(altura / r)
    niveis.unshift({
      magn: objetiva / r,
      pasta: '',
      largura: l,
      altura: a,
      tileL: TILE,
      tileA: TILE,
      nx: Math.ceil(l / TILE),
      ny: Math.ceil(a / TILE),
      reducao: r,
    })
    if (l <= TILE && a <= TILE) break
  }
  const rm = 2 ** Math.max(0, Math.ceil(Math.log2(largura / MINIATURA)))
  const ml = Math.ceil(largura / rm)
  const ma = Math.ceil(altura / rm)
  return {
    base,
    formato: 'aperio',
    miniatura: { url: `${base}?0+0+${ml}+${ma}+${rm}+85`, largura: ml, altura: ma },
    niveis,
  }
}

function montar(): LaminaPatologica[] {
  const contagem = new Map<string, number>()
  const saida: LaminaPatologica[] = []
  for (const c of CURADORIA as CuradoriaDaLamina[]) {
    const doenca = doencaPorId(c.doenca)
    if (!doenca) continue
    const n = (contagem.get(c.doenca) ?? 0) + 1
    contagem.set(c.doenca, n)
    saida.push({
      slug: `${c.doenca}-${n}`,
      doenca: c.doenca,
      titulo: doenca.nome,
      subtitulo: c.subtitulo,
      coloracao: 'Hematoxilina-eosina (H&E)',
      objetiva: c.objetiva,
      mpp: c.mpp,
      caso: c.caso,
      piramide: piramideAperio(c.caminho, c.largura, c.altura, c.objetiva),
      largura: c.largura,
      altura: c.altura,
      laminaNormal: c.laminaNormal,
    })
  }
  return saida
}

export const LAMINAS_PATOLOGICAS: LaminaPatologica[] = montar()

const POR_SLUG = new Map(LAMINAS_PATOLOGICAS.map((l) => [l.slug, l]))
const ANOTACOES = anotacoes as unknown as Record<string, AnotacaoPatologica>

export function laminaPatologicaPorSlug(slug: string): LaminaPatologica | undefined {
  return POR_SLUG.get(slug)
}

export function laminasDaDoenca(doenca: string): LaminaPatologica[] {
  return LAMINAS_PATOLOGICAS.filter((l) => l.doenca === doenca)
}

/** Doenças com pelo menos uma lâmina publicada, na ordem de prioridade. */
export function doencasPublicadas(): DoencaZoom[] {
  const com = new Set(LAMINAS_PATOLOGICAS.map((l) => l.doenca))
  return DOENCAS.filter((d) => com.has(d.id))
}

export function anotacaoPatologica(slug: string): AnotacaoPatologica | null {
  return ANOTACOES[slug] ?? null
}

/** Marcações da lâmina com o verbete resolvido (achado ou estrutura normal); achados primeiro. */
export function marcacoesDaLamina(slug: string): MarcacaoExibida[] {
  const a = ANOTACOES[slug]
  if (!a) return []
  const saida: MarcacaoExibida[] = []
  for (const m of a.marcacoes) {
    if (m.categoria === 'patologica') {
      const verbete = achadoPorId(m.estrutura)
      if (verbete) saida.push({ ...m, categoria: 'patologica', verbete })
    } else {
      const verbete = estruturaPorId(m.estrutura)
      if (verbete) saida.push({ ...m, categoria: undefined, verbete })
    }
  }
  return [...saida.filter((m) => m.categoria === 'patologica'), ...saida.filter((m) => m.categoria !== 'patologica')]
}

/** Veredito de cada achado da doença nesta lâmina, na ordem da ficha, mais os achados extras. */
export function achadosDaLamina(slug: string, doenca: DoencaZoom): AchadoNaLamina[] {
  const a = ANOTACOES[slug]
  const porId = new Map((a?.achados ?? []).map((x) => [x.achado, x]))
  const daDoenca = doenca.achados.map(
    (d) => porId.get(d.achado) ?? { achado: d.achado, status: 'nao-avaliavel' as const, nota: 'Ainda não avaliado nesta lâmina.' },
  )
  const ids = new Set(doenca.achados.map((d) => d.achado))
  return [...daDoenca, ...(a?.achados ?? []).filter((x) => !ids.has(x.achado))]
}

/**
 * Lâmina normal para comparar: a indicada na curadoria ou, no órgão da
 * doença, a primeira humana (a comparação mais honesta); na falta, a primeira.
 */
export function laminaNormalPara(l: LaminaPatologica, doenca: DoencaZoom): LaminaZoom | null {
  if (l.laminaNormal) return laminaNormalPorSlug(l.laminaNormal) ?? null
  const doOrgao = laminasDoOrgao(doenca.orgao)
  return doOrgao.find((x) => x.origem.categoria === 'humana') ?? doOrgao[0] ?? null
}

/** Opções de lâmina normal (mesmo órgão), para trocar na comparação. */
export function laminasNormaisDoOrgao(orgao: string): LaminaZoom[] {
  return laminasDoOrgao(orgao)
}

export function laminaNormalExiste(slug: string): boolean {
  return LAMINAS_NORMAIS.some((l) => l.slug === slug)
}

export function resumirPatologica(l: LaminaPatologica): LaminaPatologicaResumida {
  const a = ANOTACOES[l.slug]
  return {
    slug: l.slug,
    doenca: l.doenca,
    titulo: l.titulo,
    subtitulo: l.subtitulo,
    miniatura: l.piramide.miniatura.url,
    miniaturaL: l.piramide.miniatura.largura,
    miniaturaA: l.piramide.miniatura.altura,
    achadosPresentes: (a?.achados ?? []).filter((x) => x.status === 'presente').length,
  }
}

export const TOTAIS_PATOZOOM = {
  get laminas() {
    return LAMINAS_PATOLOGICAS.length
  },
  get doencas() {
    return new Set(LAMINAS_PATOLOGICAS.map((l) => l.doenca)).size
  },
  get marcacoes() {
    return LAMINAS_PATOLOGICAS.reduce((s, l) => s + (ANOTACOES[l.slug]?.marcacoes.length ?? 0), 0)
  },
}
