import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { jsonComprimido } from '@/lib/resposta-comprimida'
import { COLECAO_EMBAIXADORES, lerConfigDoPrograma, montarPainel, type Embaixador } from '@/lib/embaixadores/servidor'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * O painel de quem é embaixador — ou, para quem não é, só as regras públicas
 * do programa (a tela vira o convite para se inscrever).
 *
 * Embaixador encerrado continua vendo o histórico e o saldo a receber: a
 * comissão devida não some porque a participação acabou.
 */
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return jsonComprimido(request, { error: 'Não autenticado' }, { status: 401 })

  try {
    const db = await getDb()
    const [config, embaixador] = await Promise.all([
      lerConfigDoPrograma(db),
      db.collection<Embaixador>(COLECAO_EMBAIXADORES).findOne({ userId: session.userId }),
    ])
    const programa = { linkInscricao: config.linkInscricao, descontoCupom: config.descontoCupomPadrao }
    if (!embaixador) return jsonComprimido(request, { painel: null, programa }, { headers: { 'Cache-Control': 'private, no-store' } })

    const painel = await montarPainel(db, embaixador, 'embaixador')
    return jsonComprimido(request, { painel, programa }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (erro) {
    console.error('[embaixadores/me]', erro)
    return jsonComprimido(request, { error: 'Erro ao carregar o painel' }, { status: 500 })
  }
}
