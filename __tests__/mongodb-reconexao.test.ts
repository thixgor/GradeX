import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `lib/mongodb.ts`: uma conexão que falhou não fica guardada. Antes, a primeira
 * falha (ReplicaSetNoPrimary, TLS) valia para toda requisição da instância.
 */

const estado = vi.hoisted(() => ({ falhasRestantes: 0, conexoes: 0, fechados: 0, opcoes: null as any }))

vi.mock('mongodb', () => ({
  MongoClient: class {
    constructor(_uri: string, opcoes: unknown) {
      estado.opcoes = opcoes
    }
    async connect() {
      estado.conexoes += 1
      if (estado.falhasRestantes > 0) {
        estado.falhasRestantes -= 1
        throw new Error('ReplicaSetNoPrimary')
      }
      return this
    }
    db(nome: string) {
      return { nome }
    }
    async close() {
      estado.fechados += 1
    }
  },
}))

beforeEach(() => {
  vi.resetModules()
  estado.falhasRestantes = 0
  estado.conexoes = 0
  estado.fechados = 0
})

describe('conexão com o Mongo', () => {
  it('a instância fria que pega a troca de primário na carga ainda atende a primeira requisição', async () => {
    estado.falhasRestantes = 1
    const { getDb } = await import('@/lib/mongodb')
    // A tentativa da carga do módulo falhou e foi esquecida; esta conecta de novo.
    await expect(getDb()).resolves.toEqual({ nome: 'gradex' })
    expect(estado.conexoes).toBe(2)
    // A tentativa que falhou é fechada.
    expect(estado.fechados).toBe(1)
  })

  it('falhas seguidas: cada chamada tenta de novo, até conectar', async () => {
    estado.falhasRestantes = 2
    const { getDb } = await import('@/lib/mongodb')
    await expect(getDb()).rejects.toThrow('ReplicaSetNoPrimary')
    await expect(getDb()).resolves.toEqual({ nome: 'gradex' })
    expect(estado.conexoes).toBe(3)
  })

  it('conectado, reaproveita a mesma conexão', async () => {
    const { getDb } = await import('@/lib/mongodb')
    await getDb()
    await getDb()
    await getDb()
    expect(estado.conexoes).toBe(1)
  })

  it('o export antigo (`await clientPromise`) também tenta de novo', async () => {
    estado.falhasRestantes = 2
    const { default: clientPromise } = await import('@/lib/mongodb')
    await expect(clientPromise).rejects.toThrow('ReplicaSetNoPrimary')
    const cliente: any = await clientPromise
    expect(cliente.db('gradex')).toEqual({ nome: 'gradex' })
  })

  it('espera a troca de primário do Atlas (~12 s) antes de desistir', async () => {
    await import('@/lib/mongodb')
    expect(estado.opcoes.serverSelectionTimeoutMS).toBeGreaterThanOrEqual(12_000)
  })
})
