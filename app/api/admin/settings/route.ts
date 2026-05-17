import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { PlanConfig, AdminSettings } from '@/lib/types'
import {
  normalizeSidebarSections,
  type SidebarSectionSettings,
} from '@/lib/sidebar-sections'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
} as const

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
      return NextResponse.json(DEFAULT_LANDING_SETTINGS, { headers: NO_STORE_HEADERS })
    }

    return NextResponse.json(
      {
        ...DEFAULT_LANDING_SETTINGS,
        ...settings,
        sidebarSections: normalizeSidebarSections(settings.sidebarSections),
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (error) {
    console.error('Erro ao obter configurações:', error)
    return NextResponse.json(
      { error: 'Erro ao obter configurações' },
      { status: 500, headers: NO_STORE_HEADERS }
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
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }

    const sanitizedBody: Partial<LandingSettings> = {
      ...body,
      sidebarSections: normalizeSidebarSections(body.sidebarSections),
    }

    const db = await getDb()
    const collection = db.collection('landing_settings')

    // Se existirem múltiplos documentos (legado), consolidar em um só para
    // evitar que GET retorne valores diferentes de PUT.
    const existingDocs = await collection.find({}).limit(2).toArray()
    if (existingDocs.length > 1) {
      const [keep, ...extras] = existingDocs
      await collection.deleteMany({ _id: { $in: extras.map((d) => d._id) } })
      await collection.updateOne({ _id: keep._id }, { $set: sanitizedBody })
    } else {
      await collection.updateOne({}, { $set: sanitizedBody }, { upsert: true })
    }

    // Buscar as configurações atualizadas para retornar
    const updatedSettings = await collection.findOne({})

    return NextResponse.json(
      {
        success: true,
        message: 'Configurações atualizadas com sucesso',
        ...updatedSettings,
        sidebarSections: normalizeSidebarSections(updatedSettings?.sidebarSections),
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações' },
      { status: 500, headers: NO_STORE_HEADERS }
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
