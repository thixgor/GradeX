import { afterEach, beforeEach, describe, expect, it } from 'vitest'

/**
 * A conexão com o Mongo não pode nascer no import.
 *
 * `next build` carrega os módulos de TODAS as rotas para descobrir quais são
 * dinâmicas. Enquanto `lib/mongodb.ts` conectava no escopo do módulo, esse
 * passo abria conexões de verdade com o Atlas durante o build e derrubava o
 * build inteiro em qualquer ambiente sem `MONGODB_URI` no shell.
 *
 * Este teste é a trava: ele importa o módulo sem a variável no ambiente, que é
 * exatamente a situação do build.
 */
describe('lib/mongodb — conexão preguiçosa', () => {
  const original = process.env.MONGODB_URI

  beforeEach(() => {
    delete process.env.MONGODB_URI
  })

  afterEach(() => {
    if (original === undefined) delete process.env.MONGODB_URI
    else process.env.MONGODB_URI = original
  })

  it('importa sem MONGODB_URI no ambiente', async () => {
    const modulo = await import('@/lib/mongodb')

    expect(typeof modulo.getDb).toBe('function')
    expect(typeof modulo.default.then).toBe('function')
  })

  it('reclama da URI ausente como rejeição, e só quando alguém espera', async () => {
    const { default: clientPromise, getDb } = await import('@/lib/mongodb')

    await expect(getDb()).rejects.toThrow('Please add your Mongo URI')
    // `.then` direto, e não só `await`: o default export é um thenable, e um
    // `then` que lançasse de forma síncrona não se comportaria como promessa.
    await expect(clientPromise).rejects.toThrow('Please add your Mongo URI')
  })
})
