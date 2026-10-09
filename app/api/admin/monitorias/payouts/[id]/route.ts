import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { audit } from '@/lib/payments/audit'
import { erro, lerJson, naoEncontrado, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { cancelarPayout, confirmarPayout } from '@/lib/monitorias/payout'
import { decifrar } from '@/lib/monitorias/cripto'
import { formatCpf } from '@/lib/cpf'

export const dynamic = 'force-dynamic'

const Corpo = z.discriminatedUnion('acao', [
  z.object({ acao: z.literal('revelar') }).strict(),
  z.object({ acao: z.literal('confirmar'), e2eId: z.string().max(40) }).strict(),
  z.object({ acao: z.literal('cancelar') }).strict(),
])

/**
 * POST {acao}:
 *  - revelar: mostra a chave PIX completa para o admin copiar no banco (auditado)
 *  - confirmar: E2E + comprovante já anexado → pago
 *  - cancelar: devolve os repasses para "liberado"
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async ({ sessao, ip }) => {
    const corpo = Corpo.safeParse(await lerJson(request))
    if (!corpo.success || !ObjectId.isValid(params.id)) return erro(400, 'Ação inválida.')
    if (corpo.data.acao === 'confirmar') {
      const p = await confirmarPayout({ payoutId: params.id, e2eId: corpo.data.e2eId, adminId: sessao.userId, ip })
      return ok({ status: p.status })
    }
    if (corpo.data.acao === 'cancelar') {
      await cancelarPayout({ payoutId: params.id, adminId: sessao.userId })
      return ok({ status: 'cancelado' })
    }
    const c = await obterColecoes()
    const payout = await c.payouts.findOne({ _id: new ObjectId(params.id) } as any)
    if (!payout || payout.status !== 'aberto') return naoEncontrado()
    const tutor = await c.tutores.findOne({ _id: new ObjectId(payout.tutorId) } as any)
    if (!tutor?.pix) return erro(409, 'Monitor sem chave PIX ativa.')
    // A chave revelada é a ATIVA hoje; se mudou desde a criação do pagamento, o admin precisa saber.
    const mudou = tutor.pix.mascarada !== payout.pix.mascarada
    const chave = decifrar(tutor.pix.cifrada)
    const titular = await c.users.findOne({ _id: new ObjectId(tutor.userId) } as any, { projection: { cpf: 1, fullName: 1 } })
    await audit({ action: 'monitoria_pix_revelado', actorUserId: sessao.userId, targetUserId: tutor.userId, resourceType: 'monitoria_payout', resourceId: params.id, metadata: { mascarada: tutor.pix.mascarada }, ip })
    return ok({ tipo: tutor.pix.tipo, chave, titularCpf: formatCpf(titular?.cpf || ''), titularNome: titular?.fullName || tutor.nome, chaveMudou: mudou })
  })
}
