'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { CalendarCheck, LayoutDashboard, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITENS = [
  { chave: 'encontrar', rotulo: 'Encontrar', rotuloLongo: 'Encontrar monitoria', href: '/monitorias', icone: Search },
  { chave: 'minhas', rotulo: 'Minhas aulas', rotuloLongo: 'Minhas aulas', href: '/monitorias/minhas', icone: CalendarCheck },
  { chave: 'painel', rotulo: 'Sou monitor', rotuloLongo: 'Painel do monitor', href: '/monitorias/painel', icone: LayoutDashboard },
] as const

function ativoPara(pathname: string): (typeof ITENS)[number]['chave'] {
  if (pathname.startsWith('/monitorias/painel')) return 'painel'
  if (pathname.startsWith('/monitorias/minhas') || pathname.startsWith('/monitorias/reservas')) return 'minhas'
  return 'encontrar'
}

/**
 * Atalhos fixos das Monitorias: a vitrine, as aulas que eu contratei e o meu
 * painel de monitor, a um toque de qualquer tela. Some no checkout (lá o foco
 * é terminar o pagamento).
 */
export function NavMonitorias() {
  const pathname = usePathname() || '/monitorias'
  const reduzir = useReducedMotion()
  if (pathname.startsWith('/monitorias/checkout')) return null
  const ativo = ativoPara(pathname)
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pt-4 sm:px-6 lg:px-8">
      <nav aria-label="Monitorias" className="grid grid-cols-3 gap-1 rounded-2xl border border-border bg-muted/40 p-1 sm:inline-grid sm:w-auto">
        {ITENS.map(({ chave, rotulo, rotuloLongo, href, icone: Icone }) => {
          const atual = ativo === chave
          return (
            <Link
              key={chave}
              href={href}
              aria-current={atual ? 'page' : undefined}
              className={cn(
                'relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-[40px] sm:flex-row sm:gap-1.5 sm:px-4 sm:py-0 sm:text-sm',
                atual ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {atual && (
                <motion.span
                  layoutId="nav-monitorias"
                  className="absolute inset-0 rounded-xl border border-border bg-card shadow-sm"
                  transition={reduzir ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }}
                />
              )}
              <Icone className={cn('relative h-4 w-4 shrink-0', atual && 'text-primary')} />
              <span className="relative max-w-full truncate sm:hidden">{rotulo}</span>
              <span className="relative hidden sm:inline">{rotuloLongo}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
