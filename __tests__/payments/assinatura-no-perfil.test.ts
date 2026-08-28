import { describe, it, expect } from 'vitest'
import {
  DIAS_DE_GARANTIA,
  MESES_DE_RECORRENCIA,
  calcularReceitaRecorrente,
  classificarCobrancaDoPedido,
  diasDeGarantiaRestantes,
  montarResumoDaAssinatura,
  planoEhRecorrente,
  rotuloCurtoDeCiclo,
  rotuloDeCicloDeCobranca,
  rotuloDePeriodoDeCobranca,
} from '@/lib/payments/subscription-view'
import type { SubscriptionRecord } from '@/lib/types'

/**
 * O que o perfil mostra da assinatura recorrente.
 *
 * O defeito que motivou estes testes: cancelar não mudava nada na tela. O
 * cancelamento grava `cancelAtPeriodEnd: true` mas MANTÉM `status:
 * 'authorized'` de propósito — é o que preserva o acesso até o fim do período
 * já pago —, e a interface olhava só o status. O botão "Cancelar assinatura"
 * reaparecia idêntico no reload e a leitura natural era que o cancelamento não
 * tinha funcionado.
 */

const BASE: SubscriptionRecord = {
  userId: 'u1',
  planId: 'anual',
  role: 'plus',
  amount: 397,
  currency: 'BRL',
  billingIntervalMonths: 12,
  provider: 'mercadopago' as SubscriptionRecord['provider'],
  providerSubscriptionId: 'preapproval-1',
  status: 'authorized',
  currentPeriodEndsAt: new Date('2027-03-14T00:00:00Z'),
  nextBillingAt: new Date('2027-03-14T00:00:00Z'),
  createdAt: new Date('2026-03-14T00:00:00Z'),
  updatedAt: new Date('2026-03-14T00:00:00Z'),
}

describe('resumo da assinatura no perfil', () => {
  it('entrega valor, ciclo e próxima cobrança de uma assinatura ativa', () => {
    const resumo = montarResumoDaAssinatura(BASE, 'DomineAqui Plus+')

    expect(resumo.planName).toBe('DomineAqui Plus+')
    expect(resumo.amount).toBe(397)
    expect(resumo.billingIntervalMonths).toBe(12)
    expect(resumo.cancelAtPeriodEnd).toBe(false)
    expect(resumo.nextBillingAt).toEqual(new Date('2027-03-14T00:00:00Z'))
  })

  it('marca o cancelamento mesmo com o status ainda "authorized"', () => {
    // É exatamente o estado que o POST /api/subscriptions/cancel deixa: o
    // status não muda, quem carrega a informação é `cancelAtPeriodEnd`.
    const cancelada: SubscriptionRecord = {
      ...BASE,
      cancelAtPeriodEnd: true,
      canceledAt: new Date('2026-08-28T00:00:00Z'),
    }
    const resumo = montarResumoDaAssinatura(cancelada, 'DomineAqui Plus+')

    expect(resumo.status).toBe('authorized')
    expect(resumo.cancelAtPeriodEnd).toBe(true)
  })

  it('não anuncia próxima cobrança depois do cancelamento', () => {
    // O registro ainda carrega a data antiga; repeti-la na tela seria prometer
    // um débito que não vai acontecer.
    const cancelada: SubscriptionRecord = { ...BASE, cancelAtPeriodEnd: true }
    const resumo = montarResumoDaAssinatura(cancelada, 'DomineAqui Plus+')

    expect(cancelada.nextBillingAt).toBeInstanceOf(Date)
    expect(resumo.nextBillingAt).toBeNull()
    // O acesso pago continua, e a tela precisa da data para dizer até quando.
    expect(resumo.currentPeriodEndsAt).toEqual(new Date('2027-03-14T00:00:00Z'))
  })

  it('nunca deixa o cartão sem título quando o plano saiu do catálogo', () => {
    const resumo = montarResumoDaAssinatura(BASE, 'Plus+')
    expect(resumo.planName).toBe('Plus+')
    expect(resumo.planName.length).toBeGreaterThan(0)
  })
})

describe('rótulo do ciclo de cobrança', () => {
  it('usa as palavras que a pessoa usa', () => {
    expect(rotuloDeCicloDeCobranca(1)).toBe('mês')
    expect(rotuloDeCicloDeCobranca(3)).toBe('3 meses')
    expect(rotuloDeCicloDeCobranca(6)).toBe('6 meses')
    expect(rotuloDeCicloDeCobranca(12)).toBe('ano')
  })

  it('nomeia o período sem confundir semestral com anual', () => {
    // Os ternários antigos caíam em "Anual"/"12 meses" para qualquer ciclo
    // fora de 1 e 3 — um plano semestral anunciaria cobrança anual.
    expect(rotuloDePeriodoDeCobranca(1)).toBe('Mensal')
    expect(rotuloDePeriodoDeCobranca(3)).toBe('Trimestral')
    expect(rotuloDePeriodoDeCobranca(6)).toBe('Semestral')
    expect(rotuloDePeriodoDeCobranca(12)).toBe('Anual')
    expect(rotuloDePeriodoDeCobranca(0)).toBe('Vitalício')
  })

  it('encurta o ciclo para caber no botão de pagar', () => {
    expect(rotuloCurtoDeCiclo(1)).toBe('mês')
    expect(rotuloCurtoDeCiclo(3)).toBe('trim.')
    expect(rotuloCurtoDeCiclo(6)).toBe('sem.')
    expect(rotuloCurtoDeCiclo(12)).toBe('ano')
  })
})

describe('garantia de 7 dias', () => {
  const inicio = new Date('2026-08-01T12:00:00Z')

  it('conta os dias que ainda restam', () => {
    const doisDiasDepois = new Date('2026-08-03T12:00:00Z')
    expect(diasDeGarantiaRestantes(inicio, doisDiasDepois)).toBe(DIAS_DE_GARANTIA - 2)
  })

  it('zera fora do prazo, para o botão de reembolso não aparecer', () => {
    const oitoDiasDepois = new Date('2026-08-09T12:00:00Z')
    expect(diasDeGarantiaRestantes(inicio, oitoDiasDepois)).toBe(0)
  })

  it('zera quando não há data de início', () => {
    expect(diasDeGarantiaRestantes(null)).toBe(0)
    expect(diasDeGarantiaRestantes('data-quebrada')).toBe(0)
  })
})

/**
 * Recorrente vs avulso no painel administrativo.
 *
 * /admin/analytics chamava as duas vendas de "Assinatura": o preapproval que
 * renova sozinho e o plano pago uma vez no modo "Pagamento único". Com o mesmo
 * rótulo e a mesma origem, não havia como responder "quanto dessa receita
 * volta no mês que vem?".
 */
describe('classificação de cobrança do pedido', () => {
  it('só trata preapproval como recorrente', () => {
    expect(classificarCobrancaDoPedido('subscription')).toBe('recorrente')
  })

  it('trata plano pago uma vez como avulso', () => {
    // payment_orders.type === 'plan' é SEMPRE o modo "Pagamento único": a
    // recorrência não passa por /api/payments/orders.
    expect(classificarCobrancaDoPedido('plan')).toBe('avulso')
  })

  it('trata material, pacote e doação como avulsos', () => {
    expect(classificarCobrancaDoPedido('material')).toBe('avulso')
    expect(classificarCobrancaDoPedido('donation')).toBe('avulso')
    expect(classificarCobrancaDoPedido(undefined)).toBe('avulso')
  })
})

describe('receita recorrente estimada (MRR)', () => {
  it('soma apenas as assinaturas que vão renovar', () => {
    const resultado = calcularReceitaRecorrente([
      { amount: 100 },
      { amount: 50 },
    ])
    expect(resultado.total).toBe(150)
    expect(resultado.renovando).toBe(2)
    expect(resultado.canceladasVigentes).toBe(0)
  })

  it('exclui a assinatura já cancelada que ainda está vigente', () => {
    // O cancelamento mantém status 'authorized' até o período pago acabar, e
    // somar essa no MRR fazia a projeção subir justamente quando devia cair.
    const resultado = calcularReceitaRecorrente([
      { amount: 100 },
      { amount: 397, cancelAtPeriodEnd: true },
    ])
    expect(resultado.total).toBe(100)
    expect(resultado.renovando).toBe(1)
    expect(resultado.canceladasVigentes).toBe(1)
  })

  it('devolve zero quando todas foram canceladas', () => {
    const resultado = calcularReceitaRecorrente([
      { amount: 100, cancelAtPeriodEnd: true },
      { amount: 200, cancelAtPeriodEnd: true },
    ])
    expect(resultado.total).toBe(0)
    expect(resultado.renovando).toBe(0)
    expect(resultado.canceladasVigentes).toBe(2)
  })
})

/**
 * Quais ciclos viram cobrança recorrente.
 *
 * A regra morava em três lugares: /buy/checkout e /api/subscriptions conferiam
 * {1, 3, 12}, e o FAQ de /buy tratava como recorrente tudo que não fosse
 * vitalício. Um plano semestral prometia "renovação automática pelo Mercado
 * Pago" numa tela e era vendido como pagamento único na seguinte.
 */
describe('quais planos são recorrentes', () => {
  it('aceita mensal, trimestral, semestral e anual', () => {
    expect(planoEhRecorrente(1)).toBe(true)
    expect(planoEhRecorrente(3)).toBe(true)
    expect(planoEhRecorrente(6)).toBe(true)
    expect(planoEhRecorrente(12)).toBe(true)
    expect(MESES_DE_RECORRENCIA).toEqual([1, 3, 6, 12])
  })

  it('trata vitalício como avulso', () => {
    expect(planoEhRecorrente(0)).toBe(false)
  })

  it('recusa ciclo que o catálogo não oferece', () => {
    expect(planoEhRecorrente(2)).toBe(false)
    expect(planoEhRecorrente(18)).toBe(false)
  })

  it('trata plano sem duração definida como avulso', () => {
    // Planos criados antes de o campo existir chegam com `undefined`, e é o
    // caso mais comum de "o plano diz Anual e o checkout cobra avulso": o
    // campo `periodo` é só um rótulo de texto e não decide nada.
    expect(planoEhRecorrente(undefined)).toBe(false)
    expect(planoEhRecorrente(null)).toBe(false)
  })
})
