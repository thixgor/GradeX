import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ObjectId } from 'mongodb'
import { NextRequest } from 'next/server'

/**
 * Cobrança dupla por "falha" que não era falha. Antes, qualquer erro depois de
 * criar a order virava `rejected` + 502: com o cartão já aprovado no MP (erro
 * nosso depois) ou com o resultado incerto (timeout), a tela mandava o
 * comprador tentar de novo — e ele pagava duas vezes.
 */

const createPayment = vi.fn()
const findPaymentByExternalReference = vi.fn()
const applyPaymentResult = vi.fn()

vi.mock('@/lib/auth', () => ({ getSession: async () => null }))
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

const orderUpdates: any[] = []
vi.mock('@/lib/mongodb', () => ({
  getDb: async () => ({
    collection: () => ({
      findOne: async () => null,
      insertOne: async () => ({ insertedId: new ObjectId() }),
      updateOne: async (_q: any, u: any) => {
        orderUpdates.push(u)
        return { modifiedCount: 1 }
      },
    }),
  }),
}))

const aprovado = { providerOrderId: 'mp-777', status: 'approved', paymentMethod: 'credit_card', amount: 396.76, currency: 'BRL' }

async function post() {
  const { POST } = await import('@/app/api/serial-keys/checkout/route')
  const req = new NextRequest('http://localhost/api/serial-keys/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      productType: 'plus',
      planKey: 'semestral',
      buyerName: 'Cristiane Souza',
      buyerEmail: 'cristiane@example.com',
      buyerPhone: '(21) 99999-9999',
      payerDocumentType: 'CPF',
      payerDocumentNumber: '05232939769',
      paymentMethodId: 'master',
      cardToken: 'tok',
      installments: 1,
    }),
  })
  const res = await POST(req)
  return { status: res.status, data: await res.json() }
}

/** O que a rota gravou como status final da order (último $set com status). */
function ultimoStatusGravado() {
  const sets = orderUpdates.map(u => u?.$set).filter(s => s && 'status' in s)
  return sets[sets.length - 1] || null
}

beforeEach(() => {
  createPayment.mockReset()
  findPaymentByExternalReference.mockReset()
  applyPaymentResult.mockReset()
  applyPaymentResult.mockResolvedValue({ applied: true, order: { status: 'approved' } })
  orderUpdates.length = 0
})

describe('falha na criação do pagamento com cartão', () => {
  it('cartão aprovado + erro NOSSO depois: não diz "falha" e não marca como recusado', async () => {
    createPayment.mockResolvedValue(aprovado)
    applyPaymentResult.mockRejectedValueOnce(new Error('Mongo caiu'))

    const { status, data } = await post()

    expect(status).toBe(200)
    expect(data.status).toBe('in_process')
    expect(data.statusDetail).toBe('provider_confirming')
    expect(data.providerPaymentId).toBe('mp-777')
    expect(data.successRedirect).toContain('/')
    // Volta para pending com o id do MP: o polling refaz a transição e os efeitos.
    expect(ultimoStatusGravado()).toMatchObject({ status: 'pending', providerPaymentId: 'mp-777' })
    expect(orderUpdates.some(u => u?.$set?.status === 'rejected')).toBe(false)
  })

  it('timeout do MP e o pagamento EXISTE: acha pelo id da order e aplica', async () => {
    createPayment.mockRejectedValue(Object.assign(new Error('network timeout'), { type: 'request-timeout' }))
    findPaymentByExternalReference.mockResolvedValue(aprovado)

    const { status, data } = await post()

    expect(status).toBe(200)
    expect(data.status).toBe('approved')
    expect(findPaymentByExternalReference).toHaveBeenCalledTimes(1)
    expect(applyPaymentResult).toHaveBeenCalledWith(expect.any(String), aprovado)
    expect(orderUpdates.some(u => u?.$set?.status === 'rejected')).toBe(false)
  })

  it('timeout do MP e o pagamento ainda não aparece: fica aguardando confirmação', async () => {
    createPayment.mockRejectedValue(new Error('socket hang up'))
    findPaymentByExternalReference.mockResolvedValue(null)

    const { status, data } = await post()

    expect(status).toBe(200)
    expect(data.status).toBe('in_process')
    expect(data.statusDetail).toBe('provider_unconfirmed')
    expect(ultimoStatusGravado()).toMatchObject({ status: 'pending', statusDetail: 'provider_unconfirmed' })
  })

  it('5xx do MP também é incerto', async () => {
    createPayment.mockRejectedValue({ status: 503, message: 'service unavailable' })
    findPaymentByExternalReference.mockResolvedValue(null)
    const { data } = await post()
    expect(data.statusDetail).toBe('provider_unconfirmed')
  })

  it('erro de validação do MP (4xx) é definitivo: recusa como antes, com a mensagem', async () => {
    createPayment.mockRejectedValue({ status: 400, message: 'Invalid card_token_id', cause: [{ code: 2006 }] })

    const { status, data } = await post()

    expect(status).toBe(502)
    expect(data.error).toBeTruthy()
    expect(findPaymentByExternalReference).not.toHaveBeenCalled()
    expect(ultimoStatusGravado()).toMatchObject({ status: 'rejected', statusDetail: 'provider_error' })
  })
})
