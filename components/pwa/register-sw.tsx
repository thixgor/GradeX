'use client'

import { useEffect } from 'react'

// Registra o service worker (public/sw.js) depois que a página carrega, para
// não competir com a hidratação nem atrasar o first paint. Não renderiza nada.
export function RegisterSW() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Falha de registro nunca deve quebrar o app — silenciosa de propósito.
      })
    }

    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register, { once: true })
      return () => window.removeEventListener('load', register)
    }
  }, [])

  return null
}
