import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

// GET — retorna flags de interstitial (público)
export async function GET(_req: NextRequest) {
  try {
    const db = await getDb()
    const settings = await db.collection('landing_settings').findOne({})

    return NextResponse.json({
      doacaoInterstitialManualClinico: settings?.doacaoInterstitialManualClinico ?? false,
      doacaoInterstitialExams: settings?.doacaoInterstitialExams ?? false,
    })
  } catch (error) {
    console.error('Erro ao buscar configurações de doação:', error)
    return NextResponse.json({
      doacaoInterstitialManualClinico: false,
      doacaoInterstitialExams: false,
    })
  }
}
