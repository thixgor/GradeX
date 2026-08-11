import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/**
 * Segurança de /api/payments/public-key.
 *
 * Esta rota é PÚBLICA (sem login) e, desde a correção do pareamento de
 * credenciais, ela lê o documento da conexão de marketplace — que guarda
 * `accessToken` e `refreshToken` do Mercado Pago. Só a public key pode sair
 * daqui; qualquer vazamento de token nesse endpoint entregaria a conta de
 * pagamentos a qualquer visitante.
 *
 * Estes testes exercitam o handler de verdade e inspecionam o corpo da
 * resposta inteiro, em vez de conferir campo por campo — assim um campo novo
 * adicionado por engano no futuro também é pego.
 */

const SEGREDO_ACCESS_TOKEN = 'APP_USR-token-secreto-nao-pode-vazar'
const SEGREDO_REFRESH_TOKEN = 'TG-refresh-secreto-nao-pode-vazar'
const CHAVE_PUBLICA_MARKETPLACE = 'APP_USR-chave-publica-do-marketplace'

const ENV_KEYS = [
  'MERCADOPAGO_ENV',
  'MERCADOPAGO_PUBLIC_KEY',
  'MERCADOPAGO_ACCESS_TOKEN',
  'MERCADOPAGO_WEBHOOK_SECRET',
  'NEXT_PUBLIC_APP_URL',
] as const

const originalEnv: Record<string, string | undefined> = {}

beforeEach(() => {
  for (const key of ENV_KEYS) originalEnv[key] = process.env[key]
  vi.resetModules()
  vi.spyOn(console, 'error').mockImplementation(() => {})

  process.env.MERCADOPAGO_ENV = 'production'
  process.env.MERCADOPAGO_PUBLIC_KEY = 'APP_USR-chave-do-ambiente'
  process.env.MERCADOPAGO_ACCESS_TOKEN = 'APP_USR-token-do-ambiente'
  process.env.MERCADOPAGO_WEBHOOK_SECRET = 'whsec-teste'
  process.env.NEXT_PUBLIC_APP_URL = 'https://exemplo.test'
})

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key]
    else process.env[key] = originalEnv[key]
  }
  vi.restoreAllMocks()
})

/**
 * Carrega o handler com o Mongo stubado: a conexão de marketplace devolvida
 * carrega segredos reais de propósito, para o teste provar que eles não saem
 * na resposta.
 */
async function loadHandler(options: { rateLimitOk?: boolean } = {}) {
  const { rateLimitOk = true } = options

  vi.doMock('@/lib/rate-limit', () => ({
    checkRateLimit: async () => ({ success: rateLimitOk, remaining: rateLimitOk ? 29 : 0 }),
  }))
  vi.doMock('@/lib/mongodb', () => ({
    getDb: async () => ({
      collection: () => ({
        findOne: async () => ({
          _id: 'connection',
          accessToken: SEGREDO_ACCESS_TOKEN,
          refreshToken: SEGREDO_REFRESH_TOKEN,
          publicKey: CHAVE_PUBLICA_MARKETPLACE,
          collectorId: 123456,
          expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        }),
      }),
    }),
  }))

  const mod = await import('@/app/api/payments/public-key/route')
  return mod.GET
}

function fakeRequest() {
  return new Request('https://exemplo.test/api/payments/public-key', {
    headers: { 'x-forwarded-for': '203.0.113.10' },
  }) as any
}

describe('/api/payments/public-key — segurança', () => {
  it('nunca devolve o access token nem o refresh token do marketplace', async () => {
    const GET = await loadHandler()

    const response = await GET(fakeRequest())
    const corpo = await response.text()

    expect(response.status).toBe(200)
    // Varredura no corpo inteiro: pega qualquer campo novo que vaze segredo.
    expect(corpo).not.toContain(SEGREDO_ACCESS_TOKEN)
    expect(corpo).not.toContain(SEGREDO_REFRESH_TOKEN)
    expect(corpo).not.toMatch(/refreshToken/i)
    expect(corpo).not.toMatch(/accessToken/i)
  })

  it('devolve a chave do marketplace — a que pareia com o token da cobrança', async () => {
    const GET = await loadHandler()

    const response = await GET(fakeRequest())
    const data = await response.json()

    expect(data.publicKey).toBe(CHAVE_PUBLICA_MARKETPLACE)
    expect(data.env).toBe('production')
  })

  it('expõe apenas os campos previstos, nada além', async () => {
    const GET = await loadHandler()

    const response = await GET(fakeRequest())
    const data = await response.json()

    expect(Object.keys(data).sort()).toEqual(['env', 'publicKey'])
  })

  it('respeita o rate limit', async () => {
    const GET = await loadHandler({ rateLimitOk: false })

    const response = await GET(fakeRequest())
    const corpo = await response.text()

    expect(response.status).toBe(429)
    expect(corpo).not.toContain(SEGREDO_ACCESS_TOKEN)
  })

  it('não deixa o cache guardar a chave por muito tempo após troca de conta', async () => {
    const GET = await loadHandler()

    const response = await GET(fakeRequest())
    const cacheControl = response.headers.get('Cache-Control') || ''

    const maxAge = Number(cacheControl.match(/max-age=(\d+)/)?.[1] ?? Infinity)
    expect(maxAge).toBeLessThanOrEqual(60)
  })
})
