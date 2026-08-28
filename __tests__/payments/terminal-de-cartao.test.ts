import { describe, it, expect } from 'vitest'
import {
  detectBrand,
  brandFromMercadoPagoId,
  formatCardNumber,
  formatExpiry,
  isLuhnValid,
  isExpiryValid,
  splitExpiry,
  validateCard,
  EMPTY_CARD_FIELDS,
  type CardFields,
} from '@/components/payments/card-terminal'

/**
 * O formulário de cartão era uma pilha de inputs crus: número sem agrupamento,
 * mês e ano em campos separados, nenhuma conferência antes do submit. Estes
 * testes cobrem as funções puras que sustentam o terminal novo — se elas
 * escorregarem, o comprador só descobre no "pagamento recusado".
 */

const cartao = (patch: Partial<CardFields>): CardFields => ({ ...EMPTY_CARD_FIELDS, ...patch })

/** Números de teste do Mercado Pago (passam no Luhn, não existem de verdade). */
const VISA = '4111 1111 1111 1111'
const AMEX = '3711 803032 57522'

describe('detectBrand', () => {
  it('reconhece as bandeiras pelo prefixo', () => {
    expect(detectBrand('4111')).toBe('visa')
    expect(detectBrand('5555')).toBe('master')
    expect(detectBrand('2223')).toBe('master')
    expect(detectBrand('3711')).toBe('amex')
    expect(detectBrand('3005')).toBe('diners')
    expect(detectBrand('6062 82')).toBe('hipercard')
    expect(detectBrand('6362 97')).toBe('elo')
  })

  it('não chuta bandeira com o campo vazio', () => {
    expect(detectBrand('')).toBe('unknown')
  })
})

describe('brandFromMercadoPagoId', () => {
  it('traduz os ids do provedor, crédito e débito', () => {
    expect(brandFromMercadoPagoId('visa')).toBe('visa')
    expect(brandFromMercadoPagoId('debvisa')).toBe('visa')
    expect(brandFromMercadoPagoId('master')).toBe('master')
    expect(brandFromMercadoPagoId('debmaster')).toBe('master')
    expect(brandFromMercadoPagoId('maestro')).toBe('master')
    expect(brandFromMercadoPagoId('amex')).toBe('amex')
    expect(brandFromMercadoPagoId('hipercard')).toBe('hipercard')
    expect(brandFromMercadoPagoId(null)).toBe('unknown')
  })
})

describe('formatCardNumber', () => {
  it('agrupa de 4 em 4 no caso geral', () => {
    expect(formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111')
    expect(formatCardNumber('41111111')).toBe('4111 1111')
  })

  it('usa o agrupamento 4-6-5 do Amex', () => {
    expect(formatCardNumber('371180303257522')).toBe('3711 803032 57522')
  })

  it('descarta o que passar do comprimento da bandeira', () => {
    // Amex tem 15 dígitos: o 16º não entra.
    expect(formatCardNumber('3711803032575229').replace(/\D/g, '')).toHaveLength(15)
    expect(formatCardNumber('41111111111111119').replace(/\D/g, '')).toHaveLength(16)
  })

  it('ignora o que não é dígito', () => {
    expect(formatCardNumber('4111-1111 abc 1111.1111')).toBe('4111 1111 1111 1111')
  })
})

describe('formatExpiry', () => {
  it('põe a barra sozinha depois do mês', () => {
    expect(formatExpiry('12')).toBe('12/')
    expect(formatExpiry('1229')).toBe('12/29')
  })

  it('completa o zero de um mês que só pode ser 0x', () => {
    // Digitou "3": só pode ser março, então já vira 03/.
    expect(formatExpiry('3')).toBe('03/')
    expect(formatExpiry('1')).toBe('1')
  })

  it('trava o mês entre 01 e 12', () => {
    expect(formatExpiry('99')).toBe('12/')
    expect(formatExpiry('00')).toBe('01/')
  })

  it('não passa de MM/AA', () => {
    expect(formatExpiry('122934')).toBe('12/29')
  })
})

describe('isLuhnValid', () => {
  it('aceita número válido e recusa dígito trocado', () => {
    expect(isLuhnValid(VISA)).toBe(true)
    expect(isLuhnValid('4111 1111 1111 1112')).toBe(false)
    expect(isLuhnValid(AMEX)).toBe(true)
  })

  it('recusa número curto demais para ser cartão', () => {
    expect(isLuhnValid('4111')).toBe(false)
    expect(isLuhnValid('')).toBe(false)
  })
})

describe('isExpiryValid', () => {
  const agora = new Date()
  const doisDigitos = (n: number) => String(n).padStart(2, '0')

  it('aceita validade futura e recusa vencida', () => {
    const futuro = `${doisDigitos(agora.getMonth() + 1)}${doisDigitos((agora.getFullYear() + 3) % 100)}`
    const passado = `${doisDigitos(agora.getMonth() + 1)}${doisDigitos((agora.getFullYear() - 3) % 100)}`
    expect(isExpiryValid(futuro)).toBe(true)
    expect(isExpiryValid(passado)).toBe(false)
  })

  it('o cartão vale até o ÚLTIMO dia do mês impresso', () => {
    const mesCorrente = `${doisDigitos(agora.getMonth() + 1)}${doisDigitos(agora.getFullYear() % 100)}`
    expect(isExpiryValid(mesCorrente)).toBe(true)
  })

  it('recusa incompleto e mês inexistente', () => {
    expect(isExpiryValid('12')).toBe(false)
    expect(isExpiryValid('1399')).toBe(false)
  })
})

describe('splitExpiry', () => {
  it('devolve o ano com 4 dígitos, como a tokenização espera', () => {
    expect(splitExpiry('12/29')).toEqual({ month: '12', year: '2029' })
    expect(splitExpiry('0830')).toEqual({ month: '08', year: '2030' })
  })
})

describe('validateCard', () => {
  const validade = `12/${String((new Date().getFullYear() + 4) % 100).padStart(2, '0')}`

  it('considera completo o cartão com tudo certo', () => {
    const v = validateCard(cartao({ number: VISA, expiry: validade, cvv: '123', holder: 'MARIA DA SILVA' }))
    expect(v.brand).toBe('visa')
    expect(v.complete).toBe(true)
  })

  it('cobra o CVV de 4 dígitos no Amex', () => {
    const tres = validateCard(cartao({ number: AMEX, expiry: validade, cvv: '123', holder: 'MARIA DA SILVA' }))
    expect(tres.cvvValid).toBe(false)
    const quatro = validateCard(cartao({ number: AMEX, expiry: validade, cvv: '1234', holder: 'MARIA DA SILVA' }))
    expect(quatro.cvvValid).toBe(true)
    expect(quatro.complete).toBe(true)
  })

  it('exige nome com sobrenome — o Mercado Pago recusa o token com um nome só', () => {
    const v = validateCard(cartao({ number: VISA, expiry: validade, cvv: '123', holder: 'MARIA' }))
    expect(v.holderValid).toBe(false)
    expect(v.complete).toBe(false)
  })

  it('usa a bandeira confirmada pelo provedor quando ela existe', () => {
    // 15 dígitos só fecham como Amex; com a heurística local de 16 o mesmo
    // número apareceria como incompleto.
    const v = validateCard(cartao({ number: AMEX, expiry: validade, cvv: '1234', holder: 'MARIA DA SILVA' }), 'amex')
    expect(v.numberValid).toBe(true)
  })

  it('cartão em branco não é completo', () => {
    expect(validateCard(EMPTY_CARD_FIELDS).complete).toBe(false)
  })
})
