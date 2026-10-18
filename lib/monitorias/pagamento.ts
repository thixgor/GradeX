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
 *
 * Material oficial junto (opcional para o aluno): o navegador só diz "quero"
 * ou "não quero". Qual material, quanto custa e se isenta a taxa sai do banco
 * aqui, e fica gravado NO PEDIDO. Na aprovação, o assento copia do pedido que
 * de fato foi pago — trocar de ideia, gerar outro PIX ou o admin mudar o preço
 * do material depois não mexe numa compra já feita.
 */

import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { deriveIdempotencyKey, getPaymentProvider } from '@/lib/payments'
import { audit } from '@/lib/payments/audit'
import { resolveCheckoutCharge } from '@/lib/payments/checkout-charge'
import { getFeePolicy, chargeMetadata } from '@/lib/payments/fees'
import { PROVIDER_UNCONFIRMED, recoverFromProviderFailure, resolveUnconfirmedOrder } from '@/lib/payments/provider-failure'
import { DEFAULT_PAYMENT_METHODS, paymentMethodDisabledError } from '@/lib/payment-methods'
import type { PaymentOrder } from '@/lib/types'
import type { PaymentStatus, ProviderOrder } from '@/lib/payments/types'
import { centavosParaReais, dividirValor, formatarCentavos, reaisParaCentavos } from './dinheiro'
import { percentualGravado, taxaPercentDaContratacao } from './comissao'
import { alunoJaTemMaterial, concederMaterialDaMonitoria, materialOficialAVenda, revogarMaterialDaMonitoria, vendaDoMaterialValida, type MaterialAVenda } from './material-oficial'
import { colecoes, idDe } from './db'
import { abrirRepasse } from './financeiro'
import { avisar, avisarEquipe } from './avisos'
import { onlyCpfDigits } from '@/lib/cpf'
import { avisarConfirmacao, ErroMonitoria, firmarBlocos, garantirBlocos } from './reservas'
import { devolverPagamentoAvulso, reembolsarParticipacao } from './reembolso'
import { formatarDuracao } from './agenda'
import type { UsuarioMonitoria } from './servidor'
import type { MaterialNaCompra, Participacao, Reserva } from './tipos'
import { adicionalRevogadoNoGateway, ofertaDoResumo, registrarAdicionalPago, resumoDoPedido, type OfertaDoResumo } from './resumo/adicional'
import type { ResumoNoPedido } from './resumo/tipos'
import { contratoComPoliticaV5 } from './documentos/contrato'

export interface RespostaCheckout {
  orderId: string
  status: PaymentStatus
  pix: { qrCode: string; qrCodeBase64: string; ticketUrl?: string } | null
  /** Só a aula. */
  valorCentavos: number
  /** Material oficial levado junto neste PIX (null = sem material). */
  material: { titulo: string; precoCentavos: number } | null
  /** Resumo por IA levado junto neste PIX (null = sem resumo). Receita da plataforma, fora do repasse. */
  resumo: { precoCentavos: number } | null
  taxaCentavos: number
  totalCentavos: number
  taxaRotulo: string
  expiraEm: string
}

/** O que o checkout oferece a este aluno (a tela usa para mostrar a opção). */
export interface OfertaDeMaterial {
  material: Omit<MaterialAVenda, 'foraDaComissaoDoSocio'> | null
  /** O aluno já tem acesso (comprou, tem o pacote ou resgata pelo Plus+): não vendemos de novo. */
  jaTem: boolean
}

/** Material que o monitor indicou no anúncio, se ainda está à venda, e se este aluno já o tem. */
export async function ofertaDeMaterial(reserva: Pick<Reserva, 'anuncioId'>, aluno: UsuarioMonitoria): Promise<OfertaDeMaterial & { interno: MaterialAVenda | null }> {
  const db = await getDb()
  const c = colecoes(db)
  if (!ObjectId.isValid(reserva.anuncioId)) return { material: null, jaTem: false, interno: null }
  const anuncio = await c.anuncios.findOne({ _id: new ObjectId(reserva.anuncioId) } as any, { projection: { materialOficialId: 1 } })
  const material = await materialOficialAVenda(db, anuncio?.materialOficialId)
  if (!material) return { material: null, jaTem: false, interno: null }
  const jaTem = await alunoJaTemMaterial(db, aluno, material.id)
  const { foraDaComissaoDoSocio: _, ...publico } = material
  return { material: publico, jaTem, interno: material }
}

/** O pedido leva material? (lido do que o servidor gravou no pedido) */
function materialDoPedido(order: PaymentOrder | null | undefined): Omit<MaterialNaCompra, 'paymentOrderId'> | null {
  const m = order?.metadata?.materialOficial as Omit<MaterialNaCompra, 'paymentOrderId'> | undefined
  return m && typeof m.id === 'string' && Number.isInteger(m.precoCentavos) && m.precoCentavos > 0 ? m : null
}

export async function criarCheckoutPix(input: {
  reservaId: string
  aluno: UsuarioMonitoria
  ip: string
  /** O aluno marcou "levar o material junto". Só a vontade: o resto o servidor decide. */
  incluirMaterial?: boolean
  /** O aluno marcou o Resumo por IA e aceitou o aditivo (versão + hash do texto que viu). */
  incluirResumo?: boolean
  aceiteResumo?: { versao: string; hash: string }
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

  // Material junto: oferecido só se o anúncio indica um material oficial ainda
  // à venda e o aluno não o tem. Pediu e não pode → explica, sem cobrar nada.
  const querMaterial = !!input.incluirMaterial
  const oferta = querMaterial ? await ofertaDeMaterial(reserva, input.aluno) : null
  if (querMaterial && (!oferta?.interno || oferta.jaTem)) {
    throw new ErroMonitoria(409, oferta?.jaTem ? 'Você já tem este material. Siga sem ele: a aula continua igual.' : 'Este material não está mais disponível. Siga sem ele: a aula continua igual.')
  }
  const material = oferta?.interno || null

  // Resumo por IA junto: preço fixado aqui pelo servidor (custo estimado,
  // margens, câmbio do dia) e só com o aceite do texto que o aluno viu.
  // Indisponível → explica, sem cobrar nada; a aula segue igual.
  let resumo: OfertaDoResumo | null = null
  if (input.incluirResumo) {
    resumo = await ofertaDoResumo(reserva, part, agora)
    if (!resumo.disponivel) throw new ErroMonitoria(409, 'O Resumo por IA não está disponível para esta aula agora. Siga sem ele: a aula continua igual.')
    if (!input.aceiteResumo || input.aceiteResumo.versao !== resumo.versao || input.aceiteResumo.hash !== resumo.hash) {
      throw new ErroMonitoria(409, 'Os termos do Resumo por IA foram atualizados. Recarregue a página, leia e aceite de novo.')
    }
  }
  const resumoCentavos = resumo?.precoCentavos ?? 0

  // Reaproveita o PIX ainda válido: recarregar a página não cria outro
  // pagamento. Só se for a MESMA escolha (com ou sem material, com ou sem
  // resumo): quem mudou de ideia recebe um PIX novo; se pagar os dois, o
  // segundo volta inteiro (pagamento duplicado do mesmo assento, ver aoAprovarPagamento).
  const mesmaEscolha = (o: PaymentOrder) => (materialDoPedido(o)?.id ?? null) === (material?.id ?? null) && !!resumoDoPedido(o) === !!resumo
  if (aberta && (aberta.status === 'pending' || aberta.status === 'in_process') && aberta.pix && aberta.expiresAt && aberta.expiresAt > agora && mesmaEscolha(aberta)) {
    return respostaDe(aberta)
  }
  // A criação anterior estourou o tempo (não sabemos se o MP criou o PIX):
  // procura no MP pela referência do pedido ANTES de gerar outro. Achou →
  // devolve aquele mesmo PIX; ainda incerto (dentro de 3 min) → espera.
  if (aberta && aberta.status === 'pending' && !aberta.pix && aberta.statusDetail === PROVIDER_UNCONFIRMED) {
    const resolvida = await resolveUnconfirmedOrder(aberta).catch(() => null)
    if (resolvida?.pix && (resolvida.status === 'pending' || resolvida.status === 'in_process')) return respostaDe(resolvida)
    if (resolvida?.status === 'approved') {
      await aoAprovarPagamento(resolvida, resultadoDoPedido(resolvida))
      return respostaDe(resolvida)
    }
    if (!resolvida || resolvida.status === 'pending') {
      throw new ErroMonitoria(409, 'Ainda estamos confirmando com o banco o PIX que você gerou. Aguarde um minuto e tente de novo.')
    }
  }
  // O PIX deste assento está sendo gerado AGORA (outro clique, outra aba): o
  // pedido existe mas o QR ainda não voltou do MP. Espera por ele em vez de
  // criar um segundo — senão haveria dois QR válidos para o mesmo assento.
  if (aberta && aberta.status === 'pending' && !aberta.pix && aberta.statusDetail !== PROVIDER_UNCONFIRMED && agora.getTime() - new Date(aberta.createdAt).getTime() < 60_000 && mesmaEscolha(aberta)) {
    return esperarPix(String(aberta._id))
  }

  const settings = await db.collection('admin_settings').findOne({})
  const enabled = { ...DEFAULT_PAYMENT_METHODS, ...(settings?.paymentMethods || {}) }
  const desligado = paymentMethodDisabledError('pix', enabled, { hasCardToken: false })
  if (desligado) throw new ErroMonitoria(400, desligado)

  // Regra da comissão (comissao.ts), com o preço OFICIAL lido agora do banco.
  const materialCentavos = material?.precoCentavos ?? 0
  const taxaPercent = taxaPercentDaContratacao({ valorAulaCentavos: part.valorCentavos, materialCentavos: material ? materialCentavos : null })
  const base = centavosParaReais(part.valorCentavos + materialCentavos + resumoCentavos)
  const cobranca = await resolveCheckoutCharge({ baseAmount: base, paymentMethodId: 'pix', hasCardToken: false, policy: getFeePolicy() })
  if (!cobranca.ok) throw new ErroMonitoria(cobranca.status, cobranca.error)
  const charge = cobranca.charge
  const divisao = dividirValor(part.valorCentavos, taxaPercent)
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
      itemTitle: `Monitoria: ${reserva.anuncioTitulo}${material ? ' + material' : ''}${resumo ? ' + Resumo por IA' : ''}`,
      reservaId: input.reservaId,
      tutorId: reserva.tutorId,
      valorAulaCentavos: part.valorCentavos,
      taxaPercent,
      taxaPlataformaCentavos: divisao.taxaPlataformaCentavos,
      ...(material
        ? { materialOficial: { id: material.id, titulo: material.titulo, precoCentavos: material.precoCentavos, isentaTaxa: taxaPercent === 0 } }
        : {}),
      ...(resumo?.interno
        ? {
            resumoIA: {
              precoCentavos: resumoCentavos,
              estimativa: resumo.interno.estimativa,
              aceite: { versao: resumo.versao, hash: resumo.hash, em: agora.toISOString(), ip: input.ip },
              foraDaComissaoDoSocio: resumo.interno.foraDaComissaoDoSocio,
            } satisfies ResumoNoPedido,
          }
        : {}),
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
      // Sócio do split (se ligado) divide SÓ a receita da plataforma: a taxa
      // (10% ou 0%), o material e o Resumo por IA, salvo o que o admin tirou
      // da comissão. O que é do monitor não entra em comissão de ninguém.
      commissionableAmount: centavosParaReais(
        divisao.taxaPlataformaCentavos +
          (material && !material.foraDaComissaoDoSocio ? materialCentavos : 0) +
          (resumo?.interno && !resumo.interno.foraDaComissaoDoSocio ? resumoCentavos : 0),
      ),
      currency: 'BRL',
      description: `Monitoria: ${reserva.anuncioTitulo}${material ? ` + material ${material.titulo}` : ''}${resumo ? ' + Resumo por IA' : ''}`.slice(0, 200),
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
      metadata: { valorCentavos: part.valorCentavos, taxaPercent, materialId: material?.id, materialCentavos, resumoCentavos, providerPaymentId: resultado.providerOrderId, ...chargeMetadata(charge) },
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
  const material = materialDoPedido(order)
  const resumo = resumoDoPedido(order)
  return {
    orderId: String(order._id),
    status: order.status,
    pix: order.pix || null,
    valorCentavos: base - (material?.precoCentavos ?? 0) - (resumo?.precoCentavos ?? 0),
    material: material ? { titulo: material.titulo, precoCentavos: material.precoCentavos } : null,
    resumo: resumo ? { precoCentavos: resumo.precoCentavos } : null,
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
  const esperado = await c.participacoes.findOne({ _id: partId } as any, { projection: { valorCentavos: 1, alunoId: 1, contratoId: 1 } })
  if (!esperado) return

  // O pagamento é MESMO deste pedido? O MP devolve a referência que mandamos
  // na criação (o id do pedido). Pagamento de outro pedido, ou já usado por
  // outro assento, não confirma vaga nenhuma — a equipe confere.
  const referencia = (result.raw as { external_reference?: unknown } | null | undefined)?.external_reference
  if (referencia != null && String(referencia) !== String(order._id)) {
    console.error('[monitorias] pagamento de outro pedido', String(order._id), pagamentoId, referencia)
    await audit({ action: 'payment_rejected', targetUserId: esperado.alunoId, resourceType: 'monitoria', resourceId: order.refId, metadata: { motivo: 'referencia_divergente', orderId: String(order._id), referencia: String(referencia), providerPaymentId: pagamentoId } })
    return
  }
  if (pagamentoId) {
    const outro = await c.participacoes.findOne({ providerPaymentId: pagamentoId, _id: { $ne: partId } } as any, { projection: { _id: 1 } })
    if (outro) {
      console.error('[monitorias] pagamento já usado por outro assento', pagamentoId, idDe(outro))
      await audit({ action: 'payment_rejected', targetUserId: esperado.alunoId, resourceType: 'monitoria', resourceId: order.refId, metadata: { motivo: 'pagamento_de_outro_assento', providerPaymentId: pagamentoId, outroAssento: idDe(outro) } })
      return
    }
  }

  // Autocompra: o próprio monitor pagando a aula dele (com uma segunda conta,
  // para inflar vendas/avaliações). O Mercado Pago informa o CPF de quem pagou
  // quando o banco repassa: se for o do monitor, o pagamento volta inteiro e a
  // equipe confere. Melhor esforço: sem CPF na resposta, segue a trava de conta.
  const cpfPagador = cpfDoPagador(result.raw)
  if (cpfPagador) {
    const reservaDoAssento = await c.participacoes.findOne({ _id: partId } as any, { projection: { reservaId: 1 } })
    const res = reservaDoAssento && ObjectId.isValid(reservaDoAssento.reservaId)
      ? await c.reservas.findOne({ _id: new ObjectId(reservaDoAssento.reservaId) } as any, { projection: { tutorUserId: 1, anuncioTitulo: 1 } })
      : null
    const monitor = res && ObjectId.isValid(res.tutorUserId) ? await c.users.findOne({ _id: new ObjectId(res.tutorUserId) } as any, { projection: { cpf: 1 } }) : null
    if (monitor?.cpf && onlyCpfDigits(String(monitor.cpf)) === cpfPagador) {
      console.error('[monitorias] autocompra: pagador com o CPF do monitor', String(order._id))
      await audit({ action: 'payment_rejected', targetUserId: esperado.alunoId, resourceType: 'monitoria', resourceId: order.refId, metadata: { motivo: 'autocompra_cpf_do_monitor', orderId: String(order._id), providerPaymentId: pagamentoId } })
      await avisarEquipe('Autocompra bloqueada', `Pagamento de "${res?.anuncioTitulo || ''}" feito com o CPF do próprio monitor. Devolvido inteiro.`)
      const marcou = await c.participacoes.updateOne(
        { _id: partId, status: 'aguardando_pagamento' } as any,
        { $set: { status: 'paga', providerPaymentId: pagamentoId, paymentOrderId: String(order._id), pagoCentavos, pagoEm: agora, updatedAt: agora } },
      )
      if (marcou.modifiedCount) {
        await reembolsarParticipacao({ participacaoId: order.refId, valorBaseCentavos: null, motivo: 'O monitor não pode contratar a própria monitoria', por: 'sistema' })
      } else {
        await devolverAvulso(esperado.alunoId, 'O monitor não pode contratar a própria monitoria')
      }
      return
    }
  }

  // O valor pago precisa ser EXATAMENTE o do pedido (o servidor fixou: aula +
  // taxa do PIX), e nunca menos que o preço da aula. Diferente para mais ou
  // para menos (pagamento adulterado, erro de integração) não confirma vaga:
  // volta inteiro e a equipe é avisada.
  const pagoReal = result.amount != null ? reaisParaCentavos(result.amount) : null
  const doPedido = reaisParaCentavos(order.amount)
  if (pagoReal != null && (pagoReal + 1 < esperado.valorCentavos || Math.abs(pagoReal - doPedido) > 1)) {
    console.error('[monitorias] valor pago diferente do pedido', String(order._id), result.amount, order.amount, esperado.valorCentavos)
    await audit({ action: 'payment_rejected', targetUserId: esperado.alunoId, resourceType: 'monitoria', resourceId: order.refId, metadata: { motivo: 'valor_divergente', pago: result.amount, pedido: order.amount, esperadoCentavos: esperado.valorCentavos } })
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

  // A comissão e o material desta contratação saem do PEDIDO pago (que o
  // servidor montou), gravados uma vez, junto com o "pago" (mesmo compare-and-set).
  const doPedido_ = condicoesDoPedido(order, esperado.valorCentavos)
  // A política de cancelamento do assento sai do contrato que o aluno assinou
  // (congelada aqui, junto com o "pago"): contrato v5 → política v5.
  const contrato = esperado.contratoId && ObjectId.isValid(esperado.contratoId)
    ? await c.contratos.findOne({ _id: new ObjectId(esperado.contratoId) } as any, { projection: { 'dados.modeloVersao': 1 } })
    : null
  const politica = contrato && contratoComPoliticaV5(contrato.dados?.modeloVersao) ? ('v5' as const) : undefined
  const paga = await c.participacoes.findOneAndUpdate(
    { _id: partId, status: 'aguardando_pagamento' } as any,
    {
      $set: {
        status: 'paga',
        paymentOrderId: String(order._id),
        providerPaymentId: pagamentoId,
        pagoCentavos,
        pagoEm: result.paidAt || agora,
        taxaPercent: doPedido_.taxaPercent,
        ...(doPedido_.material ? { materialOficial: doPedido_.material } : {}),
        ...(doPedido_.resumo ? { resumoIA: doPedido_.resumo } : {}),
        ...(politica ? { politica } : {}),
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

/** CPF de quem pagou, se o Mercado Pago o devolveu (pagador ou dados do banco no PIX). */
function cpfDoPagador(raw: unknown): string | null {
  const r = raw as any
  const candidatos = [
    r?.payer?.identification?.number,
    r?.point_of_interaction?.transaction_data?.bank_info?.payer?.identification?.number,
  ]
  for (const c of candidatos) {
    const d = onlyCpfDigits(String(c ?? ''))
    if (d.length === 11) return d
  }
  return null
}

/**
 * Percentual e material de um pedido, CONFERIDOS de novo contra a regra: um
 * pedido cujo metadado diga "isento" sem material que cubra 10% da aula volta
 * para 10%. Nunca confia em percentual escrito, só no que dá para recalcular.
 */
function condicoesDoPedido(order: PaymentOrder, valorAulaCentavos: number): { taxaPercent: number; material: MaterialNaCompra | null; resumo: Participacao['resumoIA'] | null } {
  const m = materialDoPedido(order)
  // O Resumo por IA nunca entra na regra da comissão: a taxa é só sobre a aula (e o material).
  const taxaPercent = taxaPercentDaContratacao({ valorAulaCentavos, materialCentavos: m ? m.precoCentavos : null })
  const r = resumoDoPedido(order)
  const resumo = r ? { precoCentavos: r.precoCentavos, paymentOrderId: String(order._id) } : null
  if (!m) return { taxaPercent, material: null, resumo }
  return { taxaPercent, material: { id: m.id, titulo: m.titulo, precoCentavos: m.precoCentavos, isentaTaxa: taxaPercent === 0, paymentOrderId: String(order._id) }, resumo }
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

  // O material comprado junto é entregue ANTES do repasse: a isenção só existe
  // com a venda feita. Só o material do pedido que pagou ESTE assento.
  if (paga.materialOficial && paga.materialOficial.paymentOrderId === paga.paymentOrderId) {
    const db = await getDb()
    const aluno = ObjectId.isValid(paga.alunoId) ? await c.users.findOne({ _id: new ObjectId(paga.alunoId) } as any, { projection: { email: 1 } }) : null
    await concederMaterialDaMonitoria(db, {
      material: paga.materialOficial,
      aluno: { id: paga.alunoId, nome: paga.alunoNome, email: String(aluno?.email || '') },
      participacaoId: idDe(paga),
      providerPaymentId: String(paga.providerPaymentId || result.providerOrderId || ''),
    })
  }
  // Resumo por IA comprado neste PIX: registro próprio (fora do repasse) e a tarefa da aula.
  if (paga.resumoIA && paga.resumoIA.paymentOrderId === paga.paymentOrderId) {
    await registrarAdicionalPago(paga, order, reserva)
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
  const percent = percentualGravado(paga.taxaPercent)
  const divisao = dividirValor(paga.valorCentavos, percent)
  const mat = paga.materialOficial
  const resumoIA = paga.resumoIA
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
          ...(mat ? [`O material "${mat.titulo}" já está liberado na sua conta, em Materiais.`] : []),
          ...(resumoIA ? ['Você levou o Resumo Inteligente por IA: ele fica pronto na página da reserva depois da aula.'] : []),
          'O comprovante e o contrato em PDF estão na página da reserva.',
        ],
        linhas: [
          ['Monitoria', reserva.anuncioTitulo],
          ['Valor da aula', formatarCentavos(paga.valorCentavos)],
          ...(mat ? ([['Material oficial', `${mat.titulo} (${formatarCentavos(mat.precoCentavos)})`]] as Array<[string, string]>) : []),
          ...(resumoIA ? ([['Resumo por IA', formatarCentavos(resumoIA.precoCentavos)]] as Array<[string, string]>) : []),
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
          ...(percent === 0 ? ['O aluno levou junto o material oficial que você indicou: nesta aula não há taxa da plataforma, o valor é todo seu.'] : []),
        ],
        linhas: [
          ['Aula', `${formatarDuracao(p.duracaoMin)}`],
          ['Valor', formatarCentavos(divisao.brutoCentavos)],
          [percent === 0 ? 'Taxa da plataforma' : `Taxa da plataforma (${percent}%)`, percent === 0 ? 'Isenta (material oficial)' : formatarCentavos(divisao.taxaPlataformaCentavos)],
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
    { $set: { status: 'confirmada', contouNaVitrine: true, updatedAt: new Date(), ultimaAtividadeEm: new Date() }, $unset: { confirmandoEm: '' }, $inc: { versao: 1 } },
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
  // "refunded" que nós mesmos pedimos: quem ajusta o repasse é o fluxo do
  // reembolso, pela chave dele. Se ele ainda estava em aberto (a resposta do MP
  // se perdeu), este aviso é a confirmação — conclui agora, sem pedir de novo
  // (reembolsarParticipacao confere no MP antes de qualquer chamada).
  if (novoStatus !== 'charged_back' && part.reembolsos.length > 0) {
    const aberto = part.reembolsos.find((r) => r.status === 'processando' || r.status === 'falhou')
    if (aberto) await reembolsarParticipacao({ participacaoId: idDe(part), valorBaseCentavos: aberto.valorCentavos, motivo: aberto.motivo, por: aberto.por })
    return
  }
  const { estornarRepasse } = await import('./financeiro')
  await c.participacoes.updateOne(
    { _id: part._id as any },
    { $set: { status: novoStatus === 'charged_back' ? 'chargeback' : 'reembolsada', updatedAt: new Date() } },
  )
  // O pagamento inteiro voltou: o material vendido nele sai junto, e o Resumo por IA também.
  await revogarMaterialDaMonitoria(await getDb(), part.materialOficial?.paymentOrderId)
  await adicionalRevogadoNoGateway(idDe(part), novoStatus === 'charged_back')
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
  // Só ESTE assento sai do repasse; o dinheiro dos outros alunos não se move.
  // A aula segue para quem pagou — monitor e aluno ficam sabendo.
  const reserva = await c.reservas.findOne({ _id: new ObjectId(part.reservaId) } as any, { projection: { tutorUserId: 1, anuncioTitulo: 1 } })
  if (reserva) {
    const contestacao = novoStatus === 'charged_back'
    await avisar([
      {
        userId: reserva.tutorUserId,
        titulo: contestacao ? 'Pagamento contestado por um aluno' : 'Pagamento devolvido no Mercado Pago',
        mensagem: `O pagamento de ${part.alunoNome} em "${reserva.anuncioTitulo}" foi ${contestacao ? 'contestado no banco' : 'devolvido'}. Só esse valor sai do seu repasse; o dos outros alunos continua.`,
        url: `/monitorias/reservas/${part.reservaId}`,
      },
      {
        userId: part.alunoId,
        titulo: contestacao ? 'Sua contestação foi registrada' : 'Pagamento devolvido',
        mensagem: `Seu assento em "${reserva.anuncioTitulo}" foi encerrado porque o pagamento ${contestacao ? 'foi contestado no banco' : 'foi devolvido'}.`,
        url: `/monitorias/reservas/${part.reservaId}`,
      },
    ])
  }
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

/**
 * Conferência com o Mercado Pago ANTES de o valor sair da garantia para o
 * monitor. Só lê e registra — nunca cobra nem devolve ninguém:
 *  - aprovado no MP, mesmo valor e mesma referência do pedido → conferido;
 *  - devolvido/contestado no MP e não aqui → registra a revogação (o fluxo
 *    normal do webhook, sem movimentar dinheiro);
 *  - qualquer outra diferença (não aprovado, valor ou pedido diferentes,
 *    "aprovação manual" sem MP em produção) → o repasse DAQUELE assento fica
 *    retido e a equipe é avisada. Os outros assentos seguem normalmente.
 * Devolve `false` se o MP não respondeu: a liberação espera a próxima varredura.
 */
export async function conferirComGateway(reserva: Reserva): Promise<boolean> {
  const c = colecoes(await getDb())
  const pagas = await c.participacoes
    .find({ reservaId: idDe(reserva), status: { $in: ['paga', 'concluida'] }, providerPaymentId: { $exists: true }, conferidoNoGatewayEm: { $exists: false } } as any)
    .toArray()
  for (const p of pagas) {
    if ((await conferirAssentoNoGateway(p, reserva)) === null) return false
  }
  return true
}

/**
 * Confere UM assento no Mercado Pago (status, valor e referência) antes de
 * liberar o repasse dele. `true` = conferido; `false` = divergência (repasse
 * retido, equipe avisada); `null` = MP indisponível (tentar depois).
 */
export async function conferirAssentoNoGateway(p: Participacao, reserva: Pick<Reserva, 'anuncioTitulo'>): Promise<boolean | null> {
  const db = await getDb()
  const c = colecoes(db)
  if (p.conferidoNoGatewayEm) return true
  if (!p.providerPaymentId) return true
  const agora = new Date()
  const pid = String(p.providerPaymentId)
  let divergencia: string | null = null
  if (pid.startsWith('manual-')) {
    if (process.env.NODE_ENV === 'production') divergencia = 'Pagamento sem confirmação do Mercado Pago (aprovação manual).'
  } else {
    let r: ProviderOrder
    try {
      r = await getPaymentProvider().getPayment(pid)
    } catch (err) {
      console.warn('[monitorias] conferência com o MP indisponível', pid, err)
      return null
    }
    if (r.status === 'refunded' || r.status === 'charged_back') {
      // Devolvido/contestado direto no MP: registra pelo caminho de sempre.
      if (p.paymentOrderId && ObjectId.isValid(p.paymentOrderId)) {
        const { applyPaymentResult } = await import('@/lib/payments/effects')
        await applyPaymentResult(p.paymentOrderId, r)
      }
      return false
    }
    const referencia = (r.raw as { external_reference?: unknown } | null | undefined)?.external_reference
    if (r.status !== 'approved') divergencia = `No Mercado Pago o pagamento está "${r.status}", não aprovado.`
    else if (p.pagoCentavos != null && r.amount != null && Math.abs(reaisParaCentavos(r.amount) - p.pagoCentavos) > 1) {
      divergencia = `Valor no Mercado Pago (${formatarCentavos(reaisParaCentavos(r.amount))}) diferente do registrado (${formatarCentavos(p.pagoCentavos)}).`
    } else if (referencia != null && p.paymentOrderId && String(referencia) !== p.paymentOrderId) {
      divergencia = 'O pagamento no Mercado Pago pertence a outro pedido.'
    }
  }
  if (!divergencia) {
    // Isenção da taxa só vale com a venda do material de pé. Estornado por
    // fora (painel do MP, suporte de materiais)? A aula volta a ter 10%.
    if (p.taxaPercent === 0 && p.materialOficial && !(await vendaDoMaterialValida(db, p.materialOficial, p.alunoId))) {
      const { reaplicarTaxaSemMaterial } = await import('./financeiro')
      if (await reaplicarTaxaSemMaterial(idDe(p), 'o material vendido junto foi estornado')) {
        await audit({ action: 'payment_rejected', targetUserId: p.alunoId, resourceType: 'monitoria', resourceId: idDe(p), metadata: { motivo: 'isencao_revogada_material_estornado', materialId: p.materialOficial.id } })
      }
    }
    await c.participacoes.updateOne({ _id: p._id as any }, { $set: { conferidoNoGatewayEm: agora } })
    return true
  }
  const reteve = await c.repasses.updateOne(
    { participacaoId: idDe(p), status: 'em_garantia' },
    { $set: { status: 'retido', retencao: { motivo: divergencia, em: agora }, updatedAt: agora } },
  )
  await audit({ action: 'payment_rejected', targetUserId: p.alunoId, resourceType: 'monitoria', resourceId: idDe(p), metadata: { motivo: 'divergencia_na_conferencia', detalhe: divergencia, providerPaymentId: pid } })
  if (reteve.modifiedCount) {
    await avisarEquipe('Repasse retido: divergência com o Mercado Pago', `"${reserva.anuncioTitulo}", assento de ${p.alunoNome}: ${divergencia}`)
  }
  return false
}
