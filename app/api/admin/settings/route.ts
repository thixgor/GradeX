import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { invalidarCacheDeServidor } from '@/lib/cache-de-servidor'
import { PlanConfig, AdminSettings } from '@/lib/types'
import {
  normalizeSidebarOrder,
  normalizeSidebarSections,
  type SidebarSectionOrder,
  type SidebarSectionSettings,
} from '@/lib/sidebar-sections'
import { normalizeSidebarIcons, type SidebarSectionIcons } from '@/lib/sidebar-icons'
import {
  normalizeSidebarGroups,
  normalizeSidebarSectionGroups,
  type SidebarGroupDefinition,
  type SidebarSectionGroups,
} from '@/lib/sidebar-groups'

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
  landingPageEnabled: boolean
  personalExamsEnabled?: boolean
  registrationBlocked?: boolean
  registrationBlockedMessage?: string
  aiKeys?: AIKeySettings
  sidebarSections?: SidebarSectionSettings
  sidebarSectionOrder?: SidebarSectionOrder
  sidebarSectionIcons?: SidebarSectionIcons
  sidebarGroups?: SidebarGroupDefinition[]
  sidebarSectionGroups?: SidebarSectionGroups
}

const DEFAULT_LANDING_SETTINGS: LandingSettings = {
  landingPageEnabled: true,
  personalExamsEnabled: true,
  registrationBlocked: false,
  registrationBlockedMessage: 'Cadastro temporariamente desativado',
  aiKeys: {
    generalExams: '',
    personalExams: '',
    flashcards: ''
  },
  sidebarSections: normalizeSidebarSections(),
  sidebarSectionOrder: normalizeSidebarOrder(),
  sidebarSectionIcons: normalizeSidebarIcons(),
  sidebarGroups: normalizeSidebarGroups(),
  sidebarSectionGroups: normalizeSidebarSectionGroups(undefined),
}

/**
 * Grupos e vínculos saem sempre juntos: o mapa seção → grupo é validado contra
 * a lista de grupos que sobreviveu à normalização. Separá-los deixaria passar
 * uma seção apontando para um grupo que o admin acabou de apagar.
 */
function sidebarGroupPayload(rawGroups: unknown, rawAssignments: unknown) {
  const sidebarGroups = normalizeSidebarGroups(rawGroups)
  return {
    sidebarGroups,
    sidebarSectionGroups: normalizeSidebarSectionGroups(rawAssignments, sidebarGroups),
  }
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
        sidebarSectionOrder: normalizeSidebarOrder(settings.sidebarSectionOrder),
        sidebarSectionIcons: normalizeSidebarIcons(settings.sidebarSectionIcons),
        ...sidebarGroupPayload(settings.sidebarGroups, settings.sidebarSectionGroups),
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

    const sanitizedBody: Partial<LandingSettings> = {
      ...body,
      sidebarSections: normalizeSidebarSections(body.sidebarSections),
      sidebarSectionOrder: normalizeSidebarOrder(body.sidebarSectionOrder),
      sidebarSectionIcons: normalizeSidebarIcons(body.sidebarSectionIcons),
      ...sidebarGroupPayload(body.sidebarGroups, body.sidebarSectionGroups),
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

    // A landing (`/`) é HTML estático em cache de borda. Sem este purge, virar
    // o `landingPageEnabled` (ou qualquer outro campo que a landing exibe) só
    // apareceria no próximo `revalidate` — até 5 minutos depois. Com ele, o
    // toggle do painel continua valendo na hora, sem devolver a página ao
    // regime de renderizar a cada visita.
    revalidatePath('/')

    // Os layouts de seção leem `sidebarSections` por uma memória curta de
    // servidor (ver lib/sidebar-section-access.ts). Descartá-la aqui faz o
    // toggle valer na próxima navegação, e não só quando a janela expirar.
    invalidarCacheDeServidor('sidebar-sections')

    // Buscar as configurações atualizadas para retornar
    const updatedSettings = await collection.findOne({})

    return NextResponse.json(
      {
        success: true,
        message: 'Configurações atualizadas com sucesso',
        ...updatedSettings,
        sidebarSections: normalizeSidebarSections(updatedSettings?.sidebarSections),
        sidebarSectionOrder: normalizeSidebarOrder(updatedSettings?.sidebarSectionOrder),
        sidebarSectionIcons: normalizeSidebarIcons(updatedSettings?.sidebarSectionIcons),
        ...sidebarGroupPayload(updatedSettings?.sidebarGroups, updatedSettings?.sidebarSectionGroups),
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

