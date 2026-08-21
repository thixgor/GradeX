'use client'

import React, { useId, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

/**
 * ═══════════════════════════════════════════════════════════════
 *  Primitivas de gráfico do painel (/admin/stats)
 * ───────────────────────────────────────────────────────────────
 *  SVG puro, sem biblioteca: os gráficos daqui são simples e uma
 *  dependência de charting custaria mais bundle do que o painel
 *  inteiro. As cores saem das variáveis `--viz-*` (globals.css),
 *  que já vêm reestagiadas para o tema claro e o escuro.
 *
 *  Regras que valem para todos os componentes abaixo:
 *   • série sempre acompanhada de legenda com valor — no tema
 *     claro três dos matizes ficam abaixo de 3:1 e a cor sozinha
 *     não pode carregar significado;
 *   • marcas finas, grade discreta, eixo recessivo;
 *   • rótulos em tinta de texto, nunca na cor da série.
 * ═══════════════════════════════════════════════════════════════
 */

export const SERIES_COLORS = ['var(--viz-1)', 'var(--viz-2)', 'var(--viz-3)', 'var(--viz-4)', 'var(--viz-5)']

export const STATUS_COLORS = {
  good: 'var(--viz-good)',
  warning: 'var(--viz-warning)',
  serious: 'var(--viz-serious)',
  critical: 'var(--viz-critical)',
} as const

// ─── Formatadores ─────────────────────────────────────────────

export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—'
  return value.toLocaleString('pt-BR')
}

export function formatScore(value: number | null | undefined, digits = 1): string {
  if (value == null || Number.isNaN(value)) return '—'
  return value.toFixed(digits)
}

export function formatPct(value: number | null | undefined, digits = 1): string {
  if (value == null || Number.isNaN(value)) return '—'
  return `${value.toFixed(digits)}%`
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

/** "há 3 min" / "há 2 h" — leitura rápida de recência no painel ao vivo. */
export function formatRelative(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  const seconds = Math.round((Date.now() - d.getTime()) / 1000)
  if (seconds < 45) return 'agora'
  if (seconds < 3600) return `há ${Math.round(seconds / 60)} min`
  if (seconds < 86400) return `há ${Math.round(seconds / 3600)} h`
  return `há ${Math.round(seconds / 86400)} d`
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms == null || ms <= 0) return '—'
  const totalMinutes = Math.round(ms / 60000)
  if (totalMinutes < 1) return '<1 min'
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes ? `${hours}h ${minutes}min` : `${hours}h`
}

// ─── Cartão de indicador ──────────────────────────────────────

export interface StatCardProps {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  delta?: number | null
  /** Quando `true`, uma variação negativa é a notícia boa (ex.: abandono). */
  invertDelta?: boolean
  icon?: React.ReactNode
  accent?: string
}

export function StatCard({ label, value, hint, delta, invertDelta, icon, accent }: StatCardProps) {
  const positive = delta != null && delta > 0
  const negative = delta != null && delta < 0
  const good = invertDelta ? negative : positive
  const bad = invertDelta ? positive : negative

  return (
    <div className="rounded-xl border bg-card p-4 transition-colors hover:border-foreground/20">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {icon && (
          <span
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
            style={{ background: `color-mix(in srgb, ${accent || 'var(--viz-1)'} 14%, transparent)`, color: accent || 'var(--viz-1)' }}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
        {delta != null && (
          <span
            className="inline-flex items-center gap-0.5 font-medium"
            style={{ color: good ? 'var(--viz-good)' : bad ? 'var(--viz-critical)' : undefined }}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : negative ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {hint && <span className="truncate">{hint}</span>}
      </div>
    </div>
  )
}

// ─── Gráfico de linhas/área com crosshair ─────────────────────

export interface SeriesDef {
  key: string
  label: string
  color?: string
}

export interface TimeChartProps {
  data: Record<string, string | number>[]
  series: SeriesDef[]
  height?: number
  /** Preenche a área sob a primeira série — útil quando ela é a métrica-âncora. */
  filled?: boolean
}

const CHART_PADDING = { top: 12, right: 12, bottom: 22, left: 34 }

export function TimeChart({ data, series, height = 220, filled = true }: TimeChartProps) {
  const gradientId = useId()
  const [hover, setHover] = useState<number | null>(null)
  const width = 720 // viewBox fixo; o SVG escala com o container

  const { points, max } = useMemo(() => {
    const maxValue = Math.max(
      1,
      ...data.flatMap(d => series.map(s => Number(d[s.key]) || 0))
    )
    const innerW = width - CHART_PADDING.left - CHART_PADDING.right
    const innerH = height - CHART_PADDING.top - CHART_PADDING.bottom
    const step = data.length > 1 ? innerW / (data.length - 1) : 0

    const pts = series.map(s =>
      data.map((d, i) => ({
        x: CHART_PADDING.left + i * step,
        y: CHART_PADDING.top + innerH - ((Number(d[s.key]) || 0) / maxValue) * innerH,
      }))
    )
    return { points: pts, max: maxValue }
  }, [data, series, height])

  if (data.length === 0) {
    return <EmptyState message="Sem dados no período" />
  }

  const innerH = height - CHART_PADDING.top - CHART_PADDING.bottom
  const gridLines = [0, 0.25, 0.5, 0.75, 1]
  const hoverPoint = hover != null ? data[hover] : null
  const labelEvery = Math.max(1, Math.ceil(data.length / 8))

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Série temporal: ${series.map(s => s.label).join(', ')}`}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={series[0]?.color || SERIES_COLORS[0]} stopOpacity="0.22" />
            <stop offset="100%" stopColor={series[0]?.color || SERIES_COLORS[0]} stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridLines.map(g => {
          const y = CHART_PADDING.top + innerH * g
          return (
            <g key={g}>
              <line x1={CHART_PADDING.left} y1={y} x2={width - CHART_PADDING.right} y2={y} stroke="var(--viz-grid)" strokeWidth="1" />
              <text x={4} y={y + 3} className="fill-muted-foreground" style={{ fontSize: 9 }}>
                {Math.round(max * (1 - g))}
              </text>
            </g>
          )
        })}

        {filled && points[0] && points[0].length > 1 && (
          <path
            d={`${areaPath(points[0])} L ${points[0][points[0].length - 1].x} ${CHART_PADDING.top + innerH} L ${points[0][0].x} ${CHART_PADDING.top + innerH} Z`}
            fill={`url(#${gradientId})`}
          />
        )}

        {points.map((pts, i) => (
          <path
            key={series[i].key}
            d={areaPath(pts)}
            fill="none"
            stroke={series[i].color || SERIES_COLORS[i % SERIES_COLORS.length]}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {hover != null && points[0]?.[hover] && (
          <line
            x1={points[0][hover].x}
            y1={CHART_PADDING.top}
            x2={points[0][hover].x}
            y2={CHART_PADDING.top + innerH}
            stroke="var(--viz-axis)"
            strokeWidth="1"
          />
        )}
        {hover != null &&
          points.map((pts, i) =>
            pts[hover] ? (
              <circle
                key={`dot-${series[i].key}`}
                cx={pts[hover].x}
                cy={pts[hover].y}
                r="4"
                fill={series[i].color || SERIES_COLORS[i % SERIES_COLORS.length]}
                stroke="hsl(var(--card))"
                strokeWidth="2"
              />
            ) : null
          )}

        {data.map((d, i) => {
          const innerW = width - CHART_PADDING.left - CHART_PADDING.right
          const step = data.length > 1 ? innerW / (data.length - 1) : innerW
          return (
            <rect
              key={`hit-${i}`}
              x={CHART_PADDING.left + i * step - step / 2}
              y={0}
              width={Math.max(step, 6)}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          )
        })}

        {data.map((d, i) =>
          i % labelEvery === 0 ? (
            <text
              key={`lbl-${i}`}
              x={CHART_PADDING.left + (data.length > 1 ? ((width - CHART_PADDING.left - CHART_PADDING.right) / (data.length - 1)) * i : 0)}
              y={height - 6}
              textAnchor="middle"
              className="fill-muted-foreground"
              style={{ fontSize: 9 }}
            >
              {String(d.label)}
            </text>
          ) : null
        )}
      </svg>

      {/* Legenda com valor: identidade nunca depende só da cor. */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        {series.map((s, i) => (
          <span key={s.key} className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: s.color || SERIES_COLORS[i % SERIES_COLORS.length] }}
            />
            <span>{s.label}</span>
            <span className="font-medium tabular-nums text-foreground">
              {hoverPoint ? formatNumber(Number(hoverPoint[s.key])) : formatNumber(data.reduce((sum, d) => sum + (Number(d[s.key]) || 0), 0))}
            </span>
          </span>
        ))}
        <span className="ml-auto text-muted-foreground">
          {hoverPoint ? String(hoverPoint.label) : 'total do período'}
        </span>
      </div>
    </div>
  )
}

function areaPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ''
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
}

// ─── Lista de barras ordenada ─────────────────────────────────

export interface BarListItem {
  label: string
  value: number
  hint?: string
  color?: string
  onClick?: () => void
}

export function BarList({ items, max, unit }: { items: BarListItem[]; max?: number; unit?: string }) {
  if (items.length === 0) return <EmptyState message="Sem dados no período" />
  const top = max ?? Math.max(...items.map(i => i.value), 1)

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const pct = top > 0 ? (item.value / top) * 100 : 0
        const Wrapper: any = item.onClick ? 'button' : 'div'
        return (
          <Wrapper
            key={`${item.label}-${i}`}
            onClick={item.onClick}
            className={`group relative block w-full overflow-hidden rounded-lg px-2.5 py-1.5 text-left ${item.onClick ? 'hover:bg-muted/60' : ''}`}
          >
            <span
              className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500"
              style={{
                width: `${Math.max(pct, 1.5)}%`,
                background: `color-mix(in srgb, ${item.color || SERIES_COLORS[0]} 20%, transparent)`,
              }}
              aria-hidden
            />
            <span className="relative flex items-center justify-between gap-3">
              <span className="min-w-0 flex-1 truncate text-sm">{item.label}</span>
              {item.hint && (
                <span className="min-w-0 max-w-[50%] truncate text-right text-xs text-muted-foreground">{item.hint}</span>
              )}
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {formatNumber(item.value)}
                {unit && <span className="ml-0.5 text-xs font-normal text-muted-foreground">{unit}</span>}
              </span>
            </span>
          </Wrapper>
        )
      })}
    </div>
  )
}

// ─── Colunas (distribuição) ───────────────────────────────────

export function ColumnChart({
  data,
  color = SERIES_COLORS[0],
  height = 140,
  formatValue = formatNumber,
}: {
  data: { label: string; count: number }[]
  color?: string
  height?: number
  formatValue?: (n: number) => string
}) {
  const [hover, setHover] = useState<number | null>(null)
  if (data.length === 0) return <EmptyState message="Sem dados no período" />
  const max = Math.max(...data.map(d => d.count), 1)

  return (
    <div>
      {/* `items-stretch` + `h-full` nas colunas: com `items-end` o wrapper de
          cada coluna encolhia para a altura do conteúdo (zero) e a barra, que
          é dimensionada em %, não tinha de que ser porcentagem. */}
      <div className="flex items-stretch gap-1" style={{ height }}>
        {data.map((d, i) => (
          <div
            key={d.label}
            className="group relative flex h-full flex-1 flex-col items-center justify-end"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            {hover === i && (
              <span className="absolute -top-1 z-10 -translate-y-full whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs shadow-md">
                {d.label}: <span className="font-semibold tabular-nums">{formatValue(d.count)}</span>
              </span>
            )}
            <div
              className="w-full rounded-t-[4px] transition-all duration-500"
              style={{
                height: `${Math.max((d.count / max) * 100, d.count > 0 ? 3 : 0.5)}%`,
                background: color,
                opacity: hover == null || hover === i ? 1 : 0.5,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1">
        {data.map(d => (
          <span key={d.label} className="flex-1 truncate text-center text-[10px] text-muted-foreground">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Funil ────────────────────────────────────────────────────

export interface FunnelStep {
  label: string
  value: number
  hint?: string
}

/**
 * Etapas do caminho do aluno. A rampa é ordinal (um matiz só, perdendo
 * intensidade conforme o funil estreita). Os passos param em `--viz-seq-300`:
 * numa rampa ordinal o degrau mais próximo da superfície ainda precisa
 * alcançar 2:1, e o passo 100 não alcança no tema claro.
 */
export function Funnel({ steps }: { steps: FunnelStep[] }) {
  if (steps.length === 0) return <EmptyState message="Sem tentativas no período" />
  const base = Math.max(steps[0]?.value || 0, 1)
  const ramp = ['var(--viz-seq-700)', 'var(--viz-seq-500)', 'var(--viz-seq-300)', 'var(--viz-seq-300)']

  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const pct = (step.value / base) * 100
        const fromPrev = i === 0 ? null : steps[i - 1].value > 0 ? (step.value / steps[i - 1].value) * 100 : 0
        return (
          <div key={step.label}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium">{step.label}</span>
              <span className="flex items-baseline gap-2">
                {fromPrev != null && (
                  <span className="text-xs text-muted-foreground">{fromPrev.toFixed(0)}% da etapa anterior</span>
                )}
                <span className="font-semibold tabular-nums">{formatNumber(step.value)}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 flex-1 overflow-hidden rounded-md bg-muted">
                <div
                  className="h-full rounded-md transition-all duration-700"
                  style={{ width: `${Math.max(pct, 2)}%`, background: ramp[i % ramp.length] }}
                />
              </div>
              {/* Rótulo fora da barra: no passo mais claro da rampa, texto por
                  cima do preenchimento não alcançaria contraste suficiente. */}
              <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">
                {pct.toFixed(0)}%
              </span>
            </div>
            {step.hint && <p className="mt-0.5 text-xs text-muted-foreground">{step.hint}</p>}
          </div>
        )
      })}
    </div>
  )
}

// ─── Mapa de calor 7×24 ───────────────────────────────────────

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function Heatmap({ matrix }: { matrix: number[][] }) {
  const [hover, setHover] = useState<{ d: number; h: number } | null>(null)
  const max = Math.max(1, ...matrix.flat())

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[520px]">
        <div className="flex gap-[3px] pl-9">
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h} className="flex-1 text-center text-[9px] text-muted-foreground">
              {h % 3 === 0 ? h : ''}
            </span>
          ))}
        </div>
        {matrix.map((row, d) => (
          <div key={d} className="mt-[3px] flex items-center gap-[3px]">
            <span className="w-9 shrink-0 text-[10px] text-muted-foreground">{WEEKDAYS[d]}</span>
            {row.map((value, h) => (
              <span
                key={h}
                className="relative h-4 flex-1 rounded-[3px] transition-transform hover:scale-125"
                style={{
                  background:
                    value === 0
                      ? 'var(--viz-grid)'
                      : `color-mix(in srgb, var(--viz-seq-500) ${Math.round(20 + (value / max) * 80)}%, transparent)`,
                }}
                onMouseEnter={() => setHover({ d, h })}
                onMouseLeave={() => setHover(null)}
                title={`${WEEKDAYS[d]} ${String(h).padStart(2, '0')}h — ${value}`}
              />
            ))}
          </div>
        ))}
        <p className="mt-2 text-xs text-muted-foreground">
          {hover
            ? `${WEEKDAYS[hover.d]}, ${String(hover.h).padStart(2, '0')}h — ${formatNumber(matrix[hover.d][hover.h])} envios`
            : `Pico: ${formatNumber(max)} envios numa mesma faixa`}
        </p>
      </div>
    </div>
  )
}

// ─── Barra de progresso ───────────────────────────────────────

export function ProgressBar({ value, color, className = '' }: { value: number; color?: string; className?: string }) {
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-muted ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color || SERIES_COLORS[0] }}
      />
    </div>
  )
}

// ─── Estado vazio ─────────────────────────────────────────────

export function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed py-8 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {hint && <p className="max-w-sm text-xs text-muted-foreground/80">{hint}</p>}
    </div>
  )
}

// ─── Painel lateral (drill-down) ──────────────────────────────

export function SidePanel({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  subtitle?: React.ReactNode
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <aside className="stats-side-panel relative flex h-full w-full max-w-3xl flex-col border-l bg-card shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b bg-card px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold sm:text-lg">{title}</h2>
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-md border px-2 py-1 text-xs hover:bg-muted"
            aria-label="Fechar painel"
          >
            Fechar
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
      </aside>
    </div>
  )
}
