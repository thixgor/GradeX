import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ObjectId } from 'mongodb'
import { NextRequest } from 'next/server'

/**
 * Ponta a ponta: a rota REAL do /buy + o provider REAL + o `applyPaymentResult`
 * REAL. Só o SDK do Mercado Pago e o banco são dublês (o banco guarda estado
 * de verdade). Prova que uma recusa de cartão chega ao log do Analytics
 * por onde passa na produção — e que o checkout responde igual ao de antes.
 */

const userId = new ObjectId()
const TOKEN_DO_CARTAO = 'tok-secreto-do-cartao-123'

// ── Mercado Pago (só o SDK) ─────────────────────────────────────────────────
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

// ── O resto do mundo ────────────────────────────────────────────────────────
vi.mock('@/lib/auth', () => ({ getSession: async () => ({ userId: String(userId), email: 'aluna@exemplo.com', name: 'Aluna Teste', role: 'user' }) }))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: async () => ({ success: true }) }))
vi.mock('@/lib/analytics', () => ({ getRequestAnalyticsMeta: () => ({}), recordOrderCheckoutEvent: async () => undefined }))
vi.mock('@/lib/payments/audit', () => ({ audit: async () => undefined }))
vi.mock('@/lib/meta-capi', () => ({ sendMetaCapiEvent: async () => undefined }))
vi.mock('@/lib/embaixadores/servidor', () => ({ registrarVendaDoPedido: async () => undefined, estornarVendaDoPedido: async () => undefined }))
vi.mock('@/lib/prouni-fies', async importOriginal => {
  const original = await importOriginal<typeof import('@/lib/prouni-fies')>()
  return { ...original, resolveProuniForCheckout: async () => null, consumeProuniGrant: async () => undefined, releaseProuniGrant: async () => undefined }
})
vi.mock('@/lib/coupons', async importOriginal => {
  const original = await importOriginal<typeof import('@/lib/coupons')>()
  return { ...original, approveCouponRedemption: async () => undefined, releaseCouponRedemption: async () => undefined }
})

// ── Banco com estado ────────────────────────────────────────────────────────
const pedidos = new Map<string, any>()
const log: Array<{ filtro: any; update: any }> = []
vi.mock('@/lib/mongodb', () => ({
  getDb: async () => ({
    collection: (nome: string) => ({
      findOne: async (q: any) => {
        if (nome === 'admin_settings') return { planos: [{ tipo: 'plus_semestral', preco: 377, nome: 'DomineAqui Plus+', periodo: 'Semestral', role: 'plus', durationMonths: 6 }] }
        if (nome === 'users') return q?.cpf ? null : { _id: userId }
        if (nome === 'payment_orders' && q?._id) return pedidos.get(String(q._id)) ?? null
        return null
      },
      insertOne: async (doc: any) => {
        const id = new ObjectId()
        if (nome === 'payment_orders') pedidos.set(String(id), { ...doc, _id: id })
        return { insertedId: id }
      },
      updateOne: async (filtro: any, update: any) => {
        if (nome === 'card_rejections') {
          log.push({ filtro, update })
          return { matchedCount: 1 }
        }
        if (nome === 'payment_orders' && filtro?._id) {
          const atual = pedidos.get(String(filtro._id))
          if (!atual) return { matchedCount: 0 }
          if ('status' in filtro && filtro.status !== atual.status) return { matchedCount: 0 }
          Object.assign(atual, update.$set)
        }
        return { matchedCount: 1 }
      },
      createIndex: async () => 'ok',
      updateMany: async () => ({ matchedCount: 0 }),
    }),
  }),
}))

async function pagar(extra: Record<string, unknown> = {}) {
  const { POST } = await import('@/app/api/payments/orders/route')
  const res = await POST(
    new NextRequest('http://localhost/api/payments/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'plan',
        refId: 'plus_semestral',
        payerDocumentType: 'CPF',
        payerDocumentNumber: '05232939769',
        paymentMethodId: 'master',
        cardToken: TOKEN_DO_CARTAO,
        installments: 1,
        issuer: 24,
        deviceId: 'armor.' + 'd'.repeat(120),
        ...extra,
      }),
    })
  )
  return { status: res.status, data: await res.json() }
}

const pagamentoRecusado = (status_detail: string) => ({
  id: 987654321,
  status: 'rejected',
  status_detail,
  payment_method_id: 'master',
  payment_type_id: 'credit_card',
  issuer_id: '24',
  installments: 1,
  transaction_amount: 396.76,
  currency_id: 'BRL',
  captured: false,
  live_mode: true,
  card: { first_six_digits: '515590', last_four_digits: '4321' },
  payer: { identification: { type: 'CPF' } },
})

beforeEach(() => {
  create.mockReset()
  pedidos.clear()
  log.length = 0
})

describe('recusa de cartão: rota real → provider real → effects real → log', () => {
  it('o banco recusou: a tela recebe a recusa de sempre E o log recebe a análise completa', async () => {
    create.mockResolvedValue(pagamentoRecusado('cc_rejected_other_reason'))
    const { status, data } = await pagar()

    // O checkout responde como sempre respondeu.
    expect(status).toBe(200)
    expect(data).toMatchObject({ status: 'rejected', statusDetail: 'cc_rejected_other_reason', providerPaymentId: '987654321' })

    // O pedido ficou recusado…
    const pedido = [...pedidos.values()][0]
    expect(pedido.status).toBe('rejected')

    // …e o log tem a recusa, uma vez, com o que o MP respondeu e o que enviamos.
    expect(log).toHaveLength(1)
    expect(log[0].filtro).toEqual({ orderId: String(pedido._id), etapa: 'resultado' })
    expect(log[0].update.$set).toMatchObject({
      etapa: 'resultado',
      origem: 'servidor',
      userId: String(userId),
      email: 'aluna@exemplo.com',
      statusDetail: 'cc_rejected_other_reason',
      valorCobrado: expect.any(Number),
      tecnico: { paymentId: '987654321', bin: '515590', ultimos4: '4321', paymentMethodId: 'master', paymentTypeId: 'credit_card', emissorId: '24' },
      requisicao: { paymentMethodId: 'master', parcelas: 1, emissorEnviado: '24', deviceIdPresente: true, ambiente: 'producao' },
    })
  })

  it('nada sensível chega ao banco: token do cartão, CPF, device ID, e-mail da conta MP', async () => {
    create.mockResolvedValue(pagamentoRecusado('cc_rejected_high_risk'))
    await pagar()
    const gravado = JSON.stringify(log)
    for (const segredo of [TOKEN_DO_CARTAO, '05232939769', 'armor.dddd', 'APP_USR-x']) expect(gravado).not.toContain(segredo)
  })

  it('o cliente sem device ID aparece como "sem device ID" no log', async () => {
    create.mockResolvedValue(pagamentoRecusado('cc_rejected_high_risk'))
    await pagar({ deviceId: undefined })
    expect(log[0].update.$set.requisicao).toMatchObject({ deviceIdPresente: false, deviceIdTamanho: 0 })
  })

  it('a API recusou a CRIAÇÃO (token vencido): o comprador vê a mensagem em português e o log guarda o erro técnico', async () => {
    create.mockRejectedValue({ message: 'Invalid card_token_id', status: 400, cause: [{ code: 2006, description: 'Card Token not found' }] })
    const { status, data } = await pagar()

    expect(status).toBe(502)
    expect(data.error).toContain('Os dados do cartão expiraram')
    expect([...pedidos.values()][0]).toMatchObject({ status: 'rejected', statusDetail: 'provider_error' })

    expect(log).toHaveLength(1)
    expect(log[0].filtro.etapa).toBe('criacao')
    expect(log[0].update.$set).toMatchObject({
      etapa: 'criacao',
      userId: String(userId),
      erro: { status: 400, mensagem: 'Invalid card_token_id', causas: [{ codigo: '2006', descricao: 'Card Token not found' }] },
      requisicao: { parcelas: 1, deviceIdPresente: true },
    })
    expect(JSON.stringify(log)).not.toContain(TOKEN_DO_CARTAO)
  })

  it('pagamento aprovado: nada no log de recusas', async () => {
    create.mockResolvedValue({ ...pagamentoRecusado('accredited'), status: 'approved', date_approved: new Date().toISOString() })
    const { status, data } = await pagar()
    expect(status).toBe(200)
    expect(data.status).toBe('approved')
    expect(log).toHaveLength(0)
  })

  it('Pix com erro de API: o log de CARTÃO não registra', async () => {
    create.mockRejectedValue({ message: 'Invalid users involved', status: 400, cause: [{ code: 2034, description: 'Invalid users involved' }] })
    const { status } = await pagar({ paymentMethodId: 'pix', cardToken: undefined, installments: undefined })
    expect(status).toBe(502)
    expect(log).toHaveLength(0)
  })
})
