import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'

/**
 * O que estes testes protegem: o link de "Esqueci minha senha" funcionar
 * quando chega, e a troca de senha fechar a porta para o que valia antes.
 */

const h = vi.hoisted(() => ({
  enviarLink: vi.fn(async (..._args: any[]) => undefined),
  revogar: vi.fn(async (..._args: any[]) => 2),
}))

vi.mock('@/lib/mail', () => ({
  sendPasswordResetEmail: (...args: any[]) => h.enviarLink(...args),
}))

vi.mock('@/lib/sessions', () => ({
  revokeAllUserSessions: (...args: any[]) => h.revogar(...args),
}))

import {
  buscarContaPeloToken,
  buscarContaPorEmail,
  enviarLinkDeRedefinicao,
  gerarSenhaAleatoria,
  gravarNovaSenha,
  hashDoTokenDeRedefinicao,
  INTERVALO_ENTRE_ENVIOS_MS,
  problemaNaSenha,
} from '@/lib/redefinicao-de-senha'

/** Banco de mentira: guarda as escritas e responde às buscas com `achar`. */
function bancoFalso(achar: (filtro: any) => any = () => null) {
  const updates: Array<{ filtro: any; update: any }> = []
  const finds: any[] = []
  const db = {
    collection: () => ({
      findOne: async (filtro: any) => {
        finds.push(filtro)
        return achar(filtro)
      },
      updateOne: async (filtro: any, update: any) => {
        updates.push({ filtro, update })
        return { matchedCount: 1, modifiedCount: 1 }
      },
    }),
  }
  return { db: db as any, updates, finds }
}

const ID = new ObjectId()

beforeEach(() => {
  h.enviarLink.mockReset()
  h.enviarLink.mockResolvedValue(undefined)
  h.revogar.mockClear()
})

describe('gerarSenhaAleatoria', () => {
  it('blocos legíveis, sem caracteres ambíguos e com as três classes', () => {
    const vistas = new Set<string>()
    for (let i = 0; i < 300; i++) {
      const senha = gerarSenhaAleatoria()
      expect(senha).toMatch(/^[a-zA-Z2-9]{4}-[a-zA-Z2-9]{4}-[a-zA-Z2-9]{4}$/)
      expect(senha).not.toMatch(/[01OIlo]/)
      expect(senha).toMatch(/[a-z]/)
      expect(senha).toMatch(/[A-Z]/)
      expect(senha).toMatch(/[2-9]/)
      vistas.add(senha)
    }
    expect(vistas.size).toBe(300)
  })

  it('passa na própria regra de senha', () => {
    expect(problemaNaSenha(gerarSenhaAleatoria())).toBeNull()
    expect(problemaNaSenha('12345')).toMatch(/mínimo/)
    expect(problemaNaSenha('x'.repeat(200))).toMatch(/máximo/)
    expect(problemaNaSenha(undefined)).toMatch(/mínimo/)
  })
})

describe('buscarContaPorEmail', () => {
  it('tenta a busca exata e só então ignora maiúsculas, escapando o e-mail', async () => {
    const { db, finds } = bancoFalso((filtro) => (filtro.email?.$regex ? { _id: ID, email: 'A+B@Gmail.com' } : null))
    const conta = await buscarContaPorEmail(db, '  A+B@gmail.com ')
    expect(conta?._id).toBe(ID)
    expect(finds[0]).toEqual({ email: 'a+b@gmail.com' })
    expect(finds[1]).toEqual({ email: { $regex: '^a\\+b@gmail\\.com$', $options: 'i' } })
  })
})

describe('enviarLinkDeRedefinicao', () => {
  const user = { _id: ID, email: 'ana@example.com', name: 'Ana Souza' }

  it('o pedido novo não invalida os links que ainda estão chegando', async () => {
    const agora = Date.now()
    const antigos = [1, 2, 3].map((i) => ({
      hash: `h${i}`,
      createdAt: new Date(agora - i * 60_000),
      expiresAt: new Date(agora + 30 * 60_000),
    }))
    const vencido = { hash: 'velho', createdAt: new Date(agora - 7_200_000), expiresAt: new Date(agora - 1) }
    const { db, updates } = bancoFalso()

    const r = await enviarLinkDeRedefinicao(db, { ...user, resetPasswordTokens: [vencido, ...antigos] })

    expect(r.status).toBe('enviado')
    const tokens = updates[0].update.$set.resetPasswordTokens
    expect(tokens).toHaveLength(3)
    expect(tokens.map((t: any) => t.hash)).not.toContain('velho')
    // O token que foi no e-mail é o que está gravado (em hash).
    const tokenEnviado = h.enviarLink.mock.calls[0][1]
    expect(tokens[2].hash).toBe(hashDoTokenDeRedefinicao(tokenEnviado))
    expect(h.enviarLink.mock.calls[0][0]).toBe('ana@example.com')
    expect(h.enviarLink.mock.calls[0][2]).toMatchObject({ nome: 'Ana Souza', validadeMin: 60 })
  })

  it('clique duplo: não manda outro e-mail dentro do intervalo mínimo', async () => {
    const { db, updates } = bancoFalso()
    const r = await enviarLinkDeRedefinicao(db, { ...user, resetPasswordRequestedAt: new Date(Date.now() - 5_000) })
    expect(r).toMatchObject({ status: 'aguarde' })
    expect((r as any).segundos).toBeLessThanOrEqual(INTERVALO_ENTRE_ENVIOS_MS / 1000)
    expect(h.enviarLink).not.toHaveBeenCalled()
    expect(updates).toHaveLength(0)
  })

  it('e-mail que não saiu: diz que falhou, tira o link e libera novo pedido', async () => {
    h.enviarLink.mockRejectedValueOnce(new Error('421 busy'))
    const { db, updates } = bancoFalso()

    const r = await enviarLinkDeRedefinicao(db, user)

    expect(r).toEqual({ status: 'falhou', erro: '421 busy' })
    const hashGravado = updates[0].update.$set.resetPasswordTokens.at(-1).hash
    expect(updates[1].update).toEqual({
      $pull: { resetPasswordTokens: { hash: hashGravado } },
      $unset: { resetPasswordRequestedAt: '' },
    })
  })
})

describe('buscarContaPeloToken', () => {
  it('aceita o link novo e o do formato antigo, ambos só se não venceram', async () => {
    const { db, finds } = bancoFalso(() => ({ _id: ID }))
    await buscarContaPeloToken(db, 'abc')
    const hash = hashDoTokenDeRedefinicao('abc')
    const filtro = finds[0]
    expect(filtro.$or[0].resetPasswordTokens.$elemMatch.hash).toBe(hash)
    expect(filtro.$or[0].resetPasswordTokens.$elemMatch.expiresAt.$gt).toBeInstanceOf(Date)
    expect(filtro.$or[1].resetPasswordToken).toBe(hash)
    expect(filtro.$or[1].resetPasswordExpires.$gt).toBeInstanceOf(Date)
  })

  it('token vazio não consulta o banco', async () => {
    const { db, finds } = bancoFalso()
    expect(await buscarContaPeloToken(db, '')).toBeNull()
    expect(finds).toHaveLength(0)
  })
})

describe('gravarNovaSenha', () => {
  it('grava o hash, apaga os links pendentes, confirma o e-mail e derruba os outros aparelhos', async () => {
    const { db, updates } = bancoFalso()

    const r = await gravarNovaSenha(db, String(ID), 'nova-senha-123', {
      por: 'reset',
      confirmarEmail: true,
    })

    const { $set, $unset } = updates[0].update
    expect(await bcrypt.compare('nova-senha-123', $set.password)).toBe(true)
    expect($set).toMatchObject({ passwordChangedBy: 'reset', emailVerified: true })
    expect(Object.keys($unset)).toEqual(
      expect.arrayContaining(['resetPasswordToken', 'resetPasswordExpires', 'resetPasswordTokens', 'resetPasswordRequestedAt', 'verificationToken'])
    )
    expect(h.revogar).toHaveBeenCalledWith(String(ID), { exceptJti: undefined, revokedBy: 'user' })
    expect(r.sessoesEncerradas).toBe(2)
  })

  it('pelo perfil: mantém a sessão de quem trocou e não mexe na confirmação do e-mail', async () => {
    const { db, updates } = bancoFalso()
    await gravarNovaSenha(db, String(ID), 'outra-senha', { por: 'user', manterSessaoJti: 'jti-atual' })
    expect(updates[0].update.$set.emailVerified).toBeUndefined()
    expect(updates[0].update.$unset.verificationToken).toBeUndefined()
    expect(h.revogar).toHaveBeenCalledWith(String(ID), { exceptJti: 'jti-atual', revokedBy: 'user' })
  })
})
