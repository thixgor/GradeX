import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import {
  DEFAULT_PLUS_GUARD,
  mergePlusGuardSettings,
  sanitizePlusGuardSettings,
} from '@/lib/plus-guard'
import { activePlusUserFilter, expiredPlusUserFilter } from '@/lib/account-tier'
import type { PlusDownloadLog } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Configuração do Plus+ Guard em /admin/settings.
 *
 * GET  → configuração atual + panorama de uso (quem está consumindo demais,
 *        quanto foi baixado dentro da janela de arrependimento, contas
 *        sinalizadas por risco).
 * PUT  → grava a configuração (somente admin).
 */
export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = await getDb()
    const settings = await db.collection('admin_settings').findOne({}, { projection: { plusGuard: 1 } })
    const plusGuard = mergePlusGuardSettings(settings?.plusGuard)

    const logs = db.collection<PlusDownloadLog>('plus_download_logs')
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const now = new Date()
    // Assinantes dentro da janela de arrependimento: o subconjunto que o
    // Guard mais protege, e o que explica um pico em `downloadsInRefundWindow`.
    const refundWindowStart = new Date(
      now.getTime() - plusGuard.refundWindowDays * 24 * 60 * 60 * 1000,
    )

    const [
      downloads24h,
      downloads7d,
      downloadsInRefundWindow,
      flaggedUsers,
      blockedUsers,
      plusUsers,
      plusExpiredPending,
      plusInRefundWindow,
      topConsumers,
    ] = await Promise.all([
      logs.countDocuments({ createdAt: { $gte: since24h } }),
      logs.countDocuments({ createdAt: { $gte: since7d } }),
      logs.countDocuments({ inRefundWindow: true, createdAt: { $gte: since7d } }),
      // Sinalizados/bloqueados só interessam entre quem ainda é assinante.
      db.collection('users').countDocuments({
        ...activePlusUserFilter(now),
        plusRiskFlaggedAt: { $exists: true },
      }),
      db.collection('users').countDocuments({
        ...activePlusUserFilter(now),
        plusDownloadsBlocked: true,
      }),
      db.collection('users').countDocuments(activePlusUserFilter(now)),
      db.collection('users').countDocuments(expiredPlusUserFilter(now)),
      db.collection('users').countDocuments({
        ...activePlusUserFilter(now),
        premiumActivatedAt: { $gte: refundWindowStart },
      }),
      // Quem mais baixou nos últimos 7 dias — é aqui que o abuso aparece antes
      // de virar pedido de reembolso.
      logs
        .aggregate([
          { $match: { createdAt: { $gte: since7d } } },
          {
            $group: {
              _id: '$userId',
              userName: { $first: '$userName' },
              userEmail: { $first: '$userEmail' },
              count: { $sum: 1 },
              inRefundWindow: { $sum: { $cond: ['$inRefundWindow', 1, 0] } },
              lastDownload: { $max: '$createdAt' },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 20 },
        ])
        .toArray(),
    ])

    return NextResponse.json({
      plusGuard,
      defaults: DEFAULT_PLUS_GUARD,
      overview: {
        plusUsers,
        plusExpiredPending,
        plusInRefundWindow,
        downloads24h,
        downloads7d,
        downloadsInRefundWindow,
        flaggedUsers,
        blockedUsers,
        topConsumers,
      },
    })
  } catch (error) {
    console.error('[admin/settings/plus] GET:', error)
    return NextResponse.json({ error: 'Erro ao carregar configuração do Plus+' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const plusGuard = sanitizePlusGuardSettings(body?.plusGuard ?? body)
    plusGuard.atualizadoPor = session.userId

    const db = await getDb()
    await db
      .collection('admin_settings')
      .updateOne({}, { $set: { plusGuard, atualizadoEm: new Date() } }, { upsert: true })

    return NextResponse.json({ success: true, plusGuard })
  } catch (error) {
    console.error('[admin/settings/plus] PUT:', error)
    return NextResponse.json({ error: 'Erro ao salvar configuração do Plus+' }, { status: 500 })
  }
}
