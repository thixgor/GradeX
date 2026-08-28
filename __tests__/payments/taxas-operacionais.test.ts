import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  computeCheckoutCharge,
  feePercentFor,
  resolveFeeMethod,
  getFeePolicy,
  _resetFeePolicyCache,
  DEFAULT_FEE_POLICY,
  MERCADO_PAGO_FEE_TABLE,
  type FeePolicy,
} from '@/lib/payments/fees'

/**
 * O que estes testes protegem: o checkout parava de cobrar a taxa do Mercado
 * Pago do comprador e, no cartão parcelado, sequer previa o custo de financiar
 * as parcelas — cada venda em 12x saía com ~18% de prejuízo. A conta que
 * conserta isso é o "gross-up", e é ela que precisa continuar fechando.
 */

function policy(overrides: Partial<FeePolicy> = {}): FeePolicy {
  return { ...DEFAULT_FEE_POLICY, ...overrides }
}

describe('resolveFeeMethod', () => {
  it('reconhece Pix, boleto e as bandeiras de débito', () => {
    expect(resolveFeeMethod('pix')).toBe('pix')
    expect(resolveFeeMethod('bolbradesco')).toBe('boleto')
    expect(resolveFeeMethod('debvisa')).toBe('debit_card')
    expect(resolveFeeMethod('debmaster')).toBe('debit_card')
    expect(resolveFeeMethod('maestro')).toBe('debit_card')
  })

  it('trata bandeira desconhecida como crédito — errar para cima não vende no prejuízo', () => {
    expect(resolveFeeMethod('visa')).toBe('credit_card')
    expect(resolveFeeMethod('hipercard')).toBe('credit_card')
    expect(resolveFeeMethod('qualquer-coisa-nova')).toBe('credit_card')
  })

  it('sem id de método não arbitra taxa nenhuma', () => {
    expect(resolveFeeMethod(undefined)).toBe('unknown')
    expect(resolveFeeMethod('')).toBe('unknown')
  })
})

describe('feePercentFor', () => {
  it('soma o custo do parcelamento ao percentual do crédito', () => {
    // Âncora pública do Mercado Pago: 3,03% (crédito) + 14,80% (12x) = 17,83%.
    expect(feePercentFor('credit_card', 12)).toBeCloseTo(17.83, 2)
    expect(feePercentFor('credit_card', 1)).toBeCloseTo(3.03, 2)
  })

  it('cresce monotonicamente com o número de parcelas', () => {
    const percentuais = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => feePercentFor('credit_card', n))
    for (let i = 1; i < percentuais.length; i++) {
      expect(percentuais[i]).toBeGreaterThan(percentuais[i - 1])
    }
  })

  it('zera tudo quando a política está desligada', () => {
    const off = policy({ enabled: false })
    expect(feePercentFor('credit_card', 12, off)).toBe(0)
    expect(feePercentFor('pix', 1, off)).toBe(0)
  })

  it('permite absorver só os juros do parcelamento, mantendo a taxa do crédito', () => {
    const semJuros = policy({ pass: { ...DEFAULT_FEE_POLICY.pass, installments: false } })
    expect(feePercentFor('credit_card', 12, semJuros)).toBeCloseTo(3.03, 2)
  })
})

describe('computeCheckoutCharge', () => {
  it('faz o líquido bater com o preço de tabela (gross-up, não soma simples)', () => {
    const charge = computeCheckoutCharge({ baseAmount: 100, paymentMethodId: 'pix' })
    // Somar 0,99% direto daria 100,99 e o MP levaria 1,00 — sobrava 99,99.
    // Com o gross-up, 100 / (1 - 0,0099) = 101,00.
    expect(charge.totalAmount).toBeCloseTo(101.0, 2)
    const liquido = charge.totalAmount * (1 - MERCADO_PAGO_FEE_TABLE.pixPercent / 100)
    expect(liquido).toBeGreaterThanOrEqual(100)
  })

  it('nunca deixa o líquido cair abaixo da base, em nenhum método/parcela', () => {
    const casos: Array<{ id: string; n: number; percent: number; fixo: number }> = [
      { id: 'pix', n: 1, percent: 0.99, fixo: 0 },
      { id: 'bolbradesco', n: 1, percent: 0, fixo: 3.49 },
      { id: 'debvisa', n: 1, percent: 1.99, fixo: 0 },
      ...[1, 2, 3, 6, 10, 12].map(n => ({
        id: 'credit_card',
        n,
        percent: feePercentFor('credit_card', n),
        fixo: 0,
      })),
    ]
    for (const base of [9.9, 47, 199.9, 1250.35]) {
      for (const caso of casos) {
        const charge = computeCheckoutCharge({
          baseAmount: base,
          paymentMethodId: caso.id,
          installments: caso.n,
          hasCardToken: caso.id === 'credit_card',
        })
        const liquido = charge.totalAmount * (1 - caso.percent / 100) - caso.fixo
        expect(liquido + 1e-9).toBeGreaterThanOrEqual(base)
      }
    }
  })

  it('cobra a tarifa fixa do boleto', () => {
    const charge = computeCheckoutCharge({ baseAmount: 50, paymentMethodId: 'bolbradesco' })
    expect(charge.feeAmount).toBeCloseTo(3.49, 2)
    expect(charge.totalAmount).toBeCloseTo(53.49, 2)
    expect(charge.label).toBe('Taxa operacional')
  })

  it('chama juros de juros no parcelado e taxa operacional no resto', () => {
    const parcelado = computeCheckoutCharge({
      baseAmount: 300,
      paymentMethodId: 'credit_card',
      installments: 6,
      hasCardToken: true,
    })
    expect(parcelado.label).toBe('Juros de parcelamento (6x)')
    expect(parcelado.description).toContain('Parcelar em 6x')

    const aVista = computeCheckoutCharge({
      baseAmount: 300,
      paymentMethodId: 'credit_card',
      installments: 1,
      hasCardToken: true,
    })
    expect(aVista.label).toBe('Taxa operacional')
  })

  it('parcela sobre o TOTAL, não sobre o preço de tabela', () => {
    const charge = computeCheckoutCharge({
      baseAmount: 120,
      paymentMethodId: 'credit_card',
      installments: 12,
      hasCardToken: true,
    })
    expect(charge.installments).toBe(12)
    // 12 parcelas somadas não podem ficar acima do total cobrado (arredondamento
    // para baixo na parcela), nem tão abaixo a ponto de virar outro preço.
    const somaDasParcelas = charge.installmentAmount * 12
    expect(somaDasParcelas).toBeLessThanOrEqual(charge.totalAmount + 1e-9)
    expect(charge.totalAmount - somaDasParcelas).toBeLessThan(0.12)
  })

  it('não parcela nem cobra juros no débito', () => {
    const charge = computeCheckoutCharge({
      baseAmount: 200,
      paymentMethodId: 'debvisa',
      installments: 12,
      hasCardToken: true,
    })
    expect(charge.installments).toBe(1)
    expect(charge.feePercentOfBase).toBeLessThan(3)
  })

  it('base zerada (cupom/PROUNI que zera o item) não gera taxa do nada', () => {
    const charge = computeCheckoutCharge({ baseAmount: 0, paymentMethodId: 'credit_card', installments: 12 })
    expect(charge.totalAmount).toBe(0)
    expect(charge.feeAmount).toBe(0)
  })

  it('percentual absurdo é absorvido em vez de virar cobrança absurda', () => {
    const quebrado = policy({
      table: { ...MERCADO_PAGO_FEE_TABLE, pixPercent: 140 },
    })
    const charge = computeCheckoutCharge({ baseAmount: 100, paymentMethodId: 'pix', policy: quebrado })
    expect(charge.totalAmount).toBe(100)
    expect(charge.feeAmount).toBe(0)
  })

  it('política desligada cobra exatamente o preço de tabela', () => {
    const charge = computeCheckoutCharge({
      baseAmount: 149.9,
      paymentMethodId: 'credit_card',
      installments: 12,
      hasCardToken: true,
      policy: policy({ enabled: false }),
    })
    expect(charge.totalAmount).toBeCloseTo(149.9, 2)
    expect(charge.feeAmount).toBe(0)
  })

  it('respeita o teto de parcelas da política', () => {
    const ate6 = policy({ maxInstallments: 6 })
    const charge = computeCheckoutCharge({
      baseAmount: 600,
      paymentMethodId: 'credit_card',
      installments: 12,
      hasCardToken: true,
      policy: ate6,
    })
    expect(charge.installments).toBe(6)
  })

  it('devolve valores em centavos redondos', () => {
    for (const base of [19.99, 37.5, 249.9]) {
      const charge = computeCheckoutCharge({
        baseAmount: base,
        paymentMethodId: 'credit_card',
        installments: 3,
        hasCardToken: true,
      })
      expect(Math.round(charge.totalAmount * 100)).toBeCloseTo(charge.totalAmount * 100, 6)
      expect(Math.round(charge.feeAmount * 100)).toBeCloseTo(charge.feeAmount * 100, 6)
    }
  })
})

describe('getFeePolicy (env)', () => {
  const originais = { ...process.env }

  beforeEach(() => {
    _resetFeePolicyCache()
  })

  afterEach(() => {
    process.env = { ...originais }
    _resetFeePolicyCache()
  })

  it('vem ligada por padrão, com a tabela do Mercado Pago', () => {
    delete process.env.PAYMENT_FEE_ENABLED
    delete process.env.PAYMENT_FEE_TABLE
    const p = getFeePolicy()
    expect(p.enabled).toBe(true)
    expect(p.table.pixPercent).toBeCloseTo(0.99, 2)
    expect(p.table.creditPercent).toBeCloseTo(3.03, 2)
  })

  it('PAYMENT_FEE_ENABLED=false desliga o repasse inteiro', () => {
    process.env.PAYMENT_FEE_ENABLED = 'false'
    expect(getFeePolicy().enabled).toBe(false)
  })

  it('PAYMENT_FEE_TABLE sobrescreve só o que foi informado', () => {
    process.env.PAYMENT_FEE_TABLE = JSON.stringify({ creditPercent: 4.5, installmentPercent: { 12: 20 } })
    const p = getFeePolicy()
    expect(p.table.creditPercent).toBeCloseTo(4.5, 2)
    expect(p.table.installmentPercent[12]).toBeCloseTo(20, 2)
    // Não informado permanece no padrão.
    expect(p.table.pixPercent).toBeCloseTo(0.99, 2)
    expect(p.table.installmentPercent[6]).toBeCloseTo(7.5, 2)
  })

  it('tabela malformada não derruba o checkout — cai no padrão', () => {
    process.env.PAYMENT_FEE_TABLE = '{isso não é json'
    const p = getFeePolicy()
    expect(p.table.pixPercent).toBeCloseTo(0.99, 2)
  })
})
