'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, BookOpen, FlaskConical, Microscope, PersonStanding, Pill, Route, ScanLine, Sigma, Stethoscope } from 'lucide-react'
import { estiloDoChip } from '@/components/sidebar-cores'
import { PORTAS_DO_MANUAL, portaDaRota, type PortaDoManual } from './modulos'
import '@/components/checkout/checkout-vidro.css'
import './manual-vidro.css'

const ICONES: Record<PortaDoManual['icone'], React.ComponentType<{ className?: string }>> = {
  BookOpen, FlaskConical, Pill, Activity, ScanLine, Stethoscope, Microscope, PersonStanding, Sigma, Route,
}

export function IconeDaPorta({ porta, className = 'h-[15px] w-[15px]' }: { porta: PortaDoManual; className?: string }) {
  const Icone = ICONES[porta.icone]
  return <Icone className={className} aria-hidden />
}

/**
 * A barra do Manual Clínico — a mesma em todas as páginas dele.
 *
 * Antes, cada módulo era uma ilha: quem entrava na Radiologia por um link não
 * via que existia Semiologia, nem como voltar ao Manual. Agora toda página
 * carrega as dez portas lado a lado, com a atual acesa, e a marca "Manual
 * Clínico" leva de volta ao portal. É a "trilha de cheiro" (information scent)
 * que faltava: a pessoa sempre sabe onde está e para onde dá para ir.
 *
 * No celular a fileira rola na horizontal e a porta atual nasce centrada.
 */
export function BarraDoManual() {
  const pathname = usePathname()
  const atual = portaDaRota(pathname)
  const trilho = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ativa = trilho.current?.querySelector<HTMLElement>('[aria-current="page"], [data-atual]')
    ativa?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [pathname])

  return (
    <nav className="ck-escopo mc-barra" aria-label="Manual Clínico">
      <div className="mc-barra-placa">
        <Link href="/manual-clinico" className="mc-marca" aria-label="Manual Clínico — início">
          <span className="sidebar-mini-chip" style={estiloDoChip('manualClinico')} aria-hidden>
            <BookOpen className="h-[15px] w-[15px]" />
          </span>
          <span className="mc-marca-nome">Manual Clínico</span>
        </Link>
        <span className="mc-divisor" aria-hidden />
        <div ref={trilho} className="mc-trilho">
          {PORTAS_DO_MANUAL.map((porta) => {
            const ativa = atual?.id === porta.id
            const exata = pathname === porta.href
            return (
              <Link
                key={porta.id}
                href={porta.href}
                className="mc-aba"
                aria-current={ativa && exata ? 'page' : undefined}
                data-atual={ativa || undefined}
              >
                <span className="sidebar-mini-chip mc-aba-chip" style={estiloDoChip(porta.cor)} aria-hidden>
                  <IconeDaPorta porta={porta} className="h-[13px] w-[13px]" />
                </span>
                {porta.curto}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
