import 'server-only'

/**
 * Pagamento de um assento por PIX (Mercado Pago) e os efeitos da aprovação.
 *
 * O caminho do dinheiro:
 *   checkout → payment_orders (type 'monitoria', refId = assento) → MP gera o PIX
 *   → webhook/polling → applyPaymentResult (lib/payments/effects.ts)
 *   → aoAprovarPagamento (aqui): assento pago, repasse em garantia, reserva confirmada.
 *
 * O valor NUNCA vem do navegador: sai de `participacao.valorCentavos`, que o
 * servidor fixou quando a proposta foi aceita.
 */

import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { deriveIdempotencyKey, getPaymentProvider } from '@/lib/payments'
import { audit } from '@/lib/payments/audit'
import { resolveCheckoutCharge } from '@/lib/payments/checkout-charge'
import { getFeePolicy, chargeMetadata } from '@/lib/payments/fees'
import { PROVIDER_UNCONFIRMED, recoverFromProviderFailure } from '@/lib/payments/provider-failure'
import { DEFAULT_PAYMENT_METHODS, paymentMethodDisabledError } from '@/lib/payment-methods'
import type { PaymentOrder } from '@/lib/types'
import type { PaymentStatus, ProviderOrder } from '@/lib/payments/types'
import { centavosParaReais, dividirValor, formatarCentavos, reaisParaCentavos } from './dinheiro'
import { colecoes, idDe } from './db'
import { abrirRepasse } from './financeiro'
import { avisar } from './avisos'
import { avisarConfirmacao, ErroMonitoria, firmarBlocos, garantirBlocos } from './reservas'
import { devolverPagamentoAvulso, reembolsarParticipacao } from './reembolso'
import { formatarDuracao } from './agenda'
import type { UsuarioMonitoria } from './servidor'
import type { Participacao, Reserva } from './tipos'

export interface RespostaCheckout {
  orderId: string
  status: PaymentStatus
  pix: { qrCode: string; qrCodeBase64: string; ticketUrl?: string } | null
  valorCentavos: number
  taxaCentavos: number
  totalCentavos: number
  taxaRotulo: string
  expiraEm: string
}

export async function criarCheckoutPix(input: {
  reservaId: string
  aluno: UsuarioMonitoria
  ip: string
}): Promise<RespostaCheckout> {
  const db = await getDb()
  const c = colecoes(db)
  const alunoId = String(input.aluno._id)
  if (!ObjectId.isValid(input.reservaId)) throw new ErroMonitoria(404, 'Não encontrado.')
  const [reserva, part] = await Promise.all([
    c.reservas.findOne({ _id: new ObjectId(input.reservaId) } as any),
    c.participacoes.findOne({ reservaId: input.reservaId, alunoId }),
  ])
  if (!reserva || !part) throw new ErroMonitoria(404, 'Não encontrado.')
  if (part.status === 'paga') throw new ErroMonitoria(409, 'Este assento já está pago.')
  const orders = db.collection<PaymentOrder>('payment_orders')
  const aberta = part.paymentOrderId && ObjectId.isValid(part.paymentOrderId) ? await orders.findOne({ _id: new ObjectId(part.paymentOrderId) as any }) : null
  // Aprovado no Mercado Pago, mas o assento não virou "pago" (a função caiu
  // entre um e outro): termina a aprovação agora — NUNCA gera um segundo PIX.
  if (aberta?.status === 'approved' && part.status === 'aguardando_pagamento') {
    await aoAprovarPagamento(aberta, resultadoDoPedido(aberta))
    return respostaDe(aberta)
  }
  if (part.status !== 'aguardando_pagamento') throw new ErroMonitoria(409, 'Assine o contrato antes de pagar.')
  if (reserva.status !== 'aguardando_pagamento') throw new ErroMonitoria(409, 'Esta reserva não está aguardando pagamento.')
  const agora = new Date()
  if (!reserva.prazoPagamento || reserva.prazoPagamento <= agora) throw new ErroMonitoria(409, 'O prazo de pagamento acabou.')
  if (part.valorCentavos <= 0) throw new ErroMonitoria(409, 'Assento sem valor a pagar.')

  // Reaproveita o PIX ainda válido: recarregar a página não cria outro pagamento.
  if (aberta && (aberta.status === 'pending' || aberta.status === 'in_process') && aberta.pix && aberta.expiresAt && aberta.expiresAt > agora) {
    return respostaDe(aberta)
  }
  // O PIX deste assento está sendo gerado AGORA (outro clique, outra aba): o
  // pedido existe mas o QR ainda não voltou do MP. Espera por ele em vez de
  // criar um segundo — senão haveria dois QR válidos para o mesmo assento.
  if (aberta && aberta.status === 'pending' && !aberta.pix && aberta.statusDetail !== PROVIDER_UNCONFIRMED && agora.getTime() - new Date(aberta.createdAt).getTime() < 60_000) {
    return esperarPix(String(aberta._id))
  }

  const settings = await db.collection('admin_settings').findOne({})
  const enabled = { ...DEFAULT_PAYMENT_METHODS, ...(settings?.paymentMethods || {}) }
  const desligado = paymentMethodDisabledError('pix', enabled, { hasCardToken: false })
  if (desligado) throw new ErroMonitoria(400, desligado)

  const base = centavosParaReais(part.valorCentavos)
  const cobranca = await resolveCheckoutCharge({ baseAmount: base, paymentMethodId: 'pix', hasCardToken: false, policy: getFeePolicy() })
  if (!cobranca.ok) throw new ErroMonitoria(cobranca.status, cobranca.error)
  const charge = cobranca.charge
  const divisao = dividirValor(part.valorCentavos)
  const expiraEm = new Date(Math.max(reserva.prazoPagamento.getTime(), agora.getTime() + 30 * 60_000))
  // O Mercado Pago não aceita PIX com menos de 30 min. Se isso passa do prazo
  // da reserva (agendamento direto tem 30 min para assinar E pagar), o prazo
  // e a trava do horário acompanham o PIX — senão o aluno pagaria um PIX
  // válido depois de o horário já ter sido solto, e o pagamento seria devolvido.
  if (expiraEm > reserva.prazoPagamento && reserva.inicio && expiraEm.getTime() < reserva.inicio.getTime() - 30 * 60_000) {
    await Promise.all([
      c.reservas.updateOne(
        { _id: reserva._id as any, status: 'aguardando_pagamento', prazoPagamento: reserva.prazoPagamento },
        { $set: { prazoPagamento: expiraEm, updatedAt: agora } },
      ),
      c.bloqueios.updateMany(
        { reservaId: input.reservaId, tipo: 'hold' },
        { $set: { expiraEm: new Date(expiraEm.getTime() + 15 * 60_000) } },
      ),
    ])
  }

  const orderDoc: Omit<PaymentOrder, '_id'> = {
    userId: alunoId,
    payerEmail: input.aluno.email,
    payerName: input.aluno.fullName || input.aluno.name,
    provider: 'mercado_pago',
    type: 'monitoria',
    refId: idDe(part),
    amount: charge.transactionAmount,
    baseAmount: base,
    feeAmount: charge.feeAmount,
    currency: 'BRL',
    status: 'pending',
    idempotencyKey: '',
    metadata: {
      itemTitle: `Monitoria: ${reserva.anuncioTitulo}`,
      reservaId: input.reservaId,
      tutorId: reserva.tutorId,
      taxaPlataformaCentavos: divisao.taxaPlataformaCentavos,
      ...chargeMetadata(charge),
    },
    expiresAt: expiraEm,
    createdAt: agora,
    updatedAt: agora,
  }
  const inserted = await orders.insertOne(orderDoc as any)
  const orderId = String(inserted.insertedId)
  const idempotencyKey = deriveIdempotencyKey(orderId)
  // Compare-and-set no assento: dois cliques (ou dois aparelhos) ao mesmo
  // tempo não geram dois PIX — quem chegar segundo recebe o PIX do primeiro.
  const [, vinculou] = await Promise.all([
    orders.updateOne({ _id: inserted.insertedId as any }, { $set: { idempotencyKey } }),
    c.participacoes.updateOne(
      { _id: part._id as any, status: 'aguardando_pagamento', paymentOrderId: part.paymentOrderId ? part.paymentOrderId : { $exists: false } } as any,
      { $set: { paymentOrderId: orderId, updatedAt: agora } },
    ),
  ])
  if (!vinculou.modifiedCount) {
    await orders.updateOne({ _id: inserted.insertedId as any }, { $set: { status: 'cancelled', updatedAt: new Date() } })
    const atual = await c.participacoes.findOne({ _id: part._id as any }, { projection: { paymentOrderId: 1 } })
    if (atual?.paymentOrderId && ObjectId.isValid(atual.paymentOrderId)) return esperarPix(atual.paymentOrderId)
    throw new ErroMonitoria(409, 'Seu PIX já está sendo gerado. Aguarde alguns segundos e recarregue.')
  }

  let criado: ProviderOrder | null = null
  try {
    const resultado = await getPaymentProvider().createPayment({
      externalReference: orderId,
      amount: charge.transactionAmount,
      // Sócio do split (se ligado) divide SÓ a parte da plataforma — os 90% do
      // monitor não entram em comissão de ninguém.
      commissionableAmount: centavosParaReais(divisao.taxaPlataformaCentavos),
      currency: 'BRL',
      description: `Monitoria: ${reserva.anuncioTitulo}`.slice(0, 200),
      payerEmail: input.aluno.email,
      payerName: input.aluno.fullName || input.aluno.name,
      idempotencyKey,
      paymentMethodId: 'pix',
      payerDocumentType: input.aluno.cpf ? 'CPF' : undefined,
      payerDocumentNumber: input.aluno.cpf || undefined,
      expiresAt: expiraEm,
      metadata: { orderId, type: 'monitoria', reservaId: input.reservaId, participacaoId: idDe(part) },
    })
    criado = resultado
    const { applyPaymentResult } = await import('@/lib/payments/effects')
    await applyPaymentResult(orderId, resultado)
    await audit({
      action: 'order_created',
      actorUserId: alunoId,
      targetUserId: alunoId,
      resourceType: 'monitoria',
      resourceId: idDe(part),
      metadata: { valorCentavos: part.valorCentavos, providerPaymentId: resultado.providerOrderId, ...chargeMetadata(charge) },
      ip: input.ip,
    })
    const atual = await orders.findOne({ _id: inserted.insertedId as any })
    return respostaDe(atual || ({ ...orderDoc, _id: inserted.insertedId, pix: resultado.pix, status: resultado.status } as PaymentOrder))
  } catch (err: any) {
    const recuperado = await recoverFromProviderFailure({ db, orderId, amount: charge.transactionAmount, err, created: criado })
    if (recuperado) {
      const atual = await orders.findOne({ _id: inserted.insertedId as any })
      if (atual) return respostaDe(atual)
    }
    await orders.updateOne({ _id: inserted.insertedId as any }, { $set: { status: 'rejected', statusDetail: 'provider_error', updatedAt: new Date() } })
    console.error('[monitorias/checkout] erro:', err)
    throw new ErroMonitoria(502, err?.message || 'Não foi possível gerar o PIX agora. Tente de novo.')
  }
}

/** Espera (até ~6 s) o QR do pedido que outro clique está gerando, e devolve o MESMO PIX. */
async function esperarPix(orderId: string): Promise<RespostaCheckout> {
  const orders = (await getDb()).collection<PaymentOrder>('payment_orders')
  for (let i = 0; i < 12; i++) {
    const o = await orders.findOne({ _id: new ObjectId(orderId) as any })
    if (o?.pix || (o && o.status !== 'pending')) {
      if (o.pix && (o.status === 'pending' || o.status === 'in_process' || o.status === 'approved')) return respostaDe(o)
      break
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new ErroMonitoria(409, 'Seu PIX já está sendo gerado. Aguarde alguns segundos e recarregue.')
}

/** O pedido aprovado já gravado, no formato que os efeitos esperam (sem chamar o MP). */
function resultadoDoPedido(order: PaymentOrder): ProviderOrder {
  return {
    providerOrderId: String(order.providerPaymentId || order.providerOrderId || ''),
    status: order.status,
    amount: order.paidAmount ?? order.amount,
    currency: order.currency || 'BRL',
    paidAt: order.paidAt,
  }
}

function respostaDe(order: PaymentOrder): RespostaCheckout {
  const base = reaisParaCentavos(order.baseAmount ?? order.amount)
  const total = reaisParaCentavos(order.amount)
  return {
    orderId: String(order._id),
    status: order.status,
    pix: order.pix || null,
    valorCentavos: base,
    taxaCentavos: total - base,
    totalCentavos: total,
    taxaRotulo: (order.metadata?.feeLabel as string) || 'Taxa do PIX',
    expiraEm: (order.expiresAt || new Date(Date.now() + 30 * 60_000)).toISOString(),
  }
}

// ─── Efeitos (chamados por lib/payments/effects.ts) ─────────────────────

/**
 * Pagamento aprovado de um assento. Pode rodar MAIS DE UMA VEZ para o mesmo
 * pagamento — aviso repetido do Mercado Pago, varredura, ou a função que caiu
 * no meio da primeira vez — e cada passo é idempotente:
 *
 *  - assento: compare-and-set `aguardando_pagamento → paga` (só um vence);
 *  - mesmo pagamento chegando de novo: só termina o que ficou pela metade
 *    (repasse, avisos, confirmação), sem repetir nada;
 *  - OUTRO pagamento para um assento já pago: devolvido inteiro, sem tocar no
 *    assento (`devolverPagamentoAvulso`, com nova tentativa pela varredura).
 */
export async function aoAprovarPagamento(order: PaymentOrder, result: ProviderOrder, tentativa = 0): Promise<void> {
  const db = await getDb()
  const c = colecoes(db)
  if (!order.refId || !ObjectId.isValid(order.refId)) return
  const partId = new ObjectId(order.refId)
  const agora = new Date()
  const pagoCentavos = reaisParaCentavos(order.paidAmount ?? result.amount ?? order.amount)
  const pagamentoId = String(result.providerOrderId || order.providerPaymentId || '')
  const devolverAvulso = (alunoId: string, motivo: string) =>
    pagamentoId
      ? devolverPagamentoAvulso({ orderId: String(order._id), providerPaymentId: pagamentoId, participacaoId: order.refId!, alunoId, motivo })
      : Promise.resolve(false)

  // Defesa em profundidade: o pagamento aprovado precisa cobrir o preço do
  // assento. Um valor menor (pagamento adulterado, erro de integração) não
  // confirma aula — devolve e avisa a equipe.
  const esperado = await c.participacoes.findOne({ _id: partId } as any, { projection: { valorCentavos: 1, alunoId: 1 } })
  if (!esperado) return
  if (result.amount != null && reaisParaCentavos(result.amount) + 1 < esperado.valorCentavos) {
    console.error('[monitorias] pagamento menor que o devido', String(order._id), result.amount, esperado.valorCentavos)
    await audit({ action: 'payment_rejected', targetUserId: esperado.alunoId, resourceType: 'monitoria', resourceId: order.refId, metadata: { motivo: 'valor_menor', pago: result.amount, esperadoCentavos: esperado.valorCentavos } })
    const marcou = await c.participacoes.updateOne(
      { _id: partId, status: 'aguardando_pagamento' } as any,
      { $set: { status: 'paga', providerPaymentId: pagamentoId, paymentOrderId: String(order._id), pagoCentavos, pagoEm: agora, updatedAt: agora } },
    )
    // Assento ainda sem pagamento → o valor errado passa a ser o dele e volta
    // pelo reembolso normal. Assento já pago por outro PIX → devolve SÓ este.
    if (marcou.modifiedCount) {
      await reembolsarParticipacao({ participacaoId: order.refId, valorBaseCentavos: null, motivo: 'Valor pago diferente do combinado', por: 'sistema' })
    } else {
      await devolverAvulso(esperado.alunoId, 'Valor pago diferente do combinado (assento já pago)')
    }
    return
  }

  const paga = await c.participacoes.findOneAndUpdate(
    { _id: partId, status: 'aguardando_pagamento' } as any,
    {
      $set: {
        status: 'paga',
        paymentOrderId: String(order._id),
        providerPaymentId: pagamentoId,
        pagoCentavos,
        pagoEm: result.paidAt || agora,
        updatedAt: agora,
      },
    },
    { returnDocument: 'after' },
  )
  if (paga) {
    await concluirAprovacao(paga, order, result, true)
    return
  }

  const part = await c.participacoes.findOne({ _id: partId } as any)
  if (!part) return
  const jaPago = ['paga', 'concluida', 'chargeback'].includes(part.status) || part.status.startsWith('reembols')
  if (jaPago) {
    if (!part.providerPaymentId || part.providerPaymentId === pagamentoId) {
      // O MESMO pagamento de novo: termina o que a primeira vez pode ter
      // deixado pela metade (a função caiu entre o assento e o repasse).
      if (part.status === 'paga') await concluirAprovacao(part, order, result, false)
      return
    }
    // OUTRO pagamento do mesmo assento (dois QR em dois aparelhos): não é de
    // ninguém — devolve inteiro, e o assento segue com o pagamento original.
    await devolverAvulso(part.alunoId, 'Pagamento duplicado do mesmo assento')
    return
  }

  // PIX que chegou depois de o assento expirar/cancelar: o pagamento passa a
  // ser do assento e é devolvido inteiro. Compare-and-set: dois PIX atrasados
  // ao mesmo tempo não podem se sobrescrever (um deles ficaria sem devolução).
  const marcou = await c.participacoes.updateOne(
    { _id: partId, status: part.status, providerPaymentId: part.providerPaymentId ?? { $exists: false } } as any,
    { $set: { status: 'paga', providerPaymentId: pagamentoId, paymentOrderId: String(order._id), pagoCentavos, pagoEm: agora, updatedAt: agora } },
  )
  if (!marcou.modifiedCount) {
    // Outro processo mexeu no assento agora: reavalia (vira "duplicado" ou "mesmo pagamento").
    if (tentativa < 2) await aoAprovarPagamento(order, result, tentativa + 1)
    return
  }
  await reembolsarParticipacao({
    participacaoId: order.refId,
    valorBaseCentavos: null,
    motivo: 'Pagamento recebido depois do prazo (horário já liberado)',
    por: 'sistema',
  })
}

/**
 * Tudo o que vem depois de o assento ficar pago. Idempotente: o repasse abre
 * uma vez (índice único), os avisos saem uma vez (`pagamentoAvisadoEm`) e a
 * confirmação da aula é compare-and-set.
 */
async function concluirAprovacao(paga: Participacao, order: PaymentOrder, result: ProviderOrder, primeiraVez: boolean): Promise<void> {
  const c = colecoes(await getDb())
  const agora = new Date()
  const reserva = await c.reservas.findOne({ _id: new ObjectId(paga.reservaId) } as any)
  if (!reserva) return
  if (!['aguardando_pagamento', 'confirmada'].includes(reserva.status)) {
    // Só na PRIMEIRA vez: reprocessar um pagamento antigo de aula já dada
    // nunca pode devolver o dinheiro. Assento pago em reserva cancelada que
    // escapar daqui cai na rede da varredura (passo 6b).
    if (primeiraVez) {
      await reembolsarParticipacao({
        participacaoId: idDe(paga),
        valorBaseCentavos: null,
        motivo: 'Pagamento recebido com a reserva já encerrada',
        por: 'sistema',
      })
    }
    return
  }

  const repasseNovo = await abrirRepasse(paga, reserva)
  // Reprocessamento só avisa se a primeira vez caiu antes do repasse (logo,
  // antes dos avisos). Assentos antigos, sem a marca, não recebem e-mail repetido.
  const avisar_ = primeiraVez || repasseNovo
    ? (await c.participacoes.updateOne({ _id: paga._id as any, pagamentoAvisadoEm: { $exists: false } } as any, { $set: { pagamentoAvisadoEm: agora } })).modifiedCount === 1
    : false
  if (avisar_) await avisarPagamento(paga, reserva, order, result)

  // Todos os assentos pagos → a aula está confirmada.
  if (reserva.status === 'aguardando_pagamento') {
    const pagos = await c.participacoes.countDocuments({ reservaId: idDe(reserva), status: 'paga' })
    if (pagos >= reserva.proposta!.vagas) await confirmarAposPagamento(reserva)
  }
}

async function avisarPagamento(paga: Participacao, reserva: Reserva, order: PaymentOrder, result: ProviderOrder): Promise<void> {
  const divisao = dividirValor(paga.valorCentavos)
  const p = reserva.proposta!
  const pagoCentavos = paga.pagoCentavos ?? reaisParaCentavos(order.paidAmount ?? result.amount ?? order.amount)
  await avisar([
    {
      userId: paga.alunoId,
      titulo: 'Pagamento confirmado 💚',
      mensagem: `Recebemos seu PIX da monitoria "${reserva.anuncioTitulo}".`,
      url: `/monitorias/reservas/${idDe(reserva)}`,
      email: {
        assunto: `Pagamento confirmado: ${reserva.anuncioTitulo}`,
        paragrafos: [
          'Seu pagamento foi aprovado. O valor fica em garantia e só é liberado ao monitor 48 horas depois da aula.',
          'O comprovante e o contrato em PDF estão na página da reserva.',
        ],
        linhas: [
          ['Monitoria', reserva.anuncioTitulo],
          ['Valor da aula', formatarCentavos(paga.valorCentavos)],
          ['Total pago', formatarCentavos(pagoCentavos)],
          ['ID do pagamento (Mercado Pago)', String(result.providerOrderId || '')],
          ['Pedido', String(order._id)],
        ],
        botao: 'Ver comprovante',
      },
    },
    {
      userId: reserva.tutorUserId,
      titulo: 'Nova venda de monitoria 💸',
      mensagem: `${paga.alunoNome} pagou "${reserva.anuncioTitulo}".`,
      url: `/monitorias/reservas/${idDe(reserva)}`,
      email: {
        assunto: `Nova venda: ${reserva.anuncioTitulo}`,
        paragrafos: [
          `${paga.alunoNome} pagou a monitoria. O valor está em garantia e fica disponível para repasse 48h após o fim da aula, se não houver reclamação.`,
        ],
        linhas: [
          ['Aula', `${formatarDuracao(p.duracaoMin)}`],
          ['Valor', formatarCentavos(divisao.brutoCentavos)],
          ['Taxa da plataforma (10%)', formatarCentavos(divisao.taxaPlataformaCentavos)],
          ['Você recebe', formatarCentavos(divisao.liquidoTutorCentavos)],
        ],
        botao: 'Ver reserva',
      },
    },
  ])
}

/**
 * Todos pagaram → trava a aula inteira e confirma. Exportada para a varredura
 * (rede de segurança: grupo todo pago cuja confirmação não rodou).
 */
export async function confirmarAposPagamento(reserva: Reserva): Promise<void> {
  const c = colecoes(await getDb())
  const id = idDe(reserva)
  // Uma confirmação por vez: duas rodando juntas (aviso duplicado do MP +
  // varredura) disputariam os mesmos blocos da agenda e uma poderia achar que
  // perdeu o horário. A trava vence sozinha em 2 min se a função cair.
  const agora = new Date()
  const travou = await c.reservas.updateOne(
    { _id: reserva._id as any, status: 'aguardando_pagamento', $or: [{ confirmandoEm: { $exists: false } }, { confirmandoEm: { $lt: new Date(agora.getTime() - 2 * 60_000) } }] } as any,
    { $set: { confirmandoEm: agora } },
  )
  if (!travou.modifiedCount) return
  // Os blocos ainda são "hold". Se algum da aula venceu (TTL), tenta travar a
  // aula inteira de novo — firmar só parte deixaria brecha para outra pessoa
  // marcar no meio da aula. Perdeu o horário → devolve o dinheiro de todos.
  if (!(await garantirBlocos(reserva))) {
    console.error('[monitorias] horário perdido após pagamento — reembolsando reserva', id)
    const { reembolsarReserva } = await import('./reembolso')
    await reembolsarReserva(id, 'O horário deixou de estar disponível antes da confirmação', 'sistema')
    await c.reservas.updateOne(
      { _id: reserva._id as any, status: 'aguardando_pagamento' },
      { $set: { status: 'expirada', updatedAt: new Date() }, $unset: { confirmandoEm: '' }, $inc: { versao: 1 } },
    )
    return
  }
  const res = await c.reservas.findOneAndUpdate(
    { _id: reserva._id as any, status: 'aguardando_pagamento' },
    { $set: { status: 'confirmada', updatedAt: new Date(), ultimaAtividadeEm: new Date() }, $unset: { confirmandoEm: '' }, $inc: { versao: 1 } },
    { returnDocument: 'after' },
  )
  if (!res) return
  await firmarBlocos(id)
  await c.anuncios.updateOne({ _id: new ObjectId(reserva.anuncioId) } as any, { $inc: { 'stats.reservas': 1 } })
  await avisarConfirmacao(res)
}

/** Estorno/chargeback que chegou pelo webhook (inclusive reembolso feito direto no painel do MP). */
export async function aoRevogarPagamento(order: PaymentOrder, novoStatus: PaymentStatus): Promise<void> {
  const c = colecoes(await getDb())
  if (!order.refId || !ObjectId.isValid(order.refId)) return
  const part = await c.participacoes.findOne({ _id: new ObjectId(order.refId) } as any)
  if (!part || part.status === 'reembolsada' || part.status === 'chargeback') return
  // Estorno de um pagamento que NÃO é o do assento (o duplicado que nós mesmos
  // devolvemos): o MP avisa "refunded" desse pedido, mas o assento continua
  // pago pelo pagamento original — derrubá-lo tiraria a vaga de quem pagou.
  const pagamentoDoPedido = order.providerPaymentId || order.providerOrderId
  if (part.providerPaymentId && pagamentoDoPedido && String(pagamentoDoPedido) !== String(part.providerPaymentId)) return
  // "refunded" que nós mesmos pedimos (reembolso em andamento ou feito pela
  // plataforma): quem ajusta o repasse é o fluxo do reembolso, pela chave dele.
  if (novoStatus !== 'charged_back' && part.reembolsos.length > 0) return
  const { estornarRepasse } = await import('./financeiro')
  await c.participacoes.updateOne(
    { _id: part._id as any },
    { $set: { status: novoStatus === 'charged_back' ? 'chargeback' : 'reembolsada', updatedAt: new Date() } },
  )
  await estornarRepasse({
    participacaoId: idDe(part),
    valorBaseCentavos: part.valorCentavos,
    total: true,
    motivo: novoStatus === 'charged_back' ? 'Contestação (chargeback) no cartão/banco' : 'Reembolso registrado no Mercado Pago',
    por: 'sistema',
    chave: `revogacao:${idDe(part)}:${novoStatus}`,
  })
  await audit({
    action: 'payment_refunded',
    targetUserId: part.alunoId,
    resourceType: 'monitoria',
    resourceId: idDe(part),
    metadata: { via: 'webhook', status: novoStatus },
  })
}

/**
 * Rede de segurança da varredura para uma reserva aguardando pagamento — só
 * banco, nenhuma chamada ao Mercado Pago:
 *  - pedido aprovado cujo assento ficou "aguardando pagamento";
 *  - assento pago sem repasse aberto (a função caiu no meio da aprovação);
 *  - todos pagos e a aula ainda não confirmada.
 */
export async function curarPagamentosDaReserva(reserva: Reserva): Promise<void> {
  const db = await getDb()
  const c = colecoes(db)
  const id = idDe(reserva)
  const parts = await c.participacoes
    .find({ reservaId: id, status: { $in: ['aguardando_pagamento', 'paga'] }, paymentOrderId: { $exists: true } } as any)
    .toArray()
  const ids = parts.map((p) => p.paymentOrderId).filter((x): x is string => !!x && ObjectId.isValid(x))
  if (ids.length) {
    const pagas = parts.filter((p) => p.status === 'paga')
    const [aprovados, repasses] = await Promise.all([
      db.collection<PaymentOrder>('payment_orders').find({ _id: { $in: ids.map((x) => new ObjectId(x)) }, status: 'approved' } as any).toArray(),
      pagas.length
        ? c.repasses.find({ participacaoId: { $in: pagas.map((p) => idDe(p)) } }, { projection: { participacaoId: 1 } }).toArray()
        : Promise.resolve([]),
    ])
    const porId = new Map(aprovados.map((o) => [String(o._id), o]))
    const comRepasse = new Set(repasses.map((r) => r.participacaoId))
    for (const p of parts) {
      const pedido = porId.get(p.paymentOrderId!)
      if (!pedido) continue
      if (p.status === 'aguardando_pagamento' || !comRepasse.has(idDe(p))) await aoAprovarPagamento(pedido, resultadoDoPedido(pedido))
    }
  }
  const atual = await c.reservas.findOne({ _id: reserva._id as any })
  if (atual?.status !== 'aguardando_pagamento') return
  const pagos = await c.participacoes.countDocuments({ reservaId: id, status: 'paga' })
  if (pagos >= atual.proposta!.vagas) await confirmarAposPagamento(atual)
}
