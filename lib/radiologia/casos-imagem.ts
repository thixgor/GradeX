import type {
  CasoManifesto,
  CategoriaCaso,
  ConteudoCaso,
  Modalidade,
  RotuloDetalhado,
} from './casos-imagem-tipos'

/**
 * Montagem dos casos de imagem com apontamentos — TC e Raio-X.
 *
 * Um caso junta duas fontes: o manifesto gerado pelo script de sincronização
 * (séries, cortes, setas do autor com corte, posição e rotação) e o texto
 * escrito à mão (título, leitura, armadilhas, conduta, consulta do quiz e a
 * tradução comentada de cada seta). Este módulo faz a junção e não sabe de
 * onde cada lado veio.
 */

export interface ApontamentoCaso {
  id: string
  /** Série onde a seta está (0-based). */
  serie: number
  nome: string
  resumo: string
  explicacao: string
  dica?: string
  rotuloOriginal: string
  pontos: { corte: number; x: number; y: number; rotacao: number }[]
}

export interface SerieCaso {
  indice: number
  rotulo: string
  perspectiva: string
  largura: number
  altura: number
  totalFatias: number
  prefixo: string
  /** Corte que abre a série: o que concentra mais setas. */
  corteInicial: number
}

export interface CasoImagem {
  slug: string
  modalidade: Modalidade
  categoria: CategoriaCaso
  categoriaTitulo: string
  tema: string
  titulo: string
  resumo: string
  protocolo: string
  achados: string[]
  armadilhas: string[]
  conduta: string
  urlDoCaso: string
  autoria: string
  series: SerieCaso[]
  /** Em ordem de leitura: série, depois corte. */
  apontamentos: ApontamentoCaso[]
  totalFatias: number
}

export interface GuiaCategoria {
  id: CategoriaCaso
  titulo: string
  descricao: string
}

export const GUIAS_CATEGORIAS: Record<CategoriaCaso, GuiaCategoria> = {
  neuro: { id: 'neuro', titulo: 'Crânio', descricao: 'AVC, hemorragias, coleções extra-axiais, hidrocefalia, infecção e tumores.' },
  'cabeca-pescoco': { id: 'cabeca-pescoco', titulo: 'Face e pescoço', descricao: 'Órbita, seios da face, ossos da face e espaços profundos do pescoço.' },
  torax: { id: 'torax', titulo: 'Tórax', descricao: 'Parênquima, vias aéreas, pleura, mediastino e vasos.' },
  cardio: { id: 'cardio', titulo: 'Coração e grandes vasos', descricao: 'Silhueta cardíaca, cardiopatias congênitas e aorta.' },
  abdome: { id: 'abdome', titulo: 'Abdome e pelve', descricao: 'Abdome agudo, fígado, vias biliares, pâncreas, rim e pelve.' },
  trauma: { id: 'trauma', titulo: 'Trauma', descricao: 'Órgãos sólidos, hemoperitônio, lesão vascular, bacia e coluna.' },
  pediatrico: { id: 'pediatrico', titulo: 'Pediatria', descricao: 'O que só acontece na criança: malformações, doenças do osso em crescimento e abdome do lactente.' },
  osteoarticular: { id: 'osteoarticular', titulo: 'Osso e articulação', descricao: 'Fraturas, luxações, artropatias, doenças metabólicas e tumores ósseos.' },
}

const PERSPECTIVA: Record<string, string> = {
  axial: 'Axial',
  coronal: 'Coronal',
  sagittal: 'Sagital',
  frontal: 'Frontal',
  pa: 'PA',
  ap: 'AP',
  lateral: 'Perfil',
  oblique: 'Oblíqua',
}

export function traduzirPerspectiva(p: string): string {
  return PERSPECTIVA[p.trim().toLowerCase()] ?? p
}

/** Explicação aprofundada de setas descritas na forma curta (primeira leva). */
export type ExplicacoesExtras = Record<string, Record<string, { explicacao: string; dica?: string }>>

export function montarCaso(m: CasoManifesto, c: ConteudoCaso, extras?: ExplicacoesExtras): CasoImagem {
  const apontamentos: ApontamentoCaso[] = []
  const series: SerieCaso[] = m.series.map((s, k) => {
    const contagem = new Map<number, number>()
    s.anotacoes.forEach((anotacao, i) => {
      const traducao = c.rotulos[anotacao.rotulo.trim()]
      if (!traducao) return
      const extra = extras?.[m.slug]?.[anotacao.rotulo.trim()]
      const detalhe: RotuloDetalhado = Array.isArray(traducao)
        ? { nome: traducao[0], resumo: traducao[1], explicacao: extra?.explicacao ?? traducao[1], dica: extra?.dica }
        : traducao
      const pontos = anotacao.pontos.map(([corte, x, y, rotacao]) => ({ corte, x, y, rotacao }))
      for (const p of pontos) contagem.set(p.corte, (contagem.get(p.corte) ?? 0) + 1)
      apontamentos.push({ id: `s${k}a${i}`, serie: k, ...detalhe, rotuloOriginal: anotacao.rotulo, pontos })
    })
    const corteInicial =
      [...contagem.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] ?? Math.floor(s.totalFatias / 2)
    return {
      indice: k,
      rotulo: c.series?.[k] ?? traduzirPerspectiva(s.perspectiva),
      perspectiva: traduzirPerspectiva(s.perspectiva),
      largura: s.largura,
      altura: s.altura,
      totalFatias: s.totalFatias,
      prefixo: s.prefixo,
      corteInicial,
    }
  })
  apontamentos.sort((a, b) => a.serie - b.serie || a.pontos[0].corte - b.pontos[0].corte)
  return {
    slug: m.slug,
    modalidade: m.modalidade,
    categoria: m.categoria,
    categoriaTitulo: GUIAS_CATEGORIAS[m.categoria].titulo,
    tema: c.tema ?? 'Outros',
    titulo: c.titulo,
    resumo: c.resumo,
    protocolo: c.protocolo,
    achados: c.achados,
    armadilhas: c.armadilhas,
    conduta: c.conduta,
    urlDoCaso: m.urlDoCaso,
    autoria: m.autoria,
    series,
    apontamentos,
    totalFatias: series.reduce((t, s) => t + s.totalFatias, 0),
  }
}

/** URL de um corte (1-based) no espelho do Blob. */
export function urlDoCorte(serie: Pick<SerieCaso, 'prefixo'>, corte: number): string {
  const base = (process.env.NEXT_PUBLIC_SEMIOLOGIA_MIDIA_BASE ?? 'https://fsyr6dn1vkygglkd.public.blob.vercel-storage.com').replace(/\/$/, '')
  return `${base}/${serie.prefixo}${corte}.jpg`
}
