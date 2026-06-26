'use client'

import { useMemo, useState } from 'react'
import { Search, Shuffle, X } from 'lucide-react'
import type { ResolvedTheme } from '@/lib/raffle-shared'
import { pad } from '@/lib/raffle-shared'

interface NumberGridProps {
  totalNumbers: number
  soldNumbers: number[]
  reservedNumbers: number[]
  selected: number[]
  onChange: (selected: number[]) => void
  theme: ResolvedTheme
  disabled?: boolean
}

const PAGE_SIZE = 120

/**
 * Grid de números paginado. Renderiza no máximo PAGE_SIZE células por vez para
 * suportar rifas com dezenas de milhares de números sem travar o navegador.
 */
export function NumberGrid({
  totalNumbers,
  soldNumbers,
  reservedNumbers,
  selected,
  onChange,
  theme,
  disabled,
}: NumberGridProps) {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')

  const soldSet = useMemo(() => new Set(soldNumbers), [soldNumbers])
  const reservedSet = useMemo(() => new Set(reservedNumbers), [reservedNumbers])
  const selectedSet = useMemo(() => new Set(selected), [selected])

  const totalPages = Math.ceil(totalNumbers / PAGE_SIZE)
  const start = page * PAGE_SIZE + 1
  const end = Math.min(totalNumbers, (page + 1) * PAGE_SIZE)

  const cells = useMemo(() => {
    const arr: number[] = []
    for (let n = start; n <= end; n++) arr.push(n)
    return arr
  }, [start, end])

  const radius = theme.gridStyle === 'square' ? '4px' : theme.gridStyle === 'pill' ? '999px' : '8px'

  function toggle(n: number) {
    if (disabled) return
    if (soldSet.has(n) || reservedSet.has(n)) return
    if (selectedSet.has(n)) {
      onChange(selected.filter(x => x !== n))
    } else {
      onChange([...selected, n].sort((a, b) => a - b))
    }
  }

  function quickPick(qty: number) {
    if (disabled) return
    const available: number[] = []
    for (let n = 1; n <= totalNumbers; n++) {
      if (!soldSet.has(n) && !reservedSet.has(n) && !selectedSet.has(n)) available.push(n)
      if (available.length > qty * 30) break // amostra suficiente
    }
    // embaralha amostra e pega qty
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[available[i], available[j]] = [available[j], available[i]]
    }
    const picked = available.slice(0, qty)
    onChange([...selected, ...picked].sort((a, b) => a - b))
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const num = parseInt(search.replace(/\D/g, ''), 10)
    if (!num || num < 1 || num > totalNumbers) return
    setPage(Math.floor((num - 1) / PAGE_SIZE))
  }

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" style={{ color: theme.primaryColor }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              inputMode="numeric"
              placeholder="Buscar número..."
              className="w-full rounded-lg pl-9 pr-3 py-2 text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${theme.primaryColor}33`, color: theme.light ? '#111' : '#fff' }}
            />
          </div>
        </form>
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-60" style={{ color: theme.light ? '#333' : '#fff' }}>Surpresinha:</span>
          {[1, 5, 10].map(q => (
            <button
              key={q}
              type="button"
              onClick={() => quickPick(q)}
              disabled={disabled}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-40"
              style={{ background: `${theme.primaryColor}22`, border: `1px solid ${theme.primaryColor}55`, color: theme.primaryColor }}
            >
              <Shuffle size={12} /> +{q}
            </button>
          ))}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] sm:text-xs" style={{ color: theme.light ? '#444' : 'rgba(255,255,255,0.65)' }}>
        <Legend color={theme.light ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)'} label="Disponível" border={theme.light ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.14)'} />
        <Legend color={theme.primaryColor} label="Selecionado" />
        <Legend color={theme.light ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.16)'} label="Reservado" border={theme.light ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.24)'} />
        <Legend color={theme.light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)'} label="Vendido" border="transparent" />
      </div>

      {/* Grid */}
      <div
        className="grid gap-1 sm:gap-1.5"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(2.5rem, 1fr))' }}
      >
        {cells.map(n => {
          const isSold = soldSet.has(n)
          const isReserved = reservedSet.has(n)
          const isSelected = selectedSet.has(n)
          const taken = isSold || isReserved

          // Paleta sóbria e uniforme: disponíveis discretos, selecionado em
          // destaque limpo (sem brilho/glow), tomados apenas esmaecidos.
          let bg = theme.light ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)'
          let color = theme.light ? '#374151' : 'rgba(255,255,255,0.8)'
          let border = theme.light ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)'
          let strike = false
          if (isSelected) {
            bg = theme.primaryColor
            color = theme.light ? '#ffffff' : '#08130d'
            border = `1px solid ${theme.primaryColor}`
          } else if (isSold) {
            bg = theme.light ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.035)'
            color = theme.light ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.28)'
            border = '1px solid transparent'
            strike = true
          } else if (isReserved) {
            bg = theme.light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'
            color = theme.light ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.55)'
            border = theme.light ? '1px dashed rgba(0,0,0,0.25)' : '1px dashed rgba(255,255,255,0.3)'
          }

          return (
            <button
              key={n}
              type="button"
              onClick={() => toggle(n)}
              disabled={disabled || taken}
              title={taken ? (isSold ? 'Vendido' : 'Reservado') : `Número ${pad(n, totalNumbers)}`}
              className="flex aspect-square items-center justify-center text-[10px] font-semibold tabular-nums transition-colors duration-100 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed sm:text-[11px]"
              style={{
                background: bg,
                color,
                border,
                borderRadius: radius,
                textDecoration: strike ? 'line-through' : 'none',
                outline: isSelected ? `2px solid ${theme.primaryColor}55` : 'none',
                outlineOffset: isSelected ? '1px' : '0',
              }}
            >
              {pad(n, totalNumbers)}
            </button>
          )
        })}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-30"
            style={{ background: `${theme.primaryColor}1a`, color: theme.primaryColor }}
          >
            ← Anterior
          </button>
          <span className="text-xs opacity-70" style={{ color: theme.light ? '#333' : '#fff' }}>
            {start}–{end} de {totalNumbers}
          </span>
          <button
            type="button"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-30"
            style={{ background: `${theme.primaryColor}1a`, color: theme.primaryColor }}
          >
            Próxima →
          </button>
        </div>
      )}

      {/* Selecionados */}
      {selected.length > 0 && (
        <div className="rounded-xl p-3" style={{ background: `${theme.primaryColor}12`, border: `1px solid ${theme.primaryColor}33` }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.primaryColor }}>
              {selected.length} número(s) selecionado(s)
            </span>
            <button type="button" onClick={() => onChange([])} className="text-xs opacity-70 hover:opacity-100 inline-flex items-center gap-1" style={{ color: theme.light ? '#333' : '#fff' }}>
              <X size={12} /> Limpar
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selected.map(n => (
              <button
                key={n}
                type="button"
                onClick={() => toggle(n)}
                className="rounded-md px-2 py-0.5 text-xs font-bold"
                style={{ background: theme.primaryColor, color: theme.light ? '#fff' : '#08130d' }}
              >
                {pad(n, totalNumbers)} ✕
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Legend({ color, label, border }: { color: string; label: string; border?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block w-3.5 h-3.5 rounded" style={{ background: color, border: border ? `1px solid ${border}` : 'none' }} />
      {label}
    </span>
  )
}
