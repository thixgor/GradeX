import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'crypto'
import { ObjectId } from 'mongodb'

/**
 * "O Pix demora até 2 minutos para aprovar." O que era nosso nessa demora:
 *  - webhook com `ts` em milissegundos recusado como "fora da janela";
 *  - polling fixo de 4 s, inclusive com a aba escondida, e sem consultar na
 *    hora em que a pessoa volta do app do banco;
 *  - aba descartada pelo Android: a página voltava sem QR e sem acompanhar;
 *  - webhook e polling chegando juntos aplicavam a aprovação duas vezes.
 */

// ── Assinatura do webhook ───────────────────────────────────────────────────
vi.mock('@/lib/payments/config', () => ({
  getPaymentConfig: () => ({ mp: { env: 'production', webhookSecret: 'segredo-de-teste' } }),
}))

import { buildManifest, timestampMs, validateMpWebhook } from '@/lib/payments/mercado-pago/webhook'

function assinar(dataId: string, requestId: string, ts: string) {
  const v1 = crypto.createHmac('sha256', 'segredo-de-teste').update(buildManifest(dataId, requestId, ts)).digest('hex')
  return `ts=${ts},v1=${v1}`
}

describe('webhook do MP: timestamp da assinatura', () => {
  it('aceita ts em segundos e em milissegundos', () => {
    const agora = Date.now()
    expect(timestampMs(String(Math.floor(agora / 1000)))).toBe(Math.floor(agora / 1000) * 1000)
    expect(timestampMs(String(agora))).toBe(agora)
    expect(timestampMs('abc')).toBeNull()
    expect(timestampMs('')).toBeNull()
  })

  for (const [rotulo, ts] of [
    ['segundos', () => String(Math.floor(Date.now() / 1000))],
    ['milissegundos', () => String(Date.now())],
  ] as const) {
    it(`notificação assinada com ts em ${rotulo} é válida`, () => {
      const t = ts()
      const r = validateMpWebhook({
        rawBody: '{}',
        headers: { 'x-signature': assinar('123456', 'req-1', t), 'x-request-id': 'req-1' },
        queryParams: { type: 'payment', 'data.id': '123456' },
      })
      expect(r).toMatchObject({ valid: true, resourceId: '123456', topic: 'payment' })
    })
  }

  it('assinatura errada continua recusada', () => {
    const t = String(Date.now())
    const r = validateMpWebhook({
      rawBody: '{}',
      headers: { 'x-signature': `ts=${t},v1=${'0'.repeat(64)}`, 'x-request-id': 'req-1' },
      queryParams: { type: 'payment', 'data.id': '123456' },
    })
    expect(r.valid).toBe(false)
  })

  it('timestamp velho (replay) continua recusado nos dois formatos', () => {
    for (const t of [String(Date.now() - 10 * 60_000), String(Math.floor((Date.now() - 10 * 60_000) / 1000))]) {
      const r = validateMpWebhook({
        rawBody: '{}',
        headers: { 'x-signature': assinar('1', 'r', t), 'x-request-id': 'r' },
        queryParams: { type: 'payment', 'data.id': '1' },
      })
      expect(r).toMatchObject({ valid: false, reason: 'timestamp fora da janela aceita' })
    }
  })

  it('manifesto: id em minúsculas e parte ausente omitida', () => {
    expect(buildManifest('AbC', 'req', '1')).toBe('id:abc;request-id:req;ts:1;')
    expect(buildManifest('9', '', '1')).toBe('id:9;ts:1;')
  })
})

// ── Ritmo do polling e retomada ─────────────────────────────────────────────
import {
  PENDING_RESUME_TTL_MS,
  pollingDelayMs,
  readPendingCheckout,
  writePendingCheckout,
} from '@/lib/payments/polling'

function memoria() {
  const m = new Map<string, string>()
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    _m: m,
  }
}

describe('polling da tela de pagamento', () => {
  it('rápido nos primeiros minutos, espaçado depois (menos chamadas no total)', () => {
    expect(pollingDelayMs(0)).toBe(3_000)
    expect(pollingDelayMs(3 * 60_000)).toBe(6_000)
    expect(pollingDelayMs(30 * 60_000)).toBe(15_000)
    // Uma hora com a aba aberta: antes 900 consultas (4 s fixos).
    let t = 0
    let n = 0
    while (t < 60 * 60_000) {
      t += pollingDelayMs(t)
      n++
    }
    expect(n).toBeLessThan(400)
  })

  it('retoma o pagamento pendente salvo e descarta o vencido ou corrompido', () => {
    const s = memoria()
    writePendingCheckout(s, 'k', { order: { orderId: 'o1', status: 'pending' }, method: 'pix', savedAt: Date.now() })
    expect(readPendingCheckout(s, 'k')?.order).toMatchObject({ orderId: 'o1' })

    writePendingCheckout(s, 'k', { order: { orderId: 'o1' }, method: 'pix', savedAt: Date.now() - PENDING_RESUME_TTL_MS - 1 })
    expect(readPendingCheckout(s, 'k')).toBeNull()
    expect(s._m.has('k')).toBe(false)

    s.setItem('k', '{isso não é json')
    expect(readPendingCheckout(s, 'k')).toBeNull()
    expect(readPendingCheckout(null, 'k')).toBeNull()
  })

  it('storage que lança (modo privado) não quebra nada', () => {
    const quebrado = {
      getItem: () => { throw new Error('bloqueado') },
      setItem: () => { throw new Error('bloqueado') },
      removeItem: () => { throw new Error('bloqueado') },
    }
    expect(() => writePendingCheckout(quebrado, 'k', { order: {}, method: 'pix', savedAt: 0 })).not.toThrow()
    expect(readPendingCheckout(quebrado, 'k')).toBeNull()
  })
})

// ── Transição atômica: webhook × polling ────────────────────────────────────
const approveCoupon = vi.fn()
vi.mock('@/lib/coupons', () => ({ approveCouponRedemption: (...a: any[]) => approveCoupon(...a), releaseCouponRedemption: vi.fn() }))
vi.mock('@/lib/prouni-fies', () => ({ consumeProuniGrant: vi.fn(), releaseProuniGrant: vi.fn() }))
vi.mock('@/lib/analytics', () => ({ recordOrderCheckoutEvent: vi.fn() }))
vi.mock('@/lib/meta-capi', () => ({ sendMetaCapiEvent: vi.fn() }))
vi.mock('@/lib/payments/audit', () => ({ audit: vi.fn() }))

const orderId = new ObjectId()
let statusNoBanco = 'pending'
vi.mock('@/lib/mongodb', () => ({
  getDb: async () => ({
    collection: (name: string) => ({
      findOne: async () => (name === 'payment_orders' ? { _id: orderId, status: statusNoBanco, type: 'donation', amount: 10 } : null),
      // Compare-and-set de verdade: só grava se o status ainda é o lido.
      updateOne: async (filtro: any, u: any) => {
        if (name !== 'payment_orders' || !('status' in filtro)) return { matchedCount: 1 }
        if (filtro.status !== statusNoBanco) return { matchedCount: 0 }
        statusNoBanco = u.$set.status
        return { matchedCount: 1 }
      },
    }),
  }),
}))

describe('aprovação aplicada uma vez só', () => {
  beforeEach(() => {
    statusNoBanco = 'pending'
    approveCoupon.mockReset()
  })

  it('duas leituras de "pending" ao mesmo tempo: só uma dispara os efeitos', async () => {
    const { applyPaymentResult } = await import('@/lib/payments/effects')
    const aprovado = { providerOrderId: '1', status: 'approved', amount: 10, currency: 'BRL', paymentMethod: 'pix' } as any
    const [a, b] = await Promise.all([
      applyPaymentResult(String(orderId), aprovado),
      applyPaymentResult(String(orderId), aprovado),
    ])
    expect([a.applied, b.applied].filter(Boolean)).toHaveLength(1)
    expect(approveCoupon).toHaveBeenCalledTimes(1)
    expect(statusNoBanco).toBe('approved')
    // Quem perdeu a corrida devolve o estado atual — a tela mostra aprovado.
    const perdedor = a.applied ? b : a
    expect(perdedor.order?.status).toBe('approved')
  })
})
