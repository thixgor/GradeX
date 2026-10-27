import { describe, it, expect } from 'vitest'
import { itensDoPedido } from '@/lib/payments/itens-do-pedido'

/**
 * DomineAqui Analytics: "não tá descrito certinho se foi comprado carrinho ou
 * mais de um produto". O pedido do carrinho guarda só o PRIMEIRO item em
 * `refId`, e o painel lia por ele — um carrinho de três itens aparecia como a
 * compra direta de um material só.
 */

const carrinho = {
  _id: 'o1',
  type: 'material',
  refId: 'm1',
  amount: 157.5,
  baseAmount: 150,
  currency: 'BRL',
  status: 'approved',
  metadata: {
    itemType: 'cart',
    shopOrderId: 's1',
    cartItems: [
      { itemType: 'material', itemId: 'm1', itemTitle: 'Resumo de Cardio', price: 50 },
      { itemType: 'package', itemId: 'p1', itemTitle: 'Pacote Clínica', price: 30 },
      { itemType: 'material', itemId: 'f1', itemTitle: 'Deck de Farmaco', price: 10, linkedDeckSlug: 'farmaco' },
    ],
    freeItems: [{ itemType: 'material', itemId: 'm9', itemTitle: 'Brinde', price: 0 }],
  },
} as any

const fisicos = new Map([
  ['s1', { total: 60, freight: 12, items: [{ title: 'Apostila', versionName: 'Colorida', quantity: 2, unitPrice: 24 }] }],
])

describe('itens do pedido no Analytics', () => {
  it('carrinho: cada item com o tipo e o preço, mais brinde, impresso e frete', () => {
    const itens = itensDoPedido(carrinho, { title: 'Carrinho · 3 itens + impressos', type: 'Carrinho' }, new Map(), fisicos)
    expect(itens).toEqual([
      { title: 'Resumo de Cardio', kind: 'Material', amount: 50, quantity: 1 },
      { title: 'Pacote Clínica', kind: 'Pacote', amount: 30, quantity: 1 },
      { title: 'Deck de Farmaco', kind: 'Flashcard', amount: 10, quantity: 1 },
      { title: 'Brinde', kind: 'Material', amount: 0, quantity: 1, free: true },
      { title: 'Apostila — Colorida', kind: 'Impresso', amount: 48, quantity: 2 },
      { title: 'Frete dos impressos', kind: 'Frete', amount: 12, quantity: 1 },
    ])
  })

  it('item único com impresso junto: o digital vale a compra menos o pedido físico', () => {
    const pedido = { ...carrinho, metadata: { itemType: 'material', shopOrderId: 's1' } }
    const itens = itensDoPedido(pedido, { title: 'Resumo de Cardio', type: 'Material' }, new Map(), fisicos)
    expect(itens[0]).toEqual({ title: 'Resumo de Cardio', kind: 'Material', amount: 90, quantity: 1 })
    expect(itens.map((i) => i.kind)).toEqual(['Material', 'Impresso', 'Frete'])
  })

  it('compra simples: um item só, com o valor do pedido', () => {
    const pedido = { ...carrinho, metadata: { itemType: 'material' } }
    expect(itensDoPedido(pedido, { title: 'Resumo de Cardio', type: 'Material' }, new Map(), new Map())).toEqual([
      { title: 'Resumo de Cardio', kind: 'Material', amount: 157.5, quantity: 1 },
    ])
  })
})
