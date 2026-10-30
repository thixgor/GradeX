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
 *
 * O Dom (assistente de IA) entra aqui também: `domOcultoEm` lista as seções
 * onde a pessoa o escondeu (`components/dom/secoes.ts`).
 */
export interface UIPreferences {
  showMusic: boolean
  showSupport: boolean
  domOcultoEm: string[]
}

type ChaveLigaDesliga = 'showMusic' | 'showSupport'

interface UIPreferencesContextType extends UIPreferences {
  hydrated: boolean
  toggle: (key: ChaveLigaDesliga) => void
  /** Esconde (true) ou mostra o Dom numa seção. */
  setDomOculto: (secao: string, oculto: boolean) => void
}

export const UIPreferencesContext = createContext<UIPreferencesContextType | null>(null)

const STORAGE_KEY = 'ui-preferences'

const DEFAULT_PREFERENCES: UIPreferences = {
  showMusic: true,
  showSupport: true,
  domOcultoEm: [],
}

/**
 * O último valor lido, para quem monta depois da hidratação (troca de página)
 * já nascer com a preferência certa — sem um quadro com o padrão (o Dom
 * escondido "piscando" na tela a cada navegação).
 */
let lidoNestaVisita: UIPreferences | null = null

function readStoredPreferences(): UIPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFERENCES
    const parsed = JSON.parse(raw) as Partial<UIPreferences>
    return {
      showMusic: parsed.showMusic ?? DEFAULT_PREFERENCES.showMusic,
      showSupport: parsed.showSupport ?? DEFAULT_PREFERENCES.showSupport,
      domOcultoEm: Array.isArray(parsed.domOcultoEm) ? parsed.domOcultoEm.filter((s) => typeof s === 'string').slice(0, 10) : [],
    }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export function UIPreferencesProvider({ children }: { children: ReactNode }) {
  // Começa com o padrão (tudo visível) no servidor e na primeira renderização
  // do cliente para evitar mismatch de hidratação; carrega o valor real logo
  // após montar.
  const [preferences, setPreferences] = useState<UIPreferences>(() => lidoNestaVisita ?? DEFAULT_PREFERENCES)
  const [hydrated, setHydrated] = useState(() => lidoNestaVisita !== null)

  useEffect(() => {
    const lido = readStoredPreferences()
    lidoNestaVisita = lido
    setPreferences(lido)
    setHydrated(true)
  }, [])

  const salvar = useCallback((mudar: (prev: UIPreferences) => UIPreferences) => {
    setPreferences((prev) => {
      const next = mudar(prev)
      lidoNestaVisita = next
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const toggle = useCallback((key: ChaveLigaDesliga) => salvar((prev) => ({ ...prev, [key]: !prev[key] })), [salvar])

  const setDomOculto = useCallback(
    (secao: string, oculto: boolean) =>
      salvar((prev) => {
        const sem = prev.domOcultoEm.filter((s) => s !== secao)
        return { ...prev, domOcultoEm: oculto ? [...sem, secao] : sem }
      }),
    [salvar],
  )

  const value = useMemo<UIPreferencesContextType>(
    () => ({ ...preferences, hydrated, toggle, setDomOculto }),
    [preferences, hydrated, toggle, setDomOculto],
  )

  return <UIPreferencesContext.Provider value={value}>{children}</UIPreferencesContext.Provider>
}
