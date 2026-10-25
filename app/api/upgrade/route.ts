import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { normalizeAccountType, PLUS_TIER, QUEST_TIER } from '@/lib/account-tier'
import { contaEhPaga } from '@/lib/cargos-server'
import { getManualClinicoConfig } from '@/lib/manual-clinico-product'
import { itensInclusos, type PerfilDoComprador } from '@/lib/plus-oferta'
import { planoPadraoDoUpgrade, planosDoUpgrade, prazoDaOferta, precoDeUpgrade } from '@/lib/upgrade-quest'
import { buscarRecorrenciaDoQuest, lerCatalogoDoUpgrade } from '@/lib/upgrade-quest-server'
import type { User } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/upgrade — a oferta de upgrade Quest+ → Plus+ desta conta.
 *
 * Tudo o que a página de upgrade, o perfil, /buy e o checkout precisam numa
 * ida só. Quem não é Quest+ vigente recebe só `elegivel: false` (e o perfil,
 * para a tela saber o que dizer). `?previa=1` deixa o admin ver a página como
 * um Quest+ veria — só a vitrine: o desconto, quem decide é a cobrança, que
 * confere a conta de verdade.
 *
 * Os preços aqui são para MOSTRAR. Quem cobra é `/api/payments/orders`, com a
 * mesma função (`precoDeUpgrade`) sobre o documento fresco.
 */
export async function GET(request: NextRequest) {
  try {
    const [session, db] = await Promise.all([getSession(), getDb()])
    const previa = request.nextUrl.searchParams.get('previa') === '1' && session?.role === 'admin'

    let perfil: PerfilDoComprador = 'visitante'
    let user: Pick<User, '_id' | 'name' | 'accountType' | 'premiumExpiresAt'> | null = null

    if (session?.role === 'admin') {
      perfil = 'plus'
    } else if (session?.userId && ObjectId.isValid(session.userId)) {
      user = await db
        .collection<User>('users')
        .findOne(
          { _id: new ObjectId(session.userId) as any },
          { projection: { name: 1, accountType: 1, premiumExpiresAt: 1 } },
        )
      const cargo = normalizeAccountType(user?.accountType)
      const vigente = !user?.premiumExpiresAt || new Date(user.premiumExpiresAt) > new Date()
      if (cargo === PLUS_TIER) perfil = vigente ? 'plus' : 'gratuito'
      else if (cargo === QUEST_TIER) perfil = vigente ? 'quest' : 'gratuito'
      else if (cargo === 'gratuito' || cargo === 'trial') perfil = 'gratuito'
      else perfil = (await contaEhPaga(cargo, db)) ? 'outro' : 'gratuito'
    }

    const { planos, config } = await lerCatalogoDoUpgrade(db)
    const daOferta = planosDoUpgrade(planos, config)
    const padrao = planoPadraoDoUpgrade(daOferta, config)
    const elegivel = config.ativo && !!padrao && (perfil === 'quest' || previa)

    if (!elegivel || !padrao) {
      return NextResponse.json(
        { perfil, logado: !!session, ativo: config.ativo, elegivel: false },
        { headers: { 'Cache-Control': 'private, no-store' } },
      )
    }

    const [recorrencia, manual] = await Promise.all([
      perfil === 'quest' && session?.userId ? buscarRecorrenciaDoQuest(db, session.userId) : Promise.resolve(null),
      getManualClinicoConfig(db).catch(() => null),
    ])
    const manualIncluidoNoPlus = manual?.includedInPlus !== false
    const agora = Date.now()
    const expira = user?.premiumExpiresAt ? new Date(user.premiumExpiresAt) : null

    return NextResponse.json(
      {
        perfil,
        logado: true,
        ativo: true,
        elegivel: true,
        previa,
        primeiroNome: String(user?.name || session?.name || '').trim().split(/\s+/)[0] || '',
        descontoPercentual: config.descontoPercentual,
        // Quanto falta, e não a hora absoluta: o relógio do celular pode estar
        // errado, e o contador tem que bater com o servidor.
        restanteMs: config.urgencia.ativa ? prazoDaOferta(session!.userId, agora, config.urgencia.horas) - agora : null,
        janelaHoras: config.urgencia.horas,
        planoPadrao: padrao.tipo,
        planos: daOferta.map((p) => ({
          tipo: p.tipo,
          nome: p.nome,
          periodo: p.periodo || '',
          preco: Number(p.preco),
          precoOriginal: Number(p.precoOriginal) > Number(p.preco) ? Number(p.precoOriginal) : null,
          precoUpgrade: precoDeUpgrade(Number(p.preco), config.descontoPercentual),
          durationMonths: Number(p.durationMonths) > 0 ? Number(p.durationMonths) : 0,
          badge: p.badge || '',
          inclusos: itensInclusos(p, { manualIncluidoNoPlus }),
        })),
        quest: {
          expiraEm: previa ? null : expira,
          vitalicio: !previa && !expira,
          recorrente: !!recorrencia,
        },
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('[upgrade] GET:', error)
    return NextResponse.json({ perfil: 'visitante', logado: false, ativo: false, elegivel: false })
  }
}
