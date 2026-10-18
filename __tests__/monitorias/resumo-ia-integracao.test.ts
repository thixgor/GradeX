/**
 * Resumo por IA contra um MongoDB DE VERDADE, um Mercado Pago falso e um
 * Gemini falso (o `fetch` do próprio `lib/ia/gemini.ts` é que é interceptado:
 * o código real monta os pedidos de Interactions e do Files API).
 *
 * Cobre o dinheiro (checkout, aprovação repetida, reembolso integral antes e
 * depois da entrega, parcial, reembolso próprio, chargeback, recusa do
 * monitor, exclusão) e o processamento (transcrição, resumo, lease, 429,
 * cobertura baixa, map-reduce, retenção e falha de 48 h).
 *
 * Opcional (o CI não tem Mongo), como os outros testes de integração:
 *   MONITORIAS_MONGO_TESTE=mongodb://127.0.0.1:27999/ npx vitest run __tests__/monitorias/resumo-ia-integracao.test.ts
 */
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { MongoClient, ObjectId, type Db } from 'mongodb'
import { normalizarConfigResumo, precoDoResumo } from '@/lib/monitorias/resumo/regras'

const URI = process.env.MONITORIAS_MONGO_TESTE
process.env.GEMINI_API_BASE = 'http://gemini.falso'

// ─── Dublês ─────────────────────────────────────────────────────────────

const mp = vi.hoisted(() => ({
  criados: [] as Array<{ amount: number; commissionableAmount?: number }>,
  reembolsos: [] as Array<{ id: string; chave?: string; valor?: number }>,
  proximoId: 5000,
  estado: {} as Record<string, any>,
}))
const avisos = vi.hoisted(() => ({ lista: [] as Array<{ userId: string; titulo: string }> }))
const disparos = vi.hoisted(() => ({ n: 0 }))
const gemini = vi.hoisted(() => ({
  arquivos: {} as Record<string, { displayName: string; sizeBytes: string; state: string }>,
  apagados: [] as string[],
  interacoes: [] as any[],
  falhar429: 0,
  /** Formato que o "Gemini" recusa na transcrição (ex.: 'audio/webm'), como uma API que não aceita o áudio. */
  recusarMime: '' as string,
  /** Sessões de upload resumable abertas (autoteste e reserva pelo Blob). */
  sessoes: {} as Record<string, { tamanho: number; displayName: string }>,
  /** Transcrição longa (map-reduce) para arquivos cujo nome tem "longo". */
}))

vi.mock('@/lib/mongodb', async () => {
  const { MongoClient: Cliente } = await import('mongodb')
  const cliente = new Cliente(process.env.MONITORIAS_MONGO_TESTE || 'mongodb://127.0.0.1:1/')
  const conectado = process.env.MONITORIAS_MONGO_TESTE ? cliente.connect() : Promise.resolve(cliente)
  return { default: conectado, getDb: async () => (await conectado).db('monitorias-resumo-teste') }
})
vi.mock('@/lib/payments', () => ({
  deriveIdempotencyKey: (s: string) => `idem-${s}`,
  getPaymentProvider: () => ({
    async createPayment(input: { amount: number; commissionableAmount?: number }) {
      mp.criados.push({ amount: input.amount, commissionableAmount: input.commissionableAmount })
      return { providerOrderId: String(mp.proximoId++), status: 'pending', amount: input.amount, currency: 'BRL', pix: { qrCode: 'pix', qrCodeBase64: 'AAAA' } }
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
vi.mock('@/lib/monitorias/resumo/disparo', () => ({ dispararProcessador: () => void disparos.n++ }))

/** O Gemini falso: Files API (consulta/apaga) e Interactions (transcrição, notas, resumo). */
function respostaJson(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })
}
const RESUMO = {
  titulo: 'Insuficiência cardíaca: da pré-carga ao tratamento',
  sintese: 'A aula revisou a fisiopatologia da IC.',
  topicos: [{ titulo: 'Pré-carga e pós-carga', explicacao: 'O monitor explicou Frank-Starling.', conceitos: [{ termo: 'Pré-carga', definicao: 'Estiramento no fim da diástole.' }], mecanismos: ['Ativação neuro-hormonal'], raciocinioDoMonitor: 'Sintoma → mecanismo → conduta.' }],
  duvidas: [{ pergunta: 'E a FE preservada?', resposta: 'É ICFEp.', quemPerguntou: 'aluno' }],
  comparacoes: [],
  pontosDeAtencao: ['Não confundir dispneia cardíaca com pulmonar.'],
  revisaoRapida: ['Frank-Starling: mais estiramento, mais força (até um limite).'],
  questoes: [{ enunciado: 'Qual define pré-carga?', alternativas: ['A', 'B', 'C', 'D'], correta: 0, comentario: 'Dito na aula.' }],
  lacunas: [],
  aVerificar: [],
}
async function fetchFalso(entrada: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = String(entrada instanceof Request ? entrada.url : entrada)
  if (!url.startsWith('http://gemini.falso')) throw new Error(`rede bloqueada no teste: ${url}`)
  const caminho = url.replace('http://gemini.falso', '')
  const metodo = (init?.method || 'GET').toUpperCase()
  if (caminho === '/upload/v1beta/files' && metodo === 'POST') {
    const h = new Headers(init?.headers)
    const id = `s${Object.keys(gemini.sessoes).length + 1}`
    gemini.sessoes[id] = { tamanho: Number(h.get('x-goog-upload-header-content-length')), displayName: JSON.parse(String(init?.body || '{}'))?.file?.display_name }
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json', 'x-goog-upload-url': `http://gemini.falso/upload/v1beta/files?upload_id=${id}` } })
  }
  const sessao = caminho.match(/^\/upload\/v1beta\/files\?upload_id=(\w+)$/)
  if (sessao && metodo === 'POST') {
    const s = gemini.sessoes[sessao[1]]
    const corpo = init?.body as ArrayBuffer
    if (!s || corpo.byteLength !== s.tamanho) return respostaJson({ error: { message: 'tamanho' } }, 400)
    const nome = `files/up-${sessao[1]}`
    gemini.arquivos[nome] = { displayName: s.displayName, sizeBytes: String(corpo.byteLength), state: 'ACTIVE' }
    return respostaJson({ file: { name: nome, displayName: s.displayName, sizeBytes: String(corpo.byteLength), state: 'ACTIVE' } })
  }
  const arquivo = caminho.match(/^\/v1beta\/(files\/[a-z0-9-]+)$/)
  if (arquivo && metodo === 'GET') {
    const f = gemini.arquivos[arquivo[1]]
    return f ? respostaJson({ name: arquivo[1], displayName: f.displayName, sizeBytes: f.sizeBytes, state: f.state, uri: `https://gemini.falso/${arquivo[1]}` }) : respostaJson({ error: { message: 'not found' } }, 404)
  }
  if (arquivo && metodo === 'DELETE') {
    gemini.apagados.push(arquivo[1])
    return respostaJson({})
  }
  if (caminho === '/v1beta/interactions' && metodo === 'POST') {
    const corpo = JSON.parse(String(init?.body || '{}'))
    gemini.interacoes.push(corpo)
    if (gemini.falhar429 > 0) {
      gemini.falhar429--
      return respostaJson({ error: { message: 'Resource has been exhausted (e.g. check quota).' } }, 429)
    }
    const audio = Array.isArray(corpo.input) ? corpo.input.find((c: any) => c.type === 'audio') : null
    if (audio && gemini.recusarMime && audio.mime_type === gemini.recusarMime) {
      return respostaJson({ error: { message: `Unsupported MIME type: ${audio.mime_type}` } }, 400)
    }
    let texto: string
    let usage: any
    if (audio) {
      const longo = String(audio.uri).includes('longo')
      const contato = String(audio.uri).includes('contato')
      const frases = contato
        ? [{ inicio_s: 2, texto: 'A pré-carga é o estiramento.', incerto: false }, { inicio_s: 130, texto: 'Me chama no zap depois, é 21 98765-4321, que a gente combina por fora.', incerto: false }]
        : longo
        ? // ~585 mil caracteres ≈ 167 mil tokens: passa do limite de 150 mil da janela única.
          Array.from({ length: 150 }, (_, i) => ({ inicio_s: i * 28, texto: `Explicação longa ${i}. ${'conteúdo '.repeat(430)}`, incerto: false }))
        : [{ inicio_s: 2, texto: 'Vamos falar de insuficiência cardíaca.', incerto: false }, { inicio_s: 40, texto: 'A pré-carga é o estiramento.', incerto: false }]
      texto = JSON.stringify({ frases })
      usage = { total_input_tokens: 9600, input_tokens_by_modality: [{ modality: 'audio', tokens: 9000 }], total_output_tokens: 400, total_thought_tokens: 100 }
    } else if (!corpo.response_format) {
      texto = 'Notas do trecho: o monitor explicou pré-carga.'
      usage = { total_input_tokens: 50_000, total_output_tokens: 800, total_thought_tokens: 200 }
    } else {
      texto = JSON.stringify(RESUMO)
      usage = { total_input_tokens: 4000, total_output_tokens: 3000, total_thought_tokens: 1500 }
    }
    return respostaJson({ id: `int-${gemini.interacoes.length}`, status: 'completed', steps: [{ type: 'user_input', content: [] }, { type: 'model_output', content: [{ type: 'text', text: texto }] }], usage })
  }
  return respostaJson({ error: { message: `rota falsa desconhecida ${metodo} ${caminho}` } }, 404)
}

const suite = URI ? describe : describe.skip

suite('Resumo por IA (Mongo real, MP e Gemini falsos)', () => {
  let db: Db
  let cliente: MongoClient
  const TUTOR = new ObjectId()
  const ANUNCIO = new ObjectId()
  const CONFIG = { vendaAtiva: true, nivelPagoConfirmado: true, cambio: { fonte: 'manual', acrescimoPct: 8, manualBrlPorUsd: 5.5 } }
  // Aula individual de 60 min daqui a 3 dias, câmbio de R$ 5,50 + 8%. Em 2026:
  // custo seguro de R$ 2,01 + R$ 8,00 de lucro fixo → R$ 10,90 (a conta está
  // nos testes puros). Calculado aqui para o teste não vencer na virada da tabela.
  const PRECO = precoDoResumo({ duracaoMin: 60, individual: true, config: normalizarConfigResumo(CONFIG), brlPorUsd: 5.5, dataDaAula: new Date(Date.now() + 3 * 24 * 3_600_000) })!.precoCentavos

  beforeEach(async () => {
    if (!cliente) {
      cliente = await new MongoClient(URI!).connect()
      db = cliente.db('monitorias-resumo-teste')
    }
    vi.stubGlobal('fetch', fetchFalso)
    await db.dropDatabase()
    await Promise.all([
      db.collection('monitorias_repasses').createIndex({ participacaoId: 1 }, { unique: true }),
      db.collection('monitorias_bloqueios').createIndex({ tutorId: 1, inicioBloco: 1 }, { unique: true }),
      db.collection('payment_orders').createIndex({ idempotencyKey: 1 }, { unique: true, sparse: true }),
      db.collection('monitorias_resumos_adicionais').createIndex({ participacaoId: 1 }, { unique: true }),
      db.collection('monitorias_resumos_segmentos').createIndex({ reservaId: 1, userId: 1, seq: 1 }, { unique: true }),
    ])
    await db.collection('monitorias_tutores').insertOne({ _id: TUTOR, userId: 'monitor-1', nome: 'Carla Monitora', disponibilidade: { semanal: [], diasBloqueados: [], intervaloMin: 0 } } as any)
    await db.collection('monitorias_anuncios').insertOne({ _id: ANUNCIO, materia: 'Cardiologia', stats: { reservas: 0 } } as any)
    await db.collection('settings').insertOne({ geminiApiKey: 'chave-de-teste-do-gemini' } as any)
    // O Resumo só é vendido com a voz do monitor autorizada nos Termos (v5+).
    await db.collection('monitorias_termos_aceites').insertOne({ userId: 'monitor-1', papel: 'monitor', versao: '2026.10-v5', em: new Date() } as any)
    const { salvarConfigDoResumo } = await import('@/lib/monitorias/resumo/config')
    await salvarConfigDoResumo(CONFIG)
    mp.criados = []
    mp.reembolsos = []
    mp.estado = {}
    avisos.lista = []
    disparos.n = 0
    gemini.arquivos = {}
    gemini.apagados = []
    gemini.interacoes = []
    gemini.falhar429 = 0
    gemini.recusarMime = ''
    gemini.sessoes = {}
  })

  afterAll(async () => {
    vi.unstubAllGlobals()
    await cliente?.close()
  })

  // ─── Cenários ─────────────────────────────────────────────────────────

  /** Reserva aguardando pagamento daqui a 3 dias, aula de 60 min (R$ 100 por assento). */
  async function reservaParaPagar(vagas = 1) {
    const { blocosDaAula } = await import('@/lib/monitorias/agenda')
    const agora = Date.now()
    const inicio = new Date(Math.ceil((agora + 3 * 24 * 3_600_000) / 1_800_000) * 1_800_000)
    const reserva = {
      _id: new ObjectId(),
      anuncioId: String(ANUNCIO),
      anuncioTitulo: 'Cardiologia: IC',
      tutorId: String(TUTOR),
      tutorUserId: 'monitor-1',
      solicitanteId: 'aluno-0',
      origem: 'direto',
      status: 'aguardando_pagamento',
      proposta: { id: 'p1', autorId: 'monitor-1', inicio, duracaoMin: 60, vagas, conteudos: ['ICC'], gratis: false, valorPorPessoaCentavos: 10000, criadaEm: new Date() },
      inicio,
      fim: new Date(inicio.getTime() + 3_600_000),
      prazoPagamento: new Date(agora + 60 * 60_000),
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
      const p = { _id: new ObjectId(), reservaId: String(reserva._id), alunoId: `aluno-${i}`, alunoNome: `Aluno ${i}`, tutorId: String(TUTOR), status: 'aguardando_pagamento', valorCentavos: 10000, reembolsos: [], createdAt: new Date(), updatedAt: new Date() }
      await db.collection('monitorias_participacoes').insertOne(p as any)
      assentos.push(p)
    }
    return { reserva, assentos }
  }
  const aluno = (i: number) => ({ _id: `aluno-${i}`, email: `aluno${i}@teste.dev`, name: `Aluno ${i}`, fullName: `Aluno ${i}` }) as any

  /** Checkout COM o resumo e aprovação no MP: devolve o que ficou gravado. */
  async function comprarComResumo(vagas = 1) {
    const { criarCheckoutPix } = await import('@/lib/monitorias/pagamento')
    const { ofertaDoResumo } = await import('@/lib/monitorias/resumo/adicional')
    const { applyPaymentResult } = await import('@/lib/payments/effects')
    const cen = await reservaParaPagar(vagas)
    const oferta = await ofertaDoResumo(cen.reserva as any, cen.assentos[0] as any)
    expect(oferta.disponivel).toBe(true)
    const r = await criarCheckoutPix({ reservaId: String(cen.reserva._id), aluno: aluno(0), ip: '1.1.1.1', incluirResumo: true, aceiteResumo: { versao: oferta.versao, hash: oferta.hash } })
    const order = await db.collection('payment_orders').findOne({ _id: new ObjectId(r.orderId) })
    const pid = String(order!.providerPaymentId)
    mp.estado[pid] = { providerOrderId: pid, status: 'approved', amount: order!.amount, currency: 'BRL', raw: { transaction_amount_refunded: 0 } }
    await db.collection('payment_orders').updateOne({ _id: order!._id }, { $set: { status: 'approved', paidAt: new Date() } })
    await applyPaymentResult(r.orderId, { providerOrderId: pid, status: 'approved', amount: order!.amount, currency: 'BRL', paidAt: new Date() })
    const adicional = await db.collection('monitorias_resumos_adicionais').findOne({ participacaoId: String(cen.assentos[0]._id) })
    return { ...cen, checkout: r, order: order!, pid, oferta, adicional: adicional! }
  }

  const assento = (id: ObjectId) => db.collection('monitorias_participacoes').findOne({ _id: id })
  const adicionalDe = (partId: ObjectId) => db.collection('monitorias_resumos_adicionais').findOne({ participacaoId: String(partId) })
  const tarefaDe = (reservaId: ObjectId) => db.collection('monitorias_resumos').findOne({ _id: String(reservaId) } as any)

  // ─── Dinheiro ─────────────────────────────────────────────────────────

  it('monitor sem os Termos v5: o Resumo não é oferecido (a voz dele não está autorizada)', async () => {
    const { ofertaDoResumo } = await import('@/lib/monitorias/resumo/adicional')
    const { reserva } = await comprarComResumo()
    const atual = (await db.collection('monitorias_reservas').findOne({ _id: reserva._id })) as any
    expect((await ofertaDoResumo(atual, { valorCentavos: 10000 })).disponivel).toBe(true)
    await db.collection('monitorias_termos_aceites').updateOne({ userId: 'monitor-1' }, { $set: { versao: '2026.10-v4' } })
    const sem = await ofertaDoResumo(atual, { valorCentavos: 10000 })
    expect(sem.disponivel).toBe(false)
    expect(sem.interno?.motivo).toMatch(/Termos/)
  })

  it('checkout com resumo: preço do servidor no pedido, base = aula + resumo, resumo na comissão; repasse do monitor continua R$ 90', async () => {
    const { order, checkout, adicional, assentos, reserva } = await comprarComResumo()
    expect(checkout.resumo).toEqual({ precoCentavos: PRECO })
    expect(checkout.valorCentavos).toBe(10000)
    expect((order.metadata as any).resumoIA.precoCentavos).toBe(PRECO)
    expect(order.baseAmount).toBe((10000 + PRECO) / 100)
    // Comissão do sócio: taxa da plataforma (10% de R$ 100) + o resumo inteiro.
    expect(mp.criados[0].commissionableAmount).toBe((1000 + PRECO) / 100)
    // Repasse: só a aula.
    const repasse = await db.collection('monitorias_repasses').findOne({ participacaoId: String(assentos[0]._id) })
    expect(repasse!.liquidoTutorCentavos).toBe(9000)
    expect(repasse!.taxaPlataformaCentavos).toBe(1000)
    // Registro próprio do adicional, cópia no assento e a tarefa da aula (monitor + aluno).
    const taxa = Math.round(order.amount * 100) - (10000 + PRECO)
    expect(adicional).toMatchObject({ status: 'pago', precoCentavos: PRECO, taxaPixCentavos: Math.round((taxa * PRECO) / (10000 + PRECO)) })
    expect((await assento(assentos[0]._id))!.resumoIA).toEqual({ precoCentavos: PRECO, paymentOrderId: String(order._id) })
    const t = await tarefaDe(reserva._id)
    expect(t!.status).toBe('aguardando')
    expect(Object.values(t!.vozes).map((v: any) => v.papel).sort()).toEqual(['aluno', 'monitor'])
    expect(avisos.lista.some((a) => a.userId === 'monitor-1' && a.titulo.includes('Resumo por IA'))).toBe(true)
  })

  it('aprovação repetida (aviso duplicado do MP) cria UM adicional e conta a venda uma vez', async () => {
    const { applyPaymentResult } = await import('@/lib/payments/effects')
    const { order, pid } = await comprarComResumo()
    await Promise.all([1, 2, 3].map(() => applyPaymentResult(String(order._id), { providerOrderId: pid, status: 'approved', amount: order.amount, currency: 'BRL', paidAt: new Date() })))
    expect(await db.collection('monitorias_resumos_adicionais').countDocuments()).toBe(1)
    const uso = await db.collection('monitorias_resumos_uso').findOne({})
    expect(uso!.vendasCentavos).toBe(PRECO)
  })

  it('aceite desatualizado ou venda desligada: nada é cobrado pelo resumo', async () => {
    const { criarCheckoutPix } = await import('@/lib/monitorias/pagamento')
    const { salvarConfigDoResumo } = await import('@/lib/monitorias/resumo/config')
    const { reserva } = await reservaParaPagar()
    await expect(criarCheckoutPix({ reservaId: String(reserva._id), aluno: aluno(0), ip: '1', incluirResumo: true, aceiteResumo: { versao: 'velha', hash: 'a'.repeat(64) } })).rejects.toMatchObject({ status: 409 })
    await salvarConfigDoResumo({ ...CONFIG, vendaAtiva: false })
    await expect(criarCheckoutPix({ reservaId: String(reserva._id), aluno: aluno(0), ip: '1', incluirResumo: true, aceiteResumo: { versao: 'x', hash: 'a'.repeat(64) } })).rejects.toMatchObject({ status: 409 })
    expect(mp.criados).toHaveLength(0)
  })

  it('reembolso integral ANTES da entrega devolve tudo no MP (adicional junto) e cancela a tarefa', async () => {
    const { reembolsarParticipacao } = await import('@/lib/monitorias/reembolso')
    const { assentos, pid, reserva } = await comprarComResumo()
    const r = await reembolsarParticipacao({ participacaoId: String(assentos[0]._id), valorBaseCentavos: null, motivo: 'Cancelamento', por: 'sistema' })
    expect(r).toEqual({ ok: true, total: true })
    expect(mp.reembolsos).toEqual([{ id: pid, chave: `refund:${assentos[0]._id}:0`, valor: undefined }])
    expect((await adicionalDe(assentos[0]._id))!.status).toBe('reembolsado')
    expect((await tarefaDe(reserva._id))!.status).toBe('cancelado')
    expect((await db.collection('monitorias_resumos_uso').findOne({}))!.reembolsosCentavos).toBe(PRECO)
  })

  it('reembolso integral DEPOIS da entrega: valor explícito sem o adicional (que fica entregue)', async () => {
    const { reembolsarParticipacao } = await import('@/lib/monitorias/reembolso')
    const { assentos, adicional, order } = await comprarComResumo()
    await db.collection('monitorias_resumos_adicionais').updateOne({ _id: adicional._id }, { $set: { status: 'entregue', entregueEm: new Date() } })
    const r = await reembolsarParticipacao({ participacaoId: String(assentos[0]._id), valorBaseCentavos: null, motivo: 'Disputa', por: 'admin' })
    expect(r).toEqual({ ok: true, total: true })
    const pago = Math.round(order.amount * 100)
    expect(mp.reembolsos[0].valor).toBe((pago - PRECO - adicional.taxaPixCentavos) / 100)
    expect((await adicionalDe(assentos[0]._id))!.status).toBe('entregue')
    const p = await assento(assentos[0]._id)
    expect(p!.status).toBe('reembolsada')
    expect(p!.reembolsos[0]).toMatchObject({ adicional: 'excluir', valorGatewayCentavos: pago - PRECO - adicional.taxaPixCentavos })
  })

  it('reembolso parcial da aula não mexe no adicional', async () => {
    const { reembolsarParticipacao } = await import('@/lib/monitorias/reembolso')
    const { assentos } = await comprarComResumo()
    await reembolsarParticipacao({ participacaoId: String(assentos[0]._id), valorBaseCentavos: 3000, motivo: 'Atraso', por: 'admin' })
    expect(mp.reembolsos[0].valor).toBe(30)
    expect((await adicionalDe(assentos[0]._id))!.status).toBe('pago')
  })

  it('falha → reembolso PRÓPRIO do adicional (+ taxa) uma única vez; repasse intacto; integral depois exclui o já devolvido', async () => {
    const { reembolsarAdicionaisDaAula } = await import('@/lib/monitorias/resumo/adicional')
    const { reembolsarParticipacao } = await import('@/lib/monitorias/reembolso')
    const { assentos, adicional, reserva, order, pid } = await comprarComResumo()
    const um = await reembolsarAdicionaisDaAula(String(reserva._id), 'Não foi possível gerar o resumo')
    const dois = await reembolsarAdicionaisDaAula(String(reserva._id), 'Não foi possível gerar o resumo')
    expect(um).toEqual({ ok: 1, falhas: 0 })
    expect(dois).toEqual({ ok: 0, falhas: 0 })
    expect(mp.reembolsos).toEqual([{ id: pid, chave: `refund:resumo:${adicional._id}`, valor: (PRECO + adicional.taxaPixCentavos) / 100 }])
    expect((await assento(assentos[0]._id))!.status).toBe('paga')
    const repasse = await db.collection('monitorias_repasses').findOne({ participacaoId: String(assentos[0]._id) })
    expect(repasse!.liquidoTutorCentavos).toBe(9000)
    expect(repasse!.status).toBe('em_garantia')
    // MP já mostra a devolução do adicional; o integral da aula pede só o resto.
    mp.estado[pid].raw.transaction_amount_refunded = (PRECO + adicional.taxaPixCentavos) / 100
    await reembolsarParticipacao({ participacaoId: String(assentos[0]._id), valorBaseCentavos: null, motivo: 'Cancelamento', por: 'sistema' })
    const pago = Math.round(order.amount * 100)
    expect(mp.reembolsos[1].valor).toBe((pago - PRECO - adicional.taxaPixCentavos) / 100)
    expect(mp.reembolsos.reduce((t, r) => t + Math.round((r.valor || 0) * 100), 0)).toBe(pago)
  })

  it('chargeback leva o adicional junto (reembolsado pelo banco)', async () => {
    const { aoRevogarPagamento } = await import('@/lib/monitorias/pagamento')
    const { assentos, order } = await comprarComResumo()
    const atual = await db.collection('payment_orders').findOne({ _id: order._id })
    await aoRevogarPagamento(atual as any, 'charged_back')
    const a = await adicionalDe(assentos[0]._id)
    expect(a!.status).toBe('reembolsado')
    expect(a!.reembolso.viaGateway).toBe(true)
    expect(mp.reembolsos).toHaveLength(0)
  })

  it('monitor recusa a transcrição: adicional devolvido, tarefa cancelada, decisão definitiva', async () => {
    const { registrarConsentimento } = await import('@/lib/monitorias/resumo/tarefa')
    const { reserva, assentos, adicional } = await comprarComResumo()
    // Adicional vendido no aditivo r1, monitor ainda sem os Termos v5: o fluxo antigo (decide na sala) continua.
    await db.collection('monitorias_termos_aceites').deleteMany({ userId: 'monitor-1' })
    const atual = await db.collection('monitorias_reservas').findOne({ _id: reserva._id })
    await registrarConsentimento(atual as any, 'monitor-1', false, '2.2.2.2')
    expect((await adicionalDe(assentos[0]._id))!.status).toBe('reembolsado')
    expect(mp.reembolsos[0].chave).toBe(`refund:resumo:${adicional._id}`)
    expect((await tarefaDe(reserva._id))!.status).toBe('cancelado')
    await expect(registrarConsentimento(atual as any, 'monitor-1', true, '2.2.2.2')).rejects.toMatchObject({ status: 409 })
    await expect(registrarConsentimento(atual as any, 'aluno-0', true, '2.2.2.2')).rejects.toMatchObject({ status: 403 })
  })

  // ─── Processamento ────────────────────────────────────────────────────

  /** Aula de 60 min que terminou há 1 h, com o resumo pago, o monitor autorizou e todos saíram da sala. */
  async function aulaQueTerminou(opcoes: { individual?: boolean } = {}) {
    const { garantirTarefa } = await import('@/lib/monitorias/resumo/tarefa')
    const fim = new Date(Date.now() - 3_600_000)
    const inicio = new Date(fim.getTime() - 3_600_000)
    const reserva = {
      _id: new ObjectId(),
      anuncioId: String(ANUNCIO),
      anuncioTitulo: 'Cardiologia: IC',
      tutorId: String(TUTOR),
      tutorUserId: 'monitor-1',
      solicitanteId: 'aluno-0',
      origem: 'direto',
      status: 'realizada',
      proposta: { id: 'p1', autorId: 'monitor-1', inicio, duracaoMin: 60, vagas: opcoes.individual === false ? 3 : 1, conteudos: ['ICC'], gratis: false, valorPorPessoaCentavos: 10000, criadaEm: new Date() },
      inicio,
      fim,
      versao: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.collection('monitorias_reservas').insertOne(reserva as any)
    const part = { _id: new ObjectId(), reservaId: String(reserva._id), alunoId: 'aluno-0', alunoNome: 'Bruno Aluno', tutorId: String(TUTOR), status: 'paga', valorCentavos: 10000, pagoCentavos: 10600, providerPaymentId: 'pg-1', reembolsos: [], createdAt: new Date(), updatedAt: new Date() }
    await db.collection('monitorias_participacoes').insertOne(part as any)
    await db.collection('monitorias_resumos_adicionais').insertOne({ participacaoId: String(part._id), reservaId: String(reserva._id), alunoId: 'aluno-0', paymentOrderId: 'o1', precoCentavos: 490, taxaPixCentavos: 5, estimativa: {}, aceite: { versao: 'v', hash: 'h', em: new Date() }, status: 'pago', pagoEm: new Date(), createdAt: new Date(), updatedAt: new Date() } as any)
    mp.estado['pg-1'] = { providerOrderId: 'pg-1', status: 'approved', amount: 106, raw: { transaction_amount_refunded: 0 } }
    await garantirTarefa(reserva as any, { alunoId: 'aluno-0', alunoNome: 'Bruno Aluno' })
    await db.collection('monitorias_resumos').updateOne(
      { _id: String(reserva._id) } as any,
      { $set: { status: 'transcrevendo', 'vozes.monitor-1.consentimento': { aceito: true, em: new Date(), versao: 'v' } } },
    )
    return { reserva, part, inicio, fim }
  }

  async function trecho(reservaId: ObjectId, p: { userId: string; papel: 'monitor' | 'aluno'; nome: string; seq: number; inicio: Date; min: number; nomeArquivo: string; status?: string; extra?: Record<string, unknown> }) {
    const bytes = 100_000 + p.seq
    gemini.arquivos[p.nomeArquivo] = { displayName: `res-${reservaId}-${p.userId}-${p.seq}-abc`, sizeBytes: String(bytes), state: 'ACTIVE' }
    await db.collection('monitorias_resumos_segmentos').insertOne({
      reservaId: String(reservaId), userId: p.userId, seq: p.seq, papel: p.papel, nome: p.nome, inicio: p.inicio, marcas: [[0, 0]],
      duracaoAudioMs: p.min * 60_000, duracaoRealMs: p.min * 60_000, bytes, mime: 'audio/webm', origem: 'direto',
      nomeDeExibicao: `res-${reservaId}-${p.userId}-${p.seq}-abc`, arquivo: { nome: p.nomeArquivo }, status: p.status || 'enviado', tentativas: 0, createdAt: new Date(), updatedAt: new Date(), ...p.extra,
    } as any)
  }
  async function sairam(reservaId: ObjectId, ultimos: Record<string, number>) {
    const set: Record<string, unknown> = {}
    for (const [uid, seq] of Object.entries(ultimos)) {
      set[`vozes.${uid}.saiuEm`] = new Date()
      set[`vozes.${uid}.ultimoSeq`] = seq
    }
    await db.collection('monitorias_resumos').updateOne({ _id: String(reservaId) } as any, { $set: set })
  }
  async function processarTudo(max = 20) {
    const { executarPasso } = await import('@/lib/monitorias/resumo/processador')
    const feitos: string[] = []
    for (let i = 0; i < max; i++) {
      const r = await executarPasso()
      if (!r.feito) break
      feitos.push(r.feito)
    }
    return feitos
  }

  it('fluxo completo: transcreve cada trecho, apaga o áudio no Google, resume, entrega e registra o custo real', async () => {
    const { reserva, part, inicio } = await aulaQueTerminou()
    await trecho(reserva._id, { userId: 'monitor-1', papel: 'monitor', nome: 'Carla', seq: 0, inicio, min: 10, nomeArquivo: 'files/m0' })
    await trecho(reserva._id, { userId: 'monitor-1', papel: 'monitor', nome: 'Carla', seq: 1, inicio: new Date(inicio.getTime() + 25 * 60_000), min: 30, nomeArquivo: 'files/m1' })
    await trecho(reserva._id, { userId: 'aluno-0', papel: 'aluno', nome: 'Bruno', seq: 0, inicio: new Date(inicio.getTime() + 5 * 60_000), min: 20, nomeArquivo: 'files/a0' })
    await sairam(reserva._id, { 'monitor-1': 1, 'aluno-0': 0 })
    const feitos = await processarTudo()
    expect(feitos).toEqual(['trecho', 'trecho', 'trecho', 'resumo'])
    expect(gemini.apagados.sort()).toEqual(['files/a0', 'files/m0', 'files/m1'])
    // Todo pedido ao Gemini: store:false, modelo do painel, saída JSON com esquema.
    expect(gemini.interacoes.every((b) => b.store === false && b.model === 'gemini-3.8-flash' && b.stream === false)).toBe(true)
    expect(gemini.interacoes.filter((b) => b.response_format?.schema)).toHaveLength(4)
    const resumoPedido = gemini.interacoes[3]
    expect(resumoPedido.input).toContain('MONITOR (Carla)')
    expect(resumoPedido.input).toContain('ALUNO (Bruno)')
    expect(resumoPedido.generation_config.thinking_level).toBe('medium')
    const t = await tarefaDe(reserva._id)
    expect(t!.status).toBe('pronto')
    expect(t!.resultado.titulo).toBe(RESUMO.titulo)
    expect(t!.cobertura.pct).toBeGreaterThanOrEqual(30)
    // Custo real = usage × tabela do dia (0,75 entrada/áudio, 3,75 saída+raciocínio).
    const esperado = 3 * ((600 + 9000) * 0.75 + 500 * 3.75) / 1e6 + (4000 * 0.75 + 4500 * 3.75) / 1e6
    expect(t!.custo.realUsd).toBeCloseTo(esperado, 8)
    expect(t!.custo.chamadas).toHaveLength(4)
    const uso = await db.collection('monitorias_resumos_uso').findOne({})
    expect(uso!.aulas).toBe(1)
    expect(uso!.chamadas).toBe(4)
    expect((await adicionalDe(part._id))!.status).toBe('entregue')
    expect(avisos.lista.some((a) => a.userId === 'aluno-0' && a.titulo.includes('resumo da monitoria está pronto'))).toBe(true)
    // O comprador lê; um estranho não.
    const { estadoDoResumoParaComprador } = await import('@/lib/monitorias/resumo/tarefa')
    const atual = await db.collection('monitorias_reservas').findOne({ _id: reserva._id })
    expect((await estadoDoResumoParaComprador(atual as any, 'aluno-0', false)).resultado?.titulo).toBe(RESUMO.titulo)
    const estranho = await estadoDoResumoParaComprador(atual as any, 'outro-usuario', false)
    expect(estranho.adicional).toBeNull()
    expect(estranho.resultado).toBeNull()
    // Abrir de novo não chama o modelo.
    const antes = gemini.interacoes.length
    await estadoDoResumoParaComprador(atual as any, 'aluno-0', false)
    expect(gemini.interacoes.length).toBe(antes)
  })

  it('contato dito na aula: vira infração (só a frase e o minuto), a equipe é avisada uma vez e o resumo sai sem contato', async () => {
    const { reserva, inicio } = await aulaQueTerminou()
    await trecho(reserva._id, { userId: 'monitor-1', papel: 'monitor', nome: 'Carla', seq: 0, inicio: new Date(inicio.getTime() + 10 * 60_000), min: 40, nomeArquivo: 'files/contato-m0' })
    await trecho(reserva._id, { userId: 'monitor-1', papel: 'monitor', nome: 'Carla', seq: 1, inicio: new Date(inicio.getTime() + 50 * 60_000), min: 8, nomeArquivo: 'files/contato-m1' })
    await sairam(reserva._id, { 'monitor-1': 1 })
    expect(await processarTudo()).toEqual(['trecho', 'trecho', 'resumo'])
    const infracoes = await db.collection('monitorias_infracoes').find({ reservaId: String(reserva._id) }).toArray()
    expect(infracoes).toHaveLength(2)
    expect(infracoes.every((i) => i.origem === 'resumo_ia' && i.papel === 'monitor' && i.nivel === 'bloqueio')).toBe(true)
    expect(infracoes.map((i) => i.texto).sort()[0]).toMatch(/^\[min 12\] Me chama no zap/)
    expect(infracoes.every((i) => !i.texto.includes('pré-carga'))).toBe(true)
    expect(avisos.lista.filter((a) => a.titulo === 'Contato por fora dito na aula')).toHaveLength(1)
    // O pedido de resumo manda deixar contato de fora; o resultado não traz telefone.
    const pedidoDoResumo = gemini.interacoes.find((b) => b.response_format && !(Array.isArray(b.input) && b.input.some((c: any) => c.type === 'audio')))
    expect(pedidoDoResumo.system_instruction).toMatch(/nunca inclua telefones/)
    const t = await tarefaDe(reserva._id)
    expect(JSON.stringify(t!.resultado)).not.toMatch(/98765/)
  })

  it('monitor com os Termos v5: grava sem cartão, sem pausa e sem poder recusar; sem os Termos, o fluxo antigo', async () => {
    const { estadoDoResumoNaSala, registrarConsentimento } = await import('@/lib/monitorias/resumo/tarefa')
    const { reserva } = await aulaQueTerminou()
    await db.collection('monitorias_resumos').updateOne({ _id: String(reserva._id) } as any, { $unset: { 'vozes.monitor-1.consentimento': '' } })
    const atual = (await db.collection('monitorias_reservas').findOne({ _id: reserva._id })) as any
    const v5 = await estadoDoResumoNaSala(atual, 'monitor-1')
    expect(v5).toMatchObject({ gravar: true, consentimento: 'aceito', pelosTermos: true })
    expect((await tarefaDe(reserva._id))!.vozes['monitor-1'].consentimento).toMatchObject({ aceito: true, via: 'termos', versao: '2026.10-v5' })
    await expect(registrarConsentimento(atual, 'monitor-1', false, '1.1.1.1')).rejects.toMatchObject({ status: 409 })
    expect((await tarefaDe(reserva._id))!.status).toBe('transcrevendo')
    // Outra aula, monitor sem os Termos v5 (adicional do aditivo r1): decide na sala.
    await db.collection('monitorias_termos_aceites').deleteMany({ userId: 'monitor-1' })
    const outra = await aulaQueTerminou()
    await db.collection('monitorias_resumos').updateOne({ _id: String(outra.reserva._id) } as any, { $unset: { 'vozes.monitor-1.consentimento': '' } })
    const legado = await estadoDoResumoNaSala((await db.collection('monitorias_reservas').findOne({ _id: outra.reserva._id })) as any, 'monitor-1')
    expect(legado).toMatchObject({ gravar: false, consentimento: 'pendente' })
    expect(legado!.pelosTermos).toBeUndefined()
  })

  it('nenhum trecho transcrito: o admin vê o erro real do Gemini; o aluno recebe um motivo sem jargão', async () => {
    const { resumoDosTrechos } = await import('@/lib/monitorias/resumo/tarefa')
    gemini.recusarMime = 'audio/webm'
    const { reserva, part, inicio } = await aulaQueTerminou()
    await trecho(reserva._id, { userId: 'monitor-1', papel: 'monitor', nome: 'Carla', seq: 0, inicio, min: 40, nomeArquivo: 'files/m0' })
    await sairam(reserva._id, { 'monitor-1': 0 })
    expect(await processarTudo()).toEqual(['trecho', 'resumo'])
    const t = await tarefaDe(reserva._id)
    expect(t!.status).toBe('cancelado')
    expect(t!.erro).toBe('Nenhum trecho foi transcrito (1 de 1 falharam): Unsupported MIME type: audio/webm')
    const a = await adicionalDe(part._id)
    expect(a!.status).toBe('reembolsado')
    expect(a!.reembolso.motivo).toBe('Não foi possível transcrever o áudio da aula')
    // Os trechos (e o áudio) somem no cancelamento; o retrato do que aconteceu fica na tarefa.
    expect(await resumoDosTrechos([String(reserva._id)])).toEqual({})
    expect(t!.trechosNoFim).toMatchObject({ total: 1, transcritos: 0, falharam: 1, enviando: 0, ultimoErro: 'Unsupported MIME type: audio/webm' })
  })

  it('trecho preso no envio do navegador: o motivo (CORS, Blob) chega ao diagnóstico', async () => {
    const { abrirEnvioDeTrecho, concluirEnvioDeTrecho, resumoDosTrechos } = await import('@/lib/monitorias/resumo/tarefa')
    const { motivoSemTranscricao } = await import('@/lib/monitorias/resumo/regras')
    const { reserva } = await aulaQueTerminou()
    await db.collection('monitorias_reservas').updateOne({ _id: reserva._id }, { $set: { fim: new Date(Date.now() + 3_600_000), inicio: new Date(Date.now() - 600_000) } })
    const atual = await db.collection('monitorias_reservas').findOne({ _id: reserva._id })
    const dados = { seq: 0, bytes: 30_000, mime: 'audio/webm;codecs=opus', duracaoAudioMs: 20_000, duracaoRealMs: 30_000, inicio: new Date(Date.now() - 60_000).toISOString(), marcas: [[0, 0]] as Array<[number, number]> }
    const r = await abrirEnvioDeTrecho(atual as any, 'monitor-1', dados, 'https://domineaqui.com.br', new Date(), true, 'rede ou CORS até o Google (Failed to fetch)')
    expect(r.modo).toBe('blob')
    await concluirEnvioDeTrecho(atual as any, 'monitor-1', { seq: 0, falha: 'reserva pelo Blob falhou (Store not found)' })
    const seg = await db.collection('monitorias_resumos_segmentos').findOne({ reservaId: String(reserva._id), seq: 0 })
    expect(seg).toMatchObject({ status: 'enviando', origem: 'blob', erroDireto: 'rede ou CORS até o Google (Failed to fetch)', erro: 'reserva pelo Blob falhou (Store not found)' })
    const diag = (await resumoDosTrechos([String(reserva._id)]))[String(reserva._id)]
    expect(diag).toMatchObject({ total: 1, enviando: 1, peloBlob: 1, erroDireto: 'rede ou CORS até o Google (Failed to fetch)' })
    expect(motivoSemTranscricao([seg as any]).detalhe).toBe('O áudio não chegou ao Google: 1 trecho(s) presos no envio do navegador (reserva pelo Blob falhou (Store not found))')
  })

  it('o mesmo trecho enviado duas vezes ao mesmo tempo (a sala fechando e a reserva abrindo): o nome não muda e o trecho é transcrito', async () => {
    const { abrirEnvioDeTrecho, concluirEnvioDeTrecho } = await import('@/lib/monitorias/resumo/tarefa')
    const { executarPasso } = await import('@/lib/monitorias/resumo/processador')
    const { reserva } = await aulaQueTerminou()
    await db.collection('monitorias_reservas').updateOne({ _id: reserva._id }, { $set: { fim: new Date(Date.now() + 3_600_000), inicio: new Date(Date.now() - 600_000) } })
    const atual = (await db.collection('monitorias_reservas').findOne({ _id: reserva._id })) as any
    const dados = { seq: 0, bytes: 30_000, mime: 'audio/webm;codecs=opus', duracaoAudioMs: 20_000, duracaoRealMs: 30_000, inicio: new Date(Date.now() - 60_000).toISOString(), marcas: [[0, 0]] as Array<[number, number]> }
    const um = await abrirEnvioDeTrecho(atual, 'monitor-1', dados, 'https://domineaqui.com.br')
    const dois = await abrirEnvioDeTrecho(atual, 'monitor-1', dados, 'https://domineaqui.com.br')
    expect(um.modo).toBe('direto')
    expect(dois.modo).toBe('direto')
    const nomes = Object.values(gemini.sessoes).map((x) => x.displayName)
    expect(nomes).toHaveLength(2)
    expect(nomes[0]).toBe(nomes[1])
    // O primeiro envio termina e confirma; o segundo chega depois e é ignorado.
    const f1 = await (await fetchFalso((um as any).url, { method: 'POST', body: new ArrayBuffer(30_000) })).json()
    const f2 = await (await fetchFalso((dois as any).url, { method: 'POST', body: new ArrayBuffer(30_000) })).json()
    await concluirEnvioDeTrecho(atual, 'monitor-1', { seq: 0, arquivo: f1.file.name })
    await concluirEnvioDeTrecho(atual, 'monitor-1', { seq: 0, arquivo: f2.file.name })
    // Trecho gravado pela versão antiga (nome trocado na segunda abertura): o arquivo da primeira ainda é deste trecho.
    await db.collection('monitorias_resumos_segmentos').updateOne({ reservaId: String(reserva._id), seq: 0 }, { $set: { nomeDeExibicao: `res-${reserva._id}-monitor-1-0-ffffffffffff` } })
    expect((await executarPasso()).feito).toBe('trecho')
    const seg = await db.collection('monitorias_resumos_segmentos').findOne({ reservaId: String(reserva._id), seq: 0 })
    expect(seg!.status).toBe('transcrito')
    expect(seg!.arquivo).toBeUndefined() // apagado do Google depois da transcrição
  })

  it('arquivo de OUTRO trecho, ou de tamanho diferente: não é usado, e o erro diz qual conferência falhou', async () => {
    const { divergenciaDoArquivo } = await import('@/lib/monitorias/resumo/processador')
    const seg = { reservaId: 'r1', userId: 'u1', seq: 2, bytes: 1000, nomeDeExibicao: 'res-r1-u1-2-abc' }
    expect(divergenciaDoArquivo(seg, { displayName: 'res-r1-u1-2-abc', sizeBytes: '1000' })).toBeNull()
    expect(divergenciaDoArquivo(seg, { displayName: 'res-r1-u1-2-outronome', sizeBytes: '1000' })).toBeNull()
    expect(divergenciaDoArquivo(seg, { displayName: 'res-r1-u1-3-abc', sizeBytes: '1000' })).toMatch(/não é o deste trecho/)
    expect(divergenciaDoArquivo(seg, { displayName: 'res-r1-u1-2-abc', sizeBytes: '999' })).toMatch(/tamanho no Google \(999 bytes\) diferente do declarado \(1000\)/)
    expect(divergenciaDoArquivo(seg, null)).toMatch(/não encontrou/)
  })

  it('autoteste: percorre envio, conferência e as duas transcrições; aponta o formato quando o WebM é recusado', async () => {
    const { abrirEnvioDoAutoteste, rodarAutoteste } = await import('@/lib/monitorias/resumo/autoteste')
    const { wavDeTeste } = await import('@/lib/monitorias/resumo/wav')
    const wav = wavDeTeste()
    // O "navegador" usa a sessão aberta pelo servidor.
    const { url, nome } = await abrirEnvioDoAutoteste('https://domineaqui.com.br', wav.byteLength)
    const enviado = await (await fetchFalso(url, { method: 'POST', body: wav.buffer as ArrayBuffer })).json()
    const ok = await rodarAutoteste({ arquivo: enviado.file.name, nome, bytes: wav.byteLength })
    expect(ok.etapas.map((e) => [e.etapa, e.ok])).toEqual([['envio_navegador', true], ['conferencia', true], ['transcricao_wav', true], ['transcricao_webm', true], ['limpeza', true]])
    expect(ok.conclusao).toContain('Tudo certo')
    expect(ok.custoUsd).toBeGreaterThan(0)
    const audios = gemini.interacoes.map((b) => b.input?.find?.((c: any) => c.type === 'audio')?.mime_type)
    expect(audios).toEqual(['audio/wav', 'audio/webm'])
    expect(gemini.interacoes.every((b) => b.store === false && b.model === 'gemini-3.8-flash' && b.response_format?.schema)).toBe(true)
    expect(Object.keys(gemini.arquivos).every((n) => gemini.apagados.includes(n))).toBe(true)
    // Sem o navegador (CORS) e com o WebM recusado: o servidor segue o teste e aponta as duas coisas.
    gemini.recusarMime = 'audio/webm'
    const ruim = await rodarAutoteste({ erro: 'rede ou CORS até o Google (Failed to fetch)' })
    const porEtapa = Object.fromEntries(ruim.etapas.map((e) => [e.etapa, e]))
    expect(porEtapa.envio_navegador).toMatchObject({ ok: false, detalhe: 'rede ou CORS até o Google (Failed to fetch)' })
    expect(porEtapa.conferencia.ok).toBe(true)
    expect(porEtapa.transcricao_wav.ok).toBe(true)
    expect(porEtapa.transcricao_webm).toMatchObject({ ok: false, detalhe: 'HTTP 400: Unsupported MIME type: audio/webm' })
    expect(ruim.conclusao).toContain('recusa o WebM/Opus')
  })

  it('sala de teste sozinho: "Gerar resumo agora" resume o período gravado, sem esperar os 90 min', async () => {
    const { criarSalaDeTeste } = await import('@/lib/monitorias/reservas')
    const { criarResumoDeTeste, encerrarTesteEGerarResumo } = await import('@/lib/monitorias/resumo/tarefa')
    const agora = Date.now()
    const reserva = await criarSalaDeTeste({ userId: 'admin-1', nome: 'Admin' }, new Date(agora - 10 * 60_000))
    await criarResumoDeTeste(reserva, 'admin-1')
    const id = String(reserva._id)
    // Nada gravado ainda: não há o que resumir.
    await expect(encerrarTesteEGerarResumo(id)).rejects.toMatchObject({ status: 409 })
    await db.collection('monitorias_resumos').updateOne({ _id: id } as any, { $set: { 'vozes.admin-1.consentimento': { aceito: true, em: new Date(), versao: 'v' } } })
    // O admin falou 4 min numa sala de 90 (e não clicou em "Sair").
    await trecho(reserva._id as any, { userId: 'admin-1', papel: 'monitor', nome: 'Admin', seq: 0, inicio: new Date(agora - 6 * 60_000), min: 4, nomeArquivo: 'files/t0' })
    // A transcrição anda durante a aula; o resumo espera o fim agendado (daqui a 80 min).
    expect(await processarTudo()).toEqual(['trecho'])
    expect((await tarefaDe(reserva._id as any))!.status).not.toBe('pronto')
    const r = await encerrarTesteEGerarResumo(id)
    expect(r.trechos).toBe(1)
    expect((await db.collection('monitorias_reservas').findOne({ _id: reserva._id as any }))!.fim.getTime()).toBeLessThanOrEqual(Date.now())
    expect(await processarTudo()).toEqual(['resumo'])
    const t = await tarefaDe(reserva._id as any)
    expect(t!.status).toBe('pronto')
    expect(t!.vozes['admin-1'].saiuEm).toBeTruthy()
    // Cobertura sobre o período gravado (~6 min), não sobre os 90 min da sala.
    expect(t!.cobertura.aulaMs).toBeLessThan(10 * 60_000)
    expect(t!.cobertura.pct).toBeGreaterThan(60)
    // De novo: já está pronto.
    await expect(encerrarTesteEGerarResumo(id)).rejects.toMatchObject({ status: 409 })
  })

  it('"Gerar resumo agora" não vale para aula de verdade', async () => {
    const { encerrarTesteEGerarResumo } = await import('@/lib/monitorias/resumo/tarefa')
    const { reserva, fim } = await aulaQueTerminou()
    await expect(encerrarTesteEGerarResumo(String(reserva._id))).rejects.toMatchObject({ status: 404 })
    const t = await tarefaDe(reserva._id)
    expect(t!.fim.getTime()).toBe(fim.getTime())
    expect(t!.encerradoNoTesteEm).toBeUndefined()
  })

  it('o resumo espera o último trecho de cada voz (avisado na saída)', async () => {
    const { reserva, inicio } = await aulaQueTerminou()
    await trecho(reserva._id, { userId: 'monitor-1', papel: 'monitor', nome: 'Carla', seq: 0, inicio, min: 40, nomeArquivo: 'files/m0' })
    await sairam(reserva._id, { 'monitor-1': 1 }) // o trecho 1 ainda não chegou
    expect(await processarTudo()).toEqual(['trecho'])
    expect((await tarefaDe(reserva._id))!.status).toBe('transcrevendo')
  })

  it('dois processadores ao mesmo tempo: cada trecho é transcrito UMA vez (lease)', async () => {
    const { executarPasso } = await import('@/lib/monitorias/resumo/processador')
    const { reserva, inicio } = await aulaQueTerminou()
    await trecho(reserva._id, { userId: 'monitor-1', papel: 'monitor', nome: 'Carla', seq: 0, inicio, min: 40, nomeArquivo: 'files/m0' })
    const r = await Promise.all([executarPasso(), executarPasso(), executarPasso()])
    expect(r.filter((x) => x.feito === 'trecho')).toHaveLength(1)
    expect(gemini.interacoes.filter((b) => Array.isArray(b.input))).toHaveLength(1)
  })

  it('lease vencido (função que caiu no meio) é retomado; 429 vira nova tentativa com espera, nunca laço', async () => {
    const { reserva, inicio } = await aulaQueTerminou()
    await trecho(reserva._id, { userId: 'monitor-1', papel: 'monitor', nome: 'Carla', seq: 0, inicio, min: 40, nomeArquivo: 'files/m0', status: 'transcrevendo', extra: { lease: { ate: new Date(Date.now() - 1000), dono: 'caiu' } } })
    gemini.falhar429 = 1
    await processarTudo()
    let seg = await db.collection('monitorias_resumos_segmentos').findOne({ seq: 0 })
    expect(seg!.status).toBe('enviado')
    expect(seg!.tentativas).toBe(1)
    expect(seg!.proximaTentativaEm.getTime()).toBeGreaterThan(Date.now())
    expect(gemini.interacoes).toHaveLength(1)
    // A espera passou (a varredura dispara de novo): agora transcreve.
    await db.collection('monitorias_resumos_segmentos').updateOne({ seq: 0 }, { $set: { proximaTentativaEm: new Date(Date.now() - 1000) } })
    await processarTudo()
    seg = await db.collection('monitorias_resumos_segmentos').findOne({ seq: 0 })
    expect(seg!.status).toBe('transcrito')
  })

  it('áudio insuficiente (< 30% da aula) devolve o adicional e não chama o resumo', async () => {
    const { reserva, part, inicio } = await aulaQueTerminou()
    await trecho(reserva._id, { userId: 'monitor-1', papel: 'monitor', nome: 'Carla', seq: 0, inicio, min: 10, nomeArquivo: 'files/m0' })
    await sairam(reserva._id, { 'monitor-1': 0 })
    expect(await processarTudo()).toEqual(['trecho', 'resumo'])
    expect(gemini.interacoes.filter((b) => !Array.isArray(b.input))).toHaveLength(0)
    expect((await tarefaDe(reserva._id))!.status).toBe('cancelado')
    const a = await adicionalDe(part._id)
    expect(a!.status).toBe('reembolsado')
    expect(a!.reembolso.motivo).toContain('16.7%')
    expect(mp.reembolsos[0].valor).toBe(4.95)
  })

  it('aula longa (transcrição acima de 150k tokens) passa por map-reduce: notas por janela e redução final', async () => {
    const { reserva, inicio } = await aulaQueTerminou()
    await trecho(reserva._id, { userId: 'monitor-1', papel: 'monitor', nome: 'Carla', seq: 0, inicio, min: 75, nomeArquivo: 'files/longo-m0' })
    await sairam(reserva._id, { 'monitor-1': 0 })
    const feitos = await processarTudo()
    const parciais = gemini.interacoes.filter((b) => !Array.isArray(b.input) && !b.response_format)
    const finais = gemini.interacoes.filter((b) => !Array.isArray(b.input) && b.response_format)
    expect(parciais.length).toBeGreaterThan(1)
    expect(finais).toHaveLength(1)
    expect(finais[0].input).toContain('### Trecho 1 de')
    expect(feitos.filter((f) => f === 'resumo')).toHaveLength(parciais.length + 1)
    expect((await tarefaDe(reserva._id))!.status).toBe('pronto')
  })

  it('aula que não aconteceu (cancelada) devolve o adicional na hora de resumir', async () => {
    const { reserva, part, inicio } = await aulaQueTerminou()
    await trecho(reserva._id, { userId: 'monitor-1', papel: 'monitor', nome: 'Carla', seq: 0, inicio, min: 40, nomeArquivo: 'files/m0' })
    await sairam(reserva._id, { 'monitor-1': 0 })
    await db.collection('monitorias_reservas').updateOne({ _id: reserva._id }, { $set: { status: 'cancelada_suporte' } })
    await processarTudo()
    expect((await adicionalDe(part._id))!.status).toBe('reembolsado')
    expect((await tarefaDe(reserva._id))!.status).toBe('cancelado')
  })

  it('varredura: falha sem solução em 48 h devolve o adicional; transcrição vencida é apagada; trabalho pendente dispara o processador', async () => {
    const { varrerResumos } = await import('@/lib/monitorias/resumo/varredura')
    const a1 = await aulaQueTerminou()
    await db.collection('monitorias_resumos').updateOne({ _id: String(a1.reserva._id) } as any, { $set: { status: 'falhou', falhouEm: new Date(Date.now() - 49 * 3_600_000) } })
    const a2 = await aulaQueTerminou()
    await trecho(a2.reserva._id, { userId: 'monitor-1', papel: 'monitor', nome: 'Carla', seq: 0, inicio: a2.inicio, min: 40, nomeArquivo: 'files/m9', status: 'transcrito', extra: { frases: [{ t: 0, texto: 'x' }] } })
    await db.collection('monitorias_resumos').updateOne({ _id: String(a2.reserva._id) } as any, { $set: { status: 'pronto', transcricaoExpiraEm: new Date(Date.now() - 1000) } })
    const a3 = await aulaQueTerminou()
    await trecho(a3.reserva._id, { userId: 'monitor-1', papel: 'monitor', nome: 'Carla', seq: 0, inicio: a3.inicio, min: 40, nomeArquivo: 'files/m8' })
    const r = await varrerResumos(new Date(), 'http://localhost')
    expect(r.reembolsos).toBe(1)
    expect((await adicionalDe(a1.part._id))!.status).toBe('reembolsado')
    expect(await db.collection('monitorias_resumos_segmentos').countDocuments({ reservaId: String(a2.reserva._id) })).toBe(0)
    expect(r.disparou).toBe(true)
    expect(disparos.n).toBe(1)
  })

  it('exclusão pelo suporte de aula já dada com resumo pendente: adicional devolvido, nada mais cobrado', async () => {
    const { excluirMonitoriaPeloSuporte } = await import('@/lib/monitorias/reservas')
    const { reserva, part } = await aulaQueTerminou()
    const atual = await db.collection('monitorias_reservas').findOne({ _id: reserva._id })
    const r = await excluirMonitoriaPeloSuporte({ reserva: atual as any, adminId: 'admin-1', motivo: 'Pedido do aluno' })
    expect(r.apagadaDeVez).toBe(false)
    expect((await adicionalDe(part._id))!.status).toBe('reembolsado')
    expect((await tarefaDe(reserva._id))!.status).toBe('cancelado')
    expect((await db.collection('monitorias_reservas').findOne({ _id: reserva._id }))!.excluidaEm).toBeTruthy()
  })
})
