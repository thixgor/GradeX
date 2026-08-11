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
    /**
     * Credenciais OAuth da APLICAÇÃO de marketplace do sócio. Usadas para
     * conectar (via OAuth) a conta que processa os pagamentos à aplicação do
     * sócio, gerando o access token vinculado ao marketplace.
     */
    oauth: {
      clientId: string
      clientSecret: string
      /** URL de callback registrada na aplicação MP do sócio. */
      redirectUri: string
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

  // Credenciais OAuth da aplicação de marketplace (do sócio). Opcionais —
  // só necessárias para usar o botão "Conectar marketplace" no admin.
  const clientId = process.env.MERCADOPAGO_CLIENT_ID || ''
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET || ''
  const appBaseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '')
  const redirectUri =
    process.env.MERCADOPAGO_OAUTH_REDIRECT_URI ||
    `${appBaseUrl}/api/admin/mercado-pago/oauth/callback`

  cached = {
    provider,
    mp: {
      env,
      publicKey,
      accessToken,
      webhookSecret,
      notificationUrl,
      split: { enabled: splitEnabled, partnerPercent },
      oauth: { clientId, clientSecret, redirectUri },
    },
  }

  // Problemas que não impedem o boot mas quebram um meio de pagamento. Logados
  // uma vez (o config é cacheado) e expostos no painel via /api/admin/mercado-pago/status.
  for (const warning of getPaymentConfigWarnings(cached)) {
    console.error(`[payments] ATENÇÃO: ${warning}`)
  }

  return cached
}

/** 'TEST-' = credencial de teste, 'APP_USR-' = credencial de produção. */
function credentialKind(value: string): 'test' | 'production' | 'unknown' {
  if (!value) return 'unknown'
  if (value.startsWith('TEST-')) return 'test'
  if (value.startsWith('APP_USR-')) return 'production'
  return 'unknown'
}

/**
 * Inconsistências de credencial que derrubam o pagamento por CARTÃO sem
 * derrubar Pix/boleto — o que torna a falha difícil de reconhecer, porque a
 * plataforma parece estar vendendo normalmente.
 *
 * A public key tokeniza o cartão no navegador e o access token cobra no
 * servidor; se as duas não forem da mesma aplicação/ambiente, o Mercado Pago
 * responde "Invalid credentials" na criação do pagamento.
 *
 * Não lança: derrubar o boot deixaria Pix e boleto (que funcionam) fora do ar
 * junto. O caminho certo é gritar no log e no painel.
 */
export function getPaymentConfigWarnings(cfg: PaymentConfig = getPaymentConfig()): string[] {
  const warnings: string[] = []
  const { env, publicKey, accessToken } = cfg.mp

  if (!publicKey) {
    warnings.push(
      'MERCADOPAGO_PUBLIC_KEY não configurada — o pagamento por cartão não funciona (Pix e boleto seguem normais).'
    )
    return warnings
  }

  const keyKind = credentialKind(publicKey)
  const tokenKind = credentialKind(accessToken)

  if (env === 'production' && keyKind === 'test') {
    warnings.push(
      'MERCADOPAGO_ENV=production mas MERCADOPAGO_PUBLIC_KEY é de teste (TEST-). O cartão falha com "Invalid credentials"; Pix e boleto seguem funcionando. Troque pela Public Key de produção (APP_USR-).'
    )
  }
  if (env === 'sandbox' && keyKind !== 'test') {
    warnings.push(
      'MERCADOPAGO_ENV=sandbox mas MERCADOPAGO_PUBLIC_KEY não começa com TEST-. Isso causa "Unauthorized use of live credentials". Troque pela Public Key de teste.'
    )
  }
  if (keyKind !== 'unknown' && tokenKind !== 'unknown' && keyKind !== tokenKind) {
    warnings.push(
      `MERCADOPAGO_PUBLIC_KEY (${keyKind}) e MERCADOPAGO_ACCESS_TOKEN (${tokenKind}) são de ambientes diferentes. As duas credenciais precisam ser do mesmo par.`
    )
  }

  return warnings
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
