/**
 * Normalização e comparação de texto da busca global.
 *
 * Isomórfico de propósito: as mesmas funções normalizam o catálogo estático no
 * navegador e o conteúdo vindo do Mongo no servidor. Duas implementações
 * divergiriam na ordenação e o aluno veria resultados diferentes para a mesma
 * consulta conforme a resposta viesse do cliente ou da rede.
 */

/**
 * Cache das chaves já normalizadas. O índice estático tem centenas de campos e
 * a normalização roda a cada tecla digitada; sem memória, `NFD` + regex seriam
 * refeitos milhares de vezes por sessão para strings que nunca mudam.
 */
const CACHE_MAXIMO = 5000
const cacheChaves = new Map<string, string>()

/** Preposições e artigos que não distinguem nada em português. */
const CONECTIVOS = new Set([
  'a', 'as', 'ao', 'aos', 'da', 'das', 'de', 'do', 'dos', 'e', 'em', 'na',
  'nas', 'no', 'nos', 'o', 'os', 'ou', 'para', 'pra', 'por', 'um', 'uma',
])

/**
 * Chave canônica: sem acento, minúscula, só letras e números, espaço único.
 * "Cólon ascendente" e "COLON  ASCENDENTE!" viram a mesma coisa.
 */
export function chaveDeBusca(valor: unknown): string {
  const bruto = typeof valor === 'string' ? valor : String(valor ?? '')
  if (!bruto) return ''

  const emCache = cacheChaves.get(bruto)
  if (emCache !== undefined) return emCache

  const chave = alinhar(bruto).trim().replace(/\s+/g, ' ')

  // Descarte simples ao encher: o cache existe para o índice, que é estável.
  // O que enche é consulta digitada, e essa é justamente a que não se repete.
  if (cacheChaves.size >= CACHE_MAXIMO) cacheChaves.clear()
  cacheChaves.set(bruto, chave)
  return chave
}

/**
 * Igual a `chaveDeBusca`, mas SEM colapsar espaços — cada caractere de entrada
 * vira exatamente um caractere de saída. É o que permite achar a posição de um
 * termo na versão normalizada e recortar o texto ORIGINAL com o mesmo índice,
 * preservando acentos e maiúsculas no realce.
 */
export function alinhar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
}

/** Chave sem espaço nenhum: faz "mapamental" encontrar "Mapas Mentais". */
export function compactar(chave: string): string {
  return chave.replace(/ /g, '')
}

/** Palavras da chave, na ordem, sem repetição. */
export function palavras(chave: string): string[] {
  if (!chave) return []
  return Array.from(new Set(chave.split(' ').filter(Boolean)))
}

/**
 * Palavras significativas coladas: "banco de questões" → "bancoquestoes".
 * É esta forma que faz "bancoquestoes" e "mapasmentais" encontrarem o que
 * procuram — colar a chave inteira manteria o "de" no meio e não casaria nada.
 */
export function colar(chave: string): string {
  return chave
    .split(' ')
    .filter(p => p && !CONECTIVOS.has(p))
    .join('')
}

/**
 * Termos de uma consulta. Conectivos saem — mas só quando sobra alguma coisa,
 * senão buscar "do" não devolveria nada. O teto de 8 evita que uma colagem de
 * parágrafo inteiro vire 300 comparações por item do índice.
 */
export function termosDaConsulta(consulta: string): string[] {
  const todas = palavras(chaveDeBusca(consulta))
  const uteis = todas.filter(t => !CONECTIVOS.has(t))
  return (uteis.length > 0 ? uteis : todas).slice(0, 8)
}

/**
 * Iniciais das palavras significativas: "Banco de Questões" → "bq".
 * Cobre a sigla que o usuário digita de cabeça ("mc" para Manual Clínico).
 */
export function iniciais(chave: string): string {
  return chave
    .split(' ')
    .filter(p => p && !CONECTIVOS.has(p))
    .map(p => p[0])
    .join('')
}

/**
 * Distância de Damerau-Levenshtein com teto: conta troca, inserção, remoção e
 * transposição de vizinhos ("cardilogia" → "cardiologia" custa 1).
 *
 * Para de calcular assim que TODA a linha ultrapassa o teto — é o que mantém o
 * custo perto de O(n) no caso comum, em que as palavras nem se parecem. Devolve
 * `teto + 1` quando estoura, então quem chama só precisa comparar com o teto.
 */
export function distanciaLimitada(a: string, b: string, teto: number): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > teto) return teto + 1
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  let anterior2: number[] = []
  let anterior: number[] = Array.from({ length: b.length + 1 }, (_, i) => i)
  let atual: number[] = new Array(b.length + 1)

  for (let i = 1; i <= a.length; i++) {
    atual[0] = i
    let melhorDaLinha = atual[0]

    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1
      let valor = Math.min(
        atual[j - 1] + 1,      // inserção
        anterior[j] + 1,       // remoção
        anterior[j - 1] + custo, // substituição
      )

      // Transposição: trocar duas letras vizinhas é o erro de digitação mais
      // comum e sem isto custaria 2, o que reprovaria a palavra pelo teto.
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        valor = Math.min(valor, anterior2[j - 2] + custo)
      }

      atual[j] = valor
      if (valor < melhorDaLinha) melhorDaLinha = valor
    }

    if (melhorDaLinha > teto) return teto + 1

    anterior2 = anterior
    anterior = atual
    atual = new Array(b.length + 1)
  }

  return anterior[b.length]
}

/** Teto de erro aceitável para um termo, proporcional ao tamanho. */
export function tetoDeErro(termo: string): number {
  if (termo.length <= 3) return 0
  if (termo.length <= 6) return 1
  return 2
}

/**
 * `agulha` aparece em `palheiro` na ordem, com buracos? Cobre a digitação por
 * iniciais espalhadas ("crngrm" → "cronograma"). É o sinal mais fraco que a
 * busca aceita, e por isso vale poucos pontos no motor.
 */
export function ehSubsequencia(agulha: string, palheiro: string): boolean {
  if (!agulha) return true
  if (agulha.length > palheiro.length) return false
  let i = 0
  for (let j = 0; j < palheiro.length && i < agulha.length; j++) {
    if (palheiro[j] === agulha[i]) i++
  }
  return i === agulha.length
}

export interface FatiaDeRealce {
  texto: string
  realce: boolean
}

/**
 * Fatia o texto marcando onde os termos aparecem. Devolve pedaços em vez de
 * HTML: montar `<mark>` aqui obrigaria a interface a usar
 * `dangerouslySetInnerHTML` sobre texto que veio do banco.
 */
export function fatiarParaRealce(texto: string, termos: string[]): FatiaDeRealce[] {
  const semRealce = [{ texto, realce: false }]
  if (!texto || termos.length === 0) return semRealce

  const alinhado = alinhar(texto)
  // Se a normalização não preservou o comprimento (caractere exótico), qualquer
  // posição calculada aqui apontaria para o lugar errado. Um destaque deslocado
  // é pior que nenhum.
  if (alinhado.length !== texto.length) return semRealce

  const faixas: Array<[number, number]> = []
  for (const termo of termos) {
    if (termo.length < 2) continue
    let pos = alinhado.indexOf(termo)
    while (pos >= 0) {
      faixas.push([pos, pos + termo.length])
      pos = alinhado.indexOf(termo, pos + termo.length)
    }
  }
  if (faixas.length === 0) return semRealce

  faixas.sort((a, b) => a[0] - b[0])
  const unidas: Array<[number, number]> = []
  for (const faixa of faixas) {
    const ultima = unidas[unidas.length - 1]
    if (ultima && faixa[0] <= ultima[1]) ultima[1] = Math.max(ultima[1], faixa[1])
    else unidas.push([faixa[0], faixa[1]])
  }

  const fatias: FatiaDeRealce[] = []
  let cursor = 0
  for (const [inicio, fim] of unidas) {
    if (inicio > cursor) fatias.push({ texto: texto.slice(cursor, inicio), realce: false })
    fatias.push({ texto: texto.slice(inicio, fim), realce: true })
    cursor = fim
  }
  if (cursor < texto.length) fatias.push({ texto: texto.slice(cursor), realce: false })
  return fatias
}
