import 'server-only'

import { ObjectId } from 'mongodb'
import type { Collection, Db } from 'mongodb'

import {
  extrairDadosTecnicos,
  extrairErroDaApi,
  type DadosDoNavegador,
  type DadosTecnicos,
  type ErroDaApi,
  type EtapaDaFalha,
  type RequisicaoDoCartao,
} from './recusa-cartao'
import type { PaymentOrder } from '../types'
import type { ProviderOrder } from './types'

/**
 * Registro das falhas de cartão — o "log" do DomineAqui Analytics.
 *
 * Guarda os FATOS de cada falha (o que o Mercado Pago respondeu, o que nós
 * enviamos, o erro da API, o que o navegador viu). A análise — quem decidiu, por
 * que, o que fazer — é calculada na leitura (recusa-cartao.ts), para melhorar
 * junto com o conhecimento sem reescrever o histórico.
 *
 * Quatro caminhos escrevem aqui:
 *  - `resultado`   — o Mercado Pago recusou/cancelou (resposta imediata, webhook,
 *                    polling ou varredura: todos passam por `applyPaymentResult`);
 *  - `criacao`     — a API recusou a CRIAÇÃO do pagamento (token vencido, parcelas...);
 *  - `assinatura`  — idem, na assinatura recorrente;
 *  - `tokenizacao` e `envio` — o que o navegador do comprador viu.
 *
 * NENHUMA função daqui lança: registrar a falha nunca pode derrubar um
 * checkout nem esconder o motivo real do erro.
 */

export const COLECAO_DE_FALHAS_DE_CARTAO = 'card_rejections'

/** Por quanto tempo o registro é guardado (a janela do Analytics é de 12 meses). */
const RETENCAO_SEGUNDOS = 400 * 24 * 60 * 60

export interface RegistroDeFalhaDeCartao {
  _id?: unknown
  etapa: EtapaDaFalha
  origem: 'servidor' | 'navegador'
  orderId?: string
  tipoDoPedido?: string
  userId?: string
  nome?: string
  email?: string
  produto?: string
  valorBase?: number
  valorCobrado?: number
  status?: string
  statusDetail?: string
  tecnico?: DadosTecnicos
  requisicao?: RequisicaoDoCartao
  erro?: ErroDaApi
  navegador?: DadosDoNavegador
  ip?: string
  userAgent?: string
  createdAt: Date
}

let indicesGarantidos = false

/** Uma vez por instância (CLAUDE.md): nada de `createIndex` a cada requisição. */
async function garantirIndices(col: Collection<any>) {
  if (indicesGarantidos) return
  try {
    await Promise.all([
      // TTL e ordenação por data no mesmo índice.
      col.createIndex({ createdAt: 1 }, { expireAfterSeconds: RETENCAO_SEGUNDOS }),
      col.createIndex({ orderId: 1, etapa: 1 }, { sparse: true }),
    ])
    indicesGarantidos = true
  } catch (err) {
    console.error('[recusa-cartao] falha ao garantir índices:', err)
  }
}

/**
 * Tira o que é `undefined`, também dentro de objetos simples: o driver do Mongo
 * grava `undefined` como `null`, e o documento ficaria cheio de campos vazios.
 */
function semIndefinidos<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue
    const simples = v !== null && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype
    out[k] = simples ? semIndefinidos(v as Record<string, unknown>) : v
  }
  return out as Partial<T>
}

/**
 * Grava (ou atualiza) uma falha. Com `orderId`, é um upsert por (pedido, etapa):
 * webhook e polling chegando juntos, ou uma reaplicação, não duplicam a linha.
 */
export async function registrarFalhaDeCartao(
  db: Db,
  doc: Omit<RegistroDeFalhaDeCartao, 'createdAt'>
): Promise<void> {
  try {
    const col = db.collection<RegistroDeFalhaDeCartao>(COLECAO_DE_FALHAS_DE_CARTAO)
    await garantirIndices(col)
    const agora = new Date()
    const dados = semIndefinidos(doc as Record<string, unknown>)
    if (doc.orderId) {
      await col.updateOne(
        { orderId: doc.orderId, etapa: doc.etapa } as any,
        { $set: dados, $setOnInsert: { createdAt: agora } } as any,
        { upsert: true }
      )
    } else {
      await col.insertOne({ ...dados, createdAt: agora } as any)
    }
  } catch (err) {
    console.error('[recusa-cartao] falha ao registrar:', err)
  }
}

const TIPOS_DE_CARTAO = ['credit_card', 'debit_card']

/** Este pagamento foi feito (ou tentado) com cartão? */
export function ehPagamentoDeCartao(order: Pick<PaymentOrder, 'metadata'>, result: Pick<ProviderOrder, 'paymentMethod' | 'raw' | 'requisicao'>): boolean {
  if (result.requisicao || order.metadata?.cartaoRequisicao) return true
  if (result.paymentMethod && TIPOS_DE_CARTAO.includes(result.paymentMethod)) return true
  const tipo = (result.raw as any)?.payment_type_id
  return typeof tipo === 'string' && TIPOS_DE_CARTAO.includes(tipo)
}

/**
 * Registra a recusa/cancelamento de um pedido pago com cartão. Chamado de
 * `applyPaymentResult` na transição para falha — uma vez por pedido.
 */
export async function registrarRecusaDoPedido(
  db: Db,
  order: PaymentOrder,
  result: ProviderOrder
): Promise<void> {
  try {
    if (!ehPagamentoDeCartao(order, result)) return
    const meta = order.metadata || {}
    await registrarFalhaDeCartao(db, {
      etapa: 'resultado',
      origem: 'servidor',
      orderId: String(order._id),
      tipoDoPedido: order.type,
      userId: order.userId,
      nome: order.payerName,
      email: order.payerEmail,
      produto: meta.itemTitle || meta.planName || (order.refId ? String(order.refId) : undefined),
      valorBase: order.baseAmount ?? (typeof meta.baseAmount === 'number' ? meta.baseAmount : undefined),
      valorCobrado: order.amount,
      status: result.status,
      statusDetail: result.statusDetail,
      tecnico: extrairDadosTecnicos(result.raw),
      requisicao: result.requisicao || (meta.cartaoRequisicao as RequisicaoDoCartao | undefined),
    })
  } catch (err) {
    console.error('[recusa-cartao] falha ao registrar a recusa do pedido:', err)
  }
}

/**
 * Registra a falha na CRIAÇÃO do pagamento: a API do Mercado Pago recusou o
 * pedido por validação (token vencido, parcelas, CPF, credencial...). Aqui não
 * há pagamento, então os dados vêm do erro e do que nós enviamos.
 */
export async function registrarFalhaNaCriacao(
  db: Db,
  input: { orderId: string; err: unknown; requisicao?: RequisicaoDoCartao }
): Promise<void> {
  try {
    let order: any = null
    try {
      order = await db.collection('payment_orders').findOne({ _id: new ObjectId(input.orderId) as any })
    } catch {
      /* sem o pedido o registro sai só com o erro */
    }
    const meta = order?.metadata || {}
    await registrarFalhaDeCartao(db, {
      etapa: 'criacao',
      origem: 'servidor',
      orderId: input.orderId,
      tipoDoPedido: order?.type,
      userId: order?.userId,
      nome: order?.payerName,
      email: order?.payerEmail,
      produto: meta.itemTitle || meta.planName || (order?.refId ? String(order.refId) : undefined),
      valorBase: order?.baseAmount ?? (typeof meta.baseAmount === 'number' ? meta.baseAmount : undefined),
      valorCobrado: order?.amount,
      erro: extrairErroDaApi(input.err),
      requisicao: input.requisicao,
    })
  } catch (err) {
    console.error('[recusa-cartao] falha ao registrar a falha de criação:', err)
  }
}
