import {
  computeCardInstallmentCharge,
  computeCheckoutCharge,
  getFeePolicy,
  isInstallmentAvailable,
  type CheckoutCharge,
  type FeePolicy,
} from './fees'
import { fetchMercadoPagoPayerCosts } from './mercado-pago/installments'

export type ResolvedCheckoutCharge =
  | { ok: true; charge: CheckoutCharge }
  | { ok: false; status: number; error: string }

/**
 * Valor a cobrar num checkout de pagamento único — a versão de SERVIDOR de
 * `computeCheckoutCharge`, usada por todas as rotas que criam pagamento.
 *
 * Para Pix, boleto, débito e crédito à vista é exatamente `computeCheckoutCharge`.
 * No crédito PARCELADO consulta o parcelamento real do Mercado Pago para o
 * cartão e aplica `computeCardInstallmentCharge`: se o MP cobra juros do
 * comprador, mandamos o valor à vista e deixamos o juro por conta dele (uma vez
 * só); se não cobra, vale o gross-up da tabela.
 *
 * Também recusa, com mensagem clara, um número de parcelas que o cartão não
 * aceita — mandar assim mesmo virava "pagamento recusado" do Mercado Pago, sem
 * explicação nenhuma para o comprador.
 */
export async function resolveCheckoutCharge(input: {
  baseAmount: number
  paymentMethodId: string
  installments?: number
  hasCardToken: boolean
  issuer?: string | null
  policy?: FeePolicy
}): Promise<ResolvedCheckoutCharge> {
  const policy = input.policy || getFeePolicy()
  const charge = computeCheckoutCharge({
    baseAmount: input.baseAmount,
    paymentMethodId: input.paymentMethodId,
    installments: input.installments,
    hasCardToken: input.hasCardToken,
    policy,
  })

  if (!input.hasCardToken || charge.method !== 'credit_card' || charge.installments <= 1 || charge.baseAmount <= 0) {
    return { ok: true, charge }
  }

  const aVista = computeCheckoutCharge({
    baseAmount: input.baseAmount,
    paymentMethodId: input.paymentMethodId,
    installments: 1,
    hasCardToken: true,
    policy,
  })

  const custos = await fetchMercadoPagoPayerCosts({
    amount: aVista.totalAmount,
    paymentMethodId: input.paymentMethodId,
    issuerId: input.issuer,
  })

  // Sem o parcelamento do MP não dá para saber quem paga os juros nem o valor
  // da fatura — e cobrar sem saber é arriscar juro em dobro para o comprador
  // ou custo de parcelamento para nós. O checkout já não deixa chegar aqui.
  if (!custos) {
    console.warn('[checkout-charge] parcelamento do MP indisponível', {
      paymentMethodId: input.paymentMethodId,
      amount: aVista.totalAmount,
      installments: charge.installments,
    })
    return {
      ok: false,
      status: 503,
      error: 'Não conseguimos confirmar o parcelamento com o Mercado Pago agora. Tente de novo em instantes ou pague à vista.',
    }
  }

  const linha = custos.find(c => c.installments === charge.installments)
  if (!linha || !isInstallmentAvailable(charge.installments, linha, policy)) {
    const max = custos
      .filter(c => isInstallmentAvailable(c.installments, c, policy))
      .reduce((m, c) => Math.max(m, c.installments), 1)
    return {
      ok: false,
      status: 400,
      error:
        max > 1
          ? `Este cartão não aceita parcelamento em ${charge.installments}x (máximo ${max}x). Escolha outra quantidade de parcelas.`
          : 'Este cartão não aceita parcelamento. Escolha pagamento à vista.',
    }
  }

  return {
    ok: true,
    charge: computeCardInstallmentCharge({
      baseAmount: input.baseAmount,
      paymentMethodId: input.paymentMethodId,
      installments: charge.installments,
      payerCost: linha,
      policy,
    }),
  }
}
