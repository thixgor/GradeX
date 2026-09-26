import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ObjectId } from 'mongodb'
import { NextRequest } from 'next/server'

/**
 * /buy/checkout → /api/payments/orders: Plus+ comprado LOGADO, no cartão.
 * Mesmo corpo que o formulário monta, incluindo o device ID longo do celular
 * e o CPF do titular quando o cartão é de outra pessoa.
 */

const createPayment = vi.fn()
const findPaymentByExternalReference = vi.fn()
const applyPaymentResult = vi.fn()
const userId = new ObjectId()

vi.mock('@/lib/auth', () => ({
  getSession: async () => ({ userId: String(userId), email: 'aluna@example.com', name: 'Aluna Teste', role: 'user' }),
}))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: async () => ({ success: true }) }))
vi.mock('@/lib/payments', () => ({
  getPaymentProvider: () => ({
    createPayment: (...a: any[]) => createPayment(...a),
    findPaymentByExternalReference: (...a: any[]) => findPaymentByExternalReference(...a),
  }),
  deriveIdempotencyKey: (id: string) => `idem-${id}`,
}))
vi.mock('@/lib/payments/effects', () => ({ applyPaymentResult: (...a: any[]) => applyPaymentResult(...a) }))
vi.mock('@/lib/payments/audit', () => ({ audit: async () => undefined }))
vi.mock('@/lib/payments/duplicate-guard', () => ({ pagamentoEmCartaoJaAberto: async () => null, minutosDesde: () => 0 }))
vi.mock('@/lib/analytics', () => ({
  getRequestAnalyticsMeta: () => ({}),
  recordOrderCheckoutEvent: async () => undefined,
}))
vi.mock('@/lib/prouni-fies', async importOriginal => {
  const original = await importOriginal<typeof import('@/lib/prouni-fies')>()
  return { ...original, resolveProuniForCheckout: async () => null }
})

const updates: any[] = []
vi.mock('@/lib/mongodb', () => ({
  getDb: async () => ({
    collection: (name: string) => ({
      findOne: async (q: any) => {
        if (name === 'admin_settings') {
          return { planos: [{ tipo: 'plus_semestral', preco: 377, nome: 'DomineAqui Plus+', periodo: 'Semestral' }] }
        }
        // Perfil sem CPF; nenhuma outra conta com o CPF informado.
        if (name === 'users') return q?.cpf ? null : { _id: userId }
        return null
      },
      insertOne: async () => ({ insertedId: new ObjectId() }),
      updateOne: async (_q: any, u: any) => {
        updates.push(u)
        return { modifiedCount: 1 }
      },
    }),
  }),
}))

const DEVICE_ID = 'armor.' + 'b'.repeat(260)

async function post(extra: Record<string, unknown> = {}) {
  const { POST } = await import('@/app/api/payments/orders/route')
  const req = new NextRequest('http://localhost/api/payments/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      type: 'plan',
      refId: 'plus_semestral',
      payerDocumentType: 'CPF',
      payerDocumentNumber: '05232939769',
      paymentMethodId: 'visa',
      cardToken: 'tok',
      installments: 1,
      issuer: 25,
      deviceId: DEVICE_ID,
      ...extra,
    }),
  })
  const res = await POST(req)
  return { status: res.status, data: await res.json() }
}

beforeEach(() => {
  createPayment.mockReset()
  findPaymentByExternalReference.mockReset()
  applyPaymentResult.mockReset()
  applyPaymentResult.mockResolvedValue({ applied: true, order: { status: 'approved' } })
  createPayment.mockResolvedValue({ providerOrderId: '1', status: 'approved', paymentMethod: 'credit_card', amount: 396.76, currency: 'BRL' })
  updates.length = 0
})

describe('Plus+ logado no cartão (/api/payments/orders)', () => {
  it('à vista: chega ao MP com R$ 396,76, device ID longo e issuer numérico', async () => {
    const { status, data } = await post()
    expect(status).toBe(200)
    expect(data.status).toBe('approved')
    const input = createPayment.mock.calls[0][0]
    expect(input.amount).toBe(396.76)
    expect(input.deviceId).toBe(DEVICE_ID)
    expect(input.issuer).toBe('25')
  })

  it('cartão de outra pessoa: CPF do titular chega ao provider', async () => {
    await post({ cardholderDocumentNumber: '529.982.247-25' })
    expect(createPayment.mock.calls[0][0].cardholderDocumentNumber).toBe('52998224725')
  })

  it('timeout do MP não vira "falha" nem recusa', async () => {
    createPayment.mockRejectedValue(new Error('network timeout'))
    findPaymentByExternalReference.mockResolvedValue(null)
    const { status, data } = await post()
    expect(status).toBe(200)
    expect(data.statusDetail).toBe('provider_unconfirmed')
    expect(updates.some(u => u?.$set?.status === 'rejected')).toBe(false)
  })
})
