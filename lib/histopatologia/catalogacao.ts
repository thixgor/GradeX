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
  'abdominal mesothelioma': 'Mesotelioma abdominal',
  'adenocarcinoma of ampulla of vater': 'Adenocarcinoma da ampola de Vater',
  'alcian blue/periodic acid–schiff': 'Azul de Alcian/PAS',
  'anthracosis, anthracotic pigment': 'Antracose — pigmento antracótico',
  biinflhelicobacter: 'Helicobacter pylori — coloração de Warthin-Starry',
  bineugliomatronco: 'Glioma do tronco encefálico',
  'brain mucormycosis gms': 'Mucormicose cerebral — Grocott',
  'brain mucormycosis he': 'Mucormicose cerebral — HE',
  'brain, metastatic hepatoblastoma': 'Cérebro — metástase de hepatoblastoma',
  'brown fat': 'Tecido adiposo marrom',
  'cholesterol polyp': 'Pólipo de colesterol',
  'congo red birefringence': 'Birrefringência pelo vermelho Congo',
  'congo red stain for amyloidosis': 'Vermelho Congo para amiloidose',
  'extramural venous invasion': 'Invasão venosa extramural',
  'extramural venous invasion in adenocarcinoma':
    'Invasão venosa extramural em adenocarcinoma',
  'gallbladder adenomyoma': 'Adenomioma da vesícula biliar',
  'gallbladder pathology': 'Patologia da vesícula biliar',
  'gallbladder rokitansky-aschoff sinus': 'Seio de Rokitansky-Aschoff da vesícula biliar',
  'granular cell tumor in esophagus': 'Tumor de células granulares do esôfago',
  hacettepecom: 'Coleção de histopatologia',
  'ischemic colitis': 'Colite isquêmica',
  'keloid - skar': 'Queloide',
  'melanosis coli': 'Melanose do cólon',
  'melanosis coli pas': 'Melanose do cólon — PAS',
  'metastatic carcinoma, omentum': 'Carcinoma metastático no omento',
  'nasopharyngeal carcinoma, nonkeratinizing squamous cell carcinoma':
    'Carcinoma escamoso não queratinizante da nasofaringe',
  'pediatric autopsy': 'Autópsia pediátrica',
  'pediatric autopsy, brain': 'Autópsia pediátrica — cérebro',
  'stomach signet ring cell carcinoma': 'Carcinoma gástrico de células em anel de sinete',
  templateen: 'Material complementar',
  'venous invasion': 'Invasão venosa',
}

const TITULOS_POR_PAGINA: Record<string, string> = {
  bineuangioressovennla: 'Angiorressonância venosa normal',
  bineuleucodist5: 'Leucodistrofia — substância branca occipital',
  lamdc13: 'Infarto cerebral antigo',
  lamdc5a: 'Necrose centrolobular hepática',
  lamdegn10: 'Amiloidose glomerular avançada',
  lamdegn4a: 'Lâmina A. 271a — visão panorâmica',
  lamgin16: 'Epitélio mülleriano seroso — lâmina A. 104',
  laminfl30: 'Glomerulonefrite difusa aguda — lâmina A. 140',
  lamneo20a: 'Leiomioma — arquitetura fasciculada',
  lampele3: 'Paracoccidioidomicose — aspecto em roda de leme',
  pecasdc6: 'Infarto antigo com fibrose',
  pecasneo31: 'Linfangite carcinomatosa por carcinoma mamário',
  'rpgmeningiomat1.3': 'Meningioma calcificado frontal — caso 1.3',
  'rpgmeningiomat1.5': 'Meningioma maligno frontal — caso 1.5',
  'rpgmeningiomat6.2': 'Meningioma infiltrativo do esfenoide — caso 6.2',
  tanecrose2: 'Calcificação — mecanismos',
}

const GENERICO = /^(?:anterior|pr[oó]xim[oa]|seguinte|voltar|mais|recidivar|sem contraste|com contraste|p[aá]gina(?: [ií]ndice)?|mais imagens|he|ihq|histologia|macroscopicamente|microscopicamente|mecanismos|miniresumo|neuroimagem|neuropatologia|literatura|this (?:page|section)(?: in english)?|click for (?:video|full screen wsi)|see microscopy with viewer:)$/i
const CODIGO_DE_LAMINA = /^(?:\*?a\.?\s*[\d/]+[a-z]*|[a-z]{1,5}-?\d+[a-z0-9-]*|\d{1,4}(?:\s*(?:[–—/-]|e)\s*\d{1,4})*)$/i

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

function tituloDeCasoCatalogado(codigo: string): string | null {
  const hacettepe = codigo.match(/^hacettepe-com-case-(\d+)$/i)
  if (hacettepe) return `Série Hacettepe — caso ${hacettepe[1]}`

  const caso = codigo.match(/^case-(\d+)$/i)
  if (caso) return `Caso didático ${caso[1]}`

  const banco = codigo.match(/^bs-?(\d+)$/i)
  if (banco) return `Banco de casos — lâmina ${banco[1]}`

  return null
}

function tituloPeloEndereco(paginasFonte: readonly string[]): string | null {
  for (const pagina of paginasFonte) {
    try {
      const arquivo = new URL(pagina).pathname.split('/').pop()?.replace(/\.[a-z0-9]+$/i, '') ?? ''
      const titulo =
        TITULOS_POR_PAGINA[arquivo.toLowerCase()] ??
        tituloDaSerie(arquivo) ??
        tituloDeCasoCatalogado(arquivo)
      if (titulo) return titulo
    } catch {
      // Endereço inválido permanece apenas na proveniência; não vira título.
    }
  }
  return null
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

export function tituloEditorialDaEntrada(
  nomeCatalogado: string,
  descricaoCatalogada?: string,
  paginasFonte: readonly string[] = [],
): string {
  const original = limpar(nomeCatalogado)
  const exato = TITULOS_EXATOS[original.toLowerCase()]
  if (exato) return exato
  const serie = tituloDaSerie(original)
  if (serie) return serie
  const casoCatalogado = tituloDeCasoCatalogado(original)
  if (casoCatalogado) return casoCatalogado

  const pareceCodigo = CODIGO_DE_LAMINA.test(original) && !ACRONIMOS.has(original.toLowerCase())
  if (pareceCodigo || GENERICO.test(original) || original.length > 80) {
    const pelaPagina = tituloPeloEndereco(paginasFonte)
    if (pelaPagina) return pelaPagina
    const pelaDescricao = tituloDaDescricao(descricaoCatalogada)
    if (pelaDescricao) return pelaDescricao
  }

  if (CODIGO_DE_LAMINA.test(original)) {
    return `Lâmina ${restaurarAcronimos(original.toLocaleUpperCase('pt-BR'))}`
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
  if (/anatpat\.unicamp\.br\/(?:nerv|rad|taneu|textotu|neu)/.test(url)) return 'sistema-nervoso'
  if (/anatpat\.unicamp\.br\/mus/.test(url)) return 'ossos-partes-moles'
  if (/anatpat\.unicamp\.br\/(?:egin|liliana)/.test(url)) return 'ginecologico-placenta'
  if (/anatpat\.unicamp\.br\/ehemo/.test(url)) return 'hematolinfoide'
  if (/anatpat\.unicamp\.br\/efig/.test(url)) return 'hepatobiliopancreatico'
  if (/anatpat\.unicamp\.br\/bicard/.test(url)) return 'cardiovascular'
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
  if (/histopathologyatlas\.com\/(?:ampulla-vater|gallbladder|liver)/.test(url)) {
    return 'hepatobiliopancreatico'
  }
  if (/histopathologyatlas\.com\/(?:esophagus|stomach|colon|appendix|benign)/.test(url)) {
    return 'gastrointestinal'
  }
  if (/histopathologyatlas\.com\/kidney/.test(url)) return 'urinario-genital-masculino'
  if (/histopathologyatlas\.com\/(?:lung|pleura|nasopharynx|ear)/.test(url)) {
    return 'respiratorio'
  }

  if (sistemaPadrao !== 'nao-classificado') return sistemaPadrao

  const regras: Array<[string, RegExp]> = [
    ['sistema-nervoso', /\b(?:brain|cerebr|cerebel|encefal|mening|glio|astrocit|ependim|hipofis|spinal|medula espinal|nerv|pineal)\w*/],
    ['cardiovascular', /\b(?:heart|cardiac|miocard|coracao|arteri|aorta|vascular|tromboangi|valva)\w*/],
    ['respiratorio', /\b(?:lung|pulmao|pulmonar|pleur|bronqu|alveol|laringe|nasopharyn|nasofaring)\w*/],
    ['gastrointestinal', /\b(?:esophag|esofag|gastric|stomach|estomago|duoden|jejuno|ileon|colon|rectal|retal|appendi|apendic|intestinal)\w*/],
    ['hepatobiliopancreatico', /\b(?:liver|gallbladder|ampulla|figado|hepatic|biliar|colang|pancrea|cirrose)\w*/],
    ['urinario-genital-masculino', /\b(?:kidney|renal|rim\b|glomerul|urotel|bladder|bexiga|prostat|testicul|seminifer)\w*/],
    ['ginecologico-placenta', /\b(?:gynec|ginecolog|uter|endometr|ovari|placent|vilosite|corioamn|cervi|vulva)\w*/],
    ['mama', /\b(?:breast|mama|mamari|fibroadenoma)\w*/],
    ['endocrino', /\b(?:thyroid|tireoi|paratireoi|suprarrenal|adrenal|hipofis)\w*/],
    ['pele', /\b(?:skin|epider|cutane|pele\b|nevocelular|bowen|hanseniase)\w*/],
    ['hematolinfoide', /\b(?:lymph|spleen|linfoma|linfonodo|leucem|timo\b|medula ossea|plasmocit)\w*/],
    ['ossos-partes-moles', /\b(?:bone|muscle|soft tissue|osso\b|osse|muscul|cartilag|osteos|condros|rabdomio|leiomio|tecido mole)\w*/],
  ]
  const sistemaPeloTexto = regras.find(([, padrao]) => padrao.test(texto))?.[0]
  if (sistemaPeloTexto) return sistemaPeloTexto

  // As duas coleções têm páginas gerais, técnicas e índices que não pertencem
  // a um órgão. Mantê-las em Patologia Geral evita um agrupamento residual sem nome.
  if (/anatpat\.unicamp\.br|histopathologyatlas\.com/.test(url)) return 'patologia-geral'
  return sistemaPadrao
}

export function capituloEditorialDaEntrada(entrada: {
  nomeCatalogado: string
  descricaoCatalogada?: string
  modalidades: string[]
  coloracoes: string[]
  temLaminaVirtual: boolean
}): (typeof CAPITULOS_DO_ATLAS)[number] {
  const nomeOriginal = limpar(entrada.nomeCatalogado)
  const codigoDeSerie = /^(?:(?:rpg|npt|bineu|radneu)[a-z]+\d+[a-z0-9-]*|hacettepe-com-case-\d+|case-\d+|bs-?\d+)$/i.test(
    nomeOriginal,
  )
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
