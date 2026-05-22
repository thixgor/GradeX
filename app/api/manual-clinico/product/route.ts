import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  buildManualClinicoSubscriptionInfo,
  getActiveManualClinicoPurchase,
  getLatestManualClinicoPurchase,
  getManualClinicoAccess,
  getManualClinicoConfig,
  getManualClinicoFreeQuotaState,
  serializeManualClinicoFreeQuota,
  serializeManualClinicoProduct,
} from '@/lib/manual-clinico-product'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const [session, db] = await Promise.all([getSession(), getDb()])
    const [config, access] = await Promise.all([
      getManualClinicoConfig(db),
      getManualClinicoAccess(db, session),
    ])
    const freeQuota = await getManualClinicoFreeQuotaState(db, session, config)
    const activePurchase = session ? await getActiveManualClinicoPurchase(db, session) : null
    const latestPurchase = !activePurchase && session ? await getLatestManualClinicoPurchase(db, session) : null
    const subscription = buildManualClinicoSubscriptionInfo(activePurchase || latestPurchase)

    return NextResponse.json({
      product: serializeManualClinicoProduct(config),
      access: {
        hasFullAccess: access.hasFullAccess,
        reason: access.reason,
        freeQuota: serializeManualClinicoFreeQuota(freeQuota),
        subscription,
      },
    })
  } catch (error) {
    console.error('[manual-clinico/product] GET:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
