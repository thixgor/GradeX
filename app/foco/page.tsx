'use client'

import { AppShell } from '@/components/app-shell'
import { ModoFoco } from '@/components/foco/modo-foco'
import '@/components/checkout/checkout-vidro.css'

/**
 * Modo Foco — casco estático, tudo no cliente (a sessão vive no aparelho e
 * sobe para o desempenho pela sincronização de sempre).
 */
export default function PaginaDoFoco() {
  return (
    <AppShell showHeader={false}>
      <div className="ck-mundo ck-escopo">
        <div className="ck-aurora" aria-hidden>
          <span /><span /><span /><span />
        </div>
        <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-16 sm:pt-8">
          <h1 className="mb-4 font-heading text-3xl font-semibold tracking-tight">Modo Foco</h1>
          <ModoFoco />
        </div>
      </div>
    </AppShell>
  )
}
