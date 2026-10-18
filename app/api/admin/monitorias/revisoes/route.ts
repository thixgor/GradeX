import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { erro, idDe, lerJson, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { decidirRevisaoDoCancelamento } from '@/lib/monitorias/reservas'
import { limparTexto } from '@/lib/monitorias/validacao'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const Corpo = z
  .object({
    participacaoId: z.string().length(24),
    decisao: z.enum(['manter', 'devolver']),
    nota: z.string().min(5, 'Escreva a justificativa (vai para o aluno e o monitor).').max(2000),
  })
  .strict()

/**
 * GET — pedidos de revisão de cancelamento tardio (força maior, contrato 4.6):
 * os pendentes primeiro e os decididos nos últimos 30 dias.
 */
export async function GET(request: NextRequest) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async () => {
    const c = await obterColecoes()
    const desde = new Date(Date.now() - 30 * 24 * 3_600_000)
    const assentos = await c.participacoes
      .find(
        {
          'cancelamentoTardio.revisao.em': { $exists: true },
          $or: [{ 'cancelamentoTardio.revisao.decididaEm': { $exists: false } }, { 'cancelamentoTardio.revisao.decididaEm': { $gte: desde } }],
        } as any,
        { projection: { reservaId: 1, alunoNome: 1, status: 1, valorCentavos: 1, cancelamentoTardio: 1 } },
      )
      .sort({ 'cancelamentoTardio.revisao.em': -1 })
      .limit(100)
      .toArray()
    const ids = Array.from(new Set(assentos.map((a) => a.reservaId))).filter((id) => ObjectId.isValid(id))
    const reservas = ids.length
      ? await c.reservas.find({ _id: { $in: ids.map((id) => new ObjectId(id)) } } as any, { projection: { anuncioTitulo: 1, inicio: 1 } }).toArray()
      : []
    const porId = new Map(reservas.map((r) => [idDe(r), r]))
    const revisoes = assentos.map((a) => {
      const t = a.cancelamentoTardio!
      const r = porId.get(a.reservaId)
      return {
        participacaoId: idDe(a),
        reservaId: a.reservaId,
        anuncioTitulo: r?.anuncioTitulo || '',
        inicio: r?.inicio || null,
        alunoNome: a.alunoNome,
        status: a.status,
        valorCentavos: a.valorCentavos,
        horasAntes: t.horasAntes,
        pctDevolvido: t.pctDevolvido,
        devolvidoCentavos: t.devolvidoCentavos,
        retidoCentavos: t.retidoCentavos,
        liberarApos: t.liberarApos,
        revisao: t.revisao,
      }
    })
    // Pendentes primeiro (a ordem do Mongo já é a do pedido, mais novo antes).
    revisoes.sort((x, y) => Number(!!x.revisao?.decididaEm) - Number(!!y.revisao?.decididaEm))
    return ok({ revisoes })
  })
}

/** POST {participacaoId, decisao: manter|devolver, nota} — o suporte decide o pedido. */
export async function POST(request: NextRequest) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async ({ sessao }) => {
    const corpo = Corpo.safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, corpo.error.issues[0]?.message || 'Dados inválidos.')
    const r = await decidirRevisaoDoCancelamento({ participacaoId: corpo.data.participacaoId, decisao: corpo.data.decisao, nota: limparTexto(corpo.data.nota), adminId: sessao.userId })
    return ok({ ok: r.ok, falha: r.ok ? null : r.erro || 'O Mercado Pago não confirmou agora; o sistema tenta de novo.' })
  })
}
