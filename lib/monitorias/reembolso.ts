import 'server-only'

/**
 * Reembolso de um assento pago.
 *
 * Como ele não acontece duas vezes (o maior risco de um botão de dinheiro):
 *  1. Primeiro gravamos a INTENÇÃO no banco, com compare-and-set: o assento
 *     só aceita um reembolso "processando" por vez.
 *  2. A chave de idempotência enviada ao Mercado Pago é derivada do assento e
 *     do número do reembolso (`refund:<assento>:<n>`). Se a chamada cair no
 *     meio e o cron tentar de novo, o MP devolve o MESMO reembolso.
 *  3. Só depois do "ok" do MP o livro-razão e o repasse são ajustados.
 */

import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { getPaymentProvider } from '@/lib/payments'
import { audit } from '@/lib/payments/audit'
import { centavosParaReais, formatarCentavos } from './dinheiro'
import { colecoes, idDe } from './db'
import { estornarRepasse, liberarSePronta } from './financeiro'
import { avisar } from './avisos'
import type { DevolucaoAvulsa, Participacao, Reembolso } from './tipos'

const PODE_REEMBOLSAR: Participacao['status'][] = ['paga', 'concluida', 'reembolso_processando']
const MAX_TENTATIVAS = 6

export type ResultadoReembolso = { ok: true; total: boolean } | { ok: false; erro: string }

/**
 * @param valorBaseCentavos `null` = reembolso TOTAL (o aluno recebe tudo o que
 *   pagou, inclusive a taxa Pix). Um número = parcial, sobre o preço da aula.
 */
export async function reembolsarParticipacao(input: {
  participacaoId: string
  valorBaseCentavos: number | null
  motivo: string
  por: string
}): Promise<ResultadoReembolso> {
  const c = colecoes(await getDb())
  if (!ObjectId.isValid(input.participacaoId)) return { ok: false, erro: 'Assento inválido.' }
  const _id = new ObjectId(input.participacaoId)
  const part = await c.participacoes.findOne({ _id } as any)
  if (!part) return { ok: false, erro: 'Assento não encontrado.' }
  if (!part.providerPaymentId) return { ok: false, erro: 'Pagamento sem identificador no Mercado Pago.' }

  const jaReembolsado = part.reembolsos
    .filter((r) => r.status === 'concluido')
    .reduce((t, r) => t + r.valorCentavos, 0)
  const total = input.valorBaseCentavos === null || input.valorBaseCentavos >= part.valorCentavos - jaReembolsado
  const valor = total ? part.valorCentavos - jaReembolsado : Math.max(0, Math.round(input.valorBaseCentavos!))
  if (valor <= 0 && !total) return { ok: false, erro: 'Valor de reembolso inválido.' }

  // Retomada: já existe um reembolso em aberto → tenta concluir ESSE (nunca
  // abre outro por cima: um "falhou" antigo pode ter sido feito no MP).
  const pendente = part.reembolsos.find((r) => r.status === 'processando' || r.status === 'falhou')
  let reembolso: Reembolso
  if (pendente) {
    reembolso = pendente
  } else {
    if (!PODE_REEMBOLSAR.includes(part.status)) return { ok: false, erro: 'Este assento não pode ser reembolsado.' }
    reembolso = {
      chave: `refund:${input.participacaoId}:${part.reembolsos.length}`,
      valorCentavos: valor,
      motivo: input.motivo,
      por: input.por,
      em: new Date(),
      status: 'processando',
    }
    const cas = await c.participacoes.updateOne(
      { _id, status: part.status, 'reembolsos.status': { $nin: ['processando', 'falhou'] } } as any,
      {
        $push: { reembolsos: reembolso },
        $set: { status: 'reembolso_processando', statusAntesDoReembolso: part.status, updatedAt: new Date() },
      } as any,
    )
    if (cas.matchedCount === 0) return { ok: false, erro: 'Já existe um reembolso em andamento para este assento.' }
  }

  const ehTotal = reembolso.valorCentavos >= part.valorCentavos - jaReembolsado
  // Nova tentativa de um reembolso já pedido: a anterior pode ter dado certo no
  // MP e falhado só do nosso lado (gravar a resposta). Pergunta ao MP ANTES de
  // pedir de novo — a chave de idempotência é a segunda trava, não a única.
  const jaFeito = pendente ? await devolvidoNoGateway(part.providerPaymentId, ehTotal ? 'total' : jaReembolsado + reembolso.valorCentavos) : false
  if (!jaFeito) {
    try {
      await getPaymentProvider().refundPayment(part.providerPaymentId, {
        amountReais: ehTotal ? undefined : centavosParaReais(reembolso.valorCentavos),
        idempotencyKey: reembolso.chave,
      })
    } catch (err: any) {
      // Nunca desiste: continua "processando" e a varredura tenta de hora em
      // hora (sempre conferindo o MP antes). Na 6ª falha a equipe é avisada.
      const tentativas = ((part as any).tentativasReembolso || 0) + 1
      await c.participacoes.updateOne(
        { _id, 'reembolsos.chave': reembolso.chave } as any,
        { $set: { 'reembolsos.$.erro': String(err?.message || err).slice(0, 300), tentativasReembolso: tentativas, updatedAt: new Date() } } as any,
      )
      console.error('[monitorias] reembolso falhou:', input.participacaoId, err)
      if (tentativas === MAX_TENTATIVAS) {
        await audit({
          action: 'payment_rejected',
          targetUserId: part.alunoId,
          resourceType: 'monitoria',
          resourceId: input.participacaoId,
          metadata: { motivo: 'reembolso falhando há várias tentativas — conferir no painel do MP', chave: reembolso.chave, erro: String(err?.message || err).slice(0, 300) },
        })
      }
      return { ok: false, erro: 'O Mercado Pago não confirmou o reembolso agora. Vamos tentar de novo automaticamente.' }
    }
  }

  const statusAntes = ((part as any).statusAntesDoReembolso as Participacao['status']) || 'paga'
  // Estorno do repasse ANTES de marcar concluído (é idempotente pela chave): se
  // a função cair entre os dois, a próxima tentativa refaz sem descontar duas vezes.
  await estornarRepasse({
    participacaoId: input.participacaoId,
    valorBaseCentavos: reembolso.valorCentavos,
    total: ehTotal,
    motivo: reembolso.motivo,
    por: reembolso.por,
    chave: reembolso.chave,
  })
  // Compare-and-set: duas retomadas ao mesmo tempo (varredura + suporte) —
  // só uma conclui e avisa; a outra só confirma que já está feito.
  const concluiu = await c.participacoes.updateOne(
    { _id, reembolsos: { $elemMatch: { chave: reembolso.chave, status: { $in: ['processando', 'falhou'] } } } } as any,
    {
      $set: {
        'reembolsos.$.status': 'concluido',
        ...(jaFeito ? { 'reembolsos.$.conciliadoNoGateway': true } : {}),
        status: ehTotal ? 'reembolsada' : statusAntes,
        tentativasReembolso: 0,
        updatedAt: new Date(),
      },
    } as any,
  )
  if (!concluiu.modifiedCount) return { ok: true, total: ehTotal }
  // Reembolso parcial depois da aula concluída: o resto do repasse pode sair.
  if (!ehTotal) await liberarSePronta(part.reservaId)
  // Devolveu tudo: o contrato daquele assento deixa de valer (rescindido, com o
  // motivo). Nada é apagado — o texto assinado, o hash e as evidências ficam.
  if (ehTotal) {
    await c.contratos.updateOne(
      { participacaoId: input.participacaoId, status: { $ne: 'rescindido' } } as any,
      { $set: { status: 'rescindido', rescisao: { em: new Date(), motivo: reembolso.motivo }, updatedAt: new Date() } },
    )
  }
  await audit({
    action: 'payment_refunded',
    actorUserId: reembolso.por === 'sistema' ? undefined : reembolso.por,
    targetUserId: part.alunoId,
    resourceType: 'monitoria',
    resourceId: input.participacaoId,
    metadata: { valorCentavos: reembolso.valorCentavos, total: ehTotal, motivo: reembolso.motivo, chave: reembolso.chave },
  })

  const reserva = await c.reservas.findOne({ _id: new ObjectId(part.reservaId) } as any)
  await avisar([
    {
      userId: part.alunoId,
      titulo: 'Reembolso enviado',
      mensagem: `Reembolso de ${ehTotal ? 'todo o valor pago' : formatarCentavos(reembolso.valorCentavos)} da monitoria "${reserva?.anuncioTitulo || ''}".`,
      url: `/monitorias/reservas/${part.reservaId}`,
      email: {
        assunto: 'Seu reembolso da monitoria foi enviado',
        paragrafos: [
          `Pedimos ao Mercado Pago o reembolso da sua monitoria "${reserva?.anuncioTitulo || ''}".`,
          'O valor volta pela mesma conta/banco usada no PIX. Dependendo do banco, pode levar alguns dias para aparecer.',
        ],
        linhas: [
          ['Valor', ehTotal ? 'Integral (inclui a taxa do PIX)' : formatarCentavos(reembolso.valorCentavos)],
          ['Motivo', reembolso.motivo],
          ['Protocolo', reembolso.chave],
        ],
        botao: 'Ver a reserva',
      },
    },
    ...(reserva
      ? [
          {
            userId: reserva.tutorUserId,
            titulo: 'Reembolso a um aluno',
            mensagem: `${part.alunoNome} foi reembolsado(a) na monitoria "${reserva.anuncioTitulo}".`,
            url: `/monitorias/reservas/${part.reservaId}`,
          },
        ]
      : []),
  ])
  return { ok: true, total: ehTotal }
}

/**
 * Reembolsa TODO assento pago da reserva (cancelamento do monitor, grupo que não fechou...).
 *
 * Em duas passadas: primeiro grava a INTENÇÃO em todos os assentos
 * ("reembolso_processando", com chave) e só depois chama o Mercado Pago um a
 * um. Se a função morrer no meio (tempo limite, queda), os que faltaram já
 * estão marcados e a varredura horária termina o serviço — nenhum assento
 * pago fica esquecido numa reserva cancelada.
 */
export async function reembolsarReserva(reservaId: string, motivo: string, por: string): Promise<{ ok: number; falhas: number }> {
  const c = colecoes(await getDb())
  const pagosAntes = await c.participacoes.find({ reservaId, status: 'paga' }).toArray()
  for (const p of pagosAntes) {
    await registrarIntencao(c, p, null, motivo, por)
  }
  const pagos = await c.participacoes.find({ reservaId, status: { $in: ['paga', 'reembolso_processando'] } }).toArray()
  let ok = 0
  let falhas = 0
  for (const p of pagos) {
    const r = await reembolsarParticipacao({ participacaoId: idDe(p), valorBaseCentavos: null, motivo, por })
    if (r.ok) ok++
    else falhas++
  }
  return { ok, falhas }
}

/** Só a primeira metade do reembolso: grava a intenção com chave (compare-and-set). */
async function registrarIntencao(
  c: ReturnType<typeof colecoes>,
  part: Participacao,
  valorBaseCentavos: number | null,
  motivo: string,
  por: string,
): Promise<boolean> {
  if (part.status !== 'paga' || part.reembolsos.some((r) => r.status === 'processando' || r.status === 'falhou')) return false
  const jaReembolsado = part.reembolsos.filter((r) => r.status === 'concluido').reduce((t, r) => t + r.valorCentavos, 0)
  const valor = valorBaseCentavos === null ? part.valorCentavos - jaReembolsado : valorBaseCentavos
  if (valor <= 0) return false
  const res = await c.participacoes.updateOne(
    { _id: part._id as any, status: 'paga', 'reembolsos.status': { $nin: ['processando', 'falhou'] } } as any,
    {
      $push: { reembolsos: { chave: `refund:${idDe(part)}:${part.reembolsos.length}`, valorCentavos: valor, motivo, por, em: new Date(), status: 'processando' } },
      $set: { status: 'reembolso_processando', statusAntesDoReembolso: 'paga', updatedAt: new Date() },
    } as any,
  )
  return res.modifiedCount === 1
}

/**
 * O MP já devolveu isto? `true` só com certeza; `false` se não; `null` se não
 * deu para saber (MP fora) — aí segue com a chave de idempotência.
 */
async function devolvidoNoGateway(providerPaymentId: string, alvo: number | 'total'): Promise<boolean | null> {
  try {
    const r = await getPaymentProvider().getPayment(providerPaymentId)
    // Devolvido inteiro, ou o banco já tirou o dinheiro por contestação: não há
    // o que devolver de novo (pedir outra vez seria devolver em dobro).
    if (r.status === 'refunded' || r.status === 'charged_back') return true
    if (alvo === 'total') return false
    const raw = (r.raw || {}) as { transaction_amount_refunded?: number; refunds?: Array<{ amount?: number; status?: string }> }
    const devolvido =
      raw.transaction_amount_refunded != null
        ? Math.round(Number(raw.transaction_amount_refunded) * 100)
        : (raw.refunds || []).filter((x) => x.status !== 'rejected').reduce((t, x) => t + Math.round(Number(x.amount || 0) * 100), 0)
    return devolvido >= alvo
  } catch (err) {
    console.warn('[monitorias] consulta de reembolso no MP falhou', providerPaymentId, err)
    return null
  }
}

// ─── Devolução de pagamento avulso (não é o pagamento do assento) ───────

/**
 * Devolve um pagamento que sobrou: o mesmo assento pago duas vezes (dois QR em
 * dois aparelhos), ou um valor errado chegando com o assento já pago. Não mexe
 * no assento — o pagamento legítimo continua valendo.
 *
 * A intenção é gravada ANTES de chamar o Mercado Pago, com a chave
 * `duplicado:<pedido>`: se a chamada falhar, a varredura tenta de novo com a
 * mesma chave (o MP nunca devolve duas vezes) até concluir.
 */
export async function devolverPagamentoAvulso(input: {
  orderId: string
  providerPaymentId: string
  participacaoId: string
  alunoId: string
  motivo: string
}): Promise<boolean> {
  const c = colecoes(await getDb())
  const chave = `duplicado:${input.orderId}`
  const agora = new Date()
  const novo = await c.devolucoes.updateOne(
    { _id: chave },
    { $setOnInsert: { ...input, status: 'processando', tentativas: 0, createdAt: agora, updatedAt: agora } },
    { upsert: true },
  )
  const doc = await c.devolucoes.findOne({ _id: chave })
  if (!doc) return false
  if (doc.status !== 'processando') return doc.status === 'concluida'
  // Já existia: outra execução pode ter pedido ao MP e caído antes de gravar.
  return tentarDevolucao(doc, novo.upsertedCount === 0)
}

async function tentarDevolucao(doc: DevolucaoAvulsa, retomada: boolean): Promise<boolean> {
  const c = colecoes(await getDb())
  try {
    // Retomada: confere no MP antes de pedir de novo.
    const jaFeito = retomada ? await devolvidoNoGateway(doc.providerPaymentId, 'total') : false
    if (!jaFeito) await getPaymentProvider().refundPayment(doc.providerPaymentId, { idempotencyKey: doc._id })
    await c.devolucoes.updateOne({ _id: doc._id, status: 'processando' }, { $set: { status: 'concluida', updatedAt: new Date() }, $unset: { erro: '' } })
    await audit({
      action: 'payment_refunded',
      targetUserId: doc.alunoId,
      resourceType: 'monitoria',
      resourceId: doc.participacaoId,
      metadata: { motivo: doc.motivo, orderId: doc.orderId, providerPaymentId: doc.providerPaymentId, chave: doc._id },
    })
    return true
  } catch (err: any) {
    // Não desiste: segue "processando" (a varredura tenta de hora em hora,
    // conferindo o MP antes). Na 6ª falha a equipe é avisada.
    const tentativas = doc.tentativas + 1
    await c.devolucoes.updateOne(
      { _id: doc._id, status: 'processando' },
      { $set: { tentativas, erro: String(err?.message || err).slice(0, 300), updatedAt: new Date() } },
    )
    console.error('[monitorias] devolução avulsa falhou', doc._id, err)
    if (tentativas === MAX_TENTATIVAS) {
      await audit({
        action: 'payment_rejected',
        targetUserId: doc.alunoId,
        resourceType: 'monitoria',
        resourceId: doc.participacaoId,
        metadata: { motivo: `${doc.motivo} — devolver manualmente`, orderId: doc.orderId, providerPaymentId: doc.providerPaymentId },
      })
    }
    return false
  }
}

/** Varredura: devoluções avulsas paradas há 20 min ou mais → tenta de novo, mesma chave. */
export async function retomarDevolucoesAvulsas(agora: Date, lote: number): Promise<number> {
  const c = colecoes(await getDb())
  const paradas = await c.devolucoes
    .find({ status: 'processando', updatedAt: { $lt: new Date(agora.getTime() - 20 * 60_000) } })
    .limit(lote)
    .toArray()
  let ok = 0
  for (const d of paradas) if (await tentarDevolucao(d, true)) ok++
  return ok
}
