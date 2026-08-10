/**
 * Normalização textual da Histopatologia.
 *
 * Assim como `lib/histologia/texto.ts`, este arquivo **não importa nada**: ele é
 * consumido pelo aplicativo (cliente e servidor) e pelo pipeline de ingestão,
 * que roda em Node com remoção de tipos e não resolve o alias `@/`. Duplicar as
 * três primitivas de normalização é mais barato do que um import que funciona
 * num lado e quebra no outro — e `__tests__/histopatologia/texto.test.ts` trava
 * a equivalência com o módulo da Histologia normal, de modo que uma divergência
 * silenciosa entre os dois módulos falha o teste em vez de quebrar a busca.
 *
 * Só existe aqui o que a patologia precisa a mais: tolerância a plural simples e
 * a expansão de sinônimos português/inglês **cadastrados**. Nada de tradução
 * automática — o plano proíbe traduzir títulos durante a busca.
 */

/** Remove diacríticos e caixa. "Necrose caseosa" → "necrose caseosa". */
export function semAcento(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/**
 * Chave de busca: sem acento, sem pontuação, espaços colapsados.
 *
 * A pontuação vira espaço (e não some) para que "H&E" resulte em "h e" e
 * "Ziehl-Neelsen/Fite" em "ziehl neelsen fite" — as duas grafias que o aluno
 * digita. Colar os tokens criaria casamentos dentro de outras palavras.
 */
export function chaveDeBusca(valor: string): string {
  return semAcento(valor)
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Slug de URL, com corte de comprimento em fronteira de palavra.
 *
 * Os títulos catalogados da Unicamp chegam a 180 caracteres (parágrafos
 * inteiros capturados como nome de página). Um slug derivado cegamente deles
 * produziria URLs impronunciáveis — motivo pelo qual o slug canônico de doença
 * é **escrito na camada editorial**, e este utilitário serve apenas ao
 * identificador de inventário.
 */
export function slugificar(valor: string, maximo = 72): string {
  const base = chaveDeBusca(valor).split(' ').join('-')
  if (base.length <= maximo) return base || 'item'
  return base.slice(0, maximo).replace(/-[^-]*$/, '') || base.slice(0, maximo)
}

/**
 * Radical de plural simples em português e inglês.
 *
 * Deliberadamente conservador: só "s" e "es" finais, e nunca abaixo de quatro
 * caracteres. Um stemmer agressivo colapsaria "mitose" e "mitos", "cisto" e
 * "cistos" com "cist" — e patologia é uma área onde uma letra separa duas
 * entidades diferentes.
 */
export function radical(termo: string): string {
  if (termo.length < 5) return termo
  if (termo.endsWith('oes')) return `${termo.slice(0, -3)}ao`
  if (termo.endsWith('aes')) return `${termo.slice(0, -3)}ao`
  if (termo.endsWith('ais')) return `${termo.slice(0, -3)}al`
  if (termo.endsWith('eis')) return `${termo.slice(0, -3)}el`
  if (termo.endsWith('ns')) return termo.slice(0, -1)
  if (termo.endsWith('es')) return termo.slice(0, -2)
  if (termo.endsWith('s')) return termo.slice(0, -1)
  return termo
}

/** Tokens únicos de um texto, na ordem de aparição. */
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
 * Chave de indexação: a chave de busca acrescida dos radicais dos termos.
 *
 * Indexar o radical junto do termo é o que faz "granulomas" encontrar
 * "granuloma" sem que a consulta precise adivinhar a flexão. O custo é alguns
 * bytes por entrada; a alternativa (stemming na consulta *e* no índice)
 * duplicaria a chance de os dois lados divergirem.
 */
export function chaveDeIndice(valor: string): string {
  const base = chaveDeBusca(valor)
  const extras: string[] = []
  for (const t of base.split(' ')) {
    if (!t) continue
    const r = radical(t)
    if (r !== t) extras.push(r)
  }
  return extras.length > 0 ? `${base} ${extras.join(' ')}` : base
}

/**
 * Torna slugs únicos dentro de um escopo, sufixando `-2`, `-3`…
 * A ordem de chegada é a ordem do catálogo, estável entre execuções — sem isso
 * as URLs mudariam a cada build.
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
 * Recorte de texto catalogado para exibição.
 *
 * Vários "nomes" do catálogo são parágrafos inteiros. Cortamos para exibir,
 * **sem alterar o dado**: o nome catalogado completo continua no fragmento e na
 * página de proveniência. Corta em fronteira de palavra e sinaliza com reticência.
 */
export function resumir(valor: string, maximo = 140): string {
  const limpo = valor.replace(/\s+/g, ' ').trim()
  if (limpo.length <= maximo) return limpo
  const corte = limpo.slice(0, maximo)
  const espaco = corte.lastIndexOf(' ')
  return `${(espaco > maximo * 0.6 ? corte.slice(0, espaco) : corte).trimEnd()}…`
}

/**
 * O título catalogado parece um nome de entidade, ou é prosa capturada da
 * página?
 *
 * Usado apenas para *rotular* a entrada no inventário ("título longo, extraído
 * do corpo da página"), nunca para descartá-la. Descartar seria perder
 * proveniência; rotular é honestidade sobre a qualidade do dado.
 */
export function pareceTituloDeEntidade(valor: string): boolean {
  const limpo = valor.trim()
  if (limpo.length > 90) return false
  if (limpo.split(/\s+/).length > 12) return false
  if (/[.;:]\s+\S/.test(limpo)) return false
  return true
}
