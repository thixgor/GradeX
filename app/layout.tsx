import type { Metadata } from 'next'
import { Rowdies, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Footer } from '@/components/footer'
import { ImageProtectionProvider } from '@/components/image-protection-provider'
import { RootClientFeatures } from '@/components/root-client-features'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { LiteModeProvider } from '@/context/LiteModeContext'
import {
  CANONICAL_ORIGIN,
  DEFAULT_OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  absoluteUrl,
  buildJsonLd,
  getSiteUrl,
  publicIndexingRobots,
} from '@/lib/seo'

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
    default: 'DomineAqui — Plataforma de Estudo Inteligente para Medicina',
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME, url: CANONICAL_ORIGIN }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'education',
  alternates: {
    canonical: '/',
    languages: { 'pt-BR': '/' },
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
    title: 'DomineAqui — Plataforma de Estudo Inteligente para Medicina',
    description: 'Provas, flashcards, cronogramas, materiais e estudo guiado por dados e IA. Estude para residência com inteligência.',
    url: '/',
    siteName: SITE_NAME,
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'DomineAqui — Plataforma de Estudo Inteligente para Medicina',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DomineAqui — Plataforma de Estudo Inteligente para Medicina',
    description: 'Provas, flashcards, cronogramas, materiais e estudo guiado por IA.',
    images: [DEFAULT_OG_IMAGE],
    creator: '@domineaqui',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  other: {
    'google-site-verification': process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const siteUrl = getSiteUrl()

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: SITE_NAME,
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/logo.png'),
      width: 512,
      height: 512,
    },
    image: DEFAULT_OG_IMAGE,
    description: SITE_DESCRIPTION,
    sameAs: ['https://instagram.com/domineaqui.br'],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'contato@domineaqui.com.br',
      contactType: 'customer service',
      availableLanguage: 'Portuguese',
    },
  }

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: 'Domine Aqui',
    url: siteUrl,
    inLanguage: 'pt-BR',
    description: SITE_DESCRIPTION,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/logo.png'),
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/lead/{search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
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
          <RootClientFeatures />
          <ImageProtectionProvider>
            <div className="flex-1 flex flex-col">
              {children}
            </div>
            <Footer />
          </ImageProtectionProvider>
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
        </LiteModeProvider>
      </body>
    </html>
  )
}
