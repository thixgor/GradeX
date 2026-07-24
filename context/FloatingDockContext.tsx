'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/**
 * Coordena os botões flutuantes da aplicação (Música e Suporte).
 *
 * Antes, cada um desses botões vivia solto num canto da tela — em telas de
 * celular isso gerava "poluição visual" (três controles espalhados sobre o
 * conteúdo). Agora, no mobile, eles são consolidados num único FAB expansível
 * (ver `MobileFloatingDock`); no desktop continuam como gatilhos independentes.
 *
 * Cada feature se REGISTRA aqui quando está visível (respeitando as preferências
 * do usuário e a rota atual) e informa como abrir seu painel. O dock só mostra
 * as ações realmente disponíveis. O estado `activePanel` garante que apenas um
 * painel fique aberto por vez, mantendo a tela limpa.
 */

export type DockPanel = 'music' | 'support'

export interface DockActionMeta {
  id: DockPanel
  label: string
  /** Ordem de exibição no dock (menor primeiro). */
  order: number
  /** Estado "ativo" opcional — ex.: música tocando (mostra indicador pulsante). */
  active?: boolean
}

interface FloatingDockContextValue {
  actions: DockActionMeta[]
  register: (meta: DockActionMeta) => void
  unregister: (id: DockPanel) => void
  activePanel: DockPanel | null
  open: (id: DockPanel) => void
  close: () => void
  toggle: (id: DockPanel) => void
}

const FloatingDockContext = createContext<FloatingDockContextValue | null>(null)

export function useFloatingDock() {
  return useContext(FloatingDockContext)
}

export function FloatingDockProvider({ children }: { children: ReactNode }) {
  const [actionsMap, setActionsMap] = useState<Record<string, DockActionMeta>>({})
  const [activePanel, setActivePanel] = useState<DockPanel | null>(null)

  const register = useCallback((meta: DockActionMeta) => {
    setActionsMap((prev) => {
      const existing = prev[meta.id]
      if (
        existing &&
        existing.label === meta.label &&
        existing.order === meta.order &&
        existing.active === meta.active
      ) {
        return prev
      }
      return { ...prev, [meta.id]: meta }
    })
  }, [])

  const unregister = useCallback((id: DockPanel) => {
    setActionsMap((prev) => {
      if (!prev[id]) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
    setActivePanel((prev) => (prev === id ? null : prev))
  }, [])

  const open = useCallback((id: DockPanel) => setActivePanel(id), [])
  const close = useCallback(() => setActivePanel(null), [])
  const toggle = useCallback(
    (id: DockPanel) => setActivePanel((prev) => (prev === id ? null : id)),
    [],
  )

  const actions = useMemo(
    () => Object.values(actionsMap).sort((a, b) => a.order - b.order),
    [actionsMap],
  )

  const value = useMemo<FloatingDockContextValue>(
    () => ({ actions, register, unregister, activePanel, open, close, toggle }),
    [actions, register, unregister, activePanel, open, close, toggle],
  )

  return <FloatingDockContext.Provider value={value}>{children}</FloatingDockContext.Provider>
}
