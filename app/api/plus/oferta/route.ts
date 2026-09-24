import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { normalizeAccountType, PLUS_TIER, QUEST_TIER } from '@/lib/account-tier'
import { contaEhPaga } from '@/lib/cargos-server'
import { getManualClinicoConfig } from '@/lib/manual-clinico-product'
import {
  cargoDoPlano,
  escolherPlanoDaOferta,
  itensInclusos,
  type PerfilDoComprador,
  type PlanoParaOferta,
} from '@/lib/plus-oferta'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/plus/oferta?plano=<tipo do plano sendo comprado, opcional>
 *
 * Tudo o que a chamada do Plus+ nos checkouts precisa, numa ida só: quem está
 * comprando, o Plus+ Semestral e o que ele libera de verdade. A decisão de
 * mostrar ou não fica em `decidirModo()` (lib/plus-oferta), no cliente, porque
 * depende do contexto da tela.
 *
 * Falha devolvendo `oferta: null` — a chamada é enfeite de conversão, e o
 * checkout tem que seguir exatamente igual se ela cair.
 */
export async function GET(request: NextRequest) {
  try {
    const [session, db] = await Promise.all([getSession(), getDb()])

    const settings = await db.collection('admin_settings').findOne({}, { projection: { planos: 1 } })
    const planos = (settings?.planos || []) as PlanoParaOferta[]
    const plano = escolherPlanoDaOferta(planos)

    const tipoDoPlanoAtual = request.nextUrl.searchParams.get('plano')
    const planoAtual = tipoDoPlanoAtual ? planos.find((p) => p.tipo === tipoDoPlanoAtual) : null

    let perfil: PerfilDoComprador = 'visitante'
    let renovacaoAutomatica = false

    if (session?.role === 'admin') {
      perfil = 'plus'
    } else if (session?.userId && ObjectId.isValid(session.userId)) {
      const user = await db.collection('users').findOne(
        { _id: new ObjectId(session.userId) },
        { projection: { accountType: 1, premiumExpiresAt: 1 } },
      )
      const cargo = normalizeAccountType(user?.accountType)
      // `premiumExpiresAt` ausente = vitalício. Vencido e ainda não rebaixado
      // pelo cron conta como sem plano: é exatamente quem precisa da oferta.
      const vigente = !user?.premiumExpiresAt || new Date(user.premiumExpiresAt) > new Date()

      if (cargo === PLUS_TIER) perfil = vigente ? 'plus' : 'gratuito'
      else if (cargo === QUEST_TIER) perfil = vigente ? 'quest' : 'gratuito'
      else if (cargo === 'gratuito' || cargo === 'trial') perfil = 'gratuito'
      else perfil = (await contaEhPaga(cargo, db)) ? 'outro' : 'gratuito'

      // O upgrade é um pagamento novo, e ele não encerra a recorrência do
      // Quest+: sem avisar, a pessoa pagaria os dois.
      if (perfil === 'quest') {
        renovacaoAutomatica = !!(await db.collection('subscriptions').findOne(
          { userId: session.userId, status: { $in: ['authorized', 'pending', 'paused'] } },
          { projection: { _id: 1 } },
        ))
      }
    }

    // Quem não vai ver a oferta não precisa do resto.
    if (!plano || perfil === 'plus' || perfil === 'outro') {
      return NextResponse.json({ perfil, logado: !!session, oferta: null })
    }

    const manual = await getManualClinicoConfig(db).catch(() => null)
    const inclusos = itensInclusos(plano, { manualIncluidoNoPlus: manual?.includedInPlus !== false })

    return NextResponse.json({
      perfil,
      logado: !!session,
      renovacaoAutomatica,
      cargoDoPlanoAtual: planoAtual ? cargoDoPlano(planoAtual) : null,
      oferta: {
        tipo: String(plano.tipo),
        nome: plano.nome || 'DomineAqui Plus+',
        periodo: plano.periodo || '',
        preco: Number(plano.preco),
        precoOriginal: Number(plano.precoOriginal) > Number(plano.preco) ? Number(plano.precoOriginal) : null,
        durationMonths: Number(plano.durationMonths) > 0 ? Number(plano.durationMonths) : null,
        inclusos,
      },
    })
  } catch (error) {
    console.error('[plus/oferta] GET:', error)
    return NextResponse.json({ perfil: 'visitante', logado: false, oferta: null })
  }
}
