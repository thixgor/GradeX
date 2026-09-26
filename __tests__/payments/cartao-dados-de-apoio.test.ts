import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  cardholderDocumentSchema,
  deviceIdSchema,
  issuerIdSchema,
  payerIdentificationNumber,
} from '@/lib/payments/card-payload'
import { invalidFieldsFrom } from '@/lib/payments/invalid-fields'
import { cardTokenError, describeCardTokenError } from '@/lib/payments/card-token-errors'

/**
 * "Dados inválidos" com qualquer cartão: campos de apoio do pagamento (device
 * ID do antifraude, emissor) derrubavam a requisição inteira no nosso servidor,
 * antes de chegar ao Mercado Pago.
 */
const Schema = z.object({
  cardToken: z.string(),
  deviceId: deviceIdSchema,
  issuer: issuerIdSchema,
  cardholderDocumentNumber: cardholderDocumentSchema,
})

describe('deviceIdSchema', () => {
  it('aceita o device ID normal', () => {
    const r = Schema.safeParse({ cardToken: 't', deviceId: 'armor.abc123' })
    expect(r.success && r.data.deviceId).toBe('armor.abc123')
  })

  it('device ID longo (acima dos 200 de antes) passa inteiro', () => {
    const longo = 'armor.' + 'a1b2c3d4'.repeat(40) + '.' + 'f'.repeat(32)
    expect(longo.length).toBeGreaterThan(200)
    const r = Schema.safeParse({ cardToken: 't', deviceId: longo })
    expect(r.success && r.data.deviceId).toBe(longo)
  })

  it('valor absurdo ou de tipo errado é descartado e o pagamento segue', () => {
    for (const deviceId of ['x'.repeat(5000), 123, null, { a: 1 }, 'armor.abc\r\nX-Evil: 1', 'armor abc', '']) {
      const r = Schema.safeParse({ cardToken: 't', deviceId })
      expect(r.success).toBe(true)
      expect(r.success && r.data.deviceId).toBeUndefined()
    }
  })

  it('ausente continua opcional', () => {
    expect(Schema.safeParse({ cardToken: 't' }).success).toBe(true)
  })
})

describe('issuerIdSchema', () => {
  it('aceita string ou número e normaliza para string', () => {
    expect(Schema.parse({ cardToken: 't', issuer: '24' }).issuer).toBe('24')
    expect(Schema.parse({ cardToken: 't', issuer: 24 }).issuer).toBe('24')
  })
  it('lixo é descartado sem derrubar a requisição', () => {
    expect(Schema.parse({ cardToken: 't', issuer: 'abc' }).issuer).toBeUndefined()
    expect(Schema.parse({ cardToken: 't', issuer: null }).issuer).toBeUndefined()
  })
})

describe('cardholderDocumentSchema + payerIdentificationNumber', () => {
  it('CPF do titular válido é aceito (com ou sem máscara)', () => {
    expect(Schema.parse({ cardToken: 't', cardholderDocumentNumber: '052.329.397-69' }).cardholderDocumentNumber).toBe('05232939769')
  })
  it('CPF do titular inválido é descartado', () => {
    expect(Schema.parse({ cardToken: 't', cardholderDocumentNumber: '111.111.111-11' }).cardholderDocumentNumber).toBeUndefined()
  })
  it('cartão de terceiro: payer.identification vai com o CPF do titular (o mesmo da tokenização)', () => {
    expect(
      payerIdentificationNumber({ hasCardToken: true, buyerDocumentNumber: '05232939769', cardholderDocumentNumber: '52998224725' })
    ).toBe('52998224725')
  })
  it('cartão próprio: vai o CPF do comprador', () => {
    expect(payerIdentificationNumber({ hasCardToken: true, buyerDocumentNumber: '052.329.397-69' })).toBe('05232939769')
  })
  it('Pix/boleto ignoram o titular', () => {
    expect(
      payerIdentificationNumber({ hasCardToken: false, buyerDocumentNumber: '05232939769', cardholderDocumentNumber: '52998224725' })
    ).toBe('05232939769')
  })
})

describe('invalidFieldsFrom', () => {
  const S = z.object({ a: z.string(), b: z.number(), c: z.string().optional() })
  const erro = S.safeParse({ a: 1, b: 'x' })
  if (erro.success) throw new Error('esperava falha')

  it('lê o format() e o flatten() do zod', () => {
    expect(invalidFieldsFrom(erro.error.format()).sort()).toEqual(['a', 'b'])
    expect(invalidFieldsFrom(erro.error.flatten()).sort()).toEqual(['a', 'b'])
  })
  it('sem details, nada', () => {
    expect(invalidFieldsFrom(undefined)).toEqual([])
    expect(invalidFieldsFrom('x')).toEqual([])
  })
})

describe('erros da tokenização do cartão', () => {
  it('lista de causas do mercadopago.js vira mensagem em português', () => {
    expect(describeCardTokenError([{ code: 'E301', message: 'invalid card number' }])).toMatch(/número do cartão/)
    expect(describeCardTokenError([{ code: '324', message: 'identificationNumber invalid' }])).toMatch(/CPF/)
    expect(describeCardTokenError({ cause: [{ code: '326' }] })).toMatch(/validade/)
    expect(describeCardTokenError([{ code: 'E302' }])).toMatch(/CVV/)
    expect(describeCardTokenError([{ code: '316' }])).toMatch(/nome do titular/)
  })
  it('reconhece pelo texto quando o código é desconhecido', () => {
    expect(describeCardTokenError([{ code: 'X', message: 'parameter securityCode can not be null' }])).toMatch(/CVV/)
  })
  it('nunca devolve Error sem mensagem (antes: "Erro ao processar")', () => {
    expect(cardTokenError([{ code: '???' }]).message).toMatch(/dados do cartão/)
    expect(cardTokenError(undefined).message).toMatch(/dados do cartão/)
    expect(cardTokenError(new Error('boom')).message).toBe('boom')
  })
})
