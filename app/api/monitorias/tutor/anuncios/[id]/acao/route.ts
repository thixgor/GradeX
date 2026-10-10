import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { erro, lerJson, naoEncontrado, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { requisitosDoMonitorDe } from '@/lib/monitorias/servidor'
import { pendentes } from '@/lib/monitorias/requisitos'
import { avisar } from '@/lib/monitorias/avisos'

export const dynamic = 'force-dynamic'

/**
 * POST {acao}:
 *  - enviar: rascunho/rejeitado → em_analise (exige requisitos do monitor 100%)
 *  - pausar: publicado → pausado (sai da vitrine; reservas existentes seguem)
 *  - retomar: pausado → publicado
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { limite: 'WRITE', emailVerificado: true }, async ({ sessao }) => {
    const corpo = z.object({ acao: z.enum(['enviar', 'pausar', 'retomar']) }).strict().safeParse(await lerJson(request))
    if (!corpo.success || !ObjectId.isValid(params.id)) return erro(400, 'Ação inválida.')
    const c = await obterColecoes()
    const a = await c.anuncios.findOne({ _id: new ObjectId(params.id), userId: sessao.userId } as any)
    if (!a) return naoEncontrado()
    const agora = new Date()
    if (corpo.data.acao === 'enviar') {
      const req = await requisitosDoMonitorDe(sessao.userId)
      if (!req.ok) {
        return erro(409, 'Complete os requisitos de monitor antes de enviar.', { pendentes: pendentes(req.itens).map((i) => i.rotulo) })
      }
      const res = await c.anuncios.updateOne(
        { _id: a._id as any, status: { $in: ['rascunho', 'rejeitado'] } },
        { $set: { status: 'em_analise', updatedAt: agora }, $unset: { moderacao: '' } },
      )
      if (!res.modifiedCount) return erro(409, 'Este anúncio não pode ser enviado agora.')
      const admins = await c.users.find({ role: 'admin' } as any, { projection: { _id: 1 } }).limit(10).toArray()
      await avisar(
        admins.map((adm) => ({
          userId: String(adm._id),
          titulo: 'Anúncio de monitoria para análise',
          mensagem: `"${a.titulo}" aguarda moderação.`,
          url: '/admin/monitorias',
        })),
      )
      return ok({ status: 'em_analise' })
    }
    if (corpo.data.acao === 'retomar') {
      const tutor = await c.tutores.findOne({ userId: sessao.userId }, { projection: { status: 1 } })
      if (tutor?.status !== 'ativo') return erro(403, 'Seu perfil de monitor está suspenso. Fale com o suporte.')
    }
    const de = corpo.data.acao === 'pausar' ? 'publicado' : 'pausado'
    const para = corpo.data.acao === 'pausar' ? 'pausado' : 'publicado'
    const res = await c.anuncios.updateOne({ _id: a._id as any, status: de }, { $set: { status: para, updatedAt: agora } })
    if (!res.modifiedCount) return erro(409, 'Ação indisponível no estado atual.')
    return ok({ status: para })
  })
}
