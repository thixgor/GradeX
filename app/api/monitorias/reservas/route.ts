import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { idDe, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { STATUS_ATIVOS } from '@/lib/monitorias/estado'

export const dynamic = 'force-dynamic'

const PAGOS = ['paga', 'concluida', 'reembolso_processando']

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
    let minhas: Array<{ _id?: unknown; reservaId: string; status: string; valorCentavos: number; pagoCentavos?: number; contratoId?: string; paymentOrderId?: string; reembolsos: Array<{ valorCentavos: number; status: string }> }> = []
    if (papel === 'monitor') {
      filtro = { tutorUserId: sessao.userId }
    } else {
      minhas = await c.participacoes
        .find({ alunoId: sessao.userId }, { projection: { reservaId: 1, status: 1, valorCentavos: 1, pagoCentavos: 1, contratoId: 1, paymentOrderId: 1, reembolsos: 1 } })
        .sort({ createdAt: -1 })
        .limit(500)
        .toArray()
      filtro = {
        $or: [{ solicitanteId: sessao.userId }, { _id: { $in: minhas.filter((p) => ObjectId.isValid(p.reservaId)).map((p) => new ObjectId(p.reservaId)) } }],
      }
    }
    if (ativas) filtro.status = { $in: STATUS_ATIVOS }
    const reservas = await c.reservas.find(filtro as any).sort({ updatedAt: -1 }).limit(100).toArray()
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

    // Resumo do topo: o aluno vê o que já investiu e quantas aulas teve; o
    // monitor, quanto vendeu (bruto) e quantos alunos atendeu.
    const resumo =
      papel === 'aluno'
        ? {
            aulas: minhas.filter((p) => ['concluida', 'paga', 'gratis'].includes(p.status)).length,
            investidoCentavos: minhas.filter((p) => PAGOS.includes(p.status)).reduce((t, p) => t + (p.pagoCentavos ?? p.valorCentavos) - reembolsado(p), 0),
            proximas: reservas.filter((r) => r.status === 'confirmada' && r.inicio && r.inicio.getTime() > Date.now()).length,
          }
        : {
            aulas: reservas.filter((r) => ['realizada', 'concluida'].includes(r.status)).length,
            vendidoCentavos: assentosDoMonitor.filter((a) => PAGOS.includes(a.status)).reduce((t, a) => t + a.valorCentavos, 0),
            proximas: reservas.filter((r) => r.status === 'confirmada' && r.inicio && r.inicio.getTime() > Date.now()).length,
          }

    return ok({
      resumo,
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
                temComprovante: !!eu.paymentOrderId && !['aguardando_pagamento', 'aguardando_assinatura'].includes(eu.status),
              }
            : null,
          alunosPagos: papel === 'monitor' ? doMonitor.filter((a) => PAGOS.includes(a.status)).length : undefined,
          temMateriais: !!(r.materiais?.length || r.materiaisExtras?.length),
        }
      }),
    })
  })
}
