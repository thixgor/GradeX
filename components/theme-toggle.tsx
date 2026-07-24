'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { runThemePortal } from '@/lib/theme-portal'

type ThemeToggleProps = {
  className?: string
  variant?: 'switch' | 'icon'
  floating?: boolean
}

export function ThemeToggle({
  className,
  variant = 'switch',
  floating = false,
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === 'dark'

  const applyTheme = useCallback(
    (next: 'light' | 'dark', origin?: { x: number; y: number }) => {
      const x = origin?.x ?? window.innerWidth - 48
      const y = origin?.y ?? 40
      runThemePortal(next, { x, y }, () => setTheme(next))
    },
    [setTheme]
  )

  const toggle = (e?: React.MouseEvent) => {
    const next = isDark ? 'light' : 'dark'
    let origin: { x: number; y: number } | undefined
    if (e) origin = { x: e.clientX, y: e.clientY }
    else if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      origin = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    }
    applyTheme(next, origin)
  }

  if (!mounted) {
    return (
      <span
        className={cn(
          floating
            ? 'pwa-safe-fixed-top fixed top-3 right-3 z-[60] h-10 w-[4.25rem] rounded-full border border-border bg-card/90 shadow-md'
            : variant === 'icon'
              ? 'inline-flex h-9 w-9 rounded-md border border-border bg-card'
              : 'inline-flex h-9 w-[3.85rem] rounded-full border border-border bg-muted/60',
          className
        )}
        aria-hidden
      />
    )
  }

  if (variant === 'icon') {
    return (
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => toggle(e)}
        className={cn(
          'theme-toggle-3d relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-sm hover:bg-muted',
          floating && 'pwa-safe-fixed-top fixed top-3 right-3 z-[60] h-10 w-10 shadow-md',
          className
        )}
        aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
        title={isDark ? 'Modo claro' : 'Modo escuro'}
      >
        <span className="theme-toggle-icon" data-dark={isDark ? 'true' : 'false'}>
          {isDark ? (
            <Sun className="h-4 w-4 text-amber-500" />
          ) : (
            <Moon className="h-4 w-4 text-primary" />
          )}
        </span>
      </button>
    )
  }

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={(e) => toggle(e)}
      style={{ '--thumb-travel': floating ? '2.1rem' : '1.6rem' } as React.CSSProperties}
      className={cn(
        'theme-toggle-3d group relative inline-flex h-9 w-[3.85rem] shrink-0 items-center rounded-full border p-1',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
        isDark ? 'border-primary/30 bg-[#0f2418]' : 'border-border bg-muted',
        floating &&
          'pwa-safe-fixed-top fixed top-3 right-3 z-[60] h-10 w-[4.35rem] border-border bg-card/95 shadow-lg backdrop-blur-md',
        className
      )}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={isDark ? 'Modo claro' : 'Modo escuro'}
      data-dark={isDark ? 'true' : 'false'}
    >
      <span className="pointer-events-none absolute inset-0 flex items-center justify-between px-2">
        <Sun
          className={cn(
            'h-3 w-3 transition-opacity duration-200',
            isDark ? 'opacity-35 text-amber-400/70' : 'opacity-90 text-amber-600'
          )}
        />
        <Moon
          className={cn(
            'h-3 w-3 transition-opacity duration-200',
            isDark ? 'opacity-90 text-emerald-300' : 'opacity-35 text-primary/50'
          )}
        />
      </span>

      <span
        className={cn(
          'theme-toggle-thumb relative z-[1] flex h-7 w-7 items-center justify-center rounded-full border',
          isDark
            ? 'border-emerald-400/30 bg-gradient-to-br from-[#1a3d24] to-[#0c1a12] text-amber-300'
            : 'border-white/80 bg-gradient-to-br from-white to-[#f3f0e8] text-primary'
        )}
        data-dark={isDark ? 'true' : 'false'}
      >
        <span className="theme-toggle-icon" data-dark={isDark ? 'true' : 'false'}>
          {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </span>
      </span>
    </button>
  )
}
