'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { ehRotaDaSala } from '@/lib/monitorias/sala/regras'
import { NavMonitorias } from './nav-monitorias'

/**
 * Moldura do app (menu lateral, cabeçalho) para todas as telas de monitorias.
 * A sala de aula fica de fora: tela cheia, sem o sino consultando o servidor
 * por trás da chamada.
 */
export function ShellMonitorias({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  // O convite da sala de teste também é tela própria (marca e um botão só).
  if (ehRotaDaSala(pathname) || pathname?.startsWith('/monitorias/teste/')) return <>{children}</>
  return (
    <AppShell allowGuest headerTitle="Monitorias" headerSubtitle="Aulas com monitores da comunidade">
      <NavMonitorias />
      {children}
    </AppShell>
  )
}
