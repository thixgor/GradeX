import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { applyWatermark, isPdfBuffer } from '@/lib/pdf-watermark'
import {
  getManualClinicoAccess,
  getManualClinicoConfig,
  getManualClinicoFreeSlugSet,
  getManualClinicoFreeQuotaState,
  isManualClinicoPathologyFree,
} from '@/lib/manual-clinico-product'
import { checkPlusDownloadAllowance, recordPlusDownload } from '@/lib/plus-guard'
import { emailFingerprint } from '@/lib/watermark-fingerprint'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const slug = request.nextUrl.searchParams.get('slug') || ''
    const mode = request.nextUrl.searchParams.get('mode') || 'single'
    const db = await getDb()
    const config = await getManualClinicoConfig(db)
    const access = await getManualClinicoAccess(db, session, config, 'pdfCompleto')

    if (!access.hasFullAccess) {
      if (mode !== 'single' || !slug) {
        return NextResponse.json({ error: 'Acesso premium necessario para baixar este PDF.' }, { status: 403 })
      }
      const [patologia, freeSlugs] = await Promise.all([
        db.collection('patologias').findOne({ slug }, { projection: { slug: 1 } }),
        getManualClinicoFreeSlugSet(db, config),
      ])
      const freeQuota = await getManualClinicoFreeQuotaState(db, session, config)
      const isAllowedFree = !!patologia && (
        isManualClinicoPathologyFree(patologia as any, freeSlugs) ||
        freeQuota.claimedSlugs.includes(String(patologia.slug || ''))
      )
      if (!isAllowedFree) {
        return NextResponse.json({ error: 'Acesso premium necessario para baixar este PDF.' }, { status: 403 })
      }
    }

    // Plus+ Guard — o Manual Clínico é o acervo mais valioso e o alvo óbvio de
    // quem quer baixar tudo antes de pedir reembolso.
    const allowance = await checkPlusDownloadAllowance({
      userId: session.userId,
      isAdmin: session.role === 'admin',
      db,
    })
    if (!allowance.allowed) {
      return NextResponse.json(
        { error: allowance.message || 'Limite de downloads atingido.', reason: allowance.reason, retryAt: allowance.retryAt },
        { status: 429 },
      )
    }

    const pdfArrayBuffer = await request.arrayBuffer()
    if (!isPdfBuffer(pdfArrayBuffer)) {
      return NextResponse.json({ error: 'Arquivo PDF invalido.' }, { status: 400 })
    }

    const watermarked = await applyWatermark(pdfArrayBuffer, {
      userName: session.name,
      userEmail: session.email,
      userId: session.userId,
      orderId: access.purchase?.providerPaymentId || access.purchase?.providerOrderId || access.purchase?._id?.toString() || session.userId,
      downloadedAt: new Date(),
    })

    recordPlusDownload({
      userId: session.userId,
      userEmail: session.email,
      userName: session.name,
      kind: 'manual_clinico',
      resourceId: slug || mode,
      resourceTitle: mode === 'single' ? `Patologia ${slug}` : 'Manual Clínico (completo)',
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      watermarkFingerprint: emailFingerprint(session.email),
      db,
    }).catch(() => {})

    return new NextResponse(Buffer.from(watermarked), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(watermarked.byteLength),
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('[manual-clinico/pdf-watermark] erro:', error)
    return NextResponse.json({ error: 'Erro interno ao proteger PDF.' }, { status: 500 })
  }
}
