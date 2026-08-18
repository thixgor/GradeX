'use client'

/**
 * Kit de gráficos do perfil — SVG puro, sem nenhuma dependência nova.
 *
 * Regras que valem para todo gráfico daqui:
 *  - marcas finas, grade em fio de cabelo sólido e recuada, respiro generoso;
 *  - ponta arredondada de 4px na extremidade do dado, quadrada na linha de base;
 *  - 2px de vão na cor da superfície separando segmentos empilhados e barras
 *    vizinhas (nunca contorno em volta da marca);
 *  - camada de hover com tooltip por marca e o mesmo detalhe no foco do teclado;
 *  - toda figura carrega uma tabela equivalente (`ChartCard` → "Ver tabela"), de
 *    modo que nenhum valor exista só no hover ou só na cor.
 *
 * A paleta vive em `globals.css` (bloco `.viz`) e já passou pelo validador.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Table2, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────
// Infra
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Largura real do container — SVG responsivo sem esticar texto com viewBox.
 *
 * Começa em 0 e só desenha depois de medir: um fallback largo demais empurraria
 * a coluna do grid (`min-width: auto`) e o card estouraria no celular antes da
 * primeira medição.
 */
export function useChartWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setWidth(el.clientWidth)
    update()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update)
      return () => window.removeEventListener('resize', update)
    }
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, width }
}

/**
 * Container medido. Não leva `overflow: hidden` de propósito — o tooltip é
 * filho dele e seria decepado na borda do card. O SVG nunca vaza porque é
 * desenhado exatamente na largura medida (e em 0 antes de medir).
 */
const PLOT_BOX = 'relative w-full min-w-0'

/** Caminho de retângulo com as duas pontas de cima arredondadas. */
function roundedTop(x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.max(0, Math.min(r, w / 2, h))
  return [
    `M${x},${y + h}`,
    `L${x},${y + radius}`,
    `Q${x},${y} ${x + radius},${y}`,
    `L${x + w - radius},${y}`,
    `Q${x + w},${y} ${x + w},${y + radius}`,
    `L${x + w},${y + h}`,
    'Z',
  ].join(' ')
}

/** Caminho de retângulo com as duas pontas da direita arredondadas. */
function roundedRight(x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.max(0, Math.min(r, w, h / 2))
  return [
    `M${x},${y}`,
    `L${x + w - radius},${y}`,
    `Q${x + w},${y} ${x + w},${y + radius}`,
    `L${x + w},${y + h - radius}`,
    `Q${x + w},${y + h} ${x + w - radius},${y + h}`,
    `L${x},${y + h}`,
    'Z',
  ].join(' ')
}

/**
 * Escala "bonita" para o topo do eixo Y. Os degraus são finos o bastante (1, 2,
 * 4, 5, 6, 8, 10) para o topo não ficar muito acima do maior valor — com
 * degraus só de 1/2/5/10 uma nota de 748 empurraria o eixo até 1000 e a curva
 * viveria na metade de baixo do gráfico.
 */
function niceMax(value: number) {
  if (value <= 0) return 4
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)))
  const normalized = value / magnitude
  const step = [1, 2, 4, 5, 6, 8, 10].find((s) => normalized <= s) ?? 10
  return step * magnitude
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** "2026-07-05" → "5 jul" (sem passar por Date, que reinterpretaria o fuso). */
export function shortDate(key: string) {
  const [, m, d] = key.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]}`
}

export function fullDate(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Container + tabela equivalente
// ─────────────────────────────────────────────────────────────────────────────

export interface ChartTable {
  head: string[]
  rows: Array<Array<string | number>>
}

export function ChartCard({
  title,
  caption,
  table,
  legend,
  children,
  className,
  empty,
}: {
  title: string
  caption?: string
  table?: ChartTable
  legend?: React.ReactNode
  children: React.ReactNode
  className?: string
  empty?: React.ReactNode
}) {
  const [showTable, setShowTable] = useState(false)
  const tableId = useId()

  return (
    <figure className={cn('viz min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5', className)}>
      <figcaption className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-heading text-base font-semibold tracking-tight text-foreground">{title}</h3>
          {caption && <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{caption}</p>}
        </div>
        {table && !empty && (
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            aria-expanded={showTable}
            aria-controls={tableId}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {showTable ? <BarChart3 className="h-3 w-3" /> : <Table2 className="h-3 w-3" />}
            {showTable ? 'Ver gráfico' : 'Ver tabela'}
          </button>
        )}
      </figcaption>

      {empty ? (
        <div className="py-8 text-center text-sm text-muted-foreground">{empty}</div>
      ) : showTable && table ? (
        <div id={tableId} className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[280px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                {table.head.map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={cn(
                      'px-2 py-2 text-xs font-semibold text-muted-foreground',
                      i === 0 ? 'text-left' : 'text-right',
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-border/50 last:border-0">
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={cn(
                        'px-2 py-1.5',
                        ci === 0 ? 'text-left text-foreground' : 'text-right tabular-nums text-muted-foreground',
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          {legend && <div className="mb-3">{legend}</div>}
          {children}
        </>
      )}
    </figure>
  )
}

/** Legenda — obrigatória a partir de duas séries; espelha a marca do gráfico. */
export function Legend({
  items,
  shape = 'rect',
}: {
  items: Array<{ label: string; color: string }>
  shape?: 'rect' | 'line'
}) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            aria-hidden
            className={cn('shrink-0', shape === 'rect' ? 'h-2.5 w-2.5 rounded-[2px]' : 'h-0.5 w-4 rounded-full')}
            style={{ background: item.color }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

/** Escala do heatmap — o "legend" das rampas sequenciais. */
export function ScaleLegend({ from, to, steps }: { from: string; to: string; steps: string[] }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
      <span>{from}</span>
      <span className="flex gap-[3px]" aria-hidden>
        {steps.map((color) => (
          <span key={color} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: color }} />
        ))}
      </span>
      <span>{to}</span>
    </div>
  )
}

/** Tooltip flutuante. Textos entram como nós de texto — nada de innerHTML. */
function Tooltip({
  x,
  y,
  width,
  height,
  title,
  rows,
}: {
  x: number
  y: number
  width: number
  /** Altura da área do gráfico — usada para a caixa não sair pelo rodapé do card. */
  height: number
  title: string
  rows: Array<{ label: string; value: string; color?: string }>
}) {
  // Mantém a caixa dentro do container em vez de deixá-la vazar nas bordas.
  const flip = x > width - 130
  const boxHeight = 30 + rows.length * 20
  const top = Math.min(Math.max(0, y - 10), Math.max(0, height - boxHeight))
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-20 min-w-[124px] rounded-lg border border-border bg-popover px-2.5 py-2 shadow-lg"
      style={{
        left: flip ? undefined : x + 12,
        right: flip ? width - x + 12 : undefined,
        top,
      }}
    >
      <p className="mb-1 text-[11px] font-medium text-muted-foreground">{title}</p>
      {rows.map((row) => (
        <p key={row.label} className="flex items-center gap-1.5 text-xs leading-5">
          {row.color && (
            <span aria-hidden className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: row.color }} />
          )}
          <span className="font-semibold tabular-nums text-foreground">{row.value}</span>
          <span className="text-muted-foreground">{row.label}</span>
        </p>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat tile / medidor
// ─────────────────────────────────────────────────────────────────────────────

export function StatTile({
  label,
  value,
  hint,
  icon,
  spark,
}: {
  label: string
  value: string | number
  hint?: string
  icon?: React.ReactNode
  /** Série de 12 pontos, desenhada na cor de de-ênfase. */
  spark?: number[]
}) {
  const path = useMemo(() => {
    if (!spark || spark.length < 2) return null
    const max = Math.max(...spark, 1)
    const w = 72
    const h = 20
    return spark
      .map((v, i) => {
        const x = (i / (spark.length - 1)) * w
        const y = h - (v / max) * h
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  }, [spark])

  return (
    <div className="viz rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        {icon && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
            {icon}
          </span>
        )}
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="font-heading text-2xl font-semibold leading-none text-foreground">{value}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-[11px] leading-4 text-muted-foreground">{hint}</p>
        {path && (
          <svg width={72} height={20} viewBox="0 0 72 20" aria-hidden className="shrink-0 overflow-visible">
            <path d={path} fill="none" stroke="var(--viz-series-1)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.55} />
          </svg>
        )}
      </div>
    </div>
  )
}

/**
 * Medidor radial — a forma certa para "uma razão contra um limite".
 * A trilha vazia é um degrau mais claro da mesma rampa, então o estado se lê
 * ao longo do arco inteiro e não só na parte preenchida.
 */
export function AccuracyMeter({
  percent,
  size = 168,
  label,
  sublabel,
}: {
  percent: number
  size?: number
  label: string
  sublabel?: string
}) {
  const pct = Math.max(0, Math.min(100, percent))
  const stroke = 12
  const r = (size - stroke) / 2 - 2
  const cx = size / 2
  const cy = size / 2
  // Arco de 240° aberto embaixo — a abertura marca onde o valor começa.
  const startAngle = 150
  const sweep = 240
  const toXY = (angle: number) => {
    const rad = (angle * Math.PI) / 180
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
  }
  const arc = (fromDeg: number, toDeg: number) => {
    const [x1, y1] = toXY(fromDeg)
    const [x2, y2] = toXY(toDeg)
    const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0
    return `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large} 1 ${x2.toFixed(2)},${y2.toFixed(2)}`
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size * 0.82 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label}: ${pct}%`}>
          <path
            d={arc(startAngle, startAngle + sweep)}
            fill="none"
            stroke="var(--viz-track)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {pct > 0 && (
            <path
              d={arc(startAngle, startAngle + (sweep * pct) / 100)}
              fill="none"
              stroke="var(--viz-seq-5)"
              strokeWidth={stroke}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="absolute inset-x-0 flex flex-col items-center" style={{ top: size * 0.3 }}>
          <span className="font-heading text-4xl font-semibold leading-none text-foreground">{pct}%</span>
          <span className="mt-1.5 text-xs font-medium text-muted-foreground">{label}</span>
        </div>
      </div>
      {sublabel && <p className="-mt-1 text-center text-[11px] text-muted-foreground">{sublabel}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Colunas empilhadas — atividade diária
// ─────────────────────────────────────────────────────────────────────────────

export interface DailyPoint {
  date: string
  banco: number
  provas: number
}

/**
 * Atividade diária do perfil: banco embaixo, provas em cima.
 *
 * É um caso particular de `StackedDayColumns` — as duas séries e os rótulos já
 * escolhidos. Manter a assinatura antiga evita mexer na aba de desempenho, e
 * manter UMA implementação evita que os dois gráficos empilhados da plataforma
 * divirjam no vão entre segmentos ou na regra dos rótulos do eixo.
 */
export function ActivityColumns({ data }: { data: DailyPoint[] }) {
  return (
    <StackedDayColumns
      data={data.map((d) => ({ date: d.date, base: d.banco, topo: d.provas }))}
      base={{ label: 'no banco', color: 'var(--viz-series-1)' }}
      topo={{ label: 'em provas', color: 'var(--viz-series-2)' }}
      ariaLabel="Questões respondidas por dia nos últimos 30 dias"
    />
  )
}

export interface StackedDayPoint {
  date: string
  /** Segmento de baixo — encosta na linha de base. */
  base: number
  /** Segmento de cima — leva a ponta arredondada. */
  topo: number
}

/**
 * Colunas empilhadas por dia, com duas séries nomeadas por quem chama.
 *
 * O eixo do tempo é sempre o mesmo (30 dias, um rótulo a cada 7); o que muda é
 * o que está empilhado — questões por origem no perfil, acertos e erros no
 * banco.
 */
export function StackedDayColumns({
  data,
  base,
  topo,
  ariaLabel,
}: {
  data: StackedDayPoint[]
  base: { label: string; color: string }
  topo: { label: string; color: string }
  ariaLabel: string
}) {
  const { ref, width } = useChartWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)

  const padding = { top: 12, right: 8, bottom: 24, left: 30 }
  const height = 200
  const plotW = Math.max(1, width - padding.left - padding.right)
  const plotH = height - padding.top - padding.bottom

  const max = niceMax(Math.max(...data.map((d) => d.base + d.topo), 1))
  const band = plotW / Math.max(1, data.length)
  const barW = Math.min(24, Math.max(3, band * 0.62))
  const GAP = 2 // vão na cor da superfície entre os segmentos empilhados

  const ticks = [0, max / 2, max]
  const y = (v: number) => padding.top + plotH - (v / max) * plotH

  const point = hover != null ? data[hover] : null

  return (
    <div ref={ref} className={PLOT_BOX} style={{ minHeight: height }}>
      <svg width={width} height={height} role="img" aria-label={ariaLabel}>
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--viz-grid)"
              strokeWidth={1}
            />
            <text
              x={padding.left - 8}
              y={y(t) + 4}
              textAnchor="end"
              className="fill-muted-foreground text-[10px] tabular-nums"
            >
              {Math.round(t)}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const x = padding.left + i * band + (band - barW) / 2
          const total = d.base + d.topo
          const isHover = hover === i
          const baseH = (d.base / max) * plotH
          const topoH = (d.topo / max) * plotH
          // O segmento de cima leva a ponta arredondada; o de baixo encosta na base.
          const temTopo = d.topo > 0
          const topoY = y(total)
          const baseY = y(d.base)

          return (
            <g
              key={d.date}
              tabIndex={total > 0 ? 0 : -1}
              role={total > 0 ? 'button' : undefined}
              aria-label={
                total > 0
                  ? `${fullDate(d.date)}: ${d.base} ${base.label}, ${d.topo} ${topo.label}`
                  : undefined
              }
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="outline-none"
            >
              {/* Alvo de hover maior que a marca — a faixa inteira do dia. */}
              <rect
                x={padding.left + i * band}
                y={padding.top}
                width={band}
                height={plotH}
                fill="transparent"
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
              />
              {isHover && total > 0 && (
                <rect
                  x={padding.left + i * band}
                  y={padding.top}
                  width={band}
                  height={plotH}
                  fill="var(--viz-grid)"
                  opacity={0.45}
                  pointerEvents="none"
                />
              )}
              {d.topo > 0 && (
                <path
                  d={roundedTop(x, topoY, barW, Math.max(2, topoH - (d.base > 0 ? GAP : 0)), 4)}
                  fill={topo.color}
                  pointerEvents="none"
                />
              )}
              {d.base > 0 && (
                <path
                  d={
                    temTopo
                      ? `M${x},${baseY} h${barW} v${baseH} h${-barW} Z`
                      : roundedTop(x, baseY, barW, baseH, 4)
                  }
                  fill={base.color}
                  pointerEvents="none"
                />
              )}
            </g>
          )
        })}

        {/* Linha de base sólida */}
        <line
          x1={padding.left}
          x2={width - padding.right}
          y1={y(0)}
          y2={y(0)}
          stroke="var(--viz-axis)"
          strokeWidth={1}
        />

        {data.map((d, i) => {
          const isLast = i === data.length - 1
          // Um rótulo a cada 7 dias, mais a ponta. Se a ponta cair perto do
          // último rótulo periódico, ela substitui — senão os dois se sobrepõem.
          const lastPeriodic = Math.floor((data.length - 1) / 7) * 7
          const tooCloseToEnd = data.length - 1 - i < 3
          if (isLast ? lastPeriodic === data.length - 1 : i % 7 !== 0 || tooCloseToEnd) return null
          return (
            <text
              key={`t-${d.date}`}
              x={padding.left + i * band + band / 2}
              y={height - 6}
              textAnchor={isLast ? 'end' : 'middle'}
              className="fill-muted-foreground text-[10px]"
            >
              {shortDate(d.date)}
            </text>
          )
        })}
      </svg>

      {point && point.base + point.topo > 0 && (
        <Tooltip
          x={padding.left + (hover as number) * band + band / 2}
          y={y(point.base + point.topo)}
          width={width}
          height={height}
          title={fullDate(point.date)}
          rows={[
            { label: topo.label, value: String(point.topo), color: topo.color },
            { label: base.label, value: String(point.base), color: base.color },
          ]}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Mapa de constância (heatmap sequencial)
// ─────────────────────────────────────────────────────────────────────────────

const WEEKDAY_INITIALS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export function ConsistencyHeatmap({ data }: { data: Array<{ date: string; total: number }> }) {
  const { ref, width } = useChartWidth<HTMLDivElement>()
  const [hover, setHover] = useState<{ index: number; x: number; y: number } | null>(null)

  const labelW = 18
  const weeks = Math.ceil(data.length / 7)
  const gap = 3
  const cell = Math.max(9, Math.min(16, Math.floor((width - labelW - (weeks - 1) * gap) / weeks)))
  const height = 7 * cell + 6 * gap + 16

  // Escala sequencial por quantis — evita que um dia atípico achate o resto.
  const positives = data.filter((d) => d.total > 0).map((d) => d.total).sort((a, b) => a - b)
  const q = (p: number) => (positives.length ? positives[Math.min(positives.length - 1, Math.floor(positives.length * p))] : 0)
  const cuts = [q(0.25), q(0.5), q(0.75), q(0.92)]

  const stepOf = (total: number) => {
    if (total <= 0) return 'var(--viz-seq-0)'
    if (total <= cuts[0]) return 'var(--viz-seq-1)'
    if (total <= cuts[1]) return 'var(--viz-seq-2)'
    if (total <= cuts[2]) return 'var(--viz-seq-3)'
    if (total <= cuts[3]) return 'var(--viz-seq-4)'
    return 'var(--viz-seq-5)'
  }

  // A primeira coluna começa no domingo da semana mais antiga da fatia.
  const firstWeekday = (() => {
    const [y, m, d] = data[0].date.split('-').map(Number)
    return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  })()

  const point = hover ? data[hover.index] : null

  return (
    <div ref={ref} className={PLOT_BOX} style={{ minHeight: height }}>
      <svg width={width} height={height} role="img" aria-label="Mapa de constância dos últimos meses">
        {WEEKDAY_INITIALS.map((initial, row) =>
          row % 2 === 1 ? (
            <text
              key={row}
              x={0}
              y={row * (cell + gap) + cell / 2 + 3}
              className="fill-muted-foreground text-[9px]"
            >
              {initial}
            </text>
          ) : null,
        )}

        {data.map((d, i) => {
          const offset = i + firstWeekday
          const col = Math.floor(offset / 7)
          const row = offset % 7
          const x = labelW + col * (cell + gap)
          const y = row * (cell + gap)
          const active = hover?.index === i
          return (
            <rect
              key={d.date}
              x={x}
              y={y}
              width={cell}
              height={cell}
              rx={2.5}
              fill={stepOf(d.total)}
              stroke={active ? 'var(--viz-seq-5)' : 'none'}
              strokeWidth={active ? 1.5 : 0}
              tabIndex={-1}
              onPointerEnter={() => setHover({ index: i, x: x + cell / 2, y })}
              onPointerLeave={() => setHover(null)}
            >
              <title>{`${fullDate(d.date)}: ${d.total} ${d.total === 1 ? 'questão' : 'questões'}`}</title>
            </rect>
          )
        })}
      </svg>

      {point && (
        <Tooltip
          x={hover!.x}
          y={hover!.y}
          width={width}
          height={height}
          title={fullDate(point.date)}
          rows={[{ label: point.total === 1 ? 'questão' : 'questões', value: String(point.total) }]}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Barras horizontais — aproveitamento por categoria
// ─────────────────────────────────────────────────────────────────────────────

export function AccuracyBars({
  data,
  colorVar = 'var(--viz-seq-4)',
}: {
  /** `color` só é usado quando as categorias são ordenadas (fácil → difícil). */
  data: Array<{ label: string; value: number; total: number; acertos: number; color?: string }>
  colorVar?: string
}) {
  const { ref, width } = useChartWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)

  const labelW = Math.min(112, Math.max(72, Math.round(width * 0.26)))
  const valueW = 40
  const rowH = 30
  const barH = 14
  const plotW = Math.max(20, width - labelW - valueW)
  const height = data.length * rowH

  const point = hover != null ? data[hover] : null

  return (
    <div ref={ref} className={PLOT_BOX} style={{ minHeight: height }}>
      <svg width={width} height={height} role="img" aria-label="Aproveitamento por categoria">
        {data.map((d, i) => {
          const y = i * rowH
          const barY = y + (rowH - barH) / 2
          const w = Math.max(2, (d.value / 100) * plotW)
          return (
            <g
              key={d.label}
              tabIndex={0}
              role="button"
              aria-label={`${d.label}: ${d.value}% de acerto, ${d.acertos} de ${d.total}`}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
              className="outline-none"
            >
              <rect x={0} y={y} width={width} height={rowH} fill="transparent" />
              <text x={0} y={y + rowH / 2 + 4} className="fill-foreground text-[11px]">
                {d.label.length > 16 ? `${d.label.slice(0, 15)}…` : d.label}
              </text>
              {/* Trilha: degrau mais claro da mesma rampa, não um cinza avulso. */}
              <rect x={labelW} y={barY} width={plotW} height={barH} rx={4} fill="var(--viz-track)" />
              <path
                d={roundedRight(labelW, barY, w, barH, 4)}
                fill={d.color || colorVar}
                opacity={hover == null || hover === i ? 1 : 0.55}
              />
              <text
                x={width}
                y={y + rowH / 2 + 4}
                textAnchor="end"
                className="fill-foreground text-[11px] font-semibold tabular-nums"
              >
                {d.value}%
              </text>
            </g>
          )
        })}
      </svg>

      {point && (
        <Tooltip
          x={labelW + (point.value / 100) * plotW}
          y={(hover as number) * rowH}
          width={width}
          height={height}
          title={point.label}
          rows={[
            { label: 'de acerto', value: `${point.value}%` },
            { label: `de ${point.total}`, value: String(point.acertos) },
          ]}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Linha — evolução das notas
// ─────────────────────────────────────────────────────────────────────────────

export function ScoreTrend({ data }: { data: Array<{ date: string; tri: number }> }) {
  const { ref, width } = useChartWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)

  const padding = { top: 16, right: 44, bottom: 24, left: 32 }
  const height = 200
  const plotW = Math.max(1, width - padding.left - padding.right)
  const plotH = height - padding.top - padding.bottom

  const times = data.map((d) => new Date(d.date).getTime())
  const tMin = Math.min(...times)
  const tMax = Math.max(...times)
  const span = tMax - tMin || 1
  const max = niceMax(Math.max(...data.map((d) => d.tri), 100))

  const x = (i: number) => (data.length === 1 ? padding.left + plotW / 2 : padding.left + ((times[i] - tMin) / span) * plotW)
  const y = (v: number) => padding.top + plotH - (v / max) * plotH

  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.tri).toFixed(1)}`).join(' ')
  const areaPath = `${path} L${x(data.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`
  const ticks = [0, max / 2, max]
  const last = data.length - 1

  const onMove = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const px = event.clientX - rect.left
      // Crosshair encosta no ponto mais próximo — ninguém mira numa linha de 2px.
      let nearest = 0
      let best = Infinity
      for (let i = 0; i < data.length; i++) {
        const distance = Math.abs(x(i) - px)
        if (distance < best) {
          best = distance
          nearest = i
        }
      }
      setHover(nearest)
    },
    [data, width],
  )

  const point = hover != null ? data[hover] : null

  return (
    <div ref={ref} className={PLOT_BOX} style={{ minHeight: height }}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label="Evolução da nota TRI ao longo do tempo"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padding.left} x2={width - padding.right} y1={y(t)} y2={y(t)} stroke="var(--viz-grid)" strokeWidth={1} />
            <text x={padding.left - 8} y={y(t) + 4} textAnchor="end" className="fill-muted-foreground text-[10px] tabular-nums">
              {Math.round(t)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="var(--viz-series-1)" opacity={0.1} />
        <path d={path} fill="none" stroke="var(--viz-series-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {hover != null && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={padding.top}
            y2={padding.top + plotH}
            stroke="var(--viz-axis)"
            strokeWidth={1}
          />
        )}

        {data.map((d, i) => (
          <circle
            key={`${d.date}-${i}`}
            cx={x(i)}
            cy={y(d.tri)}
            r={hover === i ? 5.5 : 4}
            fill="var(--viz-series-1)"
            stroke="var(--viz-surface)"
            strokeWidth={2}
          />
        ))}

        {/* Rótulo direto só na ponta — nunca um número em cada ponto. */}
        <text
          x={x(last) + 10}
          y={y(data[last].tri) + 4}
          className="fill-foreground text-[11px] font-semibold tabular-nums"
        >
          {data[last].tri}
        </text>

        <line x1={padding.left} x2={width - padding.right} y1={y(0)} y2={y(0)} stroke="var(--viz-axis)" strokeWidth={1} />
        <text x={padding.left} y={height - 6} className="fill-muted-foreground text-[10px]">
          {shortDate(new Date(tMin).toISOString().slice(0, 10))}
        </text>
        {data.length > 1 && (
          <text x={width - padding.right} y={height - 6} textAnchor="end" className="fill-muted-foreground text-[10px]">
            {shortDate(new Date(tMax).toISOString().slice(0, 10))}
          </text>
        )}
      </svg>

      {point && (
        <Tooltip
          x={x(hover as number)}
          y={y(point.tri)}
          width={width}
          height={height}
          title={new Date(point.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
          rows={[{ label: 'nota TRI', value: String(point.tri), color: 'var(--viz-series-1)' }]}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Colunas por dia da semana
// ─────────────────────────────────────────────────────────────────────────────

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function WeekdayColumns({ data }: { data: Array<{ weekday: number; total: number }> }) {
  const { ref, width } = useChartWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)

  const padding = { top: 14, right: 4, bottom: 22, left: 4 }
  const height = 150
  const plotW = Math.max(1, width - padding.left - padding.right)
  const plotH = height - padding.top - padding.bottom
  const max = niceMax(Math.max(...data.map((d) => d.total), 1))
  const band = plotW / 7
  const barW = Math.min(24, band * 0.55)
  const best = data.reduce((acc, d) => (d.total > acc.total ? d : acc), data[0])

  return (
    <div ref={ref} className={PLOT_BOX} style={{ minHeight: height }}>
      <svg width={width} height={height} role="img" aria-label="Questões respondidas por dia da semana">
        {data.map((d, i) => {
          const x = padding.left + i * band + (band - barW) / 2
          const h = (d.total / max) * plotH
          const y = padding.top + plotH - h
          // Ênfase: o dia mais forte na cor cheia, o resto recuado.
          const isBest = d.weekday === best.weekday && best.total > 0
          return (
            <g
              key={d.weekday}
              tabIndex={0}
              role="button"
              aria-label={`${WEEKDAY_LABELS[d.weekday]}: ${d.total} questões`}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
              className="outline-none"
            >
              <rect x={padding.left + i * band} y={padding.top} width={band} height={plotH} fill="transparent" />
              {d.total > 0 && (
                <path
                  d={roundedTop(x, y, barW, h, 4)}
                  fill={isBest ? 'var(--viz-seq-5)' : 'var(--viz-seq-3)'}
                  opacity={hover == null || hover === i ? 1 : 0.6}
                />
              )}
              {(isBest || hover === i) && d.total > 0 && (
                <text
                  x={x + barW / 2}
                  y={y - 5}
                  textAnchor="middle"
                  className="fill-foreground text-[10px] font-semibold tabular-nums"
                >
                  {d.total}
                </text>
              )}
              <text
                x={padding.left + i * band + band / 2}
                y={height - 6}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {WEEKDAY_LABELS[d.weekday]}
              </text>
            </g>
          )
        })}
        <line
          x1={padding.left}
          x2={width - padding.right}
          y1={padding.top + plotH}
          y2={padding.top + plotH}
          stroke="var(--viz-axis)"
          strokeWidth={1}
        />
      </svg>
    </div>
  )
}
