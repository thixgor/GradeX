'use client'

import type { ReactNode } from 'react'
import { AppShell } from '@/components/app-shell'
import { NavMonitorias } from './nav-monitorias'

/** Moldura do app (menu lateral, cabeçalho) para todas as telas de monitorias. */
export function ShellMonitorias({ children }: { children: ReactNode }) {
  return (
    <AppShell allowGuest headerTitle="Monitorias" headerSubtitle="Aulas com monitores da comunidade">
      <NavMonitorias />
      {children}
    </AppShell>
  )
}
