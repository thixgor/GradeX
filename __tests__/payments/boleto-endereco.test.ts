import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ObjectId } from 'mongodb'
import { NextRequest } from 'next/server'

/**
 * O endereço do boleto chega ao Mercado Pago em TODAS as rotas de checkout.
 *
 * O formulário (components/payments/mercado-pago-checkout.tsx) manda
 * `payerAddress` no boleto, e o Mercado Pago recusa o boleto sem ele. /buy
 * (planos), loja, Manual Clínico e rifas não declaravam o campo no schema: o
 * zod descarta chave desconhecida em silêncio, o provider não via endereço
 * nenhum e o boleto era recusado. As rotas de materiais e de compra sem conta
 * já repassavam — o que fazia o defeito aparecer só nas outras.
 *
 * As rotas são as reais; só o banco e o Mercado Pago são dublês.
 */

const createPayment = vi.fn()
const cursor = (itens: any[]) => {
  const c: any = { toArray: async () => itens, sort: () => c, limit: () => c, project: () => c, skip: () => c }
  return c
}

/** Documentos que cada coleção devolve; o que não está aqui é "não achou". */
const banco: { findOne: Record<string, any>; find: Record<string, any[]> } = { findOne: {}, find: {} }

vi.mock('@/lib/auth', () => ({
  getSession: async () => ({ userId: '6650f0f0f0f0f0f0f0f0f0f0', email: 'aluna@exemplo.com', name: 'Aluna Teste', role: 'user' }),
}))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: async () => ({ success: true }) }))
vi.mock('@/lib/payments', () => ({
  getPaymentProvider: () => ({ createPayment: (...a: any[]) => createPayment(...a) }),
  deriveIdempotencyKey: (id: string) => `idem-${id}`,
}))
vi.mock('@/lib/payments/effects', () => ({ applyPaymentResult: async () => ({ applied: true }) }))
vi.mock('@/lib/payments/audit', () => ({ audit: async () => undefined }))
vi.mock('@/lib/analytics', () => ({
  getRequestAnalyticsMeta: () => ({}),
  recordOrderCheckoutEvent: async () => undefined,
  recordCheckoutEvent: async () => undefined,
}))
vi.mock('@/lib/mail', () => ({ sendManualClinicoPurchasedEmail: async () => undefined }))
vi.mock('@/lib/prouni-fies', async importOriginal => {
  const original = await importOriginal<typeof import('@/lib/prouni-fies')>()
  return { ...original, resolveProuniForCheckout: async () => null }
})
vi.mock('@/lib/manual-clinico-product', async importOriginal => {
  const original = await importOriginal<typeof import('@/lib/manual-clinico-product')>()
  const plano = { key: 'vitalicio', label: 'Vitalício', enabled: true, price: 497, durationMonths: null }
  return {
    ...original,
    getManualClinicoConfig: async () => ({ isActive: true, allowCoupons: false, label: 'Manual Clínico', plans: [plano] }),
    getManualClinicoPlan: () => plano,
    getActiveManualClinicoPurchase: async () => null,
  }
})
vi.mock('@/lib/raffles', async importOriginal => {
  const original = await importOriginal<typeof import('@/lib/raffles')>()
  return {
    ...original,
    findRaffleByIdOrSlug: async () => ({
      _id: new ObjectId(), slug: 'rifa-teste', name: 'Rifa Teste', visibility: 'public', pricePerNumber: 10, totalNumbers: 100,
    }),
    canPurchase: () => true,
    reserveNumbers: async () => ({ ok: true }),
  }
})
vi.mock('@/lib/mongodb', () => ({
  getDb: async () => ({
    collection: (nome: string) => ({
      findOne: async () => banco.findOne[nome] ?? null,
      find: () => cursor(banco.find[nome] ?? []),
      insertOne: async () => ({ insertedId: new ObjectId() }),
      updateOne: async () => ({ matchedCount: 1, modifiedCount: 1 }),
      updateMany: async () => ({ matchedCount: 0, modifiedCount: 0 }),
      deleteOne: async () => ({ deletedCount: 1 }),
      countDocuments: async () => 0,
      aggregate: () => cursor([]),
    }),
  }),
}))

const ENDERECO = {
  zipCode: '22775040',
  streetName: 'Avenida das Américas',
  streetNumber: '3500',
  neighborhood: 'Barra da Tijuca',
  city: 'Rio de Janeiro',
  federalUnit: 'RJ',
}

const BOLETO = {
  paymentMethodId: 'bolbradesco',
  payerDocumentType: 'CPF',
  payerDocumentNumber: '05232939769',
  payerAddress: ENDERECO,
}

const PRODUTO_FISICO_ID = new ObjectId().toString()

const ROTAS: Array<{ nome: string; importar: () => Promise<any>; url: string; corpo: Record<string, any>; params?: any }> = [
  {
    nome: '/buy — plano (pagamento único)',
    importar: () => import('@/app/api/payments/orders/route'),
    url: 'http://localhost/api/payments/orders',
    corpo: { type: 'plan', refId: 'plus_semestral', ...BOLETO },
  },
  {
    nome: 'loja (impressos)',
    importar: () => import('@/app/api/loja/checkout/route'),
    url: 'http://localhost/api/loja/checkout',
    corpo: { items: [{ productId: PRODUTO_FISICO_ID, quantity: 1 }], deliveryType: 'pickup', pickupPointId: 'ponto-1', ...BOLETO },
  },
  {
    nome: 'Manual Clínico (com login)',
    importar: () => import('@/app/api/manual-clinico/checkout/route'),
    url: 'http://localhost/api/manual-clinico/checkout',
    corpo: { planKey: 'vitalicio', ...BOLETO },
  },
  {
    nome: 'rifas',
    importar: () => import('@/app/api/raffles/[id]/checkout/route'),
    url: 'http://localhost/api/raffles/rifa-teste/checkout',
    corpo: { numbers: [1, 2], name: 'Aluna Teste', email: 'aluna@exemplo.com', phone: '21999999999', ...BOLETO },
    params: { params: Promise.resolve({ id: 'rifa-teste' }) },
  },
]

beforeEach(() => {
  createPayment.mockReset()
  createPayment.mockResolvedValue({
    providerOrderId: '1', status: 'pending', paymentMethod: 'boleto', amount: 0, currency: 'BRL', boleto: { barcode: '123', ticketUrl: 'https://mp/boleto' },
  })
  banco.findOne = {
    admin_settings: { planos: [{ tipo: 'plus_semestral', nome: 'DomineAqui Plus+', periodo: 'Semestral', preco: 377, role: 'plus', durationMonths: 6 }] },
    shop_settings: { settingsId: 'shop', deliveryMethods: [], pickupPoints: [{ id: 'ponto-1', name: 'Ponto', address: 'Rua A', enabled: true }] },
  }
  banco.find = {
    physical_products: [{ _id: new ObjectId(PRODUTO_FISICO_ID), title: 'Caderno', price: 59.9, isHidden: false, images: [] }],
  }
})

describe('endereço do boleto até o Mercado Pago', () => {
  for (const rota of ROTAS) {
    it(`${rota.nome}: o endereço informado chega ao provider`, async () => {
      const { POST } = await rota.importar()
      const res = await POST(
        new NextRequest(rota.url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(rota.corpo) }),
        rota.params
      )

      expect(res.status).toBe(200)
      expect(createPayment).toHaveBeenCalledTimes(1)
      const entrada = createPayment.mock.calls[0][0]
      expect(entrada.paymentMethodId).toBe('bolbradesco')
      expect(entrada.payerAddress).toEqual(ENDERECO)
      expect(entrada.payerDocumentNumber).toBe('05232939769')
    })

    it(`${rota.nome}: sem endereço (Pix/cartão) segue como antes`, async () => {
      const { payerAddress, ...semEndereco } = rota.corpo
      void payerAddress
      const { POST } = await rota.importar()
      const res = await POST(
        new NextRequest(rota.url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(semEndereco) }),
        rota.params
      )

      expect(res.status).toBe(200)
      expect(createPayment.mock.calls[0][0].payerAddress).toBeUndefined()
    })
  }
})
