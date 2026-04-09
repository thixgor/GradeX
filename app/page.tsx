'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import LandingPage from '@/components/landing-page'
import { PageLoading } from '@/components/page-loading'

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [showLanding, setShowLanding] = useState(false)
  const [landingPageEnabled, setLandingPageEnabled] = useState(true)
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

      if (authRes?.ok && !forceLanding) {
        redirectingRef.current = true
        router.replace('/dashboard')
        return
      }

      // ─── 2. SETTINGS SÓ SE VAMOS MOSTRAR LANDING ──────────────
      const settingsRes = await fetch('/api/admin/settings', { cache: 'no-store' }).catch(() => null)

      if (unmountedRef.current) return

      if (settingsRes?.ok) {
        try {
          const data = await settingsRes.json()
          setLandingPageEnabled(data.landingPageEnabled !== false)
        } catch { /* ignore */ }
      }

      setShowLanding(true)
      setLoading(false)
    } catch {
      if (unmountedRef.current) return
      setShowLanding(true)
      setLoading(false)
    }
  }

  if (loading) {
    return <PageLoading variant="fullscreen" />
  }

  if (showLanding && landingPageEnabled) {
    return <LandingPage />
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
