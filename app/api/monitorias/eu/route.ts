import { NextRequest } from 'next/server'
import { idDe, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { requisitosDoAlunoDe, requisitosDoMonitorDe } from '@/lib/monitorias/servidor'
import { resumir } from '@/lib/monitorias/financeiro'

export const dynamic = 'force-dynamic'

/**
 * Painel do usuário nas monitorias: requisitos (monitor e aluno), o perfil de
 * monitor dele (com a chave PIX só mascarada) e os anúncios dele.
 */
export async function GET(request: NextRequest) {
  return rotaAutenticada(request, {}, async ({ sessao }) => {
    const c = await obterColecoes()
    const [monitor, aluno, anuncios, pendentes] = await Promise.all([
      requisitosDoMonitorDe(sessao.userId),
      requisitosDoAlunoDe(sessao.userId),
      c.anuncios
        .find({ userId: sessao.userId }, { projection: { titulo: 1, slug: 1, status: 1, materia: 1, preco: 1, stats: 1, updatedAt: 1, revisaoPendente: 1, moderacao: 1, modos: 1, ofertaAssinada: 1 } })
        .sort({ updatedAt: -1 })
        .toArray(),
      c.reservas.countDocuments({ tutorUserId: sessao.userId, status: { $in: ['solicitada', 'em_negociacao', 'aguardando_assinaturas'] } }),
    ])
    const tutor = monitor.tutor
    const repasses = tutor ? await c.repasses.find({ tutorId: idDe(tutor) }, { projection: { status: 1, liquidoTutorCentavos: 1 } }).toArray() : []
    return ok({
      requisitosMonitor: { itens: monitor.itens, ok: monitor.ok },
      requisitosAluno: { itens: aluno.itens, ok: aluno.ok, termosAceitos: aluno.termosAceitos },
      tutor: tutor
        ? {
            id: idDe(tutor),
            nome: tutor.nome,
            titulo: tutor.titulo,
            bio: tutor.bio,
            historia: tutor.historia,
            fotoUrl: tutor.fotoUrl || null,
            status: tutor.status,
            disponibilidade: tutor.disponibilidade,
            pix: tutor.pix ? { tipo: tutor.pix.tipo, mascarada: tutor.pix.mascarada } : null,
            pixPendente: tutor.pixPendente ? { tipo: tutor.pixPendente.tipo, mascarada: tutor.pixPendente.mascarada, liberaEm: tutor.pixPendente.liberaEm } : null,
            strikes: tutor.strikes.length,
            stats: tutor.stats,
            financeiro: resumir(repasses as any, tutor.saldoDevedorCentavos || 0),
          }
        : null,
      anuncios: anuncios.map((a) => ({
        id: idDe(a),
        titulo: a.titulo,
        slug: a.slug,
        status: a.status,
        materia: a.materia,
        preco: a.preco,
        stats: a.stats,
        updatedAt: a.updatedAt,
        temRevisaoPendente: !!a.revisaoPendente,
        moderacao: a.moderacao ? { acao: a.moderacao.acao, motivo: a.moderacao.motivo, em: a.moderacao.em } : null,
        direto: !!a.modos?.direto,
        ofertaAssinada: !!a.ofertaAssinada,
      })),
      pedidosPendentes: pendentes,
    })
  })
}
