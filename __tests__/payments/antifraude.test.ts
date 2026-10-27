import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * `cc_rejected_high_risk`: o que vai ao Mercado Pago para o antifraude dele
 * reconhecer o comprador (IP, telefone, cadastro, itens, entrega) e o 3DS
 * opcional, que troca parte das recusas por uma confirmação no banco.
 */
const create = vi.fn()
const preCreate = vi.fn()
vi.mock('@/lib/payments/mercado-pago/client', () => ({
  getMpPaymentWithToken: () => ({ create: (...a: any[]) => create(...a) }),
  getMpPreApprovalWithToken: () => ({ create: (...a: any[]) => preCreate(...a) }),
}))
vi.mock('@/lib/payments/mercado-pago/marketplace-store', () => ({
  getEffectiveMpAuth: async () => ({ accessToken: 'APP_USR-x', source: 'env' }),
}))
vi.mock('@/lib/payments/config', () => ({
  getPaymentConfig: () => ({ mp: { env: 'production', notificationUrl: 'https://x/webhook', split: { enabled: false, partnerPercent: 0 } } }),
}))

import { MercadoPagoProvider } from '@/lib/payments/mercado-pago/provider'
import {
  categoriaDoPedido,
  desafioTresDS,
  erroDoCampoTresDS,
  ipDoComprador,
  itensParaMercadoPago,
  telefoneParaMercadoPago,
} from '@/lib/payments/antifraude'

const base = {
  externalReference: 'ord1',
  amount: 105,
  currency: 'BRL' as const,
  description: 'Carrinho DomineAqui - 2 itens',
  payerEmail: 'ana@example.com',
  payerName: 'Ana Souza',
  idempotencyKey: 'k',
  paymentMethodId: 'master',
  cardToken: 'tok',
  installments: 1,
  issuer: '24',
  payerDocumentType: 'CPF' as const,
  payerDocumentNumber: '05232939769',
  metadata: { orderId: 'ord1', type: 'material' },
}

const aprovado = { id: 1, status: 'approved', payment_type_id: 'credit_card', transaction_amount: 105 }

beforeEach(() => {
  create.mockReset()
  preCreate.mockReset()
  create.mockResolvedValue(aprovado)
  delete process.env.MERCADOPAGO_3DS_MODE
})
afterEach(() => {
  delete process.env.MERCADOPAGO_3DS_MODE
})

describe('helpers do antifraude', () => {
  it('IP: só um IP de verdade', () => {
    expect(ipDoComprador('189.10.20.30')).toBe('189.10.20.30')
    expect(ipDoComprador('189.10.20.30, 10.0.0.1')).toBe('189.10.20.30')
    expect(ipDoComprador('2804:14c::1')).toBe('2804:14c::1')
    expect(ipDoComprador('unknown')).toBeUndefined()
    expect(ipDoComprador(undefined)).toBeUndefined()
  })

  it('telefone: DDD + número, com ou sem +55 e máscara', () => {
    expect(telefoneParaMercadoPago('(11) 98765-4321')).toEqual({ area_code: '11', number: '987654321' })
    expect(telefoneParaMercadoPago('+55 21 3456-7890')).toEqual({ area_code: '21', number: '34567890' })
    expect(telefoneParaMercadoPago('011987654321')).toEqual({ area_code: '11', number: '987654321' })
    expect(telefoneParaMercadoPago('12345')).toBeUndefined()
    expect(telefoneParaMercadoPago('')).toBeUndefined()
  })

  it('categoria por tipo de pedido', () => {
    expect(categoriaDoPedido('material')).toBe('learnings')
    expect(categoriaDoPedido('donation')).toBe('donations')
    expect(categoriaDoPedido(undefined)).toBe('learnings')
  })

  it('itens reais; a diferença positiva (taxa, frete) vira item próprio', () => {
    const itens = itensParaMercadoPago({
      referencia: 'o1',
      descricao: 'Carrinho',
      valor: 105,
      categoria: 'learnings',
      itens: [
        { id: 'a', title: 'Material A', quantity: 1, unitPrice: 60 },
        { id: 'b', title: 'Material B', quantity: 2, unitPrice: 20 },
      ],
    })
    expect(itens.map(i => [i.id, i.unit_price, i.quantity])).toEqual([
      ['a', 60, 1],
      ['b', 20, 2],
      ['o1-taxa', 5, 1],
    ])
    expect(itens.reduce((s, i) => s + i.unit_price * i.quantity, 0)).toBe(105)
  })

  it('itens que somam mais que o cobrado (desconto) → um item só com o total', () => {
    const itens = itensParaMercadoPago({
      referencia: 'o1',
      descricao: 'Carrinho',
      valor: 50,
      categoria: 'learnings',
      itens: [{ id: 'a', title: 'A', quantity: 1, unitPrice: 60 }],
    })
    expect(itens).toHaveLength(1)
    expect(itens[0]).toMatchObject({ id: 'o1', unit_price: 50, quantity: 1, category_id: 'learnings' })
  })

  it('erro do campo do 3DS é reconhecido; recusa ou 5xx não', () => {
    expect(erroDoCampoTresDS({ status: 400, cause: [{ code: 4321, description: 'three_d_secure_mode not allowed' }] })).toBe(true)
    expect(erroDoCampoTresDS({ status: 400, cause: [{ code: 2067, description: 'Invalid user identification number' }] })).toBe(false)
    expect(erroDoCampoTresDS({ status: 500, message: 'three_d_secure internal error' })).toBe(false)
  })

  it('desafio só com pending_challenge e URL https', () => {
    const p = { status: 'pending', status_detail: 'pending_challenge', three_ds_info: { external_resource_url: 'https://acs.banco/challenge', creq: 'abc' } }
    expect(desafioTresDS(p)).toEqual({ url: 'https://acs.banco/challenge', creq: 'abc' })
    expect(desafioTresDS({ ...p, status: 'approved' })).toBeUndefined()
    expect(desafioTresDS({ ...p, three_ds_info: { external_resource_url: 'javascript:alert(1)', creq: 'abc' } })).toBeUndefined()
  })
})

describe('MercadoPagoProvider.createPayment — antifraude no cartão', () => {
  it('manda 3DS opcional, binary_mode desligado e os dados do comprador', async () => {
    await new MercadoPagoProvider().createPayment({
      ...base,
      payerIp: '189.10.20.30',
      payerProfile: { phone: '(11) 98765-4321', registeredAt: new Date('2024-03-01T12:00:00Z') },
      items: [{ id: 'a', title: 'Material A', quantity: 1, unitPrice: 100 }],
    })
    const { body } = create.mock.calls[0][0]
    expect(body.three_d_secure_mode).toBe('optional')
    expect(body.binary_mode).toBe(false)
    expect(body.additional_info.ip_address).toBe('189.10.20.30')
    expect(body.additional_info.payer).toEqual({
      first_name: 'Ana',
      last_name: 'Souza',
      phone: { area_code: '11', number: '987654321' },
      registration_date: '2024-03-01T12:00:00.000Z',
    })
    expect(body.additional_info.items.map((i: any) => i.title)).toEqual(['Material A', 'Taxas e frete'])
    expect(body.additional_info.items[0].category_id).toBe('learnings')
  })

  it('impresso com entrega: endereço vai em payer e em shipments', async () => {
    await new MercadoPagoProvider().createPayment({
      ...base,
      metadata: { orderId: 'ord1', type: 'physical' },
      shippingAddress: { zipCode: '01310-100', streetName: 'Av. Paulista', streetNumber: '1000', city: 'São Paulo', federalUnit: 'sp' },
    })
    const { additional_info } = create.mock.calls[0][0].body
    expect(additional_info.payer.address).toEqual({ zip_code: '01310100', street_name: 'Av. Paulista', street_number: '1000' })
    expect(additional_info.shipments.receiver_address).toMatchObject({ zip_code: '01310100', city_name: 'São Paulo', state_name: 'SP' })
  })

  it('sem dados de apoio, nada vazio vai junto', async () => {
    await new MercadoPagoProvider().createPayment({ ...base, payerIp: 'unknown', payerName: '' })
    const { additional_info } = create.mock.calls[0][0].body
    expect(additional_info.ip_address).toBeUndefined()
    expect(additional_info.payer).toBeUndefined()
    expect(additional_info.shipments).toBeUndefined()
  })

  it('MERCADOPAGO_3DS_MODE=off desliga o 3DS', async () => {
    process.env.MERCADOPAGO_3DS_MODE = 'off'
    await new MercadoPagoProvider().createPayment(base)
    expect(create.mock.calls[0][0].body.three_d_secure_mode).toBeUndefined()
  })

  it('conta sem 3DS: refaz sem o campo, com outra chave, e a venda segue', async () => {
    create.mockRejectedValueOnce({ status: 400, message: 'bad_request', cause: [{ code: 1, description: 'three_d_secure_mode is not allowed' }] })
    const r = await new MercadoPagoProvider().createPayment(base)
    expect(create).toHaveBeenCalledTimes(2)
    expect(create.mock.calls[1][0].body.three_d_secure_mode).toBeUndefined()
    expect(create.mock.calls[1][0].requestOptions.idempotencyKey).toBe('k-sem3ds')
    expect(r.status).toBe('approved')
    expect(r.requisicao?.tresDs).toBeNull()
  })

  it('recusa de outro tipo não é refeita', async () => {
    create.mockRejectedValueOnce({ status: 400, message: 'bad_request', cause: [{ code: 2067, description: 'Invalid user identification number' }] })
    await expect(new MercadoPagoProvider().createPayment(base)).rejects.toBeTruthy()
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('pending_challenge devolve o desafio para o checkout', async () => {
    create.mockResolvedValueOnce({
      id: 9,
      status: 'pending',
      status_detail: 'pending_challenge',
      payment_type_id: 'credit_card',
      transaction_amount: 105,
      three_ds_info: { external_resource_url: 'https://acs.banco/challenge', creq: 'eyJ' },
    })
    const r = await new MercadoPagoProvider().createPayment(base)
    expect(r.status).toBe('pending')
    expect(r.statusDetail).toBe('pending_challenge')
    expect(r.threeDs).toEqual({ url: 'https://acs.banco/challenge', creq: 'eyJ' })
    expect(r.requisicao).toMatchObject({ tresDs: 'optional', ipEnviado: false })
  })

  it('Pix não leva 3DS nem additional_info de cartão', async () => {
    create.mockResolvedValueOnce({ id: 2, status: 'pending', payment_method_id: 'pix' })
    await new MercadoPagoProvider().createPayment({ ...base, paymentMethodId: 'pix', cardToken: undefined, payerIp: '189.10.20.30' })
    const { body } = create.mock.calls[0][0]
    expect(body.three_d_secure_mode).toBeUndefined()
    expect(body.additional_info).toBeUndefined()
  })
})

describe('MercadoPagoProvider.createPreapproval — device ID', () => {
  it('assinatura leva o device ID no header do antifraude', async () => {
    preCreate.mockResolvedValue({ id: 'pre1', status: 'authorized' })
    await new MercadoPagoProvider().createPreapproval({
      externalReference: 'u:p:1',
      payerEmail: 'ana@example.com',
      amount: 49.9,
      currency: 'BRL',
      reason: 'Plus',
      frequencyMonths: 1,
      cardTokenId: 'tok',
      deviceId: 'armor.abc',
      backUrl: 'https://x/profile',
    })
    expect(preCreate.mock.calls[0][0].requestOptions).toEqual({ meliSessionId: 'armor.abc' })
  })
})
