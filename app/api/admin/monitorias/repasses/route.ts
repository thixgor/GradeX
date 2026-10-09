import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { idDe, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'

export const dynamic = 'force-dynamic'

/**
 * GET — fila de repasse: monitores com valor LIBERADO (agrupado), pagamentos
 * em aberto e os últimos pagos. Valor em garantia aparece só como informação.
 */
export async function GET(request: NextRequest) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async () => {
    const c = await obterColecoes()
    const [porTutor, garantia, payouts] = await Promise.all([
      c.repasses
        .aggregate<{ _id: string; total: number; qtd: number }>([
          { $match: { status: 'liberado' } },
          { $group: { _id: '$tutorId', total: { $sum: '$liquidoTutorCentavos' }, qtd: { $sum: 1 } } },
          { $sort: { total: -1 } },
          { $limit: 200 },
        ])
        .toArray(),
      c.repasses.aggregate<{ _id: null; total: number }>([{ $match: { status: 'em_garantia' } }, { $group: { _id: null, total: { $sum: '$liquidoTutorCentavos' } } }]).toArray(),
      c.payouts.find({ status: { $in: ['aberto', 'pago'] } }).sort({ createdAt: -1 }).limit(60).toArray(),
    ])
    const tutorIds = Array.from(new Set([...porTutor.map((t) => t._id), ...payouts.map((p) => p.tutorId)])).filter(ObjectId.isValid)
    const tutores = await c.tutores.find({ _id: { $in: tutorIds.map((x) => new ObjectId(x)) } } as any).toArray()
    const t = new Map(tutores.map((x) => [idDe(x), x]))
    return ok({
      emGarantiaCentavos: garantia[0]?.total || 0,
      fila: porTutor.map((g) => {
        const tutor = t.get(g._id)
        return {
          tutorId: g._id,
          nome: tutor?.nome || '—',
          fotoUrl: tutor?.fotoUrl || null,
          liberadoCentavos: g.total,
          saldoDevedorCentavos: tutor?.saldoDevedorCentavos || 0,
          aPagarCentavos: Math.max(0, g.total - (tutor?.saldoDevedorCentavos || 0)),
          qtd: g.qtd,
          pix: tutor?.pix ? { tipo: tutor.pix.tipo, mascarada: tutor.pix.mascarada, titular: 'próprio monitor' } : null,
          trocaDePixPendente: !!tutor?.pixPendente,
          status: tutor?.status || 'ativo',
        }
      }),
      payouts: payouts.map((p) => ({
        id: idDe(p),
        tutorId: p.tutorId,
        nome: t.get(p.tutorId)?.nome || '—',
        totalCentavos: p.totalCentavos,
        abatidoCentavos: p.abatidoCentavos,
        status: p.status,
        pix: p.pix,
        e2eId: p.e2eId || null,
        temComprovante: !!p.comprovantePath,
        criadoPor: p.criadoPor,
        pagoEm: p.pagoEm || null,
        createdAt: p.createdAt,
        qtd: p.repasseIds.length,
      })),
    })
  })
}
