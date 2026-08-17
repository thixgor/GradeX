import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * As provas e os grupos moram em bancos diferentes do mesmo cluster.
 *
 * É a coisa mais fácil de "simplificar" por engano — as duas linhas parecem
 * redundantes —, e o estrago não aparece como erro: a consulta no banco errado
 * volta vazia, e o sintoma chega como "Grupo não encontrado" para um grupo que
 * está bem ali na tela, ou como provas que somem ao apagar o grupo delas.
 *
 * Este teste trava a separação.
 */

const bancosPedidos: string[] = []

vi.mock('@/lib/mongodb', () => {
  const cliente = {
    db: (nome: string) => {
      bancosPedidos.push(nome)
      return { collection: (c: string) => ({ nome: c, banco: nome }) }
    },
  }
  return {
    default: Promise.resolve(cliente),
    getDb: async () => {
      bancosPedidos.push('gradex')
      return { collection: (c: string) => ({ nome: c, banco: 'gradex' }) }
    },
  }
})

import { colecaoDeGrupos, colecaoDeProvas } from '@/lib/provas/colecoes'

describe('colecoes de /provas', () => {
  beforeEach(() => {
    bancosPedidos.length = 0
  })

  it('busca as provas no banco das provas', async () => {
    const c: any = await colecaoDeProvas()
    expect(c.nome).toBe('exams')
    expect(c.banco).toBe('gradex')
  })

  it('busca os grupos no banco dos grupos', async () => {
    const c: any = await colecaoDeGrupos()
    expect(c.nome).toBe('groups')
    expect(c.banco).toBe('DomineAqui')
  })

  it('os dois bancos são mesmo diferentes', async () => {
    const provas: any = await colecaoDeProvas()
    const grupos: any = await colecaoDeGrupos()
    expect(provas.banco).not.toBe(grupos.banco)
  })
})
