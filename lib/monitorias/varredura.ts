import 'server-only'

/**
 * Varredura de hora em hora (cron `/api/cron/monitorias`). Cada passo é
 * idempotente — rodar duas vezes seguidas não faz nada em dobro — e trabalha
 * em lotes pequenos para caber no tempo da função.
 *
 *  1. Pedido sem resposta há 72h → expira.
 *  2. Prazo de assinatura/pagamento vencido → confere o PIX no Mercado Pago;
 *     se não pagou, expira e solta o horário (reembolsando quem pagou num grupo
 *     que não fechou).
 *  3. Aula começou há pouco → lembretes de 24h e 1h antes.
 *  4. Aula acabou → "realizada" (pede avaliação; abre a janela de 48h).
 *  5. 48h depois sem reclamação → confere cada pagamento no Mercado Pago
 *     (divergência retém o repasse daquele assento) → "concluída" e o valor
 *     do monitor é liberado.
 *  2b. Reserva aguardando pagamento → rede de segurança da aprovação (pedido
 *     aprovado sem assento pago, assento pago sem repasse, grupo todo pago).
 *  6. Reembolso que falhou → tenta de novo com a MESMA chave (inclusive a
 *     devolução de PIX pago em dobro).
 *  7. Troca de chave PIX após a carência de 48h → passa a valer.
 */

import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { getPaymentProvider } from '@/lib/payments'
import { applyPaymentResult } from '@/lib/payments/effects'
import { formatarEmBrasilia } from '@/lib/fuso-brasilia'
import type { PaymentOrder } from '@/lib/types'
import { colecoes, idDe } from './db'
import { liberarRepassesDaReserva } from './financeiro'
import { avisar } from './avisos'
import { liberarBlocos } from './reservas'
import { reembolsarParticipacao, reembolsarReserva, retomarDevolucoesAvulsas } from './reembolso'
import { conferirComGateway, curarPagamentosDaReserva } from './pagamento'
import { rescindirContratosDaReserva } from './contratos'
import { liberacaoDoValor } from './politica'
import type { Reserva } from './tipos'

const LOTE = 100
const H = 3_600_000

export interface RelatorioVarredura {
  pedidosExpirados: number
  pagamentosExpirados: number
  lembretes: number
  realizadas: number
  concluidas: number
  reembolsosRetomados: number
  pixAtivados: number
  erros: number
}

async function expirarReserva(reserva: Reserva, motivo: string): Promise<boolean> {
  const c = colecoes(await getDb())
  const id = idDe(reserva)
  const res = await c.reservas.updateOne(
    { _id: reserva._id as any, status: reserva.status, versao: reserva.versao },
    { $set: { status: 'expirada', motivoCancelamento: motivo, updatedAt: new Date() }, $inc: { versao: 1 } },
  )
  if (res.matchedCount === 0) return false
  await Promise.all([
    liberarBlocos(id),
    rescindirContratosDaReserva(id),
    c.cotasGratis.deleteMany({ reservaId: id }),
    c.participacoes.updateMany(
      { reservaId: id, status: { $in: ['aguardando_assinatura', 'aguardando_pagamento'] } },
      { $set: { status: 'expirada', updatedAt: new Date() } },
    ),
  ])
  await reembolsarReserva(id, motivo, 'sistema')
  return true
}

/** Antes de expirar por falta de pagamento, pergunta ao MP se o PIX caiu. */
async function reconciliarPagamentos(reservaId: string): Promise<void> {
  const db = await getDb()
  const c = colecoes(db)
  const pendentes = await c.participacoes.find({ reservaId, status: 'aguardando_pagamento', paymentOrderId: { $exists: true } }).toArray()
  for (const p of pendentes) {
    if (!p.paymentOrderId || !ObjectId.isValid(p.paymentOrderId)) continue
    const order = await db.collection<PaymentOrder>('payment_orders').findOne({ _id: new ObjectId(p.paymentOrderId) as any })
    if (!order?.providerPaymentId || order.status === 'approved') continue
    try {
      const atual = await getPaymentProvider().getPayment(order.providerPaymentId)
      if (atual.status !== order.status) await applyPaymentResult(String(order._id), atual)
    } catch (err) {
      console.warn('[monitorias/varredura] reconciliação falhou', p.paymentOrderId, err)
    }
  }
}

export async function varrer(agora = new Date()): Promise<RelatorioVarredura> {
  const c = colecoes(await getDb())
  const r: RelatorioVarredura = {
    pedidosExpirados: 0,
    pagamentosExpirados: 0,
    lembretes: 0,
    realizadas: 0,
    concluidas: 0,
    reembolsosRetomados: 0,
    pixAtivados: 0,
    erros: 0,
  }
  const seguro = async (fn: () => Promise<void>) => {
    try {
      await fn()
    } catch (err) {
      r.erros++
      console.error('[monitorias/varredura]', err)
    }
  }

  // 1. Pedidos parados há 72h.
  const parados = await c.reservas
    .find({ status: { $in: ['solicitada', 'em_negociacao'] }, ultimaAtividadeEm: { $lt: new Date(agora.getTime() - 72 * H) } })
    .limit(LOTE)
    .toArray()
  for (const reserva of parados) {
    await seguro(async () => {
      if (await expirarReserva(reserva, 'Sem resposta em 72 horas')) {
        r.pedidosExpirados++
        await avisar(
          [reserva.solicitanteId, reserva.tutorUserId].map((userId) => ({
            userId,
            titulo: 'Pedido de monitoria expirado',
            mensagem: `"${reserva.anuncioTitulo}" ficou 72h sem andamento e expirou.`,
            url: `/monitorias/reservas/${idDe(reserva)}`,
          })),
        )
      }
    })
  }

  // 2. Prazo de assinatura/pagamento vencido.
  const vencidas = await c.reservas
    .find({ status: { $in: ['aguardando_assinaturas', 'aguardando_pagamento'] }, prazoPagamento: { $lt: agora } })
    .limit(LOTE)
    .toArray()
  for (const reserva of vencidas) {
    await seguro(async () => {
      await reconciliarPagamentos(idDe(reserva))
      // PIX que caiu (ou aprovação que ficou pela metade) com todos pagos →
      // confirma em vez de expirar e devolver o dinheiro de quem pagou.
      await curarPagamentosDaReserva(reserva)
      const atual = await c.reservas.findOne({ _id: reserva._id as any })
      if (!atual || !['aguardando_assinaturas', 'aguardando_pagamento'].includes(atual.status)) return
      const pagos = await c.participacoes.countDocuments({ reservaId: idDe(atual), status: 'paga' })
      const motivo = pagos > 0 ? 'O grupo não completou o pagamento a tempo' : 'Prazo de assinatura/pagamento encerrado'
      if (await expirarReserva(atual, motivo)) {
        r.pagamentosExpirados++
        const pessoas = await c.participacoes.find({ reservaId: idDe(atual) }, { projection: { alunoId: 1 } }).toArray()
        await avisar(
          Array.from(new Set([atual.tutorUserId, atual.solicitanteId, ...pessoas.map((p) => p.alunoId)])).map((userId) => ({
            userId,
            titulo: 'Reserva expirada',
            mensagem: `"${atual.anuncioTitulo}": ${motivo.toLowerCase()}. O horário foi liberado${pagos ? ' e quem pagou foi reembolsado' : ''}.`,
            url: `/monitorias/reservas/${idDe(atual)}`,
          })),
        )
      }
    })
  }

  // 2b. Aprovação pela metade em reserva ainda no prazo (parada há 10 min+).
  const pendentes = await c.reservas
    .find({ status: 'aguardando_pagamento', updatedAt: { $lt: new Date(agora.getTime() - 10 * 60_000) }, prazoPagamento: { $gte: agora } } as any)
    .limit(LOTE)
    .toArray()
  for (const reserva of pendentes) await seguro(() => curarPagamentosDaReserva(reserva))

  // 3. Lembretes (24h e 1h antes).
  const proximas = await c.reservas
    .find({ status: 'confirmada', inicio: { $gt: agora, $lte: new Date(agora.getTime() + 24 * H) } })
    .limit(LOTE)
    .toArray()
  for (const reserva of proximas) {
    await seguro(async () => {
      const falta = reserva.inicio!.getTime() - agora.getTime()
      const chave = falta <= 1.5 * H ? 'h1' : 'h24'
      if (reserva.lembretes?.[chave]) return
      if (chave === 'h24' && reserva.lembretes?.h1) return
      const marcou = await c.reservas.updateOne(
        { _id: reserva._id as any, [`lembretes.${chave}`]: { $exists: false } } as any,
        { $set: { [`lembretes.${chave}`]: agora } },
      )
      if (marcou.modifiedCount === 0) return
      r.lembretes++
      const alunos = await c.participacoes.find({ reservaId: idDe(reserva), status: { $in: ['paga', 'gratis'] } }).toArray()
      const quando = formatarEmBrasilia(reserva.inicio!, { weekday: 'long', hour: '2-digit', minute: '2-digit' })
      await avisar(
        [reserva.tutorUserId, ...alunos.map((a) => a.alunoId)].map((userId) => ({
          userId,
          titulo: chave === 'h1' ? 'Sua monitoria começa em 1 hora ⏰' : 'Monitoria amanhã 📚',
          mensagem: `"${reserva.anuncioTitulo}" — ${quando} (Brasília).`,
          url: `/monitorias/reservas/${idDe(reserva)}`,
          email: {
            assunto: chave === 'h1' ? `Começa em 1 hora: ${reserva.anuncioTitulo}` : `Lembrete: ${reserva.anuncioTitulo}`,
            paragrafos: [
              `A monitoria "${reserva.anuncioTitulo}" é ${quando} (horário de Brasília).`,
              userId === reserva.tutorUserId && !reserva.linkReuniao
                ? 'Você ainda não colocou o link da reunião. Adicione na página da reserva.'
                : 'O link da reunião está na página da reserva.',
            ],
            botao: 'Abrir a reserva',
          },
        })),
      )
    })
  }

  // 4. Aula acabou → realizada.
  const terminadas = await c.reservas.find({ status: 'confirmada', fim: { $lt: agora } }).limit(LOTE).toArray()
  for (const reserva of terminadas) {
    await seguro(async () => {
      const res = await c.reservas.updateOne(
        { _id: reserva._id as any, status: 'confirmada', versao: reserva.versao },
        { $set: { status: 'realizada', updatedAt: agora }, $inc: { versao: 1 } },
      )
      if (res.matchedCount === 0) return
      r.realizadas++
      const alunos = await c.participacoes.find({ reservaId: idDe(reserva), status: { $in: ['paga', 'gratis'] } }).toArray()
      const ate = formatarEmBrasilia(liberacaoDoValor(reserva.fim!), { dateStyle: 'short', timeStyle: 'short' })
      await avisar(
        alunos.map((a) => ({
          userId: a.alunoId,
          titulo: 'Como foi a monitoria?',
          mensagem: `Avalie "${reserva.anuncioTitulo}". Teve problema? Reporte até ${ate}.`,
          url: `/monitorias/reservas/${idDe(reserva)}`,
          email: {
            assunto: `Como foi a monitoria "${reserva.anuncioTitulo}"?`,
            paragrafos: [
              'Sua avaliação ajuda outros alunos a escolher bem.',
              `Se o monitor faltou ou a aula não aconteceu como combinado, reporte o problema até ${ate} (Brasília) — o valor fica retido até a análise.`,
            ],
            botao: 'Avaliar ou reportar',
          },
        })),
      )
    })
  }

  // 5. 48h depois sem disputa → concluída, valor liberado.
  const garantidas = await c.reservas
    .find({ status: 'realizada', fim: { $lt: new Date(agora.getTime() - 48 * H) } })
    .limit(LOTE)
    .toArray()
  for (const reserva of garantidas) {
    await seguro(async () => {
      // Antes de o dinheiro sair da garantia: confere cada pagamento no MP.
      // MP fora do ar → tenta na próxima hora (nada é liberado no escuro).
      if (!(await conferirComGateway(reserva))) return
      const res = await c.reservas.updateOne(
        { _id: reserva._id as any, status: 'realizada', versao: reserva.versao },
        { $set: { status: 'concluida', updatedAt: agora }, $inc: { versao: 1 } },
      )
      if (res.matchedCount === 0) return
      r.concluidas++
      await concluirReserva(reserva, agora)
    })
  }

  // 6. Reembolsos presos.
  const presos = await c.participacoes
    .find({ 'reembolsos.status': { $in: ['processando', 'falhou'] }, status: 'reembolso_processando', updatedAt: { $lt: new Date(agora.getTime() - 20 * 60_000) } } as any)
    .limit(LOTE)
    .toArray()
  for (const p of presos) {
    await seguro(async () => {
      const pendente = p.reembolsos.find((x) => x.status === 'processando' || x.status === 'falhou')
      if (!pendente) return
      const out = await reembolsarParticipacao({ participacaoId: idDe(p), valorBaseCentavos: pendente.valorCentavos, motivo: pendente.motivo, por: pendente.por })
      if (out.ok) r.reembolsosRetomados++
    })
  }

  // 6a. PIX pago em dobro cuja devolução falhou → mesma chave, de novo.
  await seguro(async () => {
    r.reembolsosRetomados += await retomarDevolucoesAvulsas(agora, LOTE)
  })

  // 6b. Rede de segurança: assento PAGO numa reserva já encerrada (PIX que caiu
  // no mesmo instante do cancelamento, função que morreu no meio de um lote).
  const encerradas = await c.reservas
    .find(
      {
        status: { $in: ['cancelada_aluno', 'cancelada_monitor', 'expirada', 'recusada', 'reembolsada'] },
        updatedAt: { $gt: new Date(agora.getTime() - 14 * 24 * H), $lt: new Date(agora.getTime() - 20 * 60_000) },
      } as any,
      { projection: { _id: 1 } },
    )
    .limit(LOTE)
    .toArray()
  if (encerradas.length) {
    const orfas = await c.participacoes
      .find({ reservaId: { $in: encerradas.map((x) => idDe(x)) }, status: 'paga' }, { projection: { _id: 1 } })
      .limit(LOTE)
      .toArray()
    for (const p of orfas) {
      await seguro(async () => {
        const out = await reembolsarParticipacao({ participacaoId: idDe(p), valorBaseCentavos: null, motivo: 'Reserva encerrada: devolução automática do pagamento', por: 'sistema' })
        if (out.ok) r.reembolsosRetomados++
      })
    }
  }

  // 7. Chave PIX nova depois da carência.
  const trocas = await c.tutores.find({ 'pixPendente.liberaEm': { $lt: agora } }).limit(LOTE).toArray()
  for (const t of trocas) {
    await seguro(async () => {
      const { liberaEm: _ignorado, ...nova } = t.pixPendente!
      const res = await c.tutores.updateOne(
        { _id: t._id as any, 'pixPendente.liberaEm': t.pixPendente!.liberaEm },
        { $set: { pix: nova, updatedAt: agora }, $unset: { pixPendente: '' } },
      )
      if (res.modifiedCount) {
        r.pixAtivados++
        await avisar([
          {
            userId: t.userId,
            titulo: 'Nova chave PIX ativa',
            mensagem: `Seus repasses agora vão para ${nova.mascarada}.`,
            url: '/monitorias/painel/perfil',
            email: { assunto: 'Sua nova chave PIX de monitor está ativa', paragrafos: [`A partir de agora, os repasses vão para ${nova.mascarada}. Não foi você? Fale com o suporte imediatamente.`] },
          },
        ])
      }
    })
  }

  return r
}

/** Fecha a reserva: assentos concluídos, valor liberado, estatística do monitor. */
export async function concluirReserva(reserva: Reserva, agora = new Date()): Promise<void> {
  const c = colecoes(await getDb())
  const id = idDe(reserva)
  await Promise.all([
    c.participacoes.updateMany({ reservaId: id, status: { $in: ['paga', 'gratis'] } }, { $set: { status: 'concluida', updatedAt: agora } }),
    liberarRepassesDaReserva(id, agora),
    c.tutores.updateOne({ _id: new ObjectId(reserva.tutorId) } as any, { $inc: { 'stats.aulasDadas': 1 } }),
  ])
  const liberado = await c.repasses.find({ reservaId: id, status: 'liberado' }).toArray()
  const total = liberado.reduce((t, x) => t + x.liquidoTutorCentavos, 0)
  if (total > 0) {
    const { formatarCentavos } = await import('./dinheiro')
    await avisar([
      {
        userId: reserva.tutorUserId,
        titulo: 'Valor liberado para repasse',
        mensagem: `${formatarCentavos(total)} de "${reserva.anuncioTitulo}" saíram da garantia.`,
        url: '/monitorias/painel/financeiro',
        email: {
          assunto: `Valor liberado: ${formatarCentavos(total)}`,
          paragrafos: ['A garantia de 48h terminou sem reclamações. O valor entra na próxima rodada de repasses por PIX.'],
          botao: 'Ver painel financeiro',
        },
      },
    ])
  }
}
