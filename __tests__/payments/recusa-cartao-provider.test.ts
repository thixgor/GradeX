import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * O provider anexa ao resultado (e ao erro) o que a chamada levava, para o log
 * de recusas — sem mudar o que vai ao Mercado Pago e sem vazar nada sensível.
 */
const create = vi.fn()
let origemDoToken: 'env' | 'marketplace' = 'env'
let split = { enabled: false, partnerPercent: 0 }
let ambiente: 'production' | 'sandbox' = 'production'

vi.mock('@/lib/payments/mercado-pago/client', () => ({
  getMpPaymentWithToken: () => ({ create: (...a: any[]) => create(...a) }),
  getMpPreApprovalWithToken: () => ({}),
}))
vi.mock('@/lib/payments/mercado-pago/marketplace-store', () => ({
  getEffectiveMpAuth: async () => ({ accessToken: 'APP_USR-segredo-do-token', source: origemDoToken }),
}))
vi.mock('@/lib/payments/config', () => ({
  getPaymentConfig: () => ({ mp: { env: ambiente, notificationUrl: 'https://x/webhook', split } }),
}))

import { MercadoPagoProvider } from '@/lib/payments/mercado-pago/provider'
import { MercadoPagoPaymentError } from '@/lib/payments/mercado-pago/errors'

const base = {
  externalReference: 'ord1',
  amount: 297.5,
  currency: 'BRL' as const,
  description: 'Combo ME 1',
  payerEmail: 'maria@exemplo.com',
  payerName: 'Maria da Silva',
  idempotencyKey: 'idem-ord1',
  paymentMethodId: 'master',
  cardToken: 'TOKEN-SECRETO-DO-CARTAO',
  installments: 3,
  issuer: '24',
  deviceId: 'armor.' + 'x'.repeat(80),
  payerDocumentType: 'CPF' as const,
  payerDocumentNumber: '05232939769',
}

beforeEach(() => {
  create.mockReset()
  create.mockResolvedValue({ id: 1, status: 'rejected', status_detail: 'cc_rejected_other_reason', payment_type_id: 'credit_card', transaction_amount: 297.5 })
  origemDoToken = 'env'
  split = { enabled: false, partnerPercent: 0 }
  ambiente = 'production'
})

describe('MercadoPagoProvider.createPayment — requisicao para o log de recusas', () => {
  it('cartão: o resultado traz o que enviamos, sem token, CPF, e-mail ou chave', async () => {
    const r = await new MercadoPagoProvider().createPayment(base)
    expect(r.requisicao).toMatchObject({
      paymentMethodId: 'master',
      parcelas: 3,
      valorEnviado: 297.5,
      emissorEnviado: '24',
      deviceIdPresente: true,
      deviceIdTamanho: 86,
      titularDiferenteDoComprador: false,
      documentoTipo: 'CPF',
      splitAtivo: false,
      tokenDoMarketplace: false,
      ambiente: 'producao',
      timeoutMs: 8000,
      idempotencyKey: 'idem-ord1',
      referencia: 'ord1',
    })
    const guardado = JSON.stringify(r.requisicao)
    for (const segredo of ['TOKEN-SECRETO-DO-CARTAO', '05232939769', 'maria@exemplo.com', 'APP_USR-segredo-do-token', 'armor.xxxx']) {
      expect(guardado).not.toContain(segredo)
    }
  })

  it('o corpo enviado ao Mercado Pago NÃO mudou (nada de campo novo)', async () => {
    await new MercadoPagoProvider().createPayment(base)
    const { body } = create.mock.calls[0][0]
    expect(Object.keys(body).sort()).toEqual(
      ['additional_info', 'capture', 'description', 'external_reference', 'installments', 'issuer_id', 'metadata', 'notification_url', 'payer', 'payment_method_id', 'token', 'transaction_amount'].sort()
    )
    expect(JSON.stringify(body)).not.toContain('requisicao')
  })

  it('sem device ID, cartão de terceiro, marketplace com split e sandbox são registrados', async () => {
    origemDoToken = 'marketplace'
    split = { enabled: true, partnerPercent: 30 }
    ambiente = 'sandbox'
    const r = await new MercadoPagoProvider().createPayment({ ...base, deviceId: undefined, cardholderDocumentNumber: '52998224725', issuer: undefined })
    expect(r.requisicao).toMatchObject({
      deviceIdPresente: false,
      deviceIdTamanho: 0,
      titularDiferenteDoComprador: true,
      emissorEnviado: null,
      splitAtivo: true,
      tokenDoMarketplace: true,
      ambiente: 'sandbox',
    })
    expect(JSON.stringify(r.requisicao)).not.toContain('52998224725')
  })

  it('Pix não leva requisição de cartão', async () => {
    create.mockResolvedValue({ id: 2, status: 'pending', payment_method_id: 'pix', transaction_amount: 10 })
    const r = await new MercadoPagoProvider().createPayment({ ...base, paymentMethodId: 'pix', cardToken: undefined, installments: undefined })
    expect(r.requisicao).toBeUndefined()
  })

  it('erro da API: a requisição vai pendurada no erro, escondida (fora do JSON e do log)', async () => {
    const erro: any = { message: 'Invalid card_token_id', status: 400, cause: [{ code: 2006, description: 'x' }] }
    create.mockRejectedValue(erro)
    const capturado = await new MercadoPagoProvider().createPayment(base).catch(e => e)

    expect(capturado).toBeInstanceOf(MercadoPagoPaymentError)
    expect((capturado as any).mpRequisicao).toMatchObject({ parcelas: 3, deviceIdPresente: true })
    // O erro original também carrega o contexto, e nenhum dos dois o mostra.
    expect(erro.mpRequisicao).toMatchObject({ parcelas: 3 })
    expect(Object.keys(capturado)).not.toContain('mpRequisicao')
    expect(JSON.stringify(capturado)).not.toContain('mpRequisicao')
    expect(JSON.stringify(erro)).not.toContain('mpRequisicao')
  })

  it('erro que o provider não traduz segue como veio (mesmo objeto) e leva a requisição', async () => {
    const erro: any = { message: 'internal_error', status: 500 }
    create.mockRejectedValue(erro)
    const capturado = await new MercadoPagoProvider().createPayment(base).catch(e => e)
    expect(capturado).toBe(erro)
    expect(capturado.mpRequisicao).toMatchObject({ parcelas: 3 })
  })

  it('erro congelado não atrapalha: o erro original sai intacto', async () => {
    const erro = Object.freeze({ message: 'internal_error', status: 500 })
    create.mockRejectedValue(erro)
    const capturado = await new MercadoPagoProvider().createPayment(base).catch(e => e)
    expect(capturado).toBe(erro)
  })

  it('erro de Pix não ganha requisição', async () => {
    const erro: any = { message: 'internal_error', status: 500 }
    create.mockRejectedValue(erro)
    await new MercadoPagoProvider().createPayment({ ...base, paymentMethodId: 'pix', cardToken: undefined }).catch(() => {})
    expect(erro.mpRequisicao).toBeUndefined()
  })
})
