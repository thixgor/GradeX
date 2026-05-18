import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { applyWatermark, isPdfBuffer } from '@/lib/pdf-watermark'
import {
  getManualClinicoAccess,
  getManualClinicoConfig,
  getManualClinicoFreeSlugSet,
  isManualClinicoPathologyFree,
} from '@/lib/manual-clinico-product'

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
    const [config, access] = await Promise.all([
      getManualClinicoConfig(db),
      getManualClinicoAccess(db, session),
    ])

    if (!access.hasFullAccess) {
      if (mode !== 'single' || !slug) {
        return NextResponse.json({ error: 'Acesso premium necessario para baixar este PDF.' }, { status: 403 })
      }
      const [patologia, freeSlugs] = await Promise.all([
        db.collection('patologias').findOne({ slug }, { projection: { slug: 1 } }),
        getManualClinicoFreeSlugSet(db, config),
      ])
      if (!patologia || !isManualClinicoPathologyFree(patologia as any, freeSlugs)) {
        return NextResponse.json({ error: 'Acesso premium necessario para baixar este PDF.' }, { status: 403 })
      }
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
