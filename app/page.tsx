import { redirect } from 'next/navigation'
import LandingPage from '@/components/landing-page'

export const dynamic = 'force-dynamic'

interface LandingSettings {
  videoEmbedUrl?: string
  videoEnabled?: boolean
  landingPageEnabled?: boolean
}

const DEFAULTS: Required<LandingSettings> = {
  videoEmbedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  videoEnabled: true,
  landingPageEnabled: true,
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      (e) => {
        clearTimeout(timer)
        reject(e)
      }
    )
  })
}

async function loadLandingSettings(): Promise<Required<LandingSettings>> {
  try {
    const { getDb } = await import('@/lib/mongodb')
    const db = await withTimeout(getDb(), 2500)
    const settings = await withTimeout(
      db
        .collection<LandingSettings>('landing_settings')
        .findOne({}, { projection: { videoEmbedUrl: 1, videoEnabled: 1, landingPageEnabled: 1 } }),
      2500
    )

    if (!settings) return DEFAULTS

    return {
      videoEmbedUrl: settings.videoEmbedUrl || DEFAULTS.videoEmbedUrl,
      videoEnabled: settings.videoEnabled !== false,
      landingPageEnabled: settings.landingPageEnabled !== false,
    }
  } catch {
    return DEFAULTS
  }
}

async function loadSession() {
  try {
    const { getSession } = await import('@/lib/auth')
    return await withTimeout(getSession(), 2500)
  } catch {
    return null
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { landing?: string }
}) {
  const forceLanding = searchParams?.landing === 'true'

  const [session, settings] = await Promise.all([loadSession(), loadLandingSettings()])

  const isLoggedIn = !!session

  if (isLoggedIn && !forceLanding) {
    redirect('/dashboard')
  }

  if (!settings.landingPageEnabled && !forceLanding) {
    redirect('/auth/login')
  }

  return (
    <LandingPage
      initialIsLoggedIn={isLoggedIn}
      initialVideoEmbedUrl={settings.videoEmbedUrl}
      initialVideoEnabled={settings.videoEnabled}
    />
  )
}
