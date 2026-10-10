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
import type { Participacao, Reembolso } from './tipos'

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

  // Retomada: já existe um reembolso processando → tenta concluir ESSE.
  const pendente = part.reembolsos.find((r) => r.status === 'processando')
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
      { _id, status: part.status, 'reembolsos.status': { $ne: 'processando' } } as any,
      {
        $push: { reembolsos: reembolso },
        $set: { status: 'reembolso_processando', statusAntesDoReembolso: part.status, updatedAt: new Date() },
      } as any,
    )
    if (cas.matchedCount === 0) return { ok: false, erro: 'Já existe um reembolso em andamento para este assento.' }
  }

  const ehTotal = reembolso.valorCentavos >= part.valorCentavos - jaReembolsado
  try {
    await getPaymentProvider().refundPayment(part.providerPaymentId, {
      amountReais: ehTotal ? undefined : centavosParaReais(reembolso.valorCentavos),
      idempotencyKey: reembolso.chave,
    })
  } catch (err: any) {
    const tentativas = ((part as any).tentativasReembolso || 0) + 1
    await c.participacoes.updateOne(
      { _id, 'reembolsos.chave': reembolso.chave } as any,
      {
        $set: {
          'reembolsos.$.erro': String(err?.message || err).slice(0, 300),
          ...(tentativas >= MAX_TENTATIVAS ? { 'reembolsos.$.status': 'falhou' } : {}),
          tentativasReembolso: tentativas,
          updatedAt: new Date(),
        },
      } as any,
    )
    console.error('[monitorias] reembolso falhou:', input.participacaoId, err)
    return { ok: false, erro: 'O Mercado Pago não confirmou o reembolso agora. Vamos tentar de novo automaticamente.' }
  }

  const statusAntes = ((part as any).statusAntesDoReembolso as Participacao['status']) || 'paga'
  await c.participacoes.updateOne(
    { _id, 'reembolsos.chave': reembolso.chave } as any,
    {
      $set: {
        'reembolsos.$.status': 'concluido',
        status: ehTotal ? 'reembolsada' : statusAntes,
        tentativasReembolso: 0,
        updatedAt: new Date(),
      },
    } as any,
  )
  await estornarRepasse({
    participacaoId: input.participacaoId,
    valorBaseCentavos: reembolso.valorCentavos,
    total: ehTotal,
    motivo: reembolso.motivo,
    por: reembolso.por,
    chave: reembolso.chave,
  })
  // Reembolso parcial depois da aula concluída: o resto do repasse pode sair.
  if (!ehTotal) await liberarSePronta(part.reservaId)
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
  if (part.status !== 'paga' || part.reembolsos.some((r) => r.status === 'processando')) return false
  const jaReembolsado = part.reembolsos.filter((r) => r.status === 'concluido').reduce((t, r) => t + r.valorCentavos, 0)
  const valor = valorBaseCentavos === null ? part.valorCentavos - jaReembolsado : valorBaseCentavos
  if (valor <= 0) return false
  const res = await c.participacoes.updateOne(
    { _id: part._id as any, status: 'paga', 'reembolsos.status': { $ne: 'processando' } } as any,
    {
      $push: { reembolsos: { chave: `refund:${idDe(part)}:${part.reembolsos.length}`, valorCentavos: valor, motivo, por, em: new Date(), status: 'processando' } },
      $set: { status: 'reembolso_processando', statusAntesDoReembolso: 'paga', updatedAt: new Date() },
    } as any,
  )
  return res.modifiedCount === 1
}
