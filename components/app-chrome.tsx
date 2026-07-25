'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useUIPreferences } from '@/hooks/use-ui-preferences'

// Componentes pesados de "chrome" da aplicação. Carregados via next/dynamic
// (ssr:false) para que NÃO entrem no bundle inicial nem bloqueiem a hidratação
// do conteúdo da página — crítico para performance no mobile.
const StudyMusicPlayer = dynamic(
  () => import('@/components/study-music-player').then((m) => m.StudyMusicPlayer),
  { ssr: false },
)
const PlatformAds = dynamic(
  () => import('@/components/platform-ads').then((m) => m.PlatformAds),
  { ssr: false },
)
const TrialExpirationChecker = dynamic(
  () => import('@/components/trial-expiration-checker').then((m) => m.TrialExpirationChecker),
  { ssr: false },
)

// Em rotas sem login (landing e /auth) o player de música e o verificador de
// trial são inúteis (exigem usuário autenticado) e só geram fetch + JS pesado.
// Mantê-los fora dessas rotas elimina os carregamentos travados na landing.
function isAuthlessRoute(pathname: string | null): boolean {
  if (!pathname) return false
  return pathname === '/' || pathname.startsWith('/auth')
}

// Páginas onde o player de música ambiente não deve aparecer (foco total no
// conteúdo, ex.: páginas públicas de rifa).
function hideMusicPlayer(pathname: string | null): boolean {
  if (!pathname) return false
  return pathname.startsWith('/rifas')
}

/**
 * Adia o mount até o browser ficar ocioso (com teto de tempo). Usado para o
 * chrome que não faz parte do conteúdo principal: ele continua aparecendo
 * exatamente como antes, só deixa de competir com a primeira pintura.
 */
function useIdleReady(timeoutMs = 2500): boolean {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ric = (window as any).requestIdleCallback
    if (typeof ric === 'function') {
      const handle = ric(() => setReady(true), { timeout: timeoutMs })
      return () => (window as any).cancelIdleCallback?.(handle)
    }
    const timer = window.setTimeout(() => setReady(true), 800)
    return () => window.clearTimeout(timer)
  }, [timeoutMs])

  return ready
}

export function AppChrome() {
  const pathname = usePathname()
  const { showMusic } = useUIPreferences()
  const authless = isAuthlessRoute(pathname)
  const noMusic = hideMusicPlayer(pathname)
  // Os anúncios fazem fetch em /api/anuncios (Mongo) e mantêm um intervalo de
  // rotação. Nada disso precisa acontecer enquanto a página ainda está
  // pintando — sobretudo na landing, onde o visitante nem está logado.
  const adsReady = useIdleReady()

  return (
    <>
      {!authless && <TrialExpirationChecker />}
      {!authless && !noMusic && showMusic && <StudyMusicPlayer />}
      {adsReady && <PlatformAds />}
    </>
  )
}
