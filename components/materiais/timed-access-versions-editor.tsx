'use client'

/**
 * Editor das versões de acesso por tempo limitado (admin).
 *
 * Cada versão é uma segunda forma de vender o MESMO conteúdo: preço menor,
 * prazo definido, sem download. O acesso vitalício continua sendo o preço
 * principal do material/pacote — estas versões são opcionais.
 */

import { useMemo } from 'react'
import { Clock, Plus, Sparkles, Trash2, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  MAX_TIMED_ACCESS_VERSIONS,
  formatDurationMinutes,
  type TimedAccessVersion,
} from '@/lib/material-timed-access'

export interface TimedAccessVersionForm extends TimedAccessVersion {}

/** Atalhos que cobrem quase todos os casos reais de venda por tempo. */
const PRESETS: Array<{ label: string; days: number; hours: number }> = [
  { label: '24 horas', days: 0, hours: 24 },
  { label: '7 dias', days: 7, hours: 0 },
  { label: '15 dias', days: 15, hours: 0 },
  { label: '30 dias', days: 30, hours: 0 },
  { label: '90 dias', days: 90, hours: 0 },
  { label: '180 dias', days: 180, hours: 0 },
]

function newId() {
  return `tav-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function fmtBRL(value: number) {
  return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`
}

export function TimedAccessVersionsEditor({
  versions,
  onChange,
  fullPrice,
  itemLabel,
  hasPdf,
}: {
  versions: TimedAccessVersionForm[]
  onChange: (versions: TimedAccessVersionForm[]) => void
  /** Preço do acesso vitalício, para comparar e alertar sobre versões caras. */
  fullPrice: number
  /** "material" ou "pacote" — usado só nos textos. */
  itemLabel: 'material' | 'pacote'
  /** Quando falso, o aviso explica que o limite é só de tempo (sem PDF). */
  hasPdf?: boolean
}) {
  const list = versions || []

  const totalMinutesOf = (version: TimedAccessVersionForm) =>
    Math.max(0, Math.floor(version.durationDays || 0)) * 24 * 60 +
    Math.max(0, Math.floor(version.durationHours || 0)) * 60

  const update = (id: string, patch: Partial<TimedAccessVersionForm>) => {
    onChange(list.map((version) => (version.id === id ? { ...version, ...patch } : version)))
  }

  const add = (preset?: { label: string; days: number; hours: number }) => {
    if (list.length >= MAX_TIMED_ACCESS_VERSIONS) return
    onChange([
      ...list,
      {
        id: newId(),
        label: preset ? `Acesso ${preset.label}` : 'Acesso temporário',
        description: '',
        price: fullPrice > 0 ? Math.max(1, Math.round(fullPrice * 0.4 * 100) / 100) : 0,
        durationDays: preset?.days ?? 30,
        durationHours: preset?.hours ?? 0,
        isActive: true,
        highlight: false,
        order: list.length,
      },
    ])
  }

  const remove = (id: string) => onChange(list.filter((version) => version.id !== id))

  const problems = useMemo(() => {
    const messages: string[] = []
    for (const version of list) {
      if (!version.label?.trim()) messages.push('Uma versão está sem nome e será descartada ao salvar.')
      if (totalMinutesOf(version) <= 0) messages.push(`"${version.label || 'Sem nome'}" está sem duração e será descartada ao salvar.`)
      if (version.price <= 0) messages.push(`"${version.label || 'Sem nome'}" está com preço zero — ela seria entregue de graça.`)
      if (fullPrice > 0 && version.price >= fullPrice) {
        messages.push(`"${version.label}" custa o mesmo (ou mais) que o acesso vitalício — ninguém escolheria a versão temporária.`)
      }
    }
    return Array.from(new Set(messages))
  }, [list, fullPrice])

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            <Clock className="h-4 w-4 text-sky-500" />
            Versões de acesso por tempo
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              opcional
            </span>
          </span>
          <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
            Venda o mesmo {itemLabel} por um preço menor, válido por um prazo.{' '}
            {hasPdf === false
              ? 'Este conteúdo não tem PDF, então a versão apenas limita o período de uso.'
              : 'Quem compra por tempo lê no visualizador protegido e não pode baixar o PDF.'}{' '}
            <strong className="text-foreground">A contagem só começa quando a Serial Key é ativada.</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={() => add()}
          disabled={list.length >= MAX_TIMED_ACCESS_VERSIONS}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/5 px-3 py-1.5 text-xs font-medium text-sky-600 hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-40 dark:text-sky-400"
        >
          <Plus className="h-3.5 w-3.5" /> Nova versão
        </button>
      </div>

      {list.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-background/60 p-3">
          <p className="mb-2 text-[11px] text-muted-foreground">
            Comece por um prazo pronto — você ajusta nome e preço depois.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => add(preset)}
                className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium hover:border-sky-500/40 hover:text-sky-600 dark:hover:text-sky-400"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {list.length > 0 && (
        <div className="space-y-2">
          {list.map((version, index) => {
            const minutes = totalMinutesOf(version)
            const discount = fullPrice > 0 && version.price > 0
              ? Math.round((1 - version.price / fullPrice) * 100)
              : 0
            return (
              <div
                key={version.id}
                className={`rounded-lg border p-2.5 transition-colors ${
                  version.isActive === false
                    ? 'border-border bg-background/40 opacity-60'
                    : 'border-sky-500/25 bg-background'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-[11px] font-bold text-sky-600 dark:text-sky-400">
                    {index + 1}
                  </span>
                  <Input
                    value={version.label}
                    onChange={(e) => update(version.id, { label: e.target.value })}
                    placeholder="Nome da versão (ex.: Acesso 30 dias)"
                    className="h-8 min-w-[180px] flex-1 text-sm"
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      value={version.durationDays}
                      onChange={(e) => update(version.id, { durationDays: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="h-8 w-16 text-sm"
                    />
                    <span className="text-[11px] text-muted-foreground">dias</span>
                    <Input
                      type="number"
                      min={0}
                      max={23}
                      value={version.durationHours}
                      onChange={(e) => update(version.id, { durationHours: Math.min(23, Math.max(0, parseInt(e.target.value) || 0)) })}
                      className="h-8 w-14 text-sm"
                    />
                    <span className="text-[11px] text-muted-foreground">h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={version.price}
                      onChange={(e) => update(version.id, { price: Math.max(0, parseFloat(e.target.value) || 0) })}
                      className="h-8 w-24 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(version.id)}
                    title="Remover versão"
                    className="rounded-lg border border-red-500/30 p-1.5 text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <Input
                    value={version.description || ''}
                    onChange={(e) => update(version.id, { description: e.target.value })}
                    placeholder="Frase de apoio (opcional) — ex.: ideal para a semana de prova"
                    className="h-8 min-w-[220px] flex-1 text-xs"
                  />
                  <label className="flex cursor-pointer items-center gap-1.5 text-[11px]">
                    <input
                      type="checkbox"
                      checked={version.isActive !== false}
                      onChange={(e) => update(version.id, { isActive: e.target.checked })}
                      className="rounded"
                    />
                    Publicada
                  </label>
                  <label className="flex cursor-pointer items-center gap-1.5 text-[11px]">
                    <input
                      type="checkbox"
                      checked={version.highlight === true}
                      onChange={(e) => update(version.id, { highlight: e.target.checked })}
                      className="rounded"
                    />
                    <Sparkles className="h-3 w-3 text-amber-500" /> Recomendada
                  </label>
                </div>

                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {minutes > 0 ? (
                    <>
                      Libera por <strong className="text-foreground">{formatDurationMinutes(minutes)}</strong> a partir da ativação, por{' '}
                      <strong className="text-foreground">{fmtBRL(version.price)}</strong>
                      {discount > 0 && fullPrice > 0 ? ` (${discount}% abaixo do acesso vitalício de ${fmtBRL(fullPrice)})` : ''}
                      . Sem download.
                    </>
                  ) : (
                    'Defina dias e/ou horas para esta versão valer.'
                  )}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {problems.length > 0 && (
        <ul className="mt-2 space-y-1">
          {problems.map((problem) => (
            <li key={problem} className="flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              {problem}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
