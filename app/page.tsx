'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import LandingPage from '@/components/landing-page'
import { PageLoading } from '@/components/page-loading'

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [showLanding, setShowLanding] = useState(false)
  const [landingPageEnabled, setLandingPageEnabled] = useState(true)

  const forceLanding = searchParams.get('landing') === 'true'

  useEffect(() => {
    // Timeout de segurança - se após 6s ainda não resolveu, mostrar landing
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        setShowLanding(true)
        setLoading(false)
      }
    }, 6000)

    checkAuth()

    return () => clearTimeout(safetyTimeout)
  }, [forceLanding])

  async function checkAuth() {
    try {
      // Fazer as duas requests em paralelo
      const [authRes, settingsRes] = await Promise.all([
        fetch('/api/auth/me').catch(() => null),
        fetch('/api/admin/settings').catch(() => null),
      ])

      // Processar settings
      if (settingsRes?.ok) {
        try {
          const data = await settingsRes.json()
          setLandingPageEnabled(data.landingPageEnabled !== false)
        } catch { /* ignore */ }
      }

      // Processar auth
      if (authRes?.ok && !forceLanding) {
        router.replace('/dashboard')
        return
      }

      // Não autenticado ou forçando landing
      setShowLanding(true)
      setLoading(false)
    } catch (error) {
      // Em caso de erro, mostrar landing
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
