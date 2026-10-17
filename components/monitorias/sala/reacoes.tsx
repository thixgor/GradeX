'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { SmilePlus } from 'lucide-react'
import { REACOES, type Reacao } from '@/lib/monitorias/sala/tela-anotada'
import { cn } from '@/lib/utils'

/** A fileira de emojis (na barra de controles, na folha "Mais" e na barra flutuante). */
export function FileiraDeReacoes({ aoReagir, className, compacta = false }: { aoReagir: (e: Reacao) => void; className?: string; compacta?: boolean }) {
  return (
    <div className={cn('flex items-center gap-0.5', className)} role="group" aria-label="Reações">
      {REACOES.map((e) => (
        <motion.button
          key={e}
          type="button"
          whileHover={{ scale: 1.25, y: -3 }}
          whileTap={{ scale: 0.85 }}
          onClick={() => aoReagir(e)}
          className={cn('inline-flex touch-manipulation items-center justify-center rounded-full hover:bg-white/10', compacta ? 'h-8 w-8 text-lg' : 'h-10 w-10 text-2xl')}
          aria-label={`Reagir com ${e}`}
        >
          {e}
        </motion.button>
      ))}
    </div>
  )
}

/** Botão de reações da barra: abre a fileira por cima e fecha ao reagir ou tocar fora. */
export function BotaoDeReacoes({ aoReagir, className }: { aoReagir: (e: Reacao) => void; className?: string }) {
  const [aberto, setAberto] = useState(false)
  const caixa = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!aberto) return
    const fora = (ev: PointerEvent) => {
      if (caixa.current && !caixa.current.contains(ev.target as Node)) setAberto(false)
    }
    const tecla = (ev: KeyboardEvent) => ev.key === 'Escape' && setAberto(false)
    window.addEventListener('pointerdown', fora)
    window.addEventListener('keydown', tecla)
    return () => {
      window.removeEventListener('pointerdown', fora)
      window.removeEventListener('keydown', tecla)
    }
  }, [aberto])
  return (
    <div ref={caixa} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-label="Reações"
        title="Reações"
        className={cn(
          'inline-flex h-12 w-12 touch-manipulation items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
          aberto ? 'bg-white text-neutral-900' : 'bg-white/10 text-white hover:bg-white/20',
        )}
      >
        <SmilePlus className="h-5 w-5" />
      </button>
      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            className="absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 rounded-full border border-white/15 bg-neutral-900/80 p-1 shadow-2xl backdrop-blur-xl"
          >
            <FileiraDeReacoes
              aoReagir={(e) => {
                aoReagir(e)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * As reações sobem flutuando do canto do palco (como no Meet), com o nome de
 * quem reagiu. Não recebem toques. Some sozinha em ~3 s (o controlador limpa).
 */
export function ReacoesFlutuantes({ reacoes, nomeDe }: { reacoes: Array<{ id: number; pid: string; e: Reacao }>; nomeDe: (pid: string) => string }) {
  const reduzir = useReducedMotion()
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden>
      <AnimatePresence>
        {reacoes.map((r) => {
          // Posição estável por reação (sem Math.random no render).
          const x = 6 + ((r.id * 37) % 22)
          return (
            <motion.div
              key={r.id}
              className="absolute bottom-4 flex flex-col items-center"
              style={{ left: `${x}%` }}
              initial={reduzir ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.4 }}
              animate={reduzir ? { opacity: [0, 1, 1, 0] } : { opacity: [0, 1, 1, 0], y: -260, scale: [0.4, 1.25, 1, 1], x: [0, 14, -10, 6] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3, ease: 'easeOut' }}
            >
              <span className="text-4xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]">{r.e}</span>
              <span className="mt-0.5 max-w-[9rem] truncate rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">{nomeDe(r.pid)}</span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
