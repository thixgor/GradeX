import { NextRequest } from 'next/server'
import { z } from 'zod'
import { audit } from '@/lib/payments/audit'
import { getDb } from '@/lib/mongodb'
import { colecoes, erro, lerJson } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { mesDoUso } from '@/lib/monitorias/sala/config'
import { configDoResumo } from '@/lib/monitorias/resumo/config'
import { reembolsarAdicionaisDaAula } from '@/lib/monitorias/resumo/adicional'
import { dispararProcessador } from '@/lib/monitorias/resumo/disparo'
import { limparTexto } from '@/lib/monitorias/validacao'
import { jsonComprimido } from '@/lib/resposta-comprimida'

export const dynamic = 'force-dynamic'

const STATUS = ['aguardando', 'transcrevendo', 'resumindo', 'pronto', 'falhou', 'cancelado'] as const

/**
 * GET ?status= — painel do Resumo por IA: gasto do mês × orçamento, receita
 * separada (vendas e reembolsos do adicional), tarefas por estado e a lista
 * (com custo estimado × real e os adicionais de cada aula). Nunca a transcrição.
 */
export async function GET(request: NextRequest) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async () => {
    const filtro = new URL(request.url).searchParams.get('status')
    const c = colecoes(await getDb())
    const agora = new Date()
    const [config, uso, porStatus, tarefas, receita] = await Promise.all([
      configDoResumo(),
      c.resumosUso.findOne({ _id: mesDoUso(agora) }),
      c.resumos.aggregate<{ _id: string; n: number }>([{ $group: { _id: '$status', n: { $sum: 1 } } }]).toArray(),
      c.resumos
        .find(STATUS.includes(filtro as any) ? { status: filtro as any } : {}, { projection: { resultado: 0, parciais: 0, 'custo.chamadas': 0 } })
        .sort({ fim: -1 })
        .limit(60)
        .toArray(),
      c.resumosAdicionais.aggregate<{ _id: string; n: number; centavos: number }>([{ $match: { teste: { $ne: true } } }, { $group: { _id: '$status', n: { $sum: 1 }, centavos: { $sum: '$precoCentavos' } } }]).toArray(),
    ])
    const adicionais = tarefas.length
      ? await c.resumosAdicionais.find({ reservaId: { $in: tarefas.map((t) => t._id) } }, { projection: { reservaId: 1, status: 1, precoCentavos: 1, alunoId: 1, reembolso: 1, teste: 1 } }).toArray()
      : []
    return jsonComprimido(request, {
      orcamento: { mensalUsd: config.limites.orcamentoMensalUsd, gastoUsd: uso?.realUsd || 0, chamadas: uso?.chamadas || 0, aulas: uso?.aulas || 0 },
      receitaDoMes: { vendasCentavos: uso?.vendasCentavos || 0, reembolsosCentavos: uso?.reembolsosCentavos || 0 },
      receitaTotal: Object.fromEntries(receita.map((r) => [r._id, { n: r.n, centavos: r.centavos }])),
      porStatus: Object.fromEntries(porStatus.map((s) => [s._id, s.n])),
      tarefas: tarefas.map((t) => ({
        reservaId: t._id,
        titulo: t.anuncioTitulo,
        inicio: t.inicio,
        fim: t.fim,
        status: t.status,
        individual: t.individual,
        cobertura: t.cobertura?.pct ?? null,
        custo: { estimadoUsd: t.custo?.estimadoUsd || 0, realUsd: t.custo?.realUsd || 0 },
        tentativas: t.tentativas || 0,
        erro: t.erro || null,
        falhouEm: t.falhouEm || null,
        prontoEm: t.prontoEm || null,
        teste: !!t.teste,
        monitorAutorizou: t.vozes?.[t.tutorUserId]?.consentimento ? !!t.vozes[t.tutorUserId].consentimento!.aceito : null,
        adicionais: adicionais
          .filter((a) => a.reservaId === t._id)
          .map((a) => ({ status: a.status, precoCentavos: a.precoCentavos, teste: !!a.teste, reembolso: a.reembolso ? { motivo: a.reembolso.motivo, status: a.reembolso.status } : null })),
      })),
    }, { headers: { 'Cache-Control': 'private, no-store' } })
  })
}

const Corpo = z.object({ acao: z.enum(['tentar_de_novo', 'reembolsar']), reservaId: z.string().length(24), motivo: z.string().max(500).optional() }).strict()

/**
 * POST — suporte numa tarefa:
 *  - tentar_de_novo: zera as tentativas (resumo e trechos que ainda têm o
 *    áudio) e dispara o processador;
 *  - reembolsar: devolve os adicionais AINDA NÃO ENTREGUES da aula.
 */
export async function POST(request: NextRequest) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async ({ sessao, ip }) => {
    const corpo = Corpo.safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, 'Pedido inválido.')
    const { acao, reservaId } = corpo.data
    const c = colecoes(await getDb())
    const t = await c.resumos.findOne({ _id: reservaId }, { projection: { status: 1 } })
    if (!t) return erro(404, 'Tarefa não encontrada.')
    const agora = new Date()
    let detalhe: Record<string, unknown> = {}
    if (acao === 'tentar_de_novo') {
      if (!['falhou', 'resumindo', 'transcrevendo', 'aguardando'].includes(t.status)) return erro(409, 'Esta tarefa não está para tentar de novo.')
      const pagos = await c.resumosAdicionais.countDocuments({ reservaId, status: 'pago' })
      if (!pagos) return erro(409, 'Nenhum comprador esperando este resumo (já reembolsados ou entregues).')
      const [segs] = await Promise.all([
        c.resumosSegmentos.updateMany(
          { reservaId, status: 'falhou', $or: [{ arquivo: { $exists: true } }, { blobUrl: { $exists: true } }] } as any,
          { $set: { status: 'enviado', tentativas: 0, updatedAt: agora }, $unset: { proximaTentativaEm: '', lease: '', erro: '' } },
        ),
        c.resumos.updateOne(
          { _id: reservaId },
          { $set: { status: t.status === 'falhou' ? 'resumindo' : t.status, tentativas: 0, updatedAt: agora }, $unset: { falhouEm: '', erro: '', proximaTentativaEm: '', lease: '' } },
        ),
      ])
      detalhe = { trechosReabertos: segs.modifiedCount }
      dispararProcessador(new URL(request.url).origin)
    } else {
      const motivo = limparTexto(corpo.data.motivo || '') || 'Decisão do suporte'
      detalhe = await reembolsarAdicionaisDaAula(reservaId, motivo, sessao.userId)
    }
    await audit({ action: 'monitoria_resumo_suporte', actorUserId: sessao.userId, resourceType: 'monitoria_resumo', resourceId: reservaId, metadata: { acao, ...detalhe }, ip })
    return ok({ feito: true, ...detalhe })
  })
}
