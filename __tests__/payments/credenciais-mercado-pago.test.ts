import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/**
 * Regressão do bug que derrubou o pagamento por CARTÃO mantendo Pix e boleto
 * funcionando — o que fez a falha passar por "cartão do comprador recusado".
 *
 * A public key tokeniza o cartão no NAVEGADOR e o access token cobra no
 * SERVIDOR. As duas precisam sair da mesma aplicação do Mercado Pago; se
 * divergirem, o MP responde "Invalid credentials" ao criar o pagamento.
 * Pix e boleto não passam por tokenização, então seguem aprovando — foi
 * exatamente o que os dados de venda mostraram.
 */

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
  // Silencia os console.error de aviso — eles são o comportamento esperado
  // em vários destes casos, e poluiriam a saída do teste.
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key]
    else process.env[key] = originalEnv[key]
  }
  vi.restoreAllMocks()
})

function setEnv(env: Record<string, string>) {
  process.env.MERCADOPAGO_WEBHOOK_SECRET = 'whsec-teste'
  process.env.NEXT_PUBLIC_APP_URL = 'https://exemplo.test'
  for (const [key, value] of Object.entries(env)) process.env[key] = value
}

/** Carrega config.ts limpo, para o cache interno não vazar entre casos. */
async function loadConfig() {
  return import('@/lib/payments/config')
}

/**
 * Carrega o marketplace-store com o Mongo trocado por um stub, devolvendo a
 * conexão que o caso de teste quiser. Sem isso o módulo tentaria abrir conexão
 * real com o banco.
 */
async function loadStoreWithConnection(connection: unknown) {
  vi.doMock('@/lib/mongodb', () => ({
    getDb: async () => ({
      collection: () => ({
        findOne: async () => connection,
      }),
    }),
  }))
  return import('@/lib/payments/mercado-pago/marketplace-store')
}

describe('getEffectiveMpPublicKey — pareamento com o token da cobrança', () => {
  it('sem marketplace conectado, usa a chave do ambiente', async () => {
    setEnv({
      MERCADOPAGO_ENV: 'production',
      MERCADOPAGO_PUBLIC_KEY: 'APP_USR-chave-do-ambiente',
      MERCADOPAGO_ACCESS_TOKEN: 'APP_USR-token-do-ambiente',
    })
    const store = await loadStoreWithConnection(null)

    const result = await store.getEffectiveMpPublicKey()

    expect(result.publicKey).toBe('APP_USR-chave-do-ambiente')
    expect(result.source).toBe('env')
    expect(result.fellBackToEnv).toBe(false)
  })

  it('com marketplace conectado, usa a chave DELE — não a do ambiente', async () => {
    setEnv({
      MERCADOPAGO_ENV: 'production',
      MERCADOPAGO_PUBLIC_KEY: 'APP_USR-chave-do-ambiente',
      MERCADOPAGO_ACCESS_TOKEN: 'APP_USR-token-do-ambiente',
    })
    const store = await loadStoreWithConnection({
      _id: 'connection',
      accessToken: 'APP_USR-token-do-marketplace',
      publicKey: 'APP_USR-chave-do-marketplace',
      refreshToken: 'refresh',
      collectorId: 123,
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    })

    const result = await store.getEffectiveMpPublicKey()

    // Este é o coração do bug: antes voltava a chave do ambiente enquanto a
    // cobrança usava o token do marketplace.
    expect(result.publicKey).toBe('APP_USR-chave-do-marketplace')
    expect(result.source).toBe('marketplace')
    expect(result.fellBackToEnv).toBe(false)
  })

  it('marketplace conectado sem public key: mantém a do ambiente e sinaliza', async () => {
    setEnv({
      MERCADOPAGO_ENV: 'production',
      MERCADOPAGO_PUBLIC_KEY: 'APP_USR-chave-do-ambiente',
      MERCADOPAGO_ACCESS_TOKEN: 'APP_USR-token-do-ambiente',
    })
    const store = await loadStoreWithConnection({
      _id: 'connection',
      accessToken: 'APP_USR-token-do-marketplace',
      refreshToken: 'refresh',
      collectorId: 123,
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    })

    const result = await store.getEffectiveMpPublicKey()

    // Não derruba Pix/boleto junto, mas precisa ficar visível para o admin.
    expect(result.publicKey).toBe('APP_USR-chave-do-ambiente')
    expect(result.fellBackToEnv).toBe(true)
  })

  it('não quebra quando o banco falha — cai no ambiente', async () => {
    setEnv({
      MERCADOPAGO_ENV: 'production',
      MERCADOPAGO_PUBLIC_KEY: 'APP_USR-chave-do-ambiente',
      MERCADOPAGO_ACCESS_TOKEN: 'APP_USR-token-do-ambiente',
    })
    vi.doMock('@/lib/mongodb', () => ({
      getDb: async () => {
        throw new Error('mongo fora do ar')
      },
    }))
    const store = await import('@/lib/payments/mercado-pago/marketplace-store')

    const result = await store.getEffectiveMpPublicKey()

    expect(result.publicKey).toBe('APP_USR-chave-do-ambiente')
    expect(result.source).toBe('env')
  })
})

describe('getPaymentConfigWarnings — credenciais inconsistentes', () => {
  it('não acusa nada quando produção está coerente', async () => {
    setEnv({
      MERCADOPAGO_ENV: 'production',
      MERCADOPAGO_PUBLIC_KEY: 'APP_USR-chave',
      MERCADOPAGO_ACCESS_TOKEN: 'APP_USR-token',
    })
    const { getPaymentConfigWarnings } = await loadConfig()

    expect(getPaymentConfigWarnings()).toEqual([])
  })

  it('acusa public key de TESTE em produção (a lacuna que não era validada)', async () => {
    setEnv({
      MERCADOPAGO_ENV: 'production',
      MERCADOPAGO_PUBLIC_KEY: 'TEST-chave-de-teste',
      MERCADOPAGO_ACCESS_TOKEN: 'APP_USR-token',
    })
    const { getPaymentConfigWarnings } = await loadConfig()

    const warnings = getPaymentConfigWarnings()
    expect(warnings.length).toBeGreaterThan(0)
    expect(warnings.join(' ')).toMatch(/produção/i)
  })

  it('acusa par de ambientes diferentes entre chave e token', async () => {
    setEnv({
      MERCADOPAGO_ENV: 'production',
      MERCADOPAGO_PUBLIC_KEY: 'TEST-chave',
      MERCADOPAGO_ACCESS_TOKEN: 'APP_USR-token',
    })
    const { getPaymentConfigWarnings } = await loadConfig()

    expect(getPaymentConfigWarnings().join(' ')).toMatch(/ambientes diferentes/i)
  })

  it('acusa public key ausente', async () => {
    setEnv({
      MERCADOPAGO_ENV: 'production',
      MERCADOPAGO_PUBLIC_KEY: '',
      MERCADOPAGO_ACCESS_TOKEN: 'APP_USR-token',
    })
    const { getPaymentConfigWarnings } = await loadConfig()

    expect(getPaymentConfigWarnings().join(' ')).toMatch(/não configurada/i)
  })

  it('não derruba o boot com credencial inconsistente (Pix/boleto seguem vivos)', async () => {
    setEnv({
      MERCADOPAGO_ENV: 'production',
      MERCADOPAGO_PUBLIC_KEY: 'TEST-chave',
      MERCADOPAGO_ACCESS_TOKEN: 'APP_USR-token',
    })
    const { getPaymentConfig } = await loadConfig()

    // Lançar aqui tiraria do ar também os meios que estão funcionando.
    expect(() => getPaymentConfig()).not.toThrow()
  })
})
