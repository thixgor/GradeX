import type { VinhetaClinica } from './casos-clinicos'
import type { CasoManifesto, CategoriaCaso, ConteudoCaso, Modalidade } from './casos-imagem-tipos'
import { GUIAS_CATEGORIAS, montarCaso, type CasoImagem, type ExplicacoesExtras, type GuiaCategoria } from './casos-imagem'

/** Uma coleção de casos de uma modalidade, já montada e ordenada. */
export interface ColecaoCasos {
  modalidade: Modalidade
  casos: CasoImagem[]
  porSlug: Map<string, CasoImagem>
  categorias: GuiaCategoria[]
  /** Temas de cada região, na ordem em que aparecem no catálogo. */
  temas: Record<string, string[]>
  vinheta: (slug: string) => VinhetaClinica | null
  conteudo: (slug: string) => ConteudoCaso | undefined
  vizinho: (slug: string, passo: 1 | -1) => CasoImagem | null
  manifesto: CasoManifesto[]
}

export function criarColecao(
  modalidade: Modalidade,
  ordem: CategoriaCaso[],
  ordemTemas: Record<string, string[]>,
  manifesto: CasoManifesto[],
  conteudos: Record<string, ConteudoCaso>,
  extras?: ExplicacoesExtras,
): ColecaoCasos {
  const doModal = manifesto.filter((m) => m.modalidade === modalidade && conteudos[m.slug])
  const montados = doModal.map((m) => montarCaso(m, conteudos[m.slug], extras))
  // Região, depois tema na ordem declarada, depois a ordem do manifesto.
  const posTema = (c: CasoImagem) => {
    const lista = ordemTemas[c.categoria] ?? []
    const i = lista.indexOf(c.tema)
    return i < 0 ? lista.length : i
  }
  const casos = ordem.flatMap((categoria) =>
    montados.filter((c) => c.categoria === categoria).sort((a, b) => posTema(a) - posTema(b)),
  )
  const porSlug = new Map(casos.map((c) => [c.slug, c]))
  const temas: Record<string, string[]> = {}
  for (const c of casos) {
    const lista = (temas[c.categoria] ??= [])
    if (!lista.includes(c.tema)) lista.push(c.tema)
  }
  return {
    modalidade,
    casos,
    porSlug,
    categorias: ordem.filter((cat) => casos.some((c) => c.categoria === cat)).map((cat) => GUIAS_CATEGORIAS[cat]),
    temas,
    vinheta: (slug) => conteudos[slug]?.vinheta ?? null,
    conteudo: (slug) => conteudos[slug],
    vizinho: (slug, passo) => {
      const i = casos.findIndex((c) => c.slug === slug)
      return i < 0 ? null : casos[i + passo] ?? null
    },
    manifesto: doModal,
  }
}
