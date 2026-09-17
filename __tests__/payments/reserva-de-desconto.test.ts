import { describe, expect, it } from 'vitest'

import { pedidoAindaPodeSerPago } from '@/lib/checkout-reservations'

/**
 * O que este teste protege: os dois erros possíveis ao soltar uma reserva.
 *
 * Soltar tarde demais é o bug relatado — a pessoa não consegue comprar porque
 * um pedido que nunca vai ser pago está segurando o desconto dela. Soltar cedo
 * demais é pior: devolve para uso um benefício de uso único que ainda pode ser
 * cobrado, e a mesma pessoa leva o desconto duas vezes.
 *
 * Por isso a regra é conservadora: na dúvida, o pedido conta como vivo.
 */

function pedido(overrides: Record<string, any> = {}) {
  return {
    status: 'pending' as const,
    paymentMethod: 'pix' as const,
    providerPaymentId: 'mp-1',
    createdAt: new Date(),
    ...overrides,
  }
}

const horas = (n: number) => new Date(Date.now() - n * 60 * 60 * 1000)

describe('pedidoAindaPodeSerPago', () => {
  it('pedido recém-criado aguardando pagamento ainda vale', () => {
    expect(pedidoAindaPodeSerPago(pedido())).toBe(true)
  })

  it('pedido que não existe mais não segura nada', () => {
    expect(pedidoAindaPodeSerPago(null)).toBe(false)
    expect(pedidoAindaPodeSerPago(undefined)).toBe(false)
  })

  it('status terminal encerra a espera', () => {
    for (const status of ['approved', 'rejected', 'cancelled', 'expired', 'refunded', 'charged_back'] as const) {
      expect(pedidoAindaPodeSerPago(pedido({ status }))).toBe(false)
    }
  })

  it('cartão em análise continua vivo', () => {
    expect(pedidoAindaPodeSerPago(pedido({ status: 'in_process', paymentMethod: 'credit_card' }))).toBe(true)
  })

  it('Pix ainda dentro das 24h de vencimento continua vivo', () => {
    expect(pedidoAindaPodeSerPago(pedido({ createdAt: horas(20) }))).toBe(true)
  })

  it('Pix vencido não pode mais ser pago', () => {
    expect(pedidoAindaPodeSerPago(pedido({ createdAt: horas(30) }))).toBe(false)
  })

  it('boleto segue a mesma janela do Pix', () => {
    expect(pedidoAindaPodeSerPago(pedido({ paymentMethod: 'boleto', createdAt: horas(20) }))).toBe(true)
    expect(pedidoAindaPodeSerPago(pedido({ paymentMethod: 'boleto', createdAt: horas(30) }))).toBe(false)
  })

  it('cartão em revisão manual ganha prazo maior que o Pix', () => {
    const emRevisao = { status: 'in_process' as const, paymentMethod: 'credit_card' as const, providerPaymentId: 'mp-1' }
    expect(pedidoAindaPodeSerPago({ ...emRevisao, createdAt: horas(40) })).toBe(true)
    expect(pedidoAindaPodeSerPago({ ...emRevisao, createdAt: horas(24 * 5) })).toBe(false)
  })

  it('pedido sem id do provedor tem vida curta: nunca chegou ao Mercado Pago', () => {
    // A aba fechou no meio do checkout. Sem `providerPaymentId` nem o sweeper
    // de reconciliação olha para ele — esperar 24h só prende o desconto.
    expect(pedidoAindaPodeSerPago(pedido({ providerPaymentId: undefined }))).toBe(true)
    expect(pedidoAindaPodeSerPago(pedido({ providerPaymentId: undefined, createdAt: horas(1) }))).toBe(false)
  })

  it('data inválida ou no futuro mantém o pedido vivo, por precaução', () => {
    expect(pedidoAindaPodeSerPago(pedido({ createdAt: new Date('nada') }))).toBe(true)
    expect(pedidoAindaPodeSerPago(pedido({ createdAt: new Date(Date.now() + 60_000) }))).toBe(true)
  })
})
