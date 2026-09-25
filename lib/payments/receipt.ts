/**
 * O que o comprador EFETIVAMENTE pagou — o número que tem de aparecer em todo
 * comprovante que mandamos por e-mail.
 *
 * Por que não basta `order.amount`: ele é o `transaction_amount` enviado ao
 * Mercado Pago. No cartão parcelado com juros para o comprador, o MP soma os
 * juros dele por cima desse valor, então a fatura (e o e-mail do próprio MP)
 * mostram "6 parcelas de R$ 52,92", enquanto o nosso e-mail dizia o valor à
 * vista. Dois comprovantes da mesma compra com valores diferentes — é
 * exatamente o que faz o cliente achar que foi cobrado errado.
 *
 * A fonte é o próprio pagamento no MP (`transaction_details.total_paid_amount`
 * e `installment_amount`), gravada na order quando o pagamento é aprovado.
 * Arquivo puro (sem I/O): usado pelos e-mails, pelo PDF e pelos testes.
 */

export interface PaidSummary {
  /** Total pago pelo comprador, com taxa e juros. */
  total: number
  /** Número de parcelas (1 = à vista). */
  installments?: number
  /** Valor de cada parcela, como no comprovante do Mercado Pago. */
  installmentAmount?: number
}

interface OrderPaidFields {
  amount?: number
  paidAmount?: number
  paidInstallments?: number
  paidInstallmentAmount?: number
}

function positive(n: unknown): number | undefined {
  const v = Number(n)
  return Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : undefined
}

/** Resumo do que foi pago a partir da order (cai no `amount` se o MP não informou). */
export function paidSummaryOf(order: OrderPaidFields | null | undefined, fallbackAmount = 0): PaidSummary {
  const total = positive(order?.paidAmount) ?? positive(order?.amount) ?? positive(fallbackAmount) ?? 0
  const installments = Math.trunc(Number(order?.paidInstallments) || 0)
  const installmentAmount = positive(order?.paidInstallmentAmount)
  if (installments > 1 && installmentAmount) return { total, installments, installmentAmount }
  return { total }
}

/** Aceita número puro (compatibilidade) ou o resumo completo. */
export function toPaidSummary(value: number | PaidSummary | null | undefined): PaidSummary {
  if (value && typeof value === 'object') return value
  return { total: Number(value) || 0 }
}

export function formatBrlReceipt(value: number): string {
  return `R$ ${(Number(value) || 0).toFixed(2).replace('.', ',')}`
}

/** "R$ 317,51 (6x de R$ 52,92)" no parcelado; "R$ 277,74" à vista. */
export function formatPaidSummary(value: number | PaidSummary | null | undefined): string {
  const p = toPaidSummary(value)
  const total = formatBrlReceipt(p.total)
  if (p.installments && p.installments > 1 && p.installmentAmount) {
    return `${total} (${p.installments}x de ${formatBrlReceipt(p.installmentAmount)})`
  }
  return total
}

/**
 * Campos de pagamento lidos do pagamento no Mercado Pago, para gravar na
 * order. `total_paid_amount` inclui os juros do parcelamento pagos pelo
 * comprador; `transaction_amount` não.
 */
export function paidFieldsFromMercadoPago(raw: any): {
  paidAmount?: number
  paidInstallments?: number
  paidInstallmentAmount?: number
} {
  const td = raw?.transaction_details || {}
  const paidAmount = positive(td.total_paid_amount) ?? positive(raw?.transaction_amount)
  const installments = Math.trunc(Number(raw?.installments) || 0)
  const installmentAmount = positive(td.installment_amount)
  return {
    ...(paidAmount ? { paidAmount } : {}),
    ...(installments >= 1 ? { paidInstallments: installments } : {}),
    ...(installments > 1 && installmentAmount ? { paidInstallmentAmount: installmentAmount } : {}),
  }
}
