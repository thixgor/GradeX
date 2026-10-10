import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { idDe, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { STATUS_ATIVOS } from '@/lib/monitorias/estado'

export const dynamic = 'force-dynamic'

const PAGOS = ['paga', 'concluida', 'reembolso_processando']
const POR_PAGINA = 50

/**
 * GET ?papel=aluno|monitor&escopo=ativas|todas — minhas reservas, já com o que
 * a lista precisa para levar direto a cada documento (contrato, comprovante,
 * histórico) e um resumo no topo. Tudo em 3 consultas, em paralelo quando dá.
 */
export async function GET(request: NextRequest) {
  return rotaAutenticada(request, {}, async ({ sessao }) => {
    const url = new URL(request.url)
    const papel = url.searchParams.get('papel') === 'monitor' ? 'monitor' : 'aluno'
    const ativas = url.searchParams.get('escopo') !== 'todas'
    const c = await obterColecoes()
    let filtro: Record<string, unknown>
    let minhas: Array<{ _id?: unknown; reservaId: string; status: string; valorCentavos: number; pagoCentavos?: number; pagoEm?: Date; contratoId?: string; paymentOrderId?: string; reembolsos: Array<{ valorCentavos: number; status: string }> }> = []
    if (papel === 'monitor') {
      filtro = { tutorUserId: sessao.userId }
    } else {
      minhas = await c.participacoes
        .find({ alunoId: sessao.userId }, { projection: { reservaId: 1, status: 1, valorCentavos: 1, pagoCentavos: 1, pagoEm: 1, contratoId: 1, paymentOrderId: 1, reembolsos: 1 } })
        .sort({ createdAt: -1 })
        .limit(500)
        .toArray()
      filtro = {
        $or: [{ solicitanteId: sessao.userId }, { _id: { $in: minhas.filter((p) => ObjectId.isValid(p.reservaId)).map((p) => new ObjectId(p.reservaId)) } }],
      }
    }
    const filtroBase = { ...filtro }
    if (ativas) filtro.status = { $in: STATUS_ATIVOS }
    // Paginação por cursor (updatedAt + _id): o histórico inteiro é alcançável
    // com "Carregar mais", sem limite fixo de 100.
    const cursor = url.searchParams.get('cursor')
    const consulta: Record<string, unknown> = { ...filtro }
    if (cursor) {
      const [quando, ultimoId] = cursor.split('_')
      const t = new Date(quando)
      if (!Number.isNaN(t.getTime()) && ObjectId.isValid(ultimoId)) {
        consulta.$and = [{ $or: [{ updatedAt: { $lt: t } }, { updatedAt: t, _id: { $lt: new ObjectId(ultimoId) } }] }]
      }
    }
    const pagina = await c.reservas.find(consulta as any).sort({ updatedAt: -1, _id: -1 }).limit(POR_PAGINA + 1).toArray()
    const temMais = pagina.length > POR_PAGINA
    const reservas = pagina.slice(0, POR_PAGINA)
    const ultima = reservas.at(-1)
    const proximoCursor = temMais && ultima ? `${ultima.updatedAt.toISOString()}_${idDe(ultima)}` : null
    const ids = reservas.map(idDe)
    const tutorIds = Array.from(new Set(reservas.map((r) => r.tutorId))).filter(ObjectId.isValid)
    const [assentosDoMonitor, tutores] = await Promise.all([
      papel === 'monitor'
        ? c.participacoes.find({ reservaId: { $in: ids } }, { projection: { reservaId: 1, status: 1, valorCentavos: 1 } }).toArray()
        : Promise.resolve([]),
      papel === 'aluno'
        ? c.tutores.find({ _id: { $in: tutorIds.map((t) => new ObjectId(t)) } } as any, { projection: { nome: 1, fotoUrl: 1 } }).toArray()
        : Promise.resolve([]),
    ])
    const meuAssento = new Map(minhas.map((p) => [p.reservaId, p]))
    const tutorPorId = new Map(tutores.map((t) => [idDe(t), t]))
    const reembolsado = (p: (typeof minhas)[number]) => p.reembolsos.filter((r) => r.status === 'concluido').reduce((t, r) => t + r.valorCentavos, 0)

    // Resumo do topo, sobre TUDO (não só a aba ou a página): o aluno vê o que
    // já investiu e quantas aulas teve; o monitor, quanto vendeu e quantas deu.
    // Só na primeira página — "Carregar mais" não recalcula.
    const agora = new Date()
    const resumo = cursor
      ? null
      : papel === 'aluno'
        ? {
            aulas: minhas.filter((p) => ['concluida', 'paga', 'gratis'].includes(p.status)).length,
            investidoCentavos: minhas.filter((p) => PAGOS.includes(p.status)).reduce((t, p) => t + (p.pagoCentavos ?? p.valorCentavos) - reembolsado(p), 0),
            proximas: await c.reservas.countDocuments({ ...filtroBase, status: 'confirmada', inicio: { $gt: agora } } as any),
          }
        : await (async () => {
            const [aulas, proximas, vendido] = await Promise.all([
              c.reservas.countDocuments({ tutorUserId: sessao.userId, status: { $in: ['realizada', 'concluida'] } }),
              c.reservas.countDocuments({ tutorUserId: sessao.userId, status: 'confirmada', inicio: { $gt: agora } }),
              c.repasses
                .aggregate<{ total: number }>([{ $match: { tutorUserId: sessao.userId, status: { $ne: 'estornado' } } }, { $group: { _id: null, total: { $sum: '$brutoCentavos' } } }])
                .toArray(),
            ])
            return { aulas, proximas, vendidoCentavos: vendido[0]?.total || 0 }
          })()

    return ok({
      resumo,
      proximoCursor,
      reservas: reservas.map((r) => {
        const id = idDe(r)
        const eu = meuAssento.get(id)
        const tutor = tutorPorId.get(r.tutorId)
        const doMonitor = assentosDoMonitor.filter((a) => a.reservaId === id)
        return {
          id,
          anuncioTitulo: r.anuncioTitulo,
          status: r.status,
          origem: r.origem,
          inicio: r.inicio || r.proposta?.inicio || null,
          duracaoMin: r.proposta?.duracaoMin || null,
          vagas: r.proposta?.vagas || 1,
          valorPorPessoaCentavos: r.proposta?.valorPorPessoaCentavos ?? null,
          gratis: !!r.proposta?.gratis,
          prazoPagamento: r.prazoPagamento || null,
          souOrganizador: r.solicitanteId === sessao.userId,
          updatedAt: r.updatedAt,
          monitor: tutor ? { nome: tutor.nome, fotoUrl: tutor.fotoUrl || null } : null,
          meuAssento: eu
            ? {
                id: idDe(eu as any),
                status: eu.status,
                pagoCentavos: PAGOS.includes(eu.status) || eu.status === 'reembolsada' ? eu.pagoCentavos ?? eu.valorCentavos : null,
                reembolsadoCentavos: reembolsado(eu),
                contratoId: eu.contratoId || null,
                // Comprovante só de pagamento que de fato entrou (PIX gerado e não pago não conta).
                temComprovante: !!eu.paymentOrderId && !!eu.pagoEm,
              }
            : null,
          alunosPagos: papel === 'monitor' ? doMonitor.filter((a) => PAGOS.includes(a.status)).length : undefined,
          temMateriais: !!(r.materiais?.length || r.materiaisExtras?.length),
        }
      }),
    })
  })
}
