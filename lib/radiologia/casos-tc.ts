import manifestoLeva1 from '@/data/radiologia/casos-tc.json'
import manifestoImagem from '@/data/radiologia/casos-imagem.json'
import type { VinhetaClinica } from './casos-clinicos'
import type { CasoManifesto, CategoriaCaso, ConteudoCaso } from './casos-imagem-tipos'
import { urlDoCorte, type CasoImagem } from './casos-imagem'
import { criarColecao } from './casos-imagem-colecao'
import { EXPLICACOES_TC } from './casos-tc-explicacoes'
import { CASOS_TC_NEURO } from './casos-tc-neuro'
import { CASOS_TC_CABECA_PESCOCO } from './casos-tc-cabeca-pescoco'
import { CASOS_TC_TORAX } from './casos-tc-torax'
import { CASOS_TC_ABDOME_1 } from './casos-tc-abdome-1'
import { CASOS_TC_ABDOME_2 } from './casos-tc-abdome-2'
import { CASOS_TC_TRAUMA } from './casos-tc-trauma'
import { CASOS_TC_LEVA_2 } from './casos-tc-leva-2'

export type { CategoriaCasoTC } from './casos-tc-tipos'
export type { ApontamentoCaso as ApontamentoTC, CasoImagem as CasoTC, GuiaCategoria as GuiaCategoriaTC } from './casos-imagem'

/**
 * Casos clínicos de tomografia.
 *
 * Cada caso é uma pilha real de cortes contíguos (Radiopaedia, termo conjunto
 * de 18/09/2026) espelhada no Blob, com as setas que o autor do caso desenhou
 * — corte, posição e rotação — redesenhadas com rótulo em português e um
 * comentário didático por seta. A primeira leva vem do manifesto v1 (uma série
 * por caso); as seguintes, do manifesto v2 compartilhado com o Raio-X, que
 * admite várias séries por caso.
 */

/** Temas de cada região, na ordem do catálogo. */
export const TEMAS_TC: Record<string, string[]> = {
  neuro: ['Vascular', 'Trauma', 'Infecção', 'Tumores', 'Líquor e hidrocefalia'],
  'cabeca-pescoco': ['Órbita e seios', 'Fraturas da face', 'Espaços profundos do pescoço', 'Tireoide'],
  torax: ['Vascular', 'Parênquima e vias aéreas', 'Infecção', 'Pleura e mediastino', 'Tumores', 'Trauma'],
  abdome: ['Abdome agudo inflamatório', 'Obstrução e perfuração', 'Vascular', 'Fígado e vias biliares', 'Pâncreas', 'Rim e adrenal', 'Pelve', 'Tumores'],
  trauma: ['Órgãos sólidos', 'Bacia e membros', 'Coluna'],
}

export const ORDEM_CATEGORIAS_TC: CategoriaCaso[] = ['neuro', 'cabeca-pescoco', 'torax', 'abdome', 'trauma']

/** Tema de cada caso da primeira leva, escrita antes de os temas existirem. */
const TEMAS_LEVA_1: Record<string, string> = {
  'avc-isquemico-acm': 'Vascular', 'hemorragia-intraparenquimatosa': 'Vascular', 'hemorragia-pontina': 'Vascular',
  'hematoma-extradural': 'Trauma', 'hematoma-subdural-agudo-sobre-cronico': 'Trauma', 'hemorragia-subaracnoidea': 'Trauma',
  'contusoes-cerebrais': 'Trauma', pneumoencefalo: 'Trauma', 'abscesso-cerebral': 'Infecção', glioblastoma: 'Tumores',
  'metastases-cerebrais': 'Tumores', 'hidrocefalia-cisto-coloide': 'Líquor e hidrocefalia',
  'fratura-blowout-da-orbita': 'Fraturas da face', 'abscesso-subperiosteal-da-orbita': 'Órbita e seios', 'tumor-de-pott': 'Órbita e seios',
  'abscesso-peritonsilar': 'Espaços profundos do pescoço', 'abscesso-retrofaringeo': 'Espaços profundos do pescoço',
  'sindrome-de-lemierre': 'Espaços profundos do pescoço',
  'tep-a-cavaleiro': 'Vascular', 'disseccao-de-aorta-tipo-a': 'Vascular', 'aneurisma-de-aorta-toracica': 'Vascular',
  'enfisema-centrolobular': 'Parênquima e vias aéreas', 'bronquiectasias-cisticas': 'Parênquima e vias aéreas',
  'fibrose-pulmonar-uip': 'Parênquima e vias aéreas', 'fibrose-cistica': 'Parênquima e vias aéreas',
  'tuberculose-cavitaria': 'Infecção', 'empiema-pleura-dividida': 'Pleura e mediastino', piopneumotorax: 'Pleura e mediastino',
  'pericardite-purulenta': 'Pleura e mediastino', 'cancer-de-pulmao-espiculado': 'Tumores', 'trauma-toracico-contuso': 'Trauma',
  'apendicite-complicada': 'Abdome agudo inflamatório', 'diverticulite-de-sigmoide': 'Abdome agudo inflamatório',
  'colecistite-gangrenosa': 'Abdome agudo inflamatório', 'apendagite-epiploica': 'Abdome agudo inflamatório',
  'pancreatite-aguda-edematosa': 'Pâncreas', 'ileo-biliar': 'Obstrução e perfuração', 'perfuracao-intestinal': 'Obstrução e perfuração',
  'volvo-de-sigmoide': 'Obstrução e perfuração', 'isquemia-mesenterica-gas-portal': 'Vascular',
  'aneurisma-de-aorta-abdominal-roto': 'Vascular', 'calculo-ureteral-distal': 'Rim e adrenal',
  'pielonefrite-enfisematosa': 'Rim e adrenal', 'pielonefrite-aguda': 'Rim e adrenal', 'carcinoma-de-celulas-renais': 'Rim e adrenal',
  'carcinoma-hepatocelular': 'Fígado e vias biliares', 'hemangioma-hepatico': 'Fígado e vias biliares',
  'cirrose-hipertensao-portal': 'Fígado e vias biliares', 'abscessos-hepaticos': 'Fígado e vias biliares',
  'cancer-colorretal-invasivo': 'Tumores', 'intussuscepcao-colocolica': 'Tumores',
  'trauma-hepatico-grau-v': 'Órgãos sólidos', 'ruptura-esplenica-hemoperitonio': 'Órgãos sólidos', 'politrauma-abdominal': 'Órgãos sólidos',
  'fratura-de-plato-tibial-com-lesao-arterial': 'Bacia e membros', 'fratura-vertebral-em-explosao': 'Coluna',
}

const LEVA_1: Record<string, ConteudoCaso> = {
  ...CASOS_TC_NEURO,
  ...CASOS_TC_CABECA_PESCOCO,
  ...CASOS_TC_TORAX,
  ...CASOS_TC_ABDOME_1,
  ...CASOS_TC_ABDOME_2,
  ...CASOS_TC_TRAUMA,
}

const CONTEUDO: Record<string, ConteudoCaso> = {
  ...Object.fromEntries(Object.entries(LEVA_1).map(([slug, c]) => [slug, { ...c, tema: c.tema ?? TEMAS_LEVA_1[slug] }])),
  ...CASOS_TC_LEVA_2,
}

interface CasoV1 {
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

/** O manifesto v1 visto como v2: uma série, com o prefixo antigo do espelho. */
const MANIFESTO_V1: CasoManifesto[] = (manifestoLeva1.casos as CasoV1[]).map((c) => ({
  slug: c.slug,
  modalidade: 'tc',
  categoria: c.categoria as CategoriaCaso,
  urlDoCaso: c.urlDoCaso,
  autoria: c.autoria,
  series: [
    {
      perspectiva: c.perspectiva,
      largura: c.largura,
      altura: c.altura,
      totalFatias: c.totalFatias,
      prefixo: `radiologia/tc/${c.slug}/`,
      anotacoes: c.anotacoes,
    },
  ],
}))

export const LICENCA_CASOS_TC: string = manifestoLeva1.licenca

export const COLECAO_TC = criarColecao(
  'tc',
  ORDEM_CATEGORIAS_TC,
  TEMAS_TC,
  [...MANIFESTO_V1, ...(manifestoImagem.casos as CasoManifesto[])],
  CONTEUDO,
  EXPLICACOES_TC,
)

export const CASOS_TC: CasoImagem[] = COLECAO_TC.casos
export const CASOS_TC_POR_SLUG = COLECAO_TC.porSlug
export const GUIAS_CASOS_TC = Object.fromEntries(COLECAO_TC.categorias.map((g) => [g.id, g]))

export function vinhetaDoCasoTC(slug: string): VinhetaClinica | null {
  return COLECAO_TC.vinheta(slug)
}

/** Conteúdo bruto, para testes: inclui rótulos descartados (`null`). */
export function conteudoDoCasoTC(slug: string): ConteudoCaso | undefined {
  return COLECAO_TC.conteudo(slug)
}

export function casoTCVizinho(slug: string, passo: 1 | -1): CasoImagem | null {
  return COLECAO_TC.vizinho(slug, passo)
}

/** URL de um corte (1-based) da primeira série. */
export function urlDoCorteTC(slug: string, corte: number): string {
  const caso = CASOS_TC_POR_SLUG.get(slug)
  return urlDoCorte(caso?.series[0] ?? { prefixo: `radiologia/tc/${slug}/` }, corte)
}
