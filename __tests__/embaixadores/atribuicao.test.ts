import { describe, expect, it } from 'vitest'
import { ObjectId } from 'mongodb'
import { mongoDeMentira } from '../ajudantes/mongo-de-mentira'
import {
  estornarVendaDoPedido,
  registrarVendaDoPedido,
  vincularIndicacaoNoCadastro,
} from '@/lib/embaixadores/servidor'

/*
 * De quem é cada venda, e quanto ela deve ao embaixador. A conta em si está
 * travada em regras.test.ts; aqui é a sequência de leituras no banco que
 * decide a atribuição: cupom primeiro, depois o link, dentro da janela.
 */

const dias = (n: number) => new Date(Date.now() - n * 86_400_000)

function cenario(extra: { status?: string; tipo?: string; codigo: string }) {
  const embaixadorId = new ObjectId()
  const userIdDoEmbaixador = new ObjectId().toString()
  const couponId = new ObjectId().toString()
  const db = mongoDeMentira({
    embaixadores: [
      {
        _id: embaixadorId,
        userId: userIdDoEmbaixador,
        nome: 'Ana Lima',
        email: 'ana@ex.com',
        tipo: extra.tipo || 'remunerado',
        comissaoPercent: 10,
        codigo: extra.codigo,
        couponId,
        status: extra.status || 'ativo',
        criadoEm: dias(100),
      },
    ],
    users: [],
    coupon_redemptions: [],
    embaixador_vendas: [],
    embaixador_indicacoes: [],
  })
  return { db, embaixadorId: String(embaixadorId), userIdDoEmbaixador, couponId }
}

function pedido(campos: Record<string, any>) {
  return {
    _id: new ObjectId(),
    type: 'material',
    status: 'approved',
    amount: 104.99,
    baseAmount: 100,
    feeAmount: 4.99,
    paidAt: new Date(),
    metadata: { itemTitle: 'Caderno de APG' },
    payerName: 'Bruno Costa',
    payerEmail: 'bruno@ex.com',
    ...campos,
  } as any
}

describe('venda com o cupom do embaixador', () => {
  it('é dele, com a comissão sobre a nossa parte e sem a taxa do Mercado Pago', async () => {
    const { db, embaixadorId, couponId } = cenario({ codigo: 'ANACUPOM' })
    const p = pedido({ metadata: { itemTitle: 'Plus+ anual', couponId } })
    expect(await registrarVendaDoPedido(db, p)).toBe('registrada')
    const venda = db.dados.embaixador_vendas[0]
    expect(venda.embaixadorId).toBe(embaixadorId)
    expect(venda.origem).toBe('cupom')
    expect(venda.valor).toBe(100)
    expect(venda.valorSocio).toBe(30)
    expect(venda.comissao).toBe(7)
    expect(venda.produto).toBe('Plus+ anual')
  })

  it('acha o cupom pelo resgate quando o pedido não o traz no metadata', async () => {
    const { db, couponId } = cenario({ codigo: 'ANARESGATE' })
    const p = pedido({})
    db.dados.coupon_redemptions.push({ orderId: String(p._id), couponId, status: 'approved' })
    expect(await registrarVendaDoPedido(db, p)).toBe('registrada')
  })

  it('não registra duas vezes o mesmo pedido', async () => {
    const { db, couponId } = cenario({ codigo: 'ANADUAS' })
    const p = pedido({ metadata: { couponId } })
    await registrarVendaDoPedido(db, p)
    expect(await registrarVendaDoPedido(db, p)).toBe('ja_existia')
    expect(db.dados.embaixador_vendas).toHaveLength(1)
  })

  it('a compra do próprio embaixador com o próprio cupom não conta', async () => {
    const { db, couponId, userIdDoEmbaixador } = cenario({ codigo: 'ANAPROPRIA' })
    expect(await registrarVendaDoPedido(db, pedido({ userId: userIdDoEmbaixador, metadata: { couponId } }))).toBe('ignorada')
  })

  it('embaixador pausado não ganha venda nova', async () => {
    const { db, couponId } = cenario({ codigo: 'ANAPAUSA', status: 'pausado' })
    expect(await registrarVendaDoPedido(db, pedido({ metadata: { couponId } }))).toBe('ignorada')
  })

  it('não-remunerado conta a venda, com comissão zero', async () => {
    const { db, couponId } = cenario({ codigo: 'ANAGRATIS', tipo: 'nao_remunerado' })
    await registrarVendaDoPedido(db, pedido({ metadata: { couponId } }))
    expect(db.dados.embaixador_vendas[0].comissao).toBe(0)
    expect(db.dados.embaixador_vendas[0].remunerado).toBe(false)
  })

  it('doação, rifa e monitoria não são produto e ficam de fora', async () => {
    const { db, couponId } = cenario({ codigo: 'ANATIPOS' })
    for (const type of ['donation', 'raffle', 'monitoria', 'physical']) {
      expect(await registrarVendaDoPedido(db, pedido({ type, metadata: { couponId } }))).toBe('ignorada')
    }
  })
})

describe('venda de quem chegou pelo link', () => {
  it('é do embaixador que indicou, dentro da janela', async () => {
    const { db, embaixadorId } = cenario({ codigo: 'ANALINK' })
    const comprador = new ObjectId()
    db.dados.users.push({ _id: comprador, embaixadorIndicacao: { embaixadorId, codigo: 'ANALINK', em: dias(10) } })
    expect(await registrarVendaDoPedido(db, pedido({ userId: String(comprador) }))).toBe('registrada')
    expect(db.dados.embaixador_vendas[0].origem).toBe('link')
  })

  it('fora da janela (365 dias por padrão) já não é dele', async () => {
    const { db, embaixadorId } = cenario({ codigo: 'ANAVELHO' })
    const comprador = new ObjectId()
    db.dados.users.push({ _id: comprador, embaixadorIndicacao: { embaixadorId, codigo: 'ANAVELHO', em: dias(400) } })
    expect(await registrarVendaDoPedido(db, pedido({ userId: String(comprador) }))).toBe('ignorada')
  })

  it('renovação de assinatura só conta se o programa comissionar renovações', async () => {
    const { db, embaixadorId } = cenario({ codigo: 'ANARENOVA' })
    const comprador = new ObjectId()
    db.dados.users.push({ _id: comprador, embaixadorIndicacao: { embaixadorId, codigo: 'ANARENOVA', em: dias(10) } })
    expect(await registrarVendaDoPedido(db, pedido({ type: 'subscription', userId: String(comprador) }))).toBe('ignorada')
  })
})

describe('estorno', () => {
  it('tira a venda da conta', async () => {
    const { db, couponId } = cenario({ codigo: 'ANAESTORNO' })
    const p = pedido({ metadata: { couponId } })
    await registrarVendaDoPedido(db, p)
    await estornarVendaDoPedido(db, String(p._id), 'refunded')
    expect(db.dados.embaixador_vendas[0].status).toBe('estornada')
  })
})

describe('indicação no cadastro', () => {
  it('prende a conta nova ao embaixador do cookie', async () => {
    const { db, embaixadorId } = cenario({ codigo: 'ANAINDICA' })
    const novo = new ObjectId()
    db.dados.users.push({ _id: novo, email: 'nova@ex.com' })
    await vincularIndicacaoNoCadastro(db, 'anaindica', { userId: String(novo), nome: 'Carla Dias', email: 'nova@ex.com' })
    expect(db.dados.users[0].embaixadorIndicacao.embaixadorId).toBe(embaixadorId)
    expect(db.dados.embaixador_indicacoes).toHaveLength(1)
    expect(db.dados.embaixador_indicacoes[0].nome).toBe('Carla Dias')
  })

  it('ninguém indica a si mesmo', async () => {
    const { db } = cenario({ codigo: 'ANAMESMA' })
    const novo = new ObjectId()
    db.dados.users.push({ _id: novo, email: 'ana@ex.com' })
    await vincularIndicacaoNoCadastro(db, 'ANAMESMA', { userId: String(novo), nome: 'Ana', email: 'ANA@ex.com' })
    expect(db.dados.embaixador_indicacoes).toHaveLength(0)
  })

  it('código desconhecido ou de embaixador encerrado não faz nada', async () => {
    const { db } = cenario({ codigo: 'ANAFORA', status: 'encerrado' })
    const novo = new ObjectId()
    db.dados.users.push({ _id: novo })
    await vincularIndicacaoNoCadastro(db, 'ANAFORA', { userId: String(novo), nome: 'X', email: 'x@ex.com' })
    await vincularIndicacaoNoCadastro(db, 'NAOEXISTE', { userId: String(novo), nome: 'X', email: 'x@ex.com' })
    expect(db.dados.embaixador_indicacoes).toHaveLength(0)
  })
})
