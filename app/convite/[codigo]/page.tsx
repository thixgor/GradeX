import type { Metadata } from 'next'
import { CascoDaVitrine } from '@/components/vitrine/casco'
import { ConviteDoEmbaixador } from '@/components/embaixadores/convite'
import { DEFAULT_OG_IMAGE, absoluteUrl } from '@/lib/seo'
import { normalizarCodigo } from '@/lib/embaixadores/regras'

const DESCRICAO =
  'Um colega te convidou para o DomineAqui: Manual Clínico, banco com mais de 15 mil questões, flashcards e as provas da sua faculdade num lugar só — com cupom de desconto.'

export const metadata: Metadata = {
  title: 'Convite',
  description: DESCRICAO,
  robots: { index: false, follow: true },
  openGraph: {
    title: 'Você foi convidado para o DomineAqui',
    description: DESCRICAO,
    siteName: 'DomineAqui',
    type: 'website',
    locale: 'pt_BR',
    images: [{ url: absoluteUrl(DEFAULT_OG_IMAGE), width: 1200, height: 630, alt: 'DomineAqui' }],
  },
}

/**
 * O convite de um embaixador — para onde `/e/CODIGO` leva quem clicou no
 * link. O cookie da indicação já foi gravado no redirecionamento; aqui é só a
 * conversa: quem convidou, o cupom e as portas de entrada.
 */
export default async function ConvitePage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params
  return (
    <CascoDaVitrine destino="/buy">
      <ConviteDoEmbaixador codigo={normalizarCodigo(codigo)} />
    </CascoDaVitrine>
  )
}
