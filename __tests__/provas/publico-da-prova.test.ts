import { describe, expect, it } from 'vitest'
import {
  filtroDePublicoParaMongo,
  ramosDePublicoParaMongo,
  normalizarPublico,
  pessoaEstaNoPublico,
  provaERestrita,
  rotuloDoPublico,
} from '@/lib/provas/publico-da-prova'

const restrita = { createdBy: 'admin1', audience: { modo: 'periodos', periodos: [3, 4] } } as any
const aberta = { createdBy: 'admin1' } as any

describe('normalizarPublico', () => {
  it('ausente vale como todos', () => {
    expect(normalizarPublico(undefined)).toEqual({ modo: 'todos', periodos: [] })
  })

  it('descarta períodos fora da faixa e ordena sem repetir', () => {
    expect(normalizarPublico({ modo: 'periodos', periodos: [5, 5, 0, 13, '2'] })).toEqual({
      modo: 'periodos',
      periodos: [2, 5],
    })
  })

  it('"períodos" sem nenhum período cai para todos, em vez de trancar a prova', () => {
    expect(normalizarPublico({ modo: 'periodos', periodos: [] })).toEqual({ modo: 'todos', periodos: [] })
  })
})

describe('pessoaEstaNoPublico', () => {
  it('prova sem restrição é de todos, inclusive de quem não tem período', () => {
    expect(pessoaEstaNoPublico(aberta, { userId: 'u1', periodo: null })).toBe(true)
  })

  it('aluno do período alvo entra', () => {
    expect(pessoaEstaNoPublico(restrita, { userId: 'u1', periodo: 3 })).toBe(true)
  })

  it('aluno de outro período não entra', () => {
    expect(pessoaEstaNoPublico(restrita, { userId: 'u1', periodo: 5 })).toBe(false)
  })

  it('sem período definido não entra em prova restrita', () => {
    expect(pessoaEstaNoPublico(restrita, { userId: 'u1', periodo: null })).toBe(false)
  })

  it('admin e criador sempre entram', () => {
    expect(pessoaEstaNoPublico(restrita, { userId: 'qualquer', isAdmin: true, periodo: null })).toBe(true)
    expect(pessoaEstaNoPublico(restrita, { userId: 'admin1', periodo: null })).toBe(true)
  })

  it('prova pessoal e de treino não têm público a filtrar', () => {
    expect(pessoaEstaNoPublico({ ...restrita, isPracticeExam: true }, { userId: 'u1', periodo: 9 })).toBe(true)
  })

  it('provaERestrita só é verdade com períodos válidos', () => {
    expect(provaERestrita(restrita)).toBe(true)
    expect(provaERestrita({ audience: { modo: 'periodos', periodos: [] } } as any)).toBe(false)
    expect(provaERestrita(aberta)).toBe(false)
  })
})

describe('ramosDePublicoParaMongo', () => {
  it('devolve os ramos achatados, prontos para entrar num $or existente', () => {
    expect(ramosDePublicoParaMongo(3)).toContainEqual({ 'audience.periodos': 3 })
    expect(ramosDePublicoParaMongo(null)).toHaveLength(2)
  })
})

describe('filtroDePublicoParaMongo', () => {
  it('sem período, só as provas sem restrição', () => {
    const filtro = filtroDePublicoParaMongo(null) as any
    expect(filtro.$or).toHaveLength(2)
    expect(filtro.$or).not.toContainEqual({ 'audience.periodos': expect.anything() })
  })

  it('com período, soma as provas daquele período', () => {
    const filtro = filtroDePublicoParaMongo(3) as any
    expect(filtro.$or).toContainEqual({ 'audience.periodos': 3 })
  })
})

describe('rotuloDoPublico', () => {
  it('descreve o alvo em português', () => {
    expect(rotuloDoPublico({ modo: 'todos', periodos: [] })).toBe('Todos os alunos')
    expect(rotuloDoPublico({ modo: 'periodos', periodos: [3] })).toBe('3º período')
    expect(rotuloDoPublico({ modo: 'periodos', periodos: [3, 4] })).toBe('Períodos 3º, 4º')
  })
})
