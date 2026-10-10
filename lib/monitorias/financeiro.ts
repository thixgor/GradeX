import 'server-only'

/**
 * Livro-razão das monitorias: repasses (o que é do monitor) e lançamentos
 * (o histórico imutável de cada centavo).
 *
 * Ciclo de um repasse, com uma aula de R$ 100:
 *   pagamento aprovado → repasse em_garantia (bruto 10000, taxa 1000, líquido 9000)
 *   aula + 48h sem reclamação → liberado
 *   admin cria o pagamento ao monitor → em_pagamento
 *   admin anexa comprovante + E2E → pago
 * Estorno antes de pagar → estornado. Estorno depois de pago → saldo devedor
 * do monitor, abatido do próximo pagamento.
 */

import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { centavosParaReais, dividirValor } from './dinheiro'
import { colecoes, idDe } from './db'
import type { Lancamento, Participacao, Repasse } from './tipos'

type NovoLancamento = Omit<Lancamento, '_id' | 'em'>

export async function lancar(itens: NovoLancamento[]): Promise<void> {
  if (!itens.length) return
  const c = colecoes(await getDb())
  const em = new Date()
  await c.lancamentos.insertMany(itens.map((i) => ({ ...i, em })))
}

/** Cria o repasse em garantia (idempotente: um por participação). */
export async function abrirRepasse(participacao: Participacao, reserva: { _id?: unknown; tutorUserId: string }): Promise<void> {
  const c = colecoes(await getDb())
  const divisao = dividirValor(participacao.valorCentavos)
  const agora = new Date()
  const res = await c.repasses.updateOne(
    { participacaoId: idDe(participacao) },
    {
      $setOnInsert: {
        participacaoId: idDe(participacao),
        reservaId: idDe(reserva),
        tutorId: participacao.tutorId,
        tutorUserId: reserva.tutorUserId,
        ...divisao,
        status: 'em_garantia',
        createdAt: agora,
        updatedAt: agora,
      },
    },
    { upsert: true },
  )
  if (res.upsertedCount === 1) {
    const repasseId = String(res.upsertedId)
    await lancar([
      {
        tutorId: participacao.tutorId,
        repasseId,
        participacaoId: idDe(participacao),
        tipo: 'credito_bruto',
        valorCentavos: divisao.brutoCentavos,
        descricao: `Monitoria paga por ${participacao.alunoNome}`,
        por: 'sistema',
      },
      {
        tutorId: participacao.tutorId,
        repasseId,
        participacaoId: idDe(participacao),
        tipo: 'taxa_plataforma',
        valorCentavos: -divisao.taxaPlataformaCentavos,
        descricao: 'Taxa da plataforma (10%)',
        por: 'sistema',
      },
    ])
  }
}

/**
 * Garantia vencida → valor disponível para repasse. Só libera o repasse de
 * assento sem pendência: pago/concluído, sem reembolso em andamento ou falho
 * e sem pedido de cancelamento esperando o suporte. O que fica para trás é
 * liberado quando a pendência se resolve (`liberarSePronta`).
 */
export async function liberarRepassesDaReserva(reservaId: string, quando: Date): Promise<number> {
  const c = colecoes(await getDb())
  const prontos = await c.participacoes
    .find(
      {
        reservaId,
        status: { $in: ['paga', 'concluida'] },
        'reembolsos.status': { $nin: ['processando', 'falhou'] },
        cancelamentoPedidoEm: { $exists: false },
      } as any,
      { projection: { _id: 1 } },
    )
    .toArray()
  if (!prontos.length) return 0
  const res = await c.repasses.updateMany(
    { reservaId, status: 'em_garantia', participacaoId: { $in: prontos.map((p) => idDe(p)) } },
    { $set: { status: 'liberado', liberaEm: quando, updatedAt: new Date() } },
  )
  return res.modifiedCount
}

/** Pendência resolvida depois da conclusão da aula → libera o que ficou retido. */
export async function liberarSePronta(reservaId: string): Promise<void> {
  const c = colecoes(await getDb())
  const reserva = await c.reservas.findOne({ _id: oidSeguro(reservaId) as any }, { projection: { status: 1 } })
  if (reserva?.status === 'concluida') await liberarRepassesDaReserva(reservaId, new Date())
}

/**
 * Ajusta o repasse depois de um reembolso de `valorBaseCentavos` (a parte do
 * preço da aula; a taxa Pix devolvida ao aluno não é dinheiro do monitor).
 *
 * Idempotente pela `chave` do reembolso (rota e cron podem chamar duas vezes)
 * e cumulativo: dois reembolsos parciais descontam sobre o que sobrou, nunca
 * duas vezes sobre o valor cheio. Toda escrita é compare-and-set; se o repasse
 * mudou no meio (ex.: o admin acabou de criar o pagamento), relê e refaz no
 * ramo certo.
 *
 * Exemplo: aula de R$ 100 já paga ao monitor (R$ 90). Reembolso de R$ 50 →
 * dívida de R$ 45. Reembolso do resto → mais R$ 45. Total R$ 90, nunca mais.
 */
export async function estornarRepasse(input: {
  participacaoId: string
  valorBaseCentavos: number
  total: boolean
  motivo: string
  por: string
  /** Chave do reembolso (ou do chargeback): a mesma chave nunca estorna duas vezes. */
  chave: string
}): Promise<void> {
  const c = colecoes(await getDb())
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    const repasse = await c.repasses.findOne({ participacaoId: input.participacaoId })
    if (!repasse || repasse.status === 'estornado') return
    if ((repasse.estornos || []).some((e) => e.chave === input.chave)) return

    const jaPosPago = repasse.brutoEstornadoAposPagoCentavos || 0
    const pago = repasse.status === 'pago' || repasse.status === 'em_pagamento'
    const baseAtual = Math.max(0, repasse.brutoCentavos - (pago ? jaPosPago : 0))
    const novoBruto = input.total ? 0 : Math.max(0, baseAtual - input.valorBaseCentavos)
    const perdaLiquida = dividirValor(baseAtual).liquidoTutorCentavos - dividirValor(novoBruto).liquidoTutorCentavos
    const marca = { chave: input.chave, perdaCentavos: perdaLiquida, em: new Date() }

    if (pago) {
      // O dinheiro já saiu (ou está saindo) para o monitor: vira dívida dele.
      const res = await c.repasses.updateOne(
        {
          _id: repasse._id as any,
          status: repasse.status,
          'estornos.chave': { $ne: input.chave },
          brutoEstornadoAposPagoCentavos: jaPosPago === 0 ? { $in: [0, null] } : jaPosPago,
        } as any,
        {
          $push: { estornos: marca },
          $set: { brutoEstornadoAposPagoCentavos: jaPosPago + (baseAtual - novoBruto), updatedAt: new Date() },
        } as any,
      )
      if (!res.matchedCount) continue
      if (perdaLiquida > 0) {
        await c.tutores.updateOne(
          { _id: oidSeguro(repasse.tutorId) as any },
          { $inc: { saldoDevedorCentavos: perdaLiquida }, $set: { updatedAt: new Date() } },
        )
      }
      await lancar([
        {
          tutorId: repasse.tutorId,
          repasseId: idDe(repasse),
          participacaoId: input.participacaoId,
          tipo: 'saldo_devedor',
          valorCentavos: -perdaLiquida,
          descricao: `Estorno após repasse: ${input.motivo}`,
          por: input.por,
        },
      ])
      return
    }

    const nova = dividirValor(novoBruto)
    const res = await c.repasses.updateOne(
      { _id: repasse._id as any, status: repasse.status, brutoCentavos: repasse.brutoCentavos, 'estornos.chave': { $ne: input.chave } } as any,
      {
        $push: { estornos: marca },
        $set: {
          ...(novoBruto === 0 ? { status: 'estornado' as const } : {}),
          brutoCentavos: nova.brutoCentavos,
          taxaPlataformaCentavos: nova.taxaPlataformaCentavos,
          liquidoTutorCentavos: nova.liquidoTutorCentavos,
          updatedAt: new Date(),
        },
      } as any,
    )
    if (!res.matchedCount) continue
    await lancar([
      {
        tutorId: repasse.tutorId,
        repasseId: idDe(repasse),
        participacaoId: input.participacaoId,
        tipo: 'estorno',
        valorCentavos: -perdaLiquida,
        descricao: `Reembolso ao aluno: ${input.motivo}`,
        por: input.por,
      },
    ])
    return
  }
  console.error('[monitorias] estorno não aplicado após 4 tentativas:', input.participacaoId, input.chave)
}

/** tutorId é o `_id` (string) do documento do tutor. */
function oidSeguro(id: string) {
  return ObjectId.isValid(id) ? new ObjectId(id) : id
}

export interface ResumoFinanceiro {
  emGarantiaCentavos: number
  liberadoCentavos: number
  emPagamentoCentavos: number
  pagoCentavos: number
  saldoDevedorCentavos: number
}

export function resumir(repasses: Repasse[], saldoDevedorCentavos: number): ResumoFinanceiro {
  const soma = (s: Repasse['status']) =>
    repasses.filter((r) => r.status === s).reduce((t, r) => t + r.liquidoTutorCentavos, 0)
  return {
    emGarantiaCentavos: soma('em_garantia'),
    liberadoCentavos: soma('liberado'),
    emPagamentoCentavos: soma('em_pagamento'),
    pagoCentavos: soma('pago'),
    saldoDevedorCentavos,
  }
}

export { centavosParaReais }
