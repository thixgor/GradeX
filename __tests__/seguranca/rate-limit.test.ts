import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * O limitador é uma única `findOneAndUpdate` com pipeline: ele precisa contar
 * certo e, sobretudo, nunca deixar de contar por causa de concorrência. O que
 * estes testes travam é o CONTRATO com o Mongo — que a chamada é atômica, que
 * não há varredura por requisição, e que uma falha de banco não derruba a rota.
 */

const findOneAndUpdate = vi.fn()
const createIndex = vi.fn().mockResolvedValue(undefined)
const deleteMany = vi.fn()
const findOne = vi.fn()

vi.mock('@/lib/mongodb', () => ({
  getDb: async () => ({
    collection: () => ({ findOneAndUpdate, createIndex, deleteMany, findOne }),
  }),
}))

const { checkRateLimit } = await import('@/lib/rate-limit')

beforeEach(() => {
  findOneAndUpdate.mockReset()
  deleteMany.mockReset()
  findOne.mockReset()
})

describe('checkRateLimit', () => {
  it('libera enquanto a contagem cabe no limite', async () => {
    findOneAndUpdate.mockResolvedValue({ count: 3, resetAt: new Date(Date.now() + 60_000) })

    const r = await checkRateLimit('ip:1.2.3.4', 'login', 5, 60_000)

    expect(r.success).toBe(true)
    expect(r.remaining).toBe(2)
  })

  it('permite exatamente `limit` requisições e barra a seguinte', async () => {
    findOneAndUpdate.mockResolvedValue({ count: 5, resetAt: new Date(Date.now() + 60_000) })
    expect((await checkRateLimit('ip:1.2.3.4', 'login', 5, 60_000)).success).toBe(true)

    findOneAndUpdate.mockResolvedValue({ count: 6, resetAt: new Date(Date.now() + 60_000) })
    const barrada = await checkRateLimit('ip:1.2.3.4', 'login', 5, 60_000)
    expect(barrada.success).toBe(false)
    expect(barrada.remaining).toBe(0)
  })

  it('conta e decide numa única ida ao banco — sem janela entre ler e escrever', async () => {
    findOneAndUpdate.mockResolvedValue({ count: 1, resetAt: new Date(Date.now() + 60_000) })

    await checkRateLimit('ip:1.2.3.4', 'login', 5, 60_000)

    expect(findOneAndUpdate).toHaveBeenCalledTimes(1)
    // A versão antiga lia com findOne e só depois incrementava: entre as duas
    // chamadas cabiam quantas requisições concorrentes o atacante quisesse.
    expect(findOne).not.toHaveBeenCalled()
  })

  it('não varre a coleção a cada requisição', async () => {
    findOneAndUpdate.mockResolvedValue({ count: 1, resetAt: new Date(Date.now() + 60_000) })

    await checkRateLimit('ip:1.2.3.4', 'login', 5, 60_000)

    // O `deleteMany` por chamada fazia o custo de defender o endpoint crescer
    // junto com o ataque. Agora quem recolhe é o índice TTL.
    expect(deleteMany).not.toHaveBeenCalled()
  })

  it('faz upsert atômico com o pipeline de atualização', async () => {
    findOneAndUpdate.mockResolvedValue({ count: 1, resetAt: new Date(Date.now() + 60_000) })

    await checkRateLimit('ip:1.2.3.4', 'login', 5, 60_000)

    const [filtro, pipeline, opcoes] = findOneAndUpdate.mock.calls[0]
    expect(filtro).toEqual({ ip: 'ip:1.2.3.4', endpoint: 'login' })
    expect(Array.isArray(pipeline)).toBe(true)
    expect(opcoes).toMatchObject({ upsert: true, returnDocument: 'after' })
  })

  it('falha aberta quando o banco está indisponível', async () => {
    findOneAndUpdate.mockRejectedValue(new Error('sem conexão com o Atlas'))

    const r = await checkRateLimit('ip:1.2.3.4', 'login', 5, 60_000)

    // Derrubar a rota por intermitência do banco transformaria uma oscilação
    // do Atlas numa queda do site.
    expect(r.success).toBe(true)
  })
})
