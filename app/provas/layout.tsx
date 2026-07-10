import type { Metadata } from 'next'
import { requireSidebarSectionAccess } from '@/lib/sidebar-section-access'
import { DEFAULT_OG_IMAGE, absoluteUrl, privateNoIndexRobots } from '@/lib/seo'

const PROVAS_DESCRIPTION =
  'Provas e simulados da DomineAqui — treine com provas antigas da faculdade, provas gerais e simulados pessoais gerados por IA, organizados por curso, período e grupo.'

export const metadata: Metadata = {
  title: 'Provas',
  description: PROVAS_DESCRIPTION,
  alternates: { canonical: '/provas' },
  robots: privateNoIndexRobots,
  openGraph: {
    title: 'Provas | DomineAqui',
    description: PROVAS_DESCRIPTION,
    url: '/provas',
    siteName: 'DomineAqui',
    type: 'website',
    locale: 'pt_BR',
    images: [
      {
        url: absoluteUrl(DEFAULT_OG_IMAGE),
        width: 1200,
        height: 630,
        alt: 'DomineAqui - Provas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Provas | DomineAqui',
    description: PROVAS_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
}

export default async function ProvasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSidebarSectionAccess('provas')

  return children
}
