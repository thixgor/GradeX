import type { Metadata } from 'next'
import { Inter, Rowdies, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { TrialExpirationChecker } from '@/components/trial-expiration-checker'
import { Footer } from '@/components/footer'
import { ImageProtectionProvider } from '@/components/image-protection-provider'
import { VerifyEmailBanner } from '@/components/verify-email-banner'
import { StudyMusicPlayer } from '@/components/study-music-player'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { LiteModeProvider } from '@/context/LiteModeContext'
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  absoluteUrl,
  buildJsonLd,
  getSiteUrl,
  publicIndexingRobots,
} from '@/lib/seo'

const inter = Inter({ subsets: ['latin'] })
const rowdies = Rowdies({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-rowdies'
})
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk'
})

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: SITE_NAME,
  title: {
    default: 'DomineAqui - Seja o Foco. Seja a Referência.',
    template: `%s | ${SITE_NAME}`,
  },
  description: 'Plataforma de estudo inteligente com provas, flashcards, cronogramas, materiais, TRI e avaliação com IA para estudantes que querem aprender com mais foco.',
  keywords: ['estudo inteligente', 'plataforma de estudos', 'provas online', 'flashcards', 'cronogramas', 'TRI', 'avaliação com IA', 'materiais de estudo'],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'education',
  alternates: {
    canonical: '/',
  },
  robots: publicIndexingRobots,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'DomineAqui - Seja o Foco. Seja a Referência.',
    description: 'Provas, flashcards, cronogramas, materiais e estudo guiado por dados em uma plataforma completa.',
    url: '/',
    siteName: SITE_NAME,
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'DomineAqui - Plataforma de Estudo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DomineAqui - Seja o Foco. Seja a Referência.',
    description: 'Provas, flashcards, cronogramas, materiais e estudo guiado por dados.',
    images: [DEFAULT_OG_IMAGE],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: getSiteUrl(),
    logo: absoluteUrl('/logo.png'),
    sameAs: ['https://instagram.com/domineaqui.br'],
  }

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: getSiteUrl(),
    inLanguage: 'pt-BR',
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/logo.png'),
      },
    },
  }

  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${rowdies.variable} ${spaceGrotesk.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('lite-mode')==='true'){document.documentElement.classList.add('lite-mode')}}catch(e){}`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: buildJsonLd(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: buildJsonLd(websiteJsonLd) }}
        />
      </head>
      <body className={`${spaceGrotesk.className} gradient-overlay gradient-overlay-dark flex flex-col min-h-screen`}>
        <LiteModeProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <VerifyEmailBanner />
          <ImageProtectionProvider>
            <TrialExpirationChecker />
            <div className="flex-1 flex flex-col">
              {children}
            </div>
            <Footer />
            <StudyMusicPlayer />
          </ImageProtectionProvider>
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
        </LiteModeProvider>
      </body>
    </html>
  )
}
