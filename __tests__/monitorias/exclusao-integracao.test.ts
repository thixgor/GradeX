/**
 * Exclusão de monitoria pelo suporte contra um MongoDB DE VERDADE: os
 * contadores públicos (reservas do anúncio, aulas dadas do monitor) descontam
 * exatamente o que a aula somou, uma vez só, e a restauração devolve.
 *
 *   MONITORIAS_MONGO_TESTE=mongodb://127.0.0.1:27999/ npx vitest run __tests__/monitorias/exclusao-integracao.test.ts
 */
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { MongoClient, ObjectId, type Db } from 'mongodb'

const URI = process.env.MONITORIAS_MONGO_TESTE

vi.mock('@/lib/mongodb', async () => {
  const { MongoClient: Cliente } = await import('mongodb')
  const cliente = new Cliente(process.env.MONITORIAS_MONGO_TESTE || 'mongodb://127.0.0.1:1/')
  const conectado = process.env.MONITORIAS_MONGO_TESTE ? cliente.connect() : Promise.resolve(cliente)
  return { default: conectado, getDb: async () => (await conectado).db('monitorias-exclusao-teste') }
})
vi.mock('@/lib/payments', () => ({ deriveIdempotencyKey: (s: string) => s, getPaymentProvider: () => ({ refundPayment: async () => {}, getPayment: async () => ({}) }) }))
vi.mock('@/lib/monitorias/avisos', () => ({ avisar: async () => {}, avisarEquipe: async () => {}, enviarCodigoPorEmail: async () => {} }))
vi.mock('@vercel/blob', () => ({ del: async () => {}, get: async () => null }))

const suite = URI ? describe : describe.skip

suite('exclusão de monitoria: contadores públicos (Mongo real)', () => {
  let db: Db
  let cliente: MongoClient
  const TUTOR = new ObjectId()
  const ANUNCIO = new ObjectId()

  beforeEach(async () => {
    if (!cliente) {
      cliente = await new MongoClient(URI!).connect()
      db = cliente.db('monitorias-exclusao-teste')
    }
    await db.dropDatabase()
    await db.collection('monitorias_tutores').insertOne({ _id: TUTOR, userId: 'monitor-1', nome: 'Carla', stats: { aulasDadas: 5, nota: 5, avaliacoes: 1 } } as any)
    await db.collection('monitorias_anuncios').insertOne({ _id: ANUNCIO, stats: { reservas: 3, nota: 0, avaliacoes: 0, perguntas: 0 } } as any)
  })
  afterAll(async () => {
    await cliente?.close()
  })

  async function aulaDada(extra: Record<string, unknown> = {}) {
    const fim = new Date(Date.now() - 3 * 86_400_000)
    const reserva = { _id: new ObjectId(), anuncioId: String(ANUNCIO), anuncioTitulo: 'X', tutorId: String(TUTOR), tutorUserId: 'monitor-1', solicitanteId: 'a0', origem: 'direto', status: 'concluida', inicio: new Date(fim.getTime() - 3_600_000), fim, versao: 1, createdAt: new Date(), updatedAt: new Date(), ...extra }
    await db.collection('monitorias_reservas').insertOne(reserva as any)
    await db.collection('monitorias_participacoes').insertOne({ reservaId: String(reserva._id), alunoId: 'a0', alunoNome: 'A', tutorId: String(TUTOR), status: 'concluida', valorCentavos: 5000, pagoEm: new Date(), providerPaymentId: 'p1', reembolsos: [], createdAt: new Date(), updatedAt: new Date() } as any)
    return reserva
  }
  const stats = async () => [
    (await db.collection('monitorias_anuncios').findOne({ _id: ANUNCIO }))!.stats.reservas,
    (await db.collection('monitorias_tutores').findOne({ _id: TUTOR }))!.stats.aulasDadas,
  ]

  it('excluir desconta a reserva e a aula dada; restaurar devolve', async () => {
    const { excluirMonitoriaPeloSuporte, restaurarMonitoria } = await import('@/lib/monitorias/reservas')
    const r = await aulaDada({ contouNaVitrine: true })
    await excluirMonitoriaPeloSuporte({ reserva: r as any, adminId: 'adm', motivo: 'teste' })
    expect(await stats()).toEqual([2, 4])
    const excluida = await db.collection('monitorias_reservas').findOne({ _id: r._id })
    expect(excluida!.contadoresDescontados).toEqual({ reservas: true, aulasDadas: true })
    await restaurarMonitoria(excluida as any)
    expect(await stats()).toEqual([3, 5])
  })

  it('reserva antiga (sem a marca) com pagamento aprovado também desconta; dois cliques descontam uma vez', async () => {
    const { excluirMonitoriaPeloSuporte } = await import('@/lib/monitorias/reservas')
    const r = await aulaDada()
    await Promise.all([1, 2].map(() => excluirMonitoriaPeloSuporte({ reserva: r as any, adminId: 'adm', motivo: 'teste' })))
    expect(await stats()).toEqual([2, 4])
  })

  it('contador nunca fica negativo', async () => {
    const { excluirMonitoriaPeloSuporte } = await import('@/lib/monitorias/reservas')
    await db.collection('monitorias_anuncios').updateOne({ _id: ANUNCIO }, { $set: { 'stats.reservas': 0 } })
    const r = await aulaDada({ contouNaVitrine: true })
    await excluirMonitoriaPeloSuporte({ reserva: r as any, adminId: 'adm', motivo: 'teste' })
    expect(await stats()).toEqual([0, 4])
  })
})
