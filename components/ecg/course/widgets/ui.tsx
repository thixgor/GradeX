'use client'

import React from 'react'
import { useEcgPaper } from '../../use-ecg-paper'

export { useEcgPaper }

/**
 * Peças visuais compartilhadas pelos laboratórios da trilha.
 *
 * Regras que valem para todas elas:
 *  - alvo de toque nunca menor que ~40 px de altura;
 *  - barras de controle rolam na horizontal no celular em vez de quebrar em
 *    quatro linhas;
 *  - nada de `title` como única fonte de informação (não existe hover no
 *    celular) — o rótulo sempre aparece em texto;
 *  - nenhuma cor de papel escrita à mão: tudo sai da paleta de `useEcgPaper`,
 *    para que o traçado troque entre papel claro e monitor verde de uma vez só.
 */

/* ───────────────────────── papel milimetrado SVG ───────────────────────── */

/**
 * Fundo de papel milimetrado. `mm` é o tamanho do quadradinho de 1 mm em
 * unidades do viewBox; o quadradão de 5 mm é desenhado por cima, mais forte.
 *
 * O id sai do `useId` do React: um contador de módulo daria números diferentes
 * no servidor e no cliente, e a hidratação quebraria.
 */
export function EcgGrid({ mm = 8, id }: { mm?: number; id?: string }) {
  const { palette } = useEcgPaper()
  const auto = React.useId().replace(/:/g, '')
  const uid = id || `ecgrid-${auto}`
  return (
    <>
      <defs>
        <pattern id={`${uid}-fine`} width={mm} height={mm} patternUnits="userSpaceOnUse">
          <path d={`M ${mm} 0 L 0 0 0 ${mm}`} fill="none" stroke={palette.gridFine} strokeWidth="0.6" />
        </pattern>
        <pattern id={`${uid}-bold`} width={mm * 5} height={mm * 5} patternUnits="userSpaceOnUse">
          <rect width={mm * 5} height={mm * 5} fill={`url(#${uid}-fine)`} />
          <path d={`M ${mm * 5} 0 L 0 0 0 ${mm * 5}`} fill="none" stroke={palette.gridBold} strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${uid}-bold)`} />
    </>
  )
}

/**
 * Moldura do "papel" com o traçado dentro.
 *
 * Recebe os mesmos props de um <svg> (ref, handlers de ponteiro, viewBox) —
 * o paquímetro do laboratório de intervalos precisa deles — e cuida do fundo,
 * da borda e da legenda conforme o papel escolhido.
 */
export const PaperFrame = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement> & {
  viewBox: string
  frameClassName?: string
  caption?: React.ReactNode
  /** faixa de cabeçalho dentro da moldura (nome da derivação, por exemplo) */
  header?: React.ReactNode
}>(function PaperFrame(
  { viewBox, children, className = '', frameClassName = '', caption, header, ...svgProps }, ref,
) {
  const { palette } = useEcgPaper()
  return (
    <figure className="m-0">
      <div
        className={`overflow-hidden rounded-xl border ${frameClassName}`}
        style={{ backgroundColor: palette.bg, borderColor: palette.border }}
      >
        {header != null && (
          <div
            className="flex items-center justify-between px-2 py-1"
            style={{ borderBottom: `1px solid ${palette.border}`, color: palette.ink }}
          >
            {header}
          </div>
        )}
        <svg
          ref={ref}
          viewBox={viewBox}
          className={`block h-auto w-full ${className}`}
          {...svgProps}
        >
          {children}
        </svg>
      </div>
      {caption != null && (
        <figcaption className="mt-1.5 text-center text-[10.5px] leading-snug text-muted-foreground sm:text-[11px]">
          {caption}
        </figcaption>
      )}
    </figure>
  )
})

/* ───────────────────────── controles ───────────────────────── */

/**
 * Fileira de controles que ROLA na horizontal em telas estreitas.
 * Sem isso, oito botões de cenário viram cinco linhas empilhadas no celular e
 * empurram o traçado para fora da primeira dobra.
 */
export function ScrollRow({
  children, className = '', label,
}: {
  children: React.ReactNode
  className?: string
  label?: string
}) {
  return (
    <div className={`relative ${className}`}>
      {label && (
        <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</p>
      )}
      <div className="course-scroll-row" role="group" aria-label={label}>
        {children}
      </div>
    </div>
  )
}

export function LabButton({
  active, onClick, children, tone = 'default', className = '', disabled, title, ariaLabel,
}: {
  active?: boolean
  onClick?: () => void
  children: React.ReactNode
  tone?: 'default' | 'primary' | 'danger'
  className?: string
  disabled?: boolean
  title?: string
  ariaLabel?: string
}) {
  const base =
    'inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold leading-tight transition ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background ' +
    'active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100'
  const styles = active
    ? tone === 'danger'
      ? 'bg-rose-500 text-white shadow-sm'
      : 'bg-primary text-primary-foreground shadow-sm'
    : 'border border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={active === undefined ? undefined : active}
      className={`${base} ${styles} ${className}`}
    >
      {children}
    </button>
  )
}

/**
 * Chip de seleção das barras de controle. Menor que o `LabButton`, mas nunca
 * abaixo de 36 px de altura — é o piso em que o dedo ainda acerta sem erro.
 */
export function LabChip({
  active, onClick, children, className = '', tone = 'primary',
}: {
  active?: boolean
  onClick?: () => void
  children: React.ReactNode
  className?: string
  tone?: 'primary' | 'danger'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-[36px] items-center justify-center rounded-lg px-2.5 text-[11.5px] font-bold leading-tight transition
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-[0.97] ${
        active
          ? tone === 'danger' ? 'bg-rose-500 text-white shadow-sm' : 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
      } ${className}`}
    >
      {children}
    </button>
  )
}

/** Botão só de ícone — mantém o alvo quadrado de 40 px e exige rótulo acessível. */
export function LabIconButton({
  onClick, children, label, active, className = '',
}: {
  onClick?: () => void
  children: React.ReactNode
  label: string
  active?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active === undefined ? undefined : active}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition active:scale-[0.97]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
        active ? 'bg-primary text-primary-foreground' : 'border border-border bg-muted/40 text-muted-foreground hover:text-foreground'
      } ${className}`}
    >
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

/**
 * Número em destaque com rótulo. `value` curto vira monoespaçado grande;
 * texto longo cai para um corpo menor e quebra em várias linhas em vez de
 * estourar a caixa.
 */
export function Metric({
  label, value, unit, tone = 'neutral',
}: {
  label: string
  value: string | number
  unit?: string
  tone?: 'neutral' | 'good' | 'warn' | 'bad'
}) {
  const color = {
    neutral: 'text-foreground',
    good: 'text-emerald-600 dark:text-emerald-400',
    warn: 'text-amber-600 dark:text-amber-400',
    bad: 'text-rose-600 dark:text-rose-400',
  }[tone]
  const long = String(value).length > 12
  return (
    <div className="min-w-0 rounded-xl border border-border bg-muted/30 px-2.5 py-2">
      <p className="line-clamp-1 text-[9.5px] font-black uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`${long ? 'text-[12.5px] font-bold leading-snug' : 'font-mono text-base font-black leading-tight sm:text-lg'} ${color}`}>
        {value}
        {unit && <span className="ml-0.5 text-[10px] font-bold text-muted-foreground">{unit}</span>}
      </p>
    </div>
  )
}

/** Bloco de explicação que acompanha o estado atual do laboratório. */
export function LabNote({
  title, children, tone = 'neutral',
}: {
  title?: string
  children: React.ReactNode
  tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'info'
}) {
  const map = {
    neutral: 'border-border bg-muted/30',
    good: 'border-emerald-500/25 bg-emerald-500/[0.06]',
    warn: 'border-amber-500/25 bg-amber-500/[0.06]',
    bad: 'border-rose-500/25 bg-rose-500/[0.06]',
    info: 'border-sky-500/25 bg-sky-500/[0.06]',
  }
  const dot = {
    neutral: 'bg-muted-foreground/50',
    good: 'bg-emerald-500',
    warn: 'bg-amber-500',
    bad: 'bg-rose-500',
    info: 'bg-sky-500',
  }
  return (
    <div className={`rounded-xl border p-3 ${map[tone]}`}>
      {title && (
        <p className="mb-1 flex items-center gap-1.5 text-[10.5px] font-black uppercase tracking-wider text-muted-foreground">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot[tone]}`} aria-hidden />
          {title}
        </p>
      )}
      <div className="text-[12.5px] leading-relaxed text-foreground/90 sm:text-[13px]">{children}</div>
    </div>
  )
}

/** Controle deslizante rotulado, com polegar grande o bastante para o dedo. */
export function LabSlider({
  label, value, min, max, step = 1, unit, onChange, hint, format,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
  hint?: string
  format?: (v: number) => string
}) {
  const id = React.useId()
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-bold">{label}</span>
        <span className="font-mono text-sm font-black text-primary">
          {format ? format(value) : value}
          {unit && <span className="ml-0.5 text-[10px] text-muted-foreground">{unit}</span>}
        </span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="course-range mt-2.5"
      />
      {hint && <span className="mt-1.5 block text-[11px] leading-snug text-muted-foreground">{hint}</span>}
    </div>
  )
}

/** Container padrão de um laboratório, com cabeçalho opcional. */
export function LabShell({
  children, className = '', title, hint,
}: {
  children: React.ReactNode
  className?: string
  title?: string
  hint?: string
}) {
  return (
    <section className={`rounded-2xl border border-border bg-card p-2.5 shadow-sm sm:p-4 ${className}`}>
      {(title || hint) && (
        <header className="mb-2.5">
          {title && <h4 className="font-heading text-sm font-black tracking-tight sm:text-base">{title}</h4>}
          {hint && <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">{hint}</p>}
        </header>
      )}
      {children}
    </section>
  )
}

/**
 * Área invisível de toque para elementos SVG finos (traços do sistema de
 * condução, pontos de derivação). Sem isso, acertar um traço de 2 px com o
 * dedo é impossível.
 */
export function SvgHit({
  d, cx, cy, r, onClick, label,
}: {
  d?: string
  cx?: number
  cy?: number
  r?: number
  onClick: () => void
  label: string
}) {
  const common = {
    onClick,
    role: 'button' as const,
    tabIndex: 0,
    'aria-label': label,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() }
    },
    className: 'cursor-pointer focus:outline-none',
    style: { outline: 'none' } as React.CSSProperties,
  }
  if (d) {
    return (
      <path
        {...common}
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={18}
        strokeLinecap="round"
        pointerEvents="stroke"
      />
    )
  }
  return <circle {...common} cx={cx} cy={cy} r={r ?? 20} fill="transparent" pointerEvents="all" />
}
