import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * O que vai ao Mercado Pago no pagamento com cartão: o CPF em
 * `payer.identification` tem de ser o mesmo da tokenização (o do titular), e o
 * device ID vai no header do antifraude.
 */
const create = vi.fn()
vi.mock('@/lib/payments/mercado-pago/client', () => ({
  getMpPaymentWithToken: () => ({ create: (...a: any[]) => create(...a) }),
  getMpPreApprovalWithToken: () => ({}),
}))
vi.mock('@/lib/payments/mercado-pago/marketplace-store', () => ({
  getEffectiveMpAuth: async () => ({ accessToken: 'APP_USR-x', source: 'env' }),
}))
vi.mock('@/lib/payments/config', () => ({
  getPaymentConfig: () => ({ mp: { env: 'production', notificationUrl: 'https://x/webhook', split: { enabled: false, partnerPercent: 0 } } }),
}))

import { MercadoPagoProvider } from '@/lib/payments/mercado-pago/provider'

const base = {
  externalReference: 'ord1',
  amount: 396.76,
  currency: 'BRL' as const,
  description: 'DomineAqui Plus+',
  payerEmail: 'cristiane@example.com',
  payerName: 'Cristiane Souza',
  idempotencyKey: 'k',
  paymentMethodId: 'master',
  cardToken: 'tok',
  installments: 1,
  issuer: '24',
  payerDocumentType: 'CPF' as const,
  payerDocumentNumber: '05232939769',
}

beforeEach(() => {
  create.mockReset()
  create.mockResolvedValue({ id: 1, status: 'approved', payment_type_id: 'credit_card', transaction_amount: 396.76 })
})

describe('MercadoPagoProvider.createPayment — cartão', () => {
  it('cartão próprio: CPF do comprador, issuer numérico e device ID no header', async () => {
    await new MercadoPagoProvider().createPayment({ ...base, deviceId: 'armor.' + 'a'.repeat(300) })
    const { body, requestOptions } = create.mock.calls[0][0]
    expect(body.payer.identification).toEqual({ type: 'CPF', number: '05232939769' })
    expect(body.issuer_id).toBe(24)
    expect(body.transaction_amount).toBe(396.76)
    expect(requestOptions.meliSessionId).toHaveLength(306)
  })

  it('cartão de terceiro: CPF do TITULAR em payer.identification', async () => {
    await new MercadoPagoProvider().createPayment({ ...base, cardholderDocumentNumber: '52998224725' })
    expect(create.mock.calls[0][0].body.payer.identification).toEqual({ type: 'CPF', number: '52998224725' })
  })

  it('sem device ID, não manda header vazio', async () => {
    await new MercadoPagoProvider().createPayment(base)
    expect(create.mock.calls[0][0].requestOptions.meliSessionId).toBeUndefined()
  })
})
