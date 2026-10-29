import type { Metadata } from 'next'
import { PublicPageShell } from '@/components/public-page-shell'
import { MundoDoCheckout } from '@/components/checkout/mundo-do-checkout'
import { CentralDeAjuda } from './central-de-ajuda'

/**
 * Central de Ajuda — a porta pública do suporte.
 *
 * Estática (sai do CDN): quem decide se o chamado é de conta ou de visitante é
 * o cliente, pela sessão, e quem decide se ele é aceito é a API.
 */
export const metadata: Metadata = {
  title: 'Central de Ajuda | DomineAqui',
  description: 'Abra um chamado de suporte com a equipe DomineAqui — com ou sem conta.',
  alternates: { canonical: '/suporte' },
}

export default function SuportePage() {
  return (
    <PublicPageShell maxWidth="max-w-3xl" contentClassName="py-6 sm:py-10">
      <MundoDoCheckout>
        <CentralDeAjuda />
      </MundoDoCheckout>
    </PublicPageShell>
  )
}
