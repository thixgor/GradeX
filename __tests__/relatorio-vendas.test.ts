import { describe, expect, it } from 'vitest'
import { itensDoPedido, montarRelatorioHistorico, precoDaLicenca, type PedidoDoHistorico } from '@/lib/relatorio-vendas'

const pedido = (extra: Partial<PedidoDoHistorico>): PedidoDoHistorico => ({
  _id: Math.random().toString(36).slice(2),
  type: 'material',
  amount: 0,
  ...extra,
})

describe('itensDoPedido', () => {
  it('rateia o carrinho pelo preço de cada item, com o cupom caindo em todos', () => {
    const itens = itensDoPedido({
      amount: 95,
      baseAmount: 90,
      metadata: {
        cartItems: [
          { itemType: 'package', itemId: 'p1', itemTitle: 'Combo N1', price: 60 },
          { itemType: 'material', itemId: 'm1', itemTitle: 'Resumo', price: 40 },
        ],
      },
    })
    expect(itens.map((i) => [i.itemType, i.valor])).toEqual([['package', 54], ['material', 36]])
  })

  it('fecha a soma no centavo quando a divisão não é exata', () => {
    const itens = itensDoPedido({
      amount: 100,
      metadata: { cartItems: [1, 2, 3].map((n) => ({ itemType: 'material', itemId: `m${n}`, price: 10 })) },
    })
    expect(itens.reduce((s, i) => s + i.valor, 0)).toBe(100)
  })

  it('tira a parte física do checkout unificado antes de ratear', () => {
    const [item] = itensDoPedido(
      { amount: 100, baseAmount: 100, refId: 'm1', metadata: { itemType: 'material', shopOrderId: 's1' } },
      new Map([['s1', 30]])
    )
    expect(item.valor).toBe(70)
  })

  it('lê o carrinho da compra por serial key, inclusive sem conta', () => {
    const [item] = itensDoPedido({
      amount: 50,
      metadata: { serialKeyPurchase: true, serialKeyCart: [{ grant: { itemType: 'package', itemId: 'p2', itemTitle: 'Combo ME' }, amount: 50 }] },
    })
    expect(item).toMatchObject({ itemType: 'package', itemId: 'p2', titulo: 'Combo ME', valor: 50 })
  })
})

describe('montarRelatorioHistorico', () => {
  const agora = new Date('2026-10-19T15:00:00Z')

  const relatorio = montarRelatorioHistorico({
    agora,
    pedidos: [
      // Julho: combo + avulso no mesmo carrinho, com impresso junto.
      pedido({
        _id: 'a', userId: 'u1', baseAmount: 130, amount: 131.3, feeAmount: 1.3, paymentMethod: 'pix',
        paidAt: new Date('2026-07-10T23:30:00Z'), // 20h30 em Brasília
        metadata: {
          shopOrderId: 's1',
          cartItems: [
            { itemType: 'package', itemId: 'p1', itemTitle: 'Combo N1', price: 80 },
            { itemType: 'material', itemId: 'm1', itemTitle: 'Resumo', price: 20 },
          ],
        },
      }),
      // Setembro: o mesmo comprador volta.
      pedido({ _id: 'b', userId: 'u1', baseAmount: 80, amount: 80, refId: 'p1', paymentMethod: 'credit_card', paidInstallments: 3, paidAt: new Date('2026-09-02T12:00:00Z'), metadata: { itemType: 'package' } }),
      // Setembro: comprador novo, sem conta, por serial key.
      pedido({ _id: 'c', baseAmount: 20, amount: 20, paymentMethod: 'pix', payerEmail: 'B@x.com', paidAt: new Date('2026-09-20T12:00:00Z'), metadata: { serialKeyPurchase: true, serialKeyCart: [{ grant: { itemType: 'material', itemId: 'm1' }, amount: 20 }] } }),
      pedido({ _id: 'd', type: 'plan', baseAmount: 50, amount: 50, userId: 'u3', refId: 'plus', paidAt: new Date('2026-10-01T12:00:00Z') }),
      pedido({ _id: 'e', type: 'donation', baseAmount: 999, amount: 999, paidAt: new Date('2026-10-01T12:00:00Z') }),
    ],
    fisicoPorPedido: new Map([['s1', 30]]),
    catalogo: new Map([['m1', 'Resumo de Cardio']]),
    statusDosPedidos: [
      { status: 'approved', pedidos: 4, valor: 280 },
      { status: 'refunded', pedidos: 1, valor: 20 },
      { status: 'rejected', pedidos: 5, valor: 100 },
    ],
  })

  it('soma a receita de tabela, sem doação, e mostra a taxa à parte', () => {
    expect(relatorio.resumo.receita).toBe(280)
    expect(relatorio.resumo.taxaRepassada).toBe(1.3)
    expect(relatorio.resumo.pedidos).toBe(4)
    expect(relatorio.resumo.ticketMedio).toBe(70)
  })

  it('conta compradores e recompra', () => {
    expect(relatorio.resumo.compradores).toBe(3)
    expect(relatorio.resumo.compradoresRecorrentes).toBe(1)
  })

  it('preenche os meses sem venda e marca os compradores novos', () => {
    expect(relatorio.meses.map((m) => m.mes)).toEqual(['2026-07', '2026-08', '2026-09', '2026-10'])
    const [jul, ago, set] = relatorio.meses
    expect(jul).toMatchObject({ receita: 130, pedidos: 1, novosCompradores: 1, combos: 80, avulsos: 20 })
    expect(ago.receita).toBe(0)
    expect(set).toMatchObject({ receita: 100, pedidos: 2, compradores: 2, novosCompradores: 1 })
    expect(relatorio.meses.at(-1)?.acumulado).toBe(280)
  })

  it('separa a parte impressa como Loja', () => {
    const loja = relatorio.porTipo.find((t) => t.rotulo.startsWith('Loja'))
    const materiais = relatorio.porTipo.find((t) => t.rotulo.startsWith('Materiais'))
    expect(loja?.receita).toBe(30)
    expect(materiais?.receita).toBe(200)
  })

  it('classifica cada item e usa o título atual do catálogo', () => {
    const { ranking, combos, avulsos } = relatorio.materiais
    expect(ranking[0]).toMatchObject({ itemId: 'p1', combo: true, receita: 160, vendas: 2, compradores: 1 })
    expect(ranking[1]).toMatchObject({ itemId: 'm1', titulo: 'Resumo de Cardio', combo: false, receita: 40, vendas: 2 })
    expect(combos.receita).toBe(160)
    expect(avulsos.receita).toBe(40)
  })

  it('agrupa pagamento, origem e horário de Brasília por pedido', () => {
    expect(relatorio.pagamento.find((p) => p.rotulo === 'Pix')).toMatchObject({ pedidos: 2, receita: 150 })
    expect(relatorio.parcelamento).toEqual({ pedidosParcelados: 1, mediaDeParcelas: 3 })
    expect(relatorio.origem.find((o) => o.rotulo === 'Serial key (sem conta)')?.pedidos).toBe(1)
    expect(relatorio.faixasHorarias.find((f) => f.rotulo.startsWith('Noite'))?.pedidos).toBe(1)
    expect(relatorio.diasDaSemana).toHaveLength(7)
  })

  it('calcula estorno e aprovação a partir da contagem por status', () => {
    expect(relatorio.resumo.pedidosEstornados).toBe(1)
    expect(relatorio.resumo.taxaDeEstorno).toBeCloseTo(20)
    expect(relatorio.resumo.taxaDeAprovacao).toBeCloseTo(40)
  })
})

describe('precoDaLicenca', () => {
  it('cobra 1,5 × a receita anual, arredondado para cima de R$ 100', () => {
    expect(precoDaLicenca(10_000)).toBe(15_000)
    expect(precoDaLicenca(3_333)).toBe(5_000)
  })

  it('nunca sai abaixo do piso', () => {
    expect(precoDaLicenca(0)).toBe(1_500)
    expect(precoDaLicenca(400)).toBe(1_500)
  })
})
