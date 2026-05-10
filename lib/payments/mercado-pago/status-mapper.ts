import type { PaymentStatus, SubscriptionStatus, PaymentMethodKind } from '../types'

/**
 * Mapa oficial de status do Mercado Pago para os status canônicos da plataforma.
 * Ref: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/payment-management/state-of-payment
 */
export function mapMpPaymentStatus(mpStatus: string | undefined, statusDetail?: string): PaymentStatus {
  switch (mpStatus) {
    case 'approved':
    case 'authorized':
      return 'approved'
    case 'pending':
      return 'pending'
    case 'in_process':
    case 'in_mediation':
      return 'in_process'
    case 'rejected':
      return 'rejected'
    case 'cancelled':
      // status_detail "expired" indica boleto/Pix vencido
      if (statusDetail === 'expired') return 'expired'
      return 'cancelled'
    case 'refunded':
      return 'refunded'
    case 'charged_back':
      return 'charged_back'
    default:
      return 'pending'
  }
}

export function mapMpPreapprovalStatus(mpStatus: string | undefined): SubscriptionStatus {
  switch (mpStatus) {
    case 'authorized':
      return 'authorized'
    case 'pending':
      return 'pending'
    case 'paused':
      return 'paused'
    case 'cancelled':
      return 'cancelled'
    case 'finished':
      return 'expired'
    default:
      return 'pending'
  }
}

export function mapMpPaymentMethod(typeId: string | undefined): PaymentMethodKind {
  switch (typeId) {
    case 'credit_card':
      return 'credit_card'
    case 'debit_card':
      return 'debit_card'
    case 'bank_transfer':
    case 'account_money':
      return 'pix'
    case 'ticket':
      return 'boleto'
    default:
      return 'unknown'
  }
}
