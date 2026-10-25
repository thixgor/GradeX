import { ObjectId, type Db } from 'mongodb'
import { invalidarCacheDeServidor, memoizarPorTempo } from '@/lib/cache-de-servidor'
import type { PaymentOrder } from '@/lib/types'
import {
  centavos,
  cicloDeRepasse,
  comissaoSobreOProduto,
  dividirVenda,
  nomeDiscreto,
  normalizarCodigo,
  codigoValido,
  normalizarConfig,
  saudeDoCupom,
  semanaDe,
  taxa,
  ultimasSemanas,
  type ChavePix,
  type ConfigDoPrograma,
  type DescontoDaVenda,
  type SaudeDoCupom,
  type StatusDaVenda,
  type StatusDoEmbaixador,
  type TipoDeEmbaixador,
} from './regras'

/**
 * Programa de Embaixadores — o lado do banco.
 *
 * Coleções:
 *  - `embaixadores`: quem é embaixador, de que tipo, com que comissão, o código
 *    (que é o cupom e o fim do link) e a chave PIX.
 *  - `embaixador_indicacoes`: cada conta criada por quem chegou pelo link.
 *  - `embaixador_vendas`: cada pedido aprovado que é do embaixador, já com a
 *    divisão gravada. A comissão é uma FOTO do momento da venda: mudar a
 *    porcentagem de alguém vale daí para frente, nunca reescreve o passado.
 *  - `embaixador_repasses`: os PIX que o admin fez à mão. Nada é repassado
 *    automaticamente; o saldo é "comissões confirmadas − repasses".
 *  - `embaixador_cliques`: visitas ao link, por dia.
 *  - `embaixadores_config`: a configuração do programa (um documento só).
 *
 * As vendas nascem em `applyPaymentResult` (lib/payments/effects.ts), na mesma
 * transição que aprova o cupom, e são estornadas na mesma que o devolve. O
 * botão "Sincronizar" do admin refaz a mesma conta sobre o histórico.
 */

export const COLECAO_EMBAIXADORES = 'embaixadores'
export const COLECAO_INDICACOES = 'embaixador_indicacoes'
export const COLECAO_VENDAS = 'embaixador_vendas'
export const COLECAO_REPASSES = 'embaixador_repasses'
export const COLECAO_CLIQUES = 'embaixador_cliques'
const COLECAO_CONFIG = 'embaixadores_config'
const ID_DA_CONFIG = 'programa'

export interface Embaixador {
  _id?: ObjectId
  userId: string
  nome: string
  email: string
  faculdade?: string
  periodo?: string
  instagram?: string
  telefone?: string
  tipo: TipoDeEmbaixador
  /** Percentual sobre a nossa parte (0–100). Só vale para remunerados. */
  comissaoPercent: number
  descontoCupom: number
  codigo: string
  couponId?: string
  status: StatusDoEmbaixador
  pix?: ChavePix & { atualizadoEm: Date }
  observacoes?: string
  criadoEm: Date
  atualizadoEm: Date
  criadoPor?: string
  encerradoEm?: Date
}

export interface IndicacaoDoEmbaixador {
  _id?: ObjectId
  embaixadorId: string
  codigo: string
  userId: string
  nome: string
  email: string
  criadoEm: Date
}

export interface VendaDoEmbaixador {
  _id?: ObjectId
  orderId: string
  embaixadorId: string
  /** Que desconto o comprador levou (o cupom é sempre o do embaixador). */
  desconto: DescontoDaVenda
  tipoPedido: string
  produto: string
  userId?: string
  compradorNome: string
  compradorEmail: string
  valor: number
  percentualSocio: number
  valorSocio: number
  nossaParteBruta: number
  remunerado: boolean
  comissaoPercent: number
  comissao: number
  status: StatusDaVenda
  pagoEm: Date
  criadoEm: Date
  estornadaEm?: Date
  motivoEstorno?: string
}

export interface RepasseDoEmbaixador {
  _id?: ObjectId
  embaixadorId: string
  valor: number
  pagoEm: Date
  observacao?: string
  chavePix?: string
  /** ID da transação PIX (E2E) — o comprovante, que o embaixador confere no extrato. */
  idTransacao?: string
  /** Mês das comissões pagas ("AAAA-MM"). */
  referencia?: string
  registradoPor: string
  registradoPorNome?: string
  criadoEm: Date
}

interface CliquesDoDia {
  embaixadorId: string
  dia: string
  cliques: number
  visitantes: number
}

let indices: Promise<unknown> | null = null

/** Índices do programa, uma vez por instância (ver CLAUDE.md). */
export function garantirIndicesDoPrograma(db: Db) {
  if (!indices) {
    indices = Promise.all([
      db.collection(COLECAO_EMBAIXADORES).createIndex({ codigo: 1 }, { unique: true }),
      db.collection(COLECAO_EMBAIXADORES).createIndex({ userId: 1 }, { unique: true }),
      db.collection(COLECAO_EMBAIXADORES).createIndex({ couponId: 1 }, { sparse: true }),
      db.collection(COLECAO_INDICACOES).createIndex({ userId: 1 }, { unique: true }),
      db.collection(COLECAO_INDICACOES).createIndex({ embaixadorId: 1, criadoEm: -1 }),
      db.collection(COLECAO_VENDAS).createIndex({ orderId: 1 }, { unique: true }),
      db.collection(COLECAO_VENDAS).createIndex({ embaixadorId: 1, pagoEm: -1 }),
      db.collection(COLECAO_REPASSES).createIndex({ embaixadorId: 1, pagoEm: -1 }),
      db.collection(COLECAO_REPASSES).createIndex({ idTransacao: 1 }, { unique: true, sparse: true }),
      db.collection(COLECAO_CLIQUES).createIndex({ embaixadorId: 1, dia: 1 }, { unique: true }),
      db.collection('payment_orders').createIndex({ 'metadata.embaixadorCupomId': 1 }, { sparse: true }),
    ]).catch(() => {
      indices = null
    })
  }
  return indices
}

// ─── Configuração ────────────────────────────────────────────────────────────

const CHAVE_DA_CONFIG = 'embaixadores:config'

export function lerConfigDoPrograma(db: Db): Promise<ConfigDoPrograma> {
  return memoizarPorTempo(CHAVE_DA_CONFIG, 30_000, async () => {
    const doc = await db.collection(COLECAO_CONFIG).findOne({ _id: ID_DA_CONFIG as any })
    return normalizarConfig(doc as Partial<ConfigDoPrograma> | null)
  })
}

export async function salvarConfigDoPrograma(db: Db, entrada: Partial<ConfigDoPrograma>, por: string) {
  const config = normalizarConfig(entrada)
  await db.collection(COLECAO_CONFIG).updateOne(
    { _id: ID_DA_CONFIG as any },
    { $set: { ...config, atualizadoEm: new Date(), atualizadoPor: por } },
    { upsert: true },
  )
  invalidarCacheDeServidor(CHAVE_DA_CONFIG)
  return config
}

// ─── Leitura de embaixador ───────────────────────────────────────────────────

/**
 * Embaixador ativo pelo código, memorizado por 30 s: é a pergunta do clique no
 * link e do chamativo no checkout, iguais para todo mundo.
 */
export function embaixadorAtivoPorCodigo(db: Db, codigoBruto: string): Promise<Embaixador | null> {
  const codigo = normalizarCodigo(codigoBruto)
  if (!codigoValido(codigo)) return Promise.resolve(null)
  return memoizarPorTempo(`embaixadores:codigo:${codigo}`, 30_000, () =>
    db.collection<Embaixador>(COLECAO_EMBAIXADORES).findOne({ codigo, status: 'ativo' }),
  )
}

export function esquecerCodigoEmCache(codigo: string) {
  invalidarCacheDeServidor(`embaixadores:codigo:${codigo}`)
}

export function linkDoEmbaixador(codigo: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://domineaqui.com.br').replace(/\/+$/, '')
  return `${base}/e/${codigo}`
}

// ─── Cliques ─────────────────────────────────────────────────────────────────

export async function registrarClique(db: Db, embaixadorId: string, dia: string, novoVisitante: boolean) {
  await db.collection<CliquesDoDia>(COLECAO_CLIQUES).updateOne(
    { embaixadorId, dia },
    { $inc: { cliques: 1, visitantes: novoVisitante ? 1 : 0 } },
    { upsert: true },
  )
}

// ─── Indicação no cadastro ───────────────────────────────────────────────────

/**
 * Prende a conta recém-criada ao embaixador do link (cookie `da_embaixador`).
 *
 * Chamado pelas três portas de criação de conta — e-mail e senha, Google e a
 * conta criada depois da compra sem login. Nunca lança: indicação é enfeite do
 * cadastro, e um erro aqui não pode impedir ninguém de entrar.
 */
export async function vincularIndicacaoNoCadastro(
  db: Db,
  codigoDoCookie: string | undefined | null,
  conta: { userId: string; nome: string; email: string },
): Promise<void> {
  try {
    if (!codigoDoCookie || !ObjectId.isValid(conta.userId)) return
    const embaixador = await embaixadorAtivoPorCodigo(db, codigoDoCookie)
    if (!embaixador?._id) return
    // Ninguém indica a si mesmo (conta nova com o e-mail do embaixador).
    if (embaixador.userId === conta.userId) return
    if (embaixador.email && embaixador.email.toLowerCase() === String(conta.email || '').toLowerCase()) return

    const embaixadorId = String(embaixador._id)
    const agora = new Date()
    await garantirIndicesDoPrograma(db)
    await Promise.all([
      db.collection('users').updateOne(
        { _id: new ObjectId(conta.userId), embaixadorIndicacao: { $exists: false } } as any,
        { $set: { embaixadorIndicacao: { embaixadorId, codigo: embaixador.codigo, em: agora } } },
      ),
      db.collection<IndicacaoDoEmbaixador>(COLECAO_INDICACOES).updateOne(
        { userId: conta.userId },
        {
          $setOnInsert: {
            embaixadorId,
            codigo: embaixador.codigo,
            userId: conta.userId,
            nome: conta.nome || '',
            email: conta.email || '',
            criadoEm: agora,
          },
        },
        { upsert: true },
      ),
    ])
  } catch (erro) {
    console.error('[embaixadores] falha ao vincular indicação:', erro)
  }
}

// ─── Vendas ──────────────────────────────────────────────────────────────────

/** Pedidos que são produto da plataforma. Doação, rifa, loja física e monitoria não entram. */
const TIPOS_QUE_CONTAM = new Set(['plan', 'material', 'product', 'subscription'])

function valorDoProduto(order: PaymentOrder): number {
  if (typeof order.baseAmount === 'number' && order.baseAmount > 0) return centavos(order.baseAmount)
  return centavos(Number(order.amount || 0) - Number(order.feeAmount || 0))
}

function nomeDoProduto(order: PaymentOrder): string {
  const m = order.metadata || {}
  const nome = m.itemTitle || m.planName || m.productTitle || m.title || m.packageTitle
  if (nome) return String(nome).slice(0, 140)
  if (order.type === 'plan' || order.type === 'subscription') return 'Assinatura Plus+'
  if (order.type === 'product') return 'Manual Clínico'
  return 'Material'
}

/**
 * O cupom de embaixador deste pedido, e que desconto o comprador levou.
 *
 * A venda é do embaixador SÓ quando o cupom dele foi usado — é o código
 * digitado que a equipe consegue conferir. Duas formas de o pedido carregar o
 * cupom:
 *  - ele descontou: `metadata.couponId` (ou o resgate do cupom);
 *  - ele foi aplicado, mas outro desconto foi maior e venceu (PROUNI/FIES,
 *    lote): `metadata.embaixadorCupomId` (lib/embaixadores/atribuicao.ts).
 *    O bolsista paga o menor preço e a venda continua sendo de quem indicou.
 *
 * O link do embaixador não dá venda sozinho: ele conta visita e cadastro e
 * deixa o cupom pronto no checkout.
 */
async function cupomDoPedido(db: Db, order: PaymentOrder): Promise<{ couponId: string; desconto: DescontoDaVenda } | null> {
  const m = order.metadata || {}
  if (m.couponId) return { couponId: String(m.couponId), desconto: 'cupom' }
  if (m.embaixadorCupomId) {
    const programa = m.prouniProgram === 'fies' ? 'fies' : m.prouniProgram ? 'prouni' : 'lote'
    return { couponId: String(m.embaixadorCupomId), desconto: programa }
  }
  const resgate = await db
    .collection('coupon_redemptions')
    .findOne({ orderId: String(order._id), status: { $in: ['approved', 'reserved'] } }, { projection: { couponId: 1 } })
  return resgate?.couponId ? { couponId: String(resgate.couponId), desconto: 'cupom' } : null
}

async function atribuirPedido(
  db: Db,
  order: PaymentOrder,
): Promise<{ embaixador: Embaixador; desconto: DescontoDaVenda } | null> {
  const cupom = await cupomDoPedido(db, order)
  if (!cupom) return null
  const embaixador = await db.collection<Embaixador>(COLECAO_EMBAIXADORES).findOne({ couponId: cupom.couponId })
  return embaixador ? { embaixador, desconto: cupom.desconto } : null
}

/**
 * Grava a venda do embaixador para um pedido aprovado. Idempotente (índice
 * único em `orderId`) e silenciosa: nunca derruba o fluxo do pagamento.
 *
 * `historico` é o caminho da sincronização: aceita embaixador que já não está
 * ativo (a venda aconteceu quando ele estava) e usa a data do pagamento.
 */
export async function registrarVendaDoPedido(
  db: Db,
  order: PaymentOrder,
  opcoes: { historico?: boolean; config?: ConfigDoPrograma } = {},
): Promise<'registrada' | 'ignorada' | 'ja_existia'> {
  try {
    if (!order?._id || !TIPOS_QUE_CONTAM.has(order.type)) return 'ignorada'
    const orderId = String(order._id)
    const vendas = db.collection<VendaDoEmbaixador>(COLECAO_VENDAS)
    if (await vendas.findOne({ orderId }, { projection: { _id: 1 } })) return 'ja_existia'

    const atribuicao = await atribuirPedido(db, order)
    if (!atribuicao?.embaixador._id) return 'ignorada'
    const { embaixador, desconto } = atribuicao
    const config = opcoes.config || (await lerConfigDoPrograma(db))
    if (!opcoes.historico && embaixador.status !== 'ativo') return 'ignorada'
    // Compra do próprio embaixador com o próprio cupom não é venda dele.
    if (order.userId && order.userId === embaixador.userId) return 'ignorada'
    if (order.payerEmail && embaixador.email && order.payerEmail.toLowerCase() === embaixador.email.toLowerCase()) {
      return 'ignorada'
    }

    const valor = valorDoProduto(order)
    if (valor <= 0) return 'ignorada'
    const remunerado = embaixador.tipo === 'remunerado'
    const comissaoPercent = remunerado ? Number(embaixador.comissaoPercent || 0) : 0
    const divisao = dividirVenda(valor, config.percentualSocio, comissaoPercent)
    const pagoEm = order.paidAt ? new Date(order.paidAt) : new Date()

    await garantirIndicesDoPrograma(db)
    const resultado = await vendas.updateOne(
      { orderId },
      {
        $setOnInsert: {
          orderId,
          embaixadorId: String(embaixador._id),
          desconto,
          tipoPedido: order.type,
          produto: nomeDoProduto(order),
          ...(order.userId ? { userId: order.userId } : {}),
          compradorNome: order.payerName || '',
          compradorEmail: (order.payerEmail || '').toLowerCase(),
          valor: divisao.valor,
          percentualSocio: config.percentualSocio,
          valorSocio: divisao.valorSocio,
          nossaParteBruta: divisao.nossaParteBruta,
          remunerado,
          comissaoPercent,
          comissao: divisao.comissao,
          status: 'confirmada',
          pagoEm,
          criadoEm: opcoes.historico ? pagoEm : new Date(),
        },
      },
      { upsert: true },
    )
    return resultado.upsertedCount > 0 ? 'registrada' : 'ja_existia'
  } catch (erro) {
    console.error('[embaixadores] falha ao registrar venda:', erro)
    return 'ignorada'
  }
}

/** Estorno ou chargeback: a venda sai da conta e a comissão deixa de ser devida. */
export async function estornarVendaDoPedido(db: Db, orderId: string, motivo: string): Promise<void> {
  try {
    await db.collection<VendaDoEmbaixador>(COLECAO_VENDAS).updateOne(
      { orderId, status: 'confirmada' },
      { $set: { status: 'estornada', estornadaEm: new Date(), motivoEstorno: motivo } },
    )
  } catch (erro) {
    console.error('[embaixadores] falha ao estornar venda:', erro)
  }
}

const TETO_DA_SINCRONIA = 3000

/**
 * Refaz a atribuição sobre o histórico de um embaixador: pedidos pagos com o
 * cupom dele — os que descontaram e os em que o cupom ficou registrado porque
 * outro desconto venceu. Usado quando um cupom antigo vira cupom de
 * embaixador, ou para conferir que nada escapou.
 */
export async function sincronizarVendas(db: Db, embaixador: Embaixador) {
  const embaixadorId = String(embaixador._id)
  const config = await lerConfigDoPrograma(db)
  const resgates = embaixador.couponId
    ? await db
        .collection('coupon_redemptions')
        .find({ couponId: embaixador.couponId, status: 'approved', orderId: { $exists: true } }, { projection: { orderId: 1 } })
        .limit(TETO_DA_SINCRONIA)
        .toArray()
    : []

  const idsDoCupom = resgates.map((r) => String(r.orderId)).filter((id) => ObjectId.isValid(id))
  const filtros: any[] = []
  if (idsDoCupom.length > 0) filtros.push({ _id: { $in: idsDoCupom.map((id) => new ObjectId(id)) } })
  if (embaixador.couponId) filtros.push({ 'metadata.embaixadorCupomId': embaixador.couponId })

  let registradas = 0
  if (filtros.length > 0) {
    const pedidos = await db
      .collection<PaymentOrder>('payment_orders')
      .find({ status: 'approved', type: { $in: [...TIPOS_QUE_CONTAM] as any }, $or: filtros })
      .sort({ paidAt: 1 })
      .limit(TETO_DA_SINCRONIA)
      .toArray()
    for (const pedido of pedidos) {
      const r = await registrarVendaDoPedido(db, pedido, { historico: true, config })
      if (r === 'registrada') registradas++
    }
  }

  // Vendas que ficaram confirmadas aqui mas foram estornadas no Mercado Pago.
  const confirmadas = await db
    .collection<VendaDoEmbaixador>(COLECAO_VENDAS)
    .find({ embaixadorId, status: 'confirmada' }, { projection: { orderId: 1 } })
    .limit(TETO_DA_SINCRONIA)
    .toArray()
  const idsConfirmados = confirmadas.map((v) => v.orderId).filter((id) => ObjectId.isValid(id))
  let estornadas = 0
  if (idsConfirmados.length > 0) {
    const devolvidos = await db
      .collection<PaymentOrder>('payment_orders')
      .find(
        { _id: { $in: idsConfirmados.map((id) => new ObjectId(id)) as any }, status: { $in: ['refunded', 'charged_back'] } },
        { projection: { _id: 1, status: 1 } },
      )
      .toArray()
    for (const pedido of devolvidos) {
      await estornarVendaDoPedido(db, String(pedido._id), pedido.status)
      estornadas++
    }
  }

  return { registradas, estornadas }
}

// ─── Painel ──────────────────────────────────────────────────────────────────

export type VisaoDoPainel = 'admin' | 'embaixador'

export interface PainelDoEmbaixador {
  embaixador: {
    id: string
    userId: string
    nome: string
    email?: string
    faculdade: string
    periodo: string
    instagram: string
    telefone?: string
    tipo: TipoDeEmbaixador
    comissaoPercent: number
    comissaoSobreProduto: number
    status: StatusDoEmbaixador
    codigo: string
    link: string
    cupom: { codigo: string; desconto: number; ativo: boolean; existe: boolean }
    pix: (ChavePix & { atualizadoEm: string }) | null
    observacoes?: string
    criadoEm: string
    encerradoEm: string | null
  }
  programa: {
    percentualSocio?: number
    diasParaCupomParado: number
    diaDoRepasse: number
  }
  /**
   * O repasse mensal: o que está liberado (vendas de meses já fechados, menos
   * o que foi pago) e o que ainda acumula no mês corrente.
   */
  repasse: {
    liberado: number
    mesFechado: string
    prazoDoLiberado: string | null
    acumulandoNoMes: number
    mesAtual: string
    prazoDoMesAtual: string
  }
  totais: {
    cliques: number
    visitantes: number
    cadastros: number
    indicadosQueCompraram: number
    compradores: number
    compras: number
    /** Vendas em que o comprador levou PROUNI/FIES (o cupom ficou registrado). */
    comprasComBeneficio: number
    estornos: number
    receita: number
    ticketMedio: number
    comissaoTotal: number
    repassado: number
    aReceber: number
    valorSocio?: number
    nossaParteLiquida?: number
    conversaoCadastro: number
    conversaoCompra: number
  }
  saude: { saude: SaudeDoCupom; diasSemVenda: number | null; ultimaVendaEm: string | null }
  ranking: { posicao: number; de: number }
  series: Array<{ semana: string; visitantes: number; cadastros: number; compras: number; receita: number }>
  topProdutos: Array<{ produto: string; compras: number; receita: number }>
  indicados: Array<{ id: string; nome: string; email?: string; criadoEm: string; comprou: boolean; totalGasto: number }>
  vendas: Array<{
    id: string
    orderId?: string
    pagoEm: string
    comprador: string
    compradorEmail?: string
    produto: string
    desconto: DescontoDaVenda
    valor: number
    valorSocio?: number
    nossaParteBruta?: number
    comissaoPercent: number
    comissao: number
    status: StatusDaVenda
  }>
  repasses: Array<{
    id: string
    valor: number
    pagoEm: string
    observacao: string
    chavePix: string
    idTransacao: string
    referencia: string
  }>
}

const iso = (d?: Date | string | null) => (d ? new Date(d).toISOString() : null)

/**
 * Tudo o que o painel mostra, numa ida (paralela) ao banco.
 *
 * A visão do embaixador é recortada aqui, no servidor: sem e-mail de quem ele
 * indicou, sem sobrenome, sem a divisão com o sócio. A tela não esconde nada —
 * o que não é dele simplesmente não sai daqui.
 */
export async function montarPainel(db: Db, embaixador: Embaixador, visao: VisaoDoPainel): Promise<PainelDoEmbaixador> {
  const embaixadorId = String(embaixador._id)
  const admin = visao === 'admin'
  const semanas = ultimasSemanas(12)
  const inicioDaSerie = new Date(`${semanas[0]}T00:00:00-03:00`)
  const diaInicial = semanas[0]

  const [config, cupom, vendas, indicacoes, repasses, cliquesTotais, cliquesDaSerie, ranking, ativos] = await Promise.all([
    lerConfigDoPrograma(db),
    embaixador.couponId && ObjectId.isValid(embaixador.couponId)
      ? db.collection('coupons').findOne({ _id: new ObjectId(embaixador.couponId) }, { projection: { isActive: 1, discountValue: 1, codeNormalized: 1 } })
      : Promise.resolve(null),
    db.collection<VendaDoEmbaixador>(COLECAO_VENDAS).find({ embaixadorId }).sort({ pagoEm: -1 }).limit(5000).toArray(),
    db
      .collection<IndicacaoDoEmbaixador>(COLECAO_INDICACOES)
      .find({ embaixadorId })
      .sort({ criadoEm: -1 })
      .limit(5000)
      .toArray(),
    db.collection<RepasseDoEmbaixador>(COLECAO_REPASSES).find({ embaixadorId }).sort({ pagoEm: -1 }).limit(500).toArray(),
    db
      .collection<CliquesDoDia>(COLECAO_CLIQUES)
      .aggregate([
        { $match: { embaixadorId } },
        { $group: { _id: null, cliques: { $sum: '$cliques' }, visitantes: { $sum: '$visitantes' } } },
      ])
      .toArray(),
    db.collection<CliquesDoDia>(COLECAO_CLIQUES).find({ embaixadorId, dia: { $gte: diaInicial } }).toArray(),
    db
      .collection<VendaDoEmbaixador>(COLECAO_VENDAS)
      .aggregate([
        { $match: { status: 'confirmada' } },
        { $group: { _id: '$embaixadorId', compras: { $sum: 1 } } },
      ])
      .toArray(),
    db.collection(COLECAO_EMBAIXADORES).countDocuments({ status: 'ativo' }),
  ])

  const confirmadas = vendas.filter((v) => v.status === 'confirmada')
  const chaveDoComprador = (v: VendaDoEmbaixador) => v.userId || v.compradorEmail || v.orderId
  const compradores = new Set(confirmadas.map(chaveDoComprador))
  const receita = centavos(confirmadas.reduce((s, v) => s + v.valor, 0))
  const comissaoTotal = centavos(confirmadas.reduce((s, v) => s + v.comissao, 0))
  const repassado = centavos(repasses.reduce((s, r) => s + r.valor, 0))
  const ciclo = cicloDeRepasse(new Date(), config.diaDoRepasse)
  const comissaoDeMesesFechados = centavos(
    confirmadas.filter((v) => new Date(v.pagoEm) < ciclo.inicioDoMesAtual).reduce((s, v) => s + v.comissao, 0),
  )
  const gastoPorUsuario = new Map<string, number>()
  for (const v of confirmadas) {
    if (v.userId) gastoPorUsuario.set(v.userId, centavos((gastoPorUsuario.get(v.userId) || 0) + v.valor))
  }
  const indicadosQueCompraram = indicacoes.filter((i) => gastoPorUsuario.has(i.userId)).length
  const visitantes = Number(cliquesTotais[0]?.visitantes || 0)

  // Séries semanais
  const porSemana = new Map(semanas.map((s) => [s, { semana: s, visitantes: 0, cadastros: 0, compras: 0, receita: 0 }]))
  for (const c of cliquesDaSerie) {
    const linha = porSemana.get(semanaDe(new Date(`${c.dia}T12:00:00-03:00`)))
    if (linha) linha.visitantes += c.visitantes
  }
  for (const i of indicacoes) {
    if (i.criadoEm < inicioDaSerie) break
    const linha = porSemana.get(semanaDe(new Date(i.criadoEm)))
    if (linha) linha.cadastros++
  }
  for (const v of confirmadas) {
    if (v.pagoEm < inicioDaSerie) continue
    const linha = porSemana.get(semanaDe(new Date(v.pagoEm)))
    if (linha) {
      linha.compras++
      linha.receita = centavos(linha.receita + v.valor)
    }
  }

  // Produtos que mais saíram
  const porProduto = new Map<string, { produto: string; compras: number; receita: number }>()
  for (const v of confirmadas) {
    const p = porProduto.get(v.produto) || { produto: v.produto, compras: 0, receita: 0 }
    p.compras++
    p.receita = centavos(p.receita + v.valor)
    porProduto.set(v.produto, p)
  }

  // Posição entre os que já venderam alguma coisa
  const minhas = confirmadas.length
  const acima = ranking.filter((r) => r._id !== embaixadorId && r.compras > minhas).length

  const ultimaVenda = confirmadas[0]?.pagoEm || null
  const saude = saudeDoCupom({
    ultimaVendaEm: ultimaVenda,
    entrouEm: embaixador.criadoEm,
    diasParaParado: config.diasParaCupomParado,
  })

  const limiteDeLista = admin ? 500 : 100

  return {
    embaixador: {
      id: embaixadorId,
      userId: embaixador.userId,
      nome: embaixador.nome,
      ...(admin ? { email: embaixador.email, telefone: embaixador.telefone || '' } : {}),
      faculdade: embaixador.faculdade || '',
      periodo: embaixador.periodo || '',
      instagram: embaixador.instagram || '',
      tipo: embaixador.tipo,
      comissaoPercent: embaixador.tipo === 'remunerado' ? embaixador.comissaoPercent : 0,
      comissaoSobreProduto:
        embaixador.tipo === 'remunerado' ? comissaoSobreOProduto(config.percentualSocio, embaixador.comissaoPercent) : 0,
      status: embaixador.status,
      codigo: embaixador.codigo,
      link: linkDoEmbaixador(embaixador.codigo),
      cupom: {
        codigo: cupom?.codeNormalized || embaixador.codigo,
        desconto: Number(cupom?.discountValue ?? embaixador.descontoCupom ?? 0),
        ativo: cupom?.isActive !== false && !!cupom,
        existe: !!cupom,
      },
      pix: embaixador.pix ? { ...embaixador.pix, atualizadoEm: iso(embaixador.pix.atualizadoEm) || '' } : null,
      ...(admin ? { observacoes: embaixador.observacoes || '' } : {}),
      criadoEm: iso(embaixador.criadoEm) || '',
      encerradoEm: iso(embaixador.encerradoEm),
    },
    programa: {
      ...(admin ? { percentualSocio: config.percentualSocio } : {}),
      diasParaCupomParado: config.diasParaCupomParado,
      diaDoRepasse: config.diaDoRepasse,
    },
    repasse: {
      // Pode ficar negativo: um estorno depois do pagamento é compensado no
      // próximo repasse.
      liberado: centavos(comissaoDeMesesFechados - repassado),
      mesFechado: ciclo.mesFechado,
      prazoDoLiberado: iso(ciclo.prazoDoFechado),
      acumulandoNoMes: centavos(comissaoTotal - comissaoDeMesesFechados),
      mesAtual: ciclo.mesAtual,
      prazoDoMesAtual: iso(ciclo.prazoDoAtual) || '',
    },
    totais: {
      cliques: Number(cliquesTotais[0]?.cliques || 0),
      visitantes,
      cadastros: indicacoes.length,
      indicadosQueCompraram,
      compradores: compradores.size,
      compras: confirmadas.length,
      comprasComBeneficio: confirmadas.filter((v) => v.desconto === 'prouni' || v.desconto === 'fies').length,
      estornos: vendas.length - confirmadas.length,
      receita,
      ticketMedio: confirmadas.length ? centavos(receita / confirmadas.length) : 0,
      comissaoTotal,
      repassado,
      aReceber: centavos(comissaoTotal - repassado),
      ...(admin
        ? {
            valorSocio: centavos(confirmadas.reduce((s, v) => s + v.valorSocio, 0)),
            nossaParteLiquida: centavos(confirmadas.reduce((s, v) => s + v.nossaParteBruta - v.comissao, 0)),
          }
        : {}),
      conversaoCadastro: taxa(indicacoes.length, visitantes),
      conversaoCompra: taxa(indicadosQueCompraram, indicacoes.length),
    },
    saude: { ...saude, ultimaVendaEm: iso(ultimaVenda) },
    ranking: { posicao: acima + 1, de: Math.max(ativos, acima + 1) },
    series: semanas.map((s) => porSemana.get(s)!),
    topProdutos: [...porProduto.values()].sort((a, b) => b.receita - a.receita).slice(0, 6),
    indicados: indicacoes.slice(0, limiteDeLista).map((i) => ({
      id: String(i._id),
      nome: admin ? i.nome || 'Sem nome' : nomeDiscreto(i.nome),
      ...(admin ? { email: i.email } : {}),
      criadoEm: iso(i.criadoEm) || '',
      comprou: gastoPorUsuario.has(i.userId),
      totalGasto: gastoPorUsuario.get(i.userId) || 0,
    })),
    vendas: vendas.slice(0, limiteDeLista).map((v) => ({
      id: String(v._id),
      ...(admin ? { orderId: v.orderId, compradorEmail: v.compradorEmail, valorSocio: v.valorSocio, nossaParteBruta: v.nossaParteBruta } : {}),
      pagoEm: iso(v.pagoEm) || '',
      comprador: admin ? v.compradorNome || v.compradorEmail || 'Comprador' : nomeDiscreto(v.compradorNome),
      produto: v.produto,
      // Vendas gravadas antes de `desconto` existir eram todas de cupom.
      desconto: v.desconto || 'cupom',
      valor: v.valor,
      comissaoPercent: v.comissaoPercent,
      comissao: v.comissao,
      status: v.status,
    })),
    repasses: repasses.map((r) => ({
      id: String(r._id),
      valor: r.valor,
      pagoEm: iso(r.pagoEm) || '',
      observacao: r.observacao || '',
      chavePix: r.chavePix || '',
      idTransacao: r.idTransacao || '',
      referencia: r.referencia || '',
    })),
  }
}

/** Números de todos os embaixadores de uma vez, para a lista do admin. */
/** `inicioDoMesAtual` separa a comissão já liberada (meses fechados) da que ainda acumula. */
export async function resumoDeTodos(db: Db, inicioDoMesAtual: Date) {
  const [embaixadores, vendas, indicacoes, repasses, cliques] = await Promise.all([
    db.collection<Embaixador>(COLECAO_EMBAIXADORES).find({}).sort({ criadoEm: -1 }).limit(1000).toArray(),
    db
      .collection(COLECAO_VENDAS)
      .aggregate([
        { $match: { status: 'confirmada' } },
        {
          $group: {
            _id: '$embaixadorId',
            compras: { $sum: 1 },
            receita: { $sum: '$valor' },
            comissao: { $sum: '$comissao' },
            comissaoFechada: { $sum: { $cond: [{ $lt: ['$pagoEm', inicioDoMesAtual] }, '$comissao', 0] } },
            valorSocio: { $sum: '$valorSocio' },
            nossaParteBruta: { $sum: '$nossaParteBruta' },
            ultimaVenda: { $max: '$pagoEm' },
            compradores: { $addToSet: { $ifNull: ['$userId', '$compradorEmail'] } },
          },
        },
        { $project: { compras: 1, receita: 1, comissao: 1, comissaoFechada: 1, valorSocio: 1, nossaParteBruta: 1, ultimaVenda: 1, compradores: { $size: '$compradores' } } },
      ])
      .toArray(),
    db.collection(COLECAO_INDICACOES).aggregate([{ $group: { _id: '$embaixadorId', total: { $sum: 1 } } }]).toArray(),
    db.collection(COLECAO_REPASSES).aggregate([{ $group: { _id: '$embaixadorId', total: { $sum: '$valor' } } }]).toArray(),
    db.collection(COLECAO_CLIQUES).aggregate([{ $group: { _id: '$embaixadorId', visitantes: { $sum: '$visitantes' } } }]).toArray(),
  ])
  return {
    embaixadores,
    vendas: new Map(vendas.map((v) => [String(v._id), v])),
    indicacoes: new Map(indicacoes.map((i) => [String(i._id), Number(i.total || 0)])),
    repasses: new Map(repasses.map((r) => [String(r._id), Number(r.total || 0)])),
    cliques: new Map(cliques.map((c) => [String(c._id), Number(c.visitantes || 0)])),
  }
}
