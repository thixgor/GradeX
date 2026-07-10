'use client'

import { useContext } from 'react'
import { UIPreferencesContext } from '@/context/UIPreferencesContext'

export function useUIPreferences() {
  const context = useContext(UIPreferencesContext)
  if (!context) {
    throw new Error('useUIPreferences deve ser usado dentro de um UIPreferencesProvider')
  }
  return context
}
