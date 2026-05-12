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
