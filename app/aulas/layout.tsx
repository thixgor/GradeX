import type { Metadata } from 'next'
import { QuadroDeEnsino } from '@/components/ensino/quadro'
import { PortaoDeSecao } from '@/components/portao-de-secao'
import { DEFAULT_OG_IMAGE, absoluteUrl, privateNoIndexRobots } from '@/lib/seo'

const AULAS_DESCRIPTION =
  'Aulas ao vivo e gravadas da DomineAqui — assista conteúdos premium e gratuitos, organizados por módulos, tópicos e setores.'

export const metadata: Metadata = {
  title: 'Aulas',
  description: AULAS_DESCRIPTION,
  alternates: { canonical: '/aulas' },
  robots: privateNoIndexRobots,
  openGraph: {
    title: 'Aulas | DomineAqui',
    description: AULAS_DESCRIPTION,
    url: '/aulas',
    siteName: 'DomineAqui',
    type: 'website',
    locale: 'pt_BR',
    images: [
      {
        url: absoluteUrl(DEFAULT_OG_IMAGE),
        width: 1200,
        height: 630,
        alt: 'DomineAqui - Aulas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aulas | DomineAqui',
    description: AULAS_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
}

/**
 * O layout de `/aulas`.
 *
 * Ele existia só para checar acesso e devolver `children`. Agora também é o
 * lugar onde a navegação da área é montada — UMA vez, para todas as rotas
 * abaixo dele. Ver `components/ensino/quadro.tsx`: é a diferença entre uma
 * barra que pisca a cada toque e um fluxo contínuo.
 *
 * Casco estático: o portão da seção roda no cliente (ver PortaoDeSecao). A
 * verificação de certificado fica fora dele — é pública (ver middleware.ts), e
 * o portão antigo, no servidor, mandava o visitante sem conta para o login.
 */
export default function AulasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PortaoDeSecao secao="aulas" livres={['/aulas/certificado/']}>
      <QuadroDeEnsino>{children}</QuadroDeEnsino>
    </PortaoDeSecao>
  )
}
