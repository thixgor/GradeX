import { ObjectId } from 'mongodb'
import { beforeEach, describe, expect, it } from 'vitest'

import { mongoDeMentira } from '../ajudantes/mongo-de-mentira'
import {
  consumeProuniGrant,
  PROUNI_MAX_HOLDS,
  releaseProuniGrant,
  reserveProuniGrant,
  spendProuniGrantNow,
  type ProuniRequest,
} from '@/lib/prouni-fies'

/**
 * O que estes testes protegem: a segunda tentativa de pagamento.
 *
 * O bug que os originou: quem tinha o desconto PROUNI/FIES aprovado gerava um
 * Pix, não pagava, voltava para tentar de novo — e levava "seu desconto acabou
 * de ser usado em outra compra", para sempre. A concessão ficava presa ao
 * pedido abandonado até o provedor avisar que ele venceu (24h depois, quando
 * avisava). Na prática, quem mais precisava do desconto era quem não conseguia
 * comprar.
 *
 * O contrário também é regra aqui: a concessão é de uso único, então nenhuma
 * dessas voltas pode terminar com a pessoa levando o desconto duas vezes.
 */

const USUARIO = new ObjectId().toHexString()
const SOLICITACAO = new ObjectId().toHexString()

function pedido(overrides: Record<string, any> = {}) {
  return {
    _id: new ObjectId().toHexString(),
    status: 'pending',
    paymentMethod: 'pix',
    providerPaymentId: 'mp-1',
    createdAt: new Date(),
    ...overrides,
  }
}

/** Pix gerado ontem: venceu sem ser pago, não vira pagamento nunca mais. */
function pedidoVencido() {
  return pedido({ createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000) })
}

function solicitacaoAprovada(grant: Record<string, any> = {}): ProuniRequest {
  return {
    _id: SOLICITACAO,
    userId: USUARIO,
    itemType: 'material',
    itemId: 'mat-1',
    status: 'approved',
    grant: {
      discountType: 'percentage',
      discountValue: 40,
      stackWithTier: false,
      usage: 'available',
      reservedOrderId: null,
      reservedOrderIds: [],
      approvedBy: 'admin',
      approvedByName: 'Admin',
      approvedAt: new Date(),
      ...grant,
    },
  } as any

}

let solicitacao: ProuniRequest
let pedidos: any[]
let db: any

function montar(grant: Record<string, any> = {}, outrosPedidos: any[] = []) {
  solicitacao = solicitacaoAprovada(grant)
  pedidos = outrosPedidos
  db = mongoDeMentira({ prouni_requests: [solicitacao], payment_orders: pedidos })
}

beforeEach(() => montar())

const concessao = () => (solicitacao as any).grant

describe('reserveProuniGrant', () => {
  it('prende a concessão disponível ao pedido novo', async () => {
    const novo = pedido()
    pedidos.push(novo)

    await expect(
      reserveProuniGrant(db, { requestId: SOLICITACAO, userId: USUARIO, orderId: novo._id })
    ).resolves.toBe(true)
    expect(concessao().usage).toBe('reserved')
    expect(concessao().reservedOrderIds).toEqual([novo._id])
  })

  it('destrava quem tentou de novo depois de abandonar um Pix vencido', async () => {
    // É o caso que gerou o chamado: a concessão presa num pedido que já não
    // pode ser pago fazia toda compra seguinte morrer em 409.
    const abandonado = pedidoVencido()
    const novo = pedido()
    montar({ usage: 'reserved', reservedOrderId: abandonado._id, reservedOrderIds: [abandonado._id] }, [
      abandonado,
      novo,
    ])

    await expect(
      reserveProuniGrant(db, { requestId: SOLICITACAO, userId: USUARIO, orderId: novo._id })
    ).resolves.toBe(true)
    // O pedido morto sai da lista: só o vivo continua segurando o desconto.
    expect(concessao().reservedOrderIds).toEqual([novo._id])
    expect(concessao().reservedOrderId).toBe(novo._id)
  })

  it('destrava também o pedido que nunca chegou ao provedor', async () => {
    // Aba fechada no meio do checkout: o pedido ficou `pending` sem id do
    // Mercado Pago, e nem o sweeper de reconciliação olha para ele.
    const orfao = pedido({
      providerPaymentId: undefined,
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
    })
    const novo = pedido()
    montar({ usage: 'reserved', reservedOrderId: orfao._id, reservedOrderIds: [orfao._id] }, [orfao, novo])

    await expect(
      reserveProuniGrant(db, { requestId: SOLICITACAO, userId: USUARIO, orderId: novo._id })
    ).resolves.toBe(true)
    expect(concessao().reservedOrderIds).toEqual([novo._id])
  })

  it('deixa a mesma pessoa ter duas tentativas vivas ao mesmo tempo', async () => {
    // Pix aberto agora + troca para cartão na mesma sessão. As duas tentativas
    // carregam a concessão; quem pagar primeiro a gasta.
    const emAberto = pedido()
    const novo = pedido()
    montar({ usage: 'reserved', reservedOrderId: emAberto._id, reservedOrderIds: [emAberto._id] }, [
      emAberto,
      novo,
    ])

    await expect(
      reserveProuniGrant(db, { requestId: SOLICITACAO, userId: USUARIO, orderId: novo._id })
    ).resolves.toBe(true)
    expect(concessao().reservedOrderIds).toEqual([emAberto._id, novo._id])
  })

  it('recusa quando a concessão já foi gasta', async () => {
    montar({ usage: 'used', usedOrderId: 'antigo' })
    const novo = pedido()
    pedidos.push(novo)

    await expect(
      reserveProuniGrant(db, { requestId: SOLICITACAO, userId: USUARIO, orderId: novo._id })
    ).resolves.toBe(false)
  })

  it('recusa quando a concessão venceu', async () => {
    montar({ expiresAt: new Date(Date.now() - 1000) })
    const novo = pedido()
    pedidos.push(novo)

    await expect(
      reserveProuniGrant(db, { requestId: SOLICITACAO, userId: USUARIO, orderId: novo._id })
    ).resolves.toBe(false)
  })

  it('recusa quando a concessão é de outra conta', async () => {
    const novo = pedido()
    pedidos.push(novo)

    await expect(
      reserveProuniGrant(db, { requestId: SOLICITACAO, userId: new ObjectId().toHexString(), orderId: novo._id })
    ).resolves.toBe(false)
  })

  it('para no teto de tentativas vivas ao mesmo tempo', async () => {
    const abertos = Array.from({ length: PROUNI_MAX_HOLDS }, () => pedido())
    const novo = pedido()
    montar(
      {
        usage: 'reserved',
        reservedOrderId: abertos[abertos.length - 1]._id,
        reservedOrderIds: abertos.map((p) => p._id),
      },
      [...abertos, novo]
    )

    await expect(
      reserveProuniGrant(db, { requestId: SOLICITACAO, userId: USUARIO, orderId: novo._id })
    ).resolves.toBe(false)
  })
})

describe('consumeProuniGrant', () => {
  it('gasta a concessão pelo pedido pago, mesmo não sendo a última tentativa', async () => {
    const primeiro = pedido()
    const segundo = pedido()
    montar(
      { usage: 'reserved', reservedOrderId: segundo._id, reservedOrderIds: [primeiro._id, segundo._id] },
      [primeiro, segundo]
    )

    await consumeProuniGrant(db, primeiro._id)

    expect(concessao().usage).toBe('used')
    expect(concessao().usedOrderId).toBe(primeiro._id)
    // A outra tentativa deixa de carregar a concessão: o vencimento dela não
    // pode devolver um desconto que já foi gasto.
    expect(concessao().reservedOrderIds).toEqual([])
  })

  it('não gasta nada quando o pedido não segura a concessão', async () => {
    const dono = pedido()
    montar({ usage: 'reserved', reservedOrderId: dono._id, reservedOrderIds: [dono._id] }, [dono])

    await consumeProuniGrant(db, new ObjectId().toHexString())

    expect(concessao().usage).toBe('reserved')
  })
})

describe('releaseProuniGrant', () => {
  it('devolve a concessão quando o único pedido que a segurava falha', async () => {
    const unico = pedido()
    montar({ usage: 'reserved', reservedOrderId: unico._id, reservedOrderIds: [unico._id] }, [unico])

    await releaseProuniGrant(db, unico._id, 'expired')

    expect(concessao().usage).toBe('available')
    expect(concessao().reservedOrderIds).toEqual([])
    expect(concessao().releaseReason).toBe('expired')
  })

  it('não devolve a concessão enquanto outra tentativa ainda a carrega', async () => {
    // O Pix vencido de ontem não pode soltar o desconto que a compra de agora
    // está usando — seria o benefício de uso único valendo duas vezes.
    const vencido = pedido()
    const atual = pedido()
    montar(
      { usage: 'reserved', reservedOrderId: atual._id, reservedOrderIds: [vencido._id, atual._id] },
      [vencido, atual]
    )

    await releaseProuniGrant(db, vencido._id, 'expired')

    expect(concessao().usage).toBe('reserved')
    expect(concessao().reservedOrderIds).toEqual([atual._id])
    expect(concessao().reservedOrderId).toBe(atual._id)
  })

  it('devolve a concessão no estorno do pedido que a gastou', async () => {
    const pago = pedido({ status: 'refunded' })
    montar({ usage: 'used', usedOrderId: pago._id, reservedOrderId: pago._id, reservedOrderIds: [] }, [pago])

    await releaseProuniGrant(db, pago._id, 'refunded')

    expect(concessao().usage).toBe('available')
    expect(concessao().usedOrderId).toBeNull()
  })

  it('ignora o vencimento de uma tentativa que perdeu a corrida', async () => {
    // Pedido A segurava; B pagou e gastou. Quando A finalmente vence, nada
    // pode voltar para a pessoa.
    const a = pedido()
    const b = pedido()
    montar({ usage: 'used', usedOrderId: b._id, reservedOrderId: b._id, reservedOrderIds: [] }, [a, b])

    await releaseProuniGrant(db, a._id, 'expired')

    expect(concessao().usage).toBe('used')
  })
})

describe('spendProuniGrantNow', () => {
  it('gasta a concessão presa numa tentativa antiga quando o item sai por R$ 0', async () => {
    const abandonado = pedidoVencido()
    montar(
      { usage: 'reserved', reservedOrderId: abandonado._id, reservedOrderIds: [abandonado._id] },
      [abandonado]
    )

    await expect(
      spendProuniGrantNow(db, { requestId: SOLICITACAO, userId: USUARIO, reference: 'material:mat-1' })
    ).resolves.toBe(true)
    expect(concessao().usage).toBe('used')
  })
})
