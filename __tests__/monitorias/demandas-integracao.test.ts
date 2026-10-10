/**
 * Pedidos de monitoria contra um MongoDB DE VERDADE: publicar, limites,
 * avisos por matéria, responder (inclusive dois cliques ao mesmo tempo),
 * teto de respostas e o fechamento quando a aula é confirmada.
 *
 * Opcional (o CI não tem Mongo):
 *   MONITORIAS_MONGO_TESTE=mongodb://127.0.0.1:27999/ npx vitest run __tests__/monitorias/demandas-integracao.test.ts
 */
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { MongoClient, ObjectId, type Db } from 'mongodb'

const URI = process.env.MONITORIAS_MONGO_TESTE

const avisos = vi.hoisted(() => ({ lista: [] as Array<{ userId: string; titulo: string; email: boolean }> }))

vi.mock('@/lib/mongodb', async () => {
  const { MongoClient: Cliente } = await import('mongodb')
  const cliente = new Cliente(process.env.MONITORIAS_MONGO_TESTE || 'mongodb://127.0.0.1:1/')
  const conectado = process.env.MONITORIAS_MONGO_TESTE ? cliente.connect() : Promise.resolve(cliente)
  return { default: conectado, getDb: async () => (await conectado).db('monitorias-demandas-teste') }
})
vi.mock('@/lib/monitorias/avisos', () => ({
  avisar: async (lista: Array<{ userId: string; titulo: string; email?: unknown }>) => {
    avisos.lista.push(...lista.map((a) => ({ userId: a.userId, titulo: a.titulo, email: !!a.email })))
  },
  avisarEquipe: async () => {},
  enviarCodigoPorEmail: async () => {},
}))
vi.mock('@/lib/meta-capi', () => ({ sendMetaCapiEvent: async () => {} }))

const suite = URI ? describe : describe.skip

suite('pedidos de monitoria (Mongo real)', () => {
  let db: Db
  let cliente: MongoClient
  const ALUNO = new ObjectId()
  const MON1 = new ObjectId()
  const MON2 = new ObjectId()
  const OUTRA = new ObjectId()
  const TUT1 = new ObjectId()
  const TUT2 = new ObjectId()
  const TUT3 = new ObjectId()
  const AN1 = new ObjectId()
  const AN2 = new ObjectId()
  const AN3 = new ObjectId()
  const entrada = { materia: 'fisiologia', assunto: 'ECG', pessoas: 1, valorPorPessoaCentavos: 4000, duracaoMin: 60, quando: 'esta_semana' as const, periodos: ['noite' as const] }

  beforeEach(async () => {
    if (!cliente) {
      cliente = await new MongoClient(URI!).connect()
      db = cliente.db('monitorias-demandas-teste')
    }
    await db.dropDatabase()
    await db.collection('monitorias_reservas').createIndex({ 'demanda.id': 1, tutorId: 1 }, { unique: true, partialFilterExpression: { 'demanda.id': { $exists: true } } })
    await db.collection('users').insertMany([
      { _id: ALUNO, name: 'Bruno Lima', email: 'b@t.dev', cpf: '11144477735' },
      { _id: MON1, name: 'Ana Souza', email: 'a@t.dev', cpf: '52998224725' },
      { _id: MON2, name: 'Caio Reis', email: 'c@t.dev', cpf: '39053344705' },
      { _id: OUTRA, name: 'Duda Melo', email: 'd@t.dev', cpf: '86288366757' },
    ] as any[])
    const tutor = (id: ObjectId, userId: ObjectId, nome: string) => ({ _id: id, userId: String(userId), nome, status: 'ativo', stats: { nota: 0, avaliacoes: 0 } })
    await db.collection('monitorias_tutores').insertMany([tutor(TUT1, MON1, 'Ana Souza'), tutor(TUT2, MON2, 'Caio Reis'), tutor(TUT3, OUTRA, 'Duda Melo')] as any[])
    const anuncio = (id: ObjectId, tutorId: ObjectId, userId: ObjectId, materia: string, grupo = { ativo: false, maxAlunos: 1 }) => ({
      _id: id, tutorId: String(tutorId), userId: String(userId), titulo: `${materia} com ${userId}`, materia, status: 'publicado', grupo, materiais: [],
    })
    await db.collection('monitorias_anuncios').insertMany([
      anuncio(AN1, TUT1, MON1, 'Fisiologia'),
      anuncio(AN2, TUT2, MON2, 'FISIOLOGIA', { ativo: true, maxAlunos: 4 }),
      anuncio(AN3, TUT3, OUTRA, 'Anatomia'),
    ] as any[])
    avisos.lista = []
  })

  afterAll(async () => {
    await cliente?.close()
  })

  const usuario = async (id: ObjectId) => (await import('@/lib/monitorias/servidor')).carregarUsuario(String(id)).then((u) => u!)

  it('publicar avisa só os monitores da matéria (sem ligar para maiúscula) e o e-mail é no máximo 1 por dia', async () => {
    const { criarDemanda } = await import('@/lib/monitorias/demandas')
    const { demanda, avisados } = await criarDemanda(await usuario(ALUNO), entrada)
    expect(demanda.materia).toBe('Fisiologia')
    expect(demanda.materiaChave).toBe('fisiologia')
    expect(avisados).toBe(2)
    expect(avisos.lista.map((a) => a.userId).sort()).toEqual([String(MON1), String(MON2)].sort())
    expect(avisos.lista.every((a) => a.email)).toBe(true)
    // Outro pedido da mesma matéria no mesmo dia (de outra pessoa): sino sim, e-mail não.
    avisos.lista = []
    await criarDemanda(await usuario(OUTRA), { ...entrada, assunto: 'Renal' })
    expect(avisos.lista).toHaveLength(2)
    expect(avisos.lista.some((a) => a.email)).toBe(false)
  })

  it('limites: um pedido aberto por matéria e no máximo 3 abertos', async () => {
    const { criarDemanda } = await import('@/lib/monitorias/demandas')
    const aluno = await usuario(ALUNO)
    await criarDemanda(aluno, entrada)
    await expect(criarDemanda(aluno, { ...entrada, materia: 'Fisiologia' })).rejects.toMatchObject({ status: 409 })
    await criarDemanda(aluno, { ...entrada, materia: 'Anatomia' })
    await criarDemanda(aluno, { ...entrada, materia: 'Bioquímica' })
    await expect(criarDemanda(aluno, { ...entrada, materia: 'Histologia' })).rejects.toMatchObject({ status: 429 })
  })

  it('responder abre uma negociação com a cópia do pedido e avisa o aluno', async () => {
    const { criarDemanda, responderDemanda } = await import('@/lib/monitorias/demandas')
    const { demanda } = await criarDemanda(await usuario(ALUNO), entrada)
    avisos.lista = []
    const reserva = await responderDemanda({ demandaId: String(demanda._id), anuncioId: String(AN1), monitor: await usuario(MON1), mensagem: 'Oi! Posso te ajudar.' })
    const salva = await db.collection('monitorias_reservas').findOne({ _id: reserva._id as ObjectId })
    expect(salva).toMatchObject({ origem: 'negociacao', status: 'solicitada', solicitanteId: String(ALUNO), tutorUserId: String(MON1) })
    expect(salva!.demanda).toMatchObject({ id: String(demanda._id), materia: 'Fisiologia', valorPorPessoaCentavos: 4000 })
    const msgs = await db.collection('monitorias_mensagens').find({ reservaId: String(reserva._id) }).sort({ createdAt: 1 }).toArray()
    expect(msgs.map((m) => m.tipo)).toEqual(['sistema', 'texto'])
    expect(avisos.lista).toEqual([expect.objectContaining({ userId: String(ALUNO), email: true })])
    expect((await db.collection('monitorias_demandas').findOne({ _id: demanda._id as ObjectId }))!.respostas).toBe(1)
  })

  it('dois cliques ao mesmo tempo do mesmo monitor: uma resposta só', async () => {
    const { criarDemanda, responderDemanda } = await import('@/lib/monitorias/demandas')
    const { demanda } = await criarDemanda(await usuario(ALUNO), entrada)
    const mon = await usuario(MON1)
    const r = await Promise.allSettled(
      [1, 2, 3].map(() => responderDemanda({ demandaId: String(demanda._id), anuncioId: String(AN1), monitor: mon, mensagem: 'Oi! Posso ajudar.' })),
    )
    expect(r.filter((x) => x.status === 'fulfilled')).toHaveLength(1)
    expect(r.filter((x) => x.status === 'rejected').every((x) => (x as PromiseRejectedResult).reason.status === 409)).toBe(true)
    expect(await db.collection('monitorias_reservas').countDocuments({ 'demanda.id': String(demanda._id) })).toBe(1)
    expect((await db.collection('monitorias_demandas').findOne({ _id: demanda._id as ObjectId }))!.respostas).toBe(1)
  })

  it('recusa: grupo maior que o anúncio, anúncio de outra pessoa, o próprio pedido, pedido encerrado e teto de respostas', async () => {
    const { criarDemanda, responderDemanda, encerrarDemanda } = await import('@/lib/monitorias/demandas')
    const { demanda: grupo } = await criarDemanda(await usuario(ALUNO), { ...entrada, pessoas: 3 })
    const id = String(grupo._id)
    await expect(responderDemanda({ demandaId: id, anuncioId: String(AN1), monitor: await usuario(MON1), mensagem: 'Oi! Posso ajudar.' })).rejects.toMatchObject({ status: 400 })
    await expect(responderDemanda({ demandaId: id, anuncioId: String(AN1), monitor: await usuario(MON2), mensagem: 'Oi! Posso ajudar.' })).rejects.toMatchObject({ status: 400 })
    await responderDemanda({ demandaId: id, anuncioId: String(AN2), monitor: await usuario(MON2), mensagem: 'Oi! Posso ajudar.' })

    // A própria pessoa (mesmo CPF em outra conta) não responde o próprio pedido.
    const { demanda: deMonitora } = await criarDemanda(await usuario(MON1), { ...entrada, materia: 'Anatomia' })
    await db.collection('users').updateOne({ _id: OUTRA }, { $set: { cpf: '52998224725' } })
    await expect(responderDemanda({ demandaId: String(deMonitora._id), anuncioId: String(AN3), monitor: await usuario(OUTRA), mensagem: 'Oi! Posso ajudar.' })).rejects.toMatchObject({ status: 400 })

    await encerrarDemanda(String(ALUNO), id)
    await expect(responderDemanda({ demandaId: id, anuncioId: String(AN1), monitor: await usuario(MON1), mensagem: 'Oi! Posso ajudar.' })).rejects.toMatchObject({ status: 404 })
    await expect(encerrarDemanda(String(MON1), String(deMonitora._id).replace(/./, 'f'))).rejects.toMatchObject({ status: 404 })

    const { demanda: cheia } = await criarDemanda(await usuario(ALUNO), { ...entrada, materia: 'Patologia' })
    await db.collection('monitorias_demandas').updateOne({ _id: cheia._id as ObjectId }, { $set: { respostas: 8 } })
    await expect(responderDemanda({ demandaId: String(cheia._id), anuncioId: String(AN1), monitor: await usuario(MON1), mensagem: 'Oi! Posso ajudar.' })).rejects.toMatchObject({ status: 409 })
  })

  it('aula confirmada: o pedido sai do mural e os outros monitores ficam sabendo', async () => {
    const { criarDemanda, responderDemanda, marcarDemandaAtendida } = await import('@/lib/monitorias/demandas')
    const { demanda } = await criarDemanda(await usuario(ALUNO), entrada)
    const r1 = await responderDemanda({ demandaId: String(demanda._id), anuncioId: String(AN1), monitor: await usuario(MON1), mensagem: 'Oi! Posso ajudar.' })
    await responderDemanda({ demandaId: String(demanda._id), anuncioId: String(AN2), monitor: await usuario(MON2), mensagem: 'Oi! Posso ajudar.' })
    avisos.lista = []
    await marcarDemandaAtendida(r1)
    await marcarDemandaAtendida(r1) // repetido: nada muda, ninguém é avisado de novo
    const d = await db.collection('monitorias_demandas').findOne({ _id: demanda._id as ObjectId })
    expect(d).toMatchObject({ status: 'atendida', atendidaPor: String(r1._id) })
    expect(avisos.lista).toEqual([expect.objectContaining({ userId: String(MON2), titulo: 'Pedido fechado com outro monitor' })])
  })
})
