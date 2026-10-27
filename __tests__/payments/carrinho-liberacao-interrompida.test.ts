import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ObjectId } from 'mongodb'

/**
 * "Pagou, o Mercado Pago aprovou e ficou pendente no site" — compra pelo
 * carrinho, com impresso junto.
 *
 * O status vira `approved` antes dos efeitos (é o compare-and-set que impede
 * rodá-los duas vezes). Os efeitos do carrinho são os mais lentos do site:
 * liberar cada item, montar o PDF de cada um e mandar o e-mail — e só DEPOIS
 * disso o pedido impresso era marcado como pago. Quando a função esgotava o
 * prazo no meio, o impresso ficava "aguardando pagamento" para sempre: o
 * webhook reentregue e a varredura viam "status inalterado" e paravam.
 *
 * Agora: o impresso é marcado logo depois de liberar o digital, antes dos
 * e-mails; o pedido carimba início e fim dos efeitos; e quem achar um
 * "começou e não terminou" (varredura, admin) termina o serviço.
 */

// ── Mongo em memória, só com o que os efeitos usam ──────────────────────────
type Doc = Record<string, any>
const colecoes = new Map<string, Doc[]>()
const col = (nome: string) => {
  if (!colecoes.has(nome)) colecoes.set(nome, [])
  return colecoes.get(nome)!
}

const valor = (doc: Doc, caminho: string) => caminho.split('.').reduce((v: any, k) => (v == null ? v : v[k]), doc)
const igual = (a: any, b: any) => (a instanceof ObjectId || b instanceof ObjectId ? String(a) === String(b) : a === b)

function casa(doc: Doc, filtro: Doc): boolean {
  return Object.entries(filtro).every(([k, cond]) => {
    if (k === '$or') return (cond as Doc[]).some((f) => casa(doc, f))
    if (k === '$and') return (cond as Doc[]).every((f) => casa(doc, f))
    const v = valor(doc, k)
    if (cond && typeof cond === 'object' && !(cond instanceof ObjectId) && !(cond instanceof Date)) {
      return Object.entries(cond).every(([op, x]: [string, any]) => {
        if (op === '$exists') return x ? v !== undefined : v === undefined
        if (op === '$lt') return v !== undefined && v < x
        if (op === '$gte') return v !== undefined && v >= x
        if (op === '$ne') return !igual(v, x)
        if (op === '$in') return x.some((y: any) => igual(v, y))
        throw new Error(`operador não suportado no dublê: ${op}`)
      })
    }
    return igual(v, cond)
  })
}

function aplicar(doc: Doc, u: Doc) {
  for (const [k, v] of Object.entries(u.$set || {})) doc[k] = v
  for (const [k, v] of Object.entries(u.$inc || {})) doc[k] = (doc[k] || 0) + (v as number)
}

vi.mock('@/lib/mongodb', () => ({
  getDb: async () => ({
    collection: (nome: string) => ({
      findOne: async (f: Doc) => col(nome).find((d) => casa(d, f)) || null,
      updateOne: async (f: Doc, u: Doc, o?: { upsert?: boolean }) => {
        const doc = col(nome).find((d) => casa(d, f))
        if (doc) {
          aplicar(doc, u)
          return { matchedCount: 1 }
        }
        if (o?.upsert) {
          const novo: Doc = { _id: new ObjectId() }
          for (const [k, v] of Object.entries(f)) if (typeof v !== 'object' || v instanceof ObjectId) novo[k] = v
          aplicar(novo, { $set: { ...(u.$setOnInsert || {}), ...(u.$set || {}) } })
          col(nome).push(novo)
        }
        return { matchedCount: 0 }
      },
      insertOne: async (d: Doc) => {
        const novo = { _id: new ObjectId(), ...d }
        col(nome).push(novo)
        return { insertedId: novo._id }
      },
    }),
  }),
}))

vi.mock('@/lib/coupons', () => ({ approveCouponRedemption: vi.fn(), releaseCouponRedemption: vi.fn() }))
vi.mock('@/lib/prouni-fies', () => ({ consumeProuniGrant: vi.fn(), releaseProuniGrant: vi.fn() }))
vi.mock('@/lib/analytics', () => ({ recordOrderCheckoutEvent: vi.fn() }))
vi.mock('@/lib/meta-capi', () => ({ sendMetaCapiEvent: vi.fn() }))
vi.mock('@/lib/payments/audit', () => ({ audit: vi.fn() }))
vi.mock('@/lib/payments/recusa-cartao-log', () => ({ registrarRecusaDoPedido: vi.fn() }))
const registrarVenda = vi.fn()
vi.mock('@/lib/embaixadores/servidor', () => ({
  registrarVendaDoPedido: (...a: any[]) => registrarVenda(...a),
  estornarVendaDoPedido: vi.fn(),
}))
vi.mock('@/lib/material-pdf-email', () => ({ buildAutoEmailPdfAttachments: async () => ({ items: [], eligible: false }) }))

const emailDoCarrinho = vi.fn()
const emailDoImpresso = vi.fn()
vi.mock('@/lib/mail', () => ({
  sendCartPurchasedEmail: (...a: any[]) => emailDoCarrinho(...a),
  sendShopOrderConfirmedEmail: (...a: any[]) => emailDoImpresso(...a),
  sendMaterialPurchasedEmail: vi.fn(async () => undefined),
  sendPlanPurchasedEmail: vi.fn(),
  sendManualClinicoPurchasedEmail: vi.fn(),
  sendRafflePurchaseEmail: vi.fn(),
}))

const orderId = new ObjectId()
const shopOrderId = new ObjectId()
const materialA = new ObjectId()
const materialB = new ObjectId()

function semear(extra: Doc = {}) {
  colecoes.clear()
  col('payment_orders').push({
    _id: orderId,
    userId: 'u1',
    payerEmail: 'compradora@example.com',
    payerName: 'Compradora',
    type: 'material',
    refId: String(materialA),
    amount: 150,
    baseAmount: 150,
    currency: 'BRL',
    status: 'pending',
    providerPaymentId: 'mp-1',
    metadata: {
      itemType: 'cart',
      shopOrderId: String(shopOrderId),
      cartItems: [
        { itemType: 'material', itemId: String(materialA), itemTitle: 'Resumo A', price: 50 },
        { itemType: 'material', itemId: String(materialB), itemTitle: 'Resumo B', price: 40 },
      ],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...extra,
  })
  col('shop_orders').push({
    _id: shopOrderId,
    userId: 'u1',
    userEmail: 'compradora@example.com',
    userName: 'Compradora',
    orderNumber: 'DA-0001',
    status: 'awaiting_payment',
    paymentStatus: 'pending',
    items: [{ productId: 'nao-objectid', title: 'Apostila impressa', quantity: 1, unitPrice: 60 }],
    subtotal: 60,
    freight: 0,
    total: 60,
  })
}

const aprovado = { providerOrderId: 'mp-1', status: 'approved', amount: 150, currency: 'BRL', paymentMethod: 'credit_card' } as any
const pedido = () => col('payment_orders')[0]
const impresso = () => col('shop_orders')[0]

beforeEach(() => {
  vi.clearAllMocks()
  emailDoCarrinho.mockResolvedValue(undefined)
  emailDoImpresso.mockResolvedValue(undefined)
})

describe('carrinho com impresso: aprovação que morre no meio', () => {
  it('o impresso é marcado como pago antes do e-mail do carrinho (a parte lenta)', async () => {
    semear()
    // O e-mail do carrinho nunca termina — é a função esgotando o prazo ali.
    emailDoCarrinho.mockReturnValue(new Promise(() => {}))
    const { applyPaymentResult } = await import('@/lib/payments/effects')

    void applyPaymentResult(String(orderId), aprovado)
    await vi.waitFor(() => expect(emailDoCarrinho).toHaveBeenCalled())

    expect(pedido().status).toBe('approved')
    expect(impresso()).toMatchObject({ status: 'paid', paymentStatus: 'approved' })
    expect(col('material_purchases').map((p) => p.itemTitle).sort()).toEqual(['Resumo A', 'Resumo B'])
    // Começou e não terminou: é o que a varredura procura.
    expect(pedido().effectsStartedAt).toBeInstanceOf(Date)
    expect(pedido().effectsCompletedAt).toBeUndefined()
  })

  it('efeitos completos carimbam o fim', async () => {
    semear()
    const { applyPaymentResult } = await import('@/lib/payments/effects')

    await applyPaymentResult(String(orderId), aprovado)

    expect(pedido().effectsCompletedAt).toBeInstanceOf(Date)
    expect(emailDoCarrinho).toHaveBeenCalledTimes(1)
    expect(emailDoImpresso).toHaveBeenCalledTimes(1)
  })

  it('reentrega do webhook depois da queda não refazia nada — a retomada termina o serviço', async () => {
    // Estado deixado pela queda ANTES desta correção: aprovado, impresso ainda
    // aguardando pagamento, nada liberado, efeitos começados há 30 min.
    semear({ status: 'approved', effectsStartedAt: new Date(Date.now() - 30 * 60_000) })
    const { applyPaymentResult, concluirEfeitosInterrompidos } = await import('@/lib/payments/effects')

    const reentrega = await applyPaymentResult(String(orderId), aprovado)
    expect(reentrega.reason).toBe('status inalterado')
    expect(impresso().status).toBe('awaiting_payment')

    expect(await concluirEfeitosInterrompidos(String(orderId))).toBe('concluidos')
    expect(impresso()).toMatchObject({ status: 'paid', paymentStatus: 'approved' })
    expect(col('material_purchases')).toHaveLength(2)
    expect(pedido().effectsCompletedAt).toBeInstanceOf(Date)
    expect(pedido().effectsRetries).toBe(1)
    // A venda do embaixador é idempotente por pedido e pode ter sido o passo que morreu.
    expect(registrarVenda).toHaveBeenCalledTimes(1)

    // Terminado: uma segunda varredura não roda nada de novo.
    expect(await concluirEfeitosInterrompidos(String(orderId))).toBe('nada_a_fazer')
    expect(emailDoCarrinho).toHaveBeenCalledTimes(1)
  })

  it('não retoma efeitos que ainda podem estar rodando (começaram há pouco)', async () => {
    semear({ status: 'approved', effectsStartedAt: new Date(Date.now() - 60_000) })
    const { concluirEfeitosInterrompidos } = await import('@/lib/payments/effects')

    expect(await concluirEfeitosInterrompidos(String(orderId))).toBe('nada_a_fazer')
    expect(impresso().status).toBe('awaiting_payment')
  })

  it('o admin pode forçar a retomada sem esperar os 10 min — mas não atropela uma que ainda roda', async () => {
    semear({ status: 'approved', effectsStartedAt: new Date(Date.now() - 30_000) })
    const { concluirEfeitosInterrompidos } = await import('@/lib/payments/effects')
    // 30 s: a função que aprovou pode estar no meio do e-mail ainda.
    expect(await concluirEfeitosInterrompidos(String(orderId), { forcar: true })).toBe('nada_a_fazer')

    pedido().effectsStartedAt = new Date(Date.now() - 3 * 60_000)
    expect(await concluirEfeitosInterrompidos(String(orderId), { forcar: true })).toBe('concluidos')
    expect(impresso().status).toBe('paid')
  })

  it('tipos cujos efeitos não podem repetir (plano, rifa…) não são refeitos', async () => {
    semear({ status: 'approved', type: 'plan', effectsStartedAt: new Date(Date.now() - 30 * 60_000) })
    const { concluirEfeitosInterrompidos } = await import('@/lib/payments/effects')

    expect(await concluirEfeitosInterrompidos(String(orderId))).toBe('nao_repetiveis')
    expect(pedido().effectsRetries).toBeUndefined()
  })
})
