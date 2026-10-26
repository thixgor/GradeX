import { ObjectId } from 'mongodb'
import { describe, expect, it } from 'vitest'

import { mongoDeMentira } from '../ajudantes/mongo-de-mentira'
import { isCouponAllowedForUser, validateCouponForCheckout } from '@/lib/coupons'
import { gerarCodigoDaOferta, situacaoDaOferta } from '@/lib/ofertas-exclusivas'
import {
  compararPrecos,
  fraseDaDiferenca,
  montarCompraDaTroca,
  normalizarTratamento,
  precoDeCatalogo,
} from '@/lib/trocas-de-produto'

/**
 * O que estes testes protegem:
 *
 *  - o cupom da oferta exclusiva é de UMA pessoa: se outra conta digitar o
 *    código (vazou num print, foi repassado), o checkout recusa;
 *  - a troca de produto avisa certo quando o novo é mais caro ou mais barato e
 *    nunca promete no e-mail o que o admin não escolheu;
 *  - o acesso trocado carrega o que a compra original tinha (valor pago,
 *    pedido, prazo), sem levar junto o que era do item antigo.
 */

const DONA = new ObjectId().toHexString()
const OUTRA = new ObjectId().toHexString()

describe('cupom de uma pessoa só', () => {
  const restrito = { allowedUserIds: [DONA], allowedUserEmails: ['dona@exemplo.com'] }

  it('cupom aberto vale para qualquer conta', () => {
    expect(isCouponAllowedForUser({}, { userId: OUTRA })).toBe(true)
    expect(isCouponAllowedForUser({ allowedUserIds: [], allowedUserEmails: null }, {})).toBe(true)
  })

  it('reconhece a dona pelo id ou pelo e-mail, sem diferenciar maiúsculas', () => {
    expect(isCouponAllowedForUser(restrito, { userId: DONA })).toBe(true)
    expect(isCouponAllowedForUser(restrito, { userEmail: 'Dona@Exemplo.com ' })).toBe(true)
  })

  it('recusa outra conta e visitante sem identificação', () => {
    expect(isCouponAllowedForUser(restrito, { userId: OUTRA, userEmail: 'outra@exemplo.com' })).toBe(false)
    expect(isCouponAllowedForUser(restrito, {})).toBe(false)
  })

  it('o checkout recusa o código digitado por outra pessoa', async () => {
    const cupom = {
      _id: new ObjectId().toHexString(),
      code: 'OFERTA-AB12CD',
      codeNormalized: 'OFERTA-AB12CD',
      discountType: 'percentage',
      discountValue: 20,
      scope: 'all',
      usageCount: 0,
      usageLimit: 1,
      isActive: true,
      ...restrito,
    }
    const db = mongoDeMentira({ coupons: [cupom], coupon_redemptions: [], payment_orders: [] })
    const itens = [{ itemType: 'material' as const, itemId: 'm1', itemTitle: 'Material', price: 100 }]

    await expect(
      validateCouponForCheckout(db, { code: 'oferta-ab12cd', items: itens, userId: OUTRA, userEmail: 'outra@exemplo.com' })
    ).rejects.toThrow('exclusivo de outra conta')

    const ok = await validateCouponForCheckout(db, { code: 'OFERTA-AB12CD', items: itens, userId: DONA })
    expect(ok.discountAmount).toBe(20)
  })
})

describe('comparação de preço da troca', () => {
  it('item grátis vale zero no catálogo, seja qual for o preço gravado', () => {
    expect(precoDeCatalogo({ pricing: 'free', price: 99 })).toBe(0)
    expect(precoDeCatalogo({ pricing: 'paid', price: 49.9 })).toBe(49.9)
    expect(precoDeCatalogo(null)).toBe(0)
  })

  it('classifica mais caro, mais barato e mesmo preço', () => {
    expect(compararPrecos({ precoAntigo: 100, precoNovo: 150, valorPago: 80 })).toMatchObject({ relacao: 'mais_caro', diferenca: 50, valorPago: 80 })
    expect(compararPrecos({ precoAntigo: 150, precoNovo: 100, valorPago: 150 })).toMatchObject({ relacao: 'mais_barato', diferenca: -50 })
    expect(compararPrecos({ precoAntigo: 0.1 + 0.2, precoNovo: 0.3, valorPago: 0 }).relacao).toBe('mesmo_preco')
  })

  it('só aceita o tratamento que serve para a relação', () => {
    expect(normalizarTratamento('mesmo_preco', 'cortesia')).toBeNull()
    expect(normalizarTratamento('mais_caro', 'diferenca_paga')).toBe('diferenca_paga')
    expect(normalizarTratamento('mais_caro', 'sem_reembolso')).toBe('cortesia')
    expect(normalizarTratamento('mais_barato', undefined)).toBe('sem_reembolso')
  })

  it('o e-mail diz a diferença e o que foi decidido sobre ela', () => {
    const maisCaro = compararPrecos({ precoAntigo: 100, precoNovo: 130, valorPago: 100 })
    expect(fraseDaDiferenca(maisCaro, 'cortesia')).toContain('R$ 30,00 a mais')
    expect(fraseDaDiferenca(maisCaro, 'cortesia')).toContain('não paga nada a mais')
    expect(fraseDaDiferenca(maisCaro, 'diferenca_paga')).not.toContain('não paga nada a mais')

    const maisBarato = compararPrecos({ precoAntigo: 130, precoNovo: 100, valorPago: 130 })
    expect(fraseDaDiferenca(maisBarato, 'sem_reembolso')).toContain('R$ 30,00 a menos')
    expect(fraseDaDiferenca(maisBarato, 'reembolso_combinado')).toContain('devolução')

    expect(fraseDaDiferenca(compararPrecos({ precoAntigo: 50, precoNovo: 50, valorPago: 50 }), null)).toContain('mesmo valor')
  })
})

describe('compra nascida da troca', () => {
  it('herda dinheiro, pedido e prazo; deixa para trás o que era do item antigo', () => {
    const agora = new Date('2026-10-26T12:00:00Z')
    const comprada = new Date('2026-09-01T12:00:00Z')
    const vence = new Date('2027-09-01T12:00:00Z')
    const antiga = {
      _id: new ObjectId(),
      userId: DONA,
      userName: 'Dona',
      userEmail: 'dona@exemplo.com',
      itemType: 'material' as const,
      itemId: 'velho',
      itemTitle: 'Cardio Essencial',
      price: 89.9,
      provider: 'mercado_pago' as const,
      providerOrderId: 'pedido-1',
      providerPaymentId: 'mp-1',
      status: 'completed' as const,
      purchasedAt: comprada,
      accessMode: 'timed' as const,
      accessVersionId: 'versao-do-item-velho',
      accessVersionLabel: '12 meses',
      accessExpiresAt: vence,
      downloadDisabled: true,
      pdfDownloadAllowed: true,
    }

    const nova = montarCompraDaTroca(
      antiga,
      { itemType: 'package', itemId: 'novo', itemTitle: 'Pacote Cardio' },
      { userId: 'admin-1', name: 'Admin' },
      agora
    )

    expect(nova).toMatchObject({
      userId: DONA,
      itemType: 'package',
      itemId: 'novo',
      itemTitle: 'Pacote Cardio',
      status: 'completed',
      source: 'swap',
      price: 89.9,
      providerOrderId: 'pedido-1',
      purchasedAt: comprada,
      accessMode: 'timed',
      accessExpiresAt: vence,
      downloadDisabled: true,
      swappedFromPurchaseId: String(antiga._id),
      swappedFromItem: { itemType: 'material', itemId: 'velho', itemTitle: 'Cardio Essencial' },
      swappedBy: 'admin-1',
      swappedAt: agora,
    })
    expect(nova).not.toHaveProperty('accessVersionId')
    expect(nova).not.toHaveProperty('pdfDownloadAllowed')
    expect(nova).not.toHaveProperty('_id')
  })
})

describe('oferta exclusiva', () => {
  const itens = [
    { itemType: 'material' as const, itemId: 'a', titulo: 'A' },
    { itemType: 'package' as const, itemId: 'b', titulo: 'B' },
  ]

  it('situação acompanha o que a pessoa já tem', () => {
    const base = { status: 'ativa' as const, abertaEm: null, itens }
    expect(situacaoDaOferta(base, new Set())).toBe('enviada')
    expect(situacaoDaOferta({ ...base, abertaEm: new Date() }, new Set())).toBe('aberta')
    expect(situacaoDaOferta(base, new Set(['material:a']))).toBe('parcial')
    expect(situacaoDaOferta(base, new Set(['material:a', 'package:b']))).toBe('comprada')
    expect(situacaoDaOferta({ ...base, status: 'cancelada' }, new Set(['material:a', 'package:b']))).toBe('cancelada')
  })

  it('gera códigos legíveis e distintos', () => {
    const codigos = new Set(Array.from({ length: 50 }, () => gerarCodigoDaOferta()))
    expect(codigos.size).toBe(50)
    for (const codigo of codigos) expect(codigo).toMatch(/^OFERTA-[A-HJ-NP-Z2-9]{6}$/)
  })
})
