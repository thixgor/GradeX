'use client'

import { useEffect, useState } from 'react'
import { EVENTO_DO_MUDO, estaMudo } from './voz'

/** O Dom está silenciado? Atualiza junto em todos os lugares onde ele aparece. */
export function useMudo(): boolean {
  const [mudo, setMudo] = useState(false)
  useEffect(() => {
    setMudo(estaMudo())
    const aoMudar = (e: Event) => setMudo(!!(e as CustomEvent<{ mudo: boolean }>).detail?.mudo)
    window.addEventListener(EVENTO_DO_MUDO, aoMudar)
    return () => window.removeEventListener(EVENTO_DO_MUDO, aoMudar)
  }, [])
  return mudo
}
