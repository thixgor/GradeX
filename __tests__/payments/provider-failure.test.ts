import { describe, it, expect, vi, beforeEach } from 'vitest'

const findPaymentByExternalReference = vi.fn()
const applyPaymentResult = vi.fn()
vi.mock('@/lib/payments', () => ({
  getPaymentProvider: () => ({ findPaymentByExternalReference: (...a: any[]) => findPaymentByExternalReference(...a) }),
}))
vi.mock('@/lib/payments/effects', () => ({ applyPaymentResult: (...a: any[]) => applyPaymentResult(...a) }))

import {
  isAmbiguousProviderError,
  resolveUnconfirmedOrder,
  PROVIDER_UNCONFIRMED,
} from '@/lib/payments/provider-failure'
import { MercadoPagoPaymentError } from '@/lib/payments/mercado-pago/errors'

describe('isAmbiguousProviderError', () => {
  it('timeout, conexão caída, erro desconhecido e 5xx: incerto', () => {
    expect(isAmbiguousProviderError(new Error('network timeout'))).toBe(true)
    expect(isAmbiguousProviderError(undefined)).toBe(true)
    expect(isAmbiguousProviderError({ status: 500 })).toBe(true)
    expect(isAmbiguousProviderError({ status: 502, message: 'bad gateway' })).toBe(true)
  })
  it('resposta da API (4xx, causas, erro já traduzido): definitivo', () => {
    expect(isAmbiguousProviderError({ status: 400, cause: [{ code: 2006 }] })).toBe(false)
    expect(isAmbiguousProviderError({ status: 401 })).toBe(false)
    expect(isAmbiguousProviderError({ message: 'x', cause: [{ code: 3034 }] })).toBe(false)
    expect(isAmbiguousProviderError(new MercadoPagoPaymentError('CPF', {}))).toBe(false)
  })
})

describe('resolveUnconfirmedOrder', () => {
  const base = { _id: 'o1', status: 'pending', statusDetail: PROVIDER_UNCONFIRMED, amount: 10, currency: 'BRL' }
  beforeEach(() => {
    findPaymentByExternalReference.mockReset()
    applyPaymentResult.mockReset()
    applyPaymentResult.mockImplementation(async (_id: string, r: any) => ({ applied: true, order: { status: r.status } }))
  })

  it('pagamento apareceu no MP: aplica', async () => {
    findPaymentByExternalReference.mockResolvedValue({ providerOrderId: '1', status: 'approved' })
    const r = await resolveUnconfirmedOrder({ ...base, createdAt: new Date(), updatedAt: new Date() } as any)
    expect(r?.status).toBe('approved')
  })

  it('dentro da janela e sem pagamento: não decide ainda', async () => {
    findPaymentByExternalReference.mockResolvedValue(null)
    const r = await resolveUnconfirmedOrder({ ...base, createdAt: new Date(), updatedAt: new Date() } as any)
    expect(r).toBeNull()
    expect(applyPaymentResult).not.toHaveBeenCalled()
  })

  it('janela vencida sem pagamento: recusa (libera cupom via applyPaymentResult)', async () => {
    findPaymentByExternalReference.mockResolvedValue(null)
    const antigo = new Date(Date.now() - 5 * 60_000)
    const r = await resolveUnconfirmedOrder({ ...base, createdAt: antigo, updatedAt: antigo } as any)
    expect(r?.status).toBe('rejected')
    expect(applyPaymentResult.mock.calls[0][1]).toMatchObject({ status: 'rejected', statusDetail: 'provider_error' })
  })

  it('busca falhando dentro da janela não recusa', async () => {
    findPaymentByExternalReference.mockRejectedValue(new Error('rede'))
    const r = await resolveUnconfirmedOrder({ ...base, createdAt: new Date(), updatedAt: new Date() } as any)
    expect(r).toBeNull()
  })

  it('ignora order que não está aguardando confirmação', async () => {
    expect(await resolveUnconfirmedOrder({ ...base, statusDetail: 'x' } as any)).toBeNull()
    expect(await resolveUnconfirmedOrder({ ...base, providerPaymentId: '9' } as any)).toBeNull()
  })
})
