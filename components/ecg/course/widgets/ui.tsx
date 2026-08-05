'use client'

import React from 'react'

/**
 * Peças visuais compartilhadas pelos laboratórios da trilha.
 * Ficam aqui para que todos os widgets tenham o mesmo papel milimetrado, os
 * mesmos botões e a mesma linguagem de cor.
 */

/* ───────────────────────── papel milimetrado SVG ───────────────────────── */

let gridSeq = 0

/**
 * Fundo de papel milimetrado. `mm` é o tamanho do quadradinho de 1 mm em
 * unidades do viewBox; o quadradão de 5 mm é desenhado por cima, mais forte.
 */
export function EcgGrid({ mm = 8, id }: { mm?: number; id?: string }) {
  const uid = React.useMemo(() => id || `ecgrid-${++gridSeq}`, [id])
  return (
    <>
      <defs>
        <pattern id={`${uid}-fine`} width={mm} height={mm} patternUnits="userSpaceOnUse">
          <path d={`M ${mm} 0 L 0 0 0 ${mm}`} fill="none" stroke="currentColor" strokeOpacity="0.16" strokeWidth="0.6" />
        </pattern>
        <pattern id={`${uid}-bold`} width={mm * 5} height={mm * 5} patternUnits="userSpaceOnUse">
          <rect width={mm * 5} height={mm * 5} fill={`url(#${uid}-fine)`} />
          <path d={`M ${mm * 5} 0 L 0 0 0 ${mm * 5}`} fill="none" stroke="currentColor" strokeOpacity="0.34" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${uid}-bold)`} />
    </>
  )
}

/** Moldura escura do "papel" com o traçado dentro. */
export function Paper({
  children, viewBox, className = '', ariaLabel,
}: {
  children: React.ReactNode
  viewBox: string
  className?: string
  ariaLabel?: string
}) {
  return (
    <div className={`overflow-hidden rounded-xl border border-emerald-500/20 bg-[#07100c] ${className}`}>
      <svg
        viewBox={viewBox}
        className="block h-auto w-full text-emerald-400"
        role="img"
        aria-label={ariaLabel}
        preserveAspectRatio="none"
      >
        {children}
      </svg>
    </div>
  )
}

/* ───────────────────────── controles ───────────────────────── */

export function LabButton({
  active, onClick, children, tone = 'default', className = '', disabled, title,
}: {
  active?: boolean
  onClick?: () => void
  children: React.ReactNode
  tone?: 'default' | 'primary' | 'danger'
  className?: string
  disabled?: boolean
  title?: string
}) {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40'
  const styles = active
    ? tone === 'danger'
      ? 'bg-rose-500 text-white'
      : 'bg-primary text-primary-foreground'
    : 'border border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground'
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  )
}

export function Chip({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'info' }) {
  const map = {
    neutral: 'border-border bg-muted/40 text-muted-foreground',
    good: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    warn: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    bad: 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400',
    info: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${map[tone]}`}>
      {children}
    </span>
  )
}

/** Número em destaque com rótulo — usado para medidas. */
export function Metric({ label, value, unit, tone = 'neutral' }: { label: string; value: string | number; unit?: string; tone?: 'neutral' | 'good' | 'warn' | 'bad' }) {
  const color = {
    neutral: 'text-foreground',
    good: 'text-emerald-600 dark:text-emerald-400',
    warn: 'text-amber-600 dark:text-amber-400',
    bad: 'text-rose-600 dark:text-rose-400',
  }[tone]
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`font-mono text-lg font-black leading-tight ${color}`}>
        {value}
        {unit && <span className="ml-0.5 text-[11px] font-bold text-muted-foreground">{unit}</span>}
      </p>
    </div>
  )
}

/** Bloco de explicação que acompanha o estado atual do laboratório. */
export function LabNote({ title, children, tone = 'neutral' }: { title?: string; children: React.ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'info' }) {
  const map = {
    neutral: 'border-border bg-muted/30',
    good: 'border-emerald-500/25 bg-emerald-500/[0.06]',
    warn: 'border-amber-500/25 bg-amber-500/[0.06]',
    bad: 'border-rose-500/25 bg-rose-500/[0.06]',
    info: 'border-sky-500/25 bg-sky-500/[0.06]',
  }
  return (
    <div className={`rounded-xl border p-3 ${map[tone]}`}>
      {title && <p className="mb-1 text-xs font-black uppercase tracking-wider text-muted-foreground">{title}</p>}
      <div className="text-[13px] leading-relaxed text-foreground/90">{children}</div>
    </div>
  )
}

/** Controle deslizante rotulado. */
export function LabSlider({
  label, value, min, max, step = 1, unit, onChange, hint,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
  hint?: string
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-bold">{label}</span>
        <span className="font-mono text-sm font-black text-primary">
          {value}
          {unit && <span className="ml-0.5 text-[10px] text-muted-foreground">{unit}</span>}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
      />
      {hint && <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">{hint}</span>}
    </label>
  )
}

/** Container padrão de um laboratório. */
export function LabShell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-3 sm:p-4 ${className}`}>
      {children}
    </div>
  )
}
