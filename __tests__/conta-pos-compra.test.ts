import { describe, expect, it } from 'vitest'
import {
  destinoDasKeys,
  keyAtivavel,
  keysAtivaveisPara,
  segredoConfere,
  validarSenhaNova,
} from '@/lib/conta-pos-compra'
import type { SerialKey } from '@/lib/types'

/**
 * Conta criada depois da compra sem login, já com as keys ativadas.
 *
 * O que estes testes seguram: a conta nova só leva o que ainda está por
 * ativar, e a key restrita ao e-mail da compra nunca entra numa conta de outro
 * e-mail — a mesma regra do botão de /ativar.
 */
function key(over: Partial<SerialKey> = {}): SerialKey {
  return {
    key: 'AAAA-BBBB',
    type: 'plus' as any,
    used: false,
    generatedBy: 'system',
    generatedByName: 'Sistema',
    generatedAt: new Date(),
    status: 'unactivated',
    grant: { productType: 'material', itemType: 'material', itemId: 'm1' },
    productType: 'material',
    buyerEmail: 'ana@exemplo.com',
    ...over,
  }
}

describe('conta pós-compra', () => {
  it('só ativa key com concessão, não usada e não cancelada', () => {
    expect(keyAtivavel(key())).toBe(true)
    expect(keyAtivavel(key({ status: 'activated' }))).toBe(false)
    expect(keyAtivavel(key({ used: true }))).toBe(false)
    expect(keyAtivavel(key({ status: 'cancelled' }))).toBe(false)
    expect(keyAtivavel(key({ grant: undefined }))).toBe(false)
  })

  it('key restrita ao e-mail da compra não vai para outra conta', () => {
    const livre = key({ key: 'LIVRE' })
    const restrita = key({ key: 'RESTRITA', restrictActivationToBuyerEmail: true })
    const outra = keysAtivaveisPara([livre, restrita], 'bia@exemplo.com')
    expect(outra.ativaveis.map((k) => k.key)).toEqual(['LIVRE'])
    expect(outra.restritas.map((k) => k.key)).toEqual(['RESTRITA'])

    const dona = keysAtivaveisPara([livre, restrita], ' ANA@exemplo.com ')
    expect(dona.ativaveis.map((k) => k.key)).toEqual(['LIVRE', 'RESTRITA'])
    expect(dona.restritas).toEqual([])
  })

  it('manda a pessoa para onde o produto aparece', () => {
    expect(destinoDasKeys([key()])).toBe('/materiais?tab=mine')
    expect(destinoDasKeys([key(), key({ productType: 'package', grant: { productType: 'package' } })])).toBe('/materiais?tab=mine')
    expect(destinoDasKeys([key({ productType: 'manual_clinico', grant: { productType: 'manual_clinico' } })])).toBe('/manual-clinico')
    expect(destinoDasKeys([key({ productType: 'plus', grant: { productType: 'plus' } })])).toBe('/dashboard')
  })

  it('confere o segredo sem aceitar vazio nem tamanho diferente', () => {
    expect(segredoConfere('abc', 'abc')).toBe(true)
    expect(segredoConfere('abc', 'abd')).toBe(false)
    expect(segredoConfere('abc', 'abcd')).toBe(false)
    expect(segredoConfere('', '')).toBe(false)
  })

  it('exige senha de 6 a 128 caracteres', () => {
    expect(validarSenhaNova('12345')).not.toBeNull()
    expect(validarSenhaNova('123456')).toBeNull()
    expect(validarSenhaNova('x'.repeat(129))).not.toBeNull()
    expect(validarSenhaNova(undefined)).not.toBeNull()
  })
})
