import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import {
  buildManualClinicoPreview,
  claimManualClinicoFreePathology,
  getManualClinicoAccess,
  getManualClinicoConfig,
  getManualClinicoFreeSlugSet,
  getManualClinicoFreeQuotaState,
  isManualClinicoPathologyFree,
  serializeManualClinicoFreeQuota,
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

    const config = await getManualClinicoConfig(db)
    const access = await getManualClinicoAccess(db, session, config)
    const freeSlugs = await getManualClinicoFreeSlugSet(db, config)
    const isGlobalFree = isManualClinicoPathologyFree(patologia as any, freeSlugs)
    let freeQuota = await getManualClinicoFreeQuotaState(db, session, config)
    let isFreeClaimed = freeQuota.claimedSlugs.includes(String(patologia.slug || ''))
    let canClaimFree = false
    let claimedNow = false

    if (!access.hasFullAccess && !isGlobalFree && config.freeAccessMode === 'quantity') {
      const claim = await claimManualClinicoFreePathology(db, { session, config, patologia: patologia as any })
      freeQuota = claim.quota
      isFreeClaimed = claim.allowed
      claimedNow = claim.reason === 'claimed'
      canClaimFree = claim.allowed
    }

    const unlocked = access.hasFullAccess || isGlobalFree || isFreeClaimed
    const accessStatus = access.hasFullAccess
      ? 'premium_unlocked'
      : isGlobalFree
        ? 'free'
        : isFreeClaimed
          ? claimedNow ? 'free_claimed_now' : 'free_claimed'
          : !session?.userId && config.freeAccessMode === 'quantity'
            ? 'login_required'
            : 'locked'

    const payload = unlocked ? patologia : buildManualClinicoPreview(patologia)

    return NextResponse.json({
      ...payload,
      isFree: isGlobalFree || isFreeClaimed,
      isFreeClaimed,
      canClaimFree,
      isPremiumLocked: !unlocked,
      accessStatus,
      product: serializeManualClinicoProduct(config),
      access: {
        hasFullAccess: access.hasFullAccess,
        reason: access.reason,
        freeQuota: serializeManualClinicoFreeQuota(freeQuota),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar patologia:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
