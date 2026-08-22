import { describe, expect, it } from 'vitest'

import {
  assertProuniRequestAllowed,
  isProuniGrantUsable,
  PROUNI_MAX_PENDING_PER_USER,
  PROUNI_REJECTED_COOLDOWN_HOURS,
  type ProuniRequest,
} from '@/lib/prouni-fies'

/**
 * O que estes testes protegem: a fila de análise.
 *
 * Toda solicitação vira trabalho humano. Sem estas travas, uma pessoa ansiosa
 * (reenviando o mesmo pedido) e uma mal-intencionada (abrindo dezenas) fazem o
 * mesmo estrago: a fila cresce até a análise parar de acontecer, e quem
 * realmente precisa do desconto fica sem resposta.
 */

const USER = 'user-1'
const ITEM = { itemType: 'material' as const, itemId: 'mat-1' }

/** Mongo de mentira: responde o que cada teste precisa, sem banco. */
function fakeDb(opts: {
  existente?: Partial<ProuniRequest> | null
  ultimaRecusa?: Partial<ProuniRequest> | null
  pendentes?: number
  ultimas24h?: number
}) {
  return {
    collection() {
      return {
        async findOne(filtro: any, options?: any) {
          if (options?.sort) return opts.ultimaRecusa || null
          if (filtro?.status?.$in) return opts.existente || null
          return null
        },
        async countDocuments(filtro: any) {
          if (filtro.status === 'pending') return opts.pendentes ?? 0
          return opts.ultimas24h ?? 0
        },
      }
    },
  } as any
}

describe('assertProuniRequestAllowed', () => {
  it('deixa passar quem nunca pediu nada', async () => {
    await expect(
      assertProuniRequestAllowed(fakeDb({}), { userId: USER, ...ITEM })
    ).resolves.toBeUndefined()
  })

  it('barra segunda solicitação para o mesmo item ainda em análise', async () => {
    await expect(
      assertProuniRequestAllowed(fakeDb({ existente: { status: 'pending' } }), { userId: USER, ...ITEM })
    ).rejects.toThrow(/já tem uma solicitação em análise/i)
  })

  it('barra quem já tem benefício aprovado e disponível no item', async () => {
    const aprovada: any = {
      status: 'approved',
      grant: { usage: 'available', discountValue: 30, discountType: 'percentage' },
    }
    await expect(
      assertProuniRequestAllowed(fakeDb({ existente: aprovada }), { userId: USER, ...ITEM })
    ).rejects.toThrow(/já foi aprovado/i)
  })

  it('libera novo pedido quando a concessão anterior já foi usada', async () => {
    const usada: any = {
      status: 'approved',
      grant: { usage: 'used', discountValue: 30, discountType: 'percentage' },
    }
    await expect(
      assertProuniRequestAllowed(fakeDb({ existente: usada }), { userId: USER, ...ITEM })
    ).resolves.toBeUndefined()
  })

  it('segura reenvio logo após uma recusa no mesmo item', async () => {
    const agora = new Date()
    const recusada: any = { status: 'rejected', reviewedAt: new Date(agora.getTime() - 3_600_000) }
    await expect(
      assertProuniRequestAllowed(fakeDb({ ultimaRecusa: recusada }), { userId: USER, ...ITEM, now: agora })
    ).rejects.toThrow(/recusada/i)
  })

  it('libera o reenvio depois da espera', async () => {
    const agora = new Date()
    const recusada: any = {
      status: 'rejected',
      reviewedAt: new Date(agora.getTime() - (PROUNI_REJECTED_COOLDOWN_HOURS + 1) * 3_600_000),
    }
    await expect(
      assertProuniRequestAllowed(fakeDb({ ultimaRecusa: recusada }), { userId: USER, ...ITEM, now: agora })
    ).resolves.toBeUndefined()
  })

  it('barra quem acumulou solicitações abertas demais', async () => {
    await expect(
      assertProuniRequestAllowed(fakeDb({ pendentes: PROUNI_MAX_PENDING_PER_USER }), { userId: USER, ...ITEM })
    ).rejects.toThrow(/em análise/i)
  })

  it('barra quem estourou o limite diário', async () => {
    await expect(
      assertProuniRequestAllowed(fakeDb({ ultimas24h: 99 }), { userId: USER, ...ITEM })
    ).rejects.toThrow(/Limite diário/i)
  })
})

describe('isProuniGrantUsable', () => {
  const base: any = {
    status: 'approved',
    grant: { usage: 'available', discountType: 'percentage', discountValue: 40 },
  }

  it('aceita concessão aprovada e disponível', () => {
    expect(isProuniGrantUsable(base)).toBe(true)
  })

  it('recusa concessão já usada', () => {
    expect(isProuniGrantUsable({ ...base, grant: { ...base.grant, usage: 'used' } })).toBe(false)
  })

  it('recusa concessão vencida', () => {
    const vencida = {
      ...base,
      grant: { ...base.grant, expiresAt: new Date(Date.now() - 86_400_000) },
    }
    expect(isProuniGrantUsable(vencida as any)).toBe(false)
  })

  it('recusa solicitação que não foi aprovada', () => {
    expect(isProuniGrantUsable({ ...base, status: 'pending' })).toBe(false)
  })

  it('recusa concessão sem valor', () => {
    expect(isProuniGrantUsable({ ...base, grant: { ...base.grant, discountValue: 0 } })).toBe(false)
  })
})
