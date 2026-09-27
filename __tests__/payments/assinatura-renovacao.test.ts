import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ObjectId } from 'mongodb'

/**
 * Assinante recorrente perdia o Plus+ depois do primeiro ciclo mesmo pagando:
 * `premiumExpiresAt` nunca era estendido nas renovações e o /tier-limits
 * rebaixava a conta quando a data passava. E um cancelamento que falhava no MP
 * era marcado como feito — o MP seguia cobrando de quem perdeu o acesso.
 */

const getPreapproval = vi.fn()
const cancelPreapproval = vi.fn()
vi.mock('@/lib/payments', () => ({
  getPaymentProvider: () => ({ getPreapproval: (...a: any[]) => getPreapproval(...a), cancelPreapproval: (...a: any[]) => cancelPreapproval(...a) }),
}))
vi.mock('@/lib/payments/audit', () => ({ audit: vi.fn() }))
const restorePlusClaims = vi.fn(async (..._a: any[]) => ({ count: 2, items: [] as any[] }))
vi.mock('@/lib/plus-claims', () => ({ restorePlusClaims: (...a: any[]) => restorePlusClaims(...a) }))
// Cargos pagos do registro: aqui, os Plus.
vi.mock('@/lib/cargos-server', () => ({ contaEhPaga: async (t?: string | null) => t === 'plus' || t === 'premium' }))

import {
  accessUntilForSubscription,
  keepAccessIfSubscribed,
  preapprovalIdFromPayment,
  SUBSCRIPTION_GRACE_DAYS,
  syncSubscription,
} from '@/lib/payments/subscription-sync'

const DIA = 86_400_000
const userId = new ObjectId()

function banco(user: any, subs: any[] = []) {
  const estado = { user: { _id: userId, ...user }, subs }
  const db = {
    collection: (name: string) => ({
      findOne: async (q: any) => {
        if (name === 'users') return estado.user
        if (name === 'subscriptions') return estado.subs.find(s => s.status === q.status && !s.cancelAtPeriodEnd) || null
        return null
      },
      updateOne: async (q: any, u: any) => {
        if (name === 'users') Object.assign(estado.user, u.$set)
        if (name === 'subscriptions') Object.assign(estado.subs.find(s => s._id === q._id) || {}, u.$set)
        return { matchedCount: 1 }
      },
    }),
  } as any
  return { db, estado }
}

function assinatura(over: any = {}) {
  return {
    _id: 'sub1',
    userId: String(userId),
    planId: 'plus_mensal',
    role: 'plus',
    providerSubscriptionId: 'pre-1',
    status: 'authorized',
    currentPeriodEndsAt: new Date(Date.now() - 2 * DIA),
    cancelAtPeriodEnd: false,
    ...over,
  }
}

beforeEach(() => {
  getPreapproval.mockReset()
  cancelPreapproval.mockReset()
  restorePlusClaims.mockClear()
})

describe('accessUntilForSubscription', () => {
  it('próxima cobrança + folga', () => {
    const next = new Date('2026-11-10T12:00:00Z')
    expect(accessUntilForSubscription({ nextBillingAt: next })!.getTime()).toBe(next.getTime() + SUBSCRIPTION_GRACE_DAYS * DIA)
  })
  it('usa a mais tarde entre próxima cobrança e fim do período', () => {
    const a = new Date('2026-11-10'), b = new Date('2026-12-10')
    expect(accessUntilForSubscription({ nextBillingAt: a, currentPeriodEndsAt: b })!.getTime()).toBe(b.getTime() + SUBSCRIPTION_GRACE_DAYS * DIA)
  })
  it('sem datas: null', () => {
    expect(accessUntilForSubscription({})).toBeNull()
  })
})

describe('syncSubscription — renovação', () => {
  it('assinante em dia com data vencida: acesso estendido até a próxima cobrança + folga', async () => {
    const proxima = new Date(Date.now() + 28 * DIA)
    const { db, estado } = banco({ accountType: 'plus', premiumExpiresAt: new Date(Date.now() - DIA), mercadoPagoPreapprovalId: 'pre-1' }, [assinatura()])
    getPreapproval.mockResolvedValue({ status: 'authorized', nextBillingAt: proxima })

    const r = await syncSubscription(db, estado.subs[0])

    expect(r.userUpdated).toBe(true)
    expect(estado.user.premiumExpiresAt.getTime()).toBe(proxima.getTime() + SUBSCRIPTION_GRACE_DAYS * DIA)
    expect(estado.subs[0].currentPeriodEndsAt.getTime()).toBe(proxima.getTime())
    expect(estado.user.accountType).toBe('plus')
  })

  it('pagante já rebaixado pelo defeito antigo: volta ao Plus+ com os materiais', async () => {
    const proxima = new Date(Date.now() + 10 * DIA)
    const { db, estado } = banco({ accountType: 'gratuito', premiumExpiresAt: null, mercadoPagoPreapprovalId: 'pre-1' }, [assinatura()])
    getPreapproval.mockResolvedValue({ status: 'authorized', nextBillingAt: proxima })

    await syncSubscription(db, estado.subs[0])

    expect(estado.user.accountType).toBe('plus')
    expect(estado.user.premiumPlanType).toBe('plus_mensal')
    expect(estado.user.premiumExpiresAt > new Date()).toBe(true)
    expect(restorePlusClaims).toHaveBeenCalledTimes(1)
  })

  it('compra vitalícia de outra origem: não vira data', async () => {
    const { db, estado } = banco({ accountType: 'plus', premiumExpiresAt: null, mercadoPagoPreapprovalId: 'outra' }, [assinatura()])
    getPreapproval.mockResolvedValue({ status: 'authorized', nextBillingAt: new Date(Date.now() + 10 * DIA) })
    const r = await syncSubscription(db, estado.subs[0])
    expect(r.userUpdated).toBe(false)
    expect(estado.user.premiumExpiresAt).toBeNull()
  })

  it('plano avulso que vai além: não encurta', async () => {
    const longe = new Date(Date.now() + 200 * DIA)
    const { db, estado } = banco({ accountType: 'plus', premiumExpiresAt: longe, mercadoPagoPreapprovalId: 'outra' }, [assinatura()])
    getPreapproval.mockResolvedValue({ status: 'authorized', nextBillingAt: new Date(Date.now() + 10 * DIA) })
    await syncSubscription(db, estado.subs[0])
    expect(estado.user.premiumExpiresAt).toBe(longe)
  })

  it('cancelada/pausada no MP (ex.: renovação recusada): a data não anda', async () => {
    const venceu = new Date(Date.now() - DIA)
    const { db, estado } = banco({ accountType: 'plus', premiumExpiresAt: venceu, mercadoPagoPreapprovalId: 'pre-1' }, [assinatura()])
    getPreapproval.mockResolvedValue({ status: 'paused', nextBillingAt: new Date(Date.now() + 10 * DIA) })
    const r = await syncSubscription(db, estado.subs[0])
    expect(r.accessUntil).toBeNull()
    expect(estado.user.premiumExpiresAt).toBe(venceu)
    expect(estado.subs[0].status).toBe('paused')
  })
})

describe('syncSubscription — cancelamento que não pegou no MP', () => {
  it('pessoa cancelou e o MP segue autorizado: refaz o cancelamento e não estende', async () => {
    const { db, estado } = banco({ accountType: 'plus', premiumExpiresAt: new Date(Date.now() + DIA), mercadoPagoPreapprovalId: 'pre-1' }, [assinatura({ cancelAtPeriodEnd: true })])
    getPreapproval.mockResolvedValue({ status: 'authorized', nextBillingAt: new Date(Date.now() + 30 * DIA) })
    cancelPreapproval.mockResolvedValue({ status: 'cancelled' })

    const r = await syncSubscription(db, estado.subs[0])

    expect(cancelPreapproval).toHaveBeenCalledWith('pre-1')
    expect(r).toMatchObject({ cancelRetried: true, accessUntil: null, userUpdated: false })
    expect(estado.subs[0].status).toBe('cancelled')
  })
})

describe('keepAccessIfSubscribed (autocorreção do /tier-limits)', () => {
  it('com assinatura autorizada: sincroniza e diz para NÃO rebaixar', async () => {
    const { db } = banco({ accountType: 'plus', premiumExpiresAt: new Date(Date.now() - DIA), mercadoPagoPreapprovalId: 'pre-1' }, [assinatura()])
    getPreapproval.mockResolvedValue({ status: 'authorized', nextBillingAt: new Date(Date.now() + 20 * DIA) })
    expect(await keepAccessIfSubscribed(db, String(userId))).toBe(true)
  })
  it('sem assinatura: false (rebaixa como antes)', async () => {
    const { db } = banco({ accountType: 'plus', premiumExpiresAt: new Date(Date.now() - DIA) }, [])
    expect(await keepAccessIfSubscribed(db, String(userId))).toBe(false)
  })
  it('MP fora do ar: false, sem lançar', async () => {
    const { db } = banco({ accountType: 'plus' }, [assinatura()])
    getPreapproval.mockRejectedValue(new Error('timeout'))
    expect(await keepAccessIfSubscribed(db, String(userId))).toBe(false)
  })
})

describe('preapprovalIdFromPayment', () => {
  it('lê o id da assinatura no pagamento de renovação', () => {
    expect(preapprovalIdFromPayment({ metadata: { preapproval_id: 'pre-9' } })).toBe('pre-9')
    expect(preapprovalIdFromPayment({ point_of_interaction: { transaction_data: { subscription_id: 'pre-8' } } })).toBe('pre-8')
    expect(preapprovalIdFromPayment({})).toBeNull()
  })
})
