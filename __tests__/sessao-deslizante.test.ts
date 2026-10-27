import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ObjectId } from 'mongodb'
import { decodeJwt } from 'jose'

/**
 * "A única coisa que não gostei da plataforma foi que tem que entrar na
 * plataforma toda vez."
 *
 * O token valia 7 dias contados do LOGIN e nunca era renovado: quem usava a
 * plataforma todo dia era deslogado toda semana. Agora a sessão é deslizante —
 * 30 dias desde o último uso, renovada quando o token passa de um dia.
 */

const cookiesGravados: Array<{ nome: string; valor: string; opcoes: any }> = []
let tokenNoNavegador = ''
let podeGravarCookie = true

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (nome: string) => (nome === 'auth-token' && tokenNoNavegador ? { value: tokenNoNavegador } : undefined),
    set: (nome: string, valor: string, opcoes: any) => {
      if (!podeGravarCookie) throw new Error('Cookies can only be modified in a Server Action or Route Handler')
      cookiesGravados.push({ nome, valor, opcoes })
    },
    delete: vi.fn(),
  }),
}))

const userId = new ObjectId()
let usuario: any = { _id: userId, role: 'user', emailVerified: true }
vi.mock('@/lib/mongodb', () => ({
  getDb: async () => ({ collection: () => ({ findOne: async () => usuario }) }),
}))
vi.mock('@/lib/sessions', () => ({ carimbarSessaoAtiva: async () => 'active' }))
vi.mock('@/lib/presence/caminho', () => ({ currentPagePath: async () => '/dashboard' }))

const DIA = 24 * 60 * 60_000

beforeEach(() => {
  vi.resetModules()
  cookiesGravados.length = 0
  podeGravarCookie = true
  usuario = { _id: userId, role: 'user', emailVerified: true }
})

afterEach(() => {
  vi.useRealTimers()
})

async function loginEm(data: Date, extra: Record<string, unknown> = {}) {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(data)
  const { createToken } = await import('@/lib/auth')
  tokenNoNavegador = await createToken({
    userId: String(userId),
    email: 'aluna@example.com',
    name: 'Aluna',
    role: 'user',
    emailVerified: true,
    jti: 'sessao-do-celular',
    ...extra,
  })
}

describe('sessão deslizante', () => {
  it('o login dura 30 dias, não 7', async () => {
    await loginEm(new Date('2026-10-01T12:00:00Z'))
    const { exp, iat } = decodeJwt(tokenNoNavegador)
    expect((exp! - iat!) / 86_400).toBe(30)
  })

  it('quem volta depois de um dia ganha o prazo renovado, com a MESMA sessão de aparelho', async () => {
    await loginEm(new Date('2026-10-01T12:00:00Z'))
    vi.setSystemTime(new Date('2026-10-06T12:00:00Z'))
    const { getSession } = await import('@/lib/auth')

    const sessao = await getSession()

    expect(sessao?.userId).toBe(String(userId))
    expect(cookiesGravados).toHaveLength(1)
    const novo = decodeJwt(cookiesGravados[0].valor)
    expect(novo.jti).toBe('sessao-do-celular')
    expect(new Date(novo.exp! * 1000).toISOString()).toBe('2026-11-05T12:00:00.000Z')
    expect(cookiesGravados[0].opcoes).toMatchObject({ httpOnly: true, maxAge: 30 * 86_400, path: '/' })
  })

  it('usando todo dia, a pessoa nunca é deslogada (era deslogada no 8º dia)', async () => {
    await loginEm(new Date('2026-10-01T12:00:00Z'))
    for (let dia = 1; dia <= 40; dia++) {
      vi.setSystemTime(new Date(new Date('2026-10-01T12:00:00Z').getTime() + dia * DIA + 60_000))
      vi.resetModules()
      const { getSession } = await import('@/lib/auth')
      expect(await getSession(), `dia ${dia}`).not.toBeNull()
      if (cookiesGravados.length > 0) tokenNoNavegador = cookiesGravados[cookiesGravados.length - 1].valor
    }
  })

  it('token com menos de um dia não é regravado a cada requisição', async () => {
    await loginEm(new Date('2026-10-01T12:00:00Z'))
    vi.setSystemTime(new Date('2026-10-01T18:00:00Z'))
    const { getSession } = await import('@/lib/auth')

    await getSession()

    expect(cookiesGravados).toHaveLength(0)
  })

  it('admin rebaixado perde o cargo na hora — a renovação não eterniza o cargo antigo', async () => {
    await loginEm(new Date('2026-10-01T12:00:00Z'), { role: 'admin' })
    vi.setSystemTime(new Date('2026-10-01T13:00:00Z'))
    usuario = { ...usuario, role: 'user' }
    const { getSession } = await import('@/lib/auth')

    const sessao = await getSession()

    expect(sessao?.role).toBe('user')
    expect(decodeJwt(cookiesGravados[0].valor).role).toBe('user')
  })

  it('onde não dá para gravar cookie (Server Component), a sessão segue valendo', async () => {
    await loginEm(new Date('2026-10-01T12:00:00Z'))
    vi.setSystemTime(new Date('2026-10-05T12:00:00Z'))
    podeGravarCookie = false
    const { getSession } = await import('@/lib/auth')

    expect(await getSession()).not.toBeNull()
  })

  it('passados 30 dias sem uso, pede login de novo', async () => {
    await loginEm(new Date('2026-10-01T12:00:00Z'))
    vi.setSystemTime(new Date('2026-11-01T12:00:01Z'))
    const { getSession } = await import('@/lib/auth')

    expect(await getSession()).toBeNull()
  })
})
