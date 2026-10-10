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
 * "Quanto eu ganharia?": o empurrão que transforma quem domina uma matéria em
 * monitor. Conta pura (`ganhoMensalEstimado`), nenhuma requisição.
 */
export function SimuladorGanhos({ className, compacto = false, semBotao = false }: { className?: string; compacto?: boolean; semBotao?: boolean }) {
  const reduzir = useReducedMotion()
  const [preco, setPreco] = useState(60)
  const [horas, setHoras] = useState(4)
  const { liquidoCentavos } = ganhoMensalEstimado(preco * 100, horas)
  return (
    <section className={cn('rounded-2xl border border-border bg-card p-6 shadow-[0_18px_44px_-24px_hsl(var(--primary)/0.4)] sm:p-7', className)} aria-label="Simulador de ganhos">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Calculator className="h-4 w-4" strokeWidth={1.75} /> Quanto você ganharia por mês
      </div>
      <motion.p
        key={liquidoCentavos}
        initial={reduzir ? false : { opacity: 0.4, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mt-2 font-heading text-5xl font-semibold tabular-nums tracking-tight text-foreground"
      >
        {formatarCentavos(liquidoCentavos)}
      </motion.p>
      <p className="mt-1 text-xs text-muted-foreground">Estimativa com 4 semanas no mês, já sem os 10% da plataforma.</p>
      <div className={cn('mt-6 grid gap-5', !compacto && 'sm:grid-cols-2')}>
        <Controle rotulo="Preço por hora" valor={`R$ ${preco}`} min={20} max={200} step={5} atual={preco} mudar={setPreco} />
        <Controle rotulo="Horas por semana" valor={`${horas} h`} min={1} max={20} step={1} atual={horas} mudar={setHoras} />
      </div>
      {!semBotao && (
        <Link href="/monitorias/painel">
          <Button className="mt-6 h-11 w-full rounded-xl">
            Começar a ensinar <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </Link>
      )}
    </section>
  )
}

function Controle({ rotulo, valor, min, max, step, atual, mudar }: { rotulo: string; valor: string; min: number; max: number; step: number; atual: number; mudar: (n: number) => void }) {
  const pct = ((atual - min) / (max - min)) * 100
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{rotulo}</span>
        <span className="font-heading font-semibold tabular-nums text-primary">{valor}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={atual}
        onChange={(e) => mudar(Number(e.target.value))}
        aria-label={rotulo}
        className="mon-range mt-2.5 w-full"
        style={{ ['--pct' as string]: `${pct}%` }}
      />
    </label>
  )
}
