import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET — lê configurações de interstitial (admin)
export async function GET(_req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const db = await getDb()
    const settings = await db.collection('landing_settings').findOne({})

    return NextResponse.json({
      doacaoInterstitialManualClinico: settings?.doacaoInterstitialManualClinico ?? false,
      doacaoInterstitialExams: settings?.doacaoInterstitialExams ?? false,
    })
  } catch (error) {
    console.error('Erro ao buscar configurações de doação:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PUT — atualiza configurações de interstitial
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const db = await getDb()

    const update: Record<string, boolean> = {}
    if (typeof body.doacaoInterstitialManualClinico === 'boolean')
      update.doacaoInterstitialManualClinico = body.doacaoInterstitialManualClinico
    if (typeof body.doacaoInterstitialExams === 'boolean')
      update.doacaoInterstitialExams = body.doacaoInterstitialExams

    await db.collection('landing_settings').updateOne(
      {},
      { $set: update },
      { upsert: true }
    )

    return NextResponse.json({ success: true, ...update })
  } catch (error) {
    console.error('Erro ao atualizar configurações de doação:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
