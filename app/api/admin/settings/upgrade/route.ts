import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { cargoDoPlano } from '@/lib/plus-oferta'
import { PLUS_TIER } from '@/lib/account-tier'
import {
  LIMITES_DO_UPGRADE,
  normalizarConfigDoUpgrade,
  planosDoUpgrade,
  precoDeUpgrade,
  UPGRADE_QUEST_PADRAO,
} from '@/lib/upgrade-quest'
import { filtroDeQuestVigente, invalidarCatalogoDoUpgrade } from '@/lib/upgrade-quest-server'
import type { PlanConfig } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Configuração do upgrade Quest+ → Plus+ em /admin/settings.
 *
 * GET → configuração, os planos Plus+ que podem entrar na oferta (com o preço
 *       de upgrade já calculado) e o panorama: quantos Quest+ podem receber a
 *       oferta e quantos upgrades já foram pagos.
 * PUT → grava (somente admin). Valores fora da faixa são puxados para a borda.
 */
async function exigirAdmin() {
  const session = await getSession()
  return session?.role === 'admin' ? session : null
}

export async function GET() {
  if (!(await exigirAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const db = await getDb()
    const settings = await db.collection('admin_settings').findOne({}, { projection: { planos: 1, upgradeQuest: 1 } })
    const config = normalizarConfigDoUpgrade(settings?.upgradeQuest)
    const planos = (settings?.planos || []) as PlanConfig[]

    const [questVigentes, upgrades] = await Promise.all([
      db.collection('users').countDocuments(filtroDeQuestVigente()),
      db
        .collection('payment_orders')
        .aggregate([
          { $match: { type: 'plan', status: 'approved', 'metadata.upgradeQuest': { $exists: true } } },
          { $group: { _id: null, quantidade: { $sum: 1 }, receita: { $sum: '$amount' } } },
        ])
        .toArray(),
    ])

    return NextResponse.json({
      config,
      padrao: UPGRADE_QUEST_PADRAO,
      limites: LIMITES_DO_UPGRADE,
      // Todos os Plus+ com preço, visíveis ou não: o admin pode montar um
      // plano "só de upgrade" oculto e listá-lo aqui.
      planos: planos
        .filter((p) => cargoDoPlano(p) === PLUS_TIER && Number(p.preco) > 0)
        .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
        .map((p) => ({
          tipo: p.tipo,
          nome: p.nome,
          periodo: p.periodo || '',
          preco: Number(p.preco),
          oculto: !!p.oculto,
          durationMonths: Number(p.durationMonths) || 0,
        })),
      naOferta: planosDoUpgrade(planos, config).map((p) => ({
        tipo: p.tipo,
        precoUpgrade: precoDeUpgrade(Number(p.preco), config.descontoPercentual),
      })),
      panorama: {
        questVigentes,
        upgradesPagos: upgrades[0]?.quantidade || 0,
        receitaDeUpgrades: Math.round((upgrades[0]?.receita || 0) * 100) / 100,
      },
    })
  } catch (error) {
    console.error('[admin/settings/upgrade] GET:', error)
    return NextResponse.json({ error: 'Erro ao carregar a configuração do upgrade' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await exigirAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json().catch(() => null)
    const config = normalizarConfigDoUpgrade(body?.config ?? body)

    const db = await getDb()
    await db
      .collection('admin_settings')
      .updateOne(
        {},
        { $set: { upgradeQuest: { ...config, atualizadoPor: session.userId, atualizadoEm: new Date() }, atualizadoEm: new Date() } },
        { upsert: true },
      )
    invalidarCatalogoDoUpgrade()

    return NextResponse.json({ success: true, config })
  } catch (error) {
    console.error('[admin/settings/upgrade] PUT:', error)
    return NextResponse.json({ error: 'Erro ao salvar a configuração do upgrade' }, { status: 500 })
  }
}
