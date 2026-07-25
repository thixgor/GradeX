import { redirect } from 'next/navigation'
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google'
import LandingPage from '@/components/landing-page'

export const dynamic = 'force-dynamic'

// Fontes da landing. Declaradas aqui (e não no layout raiz) para que só a rota
// '/' baixe e faça preload desses arquivos — o resto do app segue com
// Newsreader / Source Sans / IBM Plex Mono. next/font auto-hospeda, então não
// há request pro Google nem CSS externo bloqueando a renderização.
const daDisplay = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-da-display',
  display: 'swap',
})
const daBody = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-da-body',
  display: 'swap',
})
const daMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-da-mono',
  display: 'swap',
})

interface LandingSettings {
  landingPageEnabled?: boolean
}

const DEFAULTS: Required<LandingSettings> = {
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

// Cache de módulo para o flag da landing. `landing_settings` muda raríssimas
// vezes (é um toggle do admin), mas antes toda visita à landing pagava um
// findOne no Atlas — com timeout de 2,5s — antes do primeiro byte. Com 60s de
// TTL, o flag continua respeitado quase em tempo real e o TTFB deixa de
// depender do banco. O cache vive por instância de lambda.
let cachedLanding: { value: Required<LandingSettings>; at: number } | null = null
const LANDING_TTL_MS = 60_000

async function loadLandingSettings(): Promise<Required<LandingSettings>> {
  if (cachedLanding && Date.now() - cachedLanding.at < LANDING_TTL_MS) {
    return cachedLanding.value
  }

  try {
    const { getDb } = await import('@/lib/mongodb')
    const db = await withTimeout(getDb(), 2500)
    const settings = await withTimeout(
      db
        .collection<LandingSettings>('landing_settings')
        .findOne({}, { projection: { landingPageEnabled: 1 } }),
      2500
    )

    const value: Required<LandingSettings> = settings
      ? { landingPageEnabled: settings.landingPageEnabled !== false }
      : DEFAULTS

    cachedLanding = { value, at: Date.now() }
    return value
  } catch {
    // Falha de rede/timeout: não cacheia, para tentar de novo na próxima visita.
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
    <div className={`${daDisplay.variable} ${daBody.variable} ${daMono.variable}`}>
      <LandingPage initialIsLoggedIn={isLoggedIn} />
    </div>
  )
}
