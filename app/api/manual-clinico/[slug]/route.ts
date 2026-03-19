import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

// GET - Obter patologia por slug (público)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const db = await getDb()

    const patologia = await db.collection('patologias').findOne({ slug })

    if (!patologia) {
      return NextResponse.json({ error: 'Patologia não encontrada' }, { status: 404 })
    }

    return NextResponse.json(patologia)
  } catch (error) {
    console.error('Erro ao buscar patologia:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
