'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Logo } from '@/components/logo'
import { MOTIVATIONAL_PHRASES } from '@/lib/motivational-phrases'
import { cn } from '@/lib/utils'

/**
 * Overlay estilo "letra de música": a lista inteira de frases, com a atual em
 * destaque e as vizinhas esmaecendo.
 *
 * Carregado por `next/dynamic` — nada disso (nem as ~43 KB de frases) entra no
 * chunk inicial da dashboard. As frases são `<div>` com classe CSS em vez de
 * `motion.div` animados: eram 276 instâncias do framer montadas de uma vez ao
 * abrir, o que travava o aparelho antes da primeira frase aparecer.
 */
export default function PhrasesOverlay({
  index,
  onSelect,
  onClose,
}: {
  index: number
  onSelect: (i: number) => void
  onClose: () => void
}) {
  const activeRef = useRef<HTMLButtonElement>(null)

  // Posiciona instantaneamente na frase atual (sem rolagem visível).
  useEffect(() => {
    const id = setTimeout(() => {
      activeRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'center' })
    }, 50)
    return () => clearTimeout(id)
  }, [])

  // Esc fecha, setas navegam.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowDown') onSelect(Math.min(index + 1, MOTIVATIONAL_PHRASES.length - 1))
      else if (e.key === 'ArrowUp') onSelect(Math.max(index - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, onClose, onSelect])

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black/95 backdrop-blur-2xl da-panel-fade">
      {/* Cabeçalho */}
      <div className="pwa-safe-top flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Logo variant="dark" size="sm" />
          <div className="flex items-center gap-2 pl-0.5">
            <span className="text-[11px] font-light tracking-wide text-white/30">
              Domine o conteúdo. Domine a prova.
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Fechar frases"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/40 transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-95"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-12 sm:px-16 md:px-28 lg:px-48">
        <div className="mx-auto max-w-2xl space-y-10 sm:space-y-12">
          {MOTIVATIONAL_PHRASES.map((phrase, i) => {
            const distance = Math.abs(i - index)
            const isCurrent = i === index
            return (
              <button
                key={i}
                ref={isCurrent ? activeRef : undefined}
                onClick={() => onSelect(i)}
                // content-visibility deixa o navegador pular layout e pintura
                // das frases fora da tela — são centenas de parágrafos longos.
                style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 120px' }}
                className={cn(
                  'block w-full text-left transition-opacity duration-500',
                  isCurrent
                    ? 'opacity-100'
                    : distance === 1
                      ? 'opacity-30 hover:opacity-60'
                      : distance === 2
                        ? 'opacity-[0.16] hover:opacity-60'
                        : 'opacity-[0.08] hover:opacity-60',
                )}
              >
                <p
                  className={cn(
                    'leading-relaxed text-white',
                    isCurrent ? 'text-xl font-semibold sm:text-2xl' : 'text-lg font-medium sm:text-xl',
                  )}
                >
                  {phrase}
                </p>
                {isCurrent && <span className="mt-3 block h-0.5 w-8 rounded-full bg-emerald-400" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Progresso */}
      <div className="pwa-safe-bottom flex items-center gap-4 border-t border-white/10 px-5 py-4 sm:px-6">
        <span className="w-16 font-mono text-xs tabular-nums text-white/25">
          {index + 1} / {MOTIVATIONAL_PHRASES.length}
        </span>
        <div className="h-px flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-emerald-400/50 transition-[width] duration-500 ease-in-out"
            style={{ width: `${((index + 1) / MOTIVATIONAL_PHRASES.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
