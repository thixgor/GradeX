'use client'

import { useContext } from 'react'
import { LiteModeContext } from '@/context/LiteModeContext'

export function useLiteMode() {
  const context = useContext(LiteModeContext)
  if (!context) {
    throw new Error('useLiteMode deve ser usado dentro de um LiteModeProvider')
  }
  return context
}
