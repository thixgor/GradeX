import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ObjectId } from 'mongodb'
import { NextRequest } from 'next/server'

/**
 * Operadoras de celular põem muita gente atrás do mesmo IP (CGNAT). Com o
 * limite antigo (60/min por IP), três pessoas acompanhando o Pix ao mesmo
 * tempo já encostavam no limite, e a quarta estourava e a tela parava de ver a aprovação.
 */

const contagem = new Map<string, number>()
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: async (chave: string, endpoint: string, limite: number) => {
    const k = `${endpoint}|${chave}`
    const n = (contagem.get(k) || 0) + 1
    contagem.set(k, n)
    return { success: n <= limite, remaining: Math.max(0, limite - n) }
  },
}))
vi.mock('@/lib/auth', () => ({ getSession: async () => null }))
vi.mock('@/lib/payments', () => ({ getPaymentProvider: () => ({ getPayment: async () => ({ status: 'pending' }) }) }))
vi.mock('@/lib/payments/effects', () => ({ applyPaymentResult: async (_: string, r: any) => ({ order: null, applied: false }) }))
vi.mock('@/lib/mongodb', () => ({
  getDb: async () => ({
    collection: () => ({
      findOne: async (q: any) => ({ _id: q._id, status: 'pending', type: 'plan', metadata: { serialKeyPurchase: true } }),
    }),
  }),
}))

const pedidos = [new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId()].map(String)

async function consultar(orderId: string, ip = '177.10.20.30') {
  const { GET } = await import('@/app/api/payments/orders/[id]/status/route')
  const res = await GET(new NextRequest(`http://x/api/payments/orders/${orderId}/status`, { headers: { 'x-forwarded-for': ip } }), {
    params: { id: orderId },
  })
  return res.status
}

beforeEach(() => contagem.clear())

describe('status do pedido atrás de IP compartilhado', () => {
  it('quatro compradores no mesmo IP, 1 min de polling a cada 3 s: ninguém é bloqueado', async () => {
    // 20 consultas/min por pessoa × 4 pessoas = 80/min (o limite antigo era 60).
    const status: number[] = []
    for (let i = 0; i < 20; i++) for (const p of pedidos) status.push(await consultar(p))
    expect(status.every(s => s === 200)).toBe(true)
  })

  it('quem martela o MESMO pedido é barrado, sem afetar os outros do IP', async () => {
    for (let i = 0; i < 40; i++) await consultar(pedidos[0])
    expect(await consultar(pedidos[0])).toBe(429)
    expect(await consultar(pedidos[1])).toBe(200)
  })

  it('varrer muitos ids do mesmo IP continua barrado pelo teto por IP', async () => {
    let bloqueou = false
    for (let i = 0; i < 320 && !bloqueou; i++) bloqueou = (await consultar(String(new ObjectId()))) === 429
    expect(bloqueou).toBe(true)
  })
})
