/**
 * Rodada 6 contra um MongoDB DE VERDADE e um Mercado Pago falso: política v5
 * congelada no assento, cancelamento tardio (50% / 0%) com estorno parcial e
 * liberação do retido depois da garantia, revisão por força maior, assento
 * legado sem mudança, falta do aluno pela sala e pelo botão do monitor, e a
 * disputa automática quando o monitor não entra.
 *
 *   MONITORIAS_MONGO_TESTE=mongodb://127.0.0.1:27999/ npx vitest run __tests__/monitorias/rodada6-integracao.test.ts
 */
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { MongoClient, ObjectId, type Db } from 'mongodb'

const URI = process.env.MONITORIAS_MONGO_TESTE

const mp = vi.hoisted(() => ({
  reembolsos: [] as Array<{ id: string; chave?: string; valor?: number }>,
  proximoId: 7000,
  estado: {} as Record<string, any>,
}))
const avisos = vi.hoisted(() => ({ lista: [] as Array<{ userId: string; titulo: string }> }))

vi.mock('@/lib/mongodb', async () => {
  const { MongoClient: Cliente } = await import('mongodb')
  const cliente = new Cliente(process.env.MONITORIAS_MONGO_TESTE || 'mongodb://127.0.0.1:1/')
  const conectado = process.env.MONITORIAS_MONGO_TESTE ? cliente.connect() : Promise.resolve(cliente)
  return { default: conectado, getDb: async () => (await conectado).db('monitorias-rodada6-teste') }
})
vi.mock('@/lib/payments', () => ({
  deriveIdempotencyKey: (s: string) => `idem-${s}`,
  getPaymentProvider: () => ({
    async createPayment(input: { amount: number }) {
      return { providerOrderId: String(mp.proximoId++), status: 'pending', amount: input.amount, currency: 'BRL', pix: { qrCode: 'x', qrCodeBase64: 'y' } }
    },
    async refundPayment(id: string, opts?: { idempotencyKey?: string; amountReais?: number }) {
      if (!mp.reembolsos.some((r) => r.chave && r.chave === opts?.idempotencyKey)) mp.reembolsos.push({ id, chave: opts?.idempotencyKey, valor: opts?.amountReais })
    },
    async getPayment(id: string) {
      if (!mp.estado[id]) throw new Error('MP fora do ar')
      return mp.estado[id]
    },
  }),
}))
vi.mock('@/lib/monitorias/avisos', () => ({
  avisar: async (lista: Array<{ userId: string; titulo: string }>) => void avisos.lista.push(...lista.map((a) => ({ userId: a.userId, titulo: a.titulo }))),
  avisarEquipe: async (titulo: string) => void avisos.lista.push({ userId: 'equipe', titulo }),
  enviarCodigoPorEmail: async () => {},
}))
vi.mock('@/lib/meta-capi', () => ({ sendMetaCapiEvent: async () => {} }))
vi.mock('@vercel/blob', () => ({ del: async () => {}, get: async () => null, put: async () => ({}) }))
vi.mock('@/lib/monitorias/resumo/disparo', () => ({ dispararProcessador: () => {} }))

const suite = URI ? describe : describe.skip
const H = 3_600_000
const MIN = 60_000

suite('rodada 6: multa, revisão e falta (Mongo real, MP falso)', () => {
  let db: Db
  let cliente: MongoClient
  const TUTOR = new ObjectId()
  const ANUNCIO = new ObjectId()
  const MONITOR = String(new ObjectId())
  const ALUNO = String(new ObjectId())

  beforeEach(async () => {
    if (!cliente) {
      cliente = await new MongoClient(URI!).connect()
      db = cliente.db('monitorias-rodada6-teste')
    }
    await db.dropDatabase()
    await Promise.all([
      db.collection('monitorias_repasses').createIndex({ participacaoId: 1 }, { unique: true }),
      db.collection('monitorias_bloqueios').createIndex({ tutorId: 1, inicioBloco: 1 }, { unique: true }),
      db.collection('payment_orders').createIndex({ idempotencyKey: 1 }, { unique: true, sparse: true }),
      db.collection('monitorias_resumos_adicionais').createIndex({ participacaoId: 1 }, { unique: true }),
    ])
    await db.collection('monitorias_tutores').insertOne({ _id: TUTOR, userId: MONITOR, nome: 'Carla Monitora', strikes: [], status: 'ativo', disponibilidade: { semanal: [], diasBloqueados: [], intervaloMin: 0 } } as any)
    await db.collection('monitorias_anuncios').insertOne({ _id: ANUNCIO, stats: { reservas: 0 } } as any)
    await db.collection('users').insertMany([
      { _id: new ObjectId(MONITOR), name: 'Carla Monitora', email: 'carla@teste.dev' },
      { _id: new ObjectId(ALUNO), name: 'Bruno Aluno', email: 'bruno@teste.dev' },
      { _id: new ObjectId(), name: 'Admin', email: 'admin@teste.dev', role: 'admin' },
    ] as any)
    mp.reembolsos = []
    mp.estado = {}
    avisos.lista = []
  })

  afterAll(async () => {
    await cliente?.close()
  })

  const aluno = { _id: ALUNO, name: 'Bruno Aluno', email: 'bruno@teste.dev' } as any
  const reservaAtual = async (id: ObjectId) => (await db.collection('monitorias_reservas').findOne({ _id: id })) as any
  const assento = async (id: ObjectId) => (await db.collection('monitorias_participacoes').findOne({ _id: id })) as any
  const repasse = async (id: ObjectId) => (await db.collection('monitorias_repasses').findOne({ participacaoId: String(id) })) as any

  /**
   * Aula individual paga pelo caminho real da aprovação (contrato da versão
   * pedida, repasse em garantia), começando daqui a `horas`.
   */
  async function aulaPaga(opcoes: { horas: number; modeloVersao?: string; linkReuniao?: string; comResumo?: boolean }) {
    const { applyPaymentResult } = await import('@/lib/payments/effects')
    const { blocosDaAula } = await import('@/lib/monitorias/agenda')
    const agora = Date.now()
    const inicio = new Date(Math.ceil((agora + opcoes.horas * H) / (30 * MIN)) * 30 * MIN)
    const reserva = {
      _id: new ObjectId(),
      anuncioId: String(ANUNCIO),
      anuncioTitulo: 'Fisiologia Cardiovascular',
      tutorId: String(TUTOR),
      tutorUserId: MONITOR,
      solicitanteId: ALUNO,
      origem: 'direto',
      status: 'aguardando_pagamento',
      proposta: { inicio, duracaoMin: 60, vagas: 1, conteudos: ['ECG'], gratis: false },
      inicio,
      fim: new Date(inicio.getTime() + H),
      prazoPagamento: new Date(agora + Math.min(opcoes.horas * H - 5 * MIN, 60 * MIN)),
      ...(opcoes.linkReuniao ? { linkReuniao: opcoes.linkReuniao } : {}),
      versao: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.collection('monitorias_reservas').insertOne(reserva as any)
    await db.collection('monitorias_bloqueios').insertMany(
      blocosDaAula(inicio, 60, 0).map((b) => ({ tutorId: String(TUTOR), inicioBloco: b, reservaId: String(reserva._id), tipo: 'hold', expiraEm: new Date(agora + H) })),
    )
    const contrato = { _id: new ObjectId(), reservaId: String(reserva._id), status: 'assinado', dados: { modeloVersao: opcoes.modeloVersao ?? '2026.10-v5' } }
    await db.collection('monitorias_contratos').insertOne(contrato as any)
    const part = { _id: new ObjectId(), reservaId: String(reserva._id), alunoId: ALUNO, alunoNome: 'Bruno Aluno', tutorId: String(TUTOR), status: 'aguardando_pagamento', valorCentavos: 4000, contratoId: String(contrato._id), reembolsos: [], createdAt: new Date(), updatedAt: new Date() }
    await db.collection('monitorias_participacoes').insertOne(part as any)
    await db.collection('monitorias_contratos').updateOne({ _id: contrato._id }, { $set: { participacaoId: String(part._id) } })
    const providerPaymentId = String(mp.proximoId++)
    const order = { userId: ALUNO, provider: 'mercado_pago', type: 'monitoria', refId: String(part._id), amount: 40.4, baseAmount: 40, currency: 'BRL', status: 'pending', providerPaymentId, idempotencyKey: `k-${providerPaymentId}`, expiresAt: new Date(agora + 30 * MIN), pix: { qrCode: 'x', qrCodeBase64: 'y' }, createdAt: new Date(), updatedAt: new Date() }
    const r = await db.collection('payment_orders').insertOne(order as any)
    await db.collection('monitorias_participacoes').updateOne({ _id: part._id }, { $set: { paymentOrderId: String(r.insertedId) } })
    await applyPaymentResult(String(r.insertedId), { providerOrderId: providerPaymentId, status: 'approved', amount: 40.4, currency: 'BRL', paidAt: new Date() } as any)
    mp.estado[providerPaymentId] = { providerOrderId: providerPaymentId, status: 'approved', amount: 40.4, raw: { external_reference: String(r.insertedId), transaction_amount_refunded: 0 } }
    if (opcoes.comResumo) {
      await db.collection('monitorias_participacoes').updateOne({ _id: part._id }, { $set: { resumoIA: { precoCentavos: 900, paymentOrderId: String(r.insertedId) } } })
      await db.collection('monitorias_resumos_adicionais').insertOne({ participacaoId: String(part._id), reservaId: String(reserva._id), alunoId: ALUNO, paymentOrderId: String(r.insertedId), precoCentavos: 900, taxaPixCentavos: 9, estimativa: {}, aceite: { versao: 'v', hash: 'h', em: new Date() }, status: 'pago', pagoEm: new Date(), createdAt: new Date(), updatedAt: new Date() } as any)
    }
    return { reserva: await reservaAtual(reserva._id), part: await assento(part._id), providerPaymentId }
  }

  /** Move a aula para o passado (começou há `minAtras` minutos). */
  async function aulaComecouHa(reservaId: ObjectId, minAtras: number, duracaoMin = 60) {
    const inicio = new Date(Date.now() - minAtras * MIN)
    await db.collection('monitorias_reservas').updateOne({ _id: reservaId }, { $set: { inicio, fim: new Date(inicio.getTime() + duracaoMin * MIN), 'proposta.inicio': inicio } })
    return { inicio, fim: new Date(inicio.getTime() + duracaoMin * MIN) }
  }

  async function presenca(reservaId: ObjectId, inicio: Date, entradas: Array<{ quem: 'monitor' | 'aluno'; de: number; ate: number }>) {
    const { pidDe } = await import('@/lib/monitorias/sala/token')
    const t = (m: number) => new Date(inicio.getTime() + m * MIN)
    await db.collection('monitorias_salas').insertOne({
      _id: String(reservaId),
      registro: entradas.map((e, i) => ({ id: `cx${i}`, pid: pidDe(String(reservaId), e.quem === 'monitor' ? MONITOR : ALUNO), papel: e.quem, entrou: t(e.de), ate: t(e.ate), saiu: t(e.ate) })),
      sinais: [],
      participantes: {},
    } as any)
  }

  it('o assento congela a política do contrato no pagamento (v5 marca; v4 fica legado)', async () => {
    const v5 = await aulaPaga({ horas: 72 })
    expect(v5.part.status).toBe('paga')
    expect(v5.part.politica).toBe('v5')
    const v4 = await aulaPaga({ horas: 96, modeloVersao: '2026.10-v4' })
    expect(v4.part.status).toBe('paga')
    expect(v4.part.politica).toBeUndefined()
  })

  it('cancelamento com 5 h (v5): 50% volta no MP, o repasse cai para o retido, o horário volta à agenda e o retido sai depois da garantia', async () => {
    const { cancelar } = await import('@/lib/monitorias/reservas')
    const { varrer } = await import('@/lib/monitorias/varredura')
    const { reserva, part } = await aulaPaga({ horas: 5 })
    expect((await repasse(part._id)).liquidoTutorCentavos).toBe(3600)
    const r = await cancelar({ reserva, ator: aluno, papel: 'organizador', motivo: 'Imprevisto no trabalho' })
    expect(r.resultado).toBe('cancelada')
    expect(r.multa).toMatchObject({ pctDevolvido: 50, devolvidoCentavos: 2000, retidoCentavos: 2000, liquidoMonitorCentavos: 1800 })
    expect(mp.reembolsos).toHaveLength(1)
    expect(mp.reembolsos[0].valor).toBe(20)
    const depois = await assento(part._id)
    expect(depois.status).toBe('cancelada')
    expect(depois.cancelamentoTardio).toMatchObject({ pctDevolvido: 50, devolvidoCentavos: 2000, retidoCentavos: 2000 })
    const rp = await repasse(part._id)
    expect(rp.status).toBe('em_garantia')
    expect(rp.liquidoTutorCentavos).toBe(1800)
    expect((await reservaAtual(reserva._id)).status).toBe('cancelada_aluno')
    expect(await db.collection('monitorias_bloqueios').countDocuments({ reservaId: String(reserva._id) })).toBe(0)
    expect(avisos.lista.some((a) => a.userId === MONITOR && a.titulo.startsWith('Cancelamento em cima da hora'))).toBe(true)
    // Antes da garantia, nada sai; depois (fim + 48 h), o retido é liberado — uma vez.
    expect((await varrer(new Date())).tardiosLiberados).toBe(0)
    const depoisDaGarantia = new Date(reserva.fim.getTime() + 49 * H)
    expect((await varrer(depoisDaGarantia)).tardiosLiberados).toBe(1)
    expect((await repasse(part._id)).status).toBe('liberado')
    expect((await assento(part._id)).cancelamentoTardio.liberadoEm).toBeTruthy()
    expect((await varrer(depoisDaGarantia)).tardiosLiberados).toBe(0)
  })

  it('cancelamento com menos de 2 h (v5): nada volta, o Resumo volta inteiro, o monitor fica com o valor da aula', async () => {
    const { cancelar } = await import('@/lib/monitorias/reservas')
    const { reserva, part } = await aulaPaga({ horas: 1, comResumo: true })
    const r = await cancelar({ reserva, ator: aluno, papel: 'organizador', motivo: 'Esqueci da aula' })
    expect(r.multa).toMatchObject({ pctDevolvido: 0, devolvidoCentavos: 0, retidoCentavos: 4000, liquidoMonitorCentavos: 3600 })
    // O único estorno é o do Resumo (R$ 9,00 + a parte da taxa).
    expect(mp.reembolsos).toHaveLength(1)
    expect(mp.reembolsos[0].chave).toMatch(/^refund:resumo:/)
    expect((await db.collection('monitorias_resumos_adicionais').findOne({ participacaoId: String(part._id) }))!.status).toBe('reembolsado')
    expect((await assento(part._id)).status).toBe('cancelada')
    expect((await repasse(part._id)).liquidoTutorCentavos).toBe(3600)
    expect(avisos.lista.some((a) => a.userId === ALUNO && a.titulo === 'Monitoria cancelada')).toBe(true)
  })

  it('revisão por força maior trava a liberação; "manter" libera, "devolver" estorna o restante', async () => {
    const { cancelar, pedirRevisaoDoCancelamento, decidirRevisaoDoCancelamento } = await import('@/lib/monitorias/reservas')
    const { varrer } = await import('@/lib/monitorias/varredura')
    const um = await aulaPaga({ horas: 1 })
    await cancelar({ reserva: um.reserva, ator: aluno, papel: 'organizador', motivo: 'Fui internado' })
    const ticketId = await pedirRevisaoDoCancelamento({ reserva: await reservaAtual(um.reserva._id), autor: aluno, motivo: 'Fui internado às pressas com apendicite, tenho o atestado.' })
    expect(await db.collection('tickets').countDocuments({ _id: new ObjectId(ticketId) })).toBe(1)
    await expect(pedirRevisaoDoCancelamento({ reserva: await reservaAtual(um.reserva._id), autor: aluno, motivo: 'De novo, o mesmo pedido de revisão.' })).rejects.toMatchObject({ status: 409 })
    const depois = new Date(um.reserva.fim.getTime() + 49 * H)
    expect((await varrer(depois)).tardiosLiberados).toBe(0)
    expect((await repasse(um.part._id)).status).toBe('em_garantia')
    await decidirRevisaoDoCancelamento({ participacaoId: String(um.part._id), decisao: 'manter', nota: 'Sem comprovante.', adminId: 'admin' })
    expect((await varrer(depois)).tardiosLiberados).toBe(1)
    expect((await repasse(um.part._id)).status).toBe('liberado')

    mp.reembolsos = []
    const dois = await aulaPaga({ horas: 5 })
    await cancelar({ reserva: dois.reserva, ator: aluno, papel: 'organizador', motivo: 'Acidente' })
    await pedirRevisaoDoCancelamento({ reserva: await reservaAtual(dois.reserva._id), autor: aluno, motivo: 'Sofri um acidente de carro a caminho, boletim anexado.' })
    const out = await decidirRevisaoDoCancelamento({ participacaoId: String(dois.part._id), decisao: 'devolver', nota: 'Boletim de ocorrência confere.', adminId: 'admin' })
    expect(out.ok).toBe(true)
    expect(mp.reembolsos).toHaveLength(2) // os 50% do cancelamento e o restante
    expect((await assento(dois.part._id)).status).toBe('reembolsada')
    expect((await repasse(dois.part._id)).status).toBe('estornado')
    expect((await varrer(new Date(dois.reserva.fim.getTime() + 49 * H))).tardiosLiberados).toBe(0)
  })

  it('assento legado: a regra antiga continua (arrependimento de 7 dias devolve tudo; fora dele, < 24 h vai ao suporte)', async () => {
    const { cancelar } = await import('@/lib/monitorias/reservas')
    const dentro = await aulaPaga({ horas: 5, modeloVersao: '2026.10-v4' })
    const r1 = await cancelar({ reserva: dentro.reserva, ator: aluno, papel: 'organizador', motivo: 'Desisti da aula' })
    expect(r1.resultado).toBe('reembolsada')
    expect((await assento(dentro.part._id)).cancelamentoTardio).toBeUndefined()
    const fora = await aulaPaga({ horas: 5, modeloVersao: '2026.10-v4' })
    await db.collection('monitorias_participacoes').updateOne({ _id: fora.part._id }, { $set: { pagoEm: new Date(Date.now() - 10 * 24 * H) } })
    const antes = mp.reembolsos.length
    const r2 = await cancelar({ reserva: fora.reserva, ator: aluno, papel: 'organizador', motivo: 'Desisti da aula' })
    expect(r2.resultado).toBe('suporte')
    expect(mp.reembolsos.length).toBe(antes)
    expect((await assento(fora.part._id)).status).toBe('paga')
  })

  it('falta pela sala: monitor esperou e o aluno não entrou → falta registrada, aula realizada, Resumo devolvido (individual)', async () => {
    const { varrer } = await import('@/lib/monitorias/varredura')
    const { reserva, part } = await aulaPaga({ horas: 72, comResumo: true })
    const { inicio } = await aulaComecouHa(reserva._id, 90)
    await presenca(reserva._id, inicio, [{ quem: 'monitor', de: -3, ate: 30 }])
    const rel = await varrer(new Date())
    expect(rel.faltas).toBe(1)
    expect((await reservaAtual(reserva._id)).status).toBe('realizada')
    const p = await assento(part._id)
    expect(p.falta).toMatchObject({ fonte: 'sala', evidencia: { minutosMonitor: 30 } })
    expect(p.status).toBe('paga')
    expect((await db.collection('monitorias_resumos_adicionais').findOne({ participacaoId: String(part._id) }))!.status).toBe('reembolsado')
    expect(avisos.lista.some((a) => a.userId === ALUNO && a.titulo === 'Registramos sua falta na monitoria')).toBe(true)
    expect(avisos.lista.some((a) => a.userId === ALUNO && a.titulo === 'Como foi a monitoria?')).toBe(false)
    // O aluno contesta pelo "Reportar problema": vira disputa com o rótulo da falta.
    const { reportarProblema } = await import('@/lib/monitorias/reservas')
    await reportarProblema({ reserva: await reservaAtual(reserva._id), autor: aluno, papel: 'organizador', motivo: 'Eu entrei pelo celular e a sala não abriu.' })
    const r = await reservaAtual(reserva._id)
    expect(r.status).toBe('em_disputa')
    expect(r.disputa.motivo).toMatch(/^Contestação da falta registrada \(pela sala de aula\)/)
  })

  it('aluno que entra e sai em 2 min não desfaz a falta (o monitor esperou); a evidência guarda os minutos dele', async () => {
    const { varrer } = await import('@/lib/monitorias/varredura')
    const { reserva, part } = await aulaPaga({ horas: 72 })
    const { inicio } = await aulaComecouHa(reserva._id, 90)
    await presenca(reserva._id, inicio, [{ quem: 'monitor', de: 0, ate: 25 }, { quem: 'aluno', de: 3, ate: 5 }])
    expect((await varrer(new Date())).faltas).toBe(1)
    expect((await assento(part._id)).falta).toMatchObject({ fonte: 'sala', evidencia: { minutosMonitor: 25, minutosAluno: 2 } })
  })

  it('monitor que entra e sai em 5 min com o aluno esperando 20: disputa "ficou só 5 min", sem falta do aluno', async () => {
    const { varrer } = await import('@/lib/monitorias/varredura')
    const { reserva, part } = await aulaPaga({ horas: 72 })
    const { inicio } = await aulaComecouHa(reserva._id, 90)
    await presenca(reserva._id, inicio, [{ quem: 'monitor', de: 0, ate: 5 }, { quem: 'aluno', de: 1, ate: 21 }])
    const rel = await varrer(new Date())
    expect(rel.disputasPorFalta).toBe(1)
    expect(rel.faltas).toBe(0)
    const r = await reservaAtual(reserva._id)
    expect(r.status).toBe('em_disputa')
    expect(r.disputa.motivo).toMatch(/^Monitor ficou só 5 min na sala/)
    expect((await assento(part._id)).falta).toBeUndefined()
    expect(avisos.lista.some((a) => a.userId === MONITOR && a.titulo === 'Você ficou pouco tempo na sala da monitoria')).toBe(true)
  })

  it('aluno entrou e o monitor também: nenhuma falta; monitor saiu cedo: nenhuma falta', async () => {
    const { varrer } = await import('@/lib/monitorias/varredura')
    const a = await aulaPaga({ horas: 72 })
    const ja = await aulaComecouHa(a.reserva._id, 90)
    await presenca(a.reserva._id, ja.inicio, [{ quem: 'monitor', de: 0, ate: 55 }, { quem: 'aluno', de: 4, ate: 55 }])
    const b = await aulaPaga({ horas: 100 })
    const jb = await aulaComecouHa(b.reserva._id, 90)
    await presenca(b.reserva._id, jb.inicio, [{ quem: 'monitor', de: 0, ate: 8 }])
    const rel = await varrer(new Date())
    expect(rel.faltas).toBe(0)
    expect((await assento(a.part._id)).falta).toBeUndefined()
    expect((await assento(b.part._id)).falta).toBeUndefined()
  })

  it('botão do monitor (link externo): registra a falta; a sala desmente quem entrou; sem link, exige ter esperado', async () => {
    const { informarFaltaDoAluno } = await import('@/lib/monitorias/reservas')
    const externo = await aulaPaga({ horas: 72, linkReuniao: 'https://meet.google.com/abc-defg-hij' })
    await aulaComecouHa(externo.reserva._id, 10)
    await expect(informarFaltaDoAluno({ reserva: await reservaAtual(externo.reserva._id), papel: 'monitor', monitorId: MONITOR })).rejects.toMatchObject({ status: 409 }) // antes da tolerância
    await aulaComecouHa(externo.reserva._id, 20)
    await expect(informarFaltaDoAluno({ reserva: await reservaAtual(externo.reserva._id), papel: 'organizador', monitorId: ALUNO })).rejects.toMatchObject({ status: 403 })
    const r = await informarFaltaDoAluno({ reserva: await reservaAtual(externo.reserva._id), papel: 'monitor', monitorId: MONITOR, motivo: 'Esperei no Meet e no chat' })
    expect(r.alunoNome).toBe('Bruno Aluno')
    expect((await assento(externo.part._id)).falta).toMatchObject({ fonte: 'monitor', motivo: 'Esperei no Meet e no chat', por: MONITOR })
    await expect(informarFaltaDoAluno({ reserva: await reservaAtual(externo.reserva._id), papel: 'monitor', monitorId: MONITOR })).rejects.toMatchObject({ status: 409 })

    const naSala = await aulaPaga({ horas: 96 })
    const j = await aulaComecouHa(naSala.reserva._id, 25)
    await presenca(naSala.reserva._id, j.inicio, [{ quem: 'monitor', de: 0, ate: 24 }, { quem: 'aluno', de: 22, ate: 24 }])
    await expect(informarFaltaDoAluno({ reserva: await reservaAtual(naSala.reserva._id), papel: 'monitor', monitorId: MONITOR })).rejects.toThrow(/registrou a entrada/)

    const semEspera = await aulaPaga({ horas: 120 })
    const k = await aulaComecouHa(semEspera.reserva._id, 25)
    await presenca(semEspera.reserva._id, k.inicio, [{ quem: 'monitor', de: 20, ate: 24 }])
    await expect(informarFaltaDoAluno({ reserva: await reservaAtual(semEspera.reserva._id), papel: 'monitor', monitorId: MONITOR })).rejects.toThrow(/espere o aluno por 15 minutos/)
  })

  it('monitor não entrou e o aluno esperou 20 min: disputa automática com a evidência, sem strike', async () => {
    const { varrer } = await import('@/lib/monitorias/varredura')
    const { reserva } = await aulaPaga({ horas: 72 })
    const { inicio } = await aulaComecouHa(reserva._id, 90)
    await presenca(reserva._id, inicio, [{ quem: 'aluno', de: -2, ate: 20 }])
    const rel = await varrer(new Date())
    expect(rel.disputasPorFalta).toBe(1)
    const r = await reservaAtual(reserva._id)
    expect(r.status).toBe('em_disputa')
    expect(r.disputa.abertaPor).toBe('sistema')
    expect(r.disputa.motivo).toMatch(/Monitor não entrou na sala/)
    expect(r.ticketId).toBeTruthy()
    expect(avisos.lista.some((a) => a.userId === MONITOR && a.titulo === 'Você não entrou na sala da monitoria')).toBe(true)
    expect((await db.collection('monitorias_tutores').findOne({ _id: TUTOR }))!.strikes).toHaveLength(0)
  })
})
