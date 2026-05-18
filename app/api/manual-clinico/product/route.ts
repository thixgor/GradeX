import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  getManualClinicoAccess,
  getManualClinicoConfig,
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

    return NextResponse.json({
      product: serializeManualClinicoProduct(config),
      access: {
        hasFullAccess: access.hasFullAccess,
        reason: access.reason,
      },
    })
  } catch (error) {
    console.error('[manual-clinico/product] GET:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
