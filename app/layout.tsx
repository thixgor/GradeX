import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { TrialExpirationChecker } from '@/components/trial-expiration-checker'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GradeX - Plataforma de Provas',
  description: 'Plataforma completa para criação e realização de provas de múltipla escolha com suporte a TRI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
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
