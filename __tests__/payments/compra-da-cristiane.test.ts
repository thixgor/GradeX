import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ObjectId } from 'mongodb'
import { NextRequest } from 'next/server'

/**
 * Reproduz, pela rota de verdade, a compra que falhou em produção: Plus+ no
 * /comprar, cartão de crédito à vista (R$ 377,00 + 4,98% = R$ 396,76), CPF
 * 052.329.397-69, pelo celular. Três cartões diferentes deram "Dados inválidos"
 * — a recusa era do NOSSO schema, por causa do device ID do antifraude.
 */

const createPayment = vi.fn()
const session = vi.fn()

vi.mock('@/lib/auth', () => ({ getSession: () => session() }))
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
  return {
    ...original,
    logSerialKeySecurity: async () => undefined,
    findAccountByEmail: async () => null,
    resolveSerialKeyProduct: async () => ({
      productType: 'plus',
      productId: 'plus_semestral',
      productTitle: 'DomineAqui Plus+',
      description: 'DomineAqui Plus+',
      amount: 377,
      grant: { kind: 'plus', planKey: 'semestral' },
    }),
  }
})

const users = new Map<string, any>()
const escritas: string[] = []
vi.mock('@/lib/mongodb', () => ({
  getDb: async () => ({
    collection: (name: string) => ({
      findOne: async (q: any) => {
        if (name !== 'users') return null
        if (q?._id) return users.get(String(q._id)) || null
        return null
      },
      insertOne: async () => {
        escritas.push(`insert:${name}`)
        return { insertedId: new ObjectId() }
      },
      updateOne: async () => {
        escritas.push(`update:${name}`)
        return { modifiedCount: 1 }
      },
    }),
  }),
}))

const DEVICE_ID_LONGO = 'armor.' + 'a1b2c3d4e5f6'.repeat(20) + '.' + '9f8e7d6c'.repeat(4)

function corpoDoCelular(extra: Record<string, unknown> = {}) {
  // Exatamente o que components/payments/mercado-pago-checkout.tsx monta.
  return {
    productType: 'plus',
    planKey: 'semestral',
    buyerName: 'Cristiane Souza',
    buyerEmail: 'cristiane@example.com',
    buyerPhone: '(21) 99999-9999',
    payerDocumentType: 'CPF',
    payerDocumentNumber: '05232939769',
    paymentMethodId: 'master',
    cardToken: 'tok_123',
    installments: 1,
    issuer: '24',
    deviceId: DEVICE_ID_LONGO,
    ...extra,
  }
}

async function post(body: unknown) {
  const { POST } = await import('@/app/api/serial-keys/checkout/route')
  const req = new NextRequest('http://localhost/api/serial-keys/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '200.1.2.3' },
    body: JSON.stringify(body),
  })
  const res = await POST(req)
  return { status: res.status, data: await res.json() }
}

beforeEach(() => {
  createPayment.mockReset()
  createPayment.mockResolvedValue({ providerOrderId: '999', status: 'approved', paymentMethod: 'credit_card', amount: 396.76 })
  session.mockReset()
  session.mockResolvedValue(null)
  users.clear()
  escritas.length = 0
})

describe('compra da Cristiane (Plus+ no cartão, pelo celular)', () => {
  it('o device ID dela passa de 200 caracteres — era isso que o schema antigo recusava', () => {
    expect(DEVICE_ID_LONGO.length).toBeGreaterThan(200)
  })

  it('sem login: o pagamento chega ao Mercado Pago e é aprovado', async () => {
    const { status, data } = await post(corpoDoCelular())
    expect(status).toBe(200)
    expect(data.status).toBe('approved')
    expect(createPayment).toHaveBeenCalledTimes(1)
    const input = createPayment.mock.calls[0][0]
    expect(input.amount).toBe(396.76)
    expect(input.installments).toBe(1)
    expect(input.deviceId).toBe(DEVICE_ID_LONGO)
    expect(input.issuer).toBe('24')
    expect(input.payerDocumentNumber).toBe('05232939769')
  })

  it('logada, com o CPF sendo vinculado ao perfil agora', async () => {
    const id = new ObjectId()
    users.set(String(id), { _id: id })
    session.mockResolvedValue({ userId: String(id), email: 'cristiane@example.com', name: 'Cristiane Souza' })
    const { status } = await post(corpoDoCelular())
    expect(status).toBe(200)
    expect(createPayment).toHaveBeenCalledTimes(1)
  })

  it('três cartões seguidos (bandeiras diferentes) — todos chegam ao Mercado Pago', async () => {
    for (const [paymentMethodId, issuer] of [['master', '24'], ['visa', 25], ['elo', '687']] as const) {
      const { status } = await post(corpoDoCelular({ paymentMethodId, issuer, cardToken: `tok_${paymentMethodId}` }))
      expect(status).toBe(200)
    }
    expect(createPayment).toHaveBeenCalledTimes(3)
  })

  it('device ID absurdo é descartado — o pagamento segue sem ele', async () => {
    const { status } = await post(corpoDoCelular({ deviceId: 'x'.repeat(10_000) }))
    expect(status).toBe(200)
    expect(createPayment.mock.calls[0][0].deviceId).toBeUndefined()
  })

  it('cartão de outra pessoa: o CPF do titular segue para o Mercado Pago', async () => {
    const { status } = await post(corpoDoCelular({ cardholderDocumentNumber: '52998224725' }))
    expect(status).toBe(200)
    const input = createPayment.mock.calls[0][0]
    expect(input.cardholderDocumentNumber).toBe('52998224725')
    // A nota fiscal continua no nome de quem comprou.
    expect(input.payerDocumentNumber).toBe('05232939769')
  })

  it('campo obrigatório faltando ainda é recusado — e agora diz qual', async () => {
    const { status, data } = await post(corpoDoCelular({ paymentMethodId: undefined }))
    expect(status).toBe(400)
    expect(data.error).toBe('Dados inválidos')
    expect(Object.keys(data.details.fieldErrors)).toContain('paymentMethodId')
    expect(createPayment).not.toHaveBeenCalled()
  })

  it('as tentativas recusadas antes não deixam rastro: nada gravado, nada no MP, e a próxima compra passa', async () => {
    // O que aconteceu com ela: o corpo era recusado na validação. Isso ocorre
    // ANTES de qualquer escrita no banco e de qualquer chamada ao Mercado
    // Pago — não sobra pedido pendente, cupom reservado nem tentativa no
    // cartão que possa bloquear ou pesar contra a compra de agora.
    for (let i = 0; i < 3; i++) {
      const { status } = await post(corpoDoCelular({ paymentMethodId: '' }))
      expect(status).toBe(400)
    }
    expect(escritas.filter(e => e.includes('payment_orders') || e.includes('coupon'))).toEqual([])
    expect(createPayment).not.toHaveBeenCalled()

    const { status, data } = await post(corpoDoCelular())
    expect(status).toBe(200)
    expect(data.status).toBe('approved')
    expect(createPayment).toHaveBeenCalledTimes(1)
  })
})
