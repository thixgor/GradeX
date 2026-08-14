import { describe, expect, it } from 'vitest'

import {
  COUPON_PROMO_HEADLINE_MAX,
  COUPON_PROMO_SUBTEXT_MAX,
  buildCouponPromoPayload,
  couponPromoConditions,
  isCouponItemEligible,
  isCouponPromoVisible,
  normalizeCouponPromo,
  type Coupon,
  type CouponCheckoutItem,
} from '@/lib/coupons'

/**
 * O que estes testes protegem: a promessa feita na tela de pagamento.
 *
 * O chamativo é texto livre de admin exibido a quem está prestes a pagar. Se
 * ele anunciar um desconto que o servidor vai recusar — cupom vencido,
 * esgotado, de outro produto, ou com uma condição escondida — a pessoa digita o
 * código, toma erro e vai embora achando que a loja mentiu. Cada caso abaixo é
 * um jeito de isso acontecer.
 */

function cupom(overrides: Partial<Coupon> = {}): Coupon {
  return {
    _id: 'abc123',
    code: 'MED20',
    codeNormalized: 'MED20',
    discountType: 'percentage',
    discountValue: 20,
    scope: 'all',
    usageCount: 0,
    isActive: true,
    createdBy: 'admin',
    createdByName: 'Admin',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    promo: {
      enabled: true,
      headline: 'Leve com 20% OFF',
      subtext: '',
      showCode: true,
      tone: 'destaque',
    },
    ...overrides,
  } as Coupon
}

function item(overrides: Partial<CouponCheckoutItem> = {}): CouponCheckoutItem {
  return {
    itemType: 'material',
    itemId: 'mat-1',
    itemTitle: 'Material',
    price: 100,
    ...overrides,
  }
}

describe('normalizeCouponPromo', () => {
  it('devolve null quando o chamativo está desligado', () => {
    expect(normalizeCouponPromo({ enabled: false, headline: 'Oferta' })).toBeNull()
    expect(normalizeCouponPromo(null)).toBeNull()
    expect(normalizeCouponPromo(undefined)).toBeNull()
  })

  it('devolve null quando está ligado mas sem chamada — faixa vazia não é campanha', () => {
    expect(normalizeCouponPromo({ enabled: true, headline: '   ' })).toBeNull()
    expect(normalizeCouponPromo({ enabled: true })).toBeNull()
  })

  it('corta textos longos em vez de deixar estourar o layout do checkout', () => {
    const promo = normalizeCouponPromo({
      enabled: true,
      headline: 'a'.repeat(300),
      subtext: 'b'.repeat(500),
    })
    expect(promo?.headline).toHaveLength(COUPON_PROMO_HEADLINE_MAX)
    expect(promo?.subtext).toHaveLength(COUPON_PROMO_SUBTEXT_MAX)
  })

  it('cai no tom padrão quando recebe um tom inventado', () => {
    const promo = normalizeCouponPromo({ enabled: true, headline: 'Oferta', tone: 'neon' as any })
    expect(promo?.tone).toBe('destaque')
  })

  it('mostra o código por padrão, e respeita o desligamento explícito', () => {
    expect(normalizeCouponPromo({ enabled: true, headline: 'Oferta' })?.showCode).toBe(true)
    expect(normalizeCouponPromo({ enabled: true, headline: 'Oferta', showCode: false })?.showCode).toBe(false)
  })
})

describe('isCouponPromoVisible', () => {
  const agora = new Date('2026-06-01T12:00:00Z')

  it('mostra a campanha viva', () => {
    expect(isCouponPromoVisible(cupom(), agora)).toBe(true)
  })

  it('não anuncia cupom sem chamativo configurado', () => {
    expect(isCouponPromoVisible(cupom({ promo: null }), agora)).toBe(false)
    expect(isCouponPromoVisible(cupom({ promo: { enabled: false } as any }), agora)).toBe(false)
  })

  it('cala a boca quando o cupom é desativado', () => {
    expect(isCouponPromoVisible(cupom({ isActive: false }), agora)).toBe(false)
  })

  it('cala a boca quando o cupom vence — anunciar aqui é prometer erro', () => {
    expect(isCouponPromoVisible(cupom({ expiresAt: new Date('2026-05-31T00:00:00Z') }), agora)).toBe(false)
    expect(isCouponPromoVisible(cupom({ expiresAt: new Date('2026-06-02T00:00:00Z') }), agora)).toBe(true)
  })

  it('cala a boca quando o limite de uso se esgota', () => {
    expect(isCouponPromoVisible(cupom({ usageLimit: 10, usageCount: 10 }), agora)).toBe(false)
    expect(isCouponPromoVisible(cupom({ usageLimit: 10, usageCount: 9 }), agora)).toBe(true)
  })
})

describe('couponPromoConditions', () => {
  it('expõe a compra mínima', () => {
    expect(couponPromoConditions(cupom({ minimumCartAmount: 99.9 }))).toContain('Compra mínima de R$ 99,90')
  })

  it('expõe a exclusividade de primeira compra', () => {
    expect(couponPromoConditions(cupom({ firstPurchaseOnly: true }))).toContain('Válido só na primeira compra')
  })

  it('expõe o limite por pessoa, no singular e no plural', () => {
    expect(couponPromoConditions(cupom({ perUserLimit: 1 }))).toContain('Um uso por pessoa')
    expect(couponPromoConditions(cupom({ perUserLimit: 3 }))).toContain('Até 3 usos por pessoa')
  })

  it('conta os usos que ainda restam a partir do contador real', () => {
    expect(couponPromoConditions(cupom({ usageLimit: 50, usageCount: 47 }))).toContain('Restam 3 usos')
    expect(couponPromoConditions(cupom({ usageLimit: 50, usageCount: 49 }))).toContain('Resta 1 uso')
  })

  it('nunca anuncia uso negativo se o contador passar do teto', () => {
    expect(couponPromoConditions(cupom({ usageLimit: 5, usageCount: 9 }))).toContain('Restam 0 usos')
  })

  it('não inventa condição quando o cupom não tem nenhuma', () => {
    expect(couponPromoConditions(cupom())).toEqual([])
  })
})

describe('buildCouponPromoPayload', () => {
  it('entrega o código quando o admin optou por revelá-lo', () => {
    expect(buildCouponPromoPayload(cupom()).code).toBe('MED20')
  })

  it('esconde o código quando o admin desligou — o payload público não vaza', () => {
    const escondido = cupom({
      promo: { enabled: true, headline: 'Oferta', subtext: '', showCode: false, tone: 'destaque' },
    })
    expect(buildCouponPromoPayload(escondido).code).toBeNull()
  })

  it('monta o rótulo do desconto a partir do cupom, não de texto livre', () => {
    expect(buildCouponPromoPayload(cupom()).discountLabel).toBe('20% OFF')
    expect(buildCouponPromoPayload(cupom({ discountType: 'fixed', discountValue: 30 })).discountLabel).toBe('R$ 30,00 OFF')
  })

  it('não devolve nada do documento além do que a vitrine precisa', () => {
    const payload = buildCouponPromoPayload(cupom({ createdBy: 'user-secreto', usageCount: 42 }))
    expect(Object.keys(payload).sort()).toEqual([
      'code',
      'conditions',
      'couponId',
      'discountLabel',
      'expiresAt',
      'headline',
      'subtext',
      'tone',
    ])
  })
})

describe('alcance do chamativo (mesma regra do desconto)', () => {
  it('cupom de escopo "plus" só alcança a assinatura', () => {
    const plus = cupom({ scope: 'plus' })
    expect(isCouponItemEligible(plus, item({ itemType: 'plus', itemId: 'anual' }))).toBe(true)
    expect(isCouponItemEligible(plus, item())).toBe(false)
  })

  it('cupom "all" não alcança a assinatura — nem para anunciar', () => {
    expect(isCouponItemEligible(cupom({ scope: 'all' }), item({ itemType: 'plus', itemId: 'anual' }))).toBe(false)
  })

  it('cupom de itens específicos só anuncia nos itens escolhidos', () => {
    const especifico = cupom({
      scope: 'specific',
      productRefs: [{ itemType: 'material', itemId: 'mat-1' }],
    })
    expect(isCouponItemEligible(especifico, item({ itemId: 'mat-1' }))).toBe(true)
    expect(isCouponItemEligible(especifico, item({ itemId: 'mat-2' }))).toBe(false)
  })

  it('cupom de flashcards não anuncia em material comum', () => {
    const flash = cupom({ scope: 'flashcards' })
    expect(isCouponItemEligible(flash, item({ materialType: 'flashcard_deck' }))).toBe(true)
    expect(isCouponItemEligible(flash, item())).toBe(false)
  })
})
