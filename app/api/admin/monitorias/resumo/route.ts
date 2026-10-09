import { NextRequest } from 'next/server'
import { obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'

export const dynamic = 'force-dynamic'

/** GET — contadores do painel admin de monitorias (badges das abas). */
export async function GET(request: NextRequest) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async () => {
    const c = await obterColecoes()
    const [emAnalise, revisoes, disputas, liberados, payoutsAbertos, denunciadas, reembolsosFalhos] = await Promise.all([
      c.anuncios.countDocuments({ status: 'em_analise' }),
      c.anuncios.countDocuments({ revisaoPendente: { $exists: true } }),
      c.reservas.countDocuments({ status: 'em_disputa' }),
      c.repasses.countDocuments({ status: 'liberado' }),
      c.payouts.countDocuments({ status: 'aberto' }),
      c.perguntas.countDocuments({ 'denuncias.0': { $exists: true }, status: 'visivel' }),
      c.participacoes.countDocuments({ 'reembolsos.status': 'falhou' }),
    ])
    return ok({ emAnalise, revisoes, disputas, liberados, payoutsAbertos, denunciadas, reembolsosFalhos })
  })
}
