import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { buildManualClinicoSearchFilter, rankManualClinicoResults } from '@/lib/manual-clinico-search'
import {
  getManualClinicoAccess,
  getManualClinicoConfig,
  getManualClinicoFreeSlugSet,
  getManualClinicoFreeQuotaState,
  isManualClinicoPathologyFree,
  serializeManualClinicoFreeQuota,
  serializeManualClinicoProduct,
} from '@/lib/manual-clinico-product'

export const dynamic = 'force-dynamic'

// GET - Busca pública de patologias
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const busca = searchParams.get('busca')
    const area = searchParams.get('area')
    const sistema = searchParams.get('sistema')
    const exportAll = searchParams.get('export') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const skip = (page - 1) * limit

    const session = await getSession()

    const db = await getDb()
    const [config, access] = await Promise.all([
      getManualClinicoConfig(db),
      getManualClinicoAccess(db, session),
    ])
    const [freeSlugs, freeQuota] = await Promise.all([
      getManualClinicoFreeSlugSet(db, config),
      getManualClinicoFreeQuotaState(db, session, config),
    ])
    const claimedSlugSet = new Set(freeQuota.claimedSlugs)
    const filter: any = {}

    // Export mode: return all pathologies with full data (for PDF generation)
    if (exportAll) {
      if (!session) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
      }
      if (!access.hasFullAccess) {
        return NextResponse.json({ error: 'Acesso premium necessario para exportar o Manual Clinico completo.' }, { status: 403 })
      }
      if (config.fullPdfButtonEnabled === false || config.fullPdfExternalUrl) {
        return NextResponse.json({ error: 'Geracao do PDF completo indisponivel.' }, { status: 403 })
      }
      const patologias = await db
        .collection('patologias')
        .find(filter)
        .sort({ sistema: 1, nome: 1 })
        .toArray()
      return NextResponse.json({ patologias, total: patologias.length })
    }

    if (area) {
      const areas = area.split(',').filter(Boolean)
      if (areas.length > 0) filter.areas = { $in: areas }
    }
    if (sistema) filter.sistema = sistema

    const projection = {
      nome: 1,
      sinonimos: 1,
      areas: 1,
      sistema: 1,
      cid10: 1,
      slug: 1,
      gravidade: 1,
    }

    const searchTerm = busca?.trim() || ''
    let patologias: any[] = []
    let total = 0

    if (searchTerm) {
      const searchFilter = {
        ...filter,
        ...buildManualClinicoSearchFilter(searchTerm),
      }
      const results = await db.collection<any>('patologias')
        .find(searchFilter, { projection })
        .toArray()
      const rankedResults = rankManualClinicoResults(results, searchTerm)

      total = rankedResults.length
      patologias = rankedResults.slice(skip, skip + limit)
    } else {
      // No search term — just list with filters
      const [results, count] = await Promise.all([
        db.collection('patologias')
          .find(filter, { projection })
          .sort({ nome: 1 })
          .skip(skip).limit(limit).toArray(),
        db.collection('patologias').countDocuments(filter)
      ])
      patologias = results
      total = count
    }

    const serialized = patologias.map((patologia) => {
      const isGlobalFree = isManualClinicoPathologyFree(patologia, freeSlugs)
      const isFreeClaimed = !!patologia.slug && claimedSlugSet.has(String(patologia.slug))
      const canClaimFree = config.freeAccessMode === 'quantity' &&
        !access.hasFullAccess &&
        !!session?.userId &&
        !isFreeClaimed &&
        freeQuota.remaining > 0
      const unlocked = access.hasFullAccess || isGlobalFree || isFreeClaimed
      const accessStatus = access.hasFullAccess
        ? 'premium_unlocked'
        : isGlobalFree
          ? 'free'
          : isFreeClaimed
            ? 'free_claimed'
            : canClaimFree
              ? 'free_available'
              : !session?.userId && config.freeAccessMode === 'quantity'
                ? 'login_required'
                : 'locked'
      return {
        ...patologia,
        isFree: isGlobalFree || isFreeClaimed,
        isFreeClaimed,
        canClaimFree,
        isPremiumLocked: !unlocked && !canClaimFree,
        accessStatus,
      }
    })

    return NextResponse.json({
      patologias: serialized,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      product: serializeManualClinicoProduct(config),
      access: {
        hasFullAccess: access.hasFullAccess,
        reason: access.reason,
        freeQuota: serializeManualClinicoFreeQuota(freeQuota),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar patologias:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
