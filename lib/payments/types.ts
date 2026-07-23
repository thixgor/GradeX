/**
 * Camada abstrata de pagamentos.
 * Status canônicos independentes do provider — qualquer adapter mapeia para estes.
 */

export type PaymentStatus =
  | 'pending'      // criado, aguardando pagamento
  | 'in_process'   // em análise (boleto emitido, cartão em revisão)
  | 'approved'     // pago e aprovado — único estado que libera benefícios
  | 'rejected'     // recusado (cartão, fundos, etc.)
  | 'cancelled'    // cancelado pelo usuário ou sistema
  | 'refunded'     // estornado
  | 'charged_back' // chargeback
  | 'expired'      // expirou sem pagamento

export type SubscriptionStatus =
  | 'pending'
  | 'authorized' // = active
  | 'paused'
  | 'cancelled'
  | 'expired'
  | 'past_due'

export type PaymentMethodKind = 'credit_card' | 'debit_card' | 'pix' | 'boleto' | 'unknown'

/**
 * Endereço do pagador. Obrigatório para boleto no Mercado Pago — sem ele a
 * criação do pagamento é recusada ("payer.address ... required").
 */
export interface PayerAddress {
  zipCode: string
  streetName: string
  streetNumber: string
  neighborhood?: string
  city?: string
  federalUnit?: string
}

export type PaymentOrderType = 'plan' | 'material' | 'donation' | 'subscription' | 'product' | 'raffle' | 'physical'

export type PaymentProviderId = 'mercado_pago'

export interface CreateOrderInput {
  /** Identificador interno usado como external_reference no provider. */
  externalReference: string
  amount: number
  currency: 'BRL'
  description: string
  payerEmail?: string
  payerName?: string
  metadata?: Record<string, string>
  /** chave de idempotência derivada do externalReference. */
  idempotencyKey: string
  /**
   * Parte do `amount` sujeita à comissão do sócio (split de marketplace).
   * Quando omitido, a comissão incide sobre o valor total (comportamento padrão).
   * Usado para excluir da comissão certos materiais/pacotes marcados no admin —
   * a `application_fee` é calculada sobre este valor, não sobre `amount`.
   */
  commissionableAmount?: number
  /** Métodos de pagamento permitidos. Se omitido, todos. */
  allowedMethods?: PaymentMethodKind[]
  /** URL de retorno após Pix/boleto, opcional. */
  notificationUrl?: string
}

export interface CreatePreapprovalInput {
  externalReference: string
  payerEmail: string
  amount: number
  currency: 'BRL'
  reason: string
  /** mensal=1, trimestral=3, anual=12 */
  frequencyMonths: 1 | 3 | 12
  cardTokenId?: string
  backUrl: string
  metadata?: Record<string, string>
}

export interface ProviderOrder {
  providerOrderId: string
  status: PaymentStatus
  amount: number
  currency: string
  paymentMethod?: PaymentMethodKind
  /** Para Pix: payload copia-e-cola e QR base64 */
  pix?: { qrCode: string; qrCodeBase64: string; ticketUrl?: string }
  /** Para boleto: linha digitável + URL */
  boleto?: { barcode?: string; ticketUrl?: string }
  /** Status detalhado bruto do provider, para diagnóstico */
  statusDetail?: string
  paidAt?: Date
  raw?: unknown
}

export interface ProviderSubscription {
  providerSubscriptionId: string
  status: SubscriptionStatus
  nextBillingAt?: Date
  initPoint?: string
  raw?: unknown
}

export interface PaymentProvider {
  readonly id: PaymentProviderId
  /**
   * Cria uma Order. Para cartão, o payment é processado server-side com cardToken
   * (passado em metadata). Para Pix/boleto, retorna QR/linha digitável.
   */
  createPayment(input: CreateOrderInput & {
    paymentMethodId: string
    cardToken?: string
    installments?: number
    issuer?: string
    payerDocumentType?: 'CPF' | 'CNPJ'
    payerDocumentNumber?: string
    payerAddress?: PayerAddress
  }): Promise<ProviderOrder>

  getPayment(providerPaymentId: string): Promise<ProviderOrder>

  refundPayment(providerPaymentId: string): Promise<void>

  createPreapproval(input: CreatePreapprovalInput): Promise<ProviderSubscription>

  getPreapproval(providerSubscriptionId: string): Promise<ProviderSubscription>

  cancelPreapproval(providerSubscriptionId: string): Promise<ProviderSubscription>

  /**
   * Valida o webhook recebido (assinatura HMAC + replay protection).
   * Retorna o id do recurso (payment id ou preapproval id) e o tipo.
   */
  validateWebhook(input: {
    rawBody: string
    headers: Record<string, string | string[] | undefined>
    queryParams: Record<string, string>
  }): Promise<{ valid: boolean; resourceId?: string; topic?: string; eventId?: string }>
}
