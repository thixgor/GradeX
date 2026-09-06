'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useUIPreferences } from '@/hooks/use-ui-preferences'
import { useLiteMode } from '@/hooks/use-lite-mode'

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
// Batida de ponto da presença. Não renderiza nada e quase nunca fala com a
// rede (ver o cabeçalho do arquivo) — mas é o que faz o "usuários online" do
// painel contar quem está de fato usando o site, e não quem logou faz pouco.
const PresenceHeartbeat = dynamic(
  () => import('@/components/presence-heartbeat').then((m) => m.PresenceHeartbeat),
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
function useIdleReady(timeoutMs = 2500, minDelayMs = 0): boolean {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let idleHandle: number | undefined
    // `minDelayMs` garante um piso de espera (o requestIdleCallback dispararia
    // cedo demais num aparelho que fica ocioso justamente por ser lento).
    const start = window.setTimeout(() => {
      const ric = (window as any).requestIdleCallback
      if (typeof ric === 'function') {
        idleHandle = ric(() => setReady(true), { timeout: timeoutMs })
        return
      }
      idleHandle = window.setTimeout(() => setReady(true), 800)
    }, minDelayMs)

    return () => {
      window.clearTimeout(start)
      if (idleHandle === undefined) return
      const cancelIdle = (window as any).cancelIdleCallback
      if (typeof cancelIdle === 'function') cancelIdle(idleHandle)
      window.clearTimeout(idleHandle)
    }
  }, [timeoutMs, minDelayMs])

  return ready
}

export function AppChrome() {
  const pathname = usePathname()
  const { showMusic } = useUIPreferences()
  const { liteMode, hydrated: liteHydrated } = useLiteMode()
  const authless = isAuthlessRoute(pathname)
  const noMusic = hideMusicPlayer(pathname)
  // Os anúncios fazem fetch em /api/anuncios (Mongo) e mantêm um intervalo de
  // rotação. Nada disso precisa acontecer enquanto a página ainda está
  // pintando — sobretudo na landing, onde o visitante nem está logado.
  //
  // No Modo Lite a espera é bem maior: num aparelho fraco, o carrossel (fetch +
  // imagens + timer de rotação a cada 8s) compete com o conteúdo que a pessoa
  // veio ler. Ele continua aparecendo — só depois que a tela estiver usável.
  const adsReady = useIdleReady(2500, liteMode && liteHydrated ? 8000 : 0)

  return (
    <>
      {!authless && <TrialExpirationChecker />}
      {!authless && <PresenceHeartbeat />}
      {!authless && !noMusic && showMusic && <StudyMusicPlayer />}
      {adsReady && <PlatformAds />}
    </>
  )
}
