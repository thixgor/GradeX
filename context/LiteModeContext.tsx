'use client'

import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react'

interface LiteModeContextType {
  liteMode: boolean
  toggleLiteMode: () => void
}

export const LiteModeContext = createContext<LiteModeContextType | null>(null)

const STORAGE_KEY = 'lite-mode'

export function LiteModeProvider({ children }: { children: ReactNode }) {
  const [liteMode, setLiteMode] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('lite-mode', liteMode)
  }, [liteMode])

  const toggleLiteMode = useCallback(() => {
    setLiteMode((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {}
      return next
    })
  }, [])

  return (
    <LiteModeContext.Provider value={{ liteMode, toggleLiteMode }}>
      {children}
    </LiteModeContext.Provider>
  )
}
