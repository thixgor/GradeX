import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Regra central: o resgate do Plus+ vale enquanto a assinatura valer; a compra
 * avulsa é vitalícia. Os testes usam um `material_purchases` em memória e
 * verificam quais documentos cada operação alcança.
 */

vi.mock('@/lib/payments/audit', () => ({ audit: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/lib/mongodb', () => ({ getDb: vi.fn() }))

import { revokePlusClaims, restorePlusClaims, PLUS_CLAIM_REVOKED_STATUS } from '@/lib/plus-claims'

type Doc = Record<string, any>

/** Mini-implementação dos operadores do Mongo usados por `plus-claims`. */
function matches(doc: Doc, filter: Doc): boolean {
  return Object.entries(filter).every(([key, cond]) => {
    const value = doc[key]
    if (cond && typeof cond === 'object' && !Array.isArray(cond) && !(cond instanceof Date)) {
      if ('$in' in cond) return (cond.$in as any[]).some(v => String(v) === String(value))
      if ('$ne' in cond) return value !== cond.$ne
    }
    return String(value) === String(cond)
  })
}

function makeDb(docs: Doc[]) {
  const collection = {
    find(filter: Doc) {
      const found = docs.filter(d => matches(d, filter))
      return { toArray: async () => found.map(d => ({ ...d })) }
    },
    async updateMany(filter: Doc, update: Doc) {
      const found = docs.filter(d => matches(d, filter))
      for (const doc of found) {
        Object.assign(doc, update.$set || {})
        for (const key of Object.keys(update.$unset || {})) delete doc[key]
      }
      return { modifiedCount: found.length }
    },
    async countDocuments(filter: Doc) {
      return docs.filter(d => matches(d, filter)).length
    },
  }
  return { collection: () => collection } as any
}

const baseDocs = (): Doc[] => [
  // Resgatado pelo Plus+ — some quando a assinatura cai.
  { _id: 'c1', userId: 'u1', itemType: 'material', itemId: 'm1', itemTitle: 'Resgatado', price: 0, source: 'plus', status: 'completed' },
  { _id: 'c2', userId: 'u1', itemType: 'package', itemId: 'p1', itemTitle: 'Pacote resgatado', price: 0, source: 'plus', status: 'completed' },
  // Comprado avulso — vitalício.
  { _id: 'b1', userId: 'u1', itemType: 'material', itemId: 'm2', itemTitle: 'Comprado', price: 29.9, source: 'purchase', status: 'completed' },
  // Compra legada, sem o campo `source`.
  { _id: 'b2', userId: 'u1', itemType: 'material', itemId: 'm3', itemTitle: 'Legado', price: 19.9, status: 'completed' },
  // Compra estornada — não pode ressuscitar numa renovação.
  { _id: 'b3', userId: 'u1', itemType: 'material', itemId: 'm4', itemTitle: 'Estornado', price: 39.9, source: 'purchase', status: 'refunded' },
  // Outro usuário — nunca é tocado.
  { _id: 'x1', userId: 'u2', itemType: 'material', itemId: 'm1', itemTitle: 'De outro', price: 0, source: 'plus', status: 'completed' },
]

describe('revokePlusClaims', () => {
  let docs: Doc[]
  beforeEach(() => { docs = baseDocs() })

  it('suspende apenas os resgates do Plus+ do usuário', async () => {
    const result = await revokePlusClaims('u1', 'plan_expired', makeDb(docs))

    expect(result.count).toBe(2)
    expect(docs.find(d => d._id === 'c1')!.status).toBe(PLUS_CLAIM_REVOKED_STATUS)
    expect(docs.find(d => d._id === 'c2')!.status).toBe(PLUS_CLAIM_REVOKED_STATUS)
  })

  it('não toca em material comprado avulso, nem no legado sem `source`', async () => {
    await revokePlusClaims('u1', 'plan_expired', makeDb(docs))

    expect(docs.find(d => d._id === 'b1')!.status).toBe('completed')
    expect(docs.find(d => d._id === 'b2')!.status).toBe('completed')
  })

  it('não alcança outro usuário', async () => {
    await revokePlusClaims('u1', 'plan_expired', makeDb(docs))
    expect(docs.find(d => d._id === 'x1')!.status).toBe('completed')
  })

  it('registra motivo e data da suspensão', async () => {
    await revokePlusClaims('u1', 'refund:charged_back', makeDb(docs))

    const claim = docs.find(d => d._id === 'c1')!
    expect(claim.plusRevokedReason).toBe('refund:charged_back')
    expect(claim.plusRevokedAt).toBeInstanceOf(Date)
  })

  it('é idempotente', async () => {
    const db = makeDb(docs)
    await revokePlusClaims('u1', 'plan_expired', db)
    const second = await revokePlusClaims('u1', 'plan_expired', db)
    expect(second.count).toBe(0)
  })
})

describe('restorePlusClaims', () => {
  let docs: Doc[]
  beforeEach(() => { docs = baseDocs() })

  it('devolve na renovação exatamente o que foi suspenso', async () => {
    const db = makeDb(docs)
    await revokePlusClaims('u1', 'plan_expired', db)

    const restored = await restorePlusClaims('u1', 'subscription_renewed', db)

    expect(restored.count).toBe(2)
    expect(docs.find(d => d._id === 'c1')!.status).toBe('completed')
    expect(docs.find(d => d._id === 'c1')!.plusRestoredAt).toBeInstanceOf(Date)
    expect(docs.find(d => d._id === 'c1')!.plusRevokedAt).toBeUndefined()
  })

  it('não ressuscita compra estornada', async () => {
    const db = makeDb(docs)
    await revokePlusClaims('u1', 'plan_expired', db)
    await restorePlusClaims('u1', 'subscription_renewed', db)

    expect(docs.find(d => d._id === 'b3')!.status).toBe('refunded')
  })

  it('deixa suspenso o resgate de item que virou compra avulsa nesse meio-tempo', async () => {
    const db = makeDb(docs)
    await revokePlusClaims('u1', 'plan_expired', db)
    // Comprou o m1 avulso enquanto estava sem Plus+.
    docs.push({ _id: 'b4', userId: 'u1', itemType: 'material', itemId: 'm1', price: 24.9, source: 'purchase', status: 'completed' })

    const restored = await restorePlusClaims('u1', 'subscription_renewed', db)

    expect(restored.count).toBe(1)
    expect(restored.items[0].itemId).toBe('p1')
    expect(docs.find(d => d._id === 'c1')!.status).toBe(PLUS_CLAIM_REVOKED_STATUS)
    expect(docs.find(d => d._id === 'b4')!.status).toBe('completed')
  })

  it('sem nada suspenso, não faz nada', async () => {
    const restored = await restorePlusClaims('u1', 'subscription_renewed', makeDb(docs))
    expect(restored.count).toBe(0)
  })
})
