'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageLoading } from '@/components/page-loading'

const LandingPage = dynamic(() => import('@/components/landing-page'), {
  loading: () => <PageLoading variant="fullscreen" />,
})

interface LandingInitialData {
  isLoggedIn: boolean
  videoEmbedUrl?: string
  videoEnabled?: boolean
}

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [showLanding, setShowLanding] = useState(false)
  const [landingPageEnabled, setLandingPageEnabled] = useState(true)
  const [landingInitial, setLandingInitial] = useState<LandingInitialData>({ isLoggedIn: false })
  const redirectingRef = useRef(false)
  const unmountedRef = useRef(false)

  const forceLanding = searchParams.get('landing') === 'true'

  useEffect(() => {
    unmountedRef.current = false

    // Timeout de segurança — só mostra landing se NÃO estamos redirecionando.
    // 6s é suficiente para cold-start do MongoDB sem frustrar o usuário.
    const safetyTimeout = setTimeout(() => {
      if (redirectingRef.current || unmountedRef.current) return
      setShowLanding(true)
      setLoading(false)
    }, 6000)

    checkAuth()

    return () => {
      unmountedRef.current = true
      clearTimeout(safetyTimeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceLanding])

  async function checkAuth() {
    try {
      // ─── 1. AUTH PRIMEIRO ──────────────────────────────────────
      // Redirect instantâneo para logados — não espera settings.
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' }).catch(() => null)

      if (unmountedRef.current) return

      const isLoggedIn = !!authRes?.ok

      if (isLoggedIn && !forceLanding) {
        redirectingRef.current = true
        router.replace('/dashboard')
        return
      }

      // ─── 2. SETTINGS SÓ SE VAMOS MOSTRAR LANDING ──────────────
      // Passamos os dados como props para a LandingPage evitar que ela
      // faça os mesmos fetches novamente logo após montar.
      const settingsRes = await fetch('/api/admin/settings', { cache: 'no-store' }).catch(() => null)

      if (unmountedRef.current) return

      let videoEmbedUrl: string | undefined
      let videoEnabled: boolean | undefined

      if (settingsRes?.ok) {
        try {
          const data = await settingsRes.json()
          setLandingPageEnabled(data.landingPageEnabled !== false)
          videoEmbedUrl = data.videoEmbedUrl
          videoEnabled = data.videoEnabled
        } catch { /* ignore */ }
      }

      setLandingInitial({ isLoggedIn, videoEmbedUrl, videoEnabled })
      setShowLanding(true)
      setLoading(false)
    } catch {
      if (unmountedRef.current) return
      setLandingInitial({ isLoggedIn: false })
      setShowLanding(true)
      setLoading(false)
    }
  }

  if (loading) {
    return <PageLoading variant="fullscreen" />
  }

  if (showLanding && landingPageEnabled) {
    return (
      <LandingPage
        initialIsLoggedIn={landingInitial.isLoggedIn}
        initialVideoEmbedUrl={landingInitial.videoEmbedUrl}
        initialVideoEnabled={landingInitial.videoEnabled}
      />
    )
  }

  if (showLanding && !landingPageEnabled) {
    router.push('/auth/login')
    return <PageLoading variant="fullscreen" message="Redirecionando..." />
  }

  return <PageLoading variant="fullscreen" />
}

export default function HomePage() {
  return (
    <Suspense fallback={<PageLoading variant="fullscreen" />}>
      <HomeContent />
    </Suspense>
  )
}
