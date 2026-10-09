import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { audit } from '@/lib/payments/audit'
import { erro, lerJson, naoEncontrado, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { avisar } from '@/lib/monitorias/avisos'

export const dynamic = 'force-dynamic'

/** POST {acao: suspender|reativar|cancelar_troca_pix, motivo} — perfil de monitor. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async ({ sessao, ip }) => {
    const corpo = z
      .object({ acao: z.enum(['suspender', 'reativar', 'cancelar_troca_pix']), motivo: z.string().min(5).max(1000) })
      .strict()
      .safeParse(await lerJson(request))
    if (!corpo.success || !ObjectId.isValid(params.id)) return erro(400, 'Informe a ação e o motivo.')
    const c = await obterColecoes()
    const tutor = await c.tutores.findOne({ _id: new ObjectId(params.id) } as any)
    if (!tutor) return naoEncontrado()
    const agora = new Date()
    if (corpo.data.acao === 'cancelar_troca_pix') {
      await c.tutores.updateOne({ _id: tutor._id as any }, { $unset: { pixPendente: '' }, $set: { updatedAt: agora } })
    } else {
      const status = corpo.data.acao === 'suspender' ? 'suspenso' : 'ativo'
      await c.tutores.updateOne({ _id: tutor._id as any }, { $set: { status, updatedAt: agora, ...(status === 'ativo' ? { strikes: [] } : {}) } })
      if (status === 'suspenso') {
        await c.anuncios.updateMany({ tutorId: params.id, status: { $in: ['publicado', 'pausado', 'em_analise'] } }, { $set: { status: 'suspenso', updatedAt: agora } })
      }
    }
    await audit({ action: corpo.data.acao === 'cancelar_troca_pix' ? 'monitoria_pix_alterado' : 'monitoria_tutor_status', actorUserId: sessao.userId, targetUserId: tutor.userId, resourceType: 'monitoria_tutor', resourceId: params.id, metadata: corpo.data, ip })
    await avisar([
      {
        userId: tutor.userId,
        titulo: corpo.data.acao === 'suspender' ? 'Perfil de monitor suspenso' : corpo.data.acao === 'reativar' ? 'Perfil de monitor reativado' : 'Troca de chave PIX cancelada',
        mensagem: corpo.data.motivo,
        url: '/monitorias/painel',
        email: { assunto: 'Atualização no seu perfil de monitor', paragrafos: [corpo.data.motivo] },
      },
    ])
    return ok({ feito: true })
  })
}
