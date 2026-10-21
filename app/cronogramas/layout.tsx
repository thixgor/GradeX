import type { Metadata } from 'next'
import { PortaoDeSecao } from '@/components/portao-de-secao'
import { privateNoIndexRobots } from '@/lib/seo'

export const metadata: Metadata = {
  robots: privateNoIndexRobots,
}

// Casco estático: o portão da seção roda no cliente (ver PortaoDeSecao).
export default function CronogramasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PortaoDeSecao secao="cronogramas">{children}</PortaoDeSecao>
}
