/**
 * Motor de recomendação de produtos (materiais e pacotes).
 *
 * "Quem estuda isto também leva…" nas páginas /materiais/[id] e
 * /pacotes/[id]. Código puro: recebe o catálogo e as cestas de compra já
 * carregadas (lib/recomendacoes/servidor.ts) e devolve uma lista ordenada.
 * Nada aqui fala com o banco — por isso dá para testar cada decisão.
 *
 * O PROBLEMA
 *
 * Um catálogo de algumas centenas de itens, com venda concentrada em poucos
 * deles: o item campeão tem centenas de compradores, o material lançado ontem
 * tem zero. Nenhum sinal sozinho serve para os dois:
 *
 *  - co-compra ("quem comprou X também comprou Y") é o sinal mais forte que
 *    existe — é comportamento real, não palpite —, mas é mudo para item novo
 *    e barulhento com pouca venda;
 *  - conteúdo (tags, título, pasta) funciona desde o primeiro dia, mas não sabe
 *    o que vende junto;
 *  - estrutura do catálogo (o pacote que contém este material) é a sugestão
 *    mais óbvia para o vendedor e a que a pessoa mais aceita;
 *  - popularidade só serve para preencher quando o resto não diz nada.
 *
 * A SOLUÇÃO: HÍBRIDO PONDERADO PELA CONFIANÇA
 *
 * 1. Filtragem colaborativa item-a-item (Amazon, 2003): similaridade de
 *    cosseno entre as colunas da matriz pessoa×item binária,
 *        cf(s, c) = co(s, c) / √(n(s)·n(c)),
 *    multiplicada por um encolhimento co/(co + λ) — dois compradores em comum
 *    não podem valer o mesmo que duzentos.
 *
 * 2. Conteúdo: TF-IDF sobre um saco de termos (tags pesam mais que palavras
 *    do título; pasta e módulo entram como termos próprios), comparado por
 *    cosseno. O IDF faz o termo raro ("valvopatias") pesar mais que o comum
 *    ("resumo"). O pacote herda, com meio peso, os termos dos materiais dele —
 *    é assim que pacote e material ficam comparáveis.
 *
 * 3. Estrutura: o pacote que contém o material da página; pacotes com
 *    materiais em comum (Jaccard); materiais irmãos no mesmo pacote.
 *
 * 4. Popularidade em log, para não deixar o campeão engolir tudo.
 *
 * Os pesos não são fixos: a confiança α = n(s)/(n(s) + k) no histórico de
 * vendas do item da página desloca o peso da co-compra para o conteúdo
 * quando há pouca venda — o item novo é recomendado pelo que ele É, o item
 * maduro pelo que as pessoas FAZEM.
 *
 * 5. Personalização (quando há sessão): o que a pessoa já tem sai da lista e
 *    vira semente secundária da co-compra — "combina com o que você já tem".
 *
 * 6. Diversidade por MMR (Maximal Marginal Relevance, Carbonell & Goldstein,
 *    1998): a lista é montada um item por vez, descontando a semelhança com o
 *    que já entrou. Duas mudanças sobre o MMR clássico: só conta como
 *    redundante a semelhança acima de `LIMIAR_REDUNDANCIA` (dois materiais de
 *    cardiologia de pastas diferentes não se repetem), e a redundância SOMA
 *    em vez de usar só a maior — o segundo "volume 2" do mesmo assunto ainda
 *    entra, o terceiro já perde para um vizinho relevante. Sem isso, oito
 *    materiais da mesma pasta ocupariam a prateleira inteira.
 *
 * Cada sugestão sai com o MOTIVO dominante, em português, para a pessoa saber
 * por que ela está ali.
 */

export type TipoDeItem = 'material' | 'package'

export interface ItemDoCatalogo {
  itemType: TipoDeItem
  itemId: string
  titulo: string
  tags: string[]
  folderId?: string | null
  moduloId?: string | null
  /** Tipo do material (pdf, video, flashcard_deck…). */
  tipo?: string | null
  /** Materiais do pacote. */
  materialIds?: string[]
  pago: boolean
  preco: number
  capa?: string | null
  destaque?: boolean
  /** Sinal de interesse fora da compra (downloads, visualizações). */
  interesse?: number
  /** Grupos que podem comprar. Vazio = todos. */
  grupos?: string[]
}

/** Itens (`material:<id>` / `package:<id>`) comprados por uma mesma pessoa. */
export type Cesta = string[]

export interface ModeloDeRecomendacao {
  itens: Map<string, ItemDoCatalogo>
  vetores: Map<string, Map<string, number>>
  /** Termos de tag de cada item, para escrever o motivo "Também sobre X". */
  tagsLegiveis: Map<string, Map<string, string>>
  compradores: Map<string, number>
  coCompra: Map<string, Map<string, number>>
  popularidade: Map<string, number>
  /** materialId → chaves dos pacotes que o contêm. */
  pacotesDoMaterial: Map<string, string[]>
}

export interface Recomendacao {
  itemType: TipoDeItem
  itemId: string
  titulo: string
  capa: string | null
  tipo: string | null
  pago: boolean
  preco: number
  motivo: string
  /** Quantos materiais o pacote tem (só pacote). */
  totalDeMateriais?: number
  pontuacao: number
}

export interface OpcoesDeRecomendacao {
  limite?: number
  /** Chaves que a pessoa já tem. */
  possuidos?: Set<string>
  /** Materiais que a pessoa já tem, direto ou por pacote. */
  materiaisPossuidos?: Set<string>
  /** Grupos da conta (accountType etc.). Sem sessão, vazio. */
  grupos?: string[]
  /** Itens já no carrinho ou que não devem aparecer por outro motivo. */
  excluir?: Set<string>
}

/* ───────────────────────── parâmetros ───────────────────────── */

/** Encolhimento da co-compra: com λ = 3, 3 compradores em comum valem metade. */
export const LAMBDA_ENCOLHIMENTO = 3
/** Vendas do item da página para a co-compra ganhar metade da confiança. */
export const K_CONFIANCA = 8
/** Cesta maior que isto é conta de teste/admin: diz pouco sobre afinidade. */
export const MAX_CESTA = 60
/** MMR: 1 = só relevância, 0 = só diversidade. */
export const LAMBDA_MMR = 0.7
/** Cosseno de conteúdo a partir do qual dois itens começam a se repetir. */
export const LIMIAR_REDUNDANCIA = 0.5
/** Peso das compras da pessoa ("combina com o que você já tem"). */
export const PESO_PESSOAL = 0.2
export const MAX_PACOTES_NA_LISTA = 3

const PESO_TAG = 2
const PESO_TITULO = 1
const PESO_PASTA = 1.5
const PESO_MODULO = 1.5
const PESO_TIPO = 0.4
const PESO_HERANCA_DO_PACOTE = 0.5

const PALAVRAS_VAZIAS = new Set([
  'a', 'o', 'as', 'os', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas', 'um', 'uma',
  'para', 'pra', 'por', 'com', 'sem', 'ao', 'aos', 'que', 'se', 'sua', 'seu', 'mais', 'muito',
  'material', 'materiais', 'pacote', 'pacotes', 'resumo', 'resumos', 'completo', 'completa', 'guia',
  'pdf', 'apostila', 'volume', 'vol', 'parte', 'modulo', 'aula', 'aulas', 'curso', 'novo', 'nova',
])

export function chaveDe(itemType: TipoDeItem, itemId: string) {
  return `${itemType}:${itemId}`
}

/** minúsculas, sem acento, só palavras com 3+ letras que digam algo. */
export function tokenizar(texto: string): string[] {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !/^\d+$/.test(t) && !PALAVRAS_VAZIAS.has(t))
}

function normalizarTag(tag: string) {
  return String(tag || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

/** Termos crus (antes do IDF) de um item, com peso. */
function termosDoItem(item: ItemDoCatalogo): Map<string, number> {
  const termos = new Map<string, number>()
  const somar = (termo: string, peso: number) => termos.set(termo, (termos.get(termo) || 0) + peso)
  for (const tag of item.tags || []) {
    const t = normalizarTag(tag)
    if (t) somar(`tag:${t}`, PESO_TAG)
  }
  for (const t of tokenizar(item.titulo)) somar(`w:${t}`, PESO_TITULO)
  if (item.folderId) somar(`pasta:${item.folderId}`, PESO_PASTA)
  if (item.moduloId) somar(`modulo:${item.moduloId}`, PESO_MODULO)
  if (item.tipo) somar(`tipo:${item.tipo}`, PESO_TIPO)
  return termos
}

function normalizarL2(vetor: Map<string, number>) {
  let soma = 0
  for (const v of vetor.values()) soma += v * v
  const norma = Math.sqrt(soma)
  if (norma === 0) return vetor
  for (const [k, v] of vetor) vetor.set(k, v / norma)
  return vetor
}

export function cosseno(a?: Map<string, number>, b?: Map<string, number>) {
  if (!a || !b || a.size === 0 || b.size === 0) return 0
  const [menor, maior] = a.size <= b.size ? [a, b] : [b, a]
  let soma = 0
  for (const [k, v] of menor) {
    const w = maior.get(k)
    if (w) soma += v * w
  }
  return soma
}

/* ───────────────────────── construção do modelo ───────────────────────── */

export function construirModelo(catalogo: ItemDoCatalogo[], cestas: Cesta[]): ModeloDeRecomendacao {
  const itens = new Map<string, ItemDoCatalogo>()
  for (const item of catalogo) itens.set(chaveDe(item.itemType, item.itemId), item)

  // Termos crus; o pacote herda os dos seus materiais com meio peso.
  const crus = new Map<string, Map<string, number>>()
  for (const [chave, item] of itens) crus.set(chave, termosDoItem(item))
  const pacotesDoMaterial = new Map<string, string[]>()
  for (const [chave, item] of itens) {
    if (item.itemType !== 'package') continue
    const termos = crus.get(chave)!
    for (const materialId of item.materialIds || []) {
      const lista = pacotesDoMaterial.get(materialId) || []
      lista.push(chave)
      pacotesDoMaterial.set(materialId, lista)
      const doMaterial = crus.get(chaveDe('material', materialId))
      if (!doMaterial) continue
      for (const [termo, peso] of doMaterial) {
        termos.set(termo, (termos.get(termo) || 0) + peso * PESO_HERANCA_DO_PACOTE)
      }
    }
  }

  // IDF suavizado: ln(1 + N/df).
  const df = new Map<string, number>()
  for (const termos of crus.values()) for (const termo of termos.keys()) df.set(termo, (df.get(termo) || 0) + 1)
  const n = Math.max(1, crus.size)
  const vetores = new Map<string, Map<string, number>>()
  const tagsLegiveis = new Map<string, Map<string, string>>()
  for (const [chave, termos] of crus) {
    const vetor = new Map<string, number>()
    for (const [termo, tf] of termos) vetor.set(termo, tf * Math.log(1 + n / (df.get(termo) || 1)))
    vetores.set(chave, normalizarL2(vetor))
    const legiveis = new Map<string, string>()
    for (const tag of itens.get(chave)!.tags || []) {
      const t = normalizarTag(tag)
      if (t) legiveis.set(`tag:${t}`, String(tag).trim())
    }
    tagsLegiveis.set(chave, legiveis)
  }

  // Co-compra só entre itens do catálogo, e sem as cestas gigantes.
  const compradores = new Map<string, number>()
  const coCompra = new Map<string, Map<string, number>>()
  for (const bruta of cestas) {
    const cesta = [...new Set(bruta)].filter((chave) => itens.has(chave))
    for (const chave of cesta) compradores.set(chave, (compradores.get(chave) || 0) + 1)
    if (cesta.length < 2 || cesta.length > MAX_CESTA) continue
    for (let i = 0; i < cesta.length; i++) {
      for (let j = i + 1; j < cesta.length; j++) {
        const a = cesta[i]
        const b = cesta[j]
        if (!coCompra.has(a)) coCompra.set(a, new Map())
        if (!coCompra.has(b)) coCompra.set(b, new Map())
        coCompra.get(a)!.set(b, (coCompra.get(a)!.get(b) || 0) + 1)
        coCompra.get(b)!.set(a, (coCompra.get(b)!.get(a) || 0) + 1)
      }
    }
  }

  // Popularidade em log, normalizada para 0..1.
  const bruta = new Map<string, number>()
  let maior = 0
  for (const [chave, item] of itens) {
    const valor = Math.log1p((compradores.get(chave) || 0) + Math.max(0, item.interesse || 0) / 50)
    bruta.set(chave, valor)
    if (valor > maior) maior = valor
  }
  const popularidade = new Map<string, number>()
  for (const [chave, valor] of bruta) popularidade.set(chave, maior > 0 ? valor / maior : 0)

  return { itens, vetores, tagsLegiveis, compradores, coCompra, popularidade, pacotesDoMaterial }
}

/* ───────────────────────── recomendação ───────────────────────── */

/** Cosseno item-a-item na matriz binária, com encolhimento por suporte. */
export function similaridadeDeCoCompra(modelo: ModeloDeRecomendacao, a: string, b: string) {
  const co = modelo.coCompra.get(a)?.get(b) || 0
  if (co === 0) return 0
  const na = modelo.compradores.get(a) || 0
  const nb = modelo.compradores.get(b) || 0
  if (na === 0 || nb === 0) return 0
  return (co / Math.sqrt(na * nb)) * (co / (co + LAMBDA_ENCOLHIMENTO))
}

function jaccard(a: string[] = [], b: string[] = []) {
  if (a.length === 0 || b.length === 0) return 0
  const sa = new Set(a)
  let inter = 0
  for (const x of new Set(b)) if (sa.has(x)) inter++
  return inter / (sa.size + new Set(b).size - inter)
}

type Contribuicao = 'coCompra' | 'pessoal' | 'conteudo' | 'contem' | 'emComum' | 'irmao' | 'popular'

interface Candidato {
  chave: string
  item: ItemDoCatalogo
  pontuacao: number
  dominante: Contribuicao
}

function podeComprar(item: ItemDoCatalogo, grupos: string[]) {
  const exigidos = item.grupos || []
  return exigidos.length === 0 || exigidos.some((g) => grupos.includes(g))
}

export function recomendar(
  modelo: ModeloDeRecomendacao,
  semente: string,
  opcoes: OpcoesDeRecomendacao = {}
): Recomendacao[] {
  const itemDaSemente = modelo.itens.get(semente)
  if (!itemDaSemente) return []

  const limite = Math.max(1, opcoes.limite ?? 8)
  const possuidos = opcoes.possuidos || new Set<string>()
  const materiaisPossuidos = opcoes.materiaisPossuidos || new Set<string>()
  const grupos = opcoes.grupos || []
  const excluir = opcoes.excluir || new Set<string>()

  const materiaisDaSemente = new Set(itemDaSemente.itemType === 'package' ? itemDaSemente.materialIds || [] : [])
  const pacotesDaSemente = new Set(
    itemDaSemente.itemType === 'material' ? modelo.pacotesDoMaterial.get(itemDaSemente.itemId) || [] : []
  )
  const irmaos = new Set<string>()
  for (const pacote of pacotesDaSemente) {
    for (const id of modelo.itens.get(pacote)?.materialIds || []) irmaos.add(id)
  }

  // Sementes pessoais: o que a pessoa já tem puxa o que costuma vir junto.
  const sementesPessoais = [...possuidos].filter((c) => c !== semente && modelo.compradores.has(c))

  // Pesos pela confiança no histórico do item da página; o pessoal tem peso
  // próprio (não some quando o item da página é novo). Normalizados para 1.
  const n = modelo.compradores.get(semente) || 0
  const alfa = n / (n + K_CONFIANCA)
  const brutosDosPesos = {
    coCompra: 0.45 * alfa,
    pessoal: sementesPessoais.length > 0 ? PESO_PESSOAL : 0,
    conteudo: 0.35 + 0.3 * (1 - alfa),
    estrutura: 0.15,
    popular: 0.05 + 0.15 * (1 - alfa),
  }
  const somaDosPesos = Object.values(brutosDosPesos).reduce((a, b) => a + b, 0)
  const pesos = Object.fromEntries(
    Object.entries(brutosDosPesos).map(([k, v]) => [k, v / somaDosPesos])
  ) as typeof brutosDosPesos

  const vetorDaSemente = modelo.vetores.get(semente)
  const brutos: Array<{ chave: string; item: ItemDoCatalogo; cf: number; pessoal: number; conteudo: number; estrutura: number; tipoEstrutura: Contribuicao | null; popular: number }> = []

  for (const [chave, item] of modelo.itens) {
    if (chave === semente || possuidos.has(chave) || excluir.has(chave)) continue
    if (!podeComprar(item, grupos)) continue
    if (item.itemType === 'material') {
      if (materiaisPossuidos.has(item.itemId)) continue
      // Já vem dentro do pacote da página.
      if (materiaisDaSemente.has(item.itemId)) continue
    } else {
      const materiais = item.materialIds || []
      // Pacote em que a pessoa já tem tudo não traz nada novo.
      if (materiais.length > 0 && materiais.every((id) => materiaisPossuidos.has(id))) continue
    }

    const cf = similaridadeDeCoCompra(modelo, semente, chave)
    // Média das similaridades com o que a pessoa tem: quem tem muita coisa
    // não ganha um sinal maior só por ter muita coisa.
    let pessoal = 0
    for (const s of sementesPessoais) pessoal += similaridadeDeCoCompra(modelo, s, chave)
    if (sementesPessoais.length > 0) pessoal /= sementesPessoais.length

    let estrutura = 0
    let tipoEstrutura: Contribuicao | null = null
    if (pacotesDaSemente.has(chave)) {
      estrutura = 1
      tipoEstrutura = 'contem'
    } else if (itemDaSemente.itemType === 'package' && item.itemType === 'package') {
      estrutura = jaccard(itemDaSemente.materialIds, item.materialIds)
      if (estrutura > 0) tipoEstrutura = 'emComum'
    } else if (item.itemType === 'material' && irmaos.has(item.itemId)) {
      estrutura = 0.5
      tipoEstrutura = 'irmao'
    }

    brutos.push({
      chave,
      item,
      cf,
      pessoal,
      conteudo: cosseno(vetorDaSemente, modelo.vetores.get(chave)),
      estrutura,
      tipoEstrutura,
      popular: modelo.popularidade.get(chave) || 0,
    })
  }
  if (brutos.length === 0) return []

  // A co-compra é relativa: a mais forte deste item vira 1 (idem a pessoal).
  const maiorCf = Math.max(...brutos.map((b) => b.cf))
  const maiorPessoal = Math.max(...brutos.map((b) => b.pessoal))
  const candidatos: Candidato[] = brutos.map((b) => {
    const parcelas: Array<[Contribuicao, number]> = [
      ['coCompra', maiorCf > 0 ? pesos.coCompra * (b.cf / maiorCf) : 0],
      ['pessoal', maiorPessoal > 0 ? pesos.pessoal * (b.pessoal / maiorPessoal) : 0],
      ['conteudo', pesos.conteudo * b.conteudo],
      [b.tipoEstrutura || 'irmao', pesos.estrutura * b.estrutura],
      ['popular', pesos.popular * b.popular],
    ]
    const pontuacao = parcelas.reduce((s, [, v]) => s + v, 0) + (b.item.destaque ? 0.01 : 0)
    // O motivo é o maior sinal específico; popularidade só fala quando é tudo
    // o que existe.
    const especificos = parcelas.filter(([tipo, v]) => tipo !== 'popular' && v > 0.02)
    const dominante = especificos.length > 0
      ? especificos.reduce((a, b) => (b[1] > a[1] ? b : a))[0]
      : 'popular'
    return { chave: b.chave, item: b.item, pontuacao, dominante }
  })

  // MMR: relevância (0..1) menos a redundância somada com o que já entrou.
  const restantes = candidatos.sort((a, b) => b.pontuacao - a.pontuacao).slice(0, limite * 6)
  const maiorPontuacao = restantes[0]?.pontuacao || 1
  const escolhidos: Candidato[] = []
  let pacotes = 0
  while (escolhidos.length < limite && restantes.length > 0) {
    let melhor = -1
    let melhorValor = -Infinity
    for (let i = 0; i < restantes.length; i++) {
      const c = restantes[i]
      if (c.item.itemType === 'package' && pacotes >= MAX_PACOTES_NA_LISTA) continue
      let redundancia = 0
      for (const e of escolhidos) {
        const parecido = cosseno(modelo.vetores.get(c.chave), modelo.vetores.get(e.chave))
        redundancia += Math.max(0, (parecido - LIMIAR_REDUNDANCIA) / (1 - LIMIAR_REDUNDANCIA))
      }
      const valor = LAMBDA_MMR * (c.pontuacao / maiorPontuacao) - (1 - LAMBDA_MMR) * redundancia
      if (valor > melhorValor) {
        melhorValor = valor
        melhor = i
      }
    }
    if (melhor < 0) break
    const [escolhido] = restantes.splice(melhor, 1)
    if (escolhido.item.itemType === 'package') pacotes++
    escolhidos.push(escolhido)
  }

  return escolhidos.map((c) => ({
    itemType: c.item.itemType,
    itemId: c.item.itemId,
    titulo: c.item.titulo,
    capa: c.item.capa || null,
    tipo: c.item.tipo || null,
    pago: c.item.pago,
    preco: c.item.preco,
    motivo: escreverMotivo(modelo, semente, c),
    ...(c.item.itemType === 'package' ? { totalDeMateriais: (c.item.materialIds || []).length } : {}),
    pontuacao: Math.round(c.pontuacao * 1000) / 1000,
  }))
}

/** A tag em comum de maior peso, para "Também sobre Cardiologia". */
function tagEmComum(modelo: ModeloDeRecomendacao, a: string, b: string): string | null {
  const va = modelo.vetores.get(a)
  const vb = modelo.vetores.get(b)
  const legiveis = modelo.tagsLegiveis.get(b)
  if (!va || !vb || !legiveis) return null
  let melhor: string | null = null
  let maior = 0
  for (const [termo, rotulo] of legiveis) {
    const peso = (va.get(termo) || 0) * (vb.get(termo) || 0)
    if (peso > maior) {
      maior = peso
      melhor = rotulo
    }
  }
  return melhor
}

function escreverMotivo(modelo: ModeloDeRecomendacao, semente: string, c: Candidato): string {
  switch (c.dominante) {
    case 'coCompra':
      return 'Quem comprou este também levou'
    case 'pessoal':
      return 'Combina com o que você já tem'
    case 'contem':
      return 'Inclui este material'
    case 'emComum':
      return 'Tem materiais em comum'
    case 'irmao':
      return 'Do mesmo pacote'
    case 'conteudo': {
      const tag = tagEmComum(modelo, semente, c.chave)
      return tag ? `Também sobre ${tag}` : 'Mesmo assunto'
    }
    default:
      return 'Mais procurado'
  }
}
