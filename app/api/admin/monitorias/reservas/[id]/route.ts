import { NextRequest } from 'next/server'
import { z } from 'zod'
import { audit } from '@/lib/payments/audit'
import { ObjectId } from 'mongodb'
import { colecoes, erro, idDe, lerJson } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { carregarReserva, ErroMonitoria, firmarBlocos, liberarBlocos, registrarStrike } from '@/lib/monitorias/reservas'
import { reembolsarParticipacao } from '@/lib/monitorias/reembolso'
import { concluirReserva } from '@/lib/monitorias/varredura'
import { liberarSePronta } from '@/lib/monitorias/financeiro'
import { limparTexto } from '@/lib/monitorias/validacao'
import { avisar } from '@/lib/monitorias/avisos'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const Corpo = z
  .object({
    decisao: z.enum(['liberar', 'reembolsar']),
    /** valorCentavos null = reembolso total daquele assento. */
    reembolsos: z.array(z.object({ participacaoId: z.string().length(24), valorCentavos: z.number().int().min(1).nullable() }).strict()).max(30),
    culpaDoMonitor: z.boolean(),
    nota: z.string().min(5).max(2000),
  })
  .strict()

/**
 * POST — o admin decide uma disputa (ou um pedido de cancelamento com <24h).
 *  - liberar: a aula vale; reserva concluída e valor do monitor liberado.
 *  - reembolsar: devolve total/parcial por assento; o resto segue para o monitor.
 * Também serve para reembolsar um assento avulso fora de disputa.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async ({ sessao, ip }) => {
    const corpo = Corpo.safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, corpo.error.issues[0]?.message || 'Dados inválidos.')
    const reserva = await carregarReserva(params.id)
    const c = colecoes(await getDb())
    const nota = limparTexto(corpo.data.nota)
    const id = idDe(reserva)

    const falhas: string[] = []
    if (corpo.data.decisao === 'reembolsar') {
      if (!corpo.data.reembolsos.length) throw new ErroMonitoria(400, 'Escolha os assentos a reembolsar.')
      for (const r of corpo.data.reembolsos) {
        const assento = await c.participacoes.findOne({ _id: new ObjectId(r.participacaoId), reservaId: id } as any)
        if (!assento) throw new ErroMonitoria(404, 'Assento não pertence a esta reserva.')
        const out = await reembolsarParticipacao({ participacaoId: r.participacaoId, valorBaseCentavos: r.valorCentavos, motivo: `Decisão do suporte: ${nota}`, por: sessao.userId })
        if (!out.ok) falhas.push(`${assento.alunoNome}: ${out.erro}`)
      }
    }

    const agora = new Date()
    const restantes = await c.participacoes.countDocuments({ reservaId: id, status: { $in: ['paga', 'gratis', 'concluida'] } })
    const futura = reserva.inicio && reserva.inicio > agora
    let novoStatus = reserva.status
    if (reserva.status === 'em_disputa') {
      if (corpo.data.decisao === 'reembolsar' && restantes === 0) novoStatus = 'reembolsada'
      else if (futura) novoStatus = 'confirmada'
      else novoStatus = 'concluida'
      const res = await c.reservas.updateOne(
        { _id: reserva._id as any, status: 'em_disputa', versao: reserva.versao },
        {
          $set: {
            status: novoStatus,
            'disputa.decisao': `${corpo.data.decisao === 'liberar' ? 'Aula mantida/valor liberado' : 'Reembolso'}: ${nota}`,
            'disputa.decididaPor': sessao.userId,
            'disputa.decididaEm': agora,
            updatedAt: agora,
          },
          $inc: { versao: 1 },
        },
      )
      if (!res.matchedCount) throw new ErroMonitoria(409, 'A reserva mudou. Recarregue.')
      if (novoStatus === 'concluida') await concluirReserva({ ...reserva, status: 'concluida' }, agora)
      if (novoStatus === 'reembolsada') await liberarBlocos(id)
      if (novoStatus === 'confirmada') await firmarBlocos(id)
    }
    // Pedidos de cancelamento de assento decididos: o repasse deles deixa de ficar retido.
    await c.participacoes.updateMany(
      { reservaId: id, cancelamentoPedidoEm: { $exists: true } } as any,
      { $unset: { cancelamentoPedidoEm: '' }, $set: { updatedAt: agora } } as any,
    )
    if (novoStatus === 'concluida' || reserva.status === 'concluida') await liberarSePronta(id)
    if (corpo.data.culpaDoMonitor) await registrarStrike(c, reserva, `Decisão do suporte: ${nota}`)
    await audit({
      action: 'monitoria_disputa_resolvida',
      actorUserId: sessao.userId,
      resourceType: 'monitoria_reserva',
      resourceId: id,
      metadata: { decisao: corpo.data.decisao, reembolsos: corpo.data.reembolsos, culpaDoMonitor: corpo.data.culpaDoMonitor, nota, falhas, novoStatus },
      ip,
    })
    const pessoas = await c.participacoes.find({ reservaId: id }, { projection: { alunoId: 1 } }).toArray()
    await avisar(
      Array.from(new Set([reserva.tutorUserId, ...pessoas.map((p) => p.alunoId)])).map((userId) => ({
        userId,
        titulo: 'Suporte decidiu sobre a monitoria',
        mensagem: `"${reserva.anuncioTitulo}": ${corpo.data.decisao === 'liberar' ? 'aula mantida' : 'reembolso concedido'}.`,
        url: `/monitorias/reservas/${id}`,
        email: { assunto: `Decisão do suporte: ${reserva.anuncioTitulo}`, paragrafos: [nota], botao: 'Ver reserva' },
      })),
    )
    return ok({ status: novoStatus, falhas })
  })
}
