/**
 * A sala de aula contra um MongoDB DE VERDADE: entrar, sinalizar, trocar de
 * aba, limite de envio, saída, estranho e assento reembolsado. Confere também o
 * que mais importa para o resto das monitorias: a sala nunca mexe na reserva.
 *
 * Opcional (o CI não tem Mongo), igual a `pagamentos-integracao`:
 *
 *   MONITORIAS_MONGO_TESTE=mongodb://127.0.0.1:27999/ npx vitest run __tests__/monitorias/sala-integracao.test.ts
 */
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { MongoClient, ObjectId, type Db } from 'mongodb'

const URI = process.env.MONITORIAS_MONGO_TESTE

const avisos = vi.hoisted(() => ({ lista: [] as Array<{ userId: string; titulo: string }> }))

vi.mock('@/lib/mongodb', async () => {
  const { MongoClient: Cliente } = await import('mongodb')
  const cliente = new Cliente(process.env.MONITORIAS_MONGO_TESTE || 'mongodb://127.0.0.1:1/')
  const conectado = process.env.MONITORIAS_MONGO_TESTE ? cliente.connect() : Promise.resolve(cliente)
  return { default: conectado, getDb: async () => (await conectado).db('monitorias-sala-teste') }
})
vi.mock('@/lib/monitorias/avisos', () => ({
  avisar: async (lista: Array<{ userId: string; titulo: string }>) => {
    avisos.lista.push(...lista.map((a) => ({ userId: a.userId, titulo: a.titulo })))
  },
  avisarEquipe: async () => {},
  enviarCodigoPorEmail: async () => {},
}))

const suite = URI ? describe : describe.skip

suite('sala de aula (Mongo real)', () => {
  let db: Db
  let cliente: MongoClient
  const TUTOR = new ObjectId()
  const MONITOR = String(new ObjectId())
  const ALUNO = String(new ObjectId())
  const ESTRANHO = String(new ObjectId())
  let reservaId = ''
  const agora = new Date()
  const sdp = 'v=0\r\no=- 1 2 IN IP4 127.0.0.1\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n'

  beforeEach(async () => {
    if (!cliente) {
      cliente = await new MongoClient(URI!).connect()
      db = cliente.db('monitorias-sala-teste')
    }
    await db.dropDatabase()
    avisos.lista = []
    await db.collection('monitorias_tutores').insertOne({ _id: TUTOR, userId: MONITOR, nome: 'Carla Mendes' } as any)
    const r = await db.collection('monitorias_reservas').insertOne({
      anuncioId: String(new ObjectId()),
      anuncioTitulo: 'Fisiologia cardíaca',
      tutorId: String(TUTOR),
      tutorUserId: MONITOR,
      solicitanteId: ALUNO,
      origem: 'direto',
      status: 'confirmada',
      aceites: {},
      inicio: new Date(agora.getTime() + 5 * 60_000),
      fim: new Date(agora.getTime() + 65 * 60_000),
      versao: 7,
      ultimaAtividadeEm: agora,
      createdAt: agora,
      updatedAt: agora,
    } as any)
    reservaId = String(r.insertedId)
    await db.collection('monitorias_participacoes').insertOne({ reservaId, alunoId: ALUNO, alunoNome: 'Ana Souza', tutorId: String(TUTOR), status: 'paga', valorCentavos: 5000, reembolsos: [] } as any)
  })

  afterAll(async () => {
    await cliente?.close()
  })

  async function entrar(userId: string) {
    const { entrarNaSala } = await import('@/lib/monitorias/sala/servidor')
    const r = await entrarNaSala(reservaId, { userId, jti: `jti-${userId}` }, new Date())
    if ('ok' in r) throw new Error(`recusado: ${r.mensagem}`)
    const { verificarTokenDaSala } = await import('@/lib/monitorias/sala/token')
    return { cred: r, claims: (await verificarTokenDaSala(r.token))! }
  }

  it('monitor e aluno entram, se veem e trocam sinais; a reserva não muda', async () => {
    const { lerSinais, enviarSinal } = await import('@/lib/monitorias/sala/servidor')
    const m = await entrar(MONITOR)
    const a = await entrar(ALUNO)
    expect(a.cred.sala.participantes.map((p) => p.nome).sort()).toEqual(['Ana', 'Carla Mendes'])
    // O monitor entrou com o aluno fora: um aviso no sino para ele.
    expect(avisos.lista).toEqual([{ userId: ALUNO, titulo: 'O monitor entrou na sala' }])

    const envio = await enviarSinal(a.claims, { tipo: 'oferta', para: m.claims.pid, dados: { sdp, neg: 'n1' } })
    expect(envio.ok).toBe(true)
    const paraMonitor = await lerSinais(m.claims, 0, true)
    expect(paraMonitor.ok && paraMonitor.resposta.sinais.map((s) => s.tipo)).toEqual(['oferta'])
    const paraAluno = await lerSinais(a.claims, 0, false)
    expect(paraAluno.ok && paraAluno.resposta.sinais).toEqual([])
    // `desde` corta o que já foi lido.
    const seq = paraMonitor.ok ? paraMonitor.resposta.seq : 0
    const depois = await lerSinais(m.claims, seq, false)
    expect(depois.ok && depois.resposta.sinais).toEqual([])

    const reserva = await db.collection('monitorias_reservas').findOne({ _id: new ObjectId(reservaId) })
    expect(reserva?.versao).toBe(7)
    expect(reserva?.status).toBe('confirmada')
  })

  it('o que vem do navegador é gravado como texto, nunca como expressão', async () => {
    const { lerSinais, enviarSinal } = await import('@/lib/monitorias/sala/servidor')
    const m = await entrar(MONITOR)
    const a = await entrar(ALUNO)
    await enviarSinal(a.claims, { tipo: 'oferta', para: m.claims.pid, dados: { sdp: 'v=0\r\nm=audio $seq\r\n', neg: '$sinais' } })
    const r = await lerSinais(m.claims, 0, false)
    expect(r.ok && r.resposta.sinais[0].dados).toEqual({ sdp: 'v=0\r\nm=audio $seq\r\n', neg: '$sinais' })
  })

  it('segunda aba assume; a primeira não lê nem envia mais', async () => {
    const { lerSinais, enviarSinal } = await import('@/lib/monitorias/sala/servidor')
    const m = await entrar(MONITOR)
    const antiga = await entrar(ALUNO)
    const nova = await entrar(ALUNO)
    expect(nova.claims.ep).toBe(antiga.claims.ep + 1)
    const leitura = await lerSinais(antiga.claims, 0, true)
    expect(!leitura.ok && leitura.motivo).toBe('substituida')
    const envio = await enviarSinal(antiga.claims, { tipo: 'resposta', para: m.claims.pid, dados: { sdp, neg: 'n' } })
    expect(!envio.ok && envio.motivo).toBe('substituida')
    expect((await lerSinais(nova.claims, 0, true)).ok).toBe(true)
  })

  it('limite de 60 sinais por minuto por conexão', async () => {
    const { enviarSinal } = await import('@/lib/monitorias/sala/servidor')
    const m = await entrar(MONITOR)
    const a = await entrar(ALUNO)
    const resultados = []
    for (let i = 0; i < 61; i++) resultados.push(await enviarSinal(a.claims, { tipo: 'reiniciar', para: m.claims.pid, dados: {} }))
    expect(resultados.slice(0, 60).every((r) => r.ok)).toBe(true)
    expect(!resultados[60].ok && resultados[60].status).toBe(429)
    const sala = await db.collection('monitorias_salas').findOne({ _id: reservaId as any })
    // A fila guarda só os últimos 60.
    expect(sala?.sinais.length).toBe(60)
  })

  it('saída fecha a presença e o registro mínimo (sem IP nem SDP)', async () => {
    const { sairDaSala, enviarSinal } = await import('@/lib/monitorias/sala/servidor')
    const m = await entrar(MONITOR)
    const a = await entrar(ALUNO)
    await sairDaSala(a.claims, { tipo: 'retransmitida', bytesRelay: 1_000_000, segundos: 60 })
    const envio = await enviarSinal(m.claims, { tipo: 'oferta', para: a.claims.pid, dados: { sdp, neg: 'n' } })
    expect(envio.ok).toBe(false)
    const sala = await db.collection('monitorias_salas').findOne({ _id: reservaId as any })
    const reg = sala?.registro.find((x: any) => x.id === a.claims.cx)
    expect(reg?.saiu).toBeInstanceOf(Date)
    expect(reg?.conexaoTipo).toBe('retransmitida')
    expect(Object.keys(reg).sort()).toEqual(['ate', 'conexaoTipo', 'entrou', 'id', 'papel', 'pid', 'saiu'])
    const uso = await db.collection('monitorias_sala_uso').findOne({})
    expect(uso?.bytesRelay).toBe(1_000_000)
  })

  it('estranho não vê nem entra; reembolsado não renova', async () => {
    const { entrarNaSala, estadoDoSaguao, renovarNaSala } = await import('@/lib/monitorias/sala/servidor')
    expect(await estadoDoSaguao(reservaId, ESTRANHO, new Date())).toBeNull()
    const r = await entrarNaSala(reservaId, { userId: ESTRANHO, jti: 'x' }, new Date())
    expect('ok' in r && r.status).toBe(404)

    const a = await entrar(ALUNO)
    await db.collection('monitorias_participacoes').updateOne({ alunoId: ALUNO }, { $set: { status: 'reembolsada' } })
    const ren = await renovarNaSala(reservaId, { userId: ALUNO, jti: `jti-${ALUNO}` }, a.claims, undefined, new Date())
    expect('ok' in ren && ren.status).toBe(404)
  })

  it('token de outra sessão não renova', async () => {
    const { renovarNaSala } = await import('@/lib/monitorias/sala/servidor')
    const a = await entrar(ALUNO)
    const ren = await renovarNaSala(reservaId, { userId: ALUNO, jti: 'outra-sessao' }, a.claims, undefined, new Date())
    expect('ok' in ren && ren.status).toBe(401)
  })
})
