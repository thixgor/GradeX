'use client'

import { useEffect, useRef, useState } from 'react'

interface UseVisibilityDetectionOptions {
  onTabSwitch?: (data: { hidden: boolean; timestamp: string; duration?: number }) => void
  enabled?: boolean
}

export function useVisibilityDetection({
  onTabSwitch,
  enabled = true,
}: UseVisibilityDetectionOptions = {}) {
  const [isVisible, setIsVisible] = useState(true)
  const [switchCount, setSwitchCount] = useState(0)
  const lastHiddenTimeRef = useRef<Date | null>(null)

  useEffect(() => {
    if (!enabled) return

    const handleVisibilityChange = () => {
      const isCurrentlyVisible = !document.hidden
      setIsVisible(isCurrentlyVisible)

      const timestamp = new Date().toISOString()

      if (!isCurrentlyVisible) {
        // Aba/janela foi escondida (usuário trocou)
        lastHiddenTimeRef.current = new Date()
        setSwitchCount(prev => prev + 1)

        console.log('[VISIBILITY] ⚠️ Usuário trocou de aba/janela')

        onTabSwitch?.({
          hidden: true,
          timestamp,
        })
      } else {
        // Aba/janela voltou a ser visível
        const hiddenTime = lastHiddenTimeRef.current
        let duration: number | undefined

        if (hiddenTime) {
          duration = new Date().getTime() - hiddenTime.getTime()
          console.log(`[VISIBILITY] ✅ Usuário voltou (ficou ${duration}ms fora)`)
        }

        onTabSwitch?.({
          hidden: false,
          timestamp,
          duration,
        })

        lastHiddenTimeRef.current = null
      }
    }

    // Adicionar listener
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, onTabSwitch])

  return {
    isVisible,
    switchCount,
  }
}
