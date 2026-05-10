import { randomUUID } from 'crypto'
import type {
  PaymentProvider,
  CreateOrderInput,
  CreatePreapprovalInput,
  ProviderOrder,
  ProviderSubscription,
} from '../types'
import { getMpClient, getMpPayment, getMpPreApproval } from './client'
import { mapMpPaymentStatus, mapMpPreapprovalStatus, mapMpPaymentMethod } from './status-mapper'
import { validateMpWebhook } from './webhook'
import { getPaymentConfig } from '../config'

/**
 * Adapter Mercado Pago para a interface PaymentProvider.
 * Trabalha com:
 *  - Payments API (Orders únicas: cartão, Pix, boleto)
 *  - PreApproval API (assinaturas recorrentes)
 */
export class MercadoPagoProvider implements PaymentProvider {
  readonly id = 'mercado_pago' as const

  async createPayment(
    input: CreateOrderInput & {
      paymentMethodId: string
      cardToken?: string
      installments?: number
      issuer?: string
      payerDocumentType?: 'CPF' | 'CNPJ'
      payerDocumentNumber?: string
    }
  ): Promise<ProviderOrder> {
    const cfg = getPaymentConfig()
    const payment = getMpPayment()

    const body: Record<string, any> = {
      transaction_amount: round2(input.amount),
      description: input.description,
      external_reference: input.externalReference,
      notification_url: input.notificationUrl || cfg.mp.notificationUrl,
      payment_method_id: input.paymentMethodId,
      metadata: {
        ...(input.metadata || {}),
        external_reference: input.externalReference,
      },
      payer: {
        email: input.payerEmail || `noreply+${input.externalReference}@domineaqui.com.br`,
      },
    }

    if (input.payerName) {
      const [first, ...rest] = input.payerName.split(' ')
      body.payer.first_name = first
      body.payer.last_name = rest.join(' ') || first
    }

    if (input.payerDocumentType && input.payerDocumentNumber) {
      body.payer.identification = {
        type: input.payerDocumentType,
        number: input.payerDocumentNumber.replace(/\D/g, ''),
      }
    }

    // Pagamento com cartão: precisa do token + parcelas + emissor
    if (input.cardToken) {
      body.token = input.cardToken
      body.installments = input.installments || 1
      if (input.issuer) body.issuer_id = input.issuer
      body.capture = true
    }

    // Para Pix/boleto, precisamos avisar o vencimento (24h padrão)
    if (input.paymentMethodId === 'pix' || input.paymentMethodId === 'bolbradesco' || input.paymentMethodId === 'boleto') {
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
      body.date_of_expiration = expires.toISOString()
    }

    const response = await payment.create({
      body,
      requestOptions: { idempotencyKey: input.idempotencyKey },
    })

    return mpPaymentToProviderOrder(response)
  }

  async getPayment(providerPaymentId: string): Promise<ProviderOrder> {
    const payment = getMpPayment()
    const response = await payment.get({ id: providerPaymentId })
    return mpPaymentToProviderOrder(response)
  }

  async refundPayment(providerPaymentId: string): Promise<void> {
    const client = getMpClient()
    // SDK v2 ainda não expõe Refund de forma limpa em todos os builds — usar fetch direto
    const cfg = getPaymentConfig()
    const res = await fetch(
      `https://api.mercadopago.com/v1/payments/${providerPaymentId}/refunds`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfg.mp.accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': randomUUID(),
        },
        body: JSON.stringify({}),
      }
    )
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Falha ao reembolsar pagamento ${providerPaymentId}: ${res.status} ${text}`)
    }
  }

  async createPreapproval(input: CreatePreapprovalInput): Promise<ProviderSubscription> {
    const cfg = getPaymentConfig()
    const pre = getMpPreApproval()

    const body: Record<string, any> = {
      reason: input.reason,
      external_reference: input.externalReference,
      payer_email: input.payerEmail,
      back_url: input.backUrl,
      auto_recurring: {
        frequency: input.frequencyMonths,
        frequency_type: 'months',
        transaction_amount: round2(input.amount),
        currency_id: input.currency,
      },
      notification_url: cfg.mp.notificationUrl,
    }

    if (input.cardTokenId) {
      body.card_token_id = input.cardTokenId
      body.status = 'authorized' // tenta autorizar imediatamente com o cartão
    }

    const response = await pre.create({ body })
    return mpPreapprovalToProviderSub(response)
  }

  async getPreapproval(providerSubscriptionId: string): Promise<ProviderSubscription> {
    const pre = getMpPreApproval()
    const response = await pre.get({ id: providerSubscriptionId })
    return mpPreapprovalToProviderSub(response)
  }

  async cancelPreapproval(providerSubscriptionId: string): Promise<ProviderSubscription> {
    const pre = getMpPreApproval()
    const response = await pre.update({
      id: providerSubscriptionId,
      body: { status: 'cancelled' },
    })
    return mpPreapprovalToProviderSub(response)
  }

  async validateWebhook(input: {
    rawBody: string
    headers: Record<string, string | string[] | undefined>
    queryParams: Record<string, string>
  }) {
    return validateMpWebhook(input)
  }
}

// ── Mapeadores ───────────────────────────────────────────────

function mpPaymentToProviderOrder(p: any): ProviderOrder {
  const status = mapMpPaymentStatus(p?.status, p?.status_detail)
  const txData = p?.point_of_interaction?.transaction_data
  const pix =
    p?.payment_method_id === 'pix' && txData
      ? {
          qrCode: String(txData.qr_code || ''),
          qrCodeBase64: String(txData.qr_code_base64 || ''),
          ticketUrl: txData.ticket_url ? String(txData.ticket_url) : undefined,
        }
      : undefined
  const boleto =
    (p?.payment_type_id === 'ticket' || p?.payment_method_id === 'bolbradesco') && p?.transaction_details
      ? {
          barcode: p?.barcode?.content || undefined,
          ticketUrl: p?.transaction_details?.external_resource_url || undefined,
        }
      : undefined

  return {
    providerOrderId: String(p?.id || ''),
    status,
    amount: Number(p?.transaction_amount || 0),
    currency: String(p?.currency_id || 'BRL'),
    paymentMethod: mapMpPaymentMethod(p?.payment_type_id),
    pix,
    boleto,
    statusDetail: p?.status_detail ? String(p.status_detail) : undefined,
    paidAt: p?.date_approved ? new Date(p.date_approved) : undefined,
    raw: p,
  }
}

function mpPreapprovalToProviderSub(p: any): ProviderSubscription {
  return {
    providerSubscriptionId: String(p?.id || ''),
    status: mapMpPreapprovalStatus(p?.status),
    nextBillingAt: p?.next_payment_date ? new Date(p.next_payment_date) : undefined,
    initPoint: p?.init_point || undefined,
    raw: p,
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
