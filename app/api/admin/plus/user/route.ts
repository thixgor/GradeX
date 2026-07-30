import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { audit } from '@/lib/payments/audit'
import { applyPlusRefundClawback, evaluatePlusRisk, getPlusUsageSummary } from '@/lib/plus-guard'
import type { PlusDownloadLog } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Ações do admin sobre uma conta Plus+ específica.
 *
 * GET  ?userId=… → consumo detalhado da conta (cotas, janela de
 *                  arrependimento, score de risco, últimos downloads).
 * POST           → { userId, action: 'block' | 'unblock' | 'clear_risk' | 'clawback' }
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = req.nextUrl.searchParams.get('userId') || ''
  if (!ObjectId.isValid(userId)) {
    return NextResponse.json({ error: 'userId inválido' }, { status: 400 })
  }

  const db = await getDb()
  const summary = await getPlusUsageSummary(userId, db)
  if (!summary) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const recentDownloads = await db
    .collection<PlusDownloadLog>('plus_download_logs')
    .find({ userId }, { projection: { kind: 1, resourceTitle: 1, createdAt: 1, ip: 1, inRefundWindow: 1 } })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray()

  return NextResponse.json({ summary, recentDownloads })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { userId, action, reason } = body || {}
  if (!ObjectId.isValid(String(userId))) {
    return NextResponse.json({ error: 'userId inválido' }, { status: 400 })
  }

  const db = await getDb()
  const users = db.collection('users')
  const filter = { _id: new ObjectId(String(userId)) as any }

  switch (action) {
    case 'block':
      await users.updateOne(filter, {
        $set: {
          plusDownloadsBlocked: true,
          plusDownloadsBlockedReason:
            String(reason || '').slice(0, 300) ||
            'Downloads suspensos por revisão de segurança. Fale com o suporte.',
        },
      })
      break

    case 'unblock':
      await users.updateOne(filter, {
        $set: { plusDownloadsBlocked: false },
        $unset: { plusDownloadsBlockedReason: '', plusRiskFlaggedAt: '' },
      })
      break

    case 'clear_risk':
      await users.updateOne(filter, {
        $set: { plusRiskScore: 0 },
        $unset: { plusRiskFlaggedAt: '' },
      })
      break

    // Estorno resolvido fora do provedor (Pix devolvido na mão, por exemplo):
    // rebaixa a conta e registra o reembolso do mesmo jeito.
    case 'clawback': {
      const result = await applyPlusRefundClawback(
        String(userId),
        String(reason || 'manual_admin'),
        db,
      )
      await audit({
        action: 'role_revoked',
        actorUserId: session.userId,
        targetUserId: String(userId),
        resourceType: 'plan',
        metadata: { via: 'admin_clawback', ...result },
      })
      return NextResponse.json({ success: true, ...result })
    }

    default:
      return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 })
  }

  await audit({
    action: 'plus_guard_action',
    actorUserId: session.userId,
    targetUserId: String(userId),
    resourceType: 'user',
    metadata: { action, reason },
  })

  const riskScore = await evaluatePlusRisk(String(userId), db)
  return NextResponse.json({ success: true, riskScore })
}
