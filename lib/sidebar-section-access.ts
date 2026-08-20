import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { memoizarPorTempo } from '@/lib/cache-de-servidor'
import {
  normalizeSidebarSections,
  isSidebarSectionEnabled,
  type SidebarSectionKey,
  type SidebarSectionSettings,
} from '@/lib/sidebar-sections'

/**
 * 15 segundos. Este `findOne` roda no LAYOUT de cada seção (/aulas,
 * /banco-questoes, /provas, …), ou seja, uma vez por navegação e ANTES de
 * qualquer HTML sair — é tempo que o aluno passa olhando a tela anterior.
 *
 * O documento é o mesmo para todo mundo e muda quando um admin liga ou desliga
 * uma seção, o que acontece raramente. A janela é curta o bastante para a
 * mudança aparecer quase imediata, e larga o bastante para que a rajada de
 * requisições de uma única abertura de tela custe uma consulta só.
 */
const TTL_DAS_SECOES_MS = 15_000

export async function getSidebarSectionSettings(): Promise<SidebarSectionSettings> {
  return memoizarPorTempo('sidebar-sections', TTL_DAS_SECOES_MS, async () => {
    const db = await getDb()
    const settings = await db.collection('landing_settings').findOne(
      {},
      { projection: { sidebarSections: 1 } }
    )

    return normalizeSidebarSections(settings?.sidebarSections)
  })
}

export async function canAccessSidebarSection(sectionKey: SidebarSectionKey): Promise<boolean> {
  // Local UI testing: all sections open without DB/login
  if (process.env.NODE_ENV !== 'production' && process.env.DEV_BYPASS_AUTH === 'true') {
    return true
  }

  const session = await getSession()

  if (!session) return false
  if (session.role === 'admin') return true

  try {
    const sections = await getSidebarSectionSettings()
    return isSidebarSectionEnabled(sections, sectionKey)
  } catch {
    // Mongo offline in local dev: don't block the page
    if (process.env.NODE_ENV !== 'production') return true
    return false
  }
}

export async function requireSidebarSectionAccess(sectionKey: SidebarSectionKey): Promise<void> {
  const allowed = await canAccessSidebarSection(sectionKey)

  if (!allowed) {
    redirect('/dashboard')
  }
}

export async function denyDisabledSectionApi(sectionKey: SidebarSectionKey): Promise<NextResponse | null> {
  const allowed = await canAccessSidebarSection(sectionKey)

  if (allowed) return null

  return NextResponse.json(
    { error: 'Seção desabilitada pelo administrador' },
    { status: 403 }
  )
}
