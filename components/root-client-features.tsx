'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const VerifyEmailBanner = dynamic(
  () => import('@/components/verify-email-banner').then((mod) => mod.VerifyEmailBanner),
  { loading: () => null, ssr: false }
)

const TrialExpirationChecker = dynamic(
  () => import('@/components/trial-expiration-checker').then((mod) => mod.TrialExpirationChecker),
  { loading: () => null, ssr: false }
)

const StudyMusicPlayer = dynamic(
  () => import('@/components/study-music-player').then((mod) => mod.StudyMusicPlayer),
  { loading: () => null, ssr: false }
)

export function RootClientFeatures() {
  const pathname = usePathname()
  const [optionalReady, setOptionalReady] = useState(false)

  const isAuthPage = pathname?.startsWith('/auth')
  const isLandingPage = pathname === '/'
  const shouldLoadSessionFeatures = !isAuthPage && !isLandingPage

  useEffect(() => {
    if (!shouldLoadSessionFeatures) {
      setOptionalReady(false)
      return
    }

    const timer = window.setTimeout(() => setOptionalReady(true), 1200)
    return () => window.clearTimeout(timer)
  }, [shouldLoadSessionFeatures])

  if (!shouldLoadSessionFeatures) {
    return null
  }

  return (
    <>
      <VerifyEmailBanner />
      <TrialExpirationChecker />
      {optionalReady && <StudyMusicPlayer />}
    </>
  )
}
