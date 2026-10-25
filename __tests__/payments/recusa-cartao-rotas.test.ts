import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'

/**
 * As rotas do log de recusas de cartão: o relato do navegador, a leitura do
 * painel (só admin) e a falha na criação da assinatura.
 */

const sessao = vi.fn()
vi.mock('@/lib/auth', () => ({ getSession: () => sessao() }))
const limite = vi.fn(async () => ({ success: true }))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: (...a: any[]) => (limite as any)(...a) }))
vi.mock('@/lib/analytics', () => ({
  getRequestAnalyticsMeta: (req?: Request) => ({ ip: req?.headers.get('x-forwarded-for')?.split(',')[0]?.trim(), userAgent: req?.headers.get('user-agent') || undefined }),
  recordSubscriptionCheckoutEvent: vi.fn(),
}))

// ── Banco ───────────────────────────────────────────────────────────────────
const inseridos: any[] = []
const upserts: any[] = []
const colecoes: Record<string, any[]> = {}
const consultas: Array<{ colecao: string; filtro: any }> = []
function cursor(itens: any[]) {
  const c: any = { sort: () => c, limit: () => c, project: () => c, toArray: async () => itens }
  return c
}
vi.mock('@/lib/mongodb', () => ({
  getDb: async () => ({
    collection: (nome: string) => ({
      find: (filtro: any) => {
        consultas.push({ colecao: nome, filtro })
        let itens = colecoes[nome] || []
        // A rota faz DUAS consultas em payment_orders; o dublê respeita o filtro de cada uma.
        if (nome === 'payment_orders' && filtro?.$or) itens = itens.filter(p => ['credit_card', 'debit_card'].includes(p.paymentMethod))
        else if (nome === 'payment_orders' && filtro?.status === 'approved') itens = itens.filter(p => p.status === 'approved')
        return cursor(itens)
      },
      findOne: async () => {
        if (nome === 'admin_settings') return { planos: [{ tipo: 'plus_mensal', nome: 'Plus+', periodo: 'Mensal', preco: 39.9, role: 'plus', durationMonths: 1 }] }
        return null
      },
      insertOne: async (doc: any) => (inseridos.push({ colecao: nome, doc }), { insertedId: new ObjectId() }),
      updateOne: async (filtro: any, update: any, opcoes: any) => (upserts.push({ colecao: nome, filtro, update, opcoes }), { matchedCount: 1 }),
      createIndex: async () => 'ok',
    }),
  }),
}))

// ── Assinatura ──────────────────────────────────────────────────────────────
const createPreapproval = vi.fn()
const findPreapprovalByExternalReference = vi.fn()
vi.mock('@/lib/payments', () => ({
  getPaymentProvider: () => ({
    createPreapproval: (...a: any[]) => createPreapproval(...a),
    findPreapprovalByExternalReference: (...a: any[]) => findPreapprovalByExternalReference(...a),
  }),
}))
vi.mock('@/lib/payments/audit', () => ({ audit: vi.fn() }))
vi.mock('@/lib/plus-guard', () => ({ checkRefundCooldown: async () => ({ blocked: false }) }))
vi.mock('@/lib/plus-claims', () => ({ restorePlusClaims: vi.fn(async () => ({ count: 0, items: [] })) }))

const USER = { userId: String(new ObjectId()), email: 'maria@exemplo.com', name: 'Maria', role: 'user' }
const ADMIN = { ...USER, role: 'admin' }

const post = (url: string, corpo: unknown, headers: Record<string, string> = {}) =>
  new NextRequest(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(corpo) })

beforeEach(() => {
  inseridos.length = 0
  upserts.length = 0
  consultas.length = 0
  for (const k of Object.keys(colecoes)) delete colecoes[k]
  sessao.mockReset()
  sessao.mockResolvedValue(USER)
  limite.mockReset()
  limite.mockResolvedValue({ success: true })
  createPreapproval.mockReset()
  findPreapprovalByExternalReference.mockReset()
})

describe('POST /api/analytics/falha-de-cartao', () => {
  const rota = () => import('@/app/api/analytics/falha-de-cartao/route')
  const valido = {
    etapa: 'tokenizacao',
    origemDoFormulario: 'checkout',
    codigos: ['205'],
    mensagem: 'invalid card number',
    bandeira: 'visa',
    bin: '411111',
    ultimos4: '1111',
    parcelas: 3,
    valor: 120.5,
    titularDiferente: false,
    deviceIdPresente: true,
    endpoint: '/api/materiais/checkout',
    produto: 'Combo ME 1',
  }

  it('grava o relato como "navegador", com o comprador da sessão, o IP e o aparelho', async () => {
    const { POST } = await rota()
    const res = await POST(post('http://x/api/analytics/falha-de-cartao', valido, { 'x-forwarded-for': '189.1.2.3', 'user-agent': 'Mozilla/5.0 (iPhone) Instagram' }))
    expect(res.status).toBe(200)
    expect(inseridos).toHaveLength(1)
    expect(inseridos[0].colecao).toBe('card_rejections')
    expect(inseridos[0].doc).toMatchObject({
      etapa: 'tokenizacao',
      origem: 'navegador',
      userId: USER.userId,
      email: 'maria@exemplo.com',
      produto: 'Combo ME 1',
      valorCobrado: 120.5,
      ip: '189.1.2.3',
      userAgent: 'Mozilla/5.0 (iPhone) Instagram',
      navegador: { origemDoFormulario: 'checkout', codigos: ['205'], bin: '411111', ultimos4: '1111', parcelas: 3, deviceIdPresente: true },
    })
  })

  it('sem login também registra (compra sem conta)', async () => {
    sessao.mockResolvedValue(null)
    const { POST } = await rota()
    const res = await POST(post('http://x/api/analytics/falha-de-cartao', valido))
    expect(res.status).toBe(200)
    expect(inseridos[0].doc.userId).toBeUndefined()
  })

  it('só aceita 6 primeiros e 4 últimos dígitos: um número inteiro no BIN é descartado, o relato segue', async () => {
    const { POST } = await rota()
    const res = await POST(post('http://x/api/analytics/falha-de-cartao', { ...valido, bin: '4111111111111111', ultimos4: '11111111111' }))
    expect(res.status).toBe(200)
    expect(inseridos[0].doc.navegador.bin).toBeUndefined()
    expect(inseridos[0].doc.navegador.ultimos4).toBeUndefined()
    expect(JSON.stringify(inseridos[0].doc)).not.toContain('4111111111111111')
  })

  it('apaga número de cartão colado na mensagem', async () => {
    const { POST } = await rota()
    await POST(post('http://x/api/analytics/falha-de-cartao', { ...valido, mensagem: 'invalid number 4111 1111 1111 1111 for card' }))
    expect(inseridos[0].doc.navegador.mensagem).toBe('invalid number […] for card')
  })

  it('valor estranho num campo opcional não derruba o relato', async () => {
    const { POST } = await rota()
    const res = await POST(post('http://x/api/analytics/falha-de-cartao', { ...valido, parcelas: 'muitas', valor: -5, httpStatus: 9999 }))
    expect(res.status).toBe(200)
    expect(inseridos[0].doc.navegador.parcelas).toBeUndefined()
  })

  it('etapa desconhecida: 400 e nada gravado', async () => {
    const { POST } = await rota()
    expect((await POST(post('http://x/api/analytics/falha-de-cartao', { ...valido, etapa: 'resultado' }))).status).toBe(400)
    expect((await POST(post('http://x/api/analytics/falha-de-cartao', { foo: 1 }))).status).toBe(400)
    expect(inseridos).toHaveLength(0)
  })

  it('limite de requisições por IP', async () => {
    limite.mockResolvedValue({ success: false })
    const { POST } = await rota()
    expect((await POST(post('http://x/api/analytics/falha-de-cartao', valido))).status).toBe(429)
    expect(inseridos).toHaveLength(0)
  })
})

describe('GET /api/admin/analytics/recusas-cartao', () => {
  const rota = () => import('@/app/api/admin/analytics/recusas-cartao/route')
  const get = (q = '') => new NextRequest(`http://x/api/admin/analytics/recusas-cartao${q}`)

  it('só admin: comprador comum e visitante recebem 401', async () => {
    const { GET } = await rota()
    expect((await GET(get())).status).toBe(401)
    sessao.mockResolvedValue(null)
    expect((await GET(get())).status).toBe(401)
    expect(consultas).toHaveLength(0)
  })

  it('monta o painel com recusas, aprovação posterior e aparelho', async () => {
    sessao.mockResolvedValue(ADMIN)
    const agora = Date.now()
    colecoes.card_rejections = [
      {
        _id: new ObjectId(), etapa: 'resultado', origem: 'servidor', orderId: 'o1', userId: 'u1', nome: 'Maria', email: 'maria@exemplo.com', produto: 'Combo ME 1',
        valorCobrado: 297.5, statusDetail: 'cc_rejected_high_risk', status: 'rejected',
        tecnico: { paymentMethodId: 'master', bin: '515590', ultimos4: '4321', parcelas: 3 },
        requisicao: { paymentMethodId: 'master', parcelas: 3, valorEnviado: 297.5, emissorEnviado: '24', deviceIdPresente: false, deviceIdTamanho: 0, titularDiferenteDoComprador: false, documentoTipo: 'CPF', splitAtivo: false, tokenDoMarketplace: false, ambiente: 'producao', timeoutMs: 8000, idempotencyKey: 'k', referencia: 'o1' },
        createdAt: new Date(agora - 3_600_000),
      },
    ]
    colecoes.payment_orders = [
      { _id: 'o1', userId: 'u1', payerEmail: 'maria@exemplo.com', createdAt: new Date(agora - 3_600_000), status: 'rejected', paymentMethod: 'credit_card' },
      { _id: 'o2', userId: 'u1', payerEmail: 'maria@exemplo.com', createdAt: new Date(agora - 3_000_000), status: 'approved', paymentMethod: 'pix', paidAt: new Date(agora - 3_000_000), amount: 290 },
      { _id: 'o3', userId: 'u7', payerEmail: 'x@x.com', createdAt: new Date(agora - 7_200_000), status: 'approved', paymentMethod: 'credit_card', paidAt: new Date(agora - 7_200_000), amount: 100 },
    ]
    colecoes.checkout_events = [{ orderId: 'o1', ip: '189.9.9.9', userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/120 Mobile Safari/537' }]

    const { GET } = await rota()
    const res = await GET(get('?dias=7'))
    expect(res.status).toBe(200)
    const corpo = await res.json()

    expect(corpo.dias).toBe(7)
    expect(corpo.resumo).toMatchObject({ total: 1, recuperadas: 1, semDeviceId: 1 })
    expect(corpo.taxaDeRecusa).toEqual({ tentativas: 2, recusadas: 1, aprovadas: 1, percentual: 50 })
    const r = corpo.registros[0]
    expect(r.analise).toMatchObject({ codigo: 'cc_rejected_high_risk', responsavel: 'antifraude' })
    expect(r.recuperada).toMatchObject({ metodo: 'pix', minutos: 10 })
    expect(r.dispositivo).toBe('Celular · Chrome')
    expect(r.ip).toBe('189.9.9.9')
    expect(r.analise.sinais.some((s: any) => s.nivel === 'alerta' && s.texto.includes('device ID NÃO'))).toBe(true)
    expect(corpo.diagnostico.length).toBeGreaterThan(2)
  })

  it('período fora da faixa é ajustado (nunca consulta além de 12 meses)', async () => {
    sessao.mockResolvedValue(ADMIN)
    const { GET } = await rota()
    expect((await (await GET(get('?dias=99999'))).json()).dias).toBe(365)
    expect((await (await GET(get('?dias=abc'))).json()).dias).toBe(30)
    expect((await (await GET(get('?dias=-3'))).json()).dias).toBe(1)
  })
})

describe('POST /api/subscriptions — falha de cartão vai para o log', () => {
  const rota = () => import('@/app/api/subscriptions/route')

  it('o banco recusou a validação do cartão: grava a etapa "assinatura" com o erro técnico e o comprador', async () => {
    createPreapproval.mockRejectedValue({ message: 'CC_VAL_433 Credit card validation has failed', status: 400, cause: [{ code: 'CC_VAL_433', description: 'Credit card validation has failed' }] })
    const { POST } = await rota()
    const res = await POST(post('http://x/api/subscriptions', { planId: 'plus_mensal', cardTokenId: 'tok' }, { 'user-agent': 'Mozilla/5.0 (iPhone) Safari' }))

    expect(res.status).toBe(400)
    const log = inseridos.filter(i => i.colecao === 'card_rejections')
    expect(log).toHaveLength(1)
    expect(log[0].doc).toMatchObject({
      etapa: 'assinatura',
      origem: 'servidor',
      tipoDoPedido: 'subscription',
      userId: USER.userId,
      email: 'maria@exemplo.com',
      produto: 'Plus+ — Mensal',
      erro: { status: 400, causas: [{ codigo: 'CC_VAL_433' }] },
    })
    expect(log[0].doc.valorCobrado).toBeGreaterThanOrEqual(39.9)
    expect(JSON.stringify(log[0].doc)).not.toContain('tok"')
  })

  it('timeout em que a assinatura existia: não é falha, não registra', async () => {
    createPreapproval.mockRejectedValue(new Error('network timeout'))
    findPreapprovalByExternalReference.mockResolvedValue({ providerSubscriptionId: 'pre-9', status: 'authorized', nextBillingAt: new Date() })
    const { POST } = await rota()
    await POST(post('http://x/api/subscriptions', { planId: 'plus_mensal', cardTokenId: 'tok' }))
    expect(inseridos.filter(i => i.colecao === 'card_rejections')).toHaveLength(0)
  })
})
