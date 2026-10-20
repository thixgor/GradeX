import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * A cota da instância (ver `lib/rate-limit.ts`): o banco só é consultado depois
 * de um quarto do teto, e a primeira ida leva junto o que já foi contado.
 */

const contagemNoBanco = new Map<string, number>()
let escritas = 0

vi.mock('@/lib/mongodb', () => ({
  getDb: async () => ({
    collection: () => ({
      createIndex: async () => 'ok',
      findOneAndUpdate: async (filtro: { ip: string; endpoint: string }, pipeline: any[]) => {
        escritas += 1
        // O incremento é o segundo termo do `$add` da janela viva.
        const incremento = pipeline[0].$set.count.$cond[1].$add[1]
        const chave = `${filtro.endpoint}|${filtro.ip}`
        const novo = (contagemNoBanco.get(chave) || 0) + incremento
        contagemNoBanco.set(chave, novo)
        return { count: novo, resetAt: new Date(Date.now() + 60_000) }
      },
    }),
  }),
}))

const { checkRateLimit, cotaLocal, _zerarContagensLocais } = await import('@/lib/rate-limit')

beforeEach(() => {
  contagemNoBanco.clear()
  escritas = 0
  _zerarContagensLocais()
})

describe('cota local do rate limit', () => {
  it('uso normal de um teto de leitura não escreve no banco', async () => {
    // 100/min: bootstrap, notificações. Um aluno faz poucas por minuto.
    for (let i = 0; i < 25; i++) expect((await checkRateLimit('aluno', 'bootstrap', 100, 60_000)).success).toBe(true)
    expect(escritas).toBe(0)
  })

  it('passou da cota local: o banco recebe o que já foi contado, e o teto vale exato', async () => {
    const resultados = []
    for (let i = 0; i < 101; i++) resultados.push((await checkRateLimit('robo', 'bootstrap', 100, 60_000)).success)
    expect(resultados.slice(0, 100).every(Boolean)).toBe(true)
    expect(resultados[100]).toBe(false)
    expect(contagemNoBanco.get('bootstrap|robo')).toBe(101)
    // 25 de graça; da 26ª em diante, uma escrita por chamada.
    expect(escritas).toBe(76)
  })

  it('teto pequeno (força bruta) continua indo ao banco em toda chamada', async () => {
    expect(cotaLocal(5, 15 * 60_000)).toBe(0)
    for (let i = 0; i < 5; i++) await checkRateLimit('1.2.3.4', 'login', 5, 15 * 60_000)
    expect(escritas).toBe(5)
    expect((await checkRateLimit('1.2.3.4', 'login', 5, 15 * 60_000)).success).toBe(false)
  })

  it('janela longa continua indo ao banco em toda chamada', async () => {
    expect(cotaLocal(20, 24 * 3_600_000)).toBe(0)
    await checkRateLimit('u1', 'respostas', 20, 24 * 3_600_000)
    expect(escritas).toBe(1)
  })

  it('chaves e endpoints diferentes não dividem a cota', async () => {
    for (let i = 0; i < 25; i++) await checkRateLimit('a', 'status', 100, 60_000)
    for (let i = 0; i < 25; i++) await checkRateLimit('b', 'status', 100, 60_000)
    for (let i = 0; i < 25; i++) await checkRateLimit('a', 'outro', 100, 60_000)
    expect(escritas).toBe(0)
  })
})
