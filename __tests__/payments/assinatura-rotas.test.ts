import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ObjectId } from 'mongodb'
import { NextRequest } from 'next/server'

/** Rotas reais: webhook de renovação, criação de assinatura, /tier-limits e crons. */

const getPreapproval = vi.fn()
const createPreapproval = vi.fn()
const findPreapprovalByExternalReference = vi.fn()
const getPayment = vi.fn()
const validateWebhook = vi.fn()
vi.mock('@/lib/payments', () => ({
  getPaymentProvider: () => ({
    getPreapproval: (...a: any[]) => getPreapproval(...a),
    createPreapproval: (...a: any[]) => createPreapproval(...a),
    findPreapprovalByExternalReference: (...a: any[]) => findPreapprovalByExternalReference(...a),
    getPayment: (...a: any[]) => getPayment(...a),
    validateWebhook: (...a: any[]) => validateWebhook(...a),
    cancelPreapproval: vi.fn(),
  }),
}))
vi.mock('@/lib/payments/audit', () => ({ audit: vi.fn() }))
vi.mock('@/lib/payments/effects', () => ({ applyPaymentResult: vi.fn() }))
vi.mock('@/lib/plus-claims', () => ({ restorePlusClaims: vi.fn(async () => ({ count: 0, items: [] })), revokePlusClaims: vi.fn(async () => ({ count: 0 })) }))
vi.mock('@/lib/cargos-server', () => ({ contaEhPaga: async (t?: string | null) => t === 'plus', idsDeCargosPagos: async () => ['plus'] }))
vi.mock('@/lib/plus-guard', () => ({ checkRefundCooldown: async () => ({ blocked: false }) }))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: vi.fn(async () => ({ success: true })) }))
vi.mock('@/lib/analytics', () => ({ getRequestAnalyticsMeta: () => ({}), recordSubscriptionCheckoutEvent: vi.fn() }))
vi.mock('@/lib/mail', () => ({ sendOneTimePaymentEndedEmail: vi.fn(async () => {}), sendSubscriptionCancelledEmail: vi.fn(async () => {}) }))

const userId = new ObjectId()
const sessao = vi.fn()
vi.mock('@/lib/auth', () => ({ getSession: () => sessao() }))

const estado: any = {}
function resetar() {
  estado.user = { _id: userId, email: 'a@x.com', name: 'A', accountType: 'plus', premiumExpiresAt: new Date(Date.now() - 86_400_000), mercadoPagoPreapprovalId: 'pre-1' }
  estado.subs = [{ _id: 'sub1', userId: String(userId), planId: 'plus_mensal', role: 'plus', providerSubscriptionId: 'pre-1', status: 'authorized', cancelAtPeriodEnd: false, currentPeriodEndsAt: new Date(Date.now() - 86_400_000), createdAt: new Date() }]
  estado.userUpdates = [] as any[]
  estado.subsInserted = [] as any[]
  estado.lastSubQuery = null
}
vi.mock('@/lib/mongodb', () => ({
  getDb: async () => ({
    collection: (name: string) => ({
      findOne: async (q: any) => {
        if (name === 'users') return estado.user
        if (name === 'admin_settings') return { planos: [{ tipo: 'plus_mensal', nome: 'Plus+', periodo: 'Mensal', preco: 39.9, role: 'plus', durationMonths: 1 }] }
        if (name === 'subscriptions') {
          estado.lastSubQuery = q
          if (q.providerSubscriptionId) return estado.subs.find((s: any) => s.providerSubscriptionId === q.providerSubscriptionId) || null
          if (q.status === 'authorized') return estado.subs.find((s: any) => s.status === 'authorized' && !s.cancelAtPeriodEnd) || null
          if (q.$or) return null
          return null
        }
        if (name === 'payment_orders') return null
        return null
      },
      updateOne: async (q: any, u: any) => {
        if (name === 'users') { estado.userUpdates.push(u.$set); Object.assign(estado.user, u.$set) }
        if (name === 'subscriptions') Object.assign(estado.subs.find((s: any) => s._id === q._id) || {}, u.$set)
        return { matchedCount: 1 }
      },
      insertOne: async (d: any) => { if (name === 'subscriptions') estado.subsInserted.push(d); return { insertedId: new ObjectId() } },
      countDocuments: async () => 0,
    }),
  }),
}))

beforeEach(() => {
  resetar()
  for (const f of [getPreapproval, createPreapproval, findPreapprovalByExternalReference, getPayment, validateWebhook]) f.mockReset()
  sessao.mockResolvedValue({ userId: String(userId), email: 'a@x.com', name: 'A', role: 'user' })
})

describe('webhook: cobrança de renovação estende o acesso', () => {
  it('pagamento de renovação (sem order nossa) sincroniza a assinatura', async () => {
    validateWebhook.mockResolvedValue({ valid: true, topic: 'payment', resourceId: '555', eventId: 'e1' })
    getPayment.mockResolvedValue({ status: 'approved', raw: { id: 555, metadata: { preapproval_id: 'pre-1' } } })
    getPreapproval.mockResolvedValue({ status: 'authorized', nextBillingAt: new Date(Date.now() + 30 * 86_400_000) })

    const { POST } = await import('@/app/api/webhooks/mercadopago/route')
    const res = await POST(new NextRequest('http://x/api/webhooks/mercadopago?type=payment&data.id=555', { method: 'POST', body: '{}' }))

    expect(res.status).toBe(200)
    expect(getPreapproval).toHaveBeenCalledWith('pre-1')
    expect(estado.user.premiumExpiresAt > new Date(Date.now() + 29 * 86_400_000)).toBe(true)
  })

  it('evento de assinatura usa a credencial do provider e estende o acesso', async () => {
    validateWebhook.mockResolvedValue({ valid: true, topic: 'subscription_preapproval', resourceId: 'pre-1', eventId: 'e2' })
    getPreapproval.mockResolvedValue({ status: 'authorized', nextBillingAt: new Date(Date.now() + 30 * 86_400_000) })
    const { POST } = await import('@/app/api/webhooks/mercadopago/route')
    const res = await POST(new NextRequest('http://x/api/webhooks/mercadopago?type=subscription_preapproval&data.id=pre-1', { method: 'POST', body: '{}' }))
    expect(res.status).toBe(200)
    expect(getPreapproval).toHaveBeenCalledWith('pre-1')
    expect(estado.user.premiumExpiresAt > new Date()).toBe(true)
  })
})

describe('/api/user/tier-limits não rebaixa assinante em dia', () => {
  it('data vencida + assinatura autorizada: continua Plus+', async () => {
    getPreapproval.mockResolvedValue({ status: 'authorized', nextBillingAt: new Date(Date.now() + 25 * 86_400_000) })
    const { GET } = await import('@/app/api/user/tier-limits/route')
    await GET(new NextRequest('http://x/api/user/tier-limits'))
    expect(estado.userUpdates.some((u: any) => u.accountType === 'gratuito')).toBe(false)
    expect(estado.user.accountType).toBe('plus')
  })

  it('data vencida sem assinatura: rebaixa como antes', async () => {
    estado.subs = []
    const { GET } = await import('@/app/api/user/tier-limits/route')
    await GET(new NextRequest('http://x/api/user/tier-limits'))
    expect(estado.userUpdates.some((u: any) => u.accountType === 'gratuito')).toBe(true)
  })
})

describe('/api/subscriptions (criar)', () => {
  const criar = async () => {
    const { POST } = await import('@/app/api/subscriptions/route')
    const res = await POST(new NextRequest('http://x/api/subscriptions', { method: 'POST', body: JSON.stringify({ planId: 'plus_mensal', cardTokenId: 'tok' }) }))
    return { status: res.status, data: await res.json() }
  }
  beforeEach(() => { estado.subs = [] })

  it('cartão recusado pelo MP: 400 com mensagem, nada gravado (antes: 500 sem corpo)', async () => {
    createPreapproval.mockRejectedValue({ status: 400, message: 'CC_VAL_433 Credit card validation has failed', cause: [{ code: 'CC_VAL_433' }] })
    const { status, data } = await criar()
    expect(status).toBe(400)
    expect(data.error).toMatch(/recusou o cartão/)
    expect(estado.subsInserted).toHaveLength(0)
  })

  it('timeout mas a assinatura existe no MP: acha pela referência e libera', async () => {
    createPreapproval.mockRejectedValue(new Error('network timeout'))
    findPreapprovalByExternalReference.mockResolvedValue({ providerSubscriptionId: 'pre-9', status: 'authorized', nextBillingAt: new Date(Date.now() + 30 * 86_400_000) })
    const { status, data } = await criar()
    expect(status).toBe(200)
    expect(data.status).toBe('authorized')
    expect(estado.subsInserted[0].providerSubscriptionId).toBe('pre-9')
    expect(estado.user.accountType).toBe('plus')
  })

  it('pending antigo não bloqueia mais: só conta pending recente', async () => {
    createPreapproval.mockResolvedValue({ providerSubscriptionId: 'pre-2', status: 'authorized', nextBillingAt: new Date(Date.now() + 30 * 86_400_000) })
    await criar()
    const q = estado.lastSubQuery
    expect(q.$or).toEqual([{ status: 'authorized' }, { status: 'pending', createdAt: { $gte: expect.any(Date) } }])
  })

  it('acesso gravado já com a folga além da próxima cobrança', async () => {
    const proxima = new Date(Date.now() + 30 * 86_400_000)
    createPreapproval.mockResolvedValue({ providerSubscriptionId: 'pre-2', status: 'authorized', nextBillingAt: proxima })
    await criar()
    // Próxima cobrança + 3 dias de folga (antes: exatamente +1 mês, que vencia no dia da cobrança).
    expect(estado.user.premiumExpiresAt.getTime()).toBeGreaterThanOrEqual(proxima.getTime() + 3 * 86_400_000)
  })
})

describe('autenticação dos crons', () => {
  const original = process.env.CRON_SECRET
  it('com CRON_SECRET: cabeçalho x-vercel-cron sozinho NÃO basta; o Bearer da Vercel basta', async () => {
    process.env.CRON_SECRET = 'segredo'
    const { isCronAuthorized } = await import('@/lib/cron-auth')
    expect(isCronAuthorized(new NextRequest('http://x/api/cron/y', { headers: { 'x-vercel-cron': '1' } }))).toBe(false)
    expect(isCronAuthorized(new NextRequest('http://x/api/cron/y', { headers: { authorization: 'Bearer segredo' } }))).toBe(true)
    expect(isCronAuthorized(new NextRequest('http://x/api/cron/y', { headers: { authorization: 'Bearer errado' } }))).toBe(false)
    process.env.CRON_SECRET = original
  })
  it('sem CRON_SECRET: segue aceitando o cabeçalho (não para as rotinas)', async () => {
    delete process.env.CRON_SECRET
    const { isCronAuthorized } = await import('@/lib/cron-auth')
    expect(isCronAuthorized(new NextRequest('http://x/api/cron/y', { headers: { 'x-vercel-cron': '1' } }))).toBe(true)
    expect(isCronAuthorized(new NextRequest('http://x/api/cron/y'))).toBe(false)
    if (original !== undefined) process.env.CRON_SECRET = original
  })
  it('as rotas de cron de pagamento usam a regra única', async () => {
    process.env.CRON_SECRET = 'segredo'
    for (const rota of ['subscriptions-sweeper', 'payments-sweeper', 'raffles-sweeper', 'fulfillment-sweeper']) {
      const { GET } = await import(`@/app/api/cron/${rota}/route`)
      const res = await GET(new NextRequest(`http://x/api/cron/${rota}`, { headers: { 'x-vercel-cron': '1' } }))
      expect([rota, res.status]).toEqual([rota, 401])
    }
    process.env.CRON_SECRET = original
  })
})
