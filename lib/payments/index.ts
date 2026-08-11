import { randomUUID } from 'crypto'
import { MercadoPagoProvider } from './mercado-pago/provider'
import type { PaymentProvider } from './types'

let provider: PaymentProvider | null = null

export function getPaymentProvider(): PaymentProvider {
  if (provider) return provider
  provider = new MercadoPagoProvider()
  return provider
}

/** Gera idempotency key estável a partir de um seed (ex.: orderId interno). */
export function deriveIdempotencyKey(seed: string): string {
  return `idem-${seed}`
}

/** Idempotency key aleatório (para retry de webhook, etc.) */
export function randomIdempotencyKey(): string {
  return `idem-${randomUUID()}`
}

export * from './types'
export { getPaymentConfig, getPaymentConfigWarnings, maskToken } from './config'
