import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'

interface TeamMemberConfig {
  name: string
  role: string
  image?: string
  description?: string
  imageOffsetX?: number
  imageOffsetY?: number
  imageZoom?: number
}

interface TeamConfig {
  leadership: TeamMemberConfig[]
  instructors: TeamMemberConfig[]
}

export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    const configCollection = db.collection<TeamConfig>('teamConfig')

    const config = await configCollection.findOne({})

    if (!config) {
      // Retorna configuração padrão
      return NextResponse.json({
        leadership: [],
        instructors: []
      })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { leadership, instructors } = body

    const db = await getDb()
    const configCollection = db.collection<TeamConfig>('teamConfig')

    // Atualizar ou criar configuração
    const result = await configCollection.updateOne(
      {},
      { $set: { leadership, instructors } },
      { upsert: true }
    )

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Erro ao salvar configurações:', error)
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 })
  }
}
