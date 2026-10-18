import 'server-only'

/**
 * O adicional "Resumo por IA" — o lado do DINHEIRO.
 *
 * - Oferta: preço fixado pelo servidor (custo estimado + margens, câmbio do
 *   dia, tabela vigente na data da aula). O navegador só diz "quero".
 * - Compra: vai no MESMO PIX da aula (como o material oficial). O retrato do
 *   adicional fica no pedido; na aprovação nasce o registro próprio, único por
 *   assento (`monitorias_resumos_adicionais`), e o assento copia o preço.
 * - Repasse: nunca. A base do repasse é `participacao.valorCentavos` (só a
 *   aula); o adicional é receita da plataforma, com linha própria.
 * - Reembolso: segue o assento (ver `planoDoAdicionalNoReembolso`) e tem o seu
 *   próprio para falhas e recusas (`reembolsarAdicional`), com chave de
 *   idempotência `refund:resumo:<id>` no Mercado Pago.
 */

import { createHash } from 'crypto'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { getPaymentProvider } from '@/lib/payments'
import { audit } from '@/lib/payments/audit'
import type { PaymentOrder } from '@/lib/types'
import { chaveGeminiDoResumo } from '@/lib/ia/gemini'
import { colecoes, idDe } from '../db'
import { avisar, avisarEquipe } from '../avisos'
import { centavosParaReais, formatarCentavos, reaisParaCentavos } from '../dinheiro'
import { mesDoUso } from '../sala/config'
import type { Participacao, Reserva } from '../tipos'
import { cambioAtual } from './cambio'
import { configDoResumo } from './config'
import {
  planoDoAdicionalNoReembolso,
  precoDoResumo,
  taxaProporcional,
  textoAditivoResumo,
  valorSemOAdicional,
  VERSAO_ADITIVO_RESUMO,
  vendaLiberada,
} from './regras'
import type { AdicionalResumo, EstimativaDoResumo, ResumoNoPedido, UsoDoResumo } from './tipos'

const MAX_TENTATIVAS_REEMBOLSO = 6

async function cols() {
  return colecoes(await getDb())
}

export function hashDoTexto(texto: string): string {
  return createHash('sha256').update(texto, 'utf8').digest('hex')
}

/** Soma no consumo do mês (painel e teto do orçamento). */
export async function registrarUso(inc: Partial<Record<'realUsd' | 'chamadas' | 'aulas' | 'vendasCentavos' | 'reembolsosCentavos', number>>, agora = new Date()): Promise<void> {
  const c = await cols()
  await c.resumosUso.updateOne({ _id: mesDoUso(agora) }, { $inc: inc as Partial<UsoDoResumo>, $set: { updatedAt: agora } } as any, { upsert: true })
}

export async function usoDoMesResumo(agora = new Date()): Promise<number> {
  const c = await cols()
  return (await c.resumosUso.findOne({ _id: mesDoUso(agora) }, { projection: { realUsd: 1 } }))?.realUsd || 0
}

// ─── Oferta ─────────────────────────────────────────────────────────────

export interface OfertaDoResumo {
  disponivel: boolean
  precoCentavos: number
  individual: boolean
  duracaoMin: number
  texto: string
  versao: string
  hash: string
  /** Só no servidor (não vai para a tela). */
  interno?: { estimativa: EstimativaDoResumo; foraDaComissaoDoSocio: boolean; motivo?: string }
}

/**
 * O que o checkout oferece a este assento. Indisponível (sem dizer o porquê ao
 * aluno) quando: venda desligada ou sem confirmação do nível pago, sem chave,
 * aula grátis ou de teste, acima da duração máxima, orçamento do mês esgotado,
 * ou modelo sem preço cadastrado.
 */
export async function ofertaDoResumo(reserva: Reserva, part: Pick<Participacao, 'valorCentavos'> | null, agora = new Date()): Promise<OfertaDoResumo> {
  const config = await configDoResumo()
  const duracaoMin = reserva.proposta?.duracaoMin || 0
  const individual = (reserva.proposta?.vagas || 1) <= 1
  const texto = textoAditivoResumo(config.retencaoTranscricaoDias)
  const base = { precoCentavos: 0, individual, duracaoMin, texto, versao: VERSAO_ADITIVO_RESUMO, hash: hashDoTexto(texto) }
  const fora = (motivo: string): OfertaDoResumo => ({ ...base, disponivel: false, interno: { estimativa: null as unknown as EstimativaDoResumo, foraDaComissaoDoSocio: config.foraDaComissaoDoSocio, motivo } })
  if (!vendaLiberada(config)) return fora('venda desligada')
  if (reserva.teste || !reserva.proposta || reserva.proposta.gratis || !part || part.valorCentavos <= 0) return fora('aula sem cobrança')
  if (duracaoMin <= 0 || duracaoMin > config.limites.duracaoMaxMin) return fora('duração fora do limite')
  const [chave, gastoUsd, cambio] = await Promise.all([chaveGeminiDoResumo(), usoDoMesResumo(agora), cambioAtual(config, agora)])
  if (!chave) return fora('sem chave do Gemini')
  if (gastoUsd >= config.limites.orcamentoMensalUsd) return fora('orçamento do mês esgotado')
  const dataDaAula = reserva.inicio || reserva.proposta.inicio || agora
  const preco = precoDoResumo({ duracaoMin, individual, config, brlPorUsd: cambio.brlPorUsd, dataDaAula })
  if (!preco) return fora('modelo sem preço cadastrado')
  return {
    ...base,
    disponivel: true,
    precoCentavos: preco.precoCentavos,
    interno: {
      foraDaComissaoDoSocio: config.foraDaComissaoDoSocio,
      estimativa: {
        duracaoMin,
        custoUsd: Math.round(preco.custoUsd * 10_000) / 10_000,
        brlPorUsd: cambio.brlPorUsd,
        fonteCambio: cambio.fonte,
        dataCambio: cambio.data,
        tabelaDesde: preco.tabelaDesde,
        modelo: config.modeloResumo,
      },
    },
  }
}

/** O adicional gravado no pedido (o que o servidor fixou no checkout). */
export function resumoDoPedido(order: Pick<PaymentOrder, 'metadata'> | null | undefined): ResumoNoPedido | null {
  const r = order?.metadata?.resumoIA as ResumoNoPedido | undefined
  return r && Number.isInteger(r.precoCentavos) && r.precoCentavos > 0 ? r : null
}

// ─── Compra aprovada ────────────────────────────────────────────────────

/**
 * Pagamento aprovado com o adicional: nasce o registro (uma vez — índice único
 * por assento), a tarefa da aula é garantida e o monitor fica sabendo que vai
 * poder autorizar a transcrição. Idempotente.
 */
export async function registrarAdicionalPago(paga: Participacao, order: PaymentOrder, reserva: Reserva): Promise<void> {
  const r = resumoDoPedido(order)
  if (!r || paga.paymentOrderId !== String(order._id)) return
  const c = await cols()
  const agora = new Date()
  const baseCentavos = reaisParaCentavos(order.baseAmount ?? order.amount)
  const taxaCentavos = Math.max(0, reaisParaCentavos(order.amount) - baseCentavos)
  const doc: Omit<AdicionalResumo, '_id'> = {
    participacaoId: idDe(paga),
    reservaId: paga.reservaId,
    alunoId: paga.alunoId,
    paymentOrderId: String(order._id),
    precoCentavos: r.precoCentavos,
    taxaPixCentavos: taxaProporcional(taxaCentavos, r.precoCentavos, baseCentavos),
    estimativa: r.estimativa,
    aceite: { versao: r.aceite.versao, hash: r.aceite.hash, em: new Date(r.aceite.em), ...(r.aceite.ip ? { ip: r.aceite.ip } : {}) },
    status: 'pago',
    pagoEm: paga.pagoEm || agora,
    createdAt: agora,
    updatedAt: agora,
  }
  const res = await c.resumosAdicionais.updateOne({ participacaoId: doc.participacaoId }, { $setOnInsert: doc }, { upsert: true })
  const { garantirTarefa } = await import('./tarefa')
  await garantirTarefa(reserva, { alunoId: paga.alunoId, alunoNome: paga.alunoNome })
  if (!res.upsertedCount) return
  await registrarUso({ vendasCentavos: r.precoCentavos }, agora)
  await avisar([
    {
      userId: reserva.tutorUserId,
      titulo: 'Resumo por IA contratado nesta aula',
      mensagem: `${paga.alunoNome} levou o Resumo Inteligente por IA em "${reserva.anuncioTitulo}". Na sala, autorize a transcrição da sua voz (o vídeo nunca é gravado).`,
      url: `/monitorias/reservas/${idDe(reserva)}`,
    },
  ])
}

// ─── Entrega ────────────────────────────────────────────────────────────

/** Resumo pronto: cada adicional pago da aula vira "entregue" (troca atômica) e o comprador é avisado. */
export async function entregarAdicionais(reservaId: string, titulo: string): Promise<number> {
  const c = await cols()
  const agora = new Date()
  const pagos = await c.resumosAdicionais.find({ reservaId, status: 'pago' }).toArray()
  let n = 0
  for (const a of pagos) {
    const res = await c.resumosAdicionais.updateOne({ _id: a._id as any, status: 'pago' }, { $set: { status: 'entregue', entregueEm: agora, updatedAt: agora } })
    if (!res.modifiedCount) continue
    n++
    await avisar([
      {
        userId: a.alunoId,
        titulo: 'Seu resumo da monitoria está pronto 📚',
        mensagem: `O Resumo por IA de "${titulo}" já pode ser lido.`,
        url: `/monitorias/reservas/${reservaId}/resumo`,
        email: {
          assunto: `Resumo pronto: ${titulo}`,
          paragrafos: ['O resumo inteligente da sua monitoria ficou pronto: tópicos, conceitos, dúvidas respondidas, revisão rápida e questões com gabarito comentado.', 'Ele foi gerado por IA a partir da transcrição da aula — confira condutas e doses em fontes oficiais.'],
          botao: 'Ler o resumo',
        },
      },
    ])
  }
  return n
}

// ─── Reembolso próprio do adicional ─────────────────────────────────────

export type ResultadoReembolsoAdicional = { ok: true; jaEstava?: boolean } | { ok: false; erro: string }

/**
 * Devolve SÓ o adicional (e a parte dele na taxa do PIX): recusa do monitor,
 * áudio insuficiente, falha definitiva, orçamento estourado, decisão do
 * suporte. Entregue só volta com `forcar` (decisão do admin numa disputa).
 * Nunca mexe no repasse do monitor.
 */
export async function reembolsarAdicional(input: { participacaoId: string; motivo: string; por: string; forcar?: boolean }): Promise<ResultadoReembolsoAdicional> {
  const c = await cols()
  const a = await c.resumosAdicionais.findOne({ participacaoId: input.participacaoId })
  if (!a) return { ok: false, erro: 'Adicional não encontrado.' }
  if (a.status === 'reembolsado') return { ok: true, jaEstava: true }
  if (a.teste) {
    await c.resumosAdicionais.updateOne({ _id: a._id as any }, { $set: { status: 'reembolsado', updatedAt: new Date() } })
    return { ok: true }
  }
  if (a.status === 'reembolso_processando' && a.reembolso?.viaAssento) return { ok: false, erro: 'O adicional está sendo devolvido junto com o reembolso da aula.' }
  if (a.status === 'entregue' && !input.forcar) return { ok: false, erro: 'O resumo já foi entregue: o reembolso só sai por decisão do suporte.' }
  const part = ObjectId.isValid(a.participacaoId) ? await c.participacoes.findOne({ _id: new ObjectId(a.participacaoId) } as any) : null
  if (!part?.providerPaymentId) return { ok: false, erro: 'Pagamento sem identificador no Mercado Pago.' }
  // O assento já voltou inteiro (o MP devolveu tudo, adicional incluso).
  if (part.status === 'reembolsada' || part.status === 'chargeback') {
    await marcarReembolsado(a, { motivo: input.motivo, viaGateway: part.status === 'chargeback', viaAssento: part.status === 'reembolsada' })
    return { ok: true, jaEstava: true }
  }
  const valor = a.precoCentavos + a.taxaPixCentavos
  const agora = new Date()
  let reembolso = a.status === 'reembolso_processando' ? a.reembolso : undefined
  if (!reembolso) {
    reembolso = { chave: `refund:resumo:${idDe(a)}`, valorCentavos: valor, motivo: input.motivo, por: input.por, em: agora, status: 'processando', tentativas: 0 }
    const cas = await c.resumosAdicionais.updateOne(
      { _id: a._id as any, status: { $in: input.forcar ? ['pago', 'entregue'] : ['pago'] } },
      { $set: { status: 'reembolso_processando', reembolso, updatedAt: agora } },
    )
    if (!cas.modifiedCount) return { ok: false, erro: 'O adicional mudou de estado agora. Recarregue.' }
  }
  try {
    // Retomada: confere no MP antes de pedir de novo (a chave de idempotência é a segunda trava).
    const { devolvidoNoGateway } = await import('../reembolso')
    const jaDevolvidoAula = part.reembolsos.filter((r) => r.status === 'concluido').reduce((t, r) => t + (r.valorGatewayCentavos ?? r.valorCentavos), 0)
    const jaFeito = a.status === 'reembolso_processando' ? await devolvidoNoGateway(part.providerPaymentId, jaDevolvidoAula + reembolso.valorCentavos) : false
    if (!jaFeito) await getPaymentProvider().refundPayment(part.providerPaymentId, { amountReais: centavosParaReais(reembolso.valorCentavos), idempotencyKey: reembolso.chave })
  } catch (err: any) {
    const tentativas = (reembolso.tentativas || 0) + 1
    await c.resumosAdicionais.updateOne({ _id: a._id as any, status: 'reembolso_processando' }, { $set: { 'reembolso.tentativas': tentativas, 'reembolso.erro': String(err?.message || err).slice(0, 300), updatedAt: new Date() } })
    console.error('[resumo-ia] reembolso do adicional falhou', idDe(a))
    if (tentativas === MAX_TENTATIVAS_REEMBOLSO) await avisarEquipe('Reembolso do Resumo por IA falhando', `Adicional ${idDe(a)} (${formatarCentavos(valor)}): ${String(err?.message || err).slice(0, 200)}. Confira no painel do Mercado Pago.`)
    return { ok: false, erro: 'O Mercado Pago não confirmou o reembolso agora. Vamos tentar de novo automaticamente.' }
  }
  const fechou = await marcarReembolsado(a, { motivo: reembolso.motivo })
  if (fechou) {
    await audit({ action: 'monitoria_resumo_reembolsado', actorUserId: input.por === 'sistema' ? undefined : input.por, targetUserId: a.alunoId, resourceType: 'monitoria_resumo', resourceId: idDe(a), metadata: { valorCentavos: valor, motivo: reembolso.motivo, chave: reembolso.chave } })
    await avisar([
      {
        userId: a.alunoId,
        titulo: 'Resumo por IA reembolsado',
        mensagem: `Devolvemos ${formatarCentavos(valor)} do Resumo por IA: ${reembolso.motivo}. A sua monitoria não muda.`,
        url: `/monitorias/reservas/${a.reservaId}`,
        email: {
          assunto: 'Reembolso do Resumo por IA',
          paragrafos: [`Pedimos ao Mercado Pago a devolução do adicional Resumo por IA (${formatarCentavos(valor)}, com a parte dele na taxa do PIX).`, `Motivo: ${reembolso.motivo}.`, 'A monitoria e o restante do pagamento continuam valendo.'],
          linhas: [['Protocolo', reembolso.chave]],
          botao: 'Ver a reserva',
        },
      },
    ])
  }
  return { ok: true }
}

async function marcarReembolsado(a: AdicionalResumo, extra: { motivo: string; viaGateway?: boolean; viaAssento?: boolean }): Promise<boolean> {
  const c = await cols()
  const agora = new Date()
  const res = await c.resumosAdicionais.updateOne(
    { _id: a._id as any, status: { $ne: 'reembolsado' } },
    {
      $set: {
        status: 'reembolsado',
        'reembolso.status': 'concluido',
        'reembolso.motivo': a.reembolso?.motivo || extra.motivo,
        'reembolso.em': a.reembolso?.em || agora,
        'reembolso.valorCentavos': a.precoCentavos + a.taxaPixCentavos,
        'reembolso.chave': a.reembolso?.chave || `refund:resumo:${idDe(a)}`,
        'reembolso.por': a.reembolso?.por || 'sistema',
        ...(extra.viaGateway ? { 'reembolso.viaGateway': true } : {}),
        ...(extra.viaAssento ? { 'reembolso.viaAssento': true } : {}),
        updatedAt: agora,
      },
    },
  )
  if (!res.modifiedCount) return false
  if (!a.teste) await registrarUso({ reembolsosCentavos: a.precoCentavos }, agora)
  const { cancelarTarefaSeSemCompradores } = await import('./tarefa')
  await cancelarTarefaSeSemCompradores(a.reservaId, extra.motivo)
  return true
}

/** Todos os adicionais AINDA NÃO ENTREGUES da aula, devolvidos (recusa do monitor, sem áudio, falha, exclusão). */
export async function reembolsarAdicionaisDaAula(reservaId: string, motivo: string, por = 'sistema'): Promise<{ ok: number; falhas: number }> {
  const c = await cols()
  const pendentes = await c.resumosAdicionais.find({ reservaId, status: { $in: ['pago', 'reembolso_processando'] } }, { projection: { participacaoId: 1, status: 1, reembolso: 1 } }).toArray()
  let ok = 0
  let falhas = 0
  for (const a of pendentes) {
    if (a.status === 'reembolso_processando' && a.reembolso?.viaAssento) continue
    const r = await reembolsarAdicional({ participacaoId: a.participacaoId, motivo, por })
    if (r.ok) ok++
    else falhas++
  }
  return { ok, falhas }
}

// ─── Junto com o reembolso do assento (reembolso.ts) ────────────────────

export interface PlanoNoAssento {
  plano: 'sem_adicional' | 'incluir' | 'excluir'
  /** Valor explícito a pedir ao MP (reembolso integral SEM o adicional). */
  valorGatewayCentavos?: number
  /** Quanto o MP terá devolvido no total depois deste reembolso (para conferir retomadas). */
  alvoGatewayCentavos?: number
}

/**
 * Chamado quando o reembolso de um assento é REGISTRADO (antes do MP). No
 * integral com adicional ainda não entregue, o adicional é travado como
 * "devolvendo junto" (troca atômica: o processador não o entrega mais). Já
 * entregue → o valor do adicional sai da devolução.
 */
export async function prepararAdicionalNoReembolso(part: Participacao, total: boolean, chaveDoReembolso: string, motivo: string, por: string): Promise<PlanoNoAssento> {
  if (!total) return { plano: 'sem_adicional' }
  const c = await cols()
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    const a = await c.resumosAdicionais.findOne({ participacaoId: idDe(part) })
    // Já travado por ESTE reembolso (retomada antes de gravar o plano): continua "incluir".
    if (a?.status === 'reembolso_processando' && a.reembolso?.chave === `${chaveDoReembolso}:resumo`) return { plano: 'incluir' }
    const plano = planoDoAdicionalNoReembolso(a, total)
    if (plano === 'sem_adicional' || !a) return { plano: 'sem_adicional' }
    const valorAdicional = a.precoCentavos + a.taxaPixCentavos
    if (plano === 'incluir') {
      const cas = await c.resumosAdicionais.updateOne(
        { _id: a._id as any, status: 'pago' },
        { $set: { status: 'reembolso_processando', reembolso: { chave: `${chaveDoReembolso}:resumo`, valorCentavos: valorAdicional, motivo: `Reembolso integral da monitoria: ${motivo}`, por, em: new Date(), status: 'processando', viaAssento: true }, updatedAt: new Date() } },
      )
      if (cas.modifiedCount) return { plano: 'incluir' }
      continue // mudou agora (entregue/devolvendo): recalcula
    }
    const jaDevolvidoAula = part.reembolsos.filter((r) => r.status === 'concluido').reduce((t, r) => t + (r.valorGatewayCentavos ?? r.valorCentavos), 0)
    const pago = part.pagoCentavos ?? 0
    const valorGatewayCentavos = valorSemOAdicional({ pagoCentavos: pago, jaDevolvidoAulaCentavos: jaDevolvidoAula, adicionalCentavos: valorAdicional })
    return {
      plano: 'excluir',
      valorGatewayCentavos,
      alvoGatewayCentavos: jaDevolvidoAula + valorGatewayCentavos + (a.status === 'reembolsado' ? valorAdicional : 0),
    }
  }
  return { plano: 'sem_adicional' }
}

/**
 * Quanto o reembolso PRÓPRIO do adicional devolveu (ou pode ter devolvido, se
 * em andamento) no MP. Entra na conta da retomada de um reembolso parcial da
 * aula: superestimar só faz a retomada confiar na chave de idempotência.
 */
export async function devolvidoDoAdicionalAParte(participacaoId: string): Promise<number> {
  const c = await cols()
  const a = await c.resumosAdicionais.findOne({ participacaoId, status: { $in: ['reembolso_processando', 'reembolsado'] } }, { projection: { precoCentavos: 1, taxaPixCentavos: 1, reembolso: 1, teste: 1 } })
  if (!a || a.teste || a.reembolso?.viaAssento || a.reembolso?.viaGateway) return 0
  return a.precoCentavos + a.taxaPixCentavos
}

/** O reembolso integral do assento concluiu no MP: o adicional que ia junto vira "reembolsado". Idempotente. */
export async function concluirAdicionalNoReembolso(participacaoId: string, chaveDoReembolso: string): Promise<void> {
  const c = await cols()
  const a = await c.resumosAdicionais.findOne({ participacaoId, status: 'reembolso_processando', 'reembolso.chave': `${chaveDoReembolso}:resumo` })
  if (a) await marcarReembolsado(a, { motivo: a.reembolso?.motivo || 'Reembolso integral da monitoria', viaAssento: true })
}

/** Estorno/contestação registrado direto no MP (o dinheiro já voltou): o adicional acompanha. */
export async function adicionalRevogadoNoGateway(participacaoId: string, contestacao: boolean): Promise<void> {
  const c = await cols()
  const a = await c.resumosAdicionais.findOne({ participacaoId, status: { $ne: 'reembolsado' } })
  if (a) await marcarReembolsado(a, { motivo: contestacao ? 'Contestação (chargeback) no banco' : 'Pagamento devolvido no Mercado Pago', viaGateway: true })
}
