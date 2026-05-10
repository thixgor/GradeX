import { MercadoPagoConfig, Payment, PreApproval } from 'mercadopago'
import { getPaymentConfig } from '../config'

let mpClient: MercadoPagoConfig | null = null

export function getMpClient(): MercadoPagoConfig {
  if (mpClient) return mpClient
  const cfg = getPaymentConfig()
  mpClient = new MercadoPagoConfig({
    accessToken: cfg.mp.accessToken,
    options: {
      timeout: 10000,
    },
  })
  return mpClient
}

export function getMpPayment(): Payment {
  return new Payment(getMpClient())
}

export function getMpPreApproval(): PreApproval {
  return new PreApproval(getMpClient())
}

/** Reset usado em testes / quando trocamos credenciais. */
export function _resetMpClient() {
  mpClient = null
}
