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
  title: 'DomineAqui - Seja o Foco. Seja a Referência.',
  description: 'Domine Aqui. Seja o Foco. Seja a Referência. Provas, Flashcards, Cronogramas, Materiais. Plataforma completa para estudo inteligente com suporte a TRI e avaliação inteligente.',
  keywords: 'provas, flashcards, cronogramas, materiais, estudo, educação, TRI, avaliação',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.jpg', type: 'image/jpeg' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.jpg',
  },
  openGraph: {
    title: 'DomineAqui - Seja o Foco. Seja a Referência.',
    description: 'Domine Aqui. Provas, Flashcards, Cronogramas, Materiais.',
    type: 'website',
    images: [
      {
        url: 'https://i.imgur.com/zHm5aSx.jpeg',
        width: 1200,
        height: 630,
        alt: 'DomineAqui - Plataforma de Estudo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DomineAqui - Seja o Foco. Seja a Referência.',
    description: 'Domine Aqui. Provas, Flashcards, Cronogramas, Materiais.',
    images: ['https://i.imgur.com/zHm5aSx.jpeg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${rowdies.variable} ${spaceGrotesk.variable}`}>
      <body className={`${spaceGrotesk.className} gradient-overlay gradient-overlay-dark flex flex-col min-h-screen`}>
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
      </body>
    </html>
  )
}
