'use client'

import { BarraDoManual } from './barra-do-manual'
import '@/components/checkout/checkout-vidro.css'
import './manual-vidro.css'

/**
 * A moldura que o AppShell põe em toda página do Manual: a aurora atrás e a
 * barra de portas no topo. Carregada sob demanda (ver app-shell.tsx), para o
 * CSS e a barra só descerem para quem está no Manual.
 */
export default function MolduraDoManual() {
  return (
    <>
      <div className="ck-aurora" aria-hidden>
        <span />
        <span />
        <span />
        <span />
      </div>
      <BarraDoManual />
    </>
  )
}
