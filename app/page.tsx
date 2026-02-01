'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import LandingPage from '@/components/landing-page'

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [showLanding, setShowLanding] = useState(false)
  const [landingPageEnabled, setLandingPageEnabled] = useState(true)

  // Se ?landing=true, não redireciona para dashboard
  const forceLanding = searchParams.get('landing') === 'true'

  useEffect(() => {
    checkAuth()
  }, [forceLanding])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok && !forceLanding) {
        // User is logged in e não está forçando landing, redirect to dashboard
        router.replace('/dashboard')
        return
      }
      // User is not logged in ou está forçando landing, check landing page settings
      await checkLandingPageSettings()
    } catch (error) {
      await checkLandingPageSettings()
    }
  }

  async function checkLandingPageSettings() {
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        setLandingPageEnabled(data.landingPageEnabled !== false)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    } finally {
      setShowLanding(true)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (showLanding && landingPageEnabled) {
    return <LandingPage />
  }

  if (showLanding && !landingPageEnabled) {
    router.push('/auth/login')
    return null
  }

  return null
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
