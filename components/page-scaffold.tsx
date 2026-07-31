'use client'

import Link from 'next/link'
import { type ReactNode } from 'react'
import { ChevronRight, ArrowLeft, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Shared editorial page chrome for product routes.
 * Light + dark via design tokens. Fast nav, no glass/orbs.
 */

export function PageScaffold({
  children,
  className,
  wide = false,
  flush = false,
}: {
  children: ReactNode
  className?: string
  wide?: boolean
  /** No vertical padding — for players / full-bleed detail */
  flush?: boolean
}) {
  return (
    <div className={cn('surface-page', className)}>
      <div
        className={cn(
          'mx-auto w-full',
          wide ? 'max-w-[1400px]' : 'max-w-7xl',
          flush ? 'px-0 py-0' : 'px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8'
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-4',
        className
      )}
    >
      <div className="min-w-0 space-y-1.5">
        {eyebrow ? <p className="editorial-mark">{eyebrow}</p> : null}
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-[1.9rem] leading-tight">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
      ) : null}
    </header>
  )
}

export function SurfaceCard({
  children,
  className,
  as: Tag = 'div',
  interactive = false,
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article' | 'button' | 'a'
  interactive?: boolean
}) {
  const base = cn(
    'rounded-lg border border-border bg-card text-card-foreground shadow-[0_1px_2px_rgba(21,61,31,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.25)]',
    interactive &&
      'transition-colors hover:border-primary/35 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
    className
  )
  return <Tag className={base}>{children}</Tag>
}

export function MetricTile({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: string
  value: ReactNode
  hint?: string
  icon?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-4 sm:p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-clinical text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>
          <div className="mt-1.5 font-heading text-2xl font-semibold tabular-nums tracking-tight text-foreground sm:text-3xl">
            {value}
          </div>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {icon ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50 text-primary">
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type Crumb = {
  label: string
  href?: string
  /**
   * Quando vem junto de `href`, intercepta o clique simples para permitir
   * navegação client-side instantânea — o `href` continua valendo para clique
   * do meio, "abrir em nova aba" e leitores de tela.
   */
  onClick?: () => void
}

/** Compact breadcrumb — faster orientation than single “Voltar” */
export function Breadcrumbs({
  items,
  className,
}: {
  items: Crumb[]
  className?: string
}) {
  if (!items.length) return null
  return (
    <nav aria-label="Navegação" className={cn('mb-3 flex flex-wrap items-center gap-1 text-xs sm:text-[13px]', className)}>
      {items.map((item, i) => {
        const last = i === items.length - 1
        return (
          <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1 min-w-0">
            {i > 0 ? (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" aria-hidden />
            ) : null}
            {last || (!item.href && !item.onClick) ? (
              <span
                className={cn(
                  'truncate font-medium',
                  last ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>
            ) : item.href ? (
              <Link
                href={item.href}
                onClick={(e) => {
                  if (!item.onClick) return
                  // Deixa passar clique do meio / com modificador para o
                  // comportamento nativo do navegador.
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
                  e.preventDefault()
                  item.onClick()
                }}
                className="truncate font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={item.onClick}
                className="truncate font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </button>
            )}
          </span>
        )
      })}
    </nav>
  )
}

/** Sticky back/cascade strip under AppShell header */
export function NavStrip({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'sticky top-14 sm:top-16 z-20 -mx-4 mb-4 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur-md supports-[backdrop-filter]:bg-background/90 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8',
        className
      )}
    >
      {children}
    </div>
  )
}

export function BackLink({
  href,
  onClick,
  children = 'Voltar',
  className,
}: {
  href?: string
  onClick?: () => void
  children?: ReactNode
  className?: string
}) {
  const cls = cn(
    'inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground',
    className
  )
  if (href) {
    return (
      <Link href={href} className={cls}>
        <ArrowLeft className="h-4 w-4" />
        {children}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      <ArrowLeft className="h-4 w-4" />
      {children}
    </button>
  )
}

/** Horizontal filter/segmented control */
export function FilterTabs({
  items,
  value,
  onChange,
  className,
}: {
  items: { id: string; label: string; count?: number }[]
  value: string
  onChange: (id: string) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex gap-1 overflow-x-auto scrollbar-hide rounded-lg border border-border bg-muted/40 p-1',
        className
      )}
      role="tablist"
    >
      {items.map((item) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              'shrink-0 rounded-md px-3 py-1.5 text-xs sm:text-sm font-semibold transition-colors',
              active
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {item.label}
            {typeof item.count === 'number' ? (
              <span className={cn('ml-1.5 font-clinical tabular-nums', active ? 'text-primary' : 'text-muted-foreground/80')}>
                {item.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export function FilterChip({
  active,
  onClick,
  children,
  className,
}: {
  active?: boolean
  onClick?: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors',
        active
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground',
        className
      )}
    >
      {children}
    </button>
  )
}

/** Search field aligned to editorial surfaces */
export function SearchField({
  value,
  onChange,
  placeholder = 'Buscar…',
  className,
  inputClassName,
  autoFocus,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  inputClassName?: string
  autoFocus?: boolean
}) {
  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          'h-11 w-full rounded-md border border-border bg-card pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground shadow-sm outline-none transition-colors focus:border-primary/45 focus:ring-2 focus:ring-primary/15',
          inputClassName
        )}
      />
    </div>
  )
}

/** Dense list/entity row for pathology, deck, material, lesson */
export function EntityRow({
  title,
  subtitle,
  meta,
  leading,
  trailing,
  href,
  onClick,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  meta?: ReactNode
  leading?: ReactNode
  trailing?: ReactNode
  href?: string
  onClick?: () => void
  className?: string
}) {
  const body = (
    <>
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-sm sm:text-[15px] text-foreground leading-snug truncate">
          {title}
        </div>
        {subtitle ? (
          <div className="mt-0.5 text-xs sm:text-[13px] text-muted-foreground line-clamp-2">
            {subtitle}
          </div>
        ) : null}
        {meta ? <div className="mt-1.5 flex flex-wrap gap-1.5">{meta}</div> : null}
      </div>
      {trailing ? <div className="shrink-0 self-center">{trailing}</div> : null}
    </>
  )

  const cls = cn(
    'flex w-full items-start gap-3 rounded-lg border border-border bg-card p-3.5 sm:p-4 text-left transition-colors hover:border-primary/35 hover:bg-muted/30',
    className
  )

  if (href) {
    return (
      <Link href={href} className={cls}>
        {body}
      </Link>
    )
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {body}
      </button>
    )
  }
  return <div className={cls}>{body}</div>
}

/** Sticky bottom CTA bar (mobile purchase / study) */
export function StickyActionBar({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md sm:hidden',
        'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
        className
      )}
    >
      {children}
    </div>
  )
}
