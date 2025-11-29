import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface LandingSettings {
  videoEmbedUrl: string
  landingPageEnabled: boolean
  videoEnabled: boolean
  personalExamsEnabled?: boolean
}

// GET - Obter configurações (público)
export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    const settings = await db.collection('landing_settings').findOne({})

    if (!settings) {
      // Retornar configurações padrão
      return NextResponse.json({
        videoEmbedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        landingPageEnabled: true,
        videoEnabled: true,
        personalExamsEnabled: true
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Erro ao obter configurações:', error)
    return NextResponse.json(
      { error: 'Erro ao obter configurações' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar configurações
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: Partial<LandingSettings> = await req.json()

    // Validar URL do vídeo
    if (body.videoEmbedUrl && !isValidEmbedUrl(body.videoEmbedUrl)) {
      return NextResponse.json(
        { error: 'URL de embed inválida' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const result = await db.collection('landing_settings').updateOne(
      {},
      { $set: body },
      { upsert: true }
    )

    // Buscar as configurações atualizadas para retornar
    const updatedSettings = await db.collection('landing_settings').findOne({})

    return NextResponse.json({
      success: true,
      message: 'Configurações atualizadas com sucesso',
      ...updatedSettings
    })
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações' },
      { status: 500 }
    )
  }
}

function isValidEmbedUrl(url: string): boolean {
  try {
    // Aceita URLs do YouTube embed
    if (url.includes('youtube.com/embed/') || url.includes('youtu.be/')) {
      return true
    }
    // Aceita outras URLs de embed comuns
    if (url.includes('vimeo.com/') || url.includes('dailymotion.com/')) {
      return true
    }
    return false
  } catch {
    return false
  }
}
