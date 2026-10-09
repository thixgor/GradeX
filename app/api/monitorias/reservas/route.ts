import { NextRequest } from 'next/server'
import { idDe, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { STATUS_ATIVOS } from '@/lib/monitorias/estado'

export const dynamic = 'force-dynamic'

/** GET ?papel=aluno|monitor&escopo=ativas|todas — minhas reservas. */
export async function GET(request: NextRequest) {
  return rotaAutenticada(request, {}, async ({ sessao }) => {
    const url = new URL(request.url)
    const papel = url.searchParams.get('papel') === 'monitor' ? 'monitor' : 'aluno'
    const ativas = url.searchParams.get('escopo') !== 'todas'
    const c = await obterColecoes()
    let filtro: Record<string, unknown>
    if (papel === 'monitor') {
      filtro = { tutorUserId: sessao.userId }
    } else {
      const minhas = await c.participacoes.find({ alunoId: sessao.userId }, { projection: { reservaId: 1 } }).limit(500).toArray()
      const { ObjectId } = await import('mongodb')
      filtro = {
        $or: [{ solicitanteId: sessao.userId }, { _id: { $in: minhas.map((p) => new ObjectId(p.reservaId)) } }],
      }
    }
    if (ativas) filtro.status = { $in: STATUS_ATIVOS }
    const reservas = await c.reservas.find(filtro as any).sort({ updatedAt: -1 }).limit(100).toArray()
    return ok({
      reservas: reservas.map((r) => ({
        id: idDe(r),
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
      })),
    })
  })
}
