export type PaymentMethodsConfig = {
  pix: boolean
  credit_card: boolean
  boleto: boolean
  subscriptions: boolean
  /**
   * CPF obrigatório nas compras por Pix.
   *
   * O Pix é o único meio em que essa exigência é uma ESCOLHA nossa: no cartão
   * o CPF entra na tokenização e no boleto ele vai no registro — nos dois o
   * Mercado Pago recusa o pagamento sem documento. Sobra o Pix, onde pedir o
   * CPF é sobre emitir nota fiscal, não sobre conseguir cobrar.
   *
   * Ligado por padrão (a nota continua sendo a regra); desligar troca um passo
   * a menos no caminho mais rápido de conversão por uma nota sem CPF do
   * comprador. Quem informar o CPF mesmo assim segue tendo ele vinculado ao
   * perfil.
   */
  requireCpfForPix: boolean
}

export const DEFAULT_PAYMENT_METHODS: PaymentMethodsConfig = {
  pix: true,
  credit_card: true,
  boleto: true,
  subscriptions: true,
  requireCpfForPix: true,
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
