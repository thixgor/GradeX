import type { Metadata } from 'next'
import { PublicPageShell } from '@/components/public-page-shell'
import { MundoDoCheckout } from '@/components/checkout/mundo-do-checkout'
import { ChamadoDoVisitante } from './chamado-do-visitante'

/**
 * A conversa de um chamado aberto sem conta, pelo link com chave do e-mail.
 *
 * Casco estático: a página nasce na primeira visita e o conteúdo vem da API
 * no cliente, só com a chave certa. `no-referrer` para a chave da URL não
 * vazar para nenhum link que a pessoa clique daqui.
 */
export const metadata: Metadata = {
  title: 'Seu chamado | DomineAqui',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export function generateStaticParams() {
  return []
}

export default async function ChamadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <PublicPageShell maxWidth="max-w-3xl" contentClassName="py-4 sm:py-8">
      <MundoDoCheckout>
        <ChamadoDoVisitante id={id} />
      </MundoDoCheckout>
    </PublicPageShell>
  )
}
