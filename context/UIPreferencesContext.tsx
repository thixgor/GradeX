'use client'

import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

/**
 * Preferências de interface controladas pelo usuário.
 *
 * Alguns botões flutuantes (Música e Suporte/Ticket) ficam fixos na
 * tela e, em telas menores ou durante o estudo, podem atrapalhar/poluir a
 * interface. Aqui o usuário decide quais desses botões quer manter visíveis.
 * A preferência é persistida em localStorage e compartilhada por toda a app
 * via contexto, então alternar no Perfil reflete imediatamente nos botões.
 */
export interface UIPreferences {
  showMusic: boolean
  showSupport: boolean
}

interface UIPreferencesContextType extends UIPreferences {
  hydrated: boolean
  toggle: (key: keyof UIPreferences) => void
}

export const UIPreferencesContext = createContext<UIPreferencesContextType | null>(null)

const STORAGE_KEY = 'ui-preferences'

const DEFAULT_PREFERENCES: UIPreferences = {
  showMusic: true,
  showSupport: true,
}

function readStoredPreferences(): UIPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFERENCES
    const parsed = JSON.parse(raw) as Partial<UIPreferences>
    return {
      showMusic: parsed.showMusic ?? DEFAULT_PREFERENCES.showMusic,
      showSupport: parsed.showSupport ?? DEFAULT_PREFERENCES.showSupport,
    }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export function UIPreferencesProvider({ children }: { children: ReactNode }) {
  // Começa com o padrão (tudo visível) no servidor e na primeira renderização
  // do cliente para evitar mismatch de hidratação; carrega o valor real logo
  // após montar.
  const [preferences, setPreferences] = useState<UIPreferences>(DEFAULT_PREFERENCES)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setPreferences(readStoredPreferences())
    setHydrated(true)
  }, [])

  const toggle = useCallback((key: keyof UIPreferences) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const value = useMemo<UIPreferencesContextType>(
    () => ({ ...preferences, hydrated, toggle }),
    [preferences, hydrated, toggle],
  )

  return <UIPreferencesContext.Provider value={value}>{children}</UIPreferencesContext.Provider>
}
