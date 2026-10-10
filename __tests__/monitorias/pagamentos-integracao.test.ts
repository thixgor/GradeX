/**
 * Pagamentos das monitorias contra um MongoDB DE VERDADE e um Mercado Pago
 * falso: cobrança duplicada, aprovação pela metade, aviso repetido, PIX
 * atrasado, recusa e pagamento em dobro do mesmo assento.
 *
 * Opcional (o CI não tem Mongo): roda só com a variável apontando para um
 * banco descartável, por exemplo um mongodb-memory-server local:
 *
 *   MONITORIAS_MONGO_TESTE=mongodb://127.0.0.1:27999/ npx vitest run __tests__/monitorias/pagamentos-integracao.test.ts
 */
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { MongoClient, ObjectId, type Db } from 'mongodb'

const URI = process.env.MONITORIAS_MONGO_TESTE

// ─── Dublês: banco descartável, Mercado Pago falso, avisos contados ─────
const mp = vi.hoisted(() => ({
  criados: 0,
  reembolsos: [] as Array<{ id: string; chave?: string }>,
  falharReembolso: false,
  proximoId: 1000,
}))
const avisos = vi.hoisted(() => ({ lista: [] as Array<{ userId: string; titulo: string }> }))

vi.mock('@/lib/mongodb', async () => {
  const { MongoClient: Cliente } = await import('mongodb')
  const cliente = new Cliente(process.env.MONITORIAS_MONGO_TESTE || 'mongodb://127.0.0.1:1/')
  const conectado = process.env.MONITORIAS_MONGO_TESTE ? cliente.connect() : Promise.resolve(cliente)
  return { default: conectado, getDb: async () => (await conectado).db('monitorias-pagamentos-teste') }
})
vi.mock('@/lib/payments', () => ({
  deriveIdempotencyKey: (s: string) => `idem-${s}`,
  getPaymentProvider: () => ({
    async createPayment(input: { amount: number }) {
      mp.criados++
      await new Promise((r) => setTimeout(r, 30))
      return { providerOrderId: String(mp.proximoId++), status: 'pending', amount: input.amount, currency: 'BRL', pix: { qrCode: 'pix-copia-e-cola', qrCodeBase64: 'AAAA' } }
    },
    async refundPayment(id: string, opts?: { idempotencyKey?: string }) {
      if (mp.falharReembolso) throw new Error('MP fora do ar')
      // Igual ao MP: a mesma chave não devolve duas vezes.
      if (!mp.reembolsos.some((r) => r.chave && r.chave === opts?.idempotencyKey)) mp.reembolsos.push({ id, chave: opts?.idempotencyKey })
    },
    async getPayment() {
      throw new Error('não usado')
    },
  }),
}))
vi.mock('@/lib/monitorias/avisos', () => ({
  avisar: async (lista: Array<{ userId: string; titulo: string }>) => {
    avisos.lista.push(...lista.map((a) => ({ userId: a.userId, titulo: a.titulo })))
  },
  enviarCodigoPorEmail: async () => {},
}))
vi.mock('@/lib/meta-capi', () => ({ sendMetaCapiEvent: async () => {} }))

const suite = URI ? describe : describe.skip

suite('pagamentos das monitorias (Mongo real, MP falso)', () => {
  let db: Db
  let cliente: MongoClient
  const TUTOR = new ObjectId()
  const ANUNCIO = new ObjectId()

  beforeEach(async () => {
    if (!cliente) {
      cliente = await new MongoClient(URI!).connect()
      db = cliente.db('monitorias-pagamentos-teste')
    }
    await db.dropDatabase()
    await db.collection('monitorias_repasses').createIndex({ participacaoId: 1 }, { unique: true })
    await db.collection('monitorias_bloqueios').createIndex({ tutorId: 1, inicioBloco: 1 }, { unique: true })
    await db.collection('payment_orders').createIndex({ idempotencyKey: 1 }, { unique: true, sparse: true })
    await db.collection('monitorias_tutores').insertOne({ _id: TUTOR, userId: 'monitor-1', disponibilidade: { semanal: [], diasBloqueados: [], intervaloMin: 0 } } as any)
    await db.collection('monitorias_anuncios').insertOne({ _id: ANUNCIO, stats: { reservas: 0 } } as any)
    mp.criados = 0
    mp.reembolsos = []
    mp.falharReembolso = false
    avisos.lista = []
  })

  afterAll(async () => {
    await cliente?.close()
  })

  /** Reserva aguardando pagamento, com o horário segurado e N assentos. */
  async function cenario(vagas = 1, prazoMin = 60) {
    const { blocosDaAula } = await import('@/lib/monitorias/agenda')
    const agora = Date.now()
    const inicio = new Date(Math.ceil((agora + 3 * 24 * 3_600_000) / 1_800_000) * 1_800_000)
    const reserva = {
      _id: new ObjectId(),
      anuncioId: String(ANUNCIO),
      anuncioTitulo: 'Fisiologia Cardiovascular',
      tutorId: String(TUTOR),
      tutorUserId: 'monitor-1',
      solicitanteId: 'aluno-0',
      origem: 'direto',
      status: 'aguardando_pagamento',
      proposta: { inicio, duracaoMin: 60, vagas, conteudos: ['ECG'], gratis: false },
      inicio,
      fim: new Date(inicio.getTime() + 3_600_000),
      prazoPagamento: new Date(agora + prazoMin * 60_000),
      versao: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.collection('monitorias_reservas').insertOne(reserva as any)
    await db.collection('monitorias_bloqueios').insertMany(
      blocosDaAula(inicio, 60, 0).map((b) => ({ tutorId: String(TUTOR), inicioBloco: b, reservaId: String(reserva._id), tipo: 'hold', expiraEm: new Date(agora + 3_600_000) })),
    )
    const assentos = []
    for (let i = 0; i < vagas; i++) {
      const p = { _id: new ObjectId(), reservaId: String(reserva._id), alunoId: `aluno-${i}`, alunoNome: `Aluno ${i}`, tutorId: String(TUTOR), status: 'aguardando_pagamento', valorCentavos: 4000, reembolsos: [], createdAt: new Date(), updatedAt: new Date() }
      await db.collection('monitorias_participacoes').insertOne(p as any)
      assentos.push(p)
    }
    return { reserva, assentos }
  }

  /** Pedido PIX "gerado" para o assento (como o checkout deixa). */
  async function pedido(part: { _id: ObjectId; alunoId: string }, status = 'pending') {
    const providerPaymentId = String(mp.proximoId++)
    const o = { userId: part.alunoId, provider: 'mercado_pago', type: 'monitoria', refId: String(part._id), amount: 40.4, baseAmount: 40, currency: 'BRL', status, providerPaymentId, idempotencyKey: `k-${providerPaymentId}`, expiresAt: new Date(Date.now() + 30 * 60_000), pix: { qrCode: 'x', qrCodeBase64: 'y' }, createdAt: new Date(), updatedAt: new Date() }
    const r = await db.collection('payment_orders').insertOne(o as any)
    await db.collection('monitorias_participacoes').updateOne({ _id: part._id }, { $set: { paymentOrderId: String(r.insertedId) } })
    return { orderId: String(r.insertedId), providerPaymentId }
  }

  const aprovado = (providerPaymentId: string) => ({ providerOrderId: providerPaymentId, status: 'approved' as const, amount: 40.4, currency: 'BRL', paidAt: new Date() })
  const assento = (id: ObjectId) => db.collection('monitorias_participacoes').findOne({ _id: id })
  const reservaAtual = (id: ObjectId) => db.collection('monitorias_reservas').findOne({ _id: id })
  const aluno = (i: number) => ({ _id: `aluno-${i}`, email: `aluno${i}@teste.dev`, name: `Aluno ${i}`, fullName: `Aluno ${i}` }) as any

  it('1. quatro cliques em "pagar" ao mesmo tempo geram UM PIX só', async () => {
    const { criarCheckoutPix } = await import('@/lib/monitorias/pagamento')
    const { reserva } = await cenario()
    const entrada = { reservaId: String(reserva._id), aluno: aluno(0), ip: '1.1.1.1' }
    const cliques = await Promise.allSettled([1, 2, 3, 4].map(() => criarCheckoutPix(entrada)))
    expect(mp.criados).toBe(1)
    const vencedores = cliques.filter((x) => x.status === 'fulfilled').map((x) => (x as PromiseFulfilledResult<any>).value.orderId)
    expect(new Set(vencedores).size).toBe(1)
    const vivos = await db.collection('payment_orders').countDocuments({ status: { $in: ['pending', 'in_process'] } })
    expect(vivos).toBe(1)
  })

  it('3. recarregar a página reaproveita o mesmo PIX (nenhuma transação nova)', async () => {
    const { criarCheckoutPix } = await import('@/lib/monitorias/pagamento')
    const { reserva } = await cenario()
    const entrada = { reservaId: String(reserva._id), aluno: aluno(0), ip: '1.1.1.1' }
    const um = await criarCheckoutPix(entrada)
    const dois = await criarCheckoutPix(entrada)
    expect(dois.orderId).toBe(um.orderId)
    expect(mp.criados).toBe(1)
  })

  it('2. aprovado no MP, função caiu antes do assento: aviso repetido termina a aprovação', async () => {
    const { applyPaymentResult } = await import('@/lib/payments/effects')
    const { reserva, assentos } = await cenario()
    const { orderId, providerPaymentId } = await pedido(assentos[0])
    // Estado de quem caiu no meio: pedido "approved", assento ainda esperando.
    await db.collection('payment_orders').updateOne({ _id: new ObjectId(orderId) }, { $set: { status: 'approved', paidAt: new Date() } })
    await applyPaymentResult(orderId, aprovado(providerPaymentId))
    expect((await assento(assentos[0]._id))!.status).toBe('paga')
    expect(await db.collection('monitorias_repasses').countDocuments()).toBe(1)
    expect((await reservaAtual(reserva._id))!.status).toBe('confirmada')
    expect(mp.reembolsos).toHaveLength(0)
  })

  it('2b. mesmo caso, aluno volta ao checkout: conclui a aprovação e NÃO gera outro PIX', async () => {
    const { criarCheckoutPix } = await import('@/lib/monitorias/pagamento')
    const { reserva, assentos } = await cenario()
    const { orderId } = await pedido(assentos[0])
    await db.collection('payment_orders').updateOne({ _id: new ObjectId(orderId) }, { $set: { status: 'approved', paidAt: new Date() } })
    const r = await criarCheckoutPix({ reservaId: String(reserva._id), aluno: aluno(0), ip: '1.1.1.1' })
    expect(r.status).toBe('approved')
    expect(r.orderId).toBe(orderId)
    expect(mp.criados).toBe(0)
    expect((await assento(assentos[0]._id))!.status).toBe('paga')
  })

  it('2c. caiu entre "assento pago" e o repasse: a varredura abre o repasse e confirma, uma vez', async () => {
    const { curarPagamentosDaReserva } = await import('@/lib/monitorias/pagamento')
    const { reserva, assentos } = await cenario()
    const { orderId, providerPaymentId } = await pedido(assentos[0])
    await db.collection('payment_orders').updateOne({ _id: new ObjectId(orderId) }, { $set: { status: 'approved', paidAt: new Date() } })
    await db.collection('monitorias_participacoes').updateOne({ _id: assentos[0]._id }, { $set: { status: 'paga', providerPaymentId, pagoEm: new Date() } })
    await curarPagamentosDaReserva(reserva as any)
    await curarPagamentosDaReserva(reserva as any)
    expect(await db.collection('monitorias_repasses').countDocuments()).toBe(1)
    expect(await db.collection('monitorias_lancamentos').countDocuments()).toBe(2)
    expect((await reservaAtual(reserva._id))!.status).toBe('confirmada')
    expect(avisos.lista.filter((a) => a.titulo.startsWith('Pagamento confirmado'))).toHaveLength(1)
  })

  it('5. duas notificações da mesma transação ao mesmo tempo: efeito aplicado UMA vez', async () => {
    const { applyPaymentResult } = await import('@/lib/payments/effects')
    const { reserva, assentos } = await cenario()
    const { orderId, providerPaymentId } = await pedido(assentos[0])
    await Promise.all([applyPaymentResult(orderId, aprovado(providerPaymentId)), applyPaymentResult(orderId, aprovado(providerPaymentId)), applyPaymentResult(orderId, aprovado(providerPaymentId))])
    await applyPaymentResult(orderId, aprovado(providerPaymentId))
    expect(await db.collection('monitorias_repasses').countDocuments()).toBe(1)
    expect(await db.collection('monitorias_lancamentos').countDocuments()).toBe(2)
    expect(avisos.lista.filter((a) => a.titulo.startsWith('Pagamento confirmado'))).toHaveLength(1)
    expect(avisos.lista.filter((a) => a.titulo.startsWith('Nova venda'))).toHaveLength(1)
    expect((await reservaAtual(reserva._id))!.status).toBe('confirmada')
    expect(await db.collection('monitorias_bloqueios').countDocuments({ reservaId: String(reserva._id), tipo: 'firme' })).toBe(2)
    expect(mp.reembolsos).toHaveLength(0)
  })

  it('4/6. aprovação atrasada (página fechada) dentro do prazo confirma a aula', async () => {
    const { applyPaymentResult } = await import('@/lib/payments/effects')
    const { reserva, assentos } = await cenario()
    const { orderId, providerPaymentId } = await pedido(assentos[0])
    await applyPaymentResult(orderId, { ...aprovado(providerPaymentId), status: 'in_process' as any })
    expect((await assento(assentos[0]._id))!.status).toBe('aguardando_pagamento')
    await applyPaymentResult(orderId, aprovado(providerPaymentId))
    expect((await assento(assentos[0]._id))!.status).toBe('paga')
    expect((await reservaAtual(reserva._id))!.status).toBe('confirmada')
  })

  it('4b. aprovação depois de o horário ser solto: devolvida inteira, sem prender a vaga', async () => {
    const { applyPaymentResult } = await import('@/lib/payments/effects')
    const { reserva, assentos } = await cenario()
    const { orderId, providerPaymentId } = await pedido(assentos[0])
    await db.collection('monitorias_reservas').updateOne({ _id: reserva._id }, { $set: { status: 'expirada' } })
    await db.collection('monitorias_participacoes').updateOne({ _id: assentos[0]._id }, { $set: { status: 'expirada' } })
    await db.collection('monitorias_bloqueios').deleteMany({ reservaId: String(reserva._id) })
    await applyPaymentResult(orderId, aprovado(providerPaymentId))
    const p = await assento(assentos[0]._id)
    expect(p!.status).toBe('reembolsada')
    expect(mp.reembolsos).toEqual([{ id: providerPaymentId, chave: `refund:${assentos[0]._id}:0` }])
    expect((await reservaAtual(reserva._id))!.status).toBe('expirada')
    expect(await db.collection('monitorias_bloqueios').countDocuments()).toBe(0)
  })

  it('7. PIX recusado/expirado: nada cobrado, nova tentativa gera PIX novo; prazo vencido solta o horário', async () => {
    const { applyPaymentResult } = await import('@/lib/payments/effects')
    const { criarCheckoutPix } = await import('@/lib/monitorias/pagamento')
    const { varrer } = await import('@/lib/monitorias/varredura')
    const { reserva, assentos } = await cenario()
    const { orderId, providerPaymentId } = await pedido(assentos[0])
    await applyPaymentResult(orderId, { ...aprovado(providerPaymentId), status: 'rejected' as any })
    expect((await assento(assentos[0]._id))!.status).toBe('aguardando_pagamento')
    const novo = await criarCheckoutPix({ reservaId: String(reserva._id), aluno: aluno(0), ip: '1.1.1.1' })
    expect(novo.orderId).not.toBe(orderId)
    expect(mp.criados).toBe(1)
    // Ninguém pagou e o prazo venceu → a varredura expira e solta o horário.
    await db.collection('monitorias_reservas').updateOne({ _id: reserva._id }, { $set: { prazoPagamento: new Date(Date.now() - 60_000) } })
    await db.collection('payment_orders').updateMany({}, { $unset: { providerPaymentId: '' } })
    await varrer()
    expect((await reservaAtual(reserva._id))!.status).toBe('expirada')
    expect((await assento(assentos[0]._id))!.status).toBe('expirada')
    expect(await db.collection('monitorias_bloqueios').countDocuments()).toBe(0)
    expect(mp.reembolsos).toHaveLength(0)
  })

  it('7b. prazo venceu com o grupo TODO pago (confirmação não rodou): confirma em vez de devolver', async () => {
    const { varrer } = await import('@/lib/monitorias/varredura')
    const { reserva, assentos } = await cenario(2)
    for (const p of assentos) {
      const { orderId, providerPaymentId } = await pedido(p)
      await db.collection('payment_orders').updateOne({ _id: new ObjectId(orderId) }, { $set: { status: 'approved', paidAt: new Date() } })
      await db.collection('monitorias_participacoes').updateOne({ _id: p._id }, { $set: { status: 'paga', providerPaymentId } })
    }
    await db.collection('monitorias_reservas').updateOne({ _id: reserva._id }, { $set: { prazoPagamento: new Date(Date.now() - 60_000) } })
    await varrer()
    expect((await reservaAtual(reserva._id))!.status).toBe('confirmada')
    expect(await db.collection('monitorias_repasses').countDocuments()).toBe(2)
    expect(mp.reembolsos).toHaveLength(0)
  })

  it('8. o mesmo assento pago duas vezes: o segundo volta inteiro e o assento continua pago', async () => {
    const { applyPaymentResult } = await import('@/lib/payments/effects')
    const { assentos } = await cenario()
    const a = await pedido(assentos[0])
    const b = await pedido(assentos[0])
    await applyPaymentResult(a.orderId, aprovado(a.providerPaymentId))
    await applyPaymentResult(b.orderId, aprovado(b.providerPaymentId))
    await applyPaymentResult(b.orderId, aprovado(b.providerPaymentId)) // aviso repetido do segundo
    expect(mp.reembolsos).toEqual([{ id: b.providerPaymentId, chave: `duplicado:${b.orderId}` }])
    // O MP avisa o estorno do SEGUNDO pagamento — não pode derrubar o assento.
    await applyPaymentResult(b.orderId, { ...aprovado(b.providerPaymentId), status: 'refunded' as any })
    const p = await assento(assentos[0]._id)
    expect(p!.status).toBe('paga')
    expect(p!.providerPaymentId).toBe(a.providerPaymentId)
    const rep = await db.collection('monitorias_repasses').findOne({ participacaoId: String(assentos[0]._id) })
    expect(rep!.status).toBe('em_garantia')
    expect(await db.collection('monitorias_repasses').countDocuments()).toBe(1)
  })

  it('8b. devolução do pagamento em dobro falhou: fica registrada e a varredura conclui com a MESMA chave', async () => {
    const { applyPaymentResult } = await import('@/lib/payments/effects')
    const { retomarDevolucoesAvulsas } = await import('@/lib/monitorias/reembolso')
    const { assentos } = await cenario()
    const a = await pedido(assentos[0])
    const b = await pedido(assentos[0])
    await applyPaymentResult(a.orderId, aprovado(a.providerPaymentId))
    mp.falharReembolso = true
    await applyPaymentResult(b.orderId, aprovado(b.providerPaymentId))
    const pendente = await db.collection('monitorias_devolucoes').findOne({ _id: `duplicado:${b.orderId}` as any })
    expect(pendente!.status).toBe('processando')
    mp.falharReembolso = false
    expect(await retomarDevolucoesAvulsas(new Date(Date.now() + 30 * 60_000), 10)).toBe(1)
    expect(mp.reembolsos).toEqual([{ id: b.providerPaymentId, chave: `duplicado:${b.orderId}` }])
    expect((await db.collection('monitorias_devolucoes').findOne({ _id: `duplicado:${b.orderId}` as any }))!.status).toBe('concluida')
  })

  it('8c. dois PIX atrasados do mesmo assento ao mesmo tempo: os DOIS são devolvidos', async () => {
    const { applyPaymentResult } = await import('@/lib/payments/effects')
    const { reserva, assentos } = await cenario()
    const a = await pedido(assentos[0])
    const b = await pedido(assentos[0])
    await db.collection('monitorias_reservas').updateOne({ _id: reserva._id }, { $set: { status: 'expirada' } })
    await db.collection('monitorias_participacoes').updateOne({ _id: assentos[0]._id }, { $set: { status: 'expirada' } })
    await Promise.all([applyPaymentResult(a.orderId, aprovado(a.providerPaymentId)), applyPaymentResult(b.orderId, aprovado(b.providerPaymentId))])
    expect(mp.reembolsos.map((r) => r.id).sort()).toEqual([a.providerPaymentId, b.providerPaymentId].sort())
  })
})
