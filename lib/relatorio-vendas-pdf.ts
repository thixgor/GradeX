/**
 * O PDF "Analytics" de /admin/analytics, montado no navegador com jsPDF.
 *
 * Junta duas fontes: o que o painel já carregou (cards, assinaturas, funil,
 * cupons, pedidos filtrados na tela) e o histórico completo de
 * `/api/admin/analytics/relatorio` (mês a mês desde a primeira venda, cada
 * material e combo, pagamento, horários, clientes).
 *
 * Fonte padrão do jsPDF (Helvetica, WinAnsi): acentos, "·", "–" e "—" saem
 * certos; símbolos fora dessa tabela (≈, →, emoji) não. Mantenha o texto nela.
 */

import { LICENCA_MULTIPLO, LICENCA_PISO, type RelatorioHistorico, type LinhaSimples } from './relatorio-vendas'

/** O pedaço do payload de /api/admin/analytics que o PDF usa. */
export interface DadosDoPainel {
  cards: {
    totalRevenue: number
    monthRevenue: number
    weekRevenue: number
    totalSales: number
    activeSubscriptions: number
    cancellations: number
    cancellationRate: number
    pendingOrders: number
    abandonedCheckouts: number
    topProduct: string
    topPlan: string
  }
  donationSummary: { totalApproved: number; platformTotal: number; bankAppTotal: number; approvedCount: number }
  subscriptionSummary: {
    active: number
    expiring7: number
    expiring30: number
    cancelled: number
    cancellationRate: number
    estimatedRecurringRevenue: number
    renewing: number
    cancelledStillActive: number
  }
  planRevenueSplit: { recurring: { count: number; revenue: number }; oneTime: { count: number; revenue: number } }
  funnel: Array<{ label: string; count: number; conversionFromPrevious: number; conversionFromStart: number }>
  funnelFailed: number
  couponStats: Array<{ code: string; uses: number; uniqueUsers: number; revenueAttributed: number; discountGiven: number }>
  abandoned: Array<{ userName: string; userEmail: string; product: string; value: number; startedAt: string | null }>
}

export interface PedidoDaTela {
  userName: string
  userEmail: string
  product: string
  productType: string
  value: number
  status: string
  paymentMethod: string
  createdAt: string | null
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const inteiro = new Intl.NumberFormat('pt-BR')
const dinheiro = (v: number) => brl.format(v || 0)
const num = (v: number) => inteiro.format(v || 0)
const pct = (v: number | null) => (v === null || !Number.isFinite(v) ? '—' : `${v.toFixed(1).replace('.', ',')}%`)
const variacao = (v: number | null) => (v === null || !Number.isFinite(v) ? '—' : `${v > 0 ? '+' : ''}${pct(v)}`)
const data = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'
const dataHora = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'
const NOMES_DOS_MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const mes = (chave: string) => {
  const [a, m] = chave.split('-').map(Number)
  return `${NOMES_DOS_MESES[m - 1]}/${String(a).slice(2)}`
}

const VERDE: [number, number, number] = [4, 120, 87]
const OURO: [number, number, number] = [180, 83, 9]
const TINTA: [number, number, number] = [15, 23, 42]
const CINZA: [number, number, number] = [100, 116, 139]
const LINHA: [number, number, number] = [226, 232, 240]
const ZEBRA: [number, number, number] = [248, 250, 252]

const LARGURA = 210
const MARGEM = 14
const UTIL = LARGURA - MARGEM * 2
const TOPO = 18
const LIMITE = 282

type Coluna = { titulo: string; largura: number; direita?: boolean }

export async function gerarPdfDoAnalytics(
  painel: DadosDoPainel,
  historico: RelatorioHistorico,
  pedidosDaTela: PedidoDaTela[],
  filtrosAtivos: boolean
) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = 0

  const cor = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2])
  const novaPagina = () => {
    doc.addPage()
    y = TOPO
  }
  const espaco = (altura: number) => {
    if (y + altura > LIMITE) novaPagina()
  }
  const caber = (texto: string, largura: number) => {
    let t = String(texto ?? '')
    if (doc.getTextWidth(t) <= largura) return t
    while (t.length > 1 && doc.getTextWidth(`${t}…`) > largura) t = t.slice(0, -1)
    return `${t}…`
  }

  const secao = (titulo: string, subtitulo?: string) => {
    espaco(subtitulo ? 22 : 16)
    y += 4
    doc.setFillColor(VERDE[0], VERDE[1], VERDE[2])
    doc.rect(MARGEM, y - 4.5, 1.6, 6, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    cor(VERDE)
    doc.text(titulo, MARGEM + 4, y)
    y += 5
    if (subtitulo) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      cor(CINZA)
      const linhas = doc.splitTextToSize(subtitulo, UTIL)
      doc.text(linhas, MARGEM, y)
      y += linhas.length * 3.6
    }
    y += 2
  }

  const paragrafo = (texto: string, tamanho = 9) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(tamanho)
    cor(TINTA)
    const linhas = doc.splitTextToSize(texto, UTIL)
    for (const l of linhas) {
      espaco(5)
      doc.text(l, MARGEM, y)
      y += tamanho * 0.45
    }
    y += 1.5
  }

  /** Grade de indicadores, 3 por linha. */
  const indicadores = (itens: Array<[string, string, string?]>) => {
    const larg = (UTIL - 8) / 3
    const alt = 17
    itens.forEach(([rotulo, valor, dica], i) => {
      const col = i % 3
      if (col === 0) {
        if (i > 0) y += alt + 3
        espaco(alt + 2)
      }
      const x = MARGEM + col * (larg + 4)
      doc.setDrawColor(LINHA[0], LINHA[1], LINHA[2])
      doc.roundedRect(x, y, larg, alt, 1.5, 1.5)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      cor(CINZA)
      doc.text(caber(rotulo, larg - 6), x + 3, y + 5)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11.5)
      cor(TINTA)
      doc.text(caber(valor, larg - 6), x + 3, y + 10.5)
      if (dica) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6.5)
        cor(CINZA)
        doc.text(caber(dica, larg - 6), x + 3, y + 14.5)
      }
    })
    y += alt + 6
  }

  /** Tabela com cabeçalho repetido a cada página. Larguras somam até UTIL. */
  const tabela = (colunas: Coluna[], linhas: string[][], opcoes: { total?: string[]; tamanho?: number } = {}) => {
    const tamanho = opcoes.tamanho ?? 7.5
    const altLinha = tamanho * 0.62
    const fator = UTIL / colunas.reduce((s, c) => s + c.largura, 0)
    const cols = colunas.map((c) => ({ ...c, largura: c.largura * fator }))
    const cabecalho = () => {
      doc.setFillColor(VERDE[0], VERDE[1], VERDE[2])
      doc.rect(MARGEM, y, UTIL, altLinha + 1.5, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(tamanho)
      doc.setTextColor(255, 255, 255)
      let x = MARGEM
      for (const c of cols) {
        const t = caber(c.titulo, c.largura - 2.4)
        doc.text(t, c.direita ? x + c.largura - 1.2 : x + 1.2, y + altLinha - 0.2, { align: c.direita ? 'right' : 'left' })
        x += c.largura
      }
      y += altLinha + 1.5
    }
    const linha = (celulas: string[], idx: number, negrito = false) => {
      if (y + altLinha + 1 > LIMITE) {
        novaPagina()
        cabecalho()
      }
      if (negrito) {
        doc.setFillColor(236, 253, 245)
        doc.rect(MARGEM, y, UTIL, altLinha + 1, 'F')
      } else if (idx % 2 === 1) {
        doc.setFillColor(ZEBRA[0], ZEBRA[1], ZEBRA[2])
        doc.rect(MARGEM, y, UTIL, altLinha + 1, 'F')
      }
      doc.setFont('helvetica', negrito ? 'bold' : 'normal')
      doc.setFontSize(tamanho)
      cor(TINTA)
      let x = MARGEM
      cols.forEach((c, i) => {
        const t = caber(celulas[i] ?? '', c.largura - 2.4)
        doc.text(t, c.direita ? x + c.largura - 1.2 : x + 1.2, y + altLinha - 0.4, { align: c.direita ? 'right' : 'left' })
        x += c.largura
      })
      y += altLinha + 1
    }
    espaco(altLinha * 3 + 4)
    cabecalho()
    if (linhas.length === 0) {
      linha(['Sem dados no período.'], 0)
    }
    linhas.forEach((l, i) => linha(l, i))
    if (opcoes.total) linha(opcoes.total, 0, true)
    y += 4
  }

  /** Barras horizontais com rótulo e valor. */
  const barras = (
    serie: Array<{ rotulo: string; valor: number }>,
    formato: (v: number) => string,
    cores = VERDE,
    larguraRotulo = 20
  ) => {
    const max = Math.max(...serie.map((s) => s.valor), 1)
    const larguraBarra = UTIL - larguraRotulo - 2 - 30
    for (const s of serie) {
      espaco(6)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      cor(CINZA)
      doc.text(caber(s.rotulo, larguraRotulo), MARGEM, y + 3)
      doc.setFillColor(LINHA[0], LINHA[1], LINHA[2])
      doc.rect(MARGEM + larguraRotulo + 2, y, larguraBarra, 3.6, 'F')
      doc.setFillColor(cores[0], cores[1], cores[2])
      doc.rect(MARGEM + larguraRotulo + 2, y, Math.max(0.4, (s.valor / max) * larguraBarra), 3.6, 'F')
      cor(TINTA)
      doc.text(formato(s.valor), LARGURA - MARGEM, y + 3, { align: 'right' })
      y += 5.4
    }
    y += 3
  }

  const tabelaSimples = (titulo: string, linhas: LinhaSimples[]) =>
    tabela(
      [{ titulo, largura: 70 }, { titulo: 'Pedidos', largura: 25, direita: true }, { titulo: 'Receita', largura: 40, direita: true }, { titulo: '% da receita', largura: 30, direita: true }],
      linhas.map((l) => [l.rotulo, num(l.pedidos), dinheiro(l.receita), pct(l.participacao)])
    )

  const r = historico.resumo
  const mat = historico.materiais

  // ── Capa ──────────────────────────────────────────────────────────────────
  doc.setFillColor(VERDE[0], VERDE[1], VERDE[2])
  doc.rect(0, 0, LARGURA, 38, 'F')
  doc.setFillColor(OURO[0], OURO[1], OURO[2])
  doc.rect(0, 38, LARGURA, 1.4, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(19)
  doc.text('DomineAqui Analytics', MARGEM, 16)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Relatório completo de vendas, materiais, clientes e assinaturas', MARGEM, 24)
  doc.setFontSize(8.5)
  doc.text(
    `Gerado em ${dataHora(historico.geradoEm)} (Brasília) · histórico de ${data(historico.primeiraVenda)} a ${data(historico.ultimaVenda)}`,
    MARGEM,
    31
  )
  y = 48

  // ── 1. Resumo executivo ───────────────────────────────────────────────────
  secao('Resumo executivo', 'Histórico completo, desde a primeira venda. Receita = preço de tabela, sem a taxa operacional repassada ao comprador e sem doações. Pedidos estornados ficam de fora.')
  const comboVsAvulso = mat.receita > 0
    ? `Combos responderam por ${pct((mat.combos.receita / mat.receita) * 100)} da receita de materiais e materiais avulsos por ${pct((mat.avulsos.receita / mat.receita) * 100)}.`
    : ''
  const campeao = mat.ranking[0]
  paragrafo(
    [
      `A DomineAqui faturou ${dinheiro(r.receita)} em ${num(r.pedidos)} pedidos de ${num(r.compradores)} compradores, em ${String(r.mesesDeHistorico).replace('.', ',')} meses de vendas (média de ${dinheiro(r.mediaMensal)} por mês; ritmo anual de ${dinheiro(r.ritmoAnual)}).`,
      r.melhorMes ? `O melhor mês foi ${mes(r.melhorMes.mes)}, com ${dinheiro(r.melhorMes.receita)}.` : '',
      campeao ? `O item que mais faturou foi "${campeao.titulo}" (${campeao.combo ? 'combo' : 'material avulso'}): ${dinheiro(campeao.receita)} em ${num(campeao.vendas)} vendas, ${pct(campeao.participacao)} da receita de materiais.` : '',
      comboVsAvulso,
      `${pct(r.taxaDeRecompra)} dos compradores voltaram a comprar.`,
    ].filter(Boolean).join(' ')
  )
  indicadores([
    ['Receita histórica', dinheiro(r.receita), `${dinheiro(r.totalCobrado)} cobrados com taxa`],
    ['Receita nos últimos 12 meses', dinheiro(r.receita12m)],
    ['Ritmo anual', dinheiro(r.ritmoAnual), r.mesesDeHistorico < 12 ? 'média mensal × 12' : 'últimos 12 meses'],
    ['Mês atual', dinheiro(r.receitaMesAtual), `mês anterior: ${dinheiro(r.receitaMesAnterior)}`],
    ['Média mensal', dinheiro(r.mediaMensal)],
    ['Melhor mês', r.melhorMes ? dinheiro(r.melhorMes.receita) : '—', r.melhorMes ? mes(r.melhorMes.mes) : undefined],
    ['Pedidos pagos', num(r.pedidos)],
    ['Ticket médio', dinheiro(r.ticketMedio)],
    ['Compradores únicos', num(r.compradores)],
    ['Compraram mais de uma vez', num(r.compradoresRecorrentes), `taxa de recompra ${pct(r.taxaDeRecompra)}`],
    ['Receita por comprador', dinheiro(r.receitaPorComprador)],
    ['Taxa repassada ao comprador', dinheiro(r.taxaRepassada), 'vai para o Mercado Pago'],
    ['Pedidos criados', num(r.pedidosCriados), `${pct(r.taxaDeAprovacao)} aprovados`],
    ['Estornos e chargebacks', num(r.pedidosEstornados), `${dinheiro(r.valorEstornado)} · ${pct(r.taxaDeEstorno)} dos pagos`],
    ['Doações aprovadas', dinheiro(painel.donationSummary.totalApproved), `${num(painel.donationSummary.approvedCount)} doações (fora da receita)`],
  ])

  // ── 2. Histórico mensal ───────────────────────────────────────────────────
  secao('Histórico mês a mês', 'Todos os meses desde a primeira venda, inclusive os sem venda. "Novos" = compradores que compraram pela primeira vez naquele mês.')
  barras(historico.meses.map((m) => ({ rotulo: mes(m.mes), valor: m.receita })), dinheiro)
  tabela(
    [
      { titulo: 'Mês', largura: 15 },
      { titulo: 'Receita', largura: 24, direita: true },
      { titulo: 'Var.', largura: 15, direita: true },
      { titulo: 'Pedidos', largura: 14, direita: true },
      { titulo: 'Ticket', largura: 19, direita: true },
      { titulo: 'Compradores', largura: 19, direita: true },
      { titulo: 'Novos', largura: 12, direita: true },
      { titulo: 'Combos', largura: 21, direita: true },
      { titulo: 'Avulsos', largura: 21, direita: true },
      { titulo: 'Acumulado', largura: 25, direita: true },
    ],
    historico.meses.map((m) => [
      mes(m.mes), dinheiro(m.receita), variacao(m.variacao), num(m.pedidos), dinheiro(m.ticketMedio),
      num(m.compradores), num(m.novosCompradores), dinheiro(m.combos), dinheiro(m.avulsos), dinheiro(m.acumulado),
    ]),
    {
      tamanho: 7,
      total: ['Total', dinheiro(r.receita), '', num(r.pedidos), dinheiro(r.ticketMedio), num(r.compradores), num(r.compradores), dinheiro(mat.combos.receita), dinheiro(mat.avulsos.receita), ''],
    }
  )

  // ── 3. Receita por tipo ───────────────────────────────────────────────────
  secao('Receita por tipo de produto', 'No checkout unificado, a parte impressa (e o frete) conta como Loja e o restante como material.')
  tabelaSimples('Tipo', historico.porTipo)

  // ── 4. Materiais e combos ─────────────────────────────────────────────────
  secao(
    'Materiais e combos — o que mais deu dinheiro',
    'Cada pedido é quebrado nos itens que vendeu; num carrinho, o valor pago se divide na proporção do preço de cada item. Combo = pacote, ou material com "combo" no nome.'
  )
  indicadores([
    ['Receita de materiais', dinheiro(mat.receita), `${num(mat.vendas)} itens vendidos`],
    ['Combos', dinheiro(mat.combos.receita), `${num(mat.combos.vendas)} vendas · ${num(mat.combos.itens)} combos · ${pct(mat.receita ? (mat.combos.receita / mat.receita) * 100 : 0)}`],
    ['Materiais avulsos', dinheiro(mat.avulsos.receita), `${num(mat.avulsos.vendas)} vendas · ${num(mat.avulsos.itens)} materiais · ${pct(mat.receita ? (mat.avulsos.receita / mat.receita) * 100 : 0)}`],
  ])
  barras(mat.ranking.slice(0, 10).map((i) => ({ rotulo: `${i.combo ? '[combo] ' : ''}${i.titulo}`, valor: i.receita })), dinheiro, OURO, 72)
  tabela(
    [
      { titulo: '#', largura: 6, direita: true },
      { titulo: 'Item', largura: 55 },
      { titulo: 'Tipo', largura: 12 },
      { titulo: 'Receita', largura: 21, direita: true },
      { titulo: '%', largura: 11, direita: true },
      { titulo: 'Vendas', largura: 12, direita: true },
      { titulo: 'Ticket', largura: 17, direita: true },
      { titulo: 'Por ano', largura: 21, direita: true },
      { titulo: 'Licença', largura: 21, direita: true },
      { titulo: 'Última', largura: 15 },
    ],
    mat.ranking.map((i, idx) => [
      String(idx + 1), i.titulo, i.combo ? 'Combo' : 'Avulso', dinheiro(i.receita), pct(i.participacao),
      num(i.vendas), dinheiro(i.ticketMedio), dinheiro(i.receitaAnual), dinheiro(i.licenca), data(i.ultimaVenda),
    ]),
    { tamanho: 7, total: ['', 'Total', '', dinheiro(mat.receita), '100%', num(mat.vendas), '', '', '', ''] }
  )
  paragrafo(
    `Licença = quanto cobrar para OUTRO SITE usar aquele material ou combo por 12 meses, sem exclusividade (a DomineAqui continua vendendo): ${String(LICENCA_MULTIPLO).replace('.', ',')} × o que o item fatura por ano, mínimo de ${dinheiro(LICENCA_PISO)}. "Por ano" = receita dos últimos 12 meses ou, para item com menos de um ano de venda, a média mensal × 12. Licença para sempre: o dobro. Exclusiva (a DomineAqui para de vender): cerca de 3,3 vezes o valor da coluna.`,
    7.5
  )

  // ── 5. Como e quando compram ──────────────────────────────────────────────
  secao('Como pagam', `${num(historico.parcelamento.pedidosParcelados)} pedidos parcelados, média de ${String(historico.parcelamento.mediaDeParcelas).replace('.', ',')} parcelas.`)
  tabelaSimples('Forma de pagamento', historico.pagamento)
  tabelaSimples('Origem da compra', historico.origem)

  secao('Quando compram', 'Dia e hora do pagamento, no horário de Brasília.')
  tabelaSimples('Dia da semana', historico.diasDaSemana)
  tabelaSimples('Faixa horária', historico.faixasHorarias)

  // ── 6. Clientes ───────────────────────────────────────────────────────────
  secao('Maiores clientes', 'Os 15 compradores que mais gastaram no histórico.')
  tabela(
    [
      { titulo: '#', largura: 7, direita: true },
      { titulo: 'Nome', largura: 50 },
      { titulo: 'E-mail', largura: 58 },
      { titulo: 'Pedidos', largura: 15, direita: true },
      { titulo: 'Gasto total', largura: 24, direita: true },
      { titulo: 'Última compra', largura: 20 },
    ],
    historico.melhoresClientes.map((c, i) => [String(i + 1), c.nome || '—', c.email || '—', num(c.pedidos), dinheiro(c.receita), data(c.ultimaCompra)])
  )

  // ── 7. Assinaturas e funil (dados do painel) ──────────────────────────────
  const s = painel.subscriptionSummary
  secao('Assinaturas', 'Situação atual das assinaturas, como no painel.')
  indicadores([
    ['Assinaturas ativas', num(s.active), `${num(s.renewing)} renovam · ${num(s.cancelledStillActive)} canceladas ainda vigentes`],
    ['Receita recorrente estimada', dinheiro(s.estimatedRecurringRevenue), 'só as que renovam'],
    ['Vencem em 7 / 30 dias', `${num(s.expiring7)} / ${num(s.expiring30)}`],
    ['Cancelamentos', num(s.cancelled), `taxa ${pct(s.cancellationRate)}`],
    ['Planos recorrentes (12 meses)', dinheiro(painel.planRevenueSplit.recurring.revenue), `${num(painel.planRevenueSplit.recurring.count)} cobranças`],
    ['Planos de pagamento único (12 meses)', dinheiro(painel.planRevenueSplit.oneTime.revenue), `${num(painel.planRevenueSplit.oneTime.count)} vendas`],
  ])
  paragrafo(`Plano mais comprado: ${painel.cards.topPlan}. Produto vendido mais vezes nos últimos 12 meses: ${painel.cards.topProduct}.`, 8.5)

  secao('Funil de compra (últimos 12 meses)', `${num(painel.funnelFailed)} pagamentos falharam no período.`)
  tabela(
    [
      { titulo: 'Etapa', largura: 95 },
      { titulo: 'Pessoas', largura: 25, direita: true },
      { titulo: 'Da etapa anterior', largura: 32, direita: true },
      { titulo: 'Do início', largura: 25, direita: true },
    ],
    painel.funnel.map((f) => [f.label, num(f.count), pct(f.conversionFromPrevious), pct(f.conversionFromStart)])
  )

  const cupons = painel.couponStats.filter((c) => c.uses > 0)
  if (cupons.length) {
    secao('Cupons (últimos 12 meses)')
    tabela(
      [
        { titulo: 'Cupom', largura: 45 },
        { titulo: 'Usos', largura: 20, direita: true },
        { titulo: 'Pessoas', largura: 20, direita: true },
        { titulo: 'Receita com cupom', largura: 40, direita: true },
        { titulo: 'Desconto dado', largura: 35, direita: true },
      ],
      cupons.slice(0, 20).map((c) => [c.code, num(c.uses), num(c.uniqueUsers), dinheiro(c.revenueAttributed), dinheiro(c.discountGiven)])
    )
  }

  // ── 8. Checkouts abandonados e pedidos recentes ───────────────────────────
  if (painel.abandoned.length) {
    const valorAbandonado = painel.abandoned.reduce((t, a) => t + (a.value || 0), 0)
    secao('Checkouts abandonados', `${num(painel.cards.abandonedCheckouts)} abandonos nos últimos 12 meses, somando ${dinheiro(valorAbandonado)} que não entraram. Os 20 mais recentes, para contato:`)
    tabela(
      [
        { titulo: 'Quando', largura: 24 },
        { titulo: 'Pessoa', largura: 40 },
        { titulo: 'E-mail', largura: 50 },
        { titulo: 'Produto', largura: 48 },
        { titulo: 'Valor', largura: 20, direita: true },
      ],
      painel.abandoned.slice(0, 20).map((a) => [dataHora(a.startedAt), a.userName || '—', a.userEmail || '—', a.product, dinheiro(a.value)])
    )
  }

  secao(
    'Pedidos recentes',
    filtrosAtivos
      ? 'Os 40 pedidos mais recentes que passam nos filtros aplicados na tela (valor cobrado, com taxa).'
      : 'Os 40 pedidos mais recentes, de qualquer status (valor cobrado, com taxa).'
  )
  tabela(
    [
      { titulo: 'Data', largura: 22 },
      { titulo: 'Comprador', largura: 40 },
      { titulo: 'Produto', largura: 55 },
      { titulo: 'Tipo', largura: 20 },
      { titulo: 'Valor', largura: 20, direita: true },
      { titulo: 'Status', largura: 18 },
    ],
    pedidosDaTela.slice(0, 40).map((p) => [dataHora(p.createdAt), p.userName || p.userEmail || '—', p.product, p.productType, dinheiro(p.value), p.status]),
    { tamanho: 7 }
  )

  // ── Notas ─────────────────────────────────────────────────────────────────
  secao('Como ler este relatório')
  paragrafo(
    'Os cards do painel somam os últimos 12 meses com o valor cobrado (preço + taxa operacional). As seções históricas deste PDF (resumo, mês a mês, tipos, materiais, pagamento, horários e clientes) cobrem todo o histórico e usam o preço de tabela, que é o que fica com a DomineAqui antes da divisão com sócios. Assinaturas, funil, cupons e abandonos repetem o painel. Ritmo anual: receita dos últimos 12 meses ou, com menos de um ano de vendas, a média mensal × 12.',
    7.5
  )

  // ── Rodapé em todas as páginas ────────────────────────────────────────────
  const paginas = doc.getNumberOfPages()
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p)
    doc.setDrawColor(LINHA[0], LINHA[1], LINHA[2])
    doc.line(MARGEM, 288, LARGURA - MARGEM, 288)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    cor(CINZA)
    doc.text('DomineAqui Analytics · uso interno', MARGEM, 292)
    doc.text(`Página ${p} de ${paginas}`, LARGURA - MARGEM, 292, { align: 'right' })
  }

  doc.save(`domineaqui-analytics-${new Date().toISOString().slice(0, 10)}.pdf`)
}
