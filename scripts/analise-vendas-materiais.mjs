#!/usr/bin/env node
/**
 * Quanto cada material e cada combo (pacote) já faturou, e quanto vale ceder o
 * direito de usar um material da DomineAqui em outro site.
 *
 * SÓ LÊ o banco. Nada é gravado, nenhum índice é criado.
 *
 * Fonte da verdade: `payment_orders` aprovadas do tipo `material` — cobre a
 * compra logada (item único e carrinho) e a compra sem conta por serial key
 * (que não gera `material_purchases` até a ativação). Pedido estornado ou com
 * chargeback sai do status `approved`, então já fica de fora. Compras antigas
 * do Stripe, sem `payment_orders`, entram por `material_purchases`.
 *
 * Valor de cada item = preço de tabela (`baseAmount`), sem a taxa operacional
 * repassada ao comprador e sem a parte física do checkout unificado. Num
 * carrinho, o valor do pedido é rateado entre os itens na proporção do preço
 * de cada um (assim cupom/desconto do carrinho cai em todos por igual).
 *
 * Uso:
 *   MONGODB_URI="mongodb+srv://..." node scripts/analise-vendas-materiais.mjs
 *   ... [--saida relatorio-vendas] [--banco nome-do-banco]
 *
 * Gera em --saida (padrão: relatorio-vendas/, fora do git — tem e-mail de
 * comprador):
 *   relatorio.md       ranking, combos x avulsos, mês a mês e o valor da licença
 *   vendas.csv         uma linha por item vendido (dados completos)
 *   ranking.csv        um item por linha, com o valor de licença calculado
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// ─── Precificação da licença ────────────────────────────────────────────────
//
// Base: receita anual do material (últimos 12 meses; se ele tem menos de um ano
// de venda, a média mensal desde a primeira venda × 12). O outro site vende
// para o mesmo público, então cada venda dele pode ser uma venda nossa a menos.
// O preço tem de pagar essa perda provável e ainda deixar lucro.
//
//  - Não exclusiva, 12 meses: 1,5 × receita anual. Cobre perder até tudo o que
//    o material faria no ano (canibalização total) e deixa 50% por cima.
//  - Não exclusiva, perpétua: 3 × receita anual (dois anos e meio de
//    canibalização + prêmio; material de prova envelhece, por isso não mais).
//  - Exclusiva (nós deixamos de vender): 5 × receita anual.
//
// Piso: nenhuma licença sai abaixo de LICENCA_PISO, para material que vendeu
// pouco não ser cedido de graça — ainda custou para ser produzido.
export const MULTIPLO_12_MESES = 1.5
export const MULTIPLO_PERPETUA = 3
export const MULTIPLO_EXCLUSIVA = 5
export const LICENCA_PISO = 1500

const STATUS_PAGO = 'approved'
const FUSO = 'America/Sao_Paulo'

const centavos = (v) => Math.round((Number(v) || 0) * 100) / 100

/** Mês no fuso de Brasília, "2026-03". */
export function mesBrasilia(data) {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit' })
    .formatToParts(new Date(data))
  const ano = partes.find((p) => p.type === 'year').value
  const mes = partes.find((p) => p.type === 'month').value
  return `${ano}-${mes}`
}

/** Pacote é combo por definição; título com "combo" também conta (material único vendido como combo). */
export function ehCombo(item) {
  return item.itemType === 'package' || /\bcombo\b/i.test(item.titulo || '')
}

/**
 * Quebra um pedido aprovado nos itens que ele vendeu, com o valor de cada um.
 * `fisicoPorPedido` dá o total da parte física (frete incluso) ligada ao
 * pedido, para descontar do valor digital.
 */
export function itensDoPedido(order, fisicoPorPedido = new Map()) {
  const meta = order.metadata || {}
  const cobrado = centavos(order.baseAmount ?? order.amount)
  const fisico = meta.shopOrderId ? centavos(fisicoPorPedido.get(String(meta.shopOrderId)) || 0) : 0
  const digital = Math.max(0, centavos(cobrado - fisico))

  let linhas = []
  if (Array.isArray(meta.serialKeyCart) && meta.serialKeyCart.length > 0) {
    linhas = meta.serialKeyCart.map((i) => ({
      itemType: i.grant?.itemType === 'package' ? 'package' : 'material',
      itemId: i.grant?.itemId ? String(i.grant.itemId) : '',
      titulo: i.grant?.itemTitle || i.productTitle || '',
      versao: i.grant?.accessVersionLabel || '',
      tabela: Number(i.amount) || 0,
    }))
  } else if (Array.isArray(meta.cartItems) && meta.cartItems.length > 0) {
    linhas = meta.cartItems.map((i) => ({
      itemType: i.itemType === 'package' ? 'package' : 'material',
      itemId: i.itemId ? String(i.itemId) : '',
      titulo: i.itemTitle || '',
      versao: i.accessVersionLabel || '',
      tabela: Number(i.price) || 0,
    }))
  } else if (order.refId) {
    linhas = [{
      itemType: meta.itemType === 'package' ? 'package' : 'material',
      itemId: String(order.refId),
      titulo: meta.itemTitle || '',
      versao: meta.accessVersionLabel || '',
      tabela: digital,
    }]
  }
  linhas = linhas.filter((l) => l.itemId)
  if (linhas.length === 0) return []

  // Rateio: o pedido manda; a tabela só decide a proporção.
  const somaTabela = linhas.reduce((s, l) => s + l.tabela, 0)
  let restante = digital
  return linhas.map((l, idx) => {
    const ultimo = idx === linhas.length - 1
    const valor = ultimo
      ? restante
      : centavos(somaTabela > 0 ? (digital * l.tabela) / somaTabela : digital / linhas.length)
    restante = centavos(restante - valor)
    return { ...l, valor }
  })
}

/**
 * Agrega as vendas por item e calcula o valor de licença.
 * `vendas`: [{ itemType, itemId, titulo, valor, data, comprador }]
 * `catalogo`: Map itemId -> { titulo, precoAtual, itemType, oculto }
 */
export function agregar(vendas, catalogo = new Map(), agora = new Date()) {
  const corte12m = new Date(agora)
  corte12m.setMonth(corte12m.getMonth() - 12)

  const porItem = new Map()
  for (const v of vendas) {
    const chave = `${v.itemType}:${v.itemId}`
    let a = porItem.get(chave)
    if (!a) {
      const cat = catalogo.get(v.itemId) || {}
      a = {
        itemType: v.itemType,
        itemId: v.itemId,
        titulo: cat.titulo || v.titulo || '(sem título)',
        precoAtual: cat.precoAtual ?? null,
        oculto: Boolean(cat.oculto),
        receita: 0,
        receita12m: 0,
        vendas: 0,
        vendas12m: 0,
        compradores: new Set(),
        primeira: null,
        ultima: null,
        porMes: {},
      }
      porItem.set(chave, a)
    }
    const data = new Date(v.data)
    a.receita = centavos(a.receita + v.valor)
    a.vendas += 1
    if (v.comprador) a.compradores.add(v.comprador)
    if (data >= corte12m) {
      a.receita12m = centavos(a.receita12m + v.valor)
      a.vendas12m += 1
    }
    if (!a.primeira || data < a.primeira) a.primeira = data
    if (!a.ultima || data > a.ultima) a.ultima = data
    const mes = mesBrasilia(data)
    a.porMes[mes] = centavos((a.porMes[mes] || 0) + v.valor)
  }

  const itens = [...porItem.values()].map((a) => {
    const combo = ehCombo(a)
    // Receita anual: 12 meses fechados, ou a média mensal × 12 para quem é mais novo.
    const mesesDeVida = Math.max(1, (agora - a.primeira) / (30.44 * 24 * 3600 * 1000))
    const receitaAnual = mesesDeVida >= 12 ? a.receita12m : centavos((a.receita / mesesDeVida) * 12)
    const licenca = (mult) => Math.max(LICENCA_PISO, Math.ceil((receitaAnual * mult) / 100) * 100)
    return {
      ...a,
      combo,
      compradores: a.compradores.size,
      ticketMedio: a.vendas ? centavos(a.receita / a.vendas) : 0,
      mesesDeVida: Math.round(mesesDeVida * 10) / 10,
      receitaAnual,
      licenca12m: licenca(MULTIPLO_12_MESES),
      licencaPerpetua: licenca(MULTIPLO_PERPETUA),
      licencaExclusiva: licenca(MULTIPLO_EXCLUSIVA),
    }
  })
  itens.sort((x, y) => y.receita - x.receita)
  return itens
}

const mediana = (nums) => {
  if (nums.length === 0) return 0
  const s = [...nums].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : centavos((s[m - 1] + s[m]) / 2)
}

const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const dia = (d) => (d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: FUSO }) : '')
const celulaMd = (s) => String(s ?? '').replace(/\|/g, '/').replace(/\s+/g, ' ')
const celulaCsv = (s) => {
  const t = String(s ?? '')
  return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}
// Ponto e vírgula + vírgula decimal: abre direto no Excel em português.
const numCsv = (v) => String(centavos(v)).replace('.', ',')

export function montarRelatorio(itens, vendas, outrosTipos, agora = new Date()) {
  const total = centavos(itens.reduce((s, i) => s + i.receita, 0))
  const combos = itens.filter((i) => i.combo)
  const avulsos = itens.filter((i) => !i.combo)
  const soma = (lista, campo = 'receita') => centavos(lista.reduce((s, i) => s + i[campo], 0))
  const pct = (v) => (total > 0 ? `${((v / total) * 100).toFixed(1).replace('.', ',')}%` : '—')

  const campeao = itens[0]
  const comVenda12m = itens.filter((i) => i.receitaAnual > 0)
  const licencaTipica = mediana(comVenda12m.map((i) => i.licenca12m))
  const top5 = itens.slice(0, 5)
  const licencaTop = top5.length ? mediana(top5.map((i) => i.licenca12m)) : 0

  const meses = [...new Set(vendas.map((v) => mesBrasilia(v.data)))].sort()
  const porMes = meses.map((m) => {
    const doMes = vendas.filter((v) => mesBrasilia(v.data) === m)
    const c = centavos(doMes.filter((v) => ehCombo(v)).reduce((s, v) => s + v.valor, 0))
    const t = centavos(doMes.reduce((s, v) => s + v.valor, 0))
    return { m, t, c, a: centavos(t - c), n: doMes.length }
  })

  const L = []
  L.push(`# Vendas de materiais DomineAqui — análise e valor de licença`)
  L.push('')
  L.push(`Gerado em ${agora.toLocaleString('pt-BR', { timeZone: FUSO })} (Brasília). Valores = preço de tabela efetivamente pago, sem a taxa operacional repassada ao comprador, sem a parte física e sem pedidos estornados.`)
  L.push('')
  L.push('## Veredito')
  L.push('')
  if (campeao) {
    L.push(`**Para ter o direito de usar um material da DomineAqui em outro site, precisará comprar o direito por ${brl(licencaTipica)}** (licença não exclusiva por 12 meses, valor de um material típico do catálogo).`)
    L.push('')
    L.push(`- Para os materiais que mais vendem (top 5), o direito custa **${brl(licencaTop)}**; para o campeão, **${campeao.titulo}**, custa **${brl(campeao.licenca12m)}**.`)
    L.push(`- Direito para sempre (não exclusivo): ${MULTIPLO_PERPETUA}× a receita anual do material. Exclusividade (a DomineAqui para de vender): ${MULTIPLO_EXCLUSIVA}×. Os valores por item estão no ranking abaixo e em ranking.csv.`)
  } else {
    L.push('Nenhuma venda aprovada de material encontrada — não há base para precificar a licença.')
  }
  L.push('')
  L.push('## Resumo')
  L.push('')
  L.push(`| | Receita | Participação | Vendas | Itens diferentes |`)
  L.push(`|---|---:|---:|---:|---:|`)
  L.push(`| **Total** | ${brl(total)} | 100% | ${soma(itens, 'vendas')} | ${itens.length} |`)
  L.push(`| Combos (pacotes) | ${brl(soma(combos))} | ${pct(soma(combos))} | ${soma(combos, 'vendas')} | ${combos.length} |`)
  L.push(`| Materiais avulsos | ${brl(soma(avulsos))} | ${pct(soma(avulsos))} | ${soma(avulsos, 'vendas')} | ${avulsos.length} |`)
  L.push('')
  if (campeao) {
    L.push(`**O que mais deu dinheiro:** ${campeao.titulo} (${campeao.combo ? 'combo' : 'material avulso'}) — ${brl(campeao.receita)}, ${pct(campeao.receita)} de tudo, em ${campeao.vendas} vendas.`)
    if (combos[0]) L.push(`- Combo campeão: ${combos[0].titulo} — ${brl(combos[0].receita)} (${combos[0].vendas} ${combos[0].vendas === 1 ? "venda" : "vendas"}).`)
    if (avulsos[0]) L.push(`- Avulso campeão: ${avulsos[0].titulo} — ${brl(avulsos[0].receita)} (${avulsos[0].vendas} ${avulsos[0].vendas === 1 ? "venda" : "vendas"}).`)
    L.push('')
  }
  L.push('## Ranking completo')
  L.push('')
  L.push('| # | Item | Tipo | Receita total | % | Vendas | Ticket médio | Receita anual | Licença 12 meses | Licença perpétua | Exclusiva | 1ª venda | Última |')
  L.push('|---:|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---|')
  itens.forEach((i, idx) => {
    L.push(`| ${idx + 1} | ${celulaMd(i.titulo)}${i.oculto ? ' (oculto)' : ''} | ${i.combo ? 'Combo' : 'Avulso'} | ${brl(i.receita)} | ${pct(i.receita)} | ${i.vendas} | ${brl(i.ticketMedio)} | ${brl(i.receitaAnual)} | ${brl(i.licenca12m)} | ${brl(i.licencaPerpetua)} | ${brl(i.licencaExclusiva)} | ${dia(i.primeira)} | ${dia(i.ultima)} |`)
  })
  L.push('')
  L.push('## Mês a mês')
  L.push('')
  L.push('| Mês | Receita | Combos | Avulsos | Itens vendidos |')
  L.push('|---|---:|---:|---:|---:|')
  for (const r of porMes) L.push(`| ${r.m} | ${brl(r.t)} | ${brl(r.c)} | ${brl(r.a)} | ${r.n} |`)
  L.push('')
  if (outrosTipos.length) {
    L.push('## Outras receitas (fora da análise de material, só para contexto)')
    L.push('')
    L.push('| Tipo de pedido | Receita | Pedidos |')
    L.push('|---|---:|---:|')
    for (const o of outrosTipos) L.push(`| ${o.tipo} | ${brl(o.receita)} | ${o.pedidos} |`)
    L.push('')
  }
  L.push('## Como o valor da licença é calculado')
  L.push('')
  L.push(`1. **Receita anual do material**: o que ele faturou nos últimos 12 meses. Se tem menos de um ano de venda, a média mensal desde a primeira venda × 12.`)
  L.push(`2. O outro site vende para o mesmo público; cada venda dele pode ser uma nossa a menos. O preço da licença precisa pagar essa perda e ainda deixar lucro.`)
  L.push(`3. **Não exclusiva, 12 meses = ${String(MULTIPLO_12_MESES).replace('.', ',')}× a receita anual** — cobre perder até todo o faturamento do ano e deixa 50% por cima. Perpétua = ${MULTIPLO_PERPETUA}×; exclusiva = ${MULTIPLO_EXCLUSIVA}×.`)
  L.push(`4. Piso de ${brl(LICENCA_PISO)} por material, arredondado para cima de R$ 100 em R$ 100.`)
  L.push(`5. O "valor típico" do veredito é a mediana da licença de 12 meses entre os itens que venderam no último ano.`)
  L.push('')
  L.push('Combo licenciado = licença do combo (já reflete o desconto do pacote); não some as licenças dos materiais que ele contém.')
  return L.join('\n')
}

function vendasCsv(vendas) {
  const cab = ['data', 'mes', 'pedido', 'origem', 'tipo', 'combo', 'item_id', 'item', 'versao', 'valor', 'metodo', 'parcelas', 'comprador_nome', 'comprador_email']
  const linhas = vendas.map((v) => [
    new Date(v.data).toISOString(), mesBrasilia(v.data), v.pedido, v.origem, v.itemType, ehCombo(v) ? 'sim' : 'não',
    v.itemId, v.titulo, v.versao, numCsv(v.valor), v.metodo, v.parcelas, v.nome, v.comprador,
  ].map(celulaCsv).join(';'))
  return [cab.join(';'), ...linhas].join('\n')
}

function rankingCsv(itens) {
  const cab = ['posicao', 'item_id', 'item', 'tipo', 'oculto', 'preco_atual', 'receita_total', 'vendas', 'compradores', 'ticket_medio', 'receita_12m', 'receita_anual', 'licenca_12_meses', 'licenca_perpetua', 'licenca_exclusiva', 'primeira_venda', 'ultima_venda']
  const linhas = itens.map((i, idx) => [
    idx + 1, i.itemId, i.titulo, i.combo ? 'combo' : 'avulso', i.oculto ? 'sim' : 'não',
    i.precoAtual == null ? '' : numCsv(i.precoAtual), numCsv(i.receita), i.vendas, i.compradores, numCsv(i.ticketMedio),
    numCsv(i.receita12m), numCsv(i.receitaAnual), numCsv(i.licenca12m), numCsv(i.licencaPerpetua), numCsv(i.licencaExclusiva),
    dia(i.primeira), dia(i.ultima),
  ].map(celulaCsv).join(';'))
  return [cab.join(';'), ...linhas].join('\n')
}

function argumento(nome, padrao) {
  const i = process.argv.indexOf(`--${nome}`)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : padrao
}

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('Defina MONGODB_URI (leitura basta).')
    process.exit(1)
  }
  const saida = argumento('saida', 'relatorio-vendas')
  const { MongoClient, ObjectId } = await import('mongodb')
  const client = new MongoClient(uri, { readPreference: 'secondaryPreferred' })
  await client.connect()
  try {
    const db = argumento('banco') ? client.db(argumento('banco')) : client.db()
    const agora = new Date()

    const [pedidos, legado, materiais, pacotes, outros] = await Promise.all([
      db.collection('payment_orders').find({ type: 'material', status: STATUS_PAGO }).toArray(),
      db.collection('material_purchases').find({
        status: 'completed',
        source: { $ne: 'plus' },
        price: { $gt: 0 },
        $or: [{ providerOrderId: { $exists: false } }, { providerOrderId: null }, { providerOrderId: '' }],
      }).toArray(),
      db.collection('materials').find({}, { projection: { title: 1, price: 1, isHidden: 1 } }).toArray(),
      db.collection('material_packages').find({}, { projection: { title: 1, price: 1, isHidden: 1 } }).toArray(),
      db.collection('payment_orders').aggregate([
        { $match: { type: { $ne: 'material' }, status: STATUS_PAGO } },
        { $group: { _id: '$type', receita: { $sum: { $ifNull: ['$baseAmount', '$amount'] } }, pedidos: { $sum: 1 } } },
        { $sort: { receita: -1 } },
      ]).toArray(),
    ])

    const idsFisicos = pedidos.map((p) => p.metadata?.shopOrderId).filter((id) => id && ObjectId.isValid(String(id)))
    const fisicos = idsFisicos.length
      ? await db.collection('shop_orders').find({ _id: { $in: idsFisicos.map((id) => new ObjectId(String(id))) } }, { projection: { total: 1 } }).toArray()
      : []
    const fisicoPorPedido = new Map(fisicos.map((s) => [String(s._id), Number(s.total) || 0]))

    const catalogo = new Map()
    for (const m of materiais) catalogo.set(String(m._id), { titulo: m.title, precoAtual: m.price ?? null, oculto: m.isHidden })
    for (const p of pacotes) catalogo.set(String(p._id), { titulo: p.title, precoAtual: p.price ?? null, oculto: p.isHidden })

    const vendas = []
    for (const o of pedidos) {
      const data = o.paidAt || o.updatedAt || o.createdAt
      const comprador = String(o.payerEmail || o.metadata?.buyerEmail || '').toLowerCase().trim()
      for (const item of itensDoPedido(o, fisicoPorPedido)) {
        vendas.push({
          ...item,
          titulo: catalogo.get(item.itemId)?.titulo || item.titulo,
          data,
          pedido: String(o._id),
          origem: o.metadata?.serialKeyPurchase ? 'serial key' : 'conta',
          metodo: o.paymentMethod || '',
          parcelas: o.paidInstallments || '',
          nome: o.payerName || o.metadata?.buyerName || '',
          comprador,
        })
      }
    }
    for (const p of legado) {
      vendas.push({
        itemType: p.itemType === 'package' ? 'package' : 'material',
        itemId: String(p.itemId),
        titulo: catalogo.get(String(p.itemId))?.titulo || p.itemTitle || '',
        versao: '',
        valor: centavos(p.price),
        data: p.purchasedAt,
        pedido: String(p.stripeSessionId || p._id),
        origem: 'legado (stripe)',
        metodo: '',
        parcelas: '',
        nome: p.userName || '',
        comprador: String(p.userEmail || '').toLowerCase().trim(),
      })
    }
    vendas.sort((a, b) => new Date(a.data) - new Date(b.data))

    const itens = agregar(vendas, catalogo, agora)
    const outrosTipos = outros.map((o) => ({ tipo: o._id, receita: centavos(o.receita), pedidos: o.pedidos }))

    mkdirSync(saida, { recursive: true })
    writeFileSync(join(saida, 'relatorio.md'), montarRelatorio(itens, vendas, outrosTipos, agora))
    writeFileSync(join(saida, 'vendas.csv'), '﻿' + vendasCsv(vendas))
    writeFileSync(join(saida, 'ranking.csv'), '﻿' + rankingCsv(itens))

    console.log(`${pedidos.length} pedidos aprovados + ${legado.length} compras legadas → ${vendas.length} itens vendidos, ${itens.length} materiais/combos.`)
    console.log(`Relatório em ${join(saida, 'relatorio.md')}`)
  } finally {
    await client.close()
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
