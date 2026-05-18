'use client'

import { useEffect, useState } from 'react'
import { Calendar } from 'lucide-react'

interface Option {
  id: string
  name: string
  eventDate: string
  isActive: boolean
  daysUntilEvent: number
  activeDiscountPercent: number
}

export function PricingEventSelector({
  value,
  onChange,
  label = 'Lote dinâmico por evento',
  hint = 'Aplica desconto progressivo conforme a data se aproxima. Use "Maior dos dois" — vence o melhor entre lote e cupom.',
}: {
  value: string | null
  onChange: (eventId: string | null) => void
  label?: string
  hint?: string
}) {
  const [options, setOptions] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/pricing-events/options', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { options: [] }))
      .then((data) => setOptions(data.options || []))
      .catch(() => setOptions([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-300">
        <Calendar className="h-3.5 w-3.5 text-emerald-400" />
        {label}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={loading}
        className="w-full rounded-md border border-slate-600/40 bg-slate-800/40 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400/60 focus:outline-none disabled:opacity-50"
      >
        <option value="">— Sem lote dinâmico —</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
            {opt.isActive ? '' : ' (inativo)'}
            {opt.activeDiscountPercent > 0 ? ` · −${opt.activeDiscountPercent}% agora` : ''}
            {opt.daysUntilEvent >= 0 ? ` · ${opt.daysUntilEvent}d` : ' · passado'}
          </option>
        ))}
      </select>
      {hint ? <p className="mt-1 text-[11px] text-slate-400">{hint}</p> : null}
    </div>
  )
}

export default PricingEventSelector
