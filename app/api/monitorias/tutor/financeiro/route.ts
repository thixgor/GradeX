import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { idDe, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { resumir } from '@/lib/monitorias/financeiro'

export const dynamic = 'force-dynamic'

/** GET — extrato do monitor: resumo, vendas (repasses), pagamentos recebidos e lançamentos. */
export async function GET(request: NextRequest) {
  return rotaAutenticada(request, {}, async ({ sessao }) => {
    const c = await obterColecoes()
    const tutor = await c.tutores.findOne({ userId: sessao.userId })
    if (!tutor) return ok({ resumo: resumir([], 0), vendas: [], payouts: [], lancamentos: [] })
    const tutorId = idDe(tutor)
    const [repasses, payouts, lancamentos] = await Promise.all([
      c.repasses.find({ tutorId }).sort({ createdAt: -1 }).limit(200).toArray(),
      c.payouts.find({ tutorId, status: { $ne: 'cancelado' } }).sort({ createdAt: -1 }).limit(50).toArray(),
      c.lancamentos.find({ tutorId }).sort({ em: -1 }).limit(100).toArray(),
    ])
    const reservas = await c.reservas
      .find({ _id: { $in: Array.from(new Set(repasses.map((r) => r.reservaId))).filter(ObjectId.isValid).map((x) => new ObjectId(x)) } } as any, {
        projection: { anuncioTitulo: 1, inicio: 1 },
      })
      .toArray()
    const porReserva = new Map(reservas.map((r) => [idDe(r), r]))
    return ok({
      resumo: resumir(repasses, tutor.saldoDevedorCentavos || 0),
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
    })
  })
}
