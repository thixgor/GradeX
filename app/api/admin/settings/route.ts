import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { PlanConfig, AdminSettings } from '@/lib/types'
import {
  normalizeSidebarSections,
  type SidebarSectionSettings,
} from '@/lib/sidebar-sections'

export const dynamic = 'force-dynamic'

interface AIKeySettings {
  generalExams?: string
  personalExams?: string
  flashcards?: string
}

interface LandingSettings {
  videoEmbedUrl: string
  landingPageEnabled: boolean
  videoEnabled: boolean
  personalExamsEnabled?: boolean
  registrationBlocked?: boolean
  registrationBlockedMessage?: string
  aiKeys?: AIKeySettings
  sidebarSections?: SidebarSectionSettings
}

const DEFAULT_LANDING_SETTINGS: LandingSettings = {
  videoEmbedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  landingPageEnabled: true,
  videoEnabled: true,
  personalExamsEnabled: true,
  registrationBlocked: false,
  registrationBlockedMessage: 'Cadastro temporariamente desativado',
  aiKeys: {
    generalExams: '',
    personalExams: '',
    flashcards: ''
  },
  sidebarSections: normalizeSidebarSections(),
}

// GET - Obter configurações (público)
export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    const settings = await db.collection('landing_settings').findOne({})

    if (!settings) {
      // Retornar configurações padrão
      return NextResponse.json(DEFAULT_LANDING_SETTINGS)
    }

    return NextResponse.json({
      ...DEFAULT_LANDING_SETTINGS,
      ...settings,
      sidebarSections: normalizeSidebarSections(settings.sidebarSections),
    })
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

    const sanitizedBody: Partial<LandingSettings> = {
      ...body,
      sidebarSections: normalizeSidebarSections(body.sidebarSections),
    }

    const db = await getDb()
    const result = await db.collection('landing_settings').updateOne(
      {},
      { $set: sanitizedBody },
      { upsert: true }
    )

    // Buscar as configurações atualizadas para retornar
    const updatedSettings = await db.collection('landing_settings').findOne({})

    return NextResponse.json({
      success: true,
      message: 'Configurações atualizadas com sucesso',
      ...updatedSettings,
      sidebarSections: normalizeSidebarSections(updatedSettings?.sidebarSections),
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
