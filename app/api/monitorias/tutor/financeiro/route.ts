import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { idDe, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { jsonComprimido } from '@/lib/resposta-comprimida'
import { resumir } from '@/lib/monitorias/financeiro'

export const dynamic = 'force-dynamic'

const LIMITE_VENDAS = 500
const LIMITE_PAGAMENTOS = 200
const LIMITE_LANCAMENTOS = 300

/** GET — extrato do monitor: resumo, vendas (repasses), pagamentos recebidos e lançamentos. */
export async function GET(request: NextRequest) {
  return rotaAutenticada(request, {}, async ({ sessao }) => {
    const c = await obterColecoes()
    const tutor = await c.tutores.findOne({ userId: sessao.userId })
    if (!tutor) return ok({ resumo: resumir([], 0), vendas: [], payouts: [], lancamentos: [] })
    const tutorId = idDe(tutor)
    // Listas com teto alto (as mais recentes), mas o RESUMO soma todos os
    // repasses no banco — senão "Pago" ficaria errado para quem vende muito.
    const [repasses, payouts, lancamentos, porStatus] = await Promise.all([
      c.repasses.find({ tutorId }).sort({ createdAt: -1 }).limit(LIMITE_VENDAS).toArray(),
      c.payouts.find({ tutorId, status: { $ne: 'cancelado' } }).sort({ createdAt: -1 }).limit(LIMITE_PAGAMENTOS).toArray(),
      c.lancamentos.find({ tutorId }).sort({ em: -1 }).limit(LIMITE_LANCAMENTOS).toArray(),
      c.repasses
        .aggregate<{ _id: string; total: number }>([{ $match: { tutorId } }, { $group: { _id: '$status', total: { $sum: '$liquidoTutorCentavos' } } }])
        .toArray(),
    ])
    const soma = (s: string) => porStatus.find((x) => x._id === s)?.total || 0
    const reservas = await c.reservas
      .find({ _id: { $in: Array.from(new Set(repasses.map((r) => r.reservaId))).filter(ObjectId.isValid).map((x) => new ObjectId(x)) } } as any, {
        projection: { anuncioTitulo: 1, inicio: 1 },
      })
      .toArray()
    const porReserva = new Map(reservas.map((r) => [idDe(r), r]))
    return jsonComprimido(request, {
      resumo: {
        emGarantiaCentavos: soma('em_garantia'),
        liberadoCentavos: soma('liberado'),
        emPagamentoCentavos: soma('em_pagamento'),
        pagoCentavos: soma('pago'),
        saldoDevedorCentavos: tutor.saldoDevedorCentavos || 0,
      },
      cortado: { vendas: repasses.length === LIMITE_VENDAS, pagamentos: payouts.length === LIMITE_PAGAMENTOS, lancamentos: lancamentos.length === LIMITE_LANCAMENTOS },
      vendas: repasses.map((r) => ({
        id: idDe(r),
        participacaoId: r.participacaoId,
        reservaId: r.reservaId,
        anuncioTitulo: porReserva.get(r.reservaId)?.anuncioTitulo || 'Monitoria',
        inicio: porReserva.get(r.reservaId)?.inicio || null,
        brutoCentavos: r.brutoCentavos,
        taxaCentavos: r.taxaPlataformaCentavos,
        liquidoCentavos: r.liquidoTutorCentavos,
        status: r.status,
        liberaEm: r.liberaEm || null,
        createdAt: r.createdAt,
      })),
      payouts: payouts.map((p) => ({
        id: idDe(p),
        totalCentavos: p.totalCentavos,
        abatidoCentavos: p.abatidoCentavos,
        status: p.status,
        pix: p.pix.mascarada,
        e2eId: p.e2eId || null,
        pagoEm: p.pagoEm || null,
        temComprovante: !!p.comprovantePath,
        createdAt: p.createdAt,
      })),
      lancamentos: lancamentos.map((l) => ({ tipo: l.tipo, valorCentavos: l.valorCentavos, descricao: l.descricao, em: l.em })),
    }, { headers: { 'Cache-Control': 'private, no-store' } })
  })
}
