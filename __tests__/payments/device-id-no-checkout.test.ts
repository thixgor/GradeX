import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { deviceIdSchema } from '@/lib/payments/device-id'
import { invalidFieldsFrom } from '@/lib/payments/invalid-fields'

/**
 * "Dados inválidos" com qualquer cartão: o device ID do antifraude passou do
 * limite do schema e o pagamento nem chegava ao Mercado Pago.
 */
describe('deviceIdSchema', () => {
  const Schema = z.object({ cardToken: z.string(), deviceId: deviceIdSchema })

  it('aceita o device ID normal', () => {
    const r = Schema.safeParse({ cardToken: 't', deviceId: 'armor.abc123' })
    expect(r.success && r.data.deviceId).toBe('armor.abc123')
  })

  it('device ID longo (acima dos 200 de antes) não derruba o pagamento', () => {
    const longo = 'armor.' + 'a'.repeat(400)
    const r = Schema.safeParse({ cardToken: 't', deviceId: longo })
    expect(r.success).toBe(true)
    expect(r.success && r.data.deviceId).toBe(longo)
  })

  it('valor absurdo é descartado, e o pagamento segue sem device ID', () => {
    expect(Schema.safeParse({ cardToken: 't', deviceId: 'x'.repeat(5000) })).toEqual({
      success: true,
      data: { cardToken: 't', deviceId: undefined },
    })
    expect(Schema.safeParse({ cardToken: 't', deviceId: 123 }).success).toBe(true)
  })

  it('ausente continua opcional', () => {
    expect(Schema.safeParse({ cardToken: 't' }).success).toBe(true)
  })
})

describe('invalidFieldsFrom', () => {
  const Schema = z.object({ a: z.string(), b: z.number(), c: z.string().optional() })
  const erro = Schema.safeParse({ a: 1, b: 'x' })
  if (erro.success) throw new Error('esperava falha')

  it('lê o format() do zod', () => {
    expect(invalidFieldsFrom(erro.error.format()).sort()).toEqual(['a', 'b'])
  })

  it('lê o flatten() do zod', () => {
    expect(invalidFieldsFrom(erro.error.flatten()).sort()).toEqual(['a', 'b'])
  })

  it('sem details, nada', () => {
    expect(invalidFieldsFrom(undefined)).toEqual([])
    expect(invalidFieldsFrom('x')).toEqual([])
  })
})
