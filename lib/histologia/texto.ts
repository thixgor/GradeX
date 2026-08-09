/**
 * Normalização textual do Manual da Histologia.
 *
 * Este arquivo é a *única* fonte de verdade para transformar texto em chave de
 * busca e em slug de URL. Ele é consumido de dois lugares muito diferentes:
 *
 *  - pelo aplicativo (React/Next), no cliente e no servidor;
 *  - pelo pipeline de ingestão (`scripts/histologia/construir-dados.mjs`), que
 *    roda em Node com `--experimental-strip-types`.
 *
 * Por isso ele não importa nada e usa apenas sintaxe que o Node consegue
 * "descascar" sem compilar (sem enum, sem namespace, sem decorator). Se as duas
 * pontas divergissem, a busca deixaria de encontrar exatamente os termos que o
 * build indexou — e o bug seria silencioso. `__tests__/histologia/texto.test.ts`
 * trava esse contrato contra um fixture gerado pelo próprio pipeline.
 */

/** Remove diacríticos e caixa. "Cólon ascendente" → "colon ascendente". */
export function semAcento(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/**
 * Chave de busca: sem acento, sem pontuação, espaços colapsados.
 *
 * Trocamos a pontuação por espaço em vez de removê-la para que "H&E" vire
 * "h e" e não "he" — o aluno digita das duas formas, e colar os tokens
 * criaria falsos positivos dentro de outras palavras.
 */
export function chaveDeBusca(valor: string): string {
  return semAcento(valor)
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Tokens únicos de um texto, preservando a ordem de aparição. */
export function tokens(valor: string): string[] {
  const vistos = new Set<string>()
  const saida: string[] = []
  for (const t of chaveDeBusca(valor).split(' ')) {
    if (!t || vistos.has(t)) continue
    vistos.add(t)
    saida.push(t)
  }
  return saida
}

/**
 * Slug de URL. Difere de `chaveDeBusca` apenas na junção (hífen) e no corte de
 * comprimento — o acervo de origem truncava em 18 caracteres e produzia
 * `endoplasmic-reticu`, que além de feio colidia entre páginas distintas.
 */
export function slugificar(valor: string, maximo = 72): string {
  const base = chaveDeBusca(valor).split(' ').join('-')
  if (base.length <= maximo) return base || 'item'
  return base.slice(0, maximo).replace(/-[^-]*$/, '') || base.slice(0, maximo)
}

/**
 * Torna slugs únicos dentro de um mesmo escopo, sufixando `-2`, `-3`…
 *
 * O acervo tem 37 grupos de páginas que colidiriam. A ordem de chegada define
 * quem fica com o slug limpo, e a ordem de chegada é a ordem do catálogo — que
 * é estável entre execuções. Sem isso, as URLs mudariam a cada build.
 */
export function criarDesambiguador() {
  const usados = new Map<string, number>()
  return function unico(slug: string): string {
    const n = usados.get(slug)
    if (n === undefined) {
      usados.set(slug, 1)
      return slug
    }
    const proximo = n + 1
    usados.set(slug, proximo)
    return `${slug}-${proximo}`
  }
}

/**
 * Aparo de texto vindo do H5P: o conteúdo original é HTML com `<div>`, `<p>` e
 * `&nbsp;`. Guardamos só o texto, porque nada do markup original carrega
 * significado — e injetar HTML de terceiros na página seria um vetor de XSS.
 */
export function textoDeHtml(valor: string): string {
  return valor
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Gerador pseudoaleatório determinístico (mulberry32).
 *
 * Usado no embaralhamento das questões: a mesma seed produz sempre a mesma
 * ordem, então o aluno pode fechar a aba e retomar a prova exatamente onde
 * parou, com as alternativas nas mesmas posições. `Math.random()` tornaria a
 * retomada incoerente e o resultado irreprodutível.
 */
export function geradorSemente(semente: number) {
  let estado = semente >>> 0
  return function proximo(): number {
    estado = (estado + 0x6d2b79f5) >>> 0
    let t = estado
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Hash estável de string para semente numérica (FNV-1a de 32 bits). */
export function semented(valor: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < valor.length; i++) {
    h ^= valor.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * Embaralhamento Fisher-Yates determinístico. Não muta a entrada — as listas
 * de alternativas vêm de módulos importados e são compartilhadas entre
 * renderizações.
 */
export function embaralharComSemente<T>(itens: readonly T[], semente: number): T[] {
  const saida = itens.slice()
  const rnd = geradorSemente(semente)
  for (let i = saida.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    const tmp = saida[i]
    saida[i] = saida[j]
    saida[j] = tmp
  }
  return saida
}
