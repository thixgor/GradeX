'use client'

import { useEffect, useState } from 'react'
import { EVENTO_DO_MUDO, estaMudo } from './voz'

/** Lido depois da hidratação: quem monta na troca de página já nasce com a fita certa. */
let conhecido: boolean | null = null

/** O Dom está silenciado? Atualiza junto em todos os lugares onde ele aparece. */
export function useMudo(): boolean {
  const [mudo, setMudo] = useState(() => conhecido ?? false)
  useEffect(() => {
    conhecido = estaMudo()
    setMudo(conhecido)
    const aoMudar = (e: Event) => {
      conhecido = !!(e as CustomEvent<{ mudo: boolean }>).detail?.mudo
      setMudo(conhecido)
    }
    window.addEventListener(EVENTO_DO_MUDO, aoMudar)
    return () => window.removeEventListener(EVENTO_DO_MUDO, aoMudar)
  }, [])
  return mudo
}
