import type { Metadata } from 'next'
import { Inter, Rowdies, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { TrialExpirationChecker } from '@/components/trial-expiration-checker'

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
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${rowdies.variable} ${spaceGrotesk.variable}`}>
      <body className={`${spaceGrotesk.className} gradient-overlay gradient-overlay-dark`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TrialExpirationChecker />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
