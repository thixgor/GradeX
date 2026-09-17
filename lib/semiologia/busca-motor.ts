/**
 * O motor de busca do Manual de Semiologia — puro, sem React e sem acervo.
 *
 * ## O que "inteligente" quer dizer aqui
 *
 * O aluno não sabe o nome oficial do que procura. Ele digita "flapping" e o
 * acervo guarda "asterixe"; digita "joanete" e o acervo guarda "hálux valgo";
 * digita "pneumotorax" sem acento, "b lines" em inglês, "sinal do D" com o
 * artigo, ou erra uma letra em "esclerodactilia". Cada um desses é um fracasso
 * de uma busca por substring — e são exatamente as buscas de quem está
 * começando, que é quem mais precisa encontrar.
 *
 * Então o motor faz cinco coisas, em ordem de custo:
 *
 * 1. **Normaliza**: minúsculas, sem acento, sem pontuação. "Pneumotórax" e
 *    "pneumotorax" viram a mesma coisa.
 * 2. **Traduz**: um glossário de termos leigos, em inglês e de gíria de
 *    enfermaria para o vocabulário do acervo. "flapping" → "asterixe".
 * 3. **Pontua por campo**: bater no título vale mais que bater num sinônimo,
 *    que vale mais que bater no resumo. Dois tokens no título valem mais que
 *    um.
 * 4. **Tolera erro de digitação**: um token que não bate em nada tenta
 *    distância de edição 1 (ou 2 em palavras longas) contra o vocabulário da
 *    entrada. "esclerodatilia" acha "esclerodactilia".
 * 5. **Aceita prefixo**: "hipert" acha "hipertensão", porque o aluno digita
 *    devagar e a lista tem de reagir a cada letra.
 *
 * O índice chega pronto do servidor (`busca.ts`); este arquivo só sabe
 * pontuar. Assim o mesmo motor serve o catálogo de sinais, a paleta global e
 * qualquer lista futura, sem cada tela reinventar a sua régua.
 */

export type TipoDeEntrada = 'sinal' | 'cena' | 'cena-ultrassom' | 'vista' | 'janela' | 'comparador'

export interface EntradaDeBusca {
  tipo: TipoDeEntrada
  /** Chave estável — slug do sinal, `janela/cena` da cena. */
  id: string
  titulo: string
  /** Sinônimos e nomes alternativos, já no idioma em que o aluno procura. */
  sinonimos: string[]
  /** Uma linha de contexto: sistema, diagnóstico, pergunta da janela. */
  contexto: string
  /** Corpo indexável de baixo peso: resumo, diagnóstico, diferencial. */
  corpo: string
  href: string
  /** Miniatura do caso real, quando existe. */
  capa?: string
  /** Onde a entrada mora — "Ultrassom pulmonar", "Pele e fâneros". */
  grupo: string
  temCasoReal: boolean
}

export interface Resultado {
  entrada: EntradaDeBusca
  pontos: number
  /** Como a entrada foi encontrada — para o "você quis dizer" e o realce. */
  via: 'titulo' | 'sinonimo' | 'contexto' | 'corpo' | 'aproximado'
  /** Tokens do corpo que bateram, para realçar. */
  tokensQueBateram: string[]
}

// ─── Normalização ─────────────────────────────────────────────────────────────

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const VAZIAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'as', 'os', 'em', 'no', 'na', 'com', 'por', 'para', 'um', 'uma', 'ao', 'the', 'of', 'sinal'])

export function tokenizar(texto: string): string[] {
  // Tokens de uma letra ficam: "sinal do D", "linhas B", "perfil A" são
  // exatamente o que o aluno digita, e a letra é o que distingue.
  return normalizar(texto)
    .split(/[\s-]+/)
    .filter((t) => t.length > 0 && !VAZIAS.has(t))
}

// ─── Glossário ────────────────────────────────────────────────────────────────

/**
 * Termo que o aluno digita → termos do acervo. Cada linha é um caso real de
 * busca que devolveria vazio sem ela. Mantido curto e explícito de propósito:
 * um dicionário grande demais começa a inventar correspondências.
 */
export const GLOSSARIO: Record<string, string[]> = {
  flapping: ['asterixe'],
  godet: ['cacifo', 'edema'],
  cacifo: ['edema'],
  'spider': ['aranha vascular', 'estigmas'],
  naevi: ['aranha vascular'],
  clubbing: ['baqueteamento'],
  jaundice: ['ictericia'],
  cyanosis: ['cianose'],
  ascites: ['ascite'],
  jvp: ['jugular'],
  joanete: ['halux valgo'],
  bunion: ['halux valgo'],
  cobreiro: ['herpes zoster'],
  shingles: ['herpes zoster'],
  boqueira: ['queilite angular'],
  papo: ['bocio'],
  goiter: ['bocio'],
  sarna: ['escabiose'],
  scabies: ['escabiose'],
  berne: ['miiase'],
  bicheira: ['miiase'],
  'bicho-de-pe': ['tungiase'],
  'bicho geografico': ['larva migrans'],
  lepra: ['hanseniase'],
  leprosy: ['hanseniase'],
  caxumba: ['parotidite'],
  mumps: ['parotidite'],
  catapora: ['varicela'],
  measles: ['sarampo'],
  'lung sliding': ['deslizamento pleural'],
  sliding: ['deslizamento'],
  'b-lines': ['linhas b'],
  blines: ['linhas b'],
  'a-lines': ['linhas a'],
  'lung point': ['ponto pulmonar'],
  barcode: ['codigo de barras'],
  seashore: ['praia'],
  effusion: ['derrame'],
  tamponade: ['tamponamento'],
  'd sign': ['sinal do d'],
  'd-sign': ['sinal do d'],
  epss: ['epss'],
  tapse: ['tapse'],
  ivc: ['veia cava'],
  cava: ['veia cava'],
  fast: ['fast'],
  morison: ['morrison'],
  morrison: ['fast morrison'],
  dvt: ['tvp', 'trombose venosa'],
  trombose: ['tvp'],
  gallbladder: ['vesicula'],
  gallstone: ['colelitiase'],
  hydronephrosis: ['hidronefrose'],
  kidney: ['rim', 'rins'],
  bladder: ['bexiga'],
  aaa: ['aneurisma'],
  appendix: ['apendice'],
  appendicitis: ['apendicite'],
  'small bowel obstruction': ['obstrucao intestinal'],
  sbo: ['obstrucao intestinal'],
  'free fluid': ['liquido livre'],
  ectopic: ['ectopica'],
  iup: ['gestacao intrauterina'],
  retina: ['descolamento de retina', 'fundoscopia'],
  onsd: ['bainha do nervo optico'],
  'nervo optico': ['bainha do nervo optico', 'papiledema'],
  pocus: ['ultrassom'],
  eco: ['ecocardiograma', 'paraesternal', 'apical', 'subxifoide'],
  ecocardiograma: ['paraesternal', 'apical', 'subxifoide'],
  otite: ['otoscopia'],
  timpano: ['otoscopia'],
  'fundo de olho': ['fundoscopia'],
  garganta: ['orofaringe'],
  amigdala: ['orofaringe'],
  nariz: ['rinoscopia'],
  pupila: ['pupilas', 'anisocoria'],
  avc: ['paralisia facial central', 'hemianopsia', 'pronator drift', 'afasia'],
  derrame: ['derrame', 'avc'],
  parkinson: ['tremor de repouso', 'marcha parkinsoniana', 'facies parkinsoniana'],
  tetano: ['opistotono', 'riso sardonico'],
  meningite: ['rigidez de nuca', 'kernig', 'brudzinski', 'fontanela'],
  lupus: ['rash malar', 'lupus discoide'],
  esclerodermia: ['esclerodactilia', 'raynaud', 'telangiectasias'],
  dermatomiosite: ['gottron', 'heliotropo'],
  endocardite: ['osler', 'janeway', 'estilhaco', 'vegetacao'],
  cushing: ['facies cushingoide', 'estrias violaceas'],
  graves: ['exoftalmia', 'retracao palpebral', 'mixedema pre-tibial', 'bocio'],
  hipotireoidismo: ['facies mixedematosa'],
  addison: ['hiperpigmentacao'],
  cirrose: ['ictericia', 'ascite', 'aranha vascular', 'cabeca de medusa', 'unhas de terry'],
  gota: ['tofo', 'podagra'],
  'artrite reumatoide': ['desvio ulnar', 'pescoco de cisne'],
  sifilis: ['cancro duro', 'sifilis secundaria', 'argyll robertson'],
  hiv: ['kaposi', 'candidiase'],
  diabetes: ['pe diabetico', 'charcot', 'acantose'],
  trauma: ['battle', 'guaxinim', 'hifema', 'fast'],
  tercol: ['hordeolo', 'calazio'],
  monkeypox: ['mpox'],
  sapinho: ['candidiase'],
  dermatoscopia: ['dermatoscopia', 'nevo', 'melanoma'],
  dermoscopy: ['dermatoscopia'],
  'lampada de fenda': ['segmento anterior'],
  'slit lamp': ['segmento anterior'],
  'olho vermelho': ['conjuntivite', 'uveite', 'glaucoma agudo'],
  marfan: ['polegar', 'punho', 'aracnodactilia'],
  turner: ['pescoco alado'],
  down: ['trissomia'],
  chagas: ['romana'],
  tifoide: ['roseola'],
  broncoscopia: ['carina', 'bronquio'],
  'corda vocal': ['prega vocal'],
  'vocal cord': ['prega vocal'],
  'pe torto': ['equinovaro'],
  clubfoot: ['pe torto'],
}

function expandir(tokens: string[], consulta: string): { tokens: string[]; traduzido: boolean } {
  const extras = new Set<string>()
  let traduzido = false
  // Palavra inteira, nunca substring: "eco" não pode disparar em "secreção".
  const inteira = ` ${normalizar(consulta).replace(/-/g, ' ')} `
  for (const [chave, alvos] of Object.entries(GLOSSARIO)) {
    const k = normalizar(chave).replace(/-/g, ' ')
    if (inteira.includes(` ${k} `) || tokens.includes(k)) {
      traduzido = true
      for (const alvo of alvos) for (const t of tokenizar(alvo)) extras.add(t)
    }
  }
  return { tokens: [...new Set([...tokens, ...extras])], traduzido }
}

// ─── Distância de edição ──────────────────────────────────────────────────────

/** Damerau-Levenshtein com corte: devolve `limite + 1` assim que passa do limite. */
export function distancia(a: string, b: string, limite: number): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > limite) return limite + 1
  const la = a.length
  const lb = b.length
  let anterior2: number[] = []
  let anterior = Array.from({ length: lb + 1 }, (_, j) => j)
  for (let i = 1; i <= la; i++) {
    const atual = [i]
    let menor = i
    for (let j = 1; j <= lb; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1
      let v = Math.min(anterior[j] + 1, atual[j - 1] + 1, anterior[j - 1] + custo)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, anterior2[j - 2] + 1)
      atual[j] = v
      if (v < menor) menor = v
    }
    if (menor > limite) return limite + 1
    anterior2 = anterior
    anterior = atual
  }
  return anterior[lb]
}

function toleranciaPara(token: string): number {
  if (token.length < 5) return 0
  if (token.length < 9) return 1
  return 2
}

// ─── Pontuação ────────────────────────────────────────────────────────────────

interface EntradaPreparada {
  entrada: EntradaDeBusca
  titulo: string
  tituloTokens: string[]
  sinonimos: string[]
  contexto: string
  corpoTokens: Set<string>
  vocabulario: string[]
}

/** Pré-processa o índice uma vez; o resto é só comparar strings. */
export function preparar(indice: EntradaDeBusca[]): EntradaPreparada[] {
  return indice.map((entrada) => {
    const titulo = normalizar(entrada.titulo)
    const tituloTokens = tokenizar(entrada.titulo)
    const sinonimos = entrada.sinonimos.map(normalizar)
    const contexto = normalizar(entrada.contexto)
    const corpoTokens = new Set([
      ...tituloTokens,
      ...entrada.sinonimos.flatMap(tokenizar),
      ...tokenizar(entrada.contexto),
      ...tokenizar(entrada.corpo),
      ...tokenizar(entrada.grupo),
    ])
    return { entrada, titulo, tituloTokens, sinonimos, contexto, corpoTokens, vocabulario: [...corpoTokens] }
  })
}

export interface OpcoesDeBusca {
  limite?: number
  tipos?: TipoDeEntrada[]
}

export interface RespostaDeBusca {
  resultados: Resultado[]
  /** A consulta passou pelo glossário — a lista mostra por quê. */
  traduzido: boolean
  /** Nada bateu exatamente e o motor devolveu aproximações. */
  aproximado: boolean
}

export function buscar(preparado: EntradaPreparada[], consulta: string, opcoes: OpcoesDeBusca = {}): RespostaDeBusca {
  const limite = opcoes.limite ?? 30
  const q = normalizar(consulta)
  const brutos = tokenizar(consulta)
  if (!q || (brutos.length === 0 && q.length < 2)) return { resultados: [], traduzido: false, aproximado: false }
  const { tokens, traduzido } = expandir(brutos.length ? brutos : [q], consulta)

  const resultados: Resultado[] = []
  let houveExato = false

  for (const p of preparado) {
    if (opcoes.tipos && !opcoes.tipos.includes(p.entrada.tipo)) continue

    let pontos = 0
    let via: Resultado['via'] = 'corpo'
    const bateram: string[] = []

    // Frase inteira no título ou num sinônimo — o caso feliz.
    if (p.titulo === q) {
      pontos += 200
      via = 'titulo'
    } else if (p.titulo.startsWith(q)) {
      pontos += 140
      via = 'titulo'
    } else if (q.length >= 4 && p.titulo.includes(q)) {
      // Substring só a partir de 4 letras: "eco" dentro de "ginecomastia"
      // não é o que ninguém quis dizer.
      pontos += 110
      via = 'titulo'
    } else if (p.sinonimos.some((s) => s === q)) {
      pontos += 150
      via = 'sinonimo'
    } else if (q.length >= 4 && p.sinonimos.some((s) => s.includes(q))) {
      pontos += 100
      via = 'sinonimo'
    } else if (p.contexto.includes(q) && q.length > 3) {
      pontos += 40
      via = 'contexto'
    }

    // Token a token: título > sinônimo > corpo, com prefixo aceito.
    let tokensQueBateram = 0
    for (const token of tokens) {
      let melhor = 0
      // Token de uma ou duas letras só casa inteiro — "d" não é prefixo de "digital".
      const prefixoOk = token.length >= 3
      if (p.tituloTokens.some((t) => t === token)) melhor = 30
      else if (prefixoOk && p.tituloTokens.some((t) => t.startsWith(token))) melhor = 22
      else if (p.sinonimos.some((s) => s.split(' ').some((t) => t === token || (prefixoOk && t.startsWith(token))))) melhor = 18
      else if (p.corpoTokens.has(token)) melhor = 10
      else if (token.length >= 3 && p.vocabulario.some((t) => t.startsWith(token))) melhor = 6
      if (melhor > 0) {
        tokensQueBateram += 1
        pontos += melhor
        bateram.push(token)
      }
    }

    // Todos os tokens bateram: o aluno descreveu a entrada, mesmo fora de ordem.
    if (tokens.length > 1 && tokensQueBateram === tokens.length) pontos += 25

    if (pontos > 0) houveExato = true

    // Aproximação só para os tokens que não bateram — caro, e por isso por último.
    if (tokensQueBateram < tokens.length) {
      for (const token of tokens) {
        if (bateram.includes(token)) continue
        const tol = toleranciaPara(token)
        if (tol === 0) continue
        let achou = false
        for (const t of p.tituloTokens) {
          if (distancia(token, t, tol) <= tol) {
            pontos += 16
            achou = true
            break
          }
        }
        if (!achou) {
          for (const t of p.vocabulario) {
            if (Math.abs(t.length - token.length) <= tol && distancia(token, t, tol) <= tol) {
              pontos += 5
              achou = true
              break
            }
          }
        }
        if (achou) {
          bateram.push(token)
          if (via === 'corpo' && pontos < 30) via = 'aproximado'
        }
      }
    }

    if (pontos <= 0) continue
    // Caso real desempata: entre duas fichas iguais, a que tem foto ensina mais.
    if (p.entrada.temCasoReal) pontos += 2
    resultados.push({ entrada: p.entrada, pontos, via, tokensQueBateram: bateram })
  }

  resultados.sort((a, b) => b.pontos - a.pontos || a.entrada.titulo.localeCompare(b.entrada.titulo, 'pt-BR'))
  const cortados = resultados.slice(0, limite)
  return {
    resultados: cortados,
    traduzido,
    aproximado: !houveExato && cortados.length > 0,
  }
}

/** Rótulo humano de cada tipo, para agrupar a lista. */
export const ROTULO_DO_TIPO: Record<TipoDeEntrada, string> = {
  sinal: 'Sinais do exame físico',
  cena: 'Beira-leito',
  'cena-ultrassom': 'Ultrassom',
  vista: 'Janelas de imagem',
  janela: 'Janelas de ultrassom',
  comparador: 'Comparadores',
}

/** Ordem dos grupos na lista — o que o aluno mais procura primeiro. */
export const ORDEM_DOS_TIPOS: TipoDeEntrada[] = ['sinal', 'cena-ultrassom', 'cena', 'janela', 'vista', 'comparador']
