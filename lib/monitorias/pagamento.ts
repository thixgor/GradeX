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
import { recoverFromProviderFailure } from '@/lib/payments/provider-failure'
import { DEFAULT_PAYMENT_METHODS, paymentMethodDisabledError } from '@/lib/payment-methods'
import type { PaymentOrder } from '@/lib/types'
import type { PaymentStatus, ProviderOrder } from '@/lib/payments/types'
import { centavosParaReais, dividirValor, formatarCentavos, reaisParaCentavos } from './dinheiro'
import { colecoes, idDe } from './db'
import { abrirRepasse } from './financeiro'
import { avisar } from './avisos'
import { avisarConfirmacao, ErroMonitoria, firmarBlocos, reservarBlocos } from './reservas'
import { reembolsarParticipacao } from './reembolso'
import { blocosDaAula, formatarDuracao } from './agenda'
import type { UsuarioMonitoria } from './servidor'
import type { Reserva } from './tipos'

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
  if (part.status !== 'aguardando_pagamento') throw new ErroMonitoria(409, 'Assine o contrato antes de pagar.')
  if (reserva.status !== 'aguardando_pagamento') throw new ErroMonitoria(409, 'Esta reserva não está aguardando pagamento.')
  const agora = new Date()
  if (!reserva.prazoPagamento || reserva.prazoPagamento <= agora) throw new ErroMonitoria(409, 'O prazo de pagamento acabou.')
  if (part.valorCentavos <= 0) throw new ErroMonitoria(409, 'Assento sem valor a pagar.')

  const orders = db.collection<PaymentOrder>('payment_orders')
  // Reaproveita o PIX ainda válido: recarregar a página não cria outro pagamento.
  if (part.paymentOrderId && ObjectId.isValid(part.paymentOrderId)) {
    const aberta = await orders.findOne({ _id: new ObjectId(part.paymentOrderId) as any })
    if (aberta && (aberta.status === 'pending' || aberta.status === 'in_process') && aberta.pix && aberta.expiresAt && aberta.expiresAt > agora) {
      return respostaDe(aberta)
    }
    if (aberta?.status === 'approved') throw new ErroMonitoria(409, 'Este assento já está pago.')
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
  await Promise.all([
    orders.updateOne({ _id: inserted.insertedId as any }, { $set: { idempotencyKey } }),
    c.participacoes.updateOne({ _id: part._id as any, status: 'aguardando_pagamento' }, { $set: { paymentOrderId: orderId, updatedAt: agora } }),
  ])

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

export async function aoAprovarPagamento(order: PaymentOrder, result: ProviderOrder): Promise<void> {
  const db = await getDb()
  const c = colecoes(db)
  if (!order.refId || !ObjectId.isValid(order.refId)) return
  const partId = new ObjectId(order.refId)
  const agora = new Date()
  const pagoCentavos = reaisParaCentavos(order.paidAmount ?? result.amount ?? order.amount)

  // Defesa em profundidade: o pagamento aprovado precisa cobrir o preço do
  // assento. Um valor menor (pagamento adulterado, erro de integração) não
  // confirma aula — devolve e avisa a equipe.
  const esperado = await c.participacoes.findOne({ _id: partId } as any, { projection: { valorCentavos: 1, alunoId: 1 } })
  if (esperado && result.amount != null && reaisParaCentavos(result.amount) + 1 < esperado.valorCentavos) {
    console.error('[monitorias] pagamento menor que o devido', String(order._id), result.amount, esperado.valorCentavos)
    await audit({ action: 'payment_rejected', targetUserId: esperado.alunoId, resourceType: 'monitoria', resourceId: order.refId, metadata: { motivo: 'valor_menor', pago: result.amount, esperadoCentavos: esperado.valorCentavos } })
    await c.participacoes.updateOne({ _id: partId, status: 'aguardando_pagamento' } as any, { $set: { status: 'paga', providerPaymentId: result.providerOrderId, paymentOrderId: String(order._id), pagoCentavos, pagoEm: agora } })
    await reembolsarParticipacao({ participacaoId: order.refId, valorBaseCentavos: null, motivo: 'Valor pago diferente do combinado', por: 'sistema' })
    return
  }

  const paga = await c.participacoes.findOneAndUpdate(
    { _id: partId, status: 'aguardando_pagamento' } as any,
    {
      $set: {
        status: 'paga',
        paymentOrderId: String(order._id),
        providerPaymentId: result.providerOrderId,
        pagoCentavos,
        pagoEm: result.paidAt || agora,
        updatedAt: agora,
      },
    },
    { returnDocument: 'after' },
  )

  if (!paga) {
    const part = await c.participacoes.findOne({ _id: partId } as any)
    if (!part || part.status === 'paga' || part.status === 'concluida' || part.status.startsWith('reembols')) return
    // PIX que chegou depois de o assento expirar/cancelar: devolvemos tudo.
    await c.participacoes.updateOne(
      { _id: partId } as any,
      { $set: { status: 'paga', providerPaymentId: result.providerOrderId, paymentOrderId: String(order._id), pagoCentavos, pagoEm: agora, updatedAt: agora } },
    )
    await reembolsarParticipacao({
      participacaoId: order.refId,
      valorBaseCentavos: null,
      motivo: 'Pagamento recebido depois do prazo (horário já liberado)',
      por: 'sistema',
    })
    return
  }

  const reserva = await c.reservas.findOne({ _id: new ObjectId(paga.reservaId) } as any)
  if (!reserva) return
  if (!['aguardando_pagamento', 'confirmada'].includes(reserva.status)) {
    await reembolsarParticipacao({
      participacaoId: order.refId,
      valorBaseCentavos: null,
      motivo: 'Pagamento recebido com a reserva já encerrada',
      por: 'sistema',
    })
    return
  }

  await abrirRepasse(paga, reserva)
  await c.contratos.updateOne({ participacaoId: idDe(paga) }, { $set: { updatedAt: agora } })

  const divisao = dividirValor(paga.valorCentavos)
  const p = reserva.proposta!
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

  // Todos os assentos pagos → a aula está confirmada.
  if (reserva.status === 'aguardando_pagamento') {
    const pagos = await c.participacoes.countDocuments({ reservaId: idDe(reserva), status: 'paga' })
    if (pagos >= p.vagas) await confirmarAposPagamento(reserva)
  }
}

async function confirmarAposPagamento(reserva: Reserva): Promise<void> {
  const c = colecoes(await getDb())
  const id = idDe(reserva)
  // Os blocos ainda são "hold". Se QUALQUER um venceu (TTL), solta o resto e
  // tenta travar a aula inteira de novo — firmar só parte deixaria brecha para
  // outra pessoa marcar no meio da aula.
  const tutor = await c.tutores.findOne({ _id: new ObjectId(reserva.tutorId) } as any, { projection: { disponibilidade: 1 } })
  const intervaloMin = tutor?.disponibilidade.intervaloMin || 0
  const esperados = blocosDaAula(reserva.inicio!, reserva.proposta!.duracaoMin, intervaloMin).length
  const travados = await c.bloqueios.countDocuments({ reservaId: id })
  if (travados < esperados) {
    await c.bloqueios.deleteMany({ reservaId: id })
    const ok = await reservarBlocos({
      bloqueios: c.bloqueios,
      tutorId: reserva.tutorId,
      reservaId: id,
      inicio: reserva.inicio!,
      duracaoMin: reserva.proposta!.duracaoMin,
      intervaloMin,
      expiraEm: new Date(Date.now() + 60 * 60_000),
    })
    if (!ok) {
      console.error('[monitorias] horário perdido após pagamento — reembolsando reserva', id)
      const { reembolsarReserva } = await import('./reembolso')
      await reembolsarReserva(id, 'O horário deixou de estar disponível antes da confirmação', 'sistema')
      await c.reservas.updateOne({ _id: reserva._id as any }, { $set: { status: 'expirada', updatedAt: new Date() }, $inc: { versao: 1 } })
      return
    }
  }
  const res = await c.reservas.findOneAndUpdate(
    { _id: reserva._id as any, status: 'aguardando_pagamento' },
    { $set: { status: 'confirmada', updatedAt: new Date(), ultimaAtividadeEm: new Date() }, $inc: { versao: 1 } },
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
  })
  await audit({
    action: 'payment_refunded',
    targetUserId: part.alunoId,
    resourceType: 'monitoria',
    resourceId: idDe(part),
    metadata: { via: 'webhook', status: novoStatus },
  })
}
