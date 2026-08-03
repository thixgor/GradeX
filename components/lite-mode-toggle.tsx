'use client'

import { useEffect, useRef, useState } from 'react'
import { Gauge, Zap } from 'lucide-react'
import { useLiteMode } from '@/hooks/use-lite-mode'
import { cn } from '@/lib/utils'

type LiteModeToggleProps = {
  className?: string
  /** `icon`: botão quadrado do header. `pill`: linha com rótulo, para menus. */
  variant?: 'icon' | 'pill'
  /** Mostra a confirmação flutuante ao alternar. */
  feedback?: boolean
}

/**
 * Atalho de um toque para o Modo Lite.
 *
 * Ele fica ao lado do seletor de tema — o mesmo lugar onde a pessoa já procura
 * "como eu mudo o visual". Antes, a única forma de ligar era descer até o fim
 * do /profile, o que na prática significava que quem mais precisava (aparelho
 * fraco, tela travando) nunca descobria que existia.
 */
export function LiteModeToggle({
  className,
  variant = 'icon',
  feedback = true,
}: LiteModeToggleProps) {
  const { liteMode, preference, autoEnabled, hydrated, toggleLiteMode } = useLiteMode()
  const [flash, setFlash] = useState<'on' | 'off' | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  const handleToggle = () => {
    const next = !liteMode
    toggleLiteMode()
    if (!feedback) return
    setFlash(next ? 'on' : 'off')
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setFlash(null), 2600)
  }

  // Placeholder do mesmo tamanho antes da hidratação: sem pulo de layout no header.
  if (!hydrated) {
    return (
      <span
        aria-hidden
        className={cn(
          variant === 'icon'
            ? 'inline-flex h-9 w-9 rounded-md border border-border bg-card'
            : 'inline-flex h-11 w-full rounded-md border border-border bg-card',
          className,
        )}
      />
    )
  }

  const stateLabel = liteMode
    ? autoEnabled
      ? 'Modo Lite ativo (automático)'
      : 'Modo Lite ativo'
    : 'Modo Lite desativado'

  const actionLabel = liteMode ? 'Desativar Modo Lite' : 'Ativar Modo Lite'

  if (variant === 'pill') {
    return (
      <>
        <button
          type="button"
          onClick={handleToggle}
          aria-pressed={liteMode}
          title={`${stateLabel} — toque para ${liteMode ? 'desativar' : 'ativar'}`}
          className={cn(
            'flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors',
            liteMode
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
              : 'border-border bg-card text-foreground hover:bg-muted',
            className,
          )}
        >
          <Zap className={cn('h-4 w-4 shrink-0', liteMode && 'fill-current')} />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold leading-tight">Modo Lite</span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {liteMode ? 'Interface leve e rápida' : 'Deixa o app leve em aparelho fraco'}
            </span>
          </span>
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
              liteMode
                ? 'bg-amber-500 text-white'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {liteMode ? (preference === 'auto' ? 'Auto' : 'On') : 'Off'}
          </span>
        </button>
        <LiteModeFlash state={flash} />
      </>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={liteMode}
        aria-label={actionLabel}
        title={`${stateLabel} — toque para ${liteMode ? 'desativar' : 'ativar'}`}
        data-lite-active={liteMode ? 'true' : 'false'}
        className={cn(
          'relative inline-flex h-9 w-9 items-center justify-center rounded-md border text-foreground shadow-sm transition-colors',
          liteMode
            ? 'border-amber-500/50 bg-amber-500/15 text-amber-600 dark:text-amber-300'
            : 'border-border bg-card hover:bg-muted',
          className,
        )}
      >
        {liteMode ? <Zap className="h-4 w-4 fill-current" /> : <Gauge className="h-4 w-4" />}
        {liteMode && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-background" />
        )}
      </button>
      <LiteModeFlash state={flash} />
    </>
  )
}

/** Confirmação curta: sem ela, o usuário aperta e não tem certeza se mudou algo. */
function LiteModeFlash({ state }: { state: 'on' | 'off' | null }) {
  if (!state) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className="pwa-safe-bottom fixed inset-x-0 bottom-20 z-[70] flex justify-center px-4 lg:bottom-8"
    >
      <div
        className={cn(
          'flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-lg',
          state === 'on'
            ? 'border-amber-500/40 bg-amber-500 text-white'
            : 'border-border bg-card text-foreground',
        )}
      >
        <Zap className={cn('h-3.5 w-3.5', state === 'on' && 'fill-current')} />
        {state === 'on'
          ? 'Modo Lite ativado — efeitos pesados desligados'
          : 'Modo Lite desativado — visual completo de volta'}
      </div>
    </div>
  )
}
