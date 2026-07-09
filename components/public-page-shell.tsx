'use client'

import Link from 'next/link'
import { type ReactNode } from 'react'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

/**
 * Lightweight chrome for public routes (amostra, auth, comprar, etc.)
 * Always includes light/dark toggle. No AppShell / no sidebar.
 */
export function PublicPageShell({
  children,
  rightSlot,
  className,
  contentClassName,
  maxWidth = 'max-w-5xl',
}: {
  children: ReactNode
  rightSlot?: ReactNode
  className?: string
  contentClassName?: string
  maxWidth?: string
}) {
  return (
    <div className={cn('min-h-screen surface-page text-foreground', className)}>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/90">
        <div
          className={cn(
            'mx-auto flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6',
            maxWidth
          )}
        >
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="DomineAqui">
            <Logo variant="full" size="md" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            {rightSlot}
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className={cn('mx-auto w-full px-4 py-6 sm:px-6 sm:py-8', maxWidth, contentClassName)}>
        {children}
      </main>
    </div>
  )
}
