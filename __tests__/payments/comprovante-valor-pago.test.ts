import { describe, it, expect } from 'vitest'
import {
  formatPaidSummary,
  paidFieldsFromMercadoPago,
  paidSummaryOf,
} from '@/lib/payments/receipt'

/**
 * O comprovante que mandamos por e-mail tem de mostrar o MESMO valor do
 * comprovante do Mercado Pago. No parcelado com juros para o comprador, o
 * `transaction_amount` (o que gravamos em `order.amount`) é o valor à vista; a
 * fatura vem com os juros do MP. Antes o nosso e-mail dizia R$ 277,74 e o do
 * MP "6 parcelas de R$ 52,92" — dois valores para a mesma compra.
 */
describe('paidFieldsFromMercadoPago', () => {
  it('lê o total com juros e as parcelas do pagamento aprovado', () => {
    const raw = {
      transaction_amount: 277.74,
      installments: 6,
      transaction_details: { total_paid_amount: 317.51, installment_amount: 52.92 },
    }
    expect(paidFieldsFromMercadoPago(raw)).toEqual({
      paidAmount: 317.51,
      paidInstallments: 6,
      paidInstallmentAmount: 52.92,
    })
  })

  it('Pix: total = transaction_amount, sem parcelas', () => {
    const raw = { transaction_amount: 266.53, installments: 1, transaction_details: { total_paid_amount: 266.53 } }
    expect(paidFieldsFromMercadoPago(raw)).toEqual({ paidAmount: 266.53, paidInstallments: 1 })
  })

  it('sem resposta do MP não inventa nada', () => {
    expect(paidFieldsFromMercadoPago(undefined)).toEqual({})
  })
})

describe('paidSummaryOf + formatPaidSummary', () => {
  it('parcelado: total da fatura com as parcelas, igual ao comprovante do MP', () => {
    const order = { amount: 277.74, paidAmount: 317.51, paidInstallments: 6, paidInstallmentAmount: 52.92 }
    expect(formatPaidSummary(paidSummaryOf(order))).toBe('R$ 317,51 (6x de R$ 52,92)')
  })

  it('order antiga (sem os campos do MP): cai no amount', () => {
    expect(formatPaidSummary(paidSummaryOf({ amount: 266.53 }))).toBe('R$ 266,53')
  })

  it('aceita número puro', () => {
    expect(formatPaidSummary(99.9)).toBe('R$ 99,90')
  })
})
