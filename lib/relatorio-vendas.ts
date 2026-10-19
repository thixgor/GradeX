/**
 * O histórico de vendas do PDF de /admin/analytics.
 *
 * O painel trabalha com os últimos 12 meses e no máximo 1000 pedidos, e
 * atribui um carrinho inteiro ao primeiro item dele. Isso serve para a tela,
 * mas não responde "qual material deu mais dinheiro desde o começo?" nem
 * "combo vende mais que avulso?". Este módulo lê o histórico INTEIRO e quebra
 * cada pedido nos itens que ele vendeu.
 *
 * Funções puras: a rota (`app/api/admin/analytics/relatorio`) busca os
 * documentos e entrega aqui; `scripts/analise-vendas-materiais.mjs` reusa o
 * rateio por item.
 *
 * ## Que valor é "receita" aqui
 *
 * O preço de tabela (`baseAmount`): o que a DomineAqui cobra pelo produto, sem
 * a taxa operacional que o checkout repassa ao comprador (essa vai inteira
 * para o Mercado Pago). Os cards do painel somam o valor cobrado, com a taxa —
 * por isso o resumo mostra os dois.
 */

import { FUSO_BRASILIA, relogioBrasilia } from './fuso-brasilia'

export interface PedidoDoHistorico {
  _id: unknown
  type: string
  refId?: string
  amount: number
  baseAmount?: number
  feeAmount?: number
  paidInstallments?: number
  paymentMethod?: string
  payerEmail?: string
  payerName?: string
  userId?: string
  metadata?: Record<string, any>
  paidAt?: Date | string
  createdAt?: Date | string
  updatedAt?: Date | string
}

/** Compra de material antiga (Stripe), anterior ao `payment_orders`. */
export interface CompraLegada {
  itemType: 'material' | 'package'
  itemId: string
  itemTitle?: string
  price: number
  userId?: string
  userEmail?: string
  userName?: string
  purchasedAt: Date | string
}

/** Cobrança de assinatura que existe só em `subscriptions` (mesma regra do painel). */
export interface CobrancaDeAssinatura {
  valor: number
  data: Date | string
  titulo: string
  userId?: string
  email?: string
  nome?: string
}

export interface ItemVendido {
  itemType: 'material' | 'package'
  itemId: string
  titulo: string
  versao: string
  valor: number
}

const centavos = (v: number) => Math.round((Number(v) || 0) * 100) / 100

/**
 * Preço para OUTRO SITE usar um material ou combo por 12 meses, sem
 * exclusividade (a DomineAqui continua vendendo).
 *
 * O outro site vende para o mesmo público: cada venda dele pode ser uma venda
 * nossa a menos. 1,5 × a receita anual do item cobre perder até tudo o que ele
 * faria no ano e deixa 50% por cima. Piso para item que vendeu pouco não sair
 * de graça — ainda custou para ser produzido. Arredonda para cima de R$ 100.
 */
export const LICENCA_MULTIPLO = 1.5
export const LICENCA_PISO = 1500

export function precoDaLicenca(receitaAnual: number) {
  return Math.max(LICENCA_PISO, Math.ceil((receitaAnual * LICENCA_MULTIPLO) / 100) * 100)
}

/** Pacote é combo por definição; material com "combo" no título também. */
export function ehCombo(item: { itemType: string; titulo?: string }) {
  return item.itemType === 'package' || /\bcombo\b/i.test(item.titulo || '')
}

/**
 * Os itens digitais que um pedido de material vendeu, com o valor de cada um.
 *
 * Três formatos de pedido: carrinho logado (`cartItems`), carrinho por serial
 * key (`serialKeyCart`, inclusive compra sem conta) e item único (`refId`). A
 * parte física do checkout unificado (`shopOrderId`) sai do valor antes do
 * rateio. Num carrinho, o valor do pedido se divide na proporção do preço de
 * cada item — cupom e desconto do carrinho caem em todos por igual — e o
 * último item leva o arredondamento, para a soma fechar no centavo.
 */
export function itensDoPedido(
  order: Pick<PedidoDoHistorico, 'refId' | 'amount' | 'baseAmount' | 'metadata'>,
  fisicoPorPedido: Map<string, number> = new Map()
): ItemVendido[] {
  const meta = order.metadata || {}
  const cobrado = centavos(order.baseAmount ?? order.amount)
  const fisico = meta.shopOrderId ? centavos(fisicoPorPedido.get(String(meta.shopOrderId)) || 0) : 0
  const digital = Math.max(0, centavos(cobrado - fisico))

  let linhas: Array<Omit<ItemVendido, 'valor'> & { tabela: number }> = []
  if (Array.isArray(meta.serialKeyCart) && meta.serialKeyCart.length > 0) {
    linhas = meta.serialKeyCart.map((i: any) => ({
      itemType: i?.grant?.itemType === 'package' ? 'package' : 'material',
      itemId: i?.grant?.itemId ? String(i.grant.itemId) : '',
      titulo: String(i?.grant?.itemTitle || i?.productTitle || ''),
      versao: String(i?.grant?.accessVersionLabel || ''),
      tabela: Number(i?.amount) || 0,
    }))
  } else if (Array.isArray(meta.cartItems) && meta.cartItems.length > 0) {
    linhas = meta.cartItems.map((i: any) => ({
      itemType: i?.itemType === 'package' ? 'package' : 'material',
      itemId: i?.itemId ? String(i.itemId) : '',
      titulo: String(i?.itemTitle || ''),
      versao: String(i?.accessVersionLabel || ''),
      tabela: Number(i?.price) || 0,
    }))
  } else if (order.refId) {
    linhas = [{
      itemType: meta.itemType === 'package' ? 'package' : 'material',
      itemId: String(order.refId),
      titulo: String(meta.itemTitle || ''),
      versao: String(meta.accessVersionLabel || ''),
      tabela: digital,
    }]
  }
  linhas = linhas.filter((l) => l.itemId)
  if (linhas.length === 0) return []

  const somaTabela = linhas.reduce((s, l) => s + l.tabela, 0)
  let restante = digital
  return linhas.map(({ tabela, ...l }, idx) => {
    const valor = idx === linhas.length - 1
      ? restante
      : centavos(somaTabela > 0 ? (digital * tabela) / somaTabela : digital / linhas.length)
    restante = centavos(restante - valor)
    return { ...l, valor }
  })
}

// ─── Relatório ──────────────────────────────────────────────────────────────

const ROTULO_DO_TIPO: Record<string, string> = {
  material: 'Materiais e combos',
  physical: 'Loja (impressos e frete)',
  plan: 'Planos (pagamento único)',
  subscription: 'Assinaturas recorrentes',
  product: 'Produtos digitais',
  raffle: 'Rifas',
  monitoria: 'Monitorias',
}

const ROTULO_DO_METODO: Record<string, string> = {
  pix: 'Pix',
  credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito',
  boleto: 'Boleto',
}

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const DIA_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const FAIXAS = [
  { rotulo: 'Madrugada (0h–6h)', ate: 6 },
  { rotulo: 'Manhã (6h–12h)', ate: 12 },
  { rotulo: 'Tarde (12h–18h)', ate: 18 },
  { rotulo: 'Noite (18h–24h)', ate: 24 },
]

const diaDaSemana = new Intl.DateTimeFormat('en-US', { timeZone: FUSO_BRASILIA, weekday: 'short' })

/** "AAAA-MM" no calendário de Brasília. */
export function mesEmBrasilia(instante: Date) {
  return relogioBrasilia(instante).dia.slice(0, 7)
}

function mesAnterior(mes: string) {
  const [a, m] = mes.split('-').map(Number)
  return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, '0')}`
}

function mesesEntre(de: string, ate: string) {
  const lista: string[] = []
  let atual = ate
  while (atual >= de && lista.length < 240) {
    lista.unshift(atual)
    atual = mesAnterior(atual)
  }
  return lista
}

export interface LinhaDeMes {
  mes: string
  receita: number
  pedidos: number
  ticketMedio: number
  compradores: number
  novosCompradores: number
  combos: number
  avulsos: number
  /** Variação da receita sobre o mês anterior, em %; null sem base. */
  variacao: number | null
  acumulado: number
}

export interface LinhaDeItem {
  itemType: 'material' | 'package'
  itemId: string
  titulo: string
  combo: boolean
  receita: number
  vendas: number
  compradores: number
  ticketMedio: number
  participacao: number
  receita12m: number
  /** Receita de 12 meses; item com menos de um ano de venda: média mensal × 12. */
  receitaAnual: number
  /** Ver `precoDaLicenca`. */
  licenca: number
  primeiraVenda: string
  ultimaVenda: string
}

export interface LinhaSimples {
  rotulo: string
  pedidos: number
  receita: number
  participacao: number
}

export interface RelatorioHistorico {
  geradoEm: string
  primeiraVenda: string | null
  ultimaVenda: string | null
  resumo: {
    receita: number
    totalCobrado: number
    taxaRepassada: number
    pedidos: number
    ticketMedio: number
    compradores: number
    compradoresRecorrentes: number
    taxaDeRecompra: number
    receitaPorComprador: number
    receita12m: number
    receitaMesAtual: number
    receitaMesAnterior: number
    mesesDeHistorico: number
    mediaMensal: number
    /** Receita de 12 meses; com menos de um ano de história, a média mensal × 12. */
    ritmoAnual: number
    melhorMes: { mes: string; receita: number } | null
    pedidosEstornados: number
    valorEstornado: number
    taxaDeEstorno: number
    pedidosCriados: number
    taxaDeAprovacao: number
  }
  meses: LinhaDeMes[]
  porTipo: LinhaSimples[]
  materiais: {
    receita: number
    vendas: number
    combos: { receita: number; vendas: number; itens: number }
    avulsos: { receita: number; vendas: number; itens: number }
    ranking: LinhaDeItem[]
  }
  pagamento: LinhaSimples[]
  parcelamento: { pedidosParcelados: number; mediaDeParcelas: number }
  origem: LinhaSimples[]
  diasDaSemana: LinhaSimples[]
  faixasHorarias: LinhaSimples[]
  melhoresClientes: Array<{ nome: string; email: string; pedidos: number; receita: number; ultimaCompra: string }>
}

interface Venda {
  data: Date
  /** "AAAA-MM" em Brasília, calculado uma vez. */
  mes: string
  valor: number
  tipo: string
  comprador: string
  nome: string
  email: string
  metodo: string
  parcelas: number
  origem: string
  pedido: string
}

export interface EntradaDoRelatorio {
  pedidos: PedidoDoHistorico[]
  comprasLegadas?: CompraLegada[]
  cobrancasDeAssinatura?: CobrancaDeAssinatura[]
  fisicoPorPedido?: Map<string, number>
  /** itemId → título atual do material ou pacote. */
  catalogo?: Map<string, string>
  /** Contagem por status de TODOS os pedidos (doação fora), para estorno e aprovação. */
  statusDosPedidos?: Array<{ status: string; pedidos: number; valor: number }>
  agora?: Date
}

const ESTORNADO = new Set(['refunded', 'charged_back'])

export function montarRelatorioHistorico(entrada: EntradaDoRelatorio): RelatorioHistorico {
  const agora = entrada.agora || new Date()
  const fisicoPorPedido = entrada.fisicoPorPedido || new Map()
  const catalogo = entrada.catalogo || new Map()
  const corte12m = new Date(agora)
  corte12m.setFullYear(corte12m.getFullYear() - 1)

  const vendas: Venda[] = []
  const itens: Array<ItemVendido & { data: Date; mes: string; comprador: string }> = []
  let totalCobrado = 0
  let taxaRepassada = 0

  for (const o of entrada.pedidos) {
    if (o.type === 'donation') continue
    const data = new Date((o.paidAt || o.updatedAt || o.createdAt) as any)
    if (Number.isNaN(data.getTime())) continue
    const meta = o.metadata || {}
    const email = String(o.payerEmail || meta.buyerEmail || '').toLowerCase().trim()
    const nome = String(o.payerName || meta.buyerName || '')
    const comprador = o.userId ? `u:${o.userId}` : email ? `e:${email}` : `p:${String(o._id)}`
    const base = centavos(o.baseAmount ?? o.amount)
    totalCobrado += Number(o.amount) || 0
    taxaRepassada += Number(o.feeAmount) || 0
    const mes = mesEmBrasilia(data)
    const comum = {
      data,
      mes,
      comprador,
      nome,
      email,
      metodo: o.paymentMethod || 'unknown',
      parcelas: Number(o.paidInstallments) || 1,
      origem: meta.serialKeyPurchase ? (o.userId ? 'Serial key (com conta)' : 'Serial key (sem conta)') : 'Conta logada',
      pedido: String(o._id),
    }

    if (o.type === 'material') {
      const fisico = meta.shopOrderId ? centavos(fisicoPorPedido.get(String(meta.shopOrderId)) || 0) : 0
      if (fisico > 0) vendas.push({ ...comum, valor: Math.min(fisico, base), tipo: 'physical' })
      vendas.push({ ...comum, valor: Math.max(0, centavos(base - fisico)), tipo: 'material' })
      for (const item of itensDoPedido(o, fisicoPorPedido)) {
        itens.push({ ...item, titulo: catalogo.get(item.itemId) || item.titulo, data, mes, comprador })
      }
    } else {
      vendas.push({ ...comum, valor: base, tipo: o.type })
    }
  }

  for (const c of entrada.comprasLegadas || []) {
    const data = new Date(c.purchasedAt as any)
    if (Number.isNaN(data.getTime())) continue
    const email = String(c.userEmail || '').toLowerCase().trim()
    const comprador = c.userId ? `u:${c.userId}` : `e:${email}`
    const valor = centavos(c.price)
    const mes = mesEmBrasilia(data)
    totalCobrado += valor
    vendas.push({ data, mes, valor, tipo: 'material', comprador, nome: c.userName || '', email, metodo: 'unknown', parcelas: 1, origem: 'Stripe (legado)', pedido: '' })
    itens.push({
      itemType: c.itemType === 'package' ? 'package' : 'material',
      itemId: String(c.itemId),
      titulo: catalogo.get(String(c.itemId)) || c.itemTitle || '',
      versao: '',
      valor,
      data,
      mes,
      comprador,
    })
  }

  for (const c of entrada.cobrancasDeAssinatura || []) {
    const data = new Date(c.data as any)
    if (Number.isNaN(data.getTime())) continue
    const email = String(c.email || '').toLowerCase().trim()
    const valor = centavos(c.valor)
    totalCobrado += valor
    vendas.push({
      data, mes: mesEmBrasilia(data), valor, tipo: 'subscription', comprador: c.userId ? `u:${c.userId}` : `e:${email}`,
      nome: c.nome || '', email, metodo: 'credit_card', parcelas: 1, origem: 'Assinatura recorrente', pedido: '',
    })
  }

  vendas.sort((a, b) => a.data.getTime() - b.data.getTime())
  // Um pedido de material com parte física vira duas vendas (tipos diferentes),
  // mas continua sendo UM pedido para contagem, ticket e forma de pagamento.
  const pedidosUnicos = new Map<string, Venda & { total: number }>()
  for (const v of vendas) {
    const chave = v.pedido || `${v.comprador}:${v.data.getTime()}:${v.tipo}`
    const atual = pedidosUnicos.get(chave)
    if (atual) atual.total = centavos(atual.total + v.valor)
    else pedidosUnicos.set(chave, { ...v, total: v.valor })
  }
  const pedidos = [...pedidosUnicos.values()]

  const receita = centavos(vendas.reduce((s, v) => s + v.valor, 0))
  const pct = (v: number, total = receita) => (total > 0 ? (v / total) * 100 : 0)

  // ── Mês a mês, sem buracos ────────────────────────────────────────────────
  const mesAtual = mesEmBrasilia(agora)
  const primeiroMes = vendas.length ? vendas[0].mes : mesAtual
  const jaComprou = new Set<string>()
  let acumulado = 0
  let anterior: number | null = null
  const meses: LinhaDeMes[] = mesesEntre(primeiroMes, mesAtual).map((mes) => {
    const doMes = vendas.filter((v) => v.mes === mes)
    const pedidosDoMes = pedidos.filter((p) => p.mes === mes)
    const itensDoMes = itens.filter((i) => i.mes === mes)
    const compradores = new Set(pedidosDoMes.map((p) => p.comprador))
    let novos = 0
    for (const c of compradores) {
      if (!jaComprou.has(c)) {
        novos += 1
        jaComprou.add(c)
      }
    }
    const rec = centavos(doMes.reduce((s, v) => s + v.valor, 0))
    acumulado = centavos(acumulado + rec)
    const combos = centavos(itensDoMes.filter((i) => ehCombo(i)).reduce((s, i) => s + i.valor, 0))
    const avulsos = centavos(itensDoMes.filter((i) => !ehCombo(i)).reduce((s, i) => s + i.valor, 0))
    const linha: LinhaDeMes = {
      mes,
      receita: rec,
      pedidos: pedidosDoMes.length,
      ticketMedio: pedidosDoMes.length ? centavos(rec / pedidosDoMes.length) : 0,
      compradores: compradores.size,
      novosCompradores: novos,
      combos,
      avulsos,
      variacao: anterior ? ((rec - anterior) / anterior) * 100 : null,
      acumulado,
    }
    anterior = rec
    return linha
  })

  // ── Agrupamentos simples ──────────────────────────────────────────────────
  const agrupar = (lista: Array<{ chave: string; valor: number }>, rotulo: (k: string) => string, ordem?: string[]) => {
    const mapa = new Map<string, { pedidos: number; receita: number }>()
    for (const k of ordem || []) mapa.set(k, { pedidos: 0, receita: 0 })
    for (const { chave, valor } of lista) {
      const atual = mapa.get(chave) || { pedidos: 0, receita: 0 }
      atual.pedidos += 1
      atual.receita = centavos(atual.receita + valor)
      mapa.set(chave, atual)
    }
    const linhas = [...mapa.entries()].map(([k, v]) => ({ rotulo: rotulo(k), ...v, participacao: pct(v.receita) }))
    return ordem ? linhas : linhas.sort((a, b) => b.receita - a.receita)
  }

  const porTipo = agrupar(vendas.map((v) => ({ chave: v.tipo, valor: v.valor })), (k) => ROTULO_DO_TIPO[k] || k)
  const pagamento = agrupar(pedidos.map((p) => ({ chave: p.metodo, valor: p.total })), (k) => ROTULO_DO_METODO[k] || 'Não informado')
  const origem = agrupar(pedidos.map((p) => ({ chave: p.origem, valor: p.total })), (k) => k)
  const diasDaSemana = agrupar(
    pedidos.map((p) => ({ chave: String(DIA_EN.indexOf(diaDaSemana.format(p.data))), valor: p.total })),
    (k) => DIAS[Number(k)] || '—',
    ['0', '1', '2', '3', '4', '5', '6']
  )
  const faixasHorarias = agrupar(
    pedidos.map((p) => {
      const hora = Math.floor(relogioBrasilia(p.data).minutos / 60)
      return { chave: String(FAIXAS.findIndex((f) => hora < f.ate)), valor: p.total }
    }),
    (k) => FAIXAS[Number(k)]?.rotulo || '—',
    FAIXAS.map((_, i) => String(i))
  )
  const parcelados = pedidos.filter((p) => p.parcelas > 1)

  // ── Materiais e combos, item a item ───────────────────────────────────────
  const porItem = new Map<string, LinhaDeItem & { quem: Set<string>; primeira: Date; ultima: Date }>()
  for (const i of itens) {
    const chave = `${i.itemType}:${i.itemId}`
    let a = porItem.get(chave)
    if (!a) {
      a = {
        itemType: i.itemType,
        itemId: i.itemId,
        titulo: i.titulo || '(sem título)',
        combo: ehCombo(i),
        receita: 0,
        vendas: 0,
        compradores: 0,
        ticketMedio: 0,
        participacao: 0,
        receita12m: 0,
        receitaAnual: 0,
        licenca: 0,
        primeiraVenda: '',
        ultimaVenda: '',
        quem: new Set(),
        primeira: i.data,
        ultima: i.data,
      }
      porItem.set(chave, a)
    }
    a.receita = centavos(a.receita + i.valor)
    a.vendas += 1
    a.quem.add(i.comprador)
    if (i.data >= corte12m) a.receita12m = centavos(a.receita12m + i.valor)
    if (i.data < a.primeira) a.primeira = i.data
    if (i.data > a.ultima) a.ultima = i.data
  }
  const receitaDeMateriais = centavos(itens.reduce((s, i) => s + i.valor, 0))
  const ranking: LinhaDeItem[] = [...porItem.values()]
    .map(({ quem, primeira, ultima, ...a }) => {
      const mesesDoItem = Math.max(1, (agora.getTime() - primeira.getTime()) / (30.44 * 86_400_000))
      const receitaAnual = mesesDoItem >= 12 ? a.receita12m : centavos((a.receita / mesesDoItem) * 12)
      return {
        ...a,
        receitaAnual,
        licenca: precoDaLicenca(receitaAnual),
        compradores: quem.size,
        ticketMedio: a.vendas ? centavos(a.receita / a.vendas) : 0,
        participacao: pct(a.receita, receitaDeMateriais),
        primeiraVenda: primeira.toISOString(),
        ultimaVenda: ultima.toISOString(),
      }
    })
    .sort((x, y) => y.receita - x.receita)
  const resumoDe = (lista: LinhaDeItem[]) => ({
    receita: centavos(lista.reduce((s, i) => s + i.receita, 0)),
    vendas: lista.reduce((s, i) => s + i.vendas, 0),
    itens: lista.length,
  })

  // ── Clientes ──────────────────────────────────────────────────────────────
  const porCliente = new Map<string, { nome: string; email: string; pedidos: number; receita: number; ultima: Date }>()
  for (const p of pedidos) {
    const c = porCliente.get(p.comprador) || { nome: p.nome, email: p.email, pedidos: 0, receita: 0, ultima: p.data }
    c.pedidos += 1
    c.receita = centavos(c.receita + p.total)
    if (p.data >= c.ultima) {
      c.ultima = p.data
      c.nome = p.nome || c.nome
      c.email = p.email || c.email
    }
    porCliente.set(p.comprador, c)
  }
  const clientes = [...porCliente.values()]
  const recorrentes = clientes.filter((c) => c.pedidos > 1).length

  // ── Resumo ────────────────────────────────────────────────────────────────
  const receita12m = centavos(vendas.filter((v) => v.data >= corte12m).reduce((s, v) => s + v.valor, 0))
  const mesesDeHistorico = vendas.length
    ? Math.max(1, (agora.getTime() - vendas[0].data.getTime()) / (30.44 * 86_400_000))
    : 0
  const melhorMes = meses.reduce<LinhaDeMes | null>((m, l) => (l.receita > (m?.receita || 0) ? l : m), null)
  const status = entrada.statusDosPedidos || []
  const estornados = status.filter((s) => ESTORNADO.has(s.status))
  const pedidosEstornados = estornados.reduce((s, e) => s + e.pedidos, 0)
  const pedidosCriados = status.reduce((s, e) => s + e.pedidos, 0)
  const aprovados = status.find((s) => s.status === 'approved')?.pedidos || 0

  return {
    geradoEm: agora.toISOString(),
    primeiraVenda: vendas.length ? vendas[0].data.toISOString() : null,
    ultimaVenda: vendas.length ? vendas[vendas.length - 1].data.toISOString() : null,
    resumo: {
      receita,
      totalCobrado: centavos(totalCobrado),
      taxaRepassada: centavos(taxaRepassada),
      pedidos: pedidos.length,
      ticketMedio: pedidos.length ? centavos(receita / pedidos.length) : 0,
      compradores: clientes.length,
      compradoresRecorrentes: recorrentes,
      taxaDeRecompra: clientes.length ? (recorrentes / clientes.length) * 100 : 0,
      receitaPorComprador: clientes.length ? centavos(receita / clientes.length) : 0,
      receita12m,
      receitaMesAtual: meses.find((m) => m.mes === mesAtual)?.receita || 0,
      receitaMesAnterior: meses.find((m) => m.mes === mesAnterior(mesAtual))?.receita || 0,
      mesesDeHistorico: Math.round(mesesDeHistorico * 10) / 10,
      mediaMensal: mesesDeHistorico ? centavos(receita / mesesDeHistorico) : 0,
      ritmoAnual: mesesDeHistorico >= 12 ? receita12m : mesesDeHistorico ? centavos((receita / mesesDeHistorico) * 12) : 0,
      melhorMes: melhorMes ? { mes: melhorMes.mes, receita: melhorMes.receita } : null,
      pedidosEstornados,
      valorEstornado: centavos(estornados.reduce((s, e) => s + e.valor, 0)),
      taxaDeEstorno: aprovados + pedidosEstornados > 0 ? (pedidosEstornados / (aprovados + pedidosEstornados)) * 100 : 0,
      pedidosCriados,
      taxaDeAprovacao: pedidosCriados > 0 ? (aprovados / pedidosCriados) * 100 : 0,
    },
    meses,
    porTipo,
    materiais: {
      receita: receitaDeMateriais,
      vendas: itens.length,
      combos: resumoDe(ranking.filter((i) => i.combo)),
      avulsos: resumoDe(ranking.filter((i) => !i.combo)),
      ranking,
    },
    pagamento,
    parcelamento: {
      pedidosParcelados: parcelados.length,
      mediaDeParcelas: parcelados.length ? Math.round((parcelados.reduce((s, p) => s + p.parcelas, 0) / parcelados.length) * 10) / 10 : 1,
    },
    origem,
    diasDaSemana,
    faixasHorarias,
    melhoresClientes: clientes
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 15)
      .map((c) => ({ nome: c.nome, email: c.email, pedidos: c.pedidos, receita: c.receita, ultimaCompra: c.ultima.toISOString() })),
  }
}
