import { describe, it, expect } from 'vitest'
import { isDebitMethodId, mercadoPagoIdFromBrand, pickCardPaymentMethod } from '@/lib/payments/card-method'
import { describeMercadoPagoApiError } from '@/lib/payments/mercado-pago/errors'

/**
 * Causas de "cartão recusado" que eram nossas, não do banco.
 */
describe('pickCardPaymentMethod', () => {
  it('cartão múltiplo: prefere o crédito mesmo quando o débito vem primeiro', () => {
    const r = pickCardPaymentMethod([
      { id: 'debmaster', payment_type_id: 'debit_card', issuer: { id: 24 } },
      { id: 'master', payment_type_id: 'credit_card', issuer: { id: 24 } },
    ])
    expect(r).toEqual({ id: 'master', issuerId: '24', paymentTypeId: 'credit_card' })
  })

  it('só débito: usa o débito', () => {
    expect(pickCardPaymentMethod([{ id: 'debvisa', payment_type_id: 'debit_card' }])?.id).toBe('debvisa')
  })

  it('resposta vazia ou quebrada: null (quem chama não chuta)', () => {
    expect(pickCardPaymentMethod([])).toBeNull()
    expect(pickCardPaymentMethod(undefined)).toBeNull()
    expect(pickCardPaymentMethod([{ foo: 1 }])).toBeNull()
  })
})

describe('mercadoPagoIdFromBrand', () => {
  it('fallback pela bandeira real — nunca mais "visa" para um Mastercard', () => {
    expect(mercadoPagoIdFromBrand('master')).toBe('master')
    expect(mercadoPagoIdFromBrand('elo')).toBe('elo')
    expect(mercadoPagoIdFromBrand('unknown')).toBeNull()
  })

  it('reconhece débito', () => {
    expect(isDebitMethodId('debelo')).toBe(true)
    expect(isDebitMethodId('maestro')).toBe(true)
    expect(isDebitMethodId('master')).toBe(false)
    expect(isDebitMethodId(null)).toBe(false)
  })
})

describe('describeMercadoPagoApiError', () => {
  it('traduz pelo código do erro', () => {
    expect(describeMercadoPagoApiError({ cause: [{ code: 2067, description: 'Invalid user identification number' }] }))
      .toContain('CPF não confere')
    expect(describeMercadoPagoApiError({ cause: [{ code: '3003', description: 'Invalid card_token_id' }] }))
      .toContain('expiraram')
  })

  it('traduz pelo texto quando o código é desconhecido', () => {
    expect(describeMercadoPagoApiError({ message: 'Invalid users involved' })).toContain('conta que recebe')
    expect(describeMercadoPagoApiError({ cause: { code: 9999, description: 'Invalid installments' } })).toContain('parcelas')
  })

  it('erro desconhecido: null (a mensagem original segue)', () => {
    expect(describeMercadoPagoApiError({ message: 'internal_error' })).toBeNull()
    expect(describeMercadoPagoApiError(undefined)).toBeNull()
  })
})
