'use client'

import { useContext } from 'react'
import { LiteModeContext, type LiteModeContextType } from '@/context/LiteModeContext'

// Fallback inerte: se por algum motivo um componente for renderizado fora do
// provider (portal isolado, teste, storybook), ele continua funcionando com o
// Modo Lite desligado em vez de derrubar a árvore inteira.
const FALLBACK: LiteModeContextType = {
  liteMode: false,
  preference: 'auto',
  setPreference: () => {},
  toggleLiteMode: () => {},
  hydrated: false,
  device: null,
  autoEnabled: false,
  shouldSuggest: false,
  dismissSuggestion: () => {},
  autoNoticeSeen: true,
  markAutoNoticeSeen: () => {},
}

export function useLiteMode(): LiteModeContextType {
  return useContext(LiteModeContext) ?? FALLBACK
}
