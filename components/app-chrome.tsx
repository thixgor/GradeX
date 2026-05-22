'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

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

export function AppChrome() {
  const pathname = usePathname()
  const authless = isAuthlessRoute(pathname)

  return (
    <>
      {!authless && <TrialExpirationChecker />}
      {!authless && <StudyMusicPlayer />}
      <PlatformAds />
    </>
  )
}
