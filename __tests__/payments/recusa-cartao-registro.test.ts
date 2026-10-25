import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ObjectId } from 'mongodb'

/**
 * A recusa de cartão chega ao log do Analytics por onde ela de fato passa:
 *  - `applyPaymentResult` (resposta imediata, webhook, polling, varredura);
 *  - `recoverFromProviderFailure` (a API recusou a CRIAÇÃO do pagamento);
 *  - o provider, que anexa ao resultado/erro o que a chamada levava.
 * E registrar NUNCA pode derrubar um checkout.
 */

// ── Dublê do banco: guarda o que for gravado em cada coleção ────────────────
const orderId = new ObjectId()
let statusNoBanco = 'pending'
let orderExtra: Record<string, unknown> = {}
const gravacoes: Array<{ colecao: string; filtro: any; update: any; opcoes?: any }> = []
const insercoes: Array<{ colecao: string; doc: any }> = []
let colecaoQuebrada = false

vi.mock('@/lib/mongodb', () => ({ getDb: async () => dbFalso() }))
function dbFalso() {
  return {
    collection: (colecao: string) => ({
      findOne: async () =>
        colecao === 'payment_orders'
          ? { _id: orderId, status: statusNoBanco, type: 'material', amount: 297.5, baseAmount: 290, userId: 'u1', payerName: 'Maria', payerEmail: 'maria@exemplo.com', refId: 'm1', metadata: { itemTitle: 'Combo ME 1' }, ...orderExtra }
          : null,
      updateOne: async (filtro: any, update: any, opcoes?: any) => {
        if (colecao === 'card_rejections' && colecaoQuebrada) throw new Error('mongo caiu')
        gravacoes.push({ colecao, filtro, update, opcoes })
        if (colecao === 'payment_orders' && 'status' in filtro && update.$set?.status) {
          if (filtro.status !== statusNoBanco) return { matchedCount: 0 }
          statusNoBanco = update.$set.status
        }
        return { matchedCount: 1 }
      },
      insertOne: async (doc: any) => {
        if (colecao === 'card_rejections' && colecaoQuebrada) throw new Error('mongo caiu')
        insercoes.push({ colecao, doc })
        return { insertedId: new ObjectId() }
      },
      createIndex: async () => 'ok',
      updateMany: async () => ({ matchedCount: 0 }),
    }),
  }
}

vi.mock('@/lib/coupons', () => ({ approveCouponRedemption: vi.fn(), releaseCouponRedemption: vi.fn() }))
vi.mock('@/lib/prouni-fies', () => ({ consumeProuniGrant: vi.fn(), releaseProuniGrant: vi.fn() }))
vi.mock('@/lib/analytics', () => ({ recordOrderCheckoutEvent: vi.fn() }))
vi.mock('@/lib/meta-capi', () => ({ sendMetaCapiEvent: vi.fn() }))
vi.mock('@/lib/payments/audit', () => ({ audit: vi.fn() }))
vi.mock('@/lib/embaixadores/servidor', () => ({ registrarVendaDoPedido: vi.fn(), estornarVendaDoPedido: vi.fn() }))

const findPaymentByExternalReference = vi.fn()
vi.mock('@/lib/payments', () => ({
  getPaymentProvider: () => ({ findPaymentByExternalReference: (...a: any[]) => findPaymentByExternalReference(...a) }),
}))

import { applyPaymentResult } from '@/lib/payments/effects'
import { recoverFromProviderFailure } from '@/lib/payments/provider-failure'
import { ehPagamentoDeCartao, registrarFalhaDeCartao } from '@/lib/payments/recusa-cartao-log'
import { montarRequisicaoDoCartao } from '@/lib/payments/recusa-cartao'

const REQUISICAO = montarRequisicaoDoCartao({
  paymentMethodId: 'master', parcelas: 3, valor: 297.5, emissor: 24, deviceId: 'dev-123', ambiente: 'producao', timeoutMs: 8000,
  idempotencyKey: 'idem', referencia: String(orderId),
})

const recusaDeCartao = (extra: Record<string, unknown> = {}): any => ({
  providerOrderId: '999',
  status: 'rejected',
  statusDetail: 'cc_rejected_high_risk',
  amount: 297.5,
  currency: 'BRL',
  paymentMethod: 'credit_card',
  requisicao: REQUISICAO,
  raw: { id: 999, status: 'rejected', status_detail: 'cc_rejected_high_risk', payment_method_id: 'master', payment_type_id: 'credit_card', issuer_id: '24', installments: 3, transaction_amount: 297.5, card: { first_six_digits: '515590', last_four_digits: '4321' } },
  ...extra,
})

const doLog = () => gravacoes.filter(g => g.colecao === 'card_rejections')

beforeEach(() => {
  statusNoBanco = 'pending'
  orderExtra = {}
  colecaoQuebrada = false
  gravacoes.length = 0
  insercoes.length = 0
  findPaymentByExternalReference.mockReset()
})

describe('applyPaymentResult → log de recusas', () => {
  it('cartão recusado: grava os dados técnicos do MP, o que enviamos e o contexto do pedido', async () => {
    await applyPaymentResult(String(orderId), recusaDeCartao())

    expect(doLog()).toHaveLength(1)
    const { filtro, update, opcoes } = doLog()[0]
    expect(filtro).toEqual({ orderId: String(orderId), etapa: 'resultado' })
    expect(opcoes).toEqual({ upsert: true })
    expect(update.$set).toMatchObject({
      etapa: 'resultado',
      origem: 'servidor',
      orderId: String(orderId),
      userId: 'u1',
      nome: 'Maria',
      email: 'maria@exemplo.com',
      produto: 'Combo ME 1',
      valorBase: 290,
      valorCobrado: 297.5,
      status: 'rejected',
      statusDetail: 'cc_rejected_high_risk',
      tecnico: { paymentId: '999', bin: '515590', ultimos4: '4321', emissorId: '24', parcelas: 3, paymentMethodId: 'master' },
      requisicao: { parcelas: 3, deviceIdPresente: true, emissorEnviado: '24' },
    })
    expect(update.$setOnInsert.createdAt).toBeInstanceOf(Date)
  })

  it('o mesmo resultado aplicado de novo (webhook + polling) não duplica: nada novo é gravado', async () => {
    await applyPaymentResult(String(orderId), recusaDeCartao())
    await applyPaymentResult(String(orderId), recusaDeCartao())
    expect(doLog()).toHaveLength(1)
  })

  it('cartão cancelado também entra', async () => {
    await applyPaymentResult(String(orderId), recusaDeCartao({ status: 'cancelled', statusDetail: 'by_collector' }))
    expect(doLog()).toHaveLength(1)
    expect(doLog()[0].update.$set.status).toBe('cancelled')
  })

  it('Pix recusado/expirado NÃO é falha de cartão', async () => {
    await applyPaymentResult(
      String(orderId),
      { providerOrderId: '5', status: 'expired', amount: 10, currency: 'BRL', paymentMethod: 'pix', raw: { payment_type_id: 'bank_transfer' } } as any
    )
    expect(doLog()).toHaveLength(0)
  })

  it('aprovado NÃO entra no log', async () => {
    // Doação: aprovar um material dispararia a liberação real, que não é o assunto aqui.
    orderExtra = { type: 'donation' }
    await applyPaymentResult(String(orderId), recusaDeCartao({ status: 'approved', statusDetail: 'accredited' }))
    expect(doLog()).toHaveLength(0)
  })

  it('estorno e chargeback não são recusa de cartão', async () => {
    statusNoBanco = 'approved'
    await applyPaymentResult(String(orderId), recusaDeCartao({ status: 'refunded', statusDetail: 'refunded' }))
    expect(doLog()).toHaveLength(0)
  })

  it('recusa sem a requisição (veio de webhook): identifica o cartão pelo tipo do pagamento', async () => {
    await applyPaymentResult(String(orderId), recusaDeCartao({ requisicao: undefined }))
    expect(doLog()).toHaveLength(1)
    expect(doLog()[0].update.$set.requisicao).toBeUndefined()
    expect(doLog()[0].update.$set.tecnico.paymentId).toBe('999')
  })

  it('pedido encerrado por provider_error: usa a requisição guardada na order quando o MP nunca respondeu', async () => {
    orderExtra = { metadata: { itemTitle: 'Combo ME 1', cartaoRequisicao: REQUISICAO } }
    await applyPaymentResult(String(orderId), { providerOrderId: '', status: 'rejected', statusDetail: 'provider_error', amount: 297.5, currency: 'BRL', paymentMethod: 'unknown', raw: null } as any)
    expect(doLog()).toHaveLength(1)
    expect(doLog()[0].update.$set).toMatchObject({ statusDetail: 'provider_error', requisicao: { deviceIdPresente: true } })
  })

  it('se gravar o log falhar, o pedido é atualizado do mesmo jeito (o checkout não cai)', async () => {
    colecaoQuebrada = true
    const r = await applyPaymentResult(String(orderId), recusaDeCartao())
    expect(r.applied).toBe(true)
    expect(statusNoBanco).toBe('rejected')
  })
})

describe('ehPagamentoDeCartao', () => {
  it('requisição, tipo do pagamento ou payment_type_id do MP', () => {
    expect(ehPagamentoDeCartao({ metadata: {} }, { requisicao: REQUISICAO } as any)).toBe(true)
    expect(ehPagamentoDeCartao({ metadata: {} }, { paymentMethod: 'debit_card' } as any)).toBe(true)
    expect(ehPagamentoDeCartao({ metadata: {} }, { raw: { payment_type_id: 'credit_card' } } as any)).toBe(true)
    expect(ehPagamentoDeCartao({ metadata: { cartaoRequisicao: REQUISICAO } }, { raw: null } as any)).toBe(true)
    expect(ehPagamentoDeCartao({ metadata: {} }, { paymentMethod: 'pix', raw: { payment_type_id: 'bank_transfer' } } as any)).toBe(false)
    expect(ehPagamentoDeCartao({ metadata: {} }, { paymentMethod: 'boleto' } as any)).toBe(false)
  })
})

describe('registrarFalhaDeCartao', () => {
  it('sem pedido: insere; limpa os campos indefinidos, também os aninhados', async () => {
    await registrarFalhaDeCartao(dbFalso() as any, {
      etapa: 'tokenizacao',
      origem: 'navegador',
      navegador: { origemDoFormulario: 'checkout', codigos: ['205'], mensagem: undefined, bin: '515590' },
    })
    expect(insercoes).toHaveLength(1)
    const doc = insercoes[0].doc
    expect(doc.navegador).toEqual({ origemDoFormulario: 'checkout', codigos: ['205'], bin: '515590' })
    expect('mensagem' in doc.navegador).toBe(false)
    expect(doc.createdAt).toBeInstanceOf(Date)
  })

  it('o banco falhando nunca lança', async () => {
    colecaoQuebrada = true
    await expect(registrarFalhaDeCartao(dbFalso() as any, { etapa: 'envio', origem: 'navegador' })).resolves.toBeUndefined()
  })
})

describe('recoverFromProviderFailure → log de recusas', () => {
  const erroDaApi = (extra: Record<string, unknown> = {}) => {
    const err: any = { status: 400, message: 'Invalid card_token_id', cause: [{ code: 2006, description: 'Card Token not found' }], ...extra }
    Object.defineProperty(err, 'mpRequisicao', { value: REQUISICAO, enumerable: false })
    return err
  }

  it('API recusou a criação (4xx) com cartão: registra erro e requisição, e segue com a recusa de sempre', async () => {
    const r = await recoverFromProviderFailure({ db: dbFalso() as any, orderId: String(orderId), amount: 297.5, err: erroDaApi(), created: null })
    expect(r).toBeNull()
    expect(doLog()).toHaveLength(1)
    expect(doLog()[0].filtro).toEqual({ orderId: String(orderId), etapa: 'criacao' })
    expect(doLog()[0].update.$set).toMatchObject({
      etapa: 'criacao',
      userId: 'u1',
      produto: 'Combo ME 1',
      valorCobrado: 297.5,
      erro: { status: 400, mensagem: 'Invalid card_token_id', causas: [{ codigo: '2006', descricao: 'Card Token not found' }] },
      requisicao: { parcelas: 3, deviceIdPresente: true },
    })
  })

  it('o mesmo erro sem requisição (Pix, monitoria) NÃO vai para o log de cartão', async () => {
    const err = { status: 400, cause: [{ code: 2006 }] }
    const r = await recoverFromProviderFailure({ db: dbFalso() as any, orderId: String(orderId), amount: 10, err, created: null })
    expect(r).toBeNull()
    expect(doLog()).toHaveLength(0)
  })

  it('resposta incerta (timeout), pagamento não achado: guarda a requisição na order para o desfecho', async () => {
    findPaymentByExternalReference.mockResolvedValue(null)
    const err = erroDaApi({ status: 504, cause: undefined, message: 'timeout' })
    const r = await recoverFromProviderFailure({ db: dbFalso() as any, orderId: String(orderId), amount: 297.5, err, created: null })
    expect(r?.statusDetail).toBe('provider_unconfirmed')
    expect(doLog()).toHaveLength(0)
    const hold = gravacoes.find(g => g.colecao === 'payment_orders' && g.update.$set?.statusDetail === 'provider_unconfirmed')
    expect(hold?.update.$set['metadata.cartaoRequisicao']).toMatchObject({ parcelas: 3, deviceIdPresente: true })
  })

  it('timeout, mas o pagamento existia e foi recusado: o log recebe a requisição do erro', async () => {
    findPaymentByExternalReference.mockResolvedValue({ providerOrderId: '999', status: 'rejected', statusDetail: 'cc_rejected_other_reason', amount: 297.5, currency: 'BRL', paymentMethod: 'credit_card', raw: { id: 999, payment_type_id: 'credit_card' } })
    const err = erroDaApi({ status: 504, cause: undefined, message: 'timeout' })
    await recoverFromProviderFailure({ db: dbFalso() as any, orderId: String(orderId), amount: 297.5, err, created: null })
    expect(doLog()).toHaveLength(1)
    expect(doLog()[0].update.$set).toMatchObject({ etapa: 'resultado', statusDetail: 'cc_rejected_other_reason', requisicao: { parcelas: 3 } })
  })

  it('registrar nunca troca o resultado: banco do log fora do ar, a recusa segue igual', async () => {
    colecaoQuebrada = true
    const r = await recoverFromProviderFailure({ db: dbFalso() as any, orderId: String(orderId), amount: 297.5, err: erroDaApi(), created: null })
    expect(r).toBeNull()
  })
})
