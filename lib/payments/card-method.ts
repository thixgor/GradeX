/**
 * Escolha do `payment_method_id` do cartão a partir da consulta de BIN do
 * Mercado Pago (`getPaymentMethods({ bin })` no mercadopago.js).
 *
 * Arquivo puro — roda no navegador e nos testes.
 */

export interface DetectedCardMethod {
  /** `payment_method_id` do MP: visa, master, elo, debvisa, debmaster... */
  id: string
  /** Emissor do cartão, quando o MP informa. */
  issuerId: string | null
  paymentTypeId: string | null
}

/**
 * Cartão MÚLTIPLO (crédito + débito, comum no Brasil) volta da consulta de BIN
 * com uma linha para cada função — e a ordem não é garantida. Pegar a primeira
 * às vezes mandava `debmaster` para quem estava pagando no crédito: o
 * pagamento ia como débito (à vista, sem as parcelas escolhidas) e boa parte
 * dos bancos recusa débito online. Aqui o crédito tem prioridade; débito só
 * quando é a única função do cartão.
 */
export function pickCardPaymentMethod(results: unknown): DetectedCardMethod | null {
  const lista = Array.isArray(results) ? (results as any[]).filter(r => r && typeof r.id === 'string' && r.id) : []
  if (lista.length === 0) return null
  const escolhido = lista.find(r => r.payment_type_id === 'credit_card') || lista[0]
  return {
    id: String(escolhido.id),
    issuerId: escolhido?.issuer?.id != null ? String(escolhido.issuer.id) : null,
    paymentTypeId: escolhido.payment_type_id ? String(escolhido.payment_type_id) : null,
  }
}

const BRAND_TO_MP_ID: Record<string, string> = {
  visa: 'visa',
  master: 'master',
  amex: 'amex',
  elo: 'elo',
  hipercard: 'hipercard',
  diners: 'diners',
}

/**
 * Último recurso quando a consulta de BIN falhou: a bandeira detectada pelo
 * prefixo. Antes o fallback era sempre `visa` — um Mastercard ia como Visa e o
 * Mercado Pago recusava. Bandeira desconhecida devolve `null` (quem chama pede
 * para tentar de novo, em vez de chutar).
 */
export function mercadoPagoIdFromBrand(brand: string | null | undefined): string | null {
  return BRAND_TO_MP_ID[(brand || '').toLowerCase()] || null
}

export function isDebitMethodId(id: string | null | undefined): boolean {
  return /^deb|^maestro/.test(id || '')
}
