import { chaveDeBusca, palavras } from '@/lib/busca-plataforma/texto'
import type { Natureza } from './tipos'

/**
 * Vocabulário clínico compartilhado pelos manuais.
 *
 * Os manuais foram escritos separados, cada um com o seu jeito de nomear: a TC
 * diz "Carcinoma de células renais", a Histopatologia diz "Carcinoma de células
 * renais de células claras" (e cadastra "hipernefroma" e "tumor de Grawitz"), o
 * Ultrassom diz "Tumor renal", o Manual diz o que o autor da ficha escreveu.
 * Nenhum deles carrega um identificador comum — e nem deveria: cada um é dono
 * do próprio acervo.
 *
 * O que os une é a medicina por trás do nome: **o órgão** e **a natureza do
 * processo**. Este arquivo ensina a máquina a ler os dois a partir do texto.
 * Não é curadoria por tema (ninguém escreveu "neoplasias renais" à mão): é o
 * dicionário que vale para o acervo inteiro, inclusive para o que ainda vai
 * ser escrito.
 *
 * ## Como uma palavra vira órgão
 *
 * Três formas de casar, todas sobre a chave sem acento:
 * - `exatas`: a palavra inteira ("rim", "renal").
 * - `prefixos`: o radical ("nefr" pega nefrite, nefrótica, hidronefrose…).
 * - `frases`: duas palavras juntas quando só elas são inequívocas
 *   ("vesicula biliar" — "vesícula" sozinha é também lesão de pele).
 *
 * E uma guarda: `exceto` derruba o casamento por prefixo. É ela que impede
 * "adrenal" e "suprarrenal" de virarem rim — o erro mais óbvio que um
 * casamento por substring cometeria.
 */

interface Padrao {
  exatas?: string[]
  prefixos?: string[]
  frases?: string[]
  exceto?: string[]
}

export interface Orgao extends Padrao {
  id: string
  nome: string
}

export const ORGAOS: Orgao[] = [
  {
    id: 'rim',
    nome: 'rim',
    exatas: [
      'rim', 'rins', 'renal', 'renais', 'perirrenal', 'perirrenais', 'pararrenal', 'wilms', 'angiomiolipoma',
      'oncocitoma', 'glomerulo', 'glomerulos', 'glomerular', 'glomerulares', 'calice', 'calices', 'calicial',
    ],
    // "glomerul" e "calic" soltos pegariam o glomérulo do cerebelo, a zona
    // glomerulosa da adrenal e as células caliciformes do intestino.
    prefixos: ['nefr', 'hidronefr', 'pielo', 'glomerulonefr', 'glomerulopat', 'glomeruloescl', 'calicectas'],
  },
  { id: 'ureter', nome: 'ureter', prefixos: ['ureter', 'hidroureter'] },
  { id: 'uretra', nome: 'uretra', prefixos: ['uretr'] },
  { id: 'bexiga', nome: 'bexiga', exatas: ['bexiga', 'vesical', 'vesicais', 'cistite', 'cistites'], prefixos: ['vesicoureter'] },
  { id: 'prostata', nome: 'próstata', prefixos: ['prostat'] },
  { id: 'testiculo', nome: 'testículo', exatas: ['seminoma', 'varicocele', 'hidrocele'], prefixos: ['testic', 'orqui', 'epididim', 'escrot'] },
  { id: 'utero', nome: 'útero', prefixos: ['uter', 'endometr', 'miometr'], frases: ['colo uterino', 'colo do utero'] },
  { id: 'ovario', nome: 'ovário', prefixos: ['ovari'] },
  { id: 'gestacao', nome: 'gestação', exatas: ['feto', 'fetal', 'fetos'], prefixos: ['placent', 'gestac', 'obstetr', 'gravid', 'ectopic', 'corioamnio', 'amnio'] },
  { id: 'mama', nome: 'mama', exatas: ['mama', 'mamas'], prefixos: ['mamari', 'mastit', 'mamogr', 'fibroadenom'] },
  { id: 'figado', nome: 'fígado', exatas: ['figado', 'cirrose'], prefixos: ['hepat', 'hepatocel'], exceto: ['hepatorren'] },
  { id: 'vias-biliares', nome: 'vias biliares', prefixos: ['colecist', 'colelit', 'coledoc', 'colang', 'biliar'], frases: ['vesicula biliar'] },
  { id: 'pancreas', nome: 'pâncreas', prefixos: ['pancrea'] },
  { id: 'esofago', nome: 'esôfago', prefixos: ['esofag'] },
  { id: 'estomago', nome: 'estômago', exatas: ['estomago', 'piloro'], prefixos: ['gastr', 'pilor'], exceto: ['gastrocnemi'] },
  { id: 'intestino-delgado', nome: 'intestino delgado', exatas: ['ileo', 'ileal', 'ileite', 'celiaca', 'celiaco', 'giardiase'], prefixos: ['duoden', 'jejun'], frases: ['intestino delgado'] },
  { id: 'apendice', nome: 'apêndice', prefixos: ['apendic', 'apendag'] },
  { id: 'colon', nome: 'cólon e reto', exatas: ['colon', 'colons', 'colite', 'colites', 'ceco', 'cecal', 'crohn'], prefixos: ['colorret', 'colonosc', 'sigmoid', 'diverticul', 'retossigm', 'colocol', 'intussuscep'], frases: ['intestino grosso'] },
  { id: 'peritonio', nome: 'peritônio', exatas: ['ascite'], prefixos: ['periton', 'hemoperit', 'morrison'] },
  { id: 'pulmao', nome: 'pulmão', exatas: ['enfisema', 'atelectasia', 'traqueia', 'traqueal'], prefixos: ['pulm', 'pneumon', 'broncopneum', 'bronq', 'alveol', 'tuberculos', 'pneumocon'] },
  { id: 'pleura', nome: 'pleura', exatas: ['empiema', 'pneumotorax', 'hemotorax', 'hidropneumotorax', 'quilotorax'], prefixos: ['pleur'] },
  { id: 'mediastino', nome: 'mediastino', prefixos: ['mediastin', 'timoma', 'pneumomediast'] },
  {
    id: 'coracao',
    nome: 'coração',
    exatas: ['coracao', 'mitral', 'tricuspide', 'iam'],
    // "cardi" solto pegaria a cárdia do estômago.
    prefixos: ['cardio', 'cardiac', 'cardit', 'miocard', 'pericard', 'endocard', 'valv', 'ventric', 'atrial', 'atrio', 'coronar'],
    exceto: ['cardiovascular'],
  },
  { id: 'aorta', nome: 'aorta', prefixos: ['aort'] },
  { id: 'veias', nome: 'veias', exatas: ['tvp', 'varizes'], prefixos: ['venos', 'flebit', 'tromboflebit'], frases: ['trombose venosa'] },
  { id: 'arterias', nome: 'artérias', prefixos: ['arteri', 'aterosc', 'poliarter', 'vasculit'], exceto: ['arteriograma'] },
  { id: 'encefalo', nome: 'encéfalo', exatas: ['avc', 'cerebro', 'demencia', 'alzheimer', 'parkinson'], prefixos: ['cerebr', 'cerebel', 'hipocamp', 'encefal', 'intracran', 'glioblast', 'gliom', 'hidrocefal', 'subaracn', 'subdural', 'extradural', 'epidural'] },
  { id: 'meninges', nome: 'meninges', prefixos: ['mening'] },
  { id: 'medula-espinal', nome: 'medula espinal', frases: ['medula espinal', 'medula espinhal'], prefixos: ['raquimed'] },
  { id: 'tireoide', nome: 'tireoide', exatas: ['bocio', 'hashimoto'], prefixos: ['tireo', 'tiroid', 'tireoid'] },
  { id: 'paratireoide', nome: 'paratireoide', prefixos: ['paratire', 'paratiroid', 'hiperparat', 'hipoparat'] },
  { id: 'adrenal', nome: 'adrenal', exatas: ['cushing', 'addison'], prefixos: ['adrenal', 'suprarren', 'feocromocit'] },
  { id: 'hipofise', nome: 'hipófise', exatas: ['prolactinoma', 'acromegalia'], prefixos: ['hipofis', 'pituit'] },
  { id: 'pele', nome: 'pele', exatas: ['pele', 'melanoma', 'psoriase', 'eczema', 'urticaria', 'celulite', 'acne', 'vitiligo'], prefixos: ['cutane', 'dermat', 'basocel', 'epiderm'] },
  { id: 'osso', nome: 'osso', exatas: ['osso', 'ossos', 'femur', 'tibia', 'umero', 'costela', 'costelas', 'escafoide', 'clavicula'], prefixos: ['osse', 'oste', 'ossific', 'fratur', 'vertebr'] },
  { id: 'articulacao', nome: 'articulação', exatas: ['gota'], prefixos: ['artrit', 'artros', 'articul', 'sinovi', 'menisc', 'ligament', 'luxac'] },
  { id: 'musculo', nome: 'músculo', prefixos: ['muscul', 'miosit', 'rabdomi'] },
  { id: 'linfoide', nome: 'linfonodos e baço', exatas: ['baco', 'hodgkin', 'timo'], prefixos: ['linfonod', 'linfom', 'linfaden', 'esplen'] },
  { id: 'sangue', nome: 'sangue e medula óssea', exatas: ['sangue', 'anemia', 'anemias'], prefixos: ['leucem', 'mielom', 'hemoglob', 'plaquet', 'trombocit', 'hemofil', 'coagul', 'hemoli', 'talassem', 'falciform'] },
  { id: 'olho', nome: 'olho', exatas: ['olho', 'olhos', 'papiledema', 'catarata', 'conjuntiva', 'conjuntivas'], prefixos: ['ocul', 'retin', 'glaucom', 'conjuntivit', 'cornea', 'palpebr', 'oftalm', 'pupil', 'uveit'], frases: ['fundo de olho', 'nervo optico'] },
  { id: 'ouvido', nome: 'ouvido', exatas: ['ouvido', 'ouvidos'], prefixos: ['otit', 'timpan', 'otoscop', 'cocle'] },
  { id: 'nariz', nome: 'nariz e seios da face', exatas: ['nariz', 'nasal', 'nasais', 'epistaxe'], prefixos: ['sinusit', 'rinit', 'rinoscop', 'rinossinus'] },
  { id: 'faringe', nome: 'faringe e laringe', prefixos: ['faring', 'laring', 'amigdal', 'tonsil', 'orofaring', 'epiglot'] },
  { id: 'glandulas-salivares', nome: 'glândulas salivares', prefixos: ['parotid', 'submandibul', 'sublingu', 'saliv', 'sialo'] },
  { id: 'anus', nome: 'canal anal', exatas: ['anal', 'anus'], prefixos: ['hemorroid', 'perian'] },
  { id: 'genitais', nome: 'pênis e vagina', exatas: ['penis', 'peniano', 'peniana'], prefixos: ['vagin', 'vulv', 'balan'] },
  { id: 'boca', nome: 'boca', exatas: ['boca', 'oral', 'lingua', 'labio', 'labios'], prefixos: ['gengiv', 'estomat', 'dentar', 'dentari'] },
]

export const ORGAO_POR_ID = new Map(ORGAOS.map((o) => [o.id, o]))

interface NaturezaDef extends Padrao {
  id: Natureza
  /** Plural para o selo: "Outras neoplasias do rim". */
  plural: string
  /** Sufixos de palavra (o "-ite" das inflamações). */
  sufixos?: string[]
}

export const NATUREZAS: NaturezaDef[] = [
  {
    id: 'neoplasia',
    plural: 'neoplasias',
    exatas: ['tumor', 'tumores', 'cancer', 'massa', 'miomas', 'mioma', 'wilms', 'hodgkin'],
    prefixos: [
      'carcinom', 'adenocarcinom', 'adenom', 'sarcom', 'osteossarcom', 'linfom', 'leucem', 'mielom', 'melanom',
      'neoplas', 'metasta', 'oncocitom', 'angiomiolipom', 'hamartom', 'glioblastom', 'gliom', 'meningiom',
      'seminom', 'teratom', 'hemangiom', 'lipom', 'leiomiom', 'fibroadenom', 'papilom', 'nefroblastom',
      'blastom', 'timom', 'feocromocitom', 'prolactinom', 'oncolog',
    ],
  },
  {
    id: 'inflamatoria',
    plural: 'inflamações e infecções',
    exatas: ['sepse', 'empiema', 'celulite', 'giardiase', 'malaria', 'sifilis', 'herpes', 'hiv', 'gota'],
    prefixos: ['abscess', 'pneumon', 'broncopneum', 'tuberculos', 'infec', 'bacter', 'fung', 'parasit', 'viral', 'inflam'],
    sufixos: ['ite', 'ites'],
  },
  {
    id: 'vascular',
    plural: 'doenças vasculares',
    exatas: ['avc', 'tvp', 'varizes', 'hematoma'],
    prefixos: ['infart', 'isquem', 'trombo', 'embol', 'aneurism', 'dissec', 'hemorrag', 'vasculit', 'aterosc'],
  },
  {
    id: 'traumatica',
    plural: 'lesões traumáticas',
    prefixos: ['trauma', 'fratur', 'contus', 'lacerac', 'luxac', 'ruptur'],
  },
  {
    id: 'congenita',
    plural: 'alterações congênitas',
    exatas: ['ferradura', 'atresia', 'agenesia'],
    prefixos: ['congenit', 'malforma', 'trissom', 'hipoplas', 'genetic'],
  },
  {
    id: 'obstrutiva',
    plural: 'obstruções e cálculos',
    prefixos: ['calcul', 'litias', 'colelit', 'obstru', 'hidronefr', 'hidroureter', 'estenos'],
  },
  {
    id: 'cistica',
    plural: 'lesões císticas',
    exatas: ['cisto', 'cistos', 'cistico', 'cistica', 'cisticos', 'cisticas'],
    prefixos: ['policist'],
  },
  {
    id: 'degenerativa',
    plural: 'doenças degenerativas e metabólicas',
    exatas: ['cirrose', 'artrose', 'diabetes'],
    prefixos: ['degenera', 'osteopor', 'amiloid', 'esteatos', 'diabet', 'fibros', 'demenc'],
  },
]

const NATUREZA_POR_ID = new Map(NATUREZAS.map((n) => [n.id, n]))

export function pluralDaNatureza(id: Natureza): string {
  return NATUREZA_POR_ID.get(id)?.plural ?? id
}

export function nomeDoOrgao(id: string): string {
  return ORGAO_POR_ID.get(id)?.nome ?? id
}

/* ───────────────────────────── Casamento ───────────────────────────── */

function casaPalavra(palavra: string, padrao: Padrao & { sufixos?: string[] }): boolean {
  if (padrao.exceto?.some((p) => palavra.startsWith(p))) return false
  if (padrao.exatas?.includes(palavra)) return true
  if (padrao.prefixos?.some((p) => palavra.startsWith(p))) return true
  // O "-ite" exige palavra longa o bastante para não pegar "elite" ou "site".
  if (padrao.sufixos?.some((s) => palavra.length >= 6 && palavra.endsWith(s))) return true
  return false
}

function casaTexto(chave: string, lista: string[], padrao: Padrao & { sufixos?: string[] }): boolean {
  if (padrao.frases?.some((f) => ` ${chave} `.includes(` ${f} `))) return true
  return lista.some((p) => casaPalavra(p, padrao))
}

/** Órgãos mencionados num texto, na ordem do vocabulário. */
export function orgaosDoTexto(...textos: Array<string | undefined>): string[] {
  const chave = chaveDeBusca(textos.filter(Boolean).join(' '))
  const lista = palavras(chave)
  return ORGAOS.filter((o) => casaTexto(chave, lista, o)).map((o) => o.id)
}

/**
 * Órgãos na ordem em que o texto os menciona. Para o texto de apoio (o resumo
 * de um caso), o primeiro órgão citado costuma ser o do achado; os seguintes
 * são vizinhos descritos de passagem.
 */
export function orgaosNaOrdemDoTexto(texto: string): string[] {
  const chave = chaveDeBusca(texto)
  const ordem: string[] = []
  for (const p of chave.split(' ')) {
    for (const o of ORGAOS) {
      if (!ordem.includes(o.id) && casaPalavra(p, o)) ordem.push(o.id)
    }
  }
  for (const o of ORGAOS) if (!ordem.includes(o.id) && o.frases?.some((f) => ` ${chave} `.includes(` ${f} `))) ordem.push(o.id)
  return ordem
}

/** Naturezas de processo mencionadas num texto. */
export function naturezasDoTexto(...textos: Array<string | undefined>): Natureza[] {
  const chave = chaveDeBusca(textos.filter(Boolean).join(' '))
  const lista = palavras(chave)
  return NATUREZAS.filter((n) => casaTexto(chave, lista, n)).map((n) => n.id)
}

/* ───────────────────────────── Termos ───────────────────────────── */

/**
 * Palavras que não dizem de que assunto se trata. Ficam fora dos termos para
 * que "Sinal de X" e "Caso de X" não pareçam parentes só pelo "sinal" e pelo
 * "caso". O peso do resto é decidido pelo IDF, no motor.
 */
const VAZIAS = new Set([
  'a', 'as', 'ao', 'aos', 'da', 'das', 'de', 'do', 'dos', 'e', 'em', 'na', 'nas', 'no', 'nos', 'o', 'os', 'ou',
  'para', 'por', 'um', 'uma', 'com', 'sem', 'que', 'se', 'sua', 'seu', 'pelo', 'pela', 'entre',
  'sinal', 'sinais', 'caso', 'casos', 'cena', 'normal', 'normais', 'alterado', 'alterada', 'tipo', 'tipos',
  'janela', 'vista', 'corte', 'achado', 'achados', 'padrao', 'exame', 'imagem', 'lamina', 'laminas',
  'direito', 'direita', 'esquerdo', 'esquerda', 'bilateral', 'grau', 'forma', 'the', 'of', 'and',
])

/**
 * Radical leve: só desfaz o plural. "renais" e "renal" precisam ser a mesma
 * palavra; um stemmer agressivo, ao contrário, juntaria "hepatite" e
 * "hepático" — e em medicina essas são coisas diferentes.
 */
export function radical(palavra: string): string {
  if (palavra.length <= 3) return palavra
  if (palavra.endsWith('ais')) return `${palavra.slice(0, -3)}al`
  if (palavra.endsWith('eis')) return `${palavra.slice(0, -3)}el`
  if (palavra.endsWith('oes') || palavra.endsWith('aes')) return `${palavra.slice(0, -3)}ao`
  if (palavra.endsWith('ns')) return `${palavra.slice(0, -2)}m`
  if (palavra.endsWith('res') && palavra.length > 5) return palavra.slice(0, -2)
  if (palavra.endsWith('s') && !palavra.endsWith('ss') && !palavra.endsWith('us') && !palavra.endsWith('is')) {
    return palavra.slice(0, -1)
  }
  return palavra
}

/** Radicais significativos de um ou mais textos, sem repetição. */
export function termosDoTexto(...textos: Array<string | undefined>): string[] {
  const vistos = new Set<string>()
  for (const texto of textos) {
    if (!texto) continue
    for (const p of palavras(chaveDeBusca(texto))) {
      if (p.length < 3 || VAZIAS.has(p) || /^\d+$/.test(p)) continue
      vistos.add(radical(p))
    }
  }
  return Array.from(vistos)
}

/* ─────────────────────── Sistemas do Manual Clínico ─────────────────────── */

/**
 * O sistema da ficha do Manual (`SistemaFisiologico`) é largo demais para
 * virar órgão sozinho — "Sistema Digestivo e Hepatobiliar" é meia dúzia de
 * órgãos. Por isso ele só entra quando o título não diz órgão nenhum, e mesmo
 * assim só onde o sistema praticamente é um órgão.
 */
export const ORGAOS_DO_SISTEMA: Record<string, string[]> = {
  'Sistema Renal e Urinário': ['rim'],
  'Sistema Respiratório': ['pulmao'],
  'Sistema Cardiovascular': ['coracao'],
  'Sistema Hematológico': ['sangue'],
  'Sistema Dermatológico': ['pele'],
  'Sistema Nervoso Central e Periférico': ['encefalo'],
}

/* ─────────────────────── Referências essenciais ─────────────────────── */

/**
 * O exame de primeira linha de cada órgão. Sem isto, as referências de mesmo
 * peso sairiam em ordem alfabética, e quem estuda tumor renal veria
 * "calcitriol" antes de "hematúria". São radicais (ver `radical`), comparados
 * com os termos do item.
 */
const ESSENCIAIS: Record<string, string[]> = {
  rim: ['creatinina', 'ureia', 'eas', 'urina', 'hematuria', 'proteinuria', 'tfg', 'filtracao', 'piuria', 'rin'],
  figado: ['transaminase', 'ast', 'alt', 'bilirrubina', 'albumina', 'inr', 'tgo', 'tgp', 'figado'],
  'vias-biliares': ['bilirrubina', 'fosfatase', 'ggt', 'colestase', 'vesicula'],
  coracao: ['troponina', 'bnp', 'ntprobnp', 'ckmb', 'coracao'],
  pulmao: ['gasometria', 'pao2', 'hipoxemia', 'pulmao'],
  pancreas: ['amilase', 'lipase', 'pancrea'],
  tireoide: ['tsh', 't4', 'tireoide'],
  sangue: ['hemograma', 'hemoglobina', 'plaqueta', 'leucocito', 'reticulocito', 'sangue'],
  musculo: ['ck', 'cpk', 'mioglobina'],
  prostata: ['psa', 'prostata'],
}

export function ehEssencialDoOrgao(orgao: string, item: { termos: string[]; termosExtras?: string[] }): boolean {
  const lista = ESSENCIAIS[orgao]
  if (!lista) return false
  return [...item.termos, ...(item.termosExtras ?? [])].some((t) => lista.includes(t))
}
