import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  computeCardInstallmentCharge,
  computeCheckoutCharge,
  parsePayerCosts,
  DEFAULT_FEE_POLICY,
  type ProviderPayerCost,
} from '@/lib/payments/fees'

/**
 * O que estes testes protegem: a reclamação "está passando um valor no meu
 * cartão diferente do valor do sistema". O checkout mostrava 6x de R$ 49,16
 * (total R$ 294,96, com o nosso gross-up de parcelamento) e mandava esse total
 * ao Mercado Pago em 6x. A conta do MP cobra os juros do COMPRADOR, então ele
 * somou os juros dele por cima: a fatura veio 6x de R$ 56,20 — juro sobre juro.
 */

const fetchPayerCosts = vi.fn()
vi.mock('@/lib/payments/mercado-pago/installments', () => ({
  fetchMercadoPagoPayerCosts: (...args: unknown[]) => fetchPayerCosts(...args),
}))

const BASE = 263.9 // Plus+ Semestral do print da reclamação

// À vista no crédito com a taxa da conta (4,98%, recebimento na hora):
// 263,90 / (1 - 4,98%) = 277,73... → 277,74 (arredonda para cima no centavo).
const A_VISTA = 277.74

describe('computeCardInstallmentCharge', () => {
  const aVista = computeCheckoutCharge({ baseAmount: BASE, paymentMethodId: 'master', installments: 1, hasCardToken: true })

  it('reproduz o cenário antigo: nosso gross-up em 6x dá os R$ 294,96 da tela', () => {
    // Com a tabela da época (crédito 3,03%).
    const tabelaAntiga = { ...DEFAULT_FEE_POLICY, table: { ...DEFAULT_FEE_POLICY.table, creditPercent: 3.03 } }
    const antigo = computeCheckoutCharge({
      baseAmount: BASE,
      paymentMethodId: 'master',
      installments: 6,
      hasCardToken: true,
      policy: tabelaAntiga,
    })
    expect(antigo.totalAmount).toBe(294.96)
    expect(antigo.installmentAmount).toBe(49.16)
  })

  it('MP cobra juros do comprador: manda o valor à vista e exibe o total da fatura', () => {
    const pc: ProviderPayerCost = { installments: 6, installmentRate: 14.32, installmentAmount: 52.92, totalAmount: 317.51 }
    const c = computeCardInstallmentCharge({ baseAmount: BASE, paymentMethodId: 'master', installments: 6, payerCost: pc })

    // O que vai ao MP é o à vista — os juros ele soma uma vez só.
    expect(c.transactionAmount).toBe(aVista.totalAmount)
    // O que a tela mostra é o que ele cobra.
    expect(c.totalAmount).toBe(317.51)
    expect(c.installmentAmount).toBe(52.92)
    expect(c.providerInterestAmount).toBeCloseTo(317.51 - aVista.totalAmount, 2)
    expect(c.feeAmount).toBeCloseTo(317.51 - BASE, 2)
    expect(c.installments).toBe(6)
    expect(c.label).toBe('Juros de parcelamento (6x)')
    expect(c.description).toContain('fatura')
  })

  it('parcelamento sem juros para o comprador: vale o gross-up da tabela, como antes', () => {
    const pc: ProviderPayerCost = { installments: 6, installmentRate: 0, installmentAmount: 46.29, totalAmount: 277.74 }
    const c = computeCardInstallmentCharge({ baseAmount: BASE, paymentMethodId: 'master', installments: 6, payerCost: pc })
    const grossUp = computeCheckoutCharge({ baseAmount: BASE, paymentMethodId: 'master', installments: 6, hasCardToken: true })
    expect(c.totalAmount).toBe(grossUp.totalAmount)
    expect(c.transactionAmount).toBe(grossUp.totalAmount)
    expect(c.providerInterestAmount).toBe(0)
  })

  it('sem o parcelamento do MP: manda o valor à vista — nunca juro em dobro', () => {
    const c = computeCardInstallmentCharge({ baseAmount: BASE, paymentMethodId: 'master', installments: 6, payerCost: null })
    expect(c.transactionAmount).toBe(aVista.totalAmount)
    expect(c.totalAmount).toBe(aVista.totalAmount)
    expect(c.installments).toBe(6)
  })

  it('à vista e débito não mudam', () => {
    const umaVez = computeCardInstallmentCharge({ baseAmount: BASE, paymentMethodId: 'master', installments: 1, payerCost: null })
    expect(umaVez).toEqual(aVista)
    const debito = computeCardInstallmentCharge({ baseAmount: BASE, paymentMethodId: 'debmaster', installments: 6, payerCost: null })
    expect(debito.installments).toBe(1)
    expect(debito.transactionAmount).toBe(debito.totalAmount)
  })

  it('pagamentos que não são parcelados mantêm transactionAmount === totalAmount', () => {
    for (const id of ['pix', 'bolbradesco', 'debvisa', 'visa']) {
      const c = computeCheckoutCharge({ baseAmount: BASE, paymentMethodId: id, policy: DEFAULT_FEE_POLICY })
      expect(c.transactionAmount).toBe(c.totalAmount)
      expect(c.providerInterestAmount).toBe(0)
    }
  })
})

describe('parsePayerCosts', () => {
  it('converte a resposta do MP e descarta linhas quebradas', () => {
    const out = parsePayerCosts([
      { installments: 3, installment_rate: 5.1, installment_amount: 95.3, total_amount: 285.9 },
      { installments: 1, installment_rate: 0, installment_amount: A_VISTA, total_amount: A_VISTA },
      { installments: 'x' },
      null,
    ])
    expect(out.map(p => p.installments)).toEqual([1, 3])
    expect(out[1]).toEqual({ installments: 3, installmentRate: 5.1, installmentAmount: 95.3, totalAmount: 285.9 })
  })

  it('aceita lixo sem lançar', () => {
    expect(parsePayerCosts(undefined)).toEqual([])
    expect(parsePayerCosts({})).toEqual([])
  })
})

describe('resolveCheckoutCharge (servidor)', () => {
  beforeEach(() => fetchPayerCosts.mockReset())

  async function resolve(installments: number, extra: Record<string, unknown> = {}) {
    const { resolveCheckoutCharge } = await import('@/lib/payments/checkout-charge')
    return resolveCheckoutCharge({
      baseAmount: BASE,
      paymentMethodId: 'master',
      installments,
      hasCardToken: true,
      issuer: '24',
      policy: DEFAULT_FEE_POLICY,
      ...extra,
    })
  }

  it('à vista não consulta o MP', async () => {
    const r = await resolve(1)
    expect(fetchPayerCosts).not.toHaveBeenCalled()
    expect(r.ok && r.charge.totalAmount).toBe(A_VISTA)
  })

  it('consulta o parcelamento com o valor à vista e o emissor', async () => {
    fetchPayerCosts.mockResolvedValue([
      { installments: 1, installmentRate: 0, installmentAmount: A_VISTA, totalAmount: A_VISTA },
      { installments: 6, installmentRate: 14.32, installmentAmount: 52.92, totalAmount: 317.51 },
    ])
    const r = await resolve(6)
    expect(fetchPayerCosts).toHaveBeenCalledWith({ amount: A_VISTA, paymentMethodId: 'master', issuerId: '24' })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.charge.transactionAmount).toBe(A_VISTA)
    expect(r.charge.totalAmount).toBe(317.51)
  })

  it('recusa com mensagem clara um parcelamento que o cartão não aceita', async () => {
    fetchPayerCosts.mockResolvedValue([
      { installments: 1, installmentRate: 0, installmentAmount: A_VISTA, totalAmount: A_VISTA },
      { installments: 3, installmentRate: 6, installmentAmount: 96.16, totalAmount: 288.47 },
    ])
    const r = await resolve(6)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.status).toBe(400)
    expect(r.error).toContain('máximo 3x')
  })

  it('consulta falhou: segue com o valor à vista, sem somar juro nosso', async () => {
    fetchPayerCosts.mockResolvedValue(null)
    const r = await resolve(6)
    expect(r.ok && r.charge.transactionAmount).toBe(A_VISTA)
  })

  it('Pix não passa pelo parcelamento', async () => {
    const r = await resolve(1, { paymentMethodId: 'pix', hasCardToken: false })
    expect(fetchPayerCosts).not.toHaveBeenCalled()
    expect(r.ok && r.charge.method).toBe('pix')
  })
})
