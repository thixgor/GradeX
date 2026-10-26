/**
 * Auditoria das questões que a IA escreve — o "revisor de banca" que olha a
 * questão antes do aluno.
 *
 * Modelos de linguagem têm vícios conhecidos ao escrever múltipla escolha, e
 * quem faz muita prova aprende a explorá-los sem saber o conteúdo:
 *
 *  - a correta é a MAIS LONGA (é a que o modelo "explica");
 *  - só a correta tem parênteses, travessão, "ou seja", ponto e vírgula;
 *  - as erradas são absolutas ("sempre", "nunca", "exclusivamente",
 *    "totalmente") — basta eliminar quem tem advérbio em -mente;
 *  - a correta cai sempre na mesma letra (B e C, no caso do Gemini);
 *  - "todas as anteriores" depois do embaralhamento aponta para o nada.
 *
 * O prompt pede para não fazer nada disso, mas pedir não basta. Aqui cada
 * vício vira uma regra mensurável: a questão que tropeça numa regra
 * `reparavel` volta para a IA numa chamada curta só com as alternativas (ver
 * `repararDistratoras` no gerador); a que tropeça numa `estrutural` é descartada
 * e substituída. A posição da correta não é pedida à IA: é sorteada aqui, de
 * forma equilibrada, para a prova inteira.
 *
 * Puro e determinístico (o sorteio aceita semente) — testado em
 * `__tests__/ia/auditoria-de-questoes.test.ts`.
 */

import type { AlternativeType } from '@/lib/types'

export type FormatoDeQuestao = Exclude<AlternativeType, 'mixed'>

export interface AlternativaAuditavel {
  texto: string
  correta: boolean
}

export interface QuestaoAuditavel {
  formato: FormatoDeQuestao
  enunciado: string
  comando: string
  alternativas: AlternativaAuditavel[]
  temRecurso?: boolean
}

export type CodigoDeAlerta =
  | 'correta-mais-longa'
  | 'distratoras-curtas'
  | 'marcas-so-na-correta'
  | 'termos-absolutos'
  | 'alternativas-repetidas'
  | 'referencia-a-alternativas'
  | 'gabarito-invalido'
  | 'quantidade-errada'
  | 'formato-incoerente'
  | 'recurso-ausente'

export interface Alerta {
  codigo: CodigoDeAlerta
  /** `estrutural`: descarta e gera outra. `reparavel`: reescreve as distratoras. */
  gravidade: 'estrutural' | 'reparavel'
  detalhe: string
}

/** O que o revisor diz para a IA na chamada de reparo — instrução curta, acionável. */
export const INSTRUCAO_DO_ALERTA: Record<CodigoDeAlerta, string> = {
  'correta-mais-longa': 'a correta é visivelmente a mais longa: deixe todas com tamanho parecido (±20%)',
  'distratoras-curtas': 'há distratora curta demais, sem conteúdo: escreva-a com o mesmo nível de detalhe da correta',
  'marcas-so-na-correta':
    'só a correta tem parênteses/travessão/explicação: tire a explicação da correta ou dê a mesma estrutura às outras',
  'termos-absolutos':
    'as distratoras usam termos absolutos (sempre, nunca, exclusivamente, totalmente, -mente): troque por erros conceituais plausíveis, sem absolutos',
  'alternativas-repetidas': 'há alternativas quase iguais: cada uma deve testar um erro conceitual diferente',
  'referencia-a-alternativas': 'não use "todas/nenhuma das anteriores" nem cite letras de outras alternativas',
  'gabarito-invalido': 'exatamente uma alternativa deve estar correta',
  'quantidade-errada': 'número de alternativas diferente do pedido',
  'formato-incoerente': 'o enunciado não tem a estrutura que o formato exige',
  'recurso-ausente': 'o enunciado cita tabela/gráfico/esquema que não veio',
}

// ── Medidas ────────────────────────────────────────────────────────────────

function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const tamanho = (s: string) => s.replace(/\s+/g, ' ').trim().length

/**
 * Termos absolutos e generalizações — o "cheiro" da distratora banal.
 * "apenas"/"somente" ficam fora do formato de afirmativas, onde são a própria
 * gramática da alternativa ("Apenas I e II").
 */
const ABSOLUTOS =
  /\b(sempre|nunca|jamais|exclusivamente|unicamente|somente|apenas|totalmente|completamente|absolutamente|necessariamente|obrigatoriamente|invariavelmente|inteiramente|integralmente|universalmente|categoricamente|nenhum|nenhuma|qualquer|todo e qualquer)\b/

/** Advérbio em -mente com radical de verdade (descarta "mente", "demente", "semente"). */
const ADVERBIO_MENTE = /\b[a-z]{5,}mente\b/g
const NAO_ADVERBIOS = new Set(['semente', 'clemente', 'demente', 'veemente', 'somente', 'frequentemente', 'geralmente'])

function temAbsoluto(texto: string, formato: FormatoDeQuestao): boolean {
  const t = normalizar(texto)
  if (formato !== 'multiple-affirmative' && ABSOLUTOS.test(t)) return true
  const adverbios = (t.match(ADVERBIO_MENTE) || []).filter((p) => !NAO_ADVERBIOS.has(p))
  return adverbios.some((p) => /^(exclusiva|unica|total|complet|absolut|necessaria|obrigatoria|invariavel|inteira|integral|universal|categorica|definitiva|estrita|plena|rigorosa|irreversivel)/.test(p))
}

/** Parênteses, travessão, dois-pontos, ponto e vírgula, "ou seja"… — a correta que se explica. */
function temMarcaExplicativa(texto: string): boolean {
  return /[()–—;:]|\s-\s|\bou seja\b|\bisto é\b|\bpor exemplo\b|\bex\.:?/i.test(texto)
}

function semelhanca(a: string, b: string): number {
  const x = new Set(normalizar(a).split(' ').filter((p) => p.length > 2))
  const y = new Set(normalizar(b).split(' ').filter((p) => p.length > 2))
  if (x.size === 0 || y.size === 0) return 0
  let comum = 0
  x.forEach((p) => {
    if (y.has(p)) comum++
  })
  return comum / (x.size + y.size - comum)
}

// ── Auditoria ──────────────────────────────────────────────────────────────

export function auditarQuestao(q: QuestaoAuditavel, alternativasEsperadas: number): Alerta[] {
  const alertas: Alerta[] = []
  const alts = q.alternativas
  const corretas = alts.filter((a) => a.correta)

  if (alts.length !== alternativasEsperadas) {
    alertas.push({
      codigo: 'quantidade-errada',
      gravidade: 'estrutural',
      detalhe: `${alts.length} alternativas, esperadas ${alternativasEsperadas}`,
    })
  }
  if (corretas.length !== 1) {
    alertas.push({ codigo: 'gabarito-invalido', gravidade: 'estrutural', detalhe: `${corretas.length} corretas` })
    return alertas
  }
  if (alts.some((a) => tamanho(a.texto) === 0)) {
    alertas.push({ codigo: 'quantidade-errada', gravidade: 'estrutural', detalhe: 'alternativa vazia' })
    return alertas
  }

  // Estrutura do formato.
  const enunciado = q.enunciado || ''
  if (q.formato === 'multiple-affirmative') {
    const numerais = ['I', 'II', 'III'].every((n) => new RegExp(`(^|\\n|\\s)${n}[.)\\-–]`).test(enunciado))
    if (!numerais) {
      alertas.push({ codigo: 'formato-incoerente', gravidade: 'estrutural', detalhe: 'afirmativas sem I, II, III no enunciado' })
    }
  }
  if (q.formato === 'assertion-reason' && !/(asser|porque|raz[aã]o)/i.test(enunciado)) {
    alertas.push({ codigo: 'formato-incoerente', gravidade: 'estrutural', detalhe: 'asserção-razão sem as duas asserções' })
  }
  if (
    !q.temRecurso &&
    /\b(tabela|gr[aá]fico|esquema|quadro|figura|fluxograma)\b[^.]{0,30}\b(abaixo|a seguir|acima|apresentad|seguinte|ao lado)/i.test(enunciado)
  ) {
    alertas.push({ codigo: 'recurso-ausente', gravidade: 'estrutural', detalhe: 'cita material de apoio que não veio' })
  }

  // Alternativas que falam de outras alternativas quebram no embaralhamento.
  if (alts.some((a) => /(todas|nenhuma) (as|das) (alternativas )?(anteriores|acima)|\balternativas? [a-e]\b|\b[a-e] e [a-e] est[aã]o/i.test(a.texto))) {
    alertas.push({ codigo: 'referencia-a-alternativas', gravidade: 'reparavel', detalhe: 'cita outras alternativas' })
  }

  // Repetidas.
  for (let i = 0; i < alts.length; i++) {
    for (let j = i + 1; j < alts.length; j++) {
      if (normalizar(alts[i].texto) === normalizar(alts[j].texto) || semelhanca(alts[i].texto, alts[j].texto) > 0.85) {
        alertas.push({ codigo: 'alternativas-repetidas', gravidade: 'reparavel', detalhe: `${i + 1} ≈ ${j + 1}` })
        i = alts.length
        break
      }
    }
  }

  // Asserção-razão tem as cinco alternativas fixas: os vícios de redação não se aplicam.
  if (q.formato === 'assertion-reason') return alertas

  const correta = corretas[0]
  const distratoras = alts.filter((a) => !a.correta)
  const tCorreta = tamanho(correta.texto)
  const tDistratoras = distratoras.map((a) => tamanho(a.texto))
  const maiorDistratora = Math.max(...tDistratoras)
  const mediaDistratoras = tDistratoras.reduce((s, t) => s + t, 0) / tDistratoras.length

  // Afirmativas: as alternativas são combinações curtas ("Apenas I e III"); só os absolutos importam lá… e nem eles.
  if (q.formato !== 'multiple-affirmative') {
    if (tCorreta > maiorDistratora * 1.2 && tCorreta - maiorDistratora >= 15) {
      alertas.push({
        codigo: 'correta-mais-longa',
        gravidade: 'reparavel',
        detalhe: `correta ${tCorreta} car., maior distratora ${maiorDistratora}`,
      })
    }
    if (tCorreta >= 40 && Math.min(...tDistratoras) < tCorreta * 0.45 && mediaDistratoras < tCorreta * 0.8) {
      alertas.push({ codigo: 'distratoras-curtas', gravidade: 'reparavel', detalhe: 'distratora com menos da metade da correta' })
    }
    if (temMarcaExplicativa(correta.texto) && !distratoras.some((a) => temMarcaExplicativa(a.texto))) {
      alertas.push({ codigo: 'marcas-so-na-correta', gravidade: 'reparavel', detalhe: 'parênteses/travessão só na correta' })
    }
  }

  const distratorasAbsolutas = distratoras.filter((a) => temAbsoluto(a.texto, q.formato)).length
  if (!temAbsoluto(correta.texto, q.formato) && distratorasAbsolutas >= 2) {
    alertas.push({
      codigo: 'termos-absolutos',
      gravidade: 'reparavel',
      detalhe: `${distratorasAbsolutas} distratoras com termo absoluto e a correta sem nenhum`,
    })
  }

  return alertas
}

export const precisaDescartar = (alertas: Alerta[]) => alertas.some((a) => a.gravidade === 'estrutural')
export const precisaReparar = (alertas: Alerta[]) => !precisaDescartar(alertas) && alertas.some((a) => a.gravidade === 'reparavel')

// ── Comando ────────────────────────────────────────────────────────────────

/**
 * Comando negativo em CAIXA ALTA, como fazem as bancas ("assinale a
 * INCORRETA", "EXCETO"): a palavra que inverte a pergunta não pode passar
 * despercebida — senão a questão testa atenção, não conteúdo.
 */
export function normalizarComando(comando: string): string {
  let c = comando.replace(/\s+/g, ' ').trim()
  c = c.replace(/\b(incorretas?|exceto|falsas?|erradas?)\b/gi, (p) => p.toUpperCase())
  c = c.replace(/\bn[aã]o\b(?=\s+(é|está|corresponde|representa|apresenta|se aplica|constitui))/gi, 'NÃO')
  if (c && !/[:?]$/.test(c)) c = c.replace(/[.;,]+$/, '') + ':'
  return c
}

/** O comando pede a INCORRETA? Então quem a IA marca como "correta" é a afirmação falsa. */
export function comandoNegativo(comando: string): boolean {
  return /\b(incorreta|exceto|falsa|errada)\b|\bn[aã]o (é|está|corresponde)/i.test(comando)
}

// ── Gabarito equilibrado ───────────────────────────────────────────────────

/** Gerador pseudoaleatório pequeno e com semente (mulberry32). */
export function sorteador(semente: number): () => number {
  let a = semente >>> 0 || 0x9e3779b9
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function embaralhar<T>(lista: T[], aleatorio: () => number): T[] {
  const copia = lista.slice()
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

/**
 * A posição da correta em cada questão da prova: cada letra aparece o mesmo
 * número de vezes (±1), em blocos embaralhados, e nunca três iguais seguidas.
 * É o que uma banca faz à mão — e o que impede o "na dúvida, marque C".
 */
export function sequenciaDeGabarito(quantidade: number, alternativas: number, aleatorio: () => number = Math.random): number[] {
  const posicoes = Array.from({ length: alternativas }, (_, i) => i)
  const saida: number[] = []
  while (saida.length < quantidade) {
    let bloco = embaralhar(posicoes, aleatorio)
    // Evita a terceira igual na emenda dos blocos.
    for (let tentativa = 0; tentativa < 6; tentativa++) {
      const n = saida.length
      if (n >= 2 && saida[n - 1] === saida[n - 2] && bloco[0] === saida[n - 1]) {
        bloco = embaralhar(posicoes, aleatorio)
        continue
      }
      if (n >= 1 && bloco[0] === saida[n - 1] && bloco[1] === saida[n - 1]) {
        bloco = embaralhar(posicoes, aleatorio)
        continue
      }
      break
    }
    saida.push(...bloco)
  }
  return saida.slice(0, quantidade)
}

/**
 * Põe a correta no índice pedido e as distratoras, embaralhadas, nas outras
 * posições. Devolve os índices originais na ordem nova — quem chama usa a
 * mesma ordem para levar junto o comentário de cada alternativa.
 */
export function ordemComCorretaEm(
  alternativas: AlternativaAuditavel[],
  alvo: number,
  aleatorio: () => number = Math.random,
): number[] {
  const indiceCorreta = alternativas.findIndex((a) => a.correta)
  const distratoras = embaralhar(
    alternativas.map((_, i) => i).filter((i) => i !== indiceCorreta),
    aleatorio,
  )
  const posicao = Math.max(0, Math.min(alternativas.length - 1, alvo))
  distratoras.splice(posicao, 0, indiceCorreta)
  return distratoras
}

// ── Lote ───────────────────────────────────────────────────────────────────

export interface ResumoDaAuditoria {
  questoes: number
  /** Em quantas a correta é estritamente a mais longa — numa prova honesta fica perto de 1/n. */
  corretaMaisLonga: number
  posicoes: Record<string, number>
}

export function resumirLote(questoes: { alternativas: AlternativaAuditavel[]; formato: FormatoDeQuestao }[]): ResumoDaAuditoria {
  const posicoes: Record<string, number> = {}
  let corretaMaisLonga = 0
  for (const q of questoes) {
    const i = q.alternativas.findIndex((a) => a.correta)
    const letra = String.fromCharCode(65 + Math.max(0, i))
    posicoes[letra] = (posicoes[letra] || 0) + 1
    if (q.formato === 'assertion-reason' || q.formato === 'multiple-affirmative') continue
    const tCorreta = tamanho(q.alternativas[i]?.texto || '')
    if (q.alternativas.every((a, k) => k === i || tamanho(a.texto) < tCorreta)) corretaMaisLonga++
  }
  return { questoes: questoes.length, corretaMaisLonga, posicoes }
}
