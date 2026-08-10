/**
 * Camada editorial leve para a cauda longa do atlas.
 *
 * O catálogo-fonte permanece imutável. Estas funções produzem apenas os nomes,
 * capítulos e sistemas usados na interface do Domine Aqui. Códigos de coleta
 * continuam disponíveis na proveniência sem virar o título principal.
 */

export const CAPITULOS_DO_ATLAS = [
  {
    id: 'diagnosticos-e-lesoes',
    nome: 'Doenças e lesões',
    descricao: 'Entidades diagnósticas, variantes e padrões lesionais.',
  },
  {
    id: 'anatomia-e-controles',
    nome: 'Anatomia e controles',
    descricao: 'Tecidos normais, controles e referências comparativas.',
  },
  {
    id: 'tecnicas-e-marcadores',
    nome: 'Colorações e marcadores',
    descricao: 'Histoquímica, imuno-histoquímica e métodos complementares.',
  },
  {
    id: 'macroscopia-e-imagem',
    nome: 'Macroscopia e imagem',
    descricao: 'Peças, radiologia, neuroimagem e correlação anatomopatológica.',
  },
  {
    id: 'casos-e-series',
    nome: 'Casos e séries',
    descricao: 'Casos individuais, séries didáticas e lâminas identificadas por código.',
  },
] as const

export type CapituloDoAtlasId = (typeof CAPITULOS_DO_ATLAS)[number]['id']

const CAPITULO_POR_ID = new Map(CAPITULOS_DO_ATLAS.map((capitulo) => [capitulo.id, capitulo]))

export function obterCapituloDoAtlas(id: string) {
  return CAPITULO_POR_ID.get(id as CapituloDoAtlasId)
}

const ACRONIMOS = new Map(
  [
    'ae1ae3',
    'alk',
    'bcl2',
    'bcl6',
    'cd3',
    'cd4',
    'cd8',
    'cd10',
    'cd20',
    'cd30',
    'cd34',
    'cd56',
    'cd68',
    'cd99',
    'cd117',
    'cd138',
    'ck7',
    'ck20',
    'ema',
    'flair',
    'gfap',
    'he',
    'h&e',
    'ihq',
    'ki-67',
    'pas',
    'pcr',
    'rm',
    's100',
    't1',
    't2',
    'tc',
    'wsi',
  ].map((sigla) => [sigla, sigla === 'ki-67' ? 'Ki-67' : sigla.toUpperCase()]),
)

const SERIES: Record<string, string> = {
  adenoma: 'Adenoma',
  angioamiloide: 'Angiopatia amiloide',
  asecg: 'Astrocitoma subependimário de células gigantes',
  astroana: 'Astrocitoma anaplásico',
  astroblastoma: 'Astroblastoma',
  astrocelgran: 'Astrocitoma de células granulares',
  astrodifuso: 'Astrocitoma difuso',
  astropilo: 'Astrocitoma pilocítico',
  astropilomixo: 'Astrocitoma pilomixoide',
  atrt: 'Tumor teratoide/rabdoide atípico',
  caplexo: 'Carcinoma do plexo coroide',
  cavernoma: 'Malformação cavernosa',
  cisti: 'Cisticercose',
  cistepidermico: 'Cisto epidermoide',
  cistepidural: 'Cisto epidural',
  cistodermoide: 'Cisto dermoide',
  cistcoloid: 'Cisto coloide',
  cistopineal: 'Cisto pineal',
  cistrathke: 'Cisto da bolsa de Rathke',
  cordoma: 'Cordoma',
  craniofar: 'Craniofaringioma',
  cripto: 'Criptococose',
  desmiel: 'Doença desmielinizante',
  displasiacort: 'Displasia cortical',
  dnt: 'Tumor neuroepitelial disembrioplásico',
  encefherp: 'Encefalite herpética',
  ependimoma: 'Ependimoma',
  ependimomamixo: 'Ependimoma mixopapilar',
  esclemult: 'Esclerose múltipla',
  esquistossomose: 'Esquistossomose',
  gangliocitoma: 'Gangliocitoma',
  gangliodesmo: 'Ganglioglioma desmoplásico infantil',
  ganglioglioma: 'Ganglioglioma',
  ganglioneuroblastoma: 'Ganglioneuroblastoma',
  germinoma: 'Germinoma',
  glioblastoma: 'Glioblastoma',
  gliomatose: 'Gliomatose cerebral',
  gliossarcoma: 'Gliossarcoma',
  hamarthipot: 'Hamartoma hipotalâmico',
  hemangioblastoma: 'Hemangioblastoma',
  heterotopia: 'Heterotopia',
  histiocitose: 'Histiocitose',
  lemp: 'Leucoencefalopatia multifocal progressiva',
  lhermitte: 'Tumor de Lhermitte-Duclos',
  linfoma: 'Linfoma',
  malform: 'Malformação do sistema nervoso',
  mav: 'Malformação arteriovenosa',
  meduloblastoma: 'Meduloblastoma',
  meningioma: 'Meningioma',
  meta: 'Metástase',
  mielinolise: 'Mielinólise pontina central',
  mieloma: 'Mieloma',
  neuroblastoma: 'Neuroblastoma',
  neurocitoma: 'Neurocitoma central',
  neurotbc: 'Neurotuberculose',
  nf: 'Neurofibromatose',
  oligo: 'Oligodendroglioma',
  oligoastro: 'Oligoastrocitoma',
  papiplexo: 'Papiloma do plexo coroide',
  paracoco: 'Paracoccidioidomicose',
  paraganglioma: 'Paraganglioma',
  pineoblastoma: 'Pineoblastoma',
  pineocitoma: 'Pineocitoma',
  pnet: 'Tumor neuroectodérmico primitivo',
  polimicrogiria: 'Polimicrogiria',
  ppnet: 'Tumor neuroectodérmico primitivo periférico',
  radionecrose: 'Radionecrose',
  sarcoidose: 'Sarcoidose',
  schwannoma: 'Schwannoma',
  sida: 'Alterações neurológicas associadas à AIDS',
  subependimoma: 'Subependimoma',
  teratomapineal: 'Teratoma pineal',
  toxo: 'Toxoplasmose',
  tucelgran: 'Tumor de células granulares',
  tufibrosol: 'Tumor fibroso solitário',
  tuglioneuron: 'Tumor glioneuronal',
  vasculite: 'Vasculite',
  xantoastro: 'Xantoastrocitoma pleomórfico',
}

const TITULOS_EXATOS: Record<string, string> = {
  biinflhelicobacter: 'Helicobacter pylori — coloração de Warthin-Starry',
  bineugliomatronco: 'Glioma do tronco encefálico',
  hacettepecom: 'Coleção de histopatologia',
  templateen: 'Material complementar',
}

const GENERICO = /^(?:anterior|pr[oó]xim[oa]|seguinte|voltar|mais|recidivar|sem contraste|com contraste|p[aá]gina(?: [ií]ndice)?|mais imagens|he|ihq|histologia|macroscopicamente|microscopicamente|mecanismos|miniresumo|neuroimagem|neuropatologia|literatura)$/i
const CODIGO_DE_LAMINA = /^(?:\*?a\.?\s*[\d/]+[a-z]*|bs\d+[a-z]*|[a-z]{3,}\d+[a-z0-9-]*|\d{1,4}(?:\s*(?:[–—/-]|e)\s*\d{1,4})*)$/i

function limpar(valor: string): string {
  return valor
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim()
}

function restaurarAcronimos(valor: string): string {
  return valor.replace(/\b[\w&-]+\b/g, (token) => ACRONIMOS.get(token.toLowerCase()) ?? token)
}

/** Sentence case em português, preservando siglas médicas frequentes. */
export function formatarTextoCatalogado(valor: string): string {
  const limpo = limpar(valor)
  if (!limpo) return ''

  const letras = limpo.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, '')
  const todoMaiusculo = letras.length > 2 && letras === letras.toLocaleUpperCase('pt-BR')
  const base =
    todoMaiusculo && !ACRONIMOS.has(limpo.toLowerCase())
      ? limpo.toLocaleLowerCase('pt-BR')
      : limpo
  const comInicial = base.replace(
    /^([\s("'«]*)([a-zà-öø-ÿ])/u,
    (_, prefixo: string, letra: string) => prefixo + letra.toLocaleUpperCase('pt-BR'),
  )
  return restaurarAcronimos(comInicial)
}

function tituloDaSerie(codigo: string): string | null {
  const correspondencia = codigo.toLowerCase().match(/^(?:rpg|npt)([a-z]+?)(\d+[a-z0-9-]*)$/)
  if (!correspondencia) return null
  const [, serie, caso] = correspondencia
  const nome = SERIES[serie]
  if (!nome) return null
  return nome + ' — caso ' + caso.toLocaleUpperCase('pt-BR')
}

function tituloDaDescricao(descricao?: string): string | null {
  if (!descricao) return null
  const limpa = limpar(descricao)
  if (!limpa || GENERICO.test(limpa)) return null

  const semIdentificacaoDaLamina = limpa.replace(
    /\s+(?:L[aâ]m?\.?|l[aâ]mina)\s+A?\.?\s*\d+[a-z]*(?:\s*\/\s*\d+[a-z]*)*(?:\s*,\s*corte\s+\w+)?/i,
    '',
  )
  const primeira = semIdentificacaoDaLamina.split(/(?<=[.!?])\s+/)[0]
  const semNumeroDaLamina = primeira
    .replace(/\s+(?:L[aâ]m?\.?|l[aâ]mina)\s+A\.?\s*[\d/]+.*$/i, '')
    .replace(/\s+\(?(?:L[aâ]m?\.?|l[aâ]mina)\s*\d+\)?$/i, '')
    .replace(/[.;:]$/, '')
    .trim()
  const candidata = semNumeroDaLamina.length >= 4 ? semNumeroDaLamina : primeira
  if (GENERICO.test(candidata) || candidata.length < 4) return null
  return formatarTextoCatalogado(
    candidata.length > 120 ? candidata.slice(0, 117).trimEnd() + '…' : candidata,
  )
}

export function tituloEditorialDaEntrada(nomeCatalogado: string, descricaoCatalogada?: string): string {
  const original = limpar(nomeCatalogado)
  const exato = TITULOS_EXATOS[original.toLowerCase()]
  if (exato) return exato
  const serie = tituloDaSerie(original)
  if (serie) return serie

  const pareceCodigo = CODIGO_DE_LAMINA.test(original) && !ACRONIMOS.has(original.toLowerCase())
  if (pareceCodigo || GENERICO.test(original) || original.length > 100) {
    const pelaDescricao = tituloDaDescricao(descricaoCatalogada)
    if (pelaDescricao) return pelaDescricao
  }

  return formatarTextoCatalogado(original)
}

export function descricaoEditorialDaEntrada(descricaoCatalogada?: string): string | undefined {
  if (!descricaoCatalogada) return undefined
  const descricao = formatarTextoCatalogado(descricaoCatalogada)
  if (!descricao || GENERICO.test(descricao)) return undefined
  return descricao.length > 280 ? descricao.slice(0, 277).trimEnd() + '…' : descricao
}

function semAcento(valor: string): string {
  return valor.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function sistemaEditorialDaEntrada(
  entrada: {
    nomeCatalogado: string
    descricaoCatalogada?: string
    paginasFonte: string[]
  },
  sistemaPadrao: string,
): string {
  const url = semAcento(entrada.paginasFonte.join(' '))
  const texto = semAcento(entrada.nomeCatalogado + ' ' + (entrada.descricaoCatalogada ?? ''))

  if (/\/(?:npt|rpg|bineu|radneu|neupat)/.test(url)) return 'sistema-nervoso'
  if (/\/(?:lam|pecas)(?:uro|rim)/.test(url)) return 'urinario-genital-masculino'
  if (/\/(?:lam|pecas)gin/.test(url)) return 'ginecologico-placenta'
  if (/\/(?:lam|pecas)(?:pulm|resp)/.test(url)) return 'respiratorio'
  if (/\/(?:lam|pecas)fig/.test(url)) return 'hepatobiliopancreatico'
  if (/\/(?:lam|pecas)card/.test(url)) return 'cardiovascular'
  if (/\/(?:lam|pecas)tgi|\/bs\d/.test(url)) return 'gastrointestinal'
  if (/\/(?:lam|pecas)(?:pele|derm)/.test(url)) return 'pele'
  if (/\/(?:lam|pecas)(?:hem|linf)/.test(url)) return 'hematolinfoide'
  if (/\/(?:lam|pecas)endo/.test(url)) return 'endocrino'
  if (/\/(?:lam|pecas)mama/.test(url)) return 'mama'
  if (/\/(?:lam|pecas)(?:osso|partesmoles)/.test(url)) return 'ossos-partes-moles'

  if (sistemaPadrao !== 'nao-classificado') return sistemaPadrao

  const regras: Array<[string, RegExp]> = [
    ['sistema-nervoso', /\b(?:cerebr|cerebel|encefal|mening|glio|astrocit|ependim|hipofis|medula espinal|nervo)\w*/],
    ['cardiovascular', /\b(?:miocard|cardiac|coracao|arteri|aorta|vascular|tromboangi|valva)\w*/],
    ['respiratorio', /\b(?:pulmao|pulmonar|pleur|bronqu|alveol|laringe|nasofaring)\w*/],
    ['gastrointestinal', /\b(?:esofag|gastric|estomago|duoden|jejuno|ileon|colon|retal|apendic|intestinal)\w*/],
    ['hepatobiliopancreatico', /\b(?:figado|hepatic|biliar|colang|pancrea|cirrose)\w*/],
    ['urinario-genital-masculino', /\b(?:renal|rim\b|glomerul|urotel|bexiga|prostat|testicul|seminifer)\w*/],
    ['ginecologico-placenta', /\b(?:uter|endometr|ovari|placent|vilosite|corioamn|cervi)\w*/],
    ['mama', /\b(?:mama|mamari|fibroadenoma)\w*/],
    ['endocrino', /\b(?:tireoi|paratireoi|suprarrenal|adrenal|hipofis)\w*/],
    ['pele', /\b(?:epider|cutane|pele\b|nevocelular|bowen|hanseniase)\w*/],
    ['hematolinfoide', /\b(?:linfoma|linfonodo|leucem|timo\b|medula ossea|plasmocit)\w*/],
    ['ossos-partes-moles', /\b(?:osso\b|osse|cartilag|osteos|condros|rabdomio|leiomio|tecido mole)\w*/],
  ]
  return regras.find(([, padrao]) => padrao.test(texto))?.[0] ?? sistemaPadrao
}

export function capituloEditorialDaEntrada(entrada: {
  nomeCatalogado: string
  descricaoCatalogada?: string
  modalidades: string[]
  coloracoes: string[]
  temLaminaVirtual: boolean
}): (typeof CAPITULOS_DO_ATLAS)[number] {
  const nomeOriginal = limpar(entrada.nomeCatalogado)
  const codigoDeSerie = /^(?:rpg|npt|bineu|radneu)[a-z]+\d+[a-z0-9-]*$/i.test(nomeOriginal)
  const titulo = semAcento(
    tituloEditorialDaEntrada(entrada.nomeCatalogado, entrada.descricaoCatalogada),
  )

  let id: CapituloDoAtlasId = 'diagnosticos-e-lesoes'
  if (codigoDeSerie) {
    id = 'casos-e-series'
  } else if (/\b(?:normal|anatomia|controle|comparacao|sem alteracoes)\b/.test(titulo)) {
    id = 'anatomia-e-controles'
  } else if (
    /\b(?:imuno|histoquim|coloracao|marcador|anticorpo|grocott|ziehl|reticulina|tricrom|pas\b|cd\d|gfap|ema\b|ki-?67)\w*/.test(
      titulo,
    )
  ) {
    id = 'tecnicas-e-marcadores'
  } else if (
    /\b(?:ressonancia|tomografia|radiografia|macroscopia|peca cirurgica|t1\b|t2\b|flair)\b/.test(
      titulo,
    )
  ) {
    id = 'macroscopia-e-imagem'
  } else if (
    /\b(?:caso|paciente|masc\.?|fem\.?|anos?\b|serie)\b/.test(titulo)
  ) {
    id = 'casos-e-series'
  }

  return CAPITULO_POR_ID.get(id)!
}
