'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatarCentavos } from '@/lib/monitorias/dinheiro'
import { ganhoMensalEstimado } from '@/lib/monitorias/precos'
import { cn } from '@/lib/utils'

/**
 * "Quanto eu ganharia?" — o empurrão que transforma quem domina uma matéria em
 * monitor. Conta pura (`ganhoMensalEstimado`), nenhuma requisição.
 */
export function SimuladorGanhos({ className, compacto = false }: { className?: string; compacto?: boolean }) {
  const reduzir = useReducedMotion()
  const [preco, setPreco] = useState(60)
  const [horas, setHoras] = useState(4)
  const { liquidoCentavos } = ganhoMensalEstimado(preco * 100, horas)
  return (
    <section className={cn('overflow-hidden rounded-3xl border border-amber-400/40 bg-gradient-to-br from-amber-50 via-card to-emerald-50 p-5 dark:from-amber-500/10 dark:via-card dark:to-emerald-500/10 sm:p-7', className)}>
      <div className={cn('grid gap-6', !compacto && 'md:grid-cols-[1fr_300px] md:items-center')}>
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            <Calculator className="h-4 w-4" /> Simulador de ganhos
          </p>
          <h2 className="mt-1 font-heading text-xl font-bold sm:text-2xl">Você domina uma matéria? Isso vale dinheiro.</h2>
          <p className="mt-1 text-sm text-muted-foreground">Arraste e veja quanto pode entrar por mês ensinando no seu tempo livre.</p>
          <div className="mt-5 space-y-4">
            <label className="block text-sm">
              <span className="flex justify-between font-medium"><span>Preço por hora</span><span className="tabular-nums text-primary">R$ {preco}</span></span>
              <input type="range" min={20} max={200} step={5} value={preco} onChange={(e) => setPreco(Number(e.target.value))} className="mt-1.5 w-full accent-emerald-600" aria-label="Preço por hora" />
            </label>
            <label className="block text-sm">
              <span className="flex justify-between font-medium"><span>Horas por semana</span><span className="tabular-nums text-primary">{horas} h</span></span>
              <input type="range" min={1} max={20} step={1} value={horas} onChange={(e) => setHoras(Number(e.target.value))} className="mt-1.5 w-full accent-emerald-600" aria-label="Horas por semana" />
            </label>
          </div>
        </div>
        <div className="rounded-2xl bg-emerald-700 p-5 text-center text-white shadow-lg">
          <p className="text-xs uppercase tracking-wide text-white/75">Você recebe por mês</p>
          <motion.p key={liquidoCentavos} initial={reduzir ? false : { scale: 0.92, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} className="mt-1 font-heading text-4xl font-bold tabular-nums">
            {formatarCentavos(liquidoCentavos)}
          </motion.p>
          <p className="mt-1 text-[11px] text-white/70">estimativa, já descontados os 10% da plataforma</p>
          <Link href="/monitorias/painel">
            <Button className="mt-4 w-full bg-amber-400 font-semibold text-amber-950 hover:bg-amber-300">
              Começar a ensinar <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
          <p className="mt-2 text-[11px] text-white/70">Grátis para anunciar · você define preço e horários</p>
        </div>
      </div>
    </section>
  )
}
