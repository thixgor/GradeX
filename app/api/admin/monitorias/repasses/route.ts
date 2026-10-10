import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { audit } from '@/lib/payments/audit'
import { erro, idDe, lerJson, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { liberarSePronta } from '@/lib/monitorias/financeiro'
import { limparTexto } from '@/lib/monitorias/validacao'

export const dynamic = 'force-dynamic'

/**
 * GET — fila de repasse: monitores com valor LIBERADO (agrupado), pagamentos
 * em aberto e os últimos pagos. Valor em garantia aparece só como informação.
 */
export async function GET(request: NextRequest) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async () => {
    const c = await obterColecoes()
    const [porTutor, garantia, payouts, retidos] = await Promise.all([
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
      c.repasses.find({ status: 'retido' }).sort({ updatedAt: -1 }).limit(100).toArray(),
    ])
    const tutorIds = Array.from(new Set([...porTutor.map((t) => t._id), ...payouts.map((p) => p.tutorId), ...retidos.map((r) => r.tutorId)])).filter(ObjectId.isValid)
    const tutores = await c.tutores.find({ _id: { $in: tutorIds.map((x) => new ObjectId(x)) } } as any).toArray()
    const t = new Map(tutores.map((x) => [idDe(x), x]))
    return ok({
      emGarantiaCentavos: garantia[0]?.total || 0,
      retidos: retidos.map((r) => ({
        id: idDe(r),
        reservaId: r.reservaId,
        nome: t.get(r.tutorId)?.nome || '—',
        liquidoCentavos: r.liquidoTutorCentavos,
        motivo: r.retencao?.motivo || 'Retido',
        em: r.retencao?.em || r.updatedAt,
      })),
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

const Decisao = z
  .object({
    repasseId: z.string().length(24),
    /** liberar: conferido no painel do MP, segue para o monitor; estornar: a receita não existe. */
    decisao: z.enum(['liberar', 'estornar']),
    nota: z.string().min(5).max(1000),
  })
  .strict()

/**
 * POST — decide um repasse RETIDO (divergência na conferência com o MP).
 * Não move dinheiro do aluno: só diz se o valor segue para o monitor
 * (`liberar`) ou se a receita não existia e o repasse é zerado (`estornar`).
 */
export async function POST(request: NextRequest) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async ({ sessao, ip }) => {
    const corpo = Decisao.safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, corpo.error.issues[0]?.message || 'Dados inválidos.')
    const c = await obterColecoes()
    const nota = limparTexto(corpo.data.nota)
    const agora = new Date()
    const repasse = await c.repasses.findOne({ _id: new ObjectId(corpo.data.repasseId), status: 'retido' } as any)
    if (!repasse) return erro(404, 'Repasse retido não encontrado.')
    const resolucao = { 'retencao.resolvidaPor': sessao.userId, 'retencao.resolvidaEm': agora, 'retencao.nota': nota, updatedAt: agora }
    if (corpo.data.decisao === 'liberar') {
      const res = await c.repasses.updateOne({ _id: repasse._id as any, status: 'retido' }, { $set: { status: 'em_garantia', ...resolucao } as any })
      if (!res.modifiedCount) return erro(409, 'O repasse mudou. Recarregue.')
      await c.participacoes.updateOne({ _id: new ObjectId(repasse.participacaoId) } as any, { $set: { conferidoNoGatewayEm: agora } })
      await liberarSePronta(repasse.reservaId)
    } else {
      const { estornarRepasse } = await import('@/lib/monitorias/financeiro')
      const res = await c.repasses.updateOne({ _id: repasse._id as any, status: 'retido' }, { $set: { status: 'em_garantia', ...resolucao } as any })
      if (!res.modifiedCount) return erro(409, 'O repasse mudou. Recarregue.')
      await estornarRepasse({ participacaoId: repasse.participacaoId, valorBaseCentavos: repasse.brutoCentavos, total: true, motivo: `Receita não confirmada no Mercado Pago: ${nota}`, por: sessao.userId, chave: `retencao:${idDe(repasse)}` })
    }
    await audit({ action: 'monitoria_retencao_decidida', actorUserId: sessao.userId, resourceType: 'monitoria', resourceId: repasse.participacaoId, metadata: { repasse: idDe(repasse), decisao: corpo.data.decisao, nota }, ip })
    return ok({ status: corpo.data.decisao })
  })
}
