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

  const forceLanding = searchParams.get('landing') === 'true'

  useEffect(() => {
    // Timeout de segurança - se após 3s ainda não resolveu, mostrar landing.
    // Não dispara se já iniciamos um redirect para o dashboard.
    const safetyTimeout = setTimeout(() => {
      if (loading && !redirectingRef.current) {
        setShowLanding(true)
        setLoading(false)
      }
    }, 3000)

    checkAuth()

    return () => clearTimeout(safetyTimeout)
  }, [forceLanding])

  async function checkAuth() {
    try {
      const [authRes, settingsRes] = await Promise.all([
        fetch('/api/auth/me').catch(() => null),
        fetch('/api/admin/settings').catch(() => null),
      ])

      if (settingsRes?.ok) {
        try {
          const data = await settingsRes.json()
          setLandingPageEnabled(data.landingPageEnabled !== false)
        } catch { /* ignore */ }
      }

      if (authRes?.ok && !forceLanding) {
        // Sinaliza que estamos redirecionando — impede o safetyTimeout de mostrar a landing
        redirectingRef.current = true
        router.replace('/dashboard')
        return
      }

      setShowLanding(true)
      setLoading(false)
    } catch {
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
