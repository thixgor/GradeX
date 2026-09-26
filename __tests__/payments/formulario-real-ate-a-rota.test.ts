import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ObjectId } from 'mongodb'
import { NextRequest } from 'next/server'
import corpo from './fixtures/corpo-do-formulario-celular.json'

/**
 * Ponta a ponta do /comprar do Plus+: o corpo abaixo NÃO foi escrito à mão —
 * foi gerado pelo formulário real (components/payments/mercado-pago-checkout.tsx)
 * rodando num Chromium com tela e user-agent de Android, com o device ID longo
 * que o antifraude gera no celular. Aqui ele entra na rota real, com a
 * resolução real do plano (`productType=premium&productId=<tipo>`, o link que
 * a oferta do Plus+ usa). Só o banco e o Mercado Pago são dublês.
 */

const createPayment = vi.fn()
vi.mock('@/lib/auth', () => ({ getSession: async () => null }))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: async () => ({ success: true }) }))
vi.mock('@/lib/payments', () => ({
  getPaymentProvider: () => ({ createPayment: (...a: any[]) => createPayment(...a) }),
  deriveIdempotencyKey: (id: string) => `idem-${id}`,
}))
vi.mock('@/lib/payments/effects', () => ({ applyPaymentResult: async () => ({ applied: true }) }))
vi.mock('@/lib/payments/audit', () => ({ audit: async () => undefined }))
vi.mock('@/lib/analytics', () => ({
  getRequestAnalyticsMeta: () => ({}),
  recordOrderCheckoutEvent: async () => undefined,
}))
vi.mock('@/lib/serial-keys', async importOriginal => {
  const original = await importOriginal<typeof import('@/lib/serial-keys')>()
  return { ...original, logSerialKeySecurity: async () => undefined, findAccountByEmail: async () => null }
})
vi.mock('@/lib/mongodb', () => ({
  getDb: async () => ({
    collection: (name: string) => ({
      findOne: async () =>
        name === 'admin_settings'
          ? { planos: [{ tipo: 'plus_semestral', nome: 'DomineAqui Plus+', periodo: 'Semestral', preco: 377, role: 'plus', durationMonths: 6 }] }
          : null,
      insertOne: async () => ({ insertedId: new ObjectId() }),
      updateOne: async () => ({ modifiedCount: 1 }),
    }),
  }),
}))

beforeEach(() => {
  createPayment.mockReset()
  createPayment.mockResolvedValue({ providerOrderId: '1', status: 'approved', paymentMethod: 'credit_card', amount: 396.76, currency: 'BRL' })
})

describe('formulário real (celular) → rota real do /comprar', () => {
  it('o corpo gerado no celular passa na validação e chega ao Mercado Pago com o valor da tela', async () => {
    expect((corpo as any).deviceId.length).toBeGreaterThan(200)

    const { POST } = await import('@/app/api/serial-keys/checkout/route')
    const res = await POST(
      new NextRequest('http://localhost/api/serial-keys/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(corpo),
      })
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.status).toBe('approved')
    const input = createPayment.mock.calls[0][0]
    // O botão do formulário mostrou R$ 396,76 — é o que vai ao MP.
    expect(input.amount).toBe(396.76)
    expect(input.paymentMethodId).toBe('master')
    expect(input.installments).toBe(1)
    expect(input.issuer).toBe('24')
    expect(input.deviceId).toBe((corpo as any).deviceId)
    expect(input.payerDocumentNumber).toBe('05232939769')
    expect(input.description).toBe('DomineAqui Plus+ — Semestral')
  })
})
