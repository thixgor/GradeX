import { describe, expect, it, vi } from 'vitest'
import type { Db } from 'mongodb'
import {
  filterActiveUserIds,
  presenceWindowMs,
  readOnlineDevices,
  touchPresence,
} from '@/lib/presence/server'
import { PRESENCE_WINDOW_MS } from '@/lib/presence/shared'

const NOW = new Date('2026-06-01T12:00:00.000Z').getTime()

interface FakeSession {
  userId: string
  lastActiveAt: Date
  deviceName?: string
  revokedAt?: Date
}

/**
 * Db de mentira com o mínimo da API que o módulo usa. Guarda o filtro que
 * recebeu para que os testes possam afirmar que a consulta continua limitada
 * à janela — é justamente essa limitação que segura o custo no Atlas.
 */
function fakeDb(sessions: FakeSession[]) {
  const seen: { filter?: any; limit?: number } = {}

  const cursor = {
    sort: () => cursor,
    limit: (value: number) => {
      seen.limit = value
      return cursor
    },
    toArray: async () => {
      const since = seen.filter?.lastActiveAt?.$gte as Date
      return sessions
        .filter((s) => s.lastActiveAt >= since)
        .sort((a, b) => b.lastActiveAt.getTime() - a.lastActiveAt.getTime())
    },
  }

  const db = {
    collection: () => ({
      find: (filter: any) => {
        seen.filter = filter
        return cursor
      },
    }),
  } as unknown as Db

  return { db, seen }
}

function session(overrides: Partial<FakeSession> = {}): FakeSession {
  return {
    userId: 'u1',
    lastActiveAt: new Date(NOW - 30_000),
    deviceName: 'Chrome no Windows',
    ...overrides,
  }
}

describe('readOnlineDevices', () => {
  it('conta pessoas, não aparelhos', async () => {
    const { db } = fakeDb([
      session({ userId: 'u1', deviceName: 'Chrome no Windows' }),
      session({ userId: 'u1', deviceName: 'Safari no iPhone', lastActiveAt: new Date(NOW - 60_000) }),
      session({ userId: 'u2' }),
    ])

    const snapshot = await readOnlineDevices(db, { now: NOW })

    expect(snapshot.userIds.sort()).toEqual(['u1', 'u2'])
    expect(snapshot.devices).toBe(3)
    expect(snapshot.byUser.get('u1')?.devices).toBe(2)
  })

  it('o aparelho mostrado é o do sinal mais recente', async () => {
    const { db } = fakeDb([
      session({ deviceName: 'Safari no iPhone', lastActiveAt: new Date(NOW - 4 * 60_000) }),
      session({ deviceName: 'Chrome no Windows', lastActiveAt: new Date(NOW - 10_000) }),
    ])

    const snapshot = await readOnlineDevices(db, { now: NOW })

    expect(snapshot.byUser.get('u1')?.deviceName).toBe('Chrome no Windows')
    expect(snapshot.byUser.get('u1')?.lastActiveAt).toBe(NOW - 10_000)
  })

  it('sessão derrubada não é presença, mesmo com carimbo fresco', async () => {
    const { db } = fakeDb([
      session({ userId: 'u1', revokedAt: new Date(NOW - 5_000) }),
      session({ userId: 'u2' }),
    ])

    const snapshot = await readOnlineDevices(db, { now: NOW })

    expect(snapshot.userIds).toEqual(['u2'])
    expect(snapshot.devices).toBe(1)
  })

  it('quem parou antes da janela sai da conta', async () => {
    const { db, seen } = fakeDb([
      session({ userId: 'antigo', lastActiveAt: new Date(NOW - PRESENCE_WINDOW_MS - 1_000) }),
      session({ userId: 'agora' }),
    ])

    const snapshot = await readOnlineDevices(db, { now: NOW })

    expect(snapshot.userIds).toEqual(['agora'])
    // A janela vai no filtro, e não num descarte em memória: é isso que
    // impede a leitura de varrer a coleção inteira de sessões.
    expect(seen.filter.lastActiveAt.$gte.getTime()).toBe(NOW - PRESENCE_WINDOW_MS)
    expect(seen.limit).toBeGreaterThan(0)
  })

  it('nenhum sinal na janela devolve vazio sem quebrar', async () => {
    const { db } = fakeDb([])
    const snapshot = await readOnlineDevices(db, { now: NOW })
    expect(snapshot.userIds).toEqual([])
    expect(snapshot.devices).toBe(0)
  })
})

describe('filterActiveUserIds', () => {
  it('não vai ao banco quando não há ninguém online', async () => {
    const find = vi.fn()
    const db = { collection: () => ({ find }) } as unknown as Db

    await expect(filterActiveUserIds(db, [])).resolves.toEqual([])
    expect(find).not.toHaveBeenCalled()
  })

  it('descarta id que não é ObjectId sem consultar', async () => {
    const find = vi.fn()
    const db = { collection: () => ({ find }) } as unknown as Db

    await expect(filterActiveUserIds(db, ['não-é-id'])).resolves.toEqual([])
    expect(find).not.toHaveBeenCalled()
  })
})

describe('touchPresence', () => {
  it('carimba a sessão e ignora repique dentro do minuto', async () => {
    const updateOne = vi.fn().mockResolvedValue({})
    const db = { collection: () => ({ updateOne }) } as unknown as Db
    const jti = `jti-${Math.random()}`

    await expect(touchPresence(db, jti)).resolves.toBe(true)
    // O segundo ping quase colado (duas abas, retry de rede) não vira escrita.
    await expect(touchPresence(db, jti)).resolves.toBe(false)
    expect(updateOne).toHaveBeenCalledTimes(1)

    // Sessão revogada não casa com o filtro: o ping nunca ressuscita quem o
    // admin (ou o limite de aparelhos) derrubou.
    expect(updateOne.mock.calls[0][0]).toEqual({ jti, revokedAt: { $exists: false } })
  })
})

describe('presenceWindowMs', () => {
  it('usa o padrão quando a env não diz nada', () => {
    delete process.env.PRESENCE_WINDOW_MINUTES
    expect(presenceWindowMs()).toBe(PRESENCE_WINDOW_MS)
  })

  it('aceita ajuste por env dentro de limites sãos', () => {
    process.env.PRESENCE_WINDOW_MINUTES = '3'
    expect(presenceWindowMs()).toBe(3 * 60_000)

    process.env.PRESENCE_WINDOW_MINUTES = '0'
    expect(presenceWindowMs()).toBe(PRESENCE_WINDOW_MS)

    process.env.PRESENCE_WINDOW_MINUTES = 'muito'
    expect(presenceWindowMs()).toBe(PRESENCE_WINDOW_MS)

    delete process.env.PRESENCE_WINDOW_MINUTES
  })
})
