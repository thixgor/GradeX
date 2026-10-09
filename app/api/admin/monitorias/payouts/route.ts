import { NextRequest } from 'next/server'
import { z } from 'zod'
import { erro, idDe, lerJson } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { criarPayout } from '@/lib/monitorias/payout'

export const dynamic = 'force-dynamic'

/** POST {tutorId} — junta todo o valor liberado do monitor num pagamento em aberto. */
export async function POST(request: NextRequest) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async ({ sessao, ip }) => {
    const corpo = z.object({ tutorId: z.string().length(24) }).strict().safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, 'Monitor inválido.')
    const payout = await criarPayout({ tutorId: corpo.data.tutorId, adminId: sessao.userId, ip })
    return ok({ id: idDe(payout), totalCentavos: payout.totalCentavos }, 201)
  })
}
