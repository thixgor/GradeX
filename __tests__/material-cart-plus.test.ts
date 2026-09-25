import { describe, expect, it, vi } from 'vitest'
import { ObjectId } from 'mongodb'

vi.mock('@/lib/payments/audit', () => ({ audit: vi.fn() }))

import { resolveMaterialCart } from '@/lib/material-cart'

/**
 * Carrinho de assinante Plus+.
 *
 * O Plus+ inclui o acervo, mas só dá acesso depois do resgate. O carrinho
 * precisa separar "já é seu" (`already_owned`, sai do carrinho) de "a
 * assinatura inclui, falta resgatar" (`plus_claimable`, vira a tela de
 * resgate) — tratar os dois igual tirava do carrinho itens que a pessoa não
 * tinha.
 */

const userId = new ObjectId()
const materialLivre = new ObjectId()
const materialComprado = new ObjectId()
const pacote = new ObjectId()

interface Estado {
  accountType: string
  compras: Array<{ itemType: string; itemId: string }>
}

function fakeDb({ accountType, compras }: Estado) {
  const docs: Record<string, any[]> = {
    materials: [
      { _id: materialLivre, title: 'Resumo de Cardio', pricing: 'paid', price: 30 },
      { _id: materialComprado, title: 'Resumo de Pneumo', pricing: 'paid', price: 25 },
    ],
    material_packages: [
      { _id: pacote, title: 'Pacote Clínica', pricing: 'paid', price: 90, materialIds: [] },
    ],
    material_purchases: compras,
  }
  const cursor = (rows: any[]) => ({
    project: () => cursor(rows),
    toArray: async () => rows,
  })
  return {
    collection: (name: string) => ({
      find: (filtro: any) => {
        const rows = docs[name] || []
        const ids = filtro?._id?.$in?.map((id: ObjectId) => String(id))
        return cursor(ids ? rows.filter((r) => ids.includes(String(r._id))) : rows)
      },
      findOne: async () => (name === 'users' ? { _id: userId, accountType } : null),
    }),
  } as any
}

const sessao = { userId: String(userId), role: 'user' as const }
const carrinho = [
  { itemType: 'material' as const, itemId: String(materialLivre) },
  { itemType: 'material' as const, itemId: String(materialComprado) },
  { itemType: 'package' as const, itemId: String(pacote) },
]

describe('resolveMaterialCart — Plus+', () => {
  it('marca como plus_claimable o que a assinatura inclui e ainda não foi resgatado', async () => {
    const db = fakeDb({
      accountType: 'plus',
      compras: [{ itemType: 'material', itemId: String(materialComprado) }],
    })
    const r = await resolveMaterialCart(db, sessao, carrinho)

    const motivo = (id: ObjectId) => r.skippedItems.find((s) => s.itemId === String(id))?.reason
    expect(motivo(materialLivre)).toBe('plus_claimable')
    expect(motivo(pacote)).toBe('plus_claimable')
    // O que já foi comprado/resgatado continua "já possui".
    expect(motivo(materialComprado)).toBe('already_owned')
    // E nada é cobrado de um assinante.
    expect(r.payableItems).toHaveLength(0)
    expect(r.amount).toBe(0)
  })

  it('o legado premium é Plus+ também', async () => {
    const db = fakeDb({ accountType: 'premium', compras: [] })
    const r = await resolveMaterialCart(db, sessao, carrinho.slice(0, 1))
    expect(r.skippedItems.map((s) => s.reason)).toEqual(['plus_claimable'])
  })

  it('conta gratuita segue comprando normalmente', async () => {
    const db = fakeDb({ accountType: 'free', compras: [] })
    const r = await resolveMaterialCart(db, sessao, carrinho)
    expect(r.skippedItems.some((s) => s.reason === 'plus_claimable')).toBe(false)
    expect(r.payableItems.map((i) => i.itemId).sort()).toEqual(
      [String(materialLivre), String(materialComprado), String(pacote)].sort(),
    )
  })
})
