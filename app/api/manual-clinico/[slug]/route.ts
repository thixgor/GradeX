import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import {
  buildManualClinicoPreview,
  getManualClinicoAccess,
  getManualClinicoConfig,
  getManualClinicoFreeSlugSet,
  isManualClinicoPathologyFree,
  serializeManualClinicoProduct,
} from '@/lib/manual-clinico-product'

export const dynamic = 'force-dynamic'

// GET - Obter patologia por slug (freemium)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const [db, session] = await Promise.all([getDb(), getSession()])

    const patologia = await db.collection('patologias').findOne({ slug })

    if (!patologia) {
      return NextResponse.json({ error: 'Patologia não encontrada' }, { status: 404 })
    }

    const [config, access] = await Promise.all([
      getManualClinicoConfig(db),
      getManualClinicoAccess(db, session),
    ])
    const freeSlugs = await getManualClinicoFreeSlugSet(db, config)
    const isFree = isManualClinicoPathologyFree(patologia as any, freeSlugs)
    const unlocked = access.hasFullAccess || isFree

    const payload = unlocked ? patologia : buildManualClinicoPreview(patologia)

    return NextResponse.json({
      ...payload,
      isFree,
      isPremiumLocked: !unlocked,
      accessStatus: unlocked ? (isFree ? 'free' : 'premium_unlocked') : 'locked',
      product: serializeManualClinicoProduct(config),
      access: {
        hasFullAccess: access.hasFullAccess,
        reason: access.reason,
      },
    })
  } catch (error) {
    console.error('Erro ao buscar patologia:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
