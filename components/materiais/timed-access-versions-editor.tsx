'use client'

/**
 * Editor das versões de acesso por tempo limitado (admin).
 *
 * Cada versão é uma segunda forma de vender o MESMO conteúdo: preço menor,
 * prazo definido, sem download. O acesso vitalício continua sendo o preço
 * principal do material/pacote — estas versões são opcionais.
 *
 * O prazo é montado somando cinco unidades (minutos, horas, dias, meses e
 * anos). Meses e anos são de calendário: "1 mês" a partir de 31/01 termina em
 * 28/02, não em 30 dias corridos.
 */

import { useMemo } from 'react'
import { Clock, Plus, Sparkles, Trash2, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  DURATION_LIMITS,
  MAX_TIMED_ACCESS_VERSIONS,
  computeAccessExpiry,
  formatAccessDate,
  formatDuration,
  hasDuration,
  versionDuration,
  type TimedAccessDuration,
  type TimedAccessVersion,
} from '@/lib/material-timed-access'

export interface TimedAccessVersionForm extends TimedAccessVersion {}

/** As cinco unidades, na ordem em que aparecem no formulário. */
const UNIT_FIELDS: Array<{
  field: 'durationYears' | 'durationMonths' | 'durationDays' | 'durationHours' | 'durationMinutes'
  unit: keyof TimedAccessDuration
  label: string
  width: string
}> = [
  { field: 'durationYears', unit: 'years', label: 'anos', width: 'w-14' },
  { field: 'durationMonths', unit: 'months', label: 'meses', width: 'w-14' },
  { field: 'durationDays', unit: 'days', label: 'dias', width: 'w-16' },
  { field: 'durationHours', unit: 'hours', label: 'horas', width: 'w-14' },
  { field: 'durationMinutes', unit: 'minutes', label: 'min', width: 'w-16' },
]

/** Atalhos que cobrem quase todos os casos reais de venda por tempo. */
const PRESETS: Array<{ label: string; duration: Partial<TimedAccessDuration> }> = [
  { label: '30 minutos', duration: { minutes: 30 } },
  { label: '2 horas', duration: { hours: 2 } },
  { label: '24 horas', duration: { hours: 24 } },
  { label: '7 dias', duration: { days: 7 } },
  { label: '30 dias', duration: { days: 30 } },
  { label: '3 meses', duration: { months: 3 } },
  { label: '6 meses', duration: { months: 6 } },
  { label: '1 ano', duration: { years: 1 } },
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
  const list = useMemo(() => versions || [], [versions])

  const update = (id: string, patch: Partial<TimedAccessVersionForm>) => {
    onChange(list.map((version) => (version.id === id ? { ...version, ...patch } : version)))
  }

  const add = (preset?: { label: string; duration: Partial<TimedAccessDuration> }) => {
    if (list.length >= MAX_TIMED_ACCESS_VERSIONS) return
    const duration = {
      years: 0,
      months: 0,
      days: preset ? 0 : 30,
      hours: 0,
      minutes: 0,
      ...(preset?.duration || {}),
    }
    onChange([
      ...list,
      {
        id: newId(),
        label: preset ? `Acesso ${preset.label}` : 'Acesso temporário',
        description: '',
        price: fullPrice > 0 ? Math.max(1, Math.round(fullPrice * 0.4 * 100) / 100) : 0,
        durationYears: duration.years,
        durationMonths: duration.months,
        durationDays: duration.days,
        durationHours: duration.hours,
        durationMinutes: duration.minutes,
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
      const name = version.label?.trim() || 'Sem nome'
      if (!version.label?.trim()) messages.push('Uma versão está sem nome e será descartada ao salvar.')
      if (!hasDuration(versionDuration(version))) {
        messages.push(`"${name}" está sem duração e será descartada ao salvar.`)
      }
      if (version.price <= 0) messages.push(`"${name}" está com preço zero — ela seria entregue de graça.`)
      if (fullPrice > 0 && version.price >= fullPrice) {
        messages.push(`"${name}" custa o mesmo (ou mais) que o acesso vitalício — ninguém escolheria a versão temporária.`)
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
            Venda o mesmo {itemLabel} por um preço menor, válido por um prazo que você monta somando{' '}
            <strong className="text-foreground">minutos, horas, dias, meses e anos</strong>.{' '}
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
            Comece por um prazo pronto — você ajusta nome, unidades e preço depois.
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
            const duration = versionDuration(version)
            const filled = hasDuration(duration)
            const discount = fullPrice > 0 && version.price > 0
              ? Math.round((1 - version.price / fullPrice) * 100)
              : 0
            // Exemplo concreto: ativando agora, o acesso terminaria quando.
            const sampleEnd = filled ? formatAccessDate(computeAccessExpiry(new Date(), duration)) : ''
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

                {/* Duração: as cinco unidades somam o prazo total. */}
                <div className="mt-2 flex flex-wrap items-end gap-2 rounded-lg border border-border/60 bg-muted/30 p-2">
                  {UNIT_FIELDS.map(({ field, unit, label, width }) => (
                    <label key={field} className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {label}
                      </span>
                      <Input
                        type="number"
                        min={0}
                        max={DURATION_LIMITS[unit]}
                        value={Number(version[field] ?? 0)}
                        onChange={(e) =>
                          update(version.id, {
                            [field]: Math.min(
                              DURATION_LIMITS[unit],
                              Math.max(0, parseInt(e.target.value) || 0)
                            ),
                          } as Partial<TimedAccessVersionForm>)
                        }
                        className={`h-8 ${width} text-sm`}
                      />
                    </label>
                  ))}
                  <span className="pb-1 text-[11px] text-muted-foreground">
                    {filled ? (
                      <>= <strong className="text-foreground">{formatDuration(duration)}</strong></>
                    ) : (
                      'preencha ao menos uma unidade'
                    )}
                  </span>
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
                  {filled ? (
                    <>
                      Libera por <strong className="text-foreground">{formatDuration(duration)}</strong> a partir da
                      ativação, por <strong className="text-foreground">{fmtBRL(version.price)}</strong>
                      {discount > 0 && fullPrice > 0 ? ` (${discount}% abaixo do acesso vitalício de ${fmtBRL(fullPrice)})` : ''}
                      . Sem download. Ativando agora, terminaria em {sampleEnd}.
                    </>
                  ) : (
                    'Defina minutos, horas, dias, meses e/ou anos para esta versão valer.'
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
