import 'server-only'

import { ObjectId } from 'mongodb'
import type { Db } from 'mongodb'

import { getPaymentProvider } from './index'
import { applyPaymentResult, concluirEfeitosInterrompidos, efeitosRepetiveis } from './effects'
import { findPaymentForOrder } from './provider-failure'
import { COLECAO_DE_VARREDURAS } from './sweep'
import type { ProviderOrder } from './types'
import type { PaymentOrder, WebhookEventRecord } from '../types'

/**
 * Verificação manual de pedidos pelo admin (aba Analytics → Pedidos).
 *
 * Diferente do "Aprovar manualmente", aqui nada é forçado: o pedido é
 * conferido no Mercado Pago e recebe o estado que o MP informar — aprovado,
 * recusado ou ainda pendente —, pelo mesmo `applyPaymentResult` do webhook. O
 * relatório devolvido mostra o que o MP diz, o que o webhook entregou e se os
 * efeitos da aprovação terminaram, para o admin entender POR QUE o pedido
 * estava preso antes de decidir qualquer coisa.
 */

export interface RelatorioDaVerificacao {
  orderId: string
  antes: { status: string; statusDetail?: string }
  depois: { status: string; statusDetail?: string }
  /** Como o pagamento foi achado no MP. */
  encontradoPor: 'id_do_pagamento' | 'referencia_do_pedido' | 'nao_encontrado'
  mercadoPago: null | {
    paymentId: string
    status: string
    statusDetail?: string
    valor: number
    metodo?: string
    parcelas?: number
    criadoEm?: string
    aprovadoEm?: string
  }
  webhook: {
    recebidos: number
    ultimoEm: string | null
    assinaturaInvalida: number
    comErro: number
    ultimoErro?: string
  }
  efeitos: 'concluidos' | 'retomados' | 'interrompidos' | 'nao_se_aplica'
  mensagem: string
  erro?: string
}

function iso(value: unknown): string | undefined {
  if (!value) return undefined
  const d = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

function resumoDoMp(p: ProviderOrder): NonNullable<RelatorioDaVerificacao['mercadoPago']> {
  const raw = (p.raw || {}) as any
  return {
    paymentId: p.providerOrderId,
    status: String(raw.status || p.status),
    statusDetail: raw.status_detail ? String(raw.status_detail) : p.statusDetail,
    valor: Number(raw.transaction_amount ?? p.amount ?? 0),
    metodo: raw.payment_method_id ? String(raw.payment_method_id) : p.paymentMethod,
    parcelas: raw.installments ? Number(raw.installments) : undefined,
    criadoEm: iso(raw.date_created),
    aprovadoEm: iso(raw.date_approved || p.paidAt),
  }
}

async function webhookDoPagamento(db: Db, paymentId?: string): Promise<RelatorioDaVerificacao['webhook']> {
  const vazio = { recebidos: 0, ultimoEm: null, assinaturaInvalida: 0, comErro: 0 }
  if (!paymentId) return vazio
  const eventos = await db
    .collection<WebhookEventRecord>('webhook_events')
    .find({ provider: 'mercado_pago', resourceId: paymentId })
    .project({ createdAt: 1, signatureValid: 1, processingError: 1 })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray()
  if (eventos.length === 0) return vazio
  const comErro = eventos.filter((e: any) => e.processingError)
  return {
    recebidos: eventos.length,
    ultimoEm: iso(eventos[0].createdAt) || null,
    assinaturaInvalida: eventos.filter((e: any) => e.signatureValid === false).length,
    comErro: comErro.length,
    ultimoErro: comErro[0] ? String((comErro[0] as any).processingError) : undefined,
  }
}

function mensagemDe(r: RelatorioDaVerificacao): string {
  if (r.erro && !r.mercadoPago) return `Não foi possível consultar o Mercado Pago: ${r.erro}`
  if (r.encontradoPor === 'nao_encontrado') {
    return 'Nenhum pagamento deste pedido existe no Mercado Pago — o comprador não chegou a pagar (ou pagou em outro pedido).'
  }
  const mudou = r.antes.status !== r.depois.status
  const partes: string[] = []
  if (mudou) partes.push(`Status atualizado: ${r.antes.status} → ${r.depois.status}.`)
  else partes.push(`O Mercado Pago confirma: ${r.mercadoPago?.status}${r.mercadoPago?.statusDetail ? ` (${r.mercadoPago.statusDetail})` : ''}.`)
  if (r.efeitos === 'retomados') partes.push('A liberação tinha parado no meio e foi concluída agora.')
  if (r.efeitos === 'interrompidos') {
    partes.push(
      'A liberação parou no meio e não foi refeita (tipo de pedido que não se repete, ou ainda em andamento há menos de 2 min) — confira o acesso do comprador.'
    )
  }
  if (r.erro) partes.push(`Erro ${r.erro}.`)
  if (mudou && r.depois.status === 'approved') {
    partes.push(
      r.webhook.recebidos === 0
        ? 'O webhook do Mercado Pago nunca chegou para este pagamento.'
        : r.webhook.assinaturaInvalida > 0
          ? 'O webhook chegou, mas com assinatura inválida — confira o segredo do webhook.'
          : r.webhook.comErro > 0
            ? 'O webhook chegou e falhou ao processar.'
            : ''
    )
  }
  return partes.filter(Boolean).join(' ')
}

export async function verificarPedidoNoMercadoPago(db: Db, orderId: string): Promise<RelatorioDaVerificacao | null> {
  const orders = db.collection<PaymentOrder>('payment_orders')
  const order = await orders.findOne({ _id: new ObjectId(orderId) as any })
  if (!order) return null

  const relatorio: RelatorioDaVerificacao = {
    orderId,
    antes: { status: order.status, statusDetail: order.statusDetail },
    depois: { status: order.status, statusDetail: order.statusDetail },
    encontradoPor: 'nao_encontrado',
    mercadoPago: null,
    webhook: { recebidos: 0, ultimoEm: null, assinaturaInvalida: 0, comErro: 0 },
    efeitos: 'nao_se_aplica',
    mensagem: '',
  }

  let remoto: ProviderOrder | null = null
  try {
    if (order.providerPaymentId && !order.providerPaymentId.startsWith('manual-')) {
      remoto = await getPaymentProvider().getPayment(order.providerPaymentId)
      relatorio.encontradoPor = 'id_do_pagamento'
    } else {
      // Sem id: a função caiu antes de gravar a resposta do MP. Procura pelo
      // id do pedido, que vai como external_reference em todo checkout.
      remoto = await findPaymentForOrder(orderId)
      if (remoto) relatorio.encontradoPor = 'referencia_do_pedido'
    }
  } catch (err: any) {
    relatorio.erro = String(err?.message || err)
  }

  if (remoto) {
    relatorio.mercadoPago = resumoDoMp(remoto)
    try {
      await applyPaymentResult(orderId, remoto)
    } catch (err: any) {
      // A transição já pode ter sido gravada antes do erro (é o primeiro passo):
      // o status é relido abaixo, e os efeitos que pararam aparecem no relatório.
      relatorio.erro = `ao aplicar o resultado: ${String(err?.message || err)}`
    }
  }

  // Efeitos: a aprovação pode ter acontecido agora (já rodaram acima) ou antes
  // e parado no meio.
  const fresco = await orders.findOne({ _id: order._id as any })
  if (fresco) relatorio.depois = { status: fresco.status, statusDetail: fresco.statusDetail }
  if (fresco?.status === 'approved' && fresco.effectsStartedAt && !fresco.effectsCompletedAt) {
    const r = efeitosRepetiveis(fresco)
      ? await concluirEfeitosInterrompidos(orderId, { forcar: true }).catch(() => 'falhou' as const)
      : 'nao_repetiveis'
    relatorio.efeitos = r === 'concluidos' ? 'retomados' : 'interrompidos'
  } else if (fresco?.status === 'approved' && fresco.effectsCompletedAt) {
    relatorio.efeitos = 'concluidos'
  }

  relatorio.webhook = await webhookDoPagamento(db, relatorio.mercadoPago?.paymentId || order.providerPaymentId)
  relatorio.mensagem = mensagemDe(relatorio)
  return relatorio
}

export interface SaudeDosPagamentos {
  webhook: {
    ultimoEm: string | null
    ultimas24h: number
    assinaturaInvalida24h: number
    comErro24h: number
    ultimoErro?: string
  }
  varredura: null | {
    iniciadaEm: string | null
    terminadaEm: string | null
    origem: string
    stats: Record<string, number>
  }
  pendentes: {
    total: number
    semIdDoPagamento: number
    maisAntigoEm: string | null
  }
  efeitosInterrompidos: number
}

/** Painel "o pagamento automático está funcionando?" — webhook, varredura e o que está parado. */
export async function saudeDosPagamentos(db: Db): Promise<SaudeDosPagamentos> {
  const desde24h = new Date(Date.now() - 24 * 60 * 60_000)
  const desde14d = new Date(Date.now() - 14 * 24 * 60 * 60_000)
  const eventos = db.collection<WebhookEventRecord>('webhook_events')
  const orders = db.collection<PaymentOrder>('payment_orders')

  const [ultimoEvento, contagens, ultimoErro, varredura, pendentes, efeitosInterrompidos] = await Promise.all([
    eventos.find({ provider: 'mercado_pago' }).project({ createdAt: 1 }).sort({ createdAt: -1 }).limit(1).next(),
    eventos
      .aggregate([
        { $match: { provider: 'mercado_pago', createdAt: { $gte: desde24h } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            invalidos: { $sum: { $cond: [{ $eq: ['$signatureValid', false] }, 1, 0] } },
            comErro: { $sum: { $cond: [{ $gt: ['$processingError', null] }, 1, 0] } },
          },
        },
      ])
      .next(),
    eventos
      .find({ provider: 'mercado_pago', createdAt: { $gte: desde24h }, processingError: { $exists: true } })
      .project({ processingError: 1 })
      .sort({ createdAt: -1 })
      .limit(1)
      .next(),
    db.collection(COLECAO_DE_VARREDURAS).findOne({ _id: 'ultima' as any }),
    orders
      .aggregate([
        { $match: { status: { $in: ['pending', 'in_process'] }, createdAt: { $gte: desde14d } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            semId: { $sum: { $cond: [{ $in: [{ $ifNull: ['$providerPaymentId', ''] }, ['', null]] }, 1, 0] } },
            maisAntigo: { $min: '$createdAt' },
          },
        },
      ])
      .next(),
    orders.countDocuments({
      status: 'approved',
      effectsStartedAt: { $gte: desde14d, $lt: new Date(Date.now() - 10 * 60_000) },
      effectsCompletedAt: { $exists: false },
      'metadata.serialKeyPurchase': { $ne: true },
    } as any),
  ])

  return {
    webhook: {
      ultimoEm: iso((ultimoEvento as any)?.createdAt) || null,
      ultimas24h: Number((contagens as any)?.total || 0),
      assinaturaInvalida24h: Number((contagens as any)?.invalidos || 0),
      comErro24h: Number((contagens as any)?.comErro || 0),
      ultimoErro: (ultimoErro as any)?.processingError ? String((ultimoErro as any).processingError) : undefined,
    },
    varredura: varredura
      ? {
          iniciadaEm: iso(varredura.iniciadaEm) || null,
          terminadaEm: iso(varredura.terminadaEm) || null,
          origem: String(varredura.origem || 'cron'),
          stats: (varredura.stats || {}) as Record<string, number>,
        }
      : null,
    pendentes: {
      total: Number((pendentes as any)?.total || 0),
      semIdDoPagamento: Number((pendentes as any)?.semId || 0),
      maisAntigoEm: iso((pendentes as any)?.maisAntigo) || null,
    },
    efeitosInterrompidos,
  }
}
