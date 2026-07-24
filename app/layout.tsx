import type { Metadata, Viewport } from 'next'
import { Newsreader, Source_Sans_3, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import './globals-button-feedback.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Footer } from '@/components/footer'
import { ImageProtectionProvider } from '@/components/image-protection-provider'
import { VerifyEmailBanner } from '@/components/verify-email-banner'
import { AppChrome } from '@/components/app-chrome'
import { RegisterSW } from '@/components/pwa/register-sw'
import { IosInstallPrompt } from '@/components/pwa/ios-install-prompt'
import { MobileFloatingDock } from '@/components/mobile-floating-dock'
import { FloatingDockProvider } from '@/context/FloatingDockContext'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { MetaPixel } from '@/components/meta-pixel'
import { LiteModeProvider } from '@/context/LiteModeContext'
import { UIPreferencesProvider } from '@/context/UIPreferencesContext'
import { MaterialCartProvider } from '@/context/MaterialCartContext'
import { ShopCartProvider } from '@/context/ShopCartContext'
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

// Editorial / textbook serif — medical journal feel (not Space Grotesk / Rowdies AI stack)
const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  style: ['normal', 'italic'],
})
// Clinical readable sans — used in health products, highly legible
const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})
// Mono for labels clínicos (CID, ECG leads, etc.)
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-clinical',
  display: 'swap',
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
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'DomineAqui',
    // Barra de status translúcida: o conteúdo flui por baixo dela (visual
    // imersivo, nativo). O respiro do topo é garantido pelas classes
    // .pwa-safe-* (globals.css) aplicadas às barras do app, então nada fica
    // escondido sob o relógio/bateria.
    statusBarStyle: 'black-translucent',
  },
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
    apple: [{ url: '/favicon.png', sizes: '180x180', type: 'image/png' }],
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // 'cover': o app ocupa a tela inteira, inclusive sob o notch/Dynamic Island e
  // barra de status (visual imersivo). As margens seguras são reintroduzidas
  // pontualmente via env(safe-area-inset-*) nas barras do app (.pwa-safe-*).
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F1EA' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1F1A' },
  ],
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
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${newsreader.variable} ${sourceSans.variable} ${plexMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(typeof Node!=='function'||!Node.prototype)return;var r=Node.prototype.removeChild;Node.prototype.removeChild=function(c){if(c&&c.parentNode!==this){return c}return r.apply(this,arguments)};var i=Node.prototype.insertBefore;Node.prototype.insertBefore=function(n,ref){if(ref&&ref.parentNode!==this){return n}return i.apply(this,arguments)}})();`,
          }}
        />
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
      <body className={`${sourceSans.className} gradient-overlay gradient-overlay-dark flex flex-col min-h-screen`}>
        <LiteModeProvider>
        <UIPreferencesProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          /* Color transitions handled by View Transitions / .theme-animating — not per-node all */
          disableTransitionOnChange
        >
          <MaterialCartProvider>
           <ShopCartProvider>
            <FloatingDockProvider>
             <VerifyEmailBanner />
             <ImageProtectionProvider>
               <div className="flex-1 flex flex-col">
                 {children}
               </div>
               <Footer />
               <AppChrome />
               <MobileFloatingDock />
               <RegisterSW />
               <IosInstallPrompt />
             </ImageProtectionProvider>
            </FloatingDockProvider>
           </ShopCartProvider>
          </MaterialCartProvider>
          <Analytics />
          <SpeedInsights />
          <MetaPixel />
        </ThemeProvider>
        </UIPreferencesProvider>
        </LiteModeProvider>
      </body>
    </html>
  )
}
