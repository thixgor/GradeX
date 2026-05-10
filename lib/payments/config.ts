/**
 * Carregamento e validação de variáveis de ambiente do provider de pagamento.
 * Nunca loga o token completo — apenas o sufixo mascarado.
 */

export type MpEnv = 'sandbox' | 'production'

export interface PaymentConfig {
  provider: 'mercado_pago'
  mp: {
    env: MpEnv
    publicKey: string
    accessToken: string
    webhookSecret: string
    notificationUrl: string
  }
}

let cached: PaymentConfig | null = null

export function getPaymentConfig(): PaymentConfig {
  if (cached) return cached

  const provider = (process.env.PAYMENT_PROVIDER || 'mercado_pago') as 'mercado_pago'
  if (provider !== 'mercado_pago') {
    throw new Error(`PAYMENT_PROVIDER inválido: ${provider}`)
  }

  const env = (process.env.MERCADOPAGO_ENV || 'sandbox') as MpEnv
  if (env !== 'sandbox' && env !== 'production') {
    throw new Error(`MERCADOPAGO_ENV inválido: ${env}. Use sandbox ou production.`)
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || ''
  const publicKey = process.env.MERCADOPAGO_PUBLIC_KEY || ''
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET || ''
  const notificationUrl =
    process.env.MERCADOPAGO_NOTIFICATION_URL ||
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/mercadopago`

  if (!accessToken) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN obrigatório em produção')
    }
    console.warn('[payments] MERCADOPAGO_ACCESS_TOKEN não configurado — chamadas falharão')
  }

  // Sanity check: APP_USR-... = produção, TEST-... = sandbox
  if (env === 'production' && accessToken.startsWith('TEST-')) {
    throw new Error('MERCADOPAGO_ENV=production mas o ACCESS_TOKEN é de sandbox (TEST-)')
  }

  cached = {
    provider,
    mp: { env, publicKey, accessToken, webhookSecret, notificationUrl },
  }
  return cached
}

/** Mascarar token para exibição: APP_USR-1234567890abcdef -> APP_USR-****cdef */
export function maskToken(token: string | undefined | null): string {
  if (!token) return ''
  const tail = token.slice(-4)
  const prefix = token.startsWith('APP_USR-')
    ? 'APP_USR-'
    : token.startsWith('TEST-')
      ? 'TEST-'
      : ''
  return `${prefix}****${tail}`
}

/** Resetar cache — usado em testes. */
export function _resetPaymentConfigCache() {
  cached = null
}
