export type PaymentMethodsConfig = {
  pix: boolean
  credit_card: boolean
  boleto: boolean
  subscriptions: boolean
}

export const DEFAULT_PAYMENT_METHODS: PaymentMethodsConfig = {
  pix: true,
  credit_card: true,
  boleto: true,
  subscriptions: true,
}

/**
 * Normaliza o `paymentMethodId` que o checkout envia para uma família de
 * pagamento. O front manda o id do provedor (ex.: `bolbradesco` para boleto,
 * `visa`/`master` para cartão), então comparar direto com `boleto`/
 * `credit_card` nunca casa — por isso as validações de método habilitado
 * precisam passar por aqui.
 */
export function canonicalPaymentMethod(
  paymentMethodId: string | undefined,
  opts: { hasCardToken?: boolean } = {}
): 'pix' | 'boleto' | 'card' | 'unknown' {
  const id = (paymentMethodId || '').toLowerCase()
  if (id === 'pix') return 'pix'
  if (id === 'bolbradesco' || id === 'boleto' || id === 'bolbcp' || id === 'pec') return 'boleto'
  if (id === 'credit_card' || id === 'debit_card' || opts.hasCardToken) return 'card'
  // Ids de bandeira (visa, master, amex, elo, hipercard...) chegam sem token
  // só na detecção de bandeira; tratamos como cartão por segurança.
  if (id) return 'card'
  return 'unknown'
}

/**
 * Verifica se um método de pagamento está habilitado na config do admin.
 * Retorna null quando permitido; caso contrário, a mensagem de erro pronta.
 */
export function paymentMethodDisabledError(
  paymentMethodId: string | undefined,
  enabled: PaymentMethodsConfig,
  opts: { hasCardToken?: boolean } = {}
): string | null {
  const kind = canonicalPaymentMethod(paymentMethodId, opts)
  if (kind === 'pix' && !enabled.pix) return 'Pagamento por Pix não está disponível no momento.'
  if (kind === 'card' && !enabled.credit_card) return 'Pagamento por cartão não está disponível no momento.'
  if (kind === 'boleto' && !enabled.boleto) return 'Pagamento por boleto não está disponível no momento.'
  return null
}
