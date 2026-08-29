import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  MANUAL_CLINICO_PRODUCT_ID,
  MANUAL_CLINICO_PURCHASES_COLLECTION,
} from '@/lib/manual-clinico-product'
import {
  buildManualSubscription,
  buildPaidSubscription,
  pickBestManualPurchase,
  type AdminUserRow,
} from '@/lib/admin-user-insights'
import type { ManualClinicoPurchase, PlanConfig, User } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/admin/users/overview
 *
 * A lista de `/admin/users` com as assinaturas resolvidas. O `/api/users` puro
 * devolve só o documento do usuário, e o documento não sabe nada sobre o Manual
 * Clínico (que mora em `manual_clinico_purchases`) nem sobre quanto a conta já
 * gastou (`material_purchases`). Fazer essa junção no cliente exigiria uma
 * requisição por usuário; aqui são três leituras agregadas para a base inteira.
 *
 * A montagem final de cada assinatura fica em `lib/admin-user-insights`, o
 * mesmo módulo que a tela usa para os cards — os números não podem divergir.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const db = await getDb()
    const now = new Date()

    const [users, manualPurchases, materialSpend, manualSpend, settings] = await Promise.all([
      db
        .collection<User>('users')
        .find({})
        .project({ password: 0 })
        .sort({ createdAt: -1 })
        .toArray(),
      db
        .collection<ManualClinicoPurchase>(MANUAL_CLINICO_PURCHASES_COLLECTION)
        .find(
          { productId: MANUAL_CLINICO_PRODUCT_ID, status: 'completed' },
          {
            projection: {
              userId: 1,
              userEmail: 1,
              planKey: 1,
              planLabel: 1,
              planDurationMonths: 1,
              accessType: 1,
              price: 1,
              purchasedAt: 1,
              expiresAt: 1,
              renewalDeclined: 1,
              provider: 1,
            },
          },
        )
        .sort({ purchasedAt: -1 })
        .toArray(),
      aggregateSpend(db, 'material_purchases'),
      aggregateSpend(db, MANUAL_CLINICO_PURCHASES_COLLECTION),
      db.collection('admin_settings').findOne({}, { projection: { planos: 1 } }),
    ])

    // Rótulos dos planos personalizados criados em /admin/settings — sem eles,
    // um `premiumPlanType` fora da tabela padrão apareceria como chave crua.
    // `planRoles` guarda o cargo que cada plano concede: é o que diz se uma
    // assinatura já vencida era Plus+ ou Quest+, depois de o cron rebaixar a
    // conta e o `accountType` não responder mais.
    const planLabels: Record<string, string> = {}
    const planRoles: Record<string, string> = {}
    for (const plano of ((settings?.planos || []) as PlanConfig[])) {
      const key = String(plano?.tipo || '').trim().toLowerCase()
      if (!key) continue
      planLabels[key] = String(plano?.periodo || plano?.nome || key)
      if (plano?.role) planRoles[key] = String(plano.role)
    }

    // Melhor compra do Manual Clínico por identidade. A chave de e-mail cobre
    // as compras antigas gravadas antes de a conta existir/ser vinculada.
    const manualById = new Map<string, ManualClinicoPurchase>()
    const manualByEmail = new Map<string, ManualClinicoPurchase>()
    for (const purchase of manualPurchases) {
      const userId = purchase.userId ? String(purchase.userId) : ''
      if (userId) {
        manualById.set(userId, pickBestManualPurchase(manualById.get(userId), purchase, now)!)
      }
      const email = purchase.userEmail ? String(purchase.userEmail).toLowerCase() : ''
      if (email) {
        manualByEmail.set(email, pickBestManualPurchase(manualByEmail.get(email), purchase, now)!)
      }
    }

    const rows: AdminUserRow[] = users.map((user: any) => {
      const id = String(user._id)
      const email = String(user.email || '').toLowerCase()

      const manualPurchase =
        manualById.get(id) || (email ? manualByEmail.get(email) : undefined) || null

      const material = readSpend(materialSpend, id, email)
      const manual = readSpend(manualSpend, id, email)

      const lastPurchaseAt = [material.last, manual.last]
        .filter((value): value is string => !!value)
        .sort()
        .pop() || null

      return {
        ...user,
        paidSubscription: buildPaidSubscription(user, now, planLabels, planRoles),
        manualSubscription: buildManualSubscription(manualPurchase, now),
        spend: {
          total: round2(material.total + manual.total),
          count: material.count + manual.count,
          materialTotal: round2(material.total),
          manualTotal: round2(manual.total),
          lastPurchaseAt,
        },
      } as AdminUserRow
    })

    return NextResponse.json({
      users: rows,
      planLabels,
      generatedAt: now.toISOString(),
    })
  } catch (error) {
    console.error('[admin/users/overview] erro:', error)
    return NextResponse.json({ error: 'Erro ao carregar usuários' }, { status: 500 })
  }
}

interface SpendBucket {
  total: number
  count: number
  last: string | null
}

/**
 * Soma o que cada identidade gastou numa coleção de compras.
 *
 * Cada documento entra em exatamente um balde: `userId` quando existe, e-mail
 * em minúsculas quando não (registros legados, compra sem login). Como as duas
 * chaves nunca recebem o mesmo documento, somar os dois baldes de um usuário
 * não conta nada duas vezes.
 */
async function aggregateSpend(db: any, collection: string): Promise<Map<string, SpendBucket>> {
  const rows = await db
    .collection(collection)
    .aggregate([
      { $match: { status: 'completed' } },
      {
        $project: {
          price: 1,
          purchasedAt: 1,
          key: {
            $cond: [
              { $gt: [{ $strLenCP: { $ifNull: [{ $toString: '$userId' }, ''] } }, 0] },
              { $toString: '$userId' },
              { $toLower: { $ifNull: ['$userEmail', ''] } },
            ],
          },
        },
      },
      { $match: { key: { $ne: '' } } },
      {
        $group: {
          _id: '$key',
          total: { $sum: { $ifNull: ['$price', 0] } },
          count: { $sum: 1 },
          last: { $max: '$purchasedAt' },
        },
      },
    ])
    .toArray()

  const map = new Map<string, SpendBucket>()
  for (const row of rows) {
    map.set(String(row._id), {
      total: Number(row.total || 0),
      count: Number(row.count || 0),
      last: row.last ? new Date(row.last).toISOString() : null,
    })
  }
  return map
}

function readSpend(map: Map<string, SpendBucket>, id: string, email: string): SpendBucket {
  const byId = map.get(id)
  const byEmail = email ? map.get(email) : undefined
  if (!byId && !byEmail) return { total: 0, count: 0, last: null }
  const last = [byId?.last, byEmail?.last]
    .filter((value): value is string => !!value)
    .sort()
    .pop() || null
  return {
    total: (byId?.total || 0) + (byEmail?.total || 0),
    count: (byId?.count || 0) + (byEmail?.count || 0),
    last,
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}
