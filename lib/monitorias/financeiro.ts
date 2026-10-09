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

/** Garantia vencida → valor disponível para repasse. */
export async function liberarRepassesDaReserva(reservaId: string, quando: Date): Promise<number> {
  const c = colecoes(await getDb())
  const res = await c.repasses.updateMany(
    { reservaId, status: 'em_garantia' },
    { $set: { status: 'liberado', liberaEm: quando, updatedAt: new Date() } },
  )
  return res.modifiedCount
}

/**
 * Ajusta o repasse depois de um reembolso de `valorBaseCentavos` (a parte do
 * preço da aula; a taxa Pix devolvida ao aluno não é dinheiro do monitor).
 */
export async function estornarRepasse(input: {
  participacaoId: string
  valorBaseCentavos: number
  total: boolean
  motivo: string
  por: string
}): Promise<void> {
  const c = colecoes(await getDb())
  const repasse = await c.repasses.findOne({ participacaoId: input.participacaoId })
  if (!repasse || repasse.status === 'estornado') return

  const novoBruto = input.total ? 0 : Math.max(0, repasse.brutoCentavos - input.valorBaseCentavos)
  const nova = dividirValor(novoBruto)
  const perdaLiquida = repasse.liquidoTutorCentavos - nova.liquidoTutorCentavos

  if (repasse.status === 'pago' || repasse.status === 'em_pagamento') {
    // O dinheiro já saiu (ou está saindo) para o monitor: vira dívida dele.
    await c.tutores.updateOne(
      { _id: oidSeguro(repasse.tutorId) as any },
      { $inc: { saldoDevedorCentavos: perdaLiquida }, $set: { updatedAt: new Date() } },
    )
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

  await c.repasses.updateOne(
    { _id: repasse._id as any, status: repasse.status },
    {
      $set: {
        ...(novoBruto === 0 ? { status: 'estornado' as const } : {}),
        brutoCentavos: nova.brutoCentavos,
        taxaPlataformaCentavos: nova.taxaPlataformaCentavos,
        liquidoTutorCentavos: nova.liquidoTutorCentavos,
        updatedAt: new Date(),
      },
    },
  )
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
