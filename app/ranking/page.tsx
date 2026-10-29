'use client'

import { AppShell } from '@/components/app-shell'
import { Ranking } from '@/components/xp/ranking'
import '@/components/checkout/checkout-vidro.css'

/**
 * Ranking de XP — casco estático. Quem pede os dados é o cliente
 * (`/api/xp/ranking`, `/api/xp/eu`), e quem decide o acesso é a API: a página
 * sai do CDN para todo mundo, sem função a cada visita.
 */
export default function PaginaDoRanking() {
  return (
    <AppShell showHeader={false}>
      <div className="ck-mundo ck-escopo">
        <div className="ck-aurora" aria-hidden>
          <span /><span /><span /><span />
        </div>
        <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-16 sm:pt-8">
          <Ranking />
        </div>
      </div>
    </AppShell>
  )
}
