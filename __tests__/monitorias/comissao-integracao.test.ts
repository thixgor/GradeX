/**
 * Comissão com material oficial, de ponta a ponta contra um MongoDB DE VERDADE
 * e um Mercado Pago falso: checkout com preço oficial do banco, aprovação,
 * repasse 100%/90%, grupo, preço que muda, pagamento repetido, reembolso e
 * material estornado por fora.
 *
 * Opcional (o CI não tem Mongo):
 *   MONITORIAS_MONGO_TESTE=mongodb://127.0.0.1:27999/ npx vitest run __tests__/monitorias/comissao-integracao.test.ts
 */
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { MongoClient, ObjectId, type Db } from 'mongodb'

const URI = process.env.MONITORIAS_MONGO_TESTE

const mp = vi.hoisted(() => ({
  criados: [] as Array<{ amount: number; commissionableAmount?: number }>,
  reembolsos: [] as Array<{ id: string; chave?: string; amountReais?: number }>,
  proximoId: 5000,
  estado: {} as Record<string, any>,
}))

vi.mock('@/lib/mongodb', async () => {
  const { MongoClient: Cliente } = await import('mongodb')
  const cliente = new Cliente(process.env.MONITORIAS_MONGO_TESTE || 'mongodb://127.0.0.1:1/')
  const conectado = process.env.MONITORIAS_MONGO_TESTE ? cliente.connect() : Promise.resolve(cliente)
  return { default: conectado, getDb: async () => (await conectado).db('monitorias-comissao-teste') }
})
vi.mock('@/lib/payments', () => ({
  deriveIdempotencyKey: (s: string) => `idem-${s}`,
  getPaymentProvider: () => ({
    async createPayment(input: { amount: number; commissionableAmount?: number }) {
      mp.criados.push({ amount: input.amount, commissionableAmount: input.commissionableAmount })
      return { providerOrderId: String(mp.proximoId++), status: 'pending', amount: input.amount, currency: 'BRL', pix: { qrCode: 'pix', qrCodeBase64: 'AAAA' } }
    },
    async refundPayment(id: string, opts?: { idempotencyKey?: string; amountReais?: number }) {
      if (!mp.reembolsos.some((r) => r.chave && r.chave === opts?.idempotencyKey)) mp.reembolsos.push({ id, chave: opts?.idempotencyKey, amountReais: opts?.amountReais })
    },
    async getPayment(id: string) {
      if (!mp.estado[id]) throw new Error('MP fora do ar')
      return mp.estado[id]
    },
  }),
}))
vi.mock('@/lib/monitorias/avisos', () => ({ avisar: async () => {}, avisarEquipe: async () => {}, enviarCodigoPorEmail: async () => {} }))
vi.mock('@/lib/meta-capi', () => ({ sendMetaCapiEvent: async () => {} }))

const suite = URI ? describe : describe.skip

suite('comissão com material oficial (Mongo real, MP falso)', () => {
  let db: Db
  let cliente: MongoClient
  const TUTOR = new ObjectId()
  const ANUNCIO = new ObjectId()
  const MATERIAL = new ObjectId()

  beforeEach(async () => {
    if (!cliente) {
      cliente = await new MongoClient(URI!).connect()
      db = cliente.db('monitorias-comissao-teste')
    }
    await db.dropDatabase()
    await db.collection('monitorias_repasses').createIndex({ participacaoId: 1 }, { unique: true })
    await db.collection('payment_orders').createIndex({ idempotencyKey: 1 }, { unique: true, sparse: true })
    await db.collection('monitorias_tutores').insertOne({ _id: TUTOR, userId: 'monitor-1', saldoDevedorCentavos: 0, disponibilidade: { semanal: [], diasBloqueados: [], intervaloMin: 0 } } as any)
    await db.collection('monitorias_anuncios').insertOne({ _id: ANUNCIO, materialOficialId: String(MATERIAL), stats: { reservas: 0 } } as any)
    await material({ price: 10 })
    mp.criados = []
    mp.reembolsos = []
    mp.estado = {}
  })

  afterAll(async () => {
    await cliente?.close()
  })

  async function material(campos: Record<string, unknown>) {
    await db.collection('materials').updateOne(
      { _id: MATERIAL },
      { $set: { title: 'Resumo de Fisiologia Cardiovascular', pricing: 'paid', isHidden: false, ...campos } },
      { upsert: true },
    )
  }

  /** Reserva aguardando pagamento, com um assento por valor pedido (centavos). */
  async function cenario(valores: number[] = [10000]) {
    const agora = Date.now()
    const inicio = new Date(Math.ceil((agora + 3 * 24 * 3_600_000) / 1_800_000) * 1_800_000)
    const reserva = {
      _id: new ObjectId(),
      anuncioId: String(ANUNCIO),
      anuncioTitulo: 'Fisiologia Cardiovascular',
      tutorId: String(TUTOR),
      tutorUserId: 'monitor-1',
      solicitanteId: 'x',
      origem: 'negociacao',
      status: 'aguardando_pagamento',
      proposta: { inicio, duracaoMin: 60, vagas: valores.length, conteudos: [], gratis: false },
      inicio,
      fim: new Date(inicio.getTime() + 3_600_000),
      prazoPagamento: new Date(agora + 60 * 60_000),
      versao: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.collection('monitorias_reservas').insertOne(reserva as any)
    const alunos = []
    for (const valor of valores) {
      const userId = new ObjectId()
      await db.collection('users').insertOne({ _id: userId, name: 'Aluno', email: `a${String(userId)}@teste.dev`, accountType: 'gratuito', role: 'user' } as any)
      const p = { _id: new ObjectId(), reservaId: String(reserva._id), alunoId: String(userId), alunoNome: 'Aluno Teste', tutorId: String(TUTOR), status: 'aguardando_pagamento', valorCentavos: valor, reembolsos: [], createdAt: new Date(), updatedAt: new Date() }
      await db.collection('monitorias_participacoes').insertOne(p as any)
      alunos.push({ part: p, aluno: { _id: userId, email: `a${String(userId)}@teste.dev`, name: 'Aluno', fullName: 'Aluno Teste' } as any })
    }
    return { reserva, alunos }
  }

  async function checkout(reserva: { _id: ObjectId }, aluno: any, incluirMaterial: boolean) {
    const { criarCheckoutPix } = await import('@/lib/monitorias/pagamento')
    return criarCheckoutPix({ reservaId: String(reserva._id), aluno, ip: '1.1.1.1', incluirMaterial })
  }

  /** O MP aprova o pedido (pelo webhook): o valor pago é o do pedido. */
  async function aprovar(orderId: string) {
    const { aoAprovarPagamento } = await import('@/lib/monitorias/pagamento')
    const order = (await db.collection('payment_orders').findOne({ _id: new ObjectId(orderId) }))!
    const pid = String(mp.proximoId++)
    await db.collection('payment_orders').updateOne({ _id: order._id }, { $set: { status: 'approved', providerPaymentId: pid } })
    const result = { providerOrderId: pid, status: 'approved' as const, amount: order.amount, currency: 'BRL', paidAt: new Date(), raw: { external_reference: orderId } }
    await aoAprovarPagamento({ ...(order as any), providerPaymentId: pid }, result)
    return { pid, order, result }
  }

  const repasse = (part: { _id: ObjectId }) => db.collection('monitorias_repasses').findOne({ participacaoId: String(part._id) })
  const compras = (alunoId: string) => db.collection('material_purchases').find({ userId: alunoId }).toArray()

  it('R$ 100 + material R$ 10 (exatamente 10%): PIX cobra os dois, monitor recebe 100%, material liberado', async () => {
    const { reserva, alunos } = await cenario([10000])
    const r = await checkout(reserva, alunos[0].aluno, true)
    expect(r.valorCentavos).toBe(10000)
    expect(r.material).toEqual({ titulo: 'Resumo de Fisiologia Cardiovascular', precoCentavos: 1000 })
    const pedido = (await db.collection('payment_orders').findOne({}))!
    expect(Math.round(pedido.baseAmount * 100)).toBe(11000)
    expect(pedido.metadata.taxaPercent).toBe(0)
    // Sócio do split: só a receita da plataforma (material; taxa zero).
    expect(mp.criados[0].commissionableAmount).toBe(10)
    await aprovar(r.orderId)
    const rep = (await repasse(alunos[0].part))!
    expect(rep).toMatchObject({ brutoCentavos: 10000, taxaPlataformaCentavos: 0, liquidoTutorCentavos: 10000, taxaPercent: 0 })
    const [compra] = await compras(String(alunos[0].aluno._id))
    expect(compra).toMatchObject({ itemId: String(MATERIAL), status: 'completed', origem: 'monitoria', providerOrderId: r.orderId, price: 10 })
  })

  it('R$ 100 + material R$ 9,99: material vendido, mas a taxa de 10% continua', async () => {
    await material({ price: 9.99 })
    const { reserva, alunos } = await cenario([10000])
    const r = await checkout(reserva, alunos[0].aluno, true)
    await aprovar(r.orderId)
    expect(await repasse(alunos[0].part)).toMatchObject({ taxaPlataformaCentavos: 1000, liquidoTutorCentavos: 9000, taxaPercent: 10 })
    expect((await compras(String(alunos[0].aluno._id))).length).toBe(1)
  })

  it('R$ 200 + R$ 20 isenta; R$ 200 + R$ 15 não isenta', async () => {
    await material({ price: 20 })
    const um = await cenario([20000])
    await aprovar((await checkout(um.reserva, um.alunos[0].aluno, true)).orderId)
    expect((await repasse(um.alunos[0].part))!.liquidoTutorCentavos).toBe(20000)
    await material({ price: 15 })
    const dois = await cenario([20000])
    await aprovar((await checkout(dois.reserva, dois.alunos[0].aluno, true)).orderId)
    expect((await repasse(dois.alunos[0].part))!.liquidoTutorCentavos).toBe(18000)
  })

  it('sem o material (o aluno não marcou): 10%, nada vendido', async () => {
    const { reserva, alunos } = await cenario([10000])
    await aprovar((await checkout(reserva, alunos[0].aluno, false)).orderId)
    expect(await repasse(alunos[0].part)).toMatchObject({ liquidoTutorCentavos: 9000, taxaPercent: 10 })
    expect(await compras(String(alunos[0].aluno._id))).toHaveLength(0)
  })

  it('aluno que já tem o material: não compra de novo e não gera isenção', async () => {
    const { ofertaDeMaterial } = await import('@/lib/monitorias/pagamento')
    const { reserva, alunos } = await cenario([10000])
    await db.collection('material_purchases').insertOne({ userId: String(alunos[0].aluno._id), itemType: 'material', itemId: String(MATERIAL), status: 'completed', providerOrderId: 'loja-1' } as any)
    expect((await ofertaDeMaterial(reserva as any, alunos[0].aluno)).jaTem).toBe(true)
    await expect(checkout(reserva, alunos[0].aluno, true)).rejects.toMatchObject({ status: 409 })
    expect(mp.criados).toHaveLength(0)
    await aprovar((await checkout(reserva, alunos[0].aluno, false)).orderId)
    expect((await repasse(alunos[0].part))!.taxaPercent).toBe(10)
  })

  it('material escondido, grátis, inexistente ou sem preço: não dá para incluir (nem isentar)', async () => {
    for (const campos of [{ isHidden: true }, { pricing: 'free' }, { price: 0 }]) {
      await material({ price: 10, isHidden: false, pricing: 'paid', ...campos })
      const { reserva, alunos } = await cenario([10000])
      await expect(checkout(reserva, alunos[0].aluno, true)).rejects.toMatchObject({ status: 409 })
    }
    await db.collection('monitorias_anuncios').updateOne({ _id: ANUNCIO }, { $set: { materialOficialId: String(new ObjectId()) } })
    const { reserva, alunos } = await cenario([10000])
    await expect(checkout(reserva, alunos[0].aluno, true)).rejects.toMatchObject({ status: 409 })
    expect(mp.criados).toHaveLength(0)
  })

  it('preço do material muda DEPOIS do PIX: vale o preço do pedido (nos dois sentidos)', async () => {
    const a = await cenario([10000])
    const r1 = await checkout(a.reserva, a.alunos[0].aluno, true) // R$ 10 → isento
    await material({ price: 5 }) // admin baixa o preço
    await aprovar(r1.orderId)
    expect((await repasse(a.alunos[0].part))!.taxaPercent).toBe(0)

    const b = await cenario([10000])
    const r2 = await checkout(b.reserva, b.alunos[0].aluno, true) // R$ 5 → não isento
    await material({ price: 50 }) // admin sobe o preço
    await aprovar(r2.orderId)
    expect((await repasse(b.alunos[0].part))!.taxaPercent).toBe(10)
  })

  it('metadado adulterado no pedido ("isento" com material barato) é recalculado: 10%', async () => {
    await material({ price: 5 })
    const { reserva, alunos } = await cenario([10000])
    const r = await checkout(reserva, alunos[0].aluno, true)
    await db.collection('payment_orders').updateOne({ _id: new ObjectId(r.orderId) }, { $set: { 'metadata.taxaPercent': 0, 'metadata.materialOficial.isentaTaxa': true } })
    await aprovar(r.orderId)
    expect(await repasse(alunos[0].part)).toMatchObject({ taxaPercent: 10, liquidoTutorCentavos: 9000 })
  })

  it('aviso de aprovação repetido: um repasse, uma entrega do material', async () => {
    const { aoAprovarPagamento } = await import('@/lib/monitorias/pagamento')
    const { reserva, alunos } = await cenario([10000])
    const r = await checkout(reserva, alunos[0].aluno, true)
    const { order, pid, result } = await aprovar(r.orderId)
    await Promise.all([1, 2, 3].map(() => aoAprovarPagamento({ ...(order as any), status: 'approved', providerPaymentId: pid }, result)))
    expect(await db.collection('monitorias_repasses').countDocuments({})).toBe(1)
    expect(await compras(String(alunos[0].aluno._id))).toHaveLength(1)
    expect((await repasse(alunos[0].part))!.liquidoTutorCentavos).toBe(10000)
  })

  it('mudou de ideia e pagou os DOIS PIX: o segundo volta inteiro e não entrega outro material nem muda a comissão', async () => {
    const { reserva, alunos } = await cenario([10000])
    const sem = await checkout(reserva, alunos[0].aluno, false)
    const com = await checkout(reserva, alunos[0].aluno, true)
    expect(com.orderId).not.toBe(sem.orderId) // escolha diferente → PIX novo
    await aprovar(sem.orderId) // pagou primeiro o sem material
    const { pid } = await aprovar(com.orderId) // depois o com material
    expect(mp.reembolsos.map((x) => x.id)).toContain(pid)
    expect(await repasse(alunos[0].part)).toMatchObject({ taxaPercent: 10, liquidoTutorCentavos: 9000 })
    expect(await compras(String(alunos[0].aluno._id))).toHaveLength(0)
  })

  it('grupo: cada assento com o próprio valor e a própria escolha', async () => {
    await material({ price: 5 })
    const { reserva, alunos } = await cenario([4500, 6000, 4500])
    await aprovar((await checkout(reserva, alunos[0].aluno, true)).orderId) // 5 ≥ 4,50 → isento
    await aprovar((await checkout(reserva, alunos[1].aluno, true)).orderId) // 5 < 6 → 10%
    await aprovar((await checkout(reserva, alunos[2].aluno, false)).orderId) // sem material → 10%
    expect(await repasse(alunos[0].part)).toMatchObject({ taxaPercent: 0, liquidoTutorCentavos: 4500 })
    expect(await repasse(alunos[1].part)).toMatchObject({ taxaPercent: 10, liquidoTutorCentavos: 5400 })
    expect(await repasse(alunos[2].part)).toMatchObject({ taxaPercent: 10, liquidoTutorCentavos: 4050 })
  })

  it('reembolso total devolve aula + material e tira o material da conta', async () => {
    const { reembolsarParticipacao } = await import('@/lib/monitorias/reembolso')
    const { reserva, alunos } = await cenario([10000])
    await aprovar((await checkout(reserva, alunos[0].aluno, true)).orderId)
    const res = await reembolsarParticipacao({ participacaoId: String(alunos[0].part._id), valorBaseCentavos: null, motivo: 'Arrependimento', por: 'aluno' })
    expect(res).toEqual({ ok: true, total: true })
    expect(mp.reembolsos[0].amountReais).toBeUndefined() // o PIX inteiro
    expect((await repasse(alunos[0].part))!.status).toBe('estornado')
    expect((await compras(String(alunos[0].aluno._id)))[0].status).toBe('refunded')
  })

  it('reembolso parcial (só da aula) usa o MESMO percentual: isento continua isento', async () => {
    const { reembolsarParticipacao } = await import('@/lib/monitorias/reembolso')
    const { reserva, alunos } = await cenario([10000])
    await aprovar((await checkout(reserva, alunos[0].aluno, true)).orderId)
    await reembolsarParticipacao({ participacaoId: String(alunos[0].part._id), valorBaseCentavos: 4000, motivo: 'Aula encurtada', por: 'suporte' })
    expect(await repasse(alunos[0].part)).toMatchObject({ brutoCentavos: 6000, taxaPlataformaCentavos: 0, liquidoTutorCentavos: 6000 })
    expect((await compras(String(alunos[0].aluno._id)))[0].status).toBe('completed')
  })

  it('estorno/contestação pelo MP: material sai junto', async () => {
    const { aoRevogarPagamento } = await import('@/lib/monitorias/pagamento')
    const { reserva, alunos } = await cenario([10000])
    const r = await checkout(reserva, alunos[0].aluno, true)
    const { order, pid } = await aprovar(r.orderId)
    await aoRevogarPagamento({ ...(order as any), providerPaymentId: pid }, 'charged_back')
    expect((await compras(String(alunos[0].aluno._id)))[0].status).toBe('refunded')
    expect((await repasse(alunos[0].part))!.status).toBe('estornado')
  })

  it('material estornado por fora antes de liberar: a conferência reaplica os 10%', async () => {
    const { conferirComGateway } = await import('@/lib/monitorias/pagamento')
    const { reserva, alunos } = await cenario([10000])
    const r = await checkout(reserva, alunos[0].aluno, true)
    const { pid, order } = await aprovar(r.orderId)
    mp.estado[pid] = { providerOrderId: pid, status: 'approved', amount: order.amount, currency: 'BRL', raw: { external_reference: r.orderId } }
    await db.collection('material_purchases').updateMany({}, { $set: { status: 'refunded' } })
    expect(await conferirComGateway(reserva as any)).toBe(true)
    expect(await repasse(alunos[0].part)).toMatchObject({ taxaPercent: 10, taxaPlataformaCentavos: 1000, liquidoTutorCentavos: 9000 })
  })

  it('repasse antigo (sem taxaPercent) não muda: estorno parcial continua em 10%', async () => {
    const { estornarRepasse } = await import('@/lib/monitorias/financeiro')
    const part = { _id: new ObjectId() }
    await db.collection('monitorias_repasses').insertOne({ participacaoId: String(part._id), reservaId: 'r', tutorId: String(TUTOR), tutorUserId: 'monitor-1', brutoCentavos: 10000, taxaPlataformaCentavos: 1000, liquidoTutorCentavos: 9000, status: 'em_garantia', createdAt: new Date(), updatedAt: new Date() } as any)
    await estornarRepasse({ participacaoId: String(part._id), valorBaseCentavos: 5000, total: false, motivo: 'x', por: 'y', chave: 'k1' })
    expect(await repasse(part)).toMatchObject({ brutoCentavos: 5000, taxaPlataformaCentavos: 500, liquidoTutorCentavos: 4500 })
  })
})
