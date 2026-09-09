import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
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

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'desconhecido'
}

// GET - Obter patologia por slug (freemium)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const [db, session] = await Promise.all([getDb(), getSession()])

    // Visitante sem conta recebe a prévia (ver `buildManualClinicoPreview`
    // abaixo), e é justamente por ser aberta que essa porta precisa de teto:
    // sem sessão não há usuário para limitar, então o limite é por IP, como na
    // amostra pública. Quem está logado segue sem teto — a cota de
    // visualizações gratuitas já é o limite daquele lado.
    if (!session?.userId) {
      const rl = await checkRateLimit(clientIp(request), 'manual-clinico-previa', 60, 10 * 60 * 1000)
      if (!rl.success) {
        return NextResponse.json(
          { error: 'Muitas requisições. Tente de novo em alguns minutos.' },
          { status: 429 },
        )
      }
    }

    const patologia = await db.collection('patologias').findOne({ slug })

    if (!patologia) {
      return NextResponse.json({ error: 'Patologia não encontrada' }, { status: 404 })
    }

    const config = await getManualClinicoConfig(db)
    const access = await getManualClinicoAccess(db, session, config, 'patologias')
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

    // Sem conta, ninguém destranca a entrada inteira — nem nas patologias da
    // lista gratuita. "Grátis" ali sempre quis dizer "grátis para quem tem
    // conta": era o login que segurava a porta, e é a mesma régua que a amostra
    // pública (/api/amostra) aplica ao liberar uma patologia da lista. O que o
    // visitante recebe é a prévia, a mesma de quem já gastou as visualizações.
    const isGuest = !session?.userId
    const unlocked = !isGuest && (access.hasFullAccess || isGlobalFree || isFreeClaimed)
    const accessStatus = access.hasFullAccess
      ? 'premium_unlocked'
      : isGuest
        // 'login_required' é o convite: existe um caminho gratuito do outro lado
        // do login (a patologia é da lista, ou o Manual dá N aberturas por
        // conta). Sem esse caminho, o que resta é a compra — 'locked'.
        ? (isGlobalFree || config.freeAccessMode === 'quantity') ? 'login_required' : 'locked'
        : isGlobalFree
          ? 'free'
          : isFreeClaimed
            ? claimedNow ? 'free_claimed_now' : 'free_claimed'
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
