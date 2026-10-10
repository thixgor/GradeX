import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGE, publicIndexingRobots } from '@/lib/seo'
import { ShellMonitorias } from '@/components/monitorias/shell'
import { escopoMonitorias } from '@/components/monitorias/fonte'

export const metadata: Metadata = {
  title: 'Monitorias | DomineAqui',
  description:
    'Aulas particulares e em grupo com monitores da comunidade. Agende na agenda do monitor ou combine pelo chat, pague por PIX com garantia, contrato e comprovante.',
  alternates: { canonical: '/monitorias' },
  robots: publicIndexingRobots,
  openGraph: {
    title: 'Monitorias | DomineAqui',
    description: 'Encontre um monitor, agende e pague por PIX com garantia.',
    url: '/monitorias',
    siteName: 'DomineAqui',
    locale: 'pt_BR',
    type: 'website',
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'Monitorias DomineAqui' }],
  },
}

export default function MonitoriasLayout({ children }: { children: React.ReactNode }) {
  return (
    <ShellMonitorias>
      <div className={escopoMonitorias}>{children}</div>
    </ShellMonitorias>
  )
}
