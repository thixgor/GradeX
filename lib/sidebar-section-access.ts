import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import {
  normalizeSidebarSections,
  isSidebarSectionEnabled,
  type SidebarSectionKey,
  type SidebarSectionSettings,
} from '@/lib/sidebar-sections'

export async function getSidebarSectionSettings(): Promise<SidebarSectionSettings> {
  const db = await getDb()
  const settings = await db.collection('landing_settings').findOne(
    {},
    { projection: { sidebarSections: 1 } }
  )

  return normalizeSidebarSections(settings?.sidebarSections)
}

export async function canAccessSidebarSection(sectionKey: SidebarSectionKey): Promise<boolean> {
  const session = await getSession()

  if (!session) return false
  if (session.role === 'admin') return true

  const sections = await getSidebarSectionSettings()
  return isSidebarSectionEnabled(sections, sectionKey)
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
