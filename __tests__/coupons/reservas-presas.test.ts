import { ObjectId } from 'mongodb'
import { describe, expect, it } from 'vitest'

import { mongoDeMentira } from '../ajudantes/mongo-de-mentira'
import {
  releaseStaleCouponHolds,
  validateCouponForCheckout,
  type CouponCheckoutItem,
} from '@/lib/coupons'

/**
 * O que estes testes protegem: o cupom de quem não chegou a usar o cupom.
 *
 * O cupom é reservado — e `usageCount` incrementado — no instante em que o
 * pedido nasce, antes de existir pagamento. A devolução depende de o provedor
 * avisar que a cobrança falhou, e esse aviso não vem quando a pessoa
 * simplesmente não paga o Pix nem fecha a aba. O saldo disso é duplo:
 *
 *  - quem tentou pagar e desistiu volta e lê "você já atingiu o limite de uso
 *    deste cupom", por um uso que nunca aconteceu;
 *  - a campanha se esgota sozinha, mostrando "restam 0 usos" com metade das
 *    vendas não feitas.
 *
 * O limite real continua sendo limite: reserva presa a pedido que AINDA pode
 * ser pago não é devolvida por nenhum destes caminhos.
 */

const USUARIO = new ObjectId().toHexString()
const CUPOM = new ObjectId().toHexString()
const EMAIL = 'aluna@exemplo.com'

const ITEM: CouponCheckoutItem = {
  itemType: 'material',
  itemId: 'mat-1',
  itemTitle: 'Material',
  materialType: 'pdf',
  price: 100,
}

function cupom(overrides: Record<string, any> = {}) {
  return {
    _id: CUPOM,
    code: 'BOLSISTA',
    codeNormalized: 'BOLSISTA',
    discountType: 'percentage',
    discountValue: 20,
    scope: 'all',
    perUserLimit: 1,
    usageCount: 1,
    isActive: true,
    ...overrides,
  }
}

function pedido(overrides: Record<string, any> = {}) {
  return {
    _id: new ObjectId().toHexString(),
    status: 'pending',
    paymentMethod: 'pix',
    providerPaymentId: 'mp-1',
    createdAt: new Date(),
    ...overrides,
  }
}

function reserva(orderId: string, overrides: Record<string, any> = {}) {
  return {
    _id: new ObjectId().toHexString(),
    couponId: CUPOM,
    code: 'BOLSISTA',
    userId: USUARIO,
    userEmail: EMAIL,
    orderId,
    status: 'reserved',
    createdAt: new Date(),
    ...overrides,
  }
}

function banco(colecoes: Record<string, any[]>) {
  return mongoDeMentira({
    coupons: [],
    coupon_redemptions: [],
    payment_orders: [],
    users: [{ _id: USUARIO, email: EMAIL }],
    material_purchases: [],
    manual_clinico_purchases: [],
    ...colecoes,
  })
}

describe('releaseStaleCouponHolds', () => {
  it('devolve a reserva presa num Pix vencido e desconta o contador', async () => {
    const vencido = pedido({ createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000) })
    const doCupom = cupom()
    const aReserva = reserva(vencido._id)
    const db = banco({ coupons: [doCupom], coupon_redemptions: [aReserva], payment_orders: [vencido] })

    await expect(releaseStaleCouponHolds(db, { couponId: CUPOM })).resolves.toBe(1)
    expect(aReserva.status).toBe('released')
    expect((aReserva as any).releaseReason).toBe('stale_hold')
    expect(doCupom.usageCount).toBe(0)
  })

  it('não mexe na reserva de um pedido que ainda pode ser pago', async () => {
    const emAberto = pedido()
    const doCupom = cupom()
    const aReserva = reserva(emAberto._id)
    const db = banco({ coupons: [doCupom], coupon_redemptions: [aReserva], payment_orders: [emAberto] })

    await expect(releaseStaleCouponHolds(db, { couponId: CUPOM })).resolves.toBe(0)
    expect(aReserva.status).toBe('reserved')
    expect(doCupom.usageCount).toBe(1)
  })

  it('devolve a reserva de um pedido que sumiu do banco', async () => {
    const doCupom = cupom()
    const aReserva = reserva(new ObjectId().toHexString())
    const db = banco({ coupons: [doCupom], coupon_redemptions: [aReserva], payment_orders: [] })

    await expect(releaseStaleCouponHolds(db, { couponId: CUPOM })).resolves.toBe(1)
    expect(doCupom.usageCount).toBe(0)
  })
})

describe('validateCouponForCheckout', () => {
  it('deixa a pessoa usar o cupom depois de abandonar a primeira tentativa', async () => {
    // É o chamado que originou o conserto: "fica dizendo que ela já usou o
    // cupom de desconto".
    const vencido = pedido({ createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000) })
    const db = banco({
      coupons: [cupom()],
      coupon_redemptions: [reserva(vencido._id)],
      payment_orders: [vencido],
    })

    const resultado = await validateCouponForCheckout(db, {
      code: 'BOLSISTA',
      items: [ITEM],
      userId: USUARIO,
      userEmail: EMAIL,
    })
    expect(resultado.discountAmount).toBe(20)
  })

  it('continua barrando quem tem uma tentativa de pagamento viva', async () => {
    const emAberto = pedido()
    const db = banco({
      coupons: [cupom()],
      coupon_redemptions: [reserva(emAberto._id)],
      payment_orders: [emAberto],
    })

    await expect(
      validateCouponForCheckout(db, { code: 'BOLSISTA', items: [ITEM], userId: USUARIO, userEmail: EMAIL })
    ).rejects.toThrow('Você já atingiu o limite de uso deste cupom.')
  })

  it('continua barrando quem já pagou com o cupom', async () => {
    const pago = pedido({ status: 'approved' })
    const db = banco({
      coupons: [cupom()],
      coupon_redemptions: [reserva(pago._id, { status: 'approved' })],
      payment_orders: [pago],
    })

    await expect(
      validateCouponForCheckout(db, { code: 'BOLSISTA', items: [ITEM], userId: USUARIO, userEmail: EMAIL })
    ).rejects.toThrow('Você já atingiu o limite de uso deste cupom.')
  })

  it('reabre o cupom cujo limite global só estava tomado por reservas mortas', async () => {
    const vencido = pedido({ createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000) })
    const db = banco({
      coupons: [cupom({ perUserLimit: null, usageLimit: 1, usageCount: 1 })],
      coupon_redemptions: [reserva(vencido._id, { userId: 'outra-pessoa', userEmail: 'outra@exemplo.com' })],
      payment_orders: [vencido],
    })

    const resultado = await validateCouponForCheckout(db, {
      code: 'BOLSISTA',
      items: [ITEM],
      userId: USUARIO,
      userEmail: EMAIL,
    })
    expect(resultado.discountAmount).toBe(20)
  })

  it('mantém esgotado o cupom cujo limite global foi realmente gasto', async () => {
    const pago = pedido({ status: 'approved' })
    const db = banco({
      coupons: [cupom({ perUserLimit: null, usageLimit: 1, usageCount: 1 })],
      coupon_redemptions: [
        reserva(pago._id, { status: 'approved', userId: 'outra-pessoa', userEmail: 'outra@exemplo.com' }),
      ],
      payment_orders: [pago],
    })

    await expect(
      validateCouponForCheckout(db, { code: 'BOLSISTA', items: [ITEM], userId: USUARIO, userEmail: EMAIL })
    ).rejects.toThrow('Este cupom atingiu o limite de uso.')
  })
})
