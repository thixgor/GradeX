import { describe, expect, it } from 'vitest'

import {
  combineDiscountsWithProuni,
  computeProuniDiscount,
  getProuniDiscountLabel,
} from '@/lib/prouni-shared'

/**
 * O que estes testes protegem: o preço cobrado do bolsista.
 *
 * Esta é a única aritmética que decide quanto entra na fatura quando lote,
 * cupom e benefício PROUNI/FIES existem ao mesmo tempo. Errar para menos é
 * vender abaixo do custo; errar para mais é cobrar caro justamente de quem
 * provou não poder pagar. Cada caso abaixo é uma dessas duas formas de errar.
 */

const PROUNI_40 = { discountType: 'percentage' as const, discountValue: 40, stackWithTier: false }
const PROUNI_40_EMPILHA = { ...PROUNI_40, stackWithTier: true }

describe('computeProuniDiscount', () => {
  it('calcula percentual sobre a base', () => {
    expect(computeProuniDiscount('percentage', 40, 100)).toBe(40)
  })

  it('nunca desconta mais do que a própria base', () => {
    // R$ 50 de desconto num item de R$ 30 não pode gerar preço negativo.
    expect(computeProuniDiscount('fixed', 50, 30)).toBe(30)
  })

  it('trata percentual acima de 100 como 100', () => {
    expect(computeProuniDiscount('percentage', 150, 80)).toBe(80)
  })

  it('ignora valores inválidos em vez de gerar NaN na fatura', () => {
    expect(computeProuniDiscount('percentage', Number.NaN, 100)).toBe(0)
    expect(computeProuniDiscount('fixed', -10, 100)).toBe(0)
    expect(computeProuniDiscount('percentage', 40, 0)).toBe(0)
  })
})

describe('combineDiscountsWithProuni', () => {
  it('sem nenhum desconto, o preço não muda', () => {
    const r = combineDiscountsWithProuni({ basePrice: 100 })
    expect(r.finalPrice).toBe(100)
    expect(r.appliedSource).toBe('none')
  })

  it('aplica o PROUNI quando ele é o maior', () => {
    const r = combineDiscountsWithProuni({
      basePrice: 100,
      tierDiscountAmount: 10,
      couponDiscountAmount: 20,
      prouni: PROUNI_40,
    })
    expect(r.appliedSource).toBe('prouni')
    expect(r.finalPrice).toBe(60)
    // Nunca soma: lote e cupom saem de cena quando o PROUNI vence.
    expect(r.tierDiscountApplied).toBe(0)
    expect(r.couponDiscountApplied).toBe(0)
  })

  it('mantém o lote quando o lote é maior que o benefício', () => {
    const r = combineDiscountsWithProuni({
      basePrice: 100,
      tierDiscountAmount: 60,
      prouni: PROUNI_40,
    })
    expect(r.appliedSource).toBe('tier')
    expect(r.finalPrice).toBe(40)
    expect(r.prouniDiscountApplied).toBe(0)
  })

  it('mantém o cupom quando o cupom é maior que lote e benefício', () => {
    const r = combineDiscountsWithProuni({
      basePrice: 100,
      tierDiscountAmount: 10,
      couponDiscountAmount: 55,
      prouni: PROUNI_40,
    })
    expect(r.appliedSource).toBe('coupon')
    expect(r.finalPrice).toBe(45)
  })

  it('empilha sobre o lote quando o benefício foi configurado para isso', () => {
    // R$ 100 − 20% de lote = R$ 80; 40% sobre R$ 80 = R$ 32 → R$ 48.
    const r = combineDiscountsWithProuni({
      basePrice: 100,
      tierDiscountAmount: 20,
      couponDiscountAmount: 90,
      prouni: PROUNI_40_EMPILHA,
    })
    expect(r.appliedSource).toBe('prouni_tier')
    expect(r.tierDiscountApplied).toBe(20)
    expect(r.prouniDiscountApplied).toBe(32)
    expect(r.finalPrice).toBe(48)
    // Empilhar com o cupom também seria o terceiro desconto no mesmo item —
    // o cupom fica de fora de propósito, mesmo sendo maior isoladamente.
    expect(r.couponDiscountApplied).toBe(0)
  })

  it('sem lote ativo, "empilhar" vira desconto simples', () => {
    const r = combineDiscountsWithProuni({
      basePrice: 100,
      tierDiscountAmount: 0,
      prouni: PROUNI_40_EMPILHA,
    })
    expect(r.appliedSource).toBe('prouni')
    expect(r.finalPrice).toBe(60)
  })

  it('desempata a favor do PROUNI', () => {
    // Mesmo desconto pelos dois caminhos: vale o do bolsista, que é o único
    // concedido individualmente e o que precisa aparecer na fatura.
    const r = combineDiscountsWithProuni({
      basePrice: 100,
      tierDiscountAmount: 40,
      prouni: PROUNI_40,
    })
    expect(r.appliedSource).toBe('prouni')
    expect(r.finalPrice).toBe(60)
  })

  it('não gera preço negativo com benefício fixo maior que o item', () => {
    const r = combineDiscountsWithProuni({
      basePrice: 30,
      prouni: { discountType: 'fixed', discountValue: 100, stackWithTier: false },
    })
    expect(r.finalPrice).toBe(0)
    expect(r.prouniDiscountApplied).toBe(30)
  })

  it('item gratuito não vira crédito', () => {
    const r = combineDiscountsWithProuni({ basePrice: 0, prouni: PROUNI_40 })
    expect(r.finalPrice).toBe(0)
    expect(r.appliedSource).toBe('none')
  })

  it('arredonda em centavos, sem sobra de ponto flutuante', () => {
    const r = combineDiscountsWithProuni({
      basePrice: 19.9,
      prouni: { discountType: 'percentage', discountValue: 33, stackWithTier: false },
    })
    expect(r.prouniDiscountApplied).toBe(6.57)
    expect(r.finalPrice).toBe(13.33)
  })
})

describe('getProuniDiscountLabel', () => {
  it('descreve percentual e valor fixo', () => {
    expect(getProuniDiscountLabel({ discountType: 'percentage', discountValue: 40 })).toBe('40% OFF')
    expect(getProuniDiscountLabel({ discountType: 'fixed', discountValue: 12.5 })).toBe('R$ 12,50 OFF')
  })
})
