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
    /**
     * Split de pagamentos (marketplace). Quando habilitado, cada pagamento é
     * dividido entre a conta que processa (dona do ACCESS_TOKEN) e a conta do
     * sócio (dona da aplicação MP), via campo `application_fee`.
     */
    split: {
      enabled: boolean
      /**
       * Percentual (0–100) do valor total que vai para o SÓCIO (conta dona da
       * aplicação MP), cobrado como `application_fee`. O restante fica com a
       * conta que processa o pagamento (a do ACCESS_TOKEN configurado).
       * Ex.: 30 = 30% para o sócio, 70% para a conta principal.
       */
      partnerPercent: number
    }
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
  if (env === 'sandbox' && accessToken && !accessToken.startsWith('TEST-')) {
    throw new Error('MERCADOPAGO_ENV=sandbox mas o ACCESS_TOKEN parece ser de produção (não começa com TEST-). Isso causa "Unauthorized use of live credentials".')
  }
  if (env === 'sandbox' && publicKey && !publicKey.startsWith('TEST-')) {
    // Não lança exceção mas avisa fortemente — este é o erro mais comum
    console.error('[payments] ATENÇÃO: MERCADOPAGO_ENV=sandbox mas MERCADOPAGO_PUBLIC_KEY não começa com TEST-. Isso causa "Unauthorized use of live credentials". Troque pela Public Key de teste.')
  }

  // Split de pagamentos (marketplace) — opcional, desligado por padrão.
  const splitEnabled = /^(1|true|yes|on)$/i.test(process.env.MERCADOPAGO_SPLIT_ENABLED || '')
  const partnerPercentRaw = Number(process.env.MERCADOPAGO_SPLIT_PARTNER_PERCENT)
  const partnerPercent = Number.isFinite(partnerPercentRaw) ? partnerPercentRaw : 0
  if (splitEnabled) {
    if (!(partnerPercent > 0 && partnerPercent < 100)) {
      throw new Error(
        `MERCADOPAGO_SPLIT_PARTNER_PERCENT inválido: "${process.env.MERCADOPAGO_SPLIT_PARTNER_PERCENT}". ` +
          'Use um número entre 0 e 100 (ex.: 30 para enviar 30% ao sócio).'
      )
    }
  }

  cached = {
    provider,
    mp: {
      env,
      publicKey,
      accessToken,
      webhookSecret,
      notificationUrl,
      split: { enabled: splitEnabled, partnerPercent },
    },
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
