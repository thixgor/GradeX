'use client'

import { useEffect } from 'react'

// Registra o service worker (public/sw.js) depois que a página carrega, para
// não competir com a hidratação nem atrasar o first paint. Não renderiza nada.
export function RegisterSW() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    // Em desenvolvimento os chunks de `/_next/static/` não têm hash no nome, e
    // o cache-first do worker passa a servir JavaScript velho depois de cada
    // edição. Fora de produção, garante que nenhum worker fique registrado.
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister())).catch(() => {})
      return
    }

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
