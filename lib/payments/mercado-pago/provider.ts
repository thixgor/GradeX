import { randomUUID } from 'crypto'
import type {
  PaymentProvider,
  CreateOrderInput,
  CreatePreapprovalInput,
  ProviderOrder,
  ProviderSubscription,
  PayerAddress,
} from '../types'
import { getMpPaymentWithToken, getMpPreApprovalWithToken } from './client'
import { mapMpPaymentStatus, mapMpPreapprovalStatus, mapMpPaymentMethod } from './status-mapper'
import { validateMpWebhook } from './webhook'
import { getPaymentConfig } from '../config'
import { getEffectiveMpAuth } from './marketplace-store'

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
      payerAddress?: PayerAddress
    }
  ): Promise<ProviderOrder> {
    const cfg = getPaymentConfig()
    const isBoleto =
      input.paymentMethodId === 'bolbradesco' || input.paymentMethodId === 'boleto'
    const auth = await getEffectiveMpAuth()
    const payment = getMpPaymentWithToken(auth.accessToken)

    // Em sandbox, payer.email deve ser um e-mail de usuário de teste MP.
    // E-mails reais causam "Unauthorized use of live credentials".
    const sandboxPayerEmail = process.env.MERCADOPAGO_SANDBOX_PAYER_EMAIL || 'test_user_buyer@testuser.com'
    const resolvedPayerEmail =
      cfg.mp.env === 'sandbox'
        ? sandboxPayerEmail
        : (input.payerEmail || `noreply+${input.externalReference}@domineaqui.com.br`)

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
        email: resolvedPayerEmail,
      },
    }

    const payerName = (input.payerName || '').trim()
    if (payerName) {
      const [first, ...rest] = payerName.split(/\s+/)
      body.payer.first_name = first
      body.payer.last_name = rest.join(' ') || first
    } else if (isBoleto) {
      // O Mercado Pago recusa o boleto sem nome do pagador. Como fallback,
      // derivamos um nome a partir do e-mail para não quebrar o pagamento.
      const fallback = (resolvedPayerEmail.split('@')[0] || 'Cliente').replace(/[^\p{L}]+/gu, ' ').trim() || 'Cliente'
      const [first, ...rest] = fallback.split(/\s+/)
      body.payer.first_name = first
      body.payer.last_name = rest.join(' ') || first
    }

    if (input.payerDocumentType && input.payerDocumentNumber) {
      body.payer.identification = {
        type: input.payerDocumentType,
        number: input.payerDocumentNumber.replace(/\D/g, ''),
      }
    }

    // Boleto exige endereço do pagador. Sem ele o MP recusa a criação do
    // pagamento. Preenchemos com o que o checkout enviou (fallbacks mínimos
    // para os campos que o MP trata como opcionais).
    if (isBoleto && input.payerAddress) {
      const addr = input.payerAddress
      const zip = (addr.zipCode || '').replace(/\D/g, '')
      body.payer.address = {
        zip_code: zip,
        street_name: (addr.streetName || '').trim(),
        street_number: (addr.streetNumber || '').trim() || 'S/N',
        neighborhood: (addr.neighborhood || '').trim() || undefined,
        city: (addr.city || '').trim() || undefined,
        federal_unit: (addr.federalUnit || '').trim().toUpperCase() || undefined,
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
    if (input.paymentMethodId === 'pix' || isBoleto) {
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
      body.date_of_expiration = expires.toISOString()
    }

    // Split de pagamentos (marketplace): cobra a comissão do sócio como
    // `application_fee`. O valor total é debitado do comprador; a comissão é
    // creditada na conta dona da aplicação MP e o restante na conta que
    // processa este pagamento. Ver docs/mercado-pago-split.md.
    // Só aplica quando a conta está conectada via OAuth (token de marketplace);
    // com o token do ambiente o MP rejeitaria o application_fee.
    if (auth.source === 'marketplace' && cfg.mp.split.enabled && cfg.mp.split.partnerPercent > 0) {
      // Base da comissão: por padrão o valor total, mas o checkout pode passar
      // `commissionableAmount` menor para excluir da comissão certos itens
      // (materiais/pacotes marcados como "sem comissão do sócio" no admin).
      const base =
        input.commissionableAmount != null
          ? Math.max(0, Math.min(round2(input.commissionableAmount), round2(input.amount)))
          : round2(input.amount)
      const fee = round2((base * cfg.mp.split.partnerPercent) / 100)
      if (fee > 0 && fee < round2(input.amount)) {
        body.application_fee = fee
      }
    }

    const response = await payment.create({
      body,
      requestOptions: { idempotencyKey: input.idempotencyKey },
    })

    return mpPaymentToProviderOrder(response)
  }

  async getPayment(providerPaymentId: string): Promise<ProviderOrder> {
    const auth = await getEffectiveMpAuth()
    const payment = getMpPaymentWithToken(auth.accessToken)
    const response = await payment.get({ id: providerPaymentId })
    return mpPaymentToProviderOrder(response)
  }

  async refundPayment(providerPaymentId: string): Promise<void> {
    // SDK v2 ainda não expõe Refund de forma limpa em todos os builds — usar fetch direto
    const auth = await getEffectiveMpAuth()
    const res = await fetch(
      `https://api.mercadopago.com/v1/payments/${providerPaymentId}/refunds`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.accessToken}`,
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
    const auth = await getEffectiveMpAuth()
    const pre = getMpPreApprovalWithToken(auth.accessToken)

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
    const auth = await getEffectiveMpAuth()
    const pre = getMpPreApprovalWithToken(auth.accessToken)
    const response = await pre.get({ id: providerSubscriptionId })
    return mpPreapprovalToProviderSub(response)
  }

  async cancelPreapproval(providerSubscriptionId: string): Promise<ProviderSubscription> {
    const auth = await getEffectiveMpAuth()
    const pre = getMpPreApprovalWithToken(auth.accessToken)
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
    p?.payment_type_id === 'ticket' || p?.payment_method_id === 'bolbradesco'
      ? {
          // "Linha digitável" é o número que o cliente digita no banco —
          // fica em transaction_details.digitable_line. barcode.content é o
          // código de barras cru (fallback).
          barcode:
            p?.transaction_details?.digitable_line ||
            p?.barcode?.content ||
            undefined,
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
