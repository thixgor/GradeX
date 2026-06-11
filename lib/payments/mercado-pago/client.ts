import { MercadoPagoConfig, Payment, PreApproval } from 'mercadopago'
import { getPaymentConfig } from '../config'

let mpClient: MercadoPagoConfig | null = null

/** Cliente padrão, construído a partir do MERCADOPAGO_ACCESS_TOKEN do ambiente. */
export function getMpClient(): MercadoPagoConfig {
  if (mpClient) return mpClient
  const cfg = getPaymentConfig()
  mpClient = buildMpClient(cfg.mp.accessToken)
  return mpClient
}

/**
 * Constrói um cliente com um access token específico (ex.: o token de
 * marketplace obtido via OAuth). Não é cacheado — o token pode variar.
 */
export function buildMpClient(accessToken: string): MercadoPagoConfig {
  return new MercadoPagoConfig({
    accessToken,
    options: {
      timeout: 10000,
    },
  })
}

export function getMpPayment(): Payment {
  return new Payment(getMpClient())
}

export function getMpPreApproval(): PreApproval {
  return new PreApproval(getMpClient())
}

/** Variantes que usam um token explícito (marketplace ou ambiente). */
export function getMpPaymentWithToken(accessToken: string): Payment {
  return new Payment(buildMpClient(accessToken))
}

export function getMpPreApprovalWithToken(accessToken: string): PreApproval {
  return new PreApproval(buildMpClient(accessToken))
}

/** Reset usado em testes / quando trocamos credenciais. */
export function _resetMpClient() {
  mpClient = null
}
