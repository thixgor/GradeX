import { redirect } from 'next/navigation'
import LandingPage from '@/components/landing-page'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'

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

async function loadLandingSettings(): Promise<Required<LandingSettings>> {
  try {
    const db = await getDb()
    const settings = await db
      .collection<LandingSettings>('landing_settings')
      .findOne({}, { projection: { videoEmbedUrl: 1, videoEnabled: 1, landingPageEnabled: 1 } })

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

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { landing?: string }
}) {
  const forceLanding = searchParams?.landing === 'true'

  const [session, settings] = await Promise.all([
    getSession().catch(() => null),
    loadLandingSettings(),
  ])

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
