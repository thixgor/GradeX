import { describe, expect, it } from 'vitest'
import {
  escapeRegex,
  prepararTermoDeBusca,
  TAMANHO_MAXIMO_DE_BUSCA,
} from '@/lib/utils/escape-regex'

describe('escapeRegex', () => {
  it('neutraliza o padrão de retrocesso catastrófico', () => {
    const hostil = '(a+)+$'
    const escapado = escapeRegex(hostil)

    // O termo vira texto literal: casa consigo mesmo e com mais nada.
    expect(new RegExp(escapado).test(hostil)).toBe(true)
    expect(new RegExp(escapado).test('aaaaaaaaaaaaaaaaaaaaaaaaX')).toBe(false)
  })

  it('impede que o termo case com tudo', () => {
    expect(new RegExp(escapeRegex('.*')).test('qualquer enunciado')).toBe(false)
  })

  it('preserva o sentido de um termo comum', () => {
    expect(new RegExp(escapeRegex('C++'), 'i').test('curso de C++ aplicado')).toBe(true)
    expect(new RegExp(escapeRegex('insuficiência'), 'i').test('Insuficiência cardíaca')).toBe(true)
  })

  it('escapa cada metacaractere de RegExp', () => {
    for (const caractere of ['.', '*', '+', '?', '^', '$', '{', '}', '(', ')', '|', '[', ']', '\\']) {
      expect(() => new RegExp(escapeRegex(caractere))).not.toThrow()
      expect(new RegExp(escapeRegex(caractere)).test(caractere)).toBe(true)
    }
  })
})

describe('prepararTermoDeBusca', () => {
  it('recusa termo curto demais, que viraria varredura completa', () => {
    expect(prepararTermoDeBusca('a')).toBeNull()
    expect(prepararTermoDeBusca('  ')).toBeNull()
    expect(prepararTermoDeBusca('')).toBeNull()
  })

  it('recusa o que não é texto', () => {
    expect(prepararTermoDeBusca(undefined)).toBeNull()
    expect(prepararTermoDeBusca(null)).toBeNull()
    expect(prepararTermoDeBusca(42)).toBeNull()
    // Um objeto viraria um operador do Mongo se chegasse ao filtro.
    expect(prepararTermoDeBusca({ $ne: null })).toBeNull()
  })

  it('corta o termo no teto de tamanho', () => {
    const gigante = 'a'.repeat(5000)
    const preparado = prepararTermoDeBusca(gigante)
    expect(preparado).not.toBeNull()
    expect(preparado!.length).toBeLessThanOrEqual(TAMANHO_MAXIMO_DE_BUSCA)
  })

  it('devolve o termo já escapado', () => {
    expect(prepararTermoDeBusca('(a+)+$')).toBe('\\(a\\+\\)\\+\\$')
  })
})
