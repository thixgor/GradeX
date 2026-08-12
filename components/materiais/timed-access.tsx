'use client'

/**
 * Superfícies de acesso por tempo limitado para o usuário.
 *
 * Três papéis, sempre com a mesma linguagem:
 *  - antes de comprar → `TimedAccessOptions` (escolher a versão) e
 *    `TimedAccessNotice` (a regra, no checkout/comprovante);
 *  - depois de comprar → `TimedAccessBanner` e `TimedAccessPill`, que mostram
 *    quanto tempo ainda resta, com contagem viva.
 */

import { useEffect, useMemo, useState } from 'react'
import { Clock, Download, Hourglass, Info, Plus, ShieldCheck, Sparkles } from 'lucide-react'
import { computeAccessExpiry, formatAccessDate } from '@/lib/material-timed-access'

export interface TimedAccessVersionView {
  id: string
  label: string
  description?: string
  price: number
  /** Prazo em unidades de calendário (anos/meses/dias/horas/minutos). */
  duration?: {
    years: number
    months: number
    days: number
    hours: number
    minutes: number
  }
  /** Estimativa em minutos — usada só para comparar/ordenar. */
  durationMinutes: number
  durationLabel: string
  highlight?: boolean
}

export interface TimedAccessView {
  isTimed: boolean
  label?: string
  durationLabel?: string
  expiresAt?: string | null
  expiresAtLabel?: string
  /** Compra feita por cima de um acesso que ainda corria (prazo somado). */
  extended?: boolean
  extendedFromLabel?: string
  remainingMs: number
  remainingLabel: string
  expired: boolean
  endingSoon: boolean
}

export function fmtBRL(value: number): string {
  return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`
}

const MINUTE = 60_000

/**
 * Contagem regressiva viva a partir da data de fim vinda do servidor. O tique
 * acompanha a urgência: de minuto em minuto no geral, de segundo em segundo na
 * última hora — sem gastar render à toa num prazo de 30 dias.
 */
export function useRemainingTime(expiresAt?: string | null): { remainingMs: number; label: string; expired: boolean } {
  const target = useMemo(() => (expiresAt ? new Date(expiresAt).getTime() : 0), [expiresAt])
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!target) return
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      const remaining = target - Date.now()
      setNow(Date.now())
      if (remaining <= 0) return
      // Reagenda a cada passo: o intervalo aperta sozinho quando entra na
      // última hora, sem precisar remontar o componente.
      timer = setTimeout(schedule, remaining <= 60 * MINUTE ? 1000 : MINUTE)
    }
    schedule()
    return () => clearTimeout(timer)
  }, [target])

  if (!target) return { remainingMs: 0, label: '', expired: false }
  const remainingMs = Math.max(0, target - now)
  return { remainingMs, label: formatRemainingClient(remainingMs), expired: remainingMs <= 0 }
}

/** Mesma redação do servidor (`lib/material-timed-access`), no cliente. */
export function formatRemainingClient(remainingMs: number): string {
  if (remainingMs <= 0) return 'Acesso encerrado'
  const totalMinutes = Math.floor(remainingMs / MINUTE)
  if (totalMinutes < 1) return 'Menos de 1 minuto'
  const days = Math.floor(totalMinutes / (24 * 60))
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
  const minutes = totalMinutes % 60
  if (days > 0 && hours > 0) return `${days} ${days === 1 ? 'dia' : 'dias'} e ${hours} h`
  if (days > 0) return `${days} ${days === 1 ? 'dia' : 'dias'}`
  if (hours > 0 && minutes > 0) return `${hours} h e ${minutes} min`
  if (hours > 0) return `${hours} ${hours === 1 ? 'hora' : 'horas'}`
  return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`
}

// ── Depois da compra ────────────────────────────────────────────────────────

/**
 * Aviso completo de "quanto tempo você ainda tem", para a página do material e
 * a do pacote. Muda de tom quando falta menos de um dia.
 */
export function TimedAccessBanner({
  access,
  itemLabel = 'material',
  className = '',
  versions,
  selectedVersionId,
  onSelectVersion,
  onRenew,
  renewLoading,
  fullPrice,
  fullPriceLabel,
}: {
  access: TimedAccessView | null | undefined
  itemLabel?: string
  className?: string
  /** Versões à venda — habilitam o bloco "adicionar mais tempo". */
  versions?: TimedAccessVersionView[]
  selectedVersionId?: string | null
  onSelectVersion?: (versionId: string | null) => void
  onRenew?: () => void
  renewLoading?: boolean
  /** Preço do acesso vitalício, oferecido junto como saída definitiva. */
  fullPrice?: number
  fullPriceLabel?: string
}) {
  const live = useRemainingTime(access?.expiresAt)
  const [renewOpen, setRenewOpen] = useState(false)
  if (!access?.isTimed) return null

  const remainingMs = access.expiresAt ? live.remainingMs : access.remainingMs
  const remainingLabel = access.expiresAt ? live.label : access.remainingLabel
  const expired = remainingMs <= 0
  const endingSoon = !expired && remainingMs <= 24 * 60 * MINUTE

  const tone = expired
    ? 'border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400'
    : endingSoon
      ? 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300'
      : 'border-sky-500/30 bg-sky-500/5 text-sky-700 dark:text-sky-300'

  const canRenew = !!versions?.length && !!onRenew && !!onSelectVersion
  const selectedVersion = versions?.find((v) => v.id === (selectedVersionId ?? versions?.[0]?.id)) || null
  // Projeção do novo término: o prazo escolhido é somado ao que ainda resta,
  // com a mesma conta do servidor (meses e anos de calendário).
  const projectedEndLabel = selectedVersion?.duration && access.expiresAt && !expired
    ? formatAccessDate(computeAccessExpiry(new Date(access.expiresAt), selectedVersion.duration))
    : ''

  return (
    <div className={`rounded-xl border p-3.5 ${tone} ${className}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/10">
          <Hourglass className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">
            {expired
              ? `Seu acesso a este ${itemLabel} terminou`
              : `Acesso por tempo limitado — restam ${remainingLabel}`}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed opacity-90">
            {expired ? (
              <>
                A versão {access.label || 'temporária'} que você adquiriu expirou
                {access.expiresAtLabel ? ` em ${access.expiresAtLabel}` : ''}. Para continuar,
                adquira novamente — o acesso vitalício não tem prazo.
              </>
            ) : (
              <>
                Você adquiriu {access.label ? <strong>{access.label}</strong> : 'a versão temporária'}
                {access.durationLabel ? ` (${access.durationLabel})` : ''}. O acesso vai até{' '}
                <strong>{access.expiresAtLabel || '—'}</strong> e é só para leitura dentro da plataforma,
                sem download.
              </>
            )}
          </p>
          {access.extended && access.extendedFromLabel && !expired && (
            <p className="mt-1 text-[11px] font-semibold opacity-80">
              Renovação somada ao seu acesso anterior, que ia até {access.extendedFromLabel}.
            </p>
          )}
        </div>
      </div>

      {/* Renovar: o prazo novo entra por cima do que ainda resta. */}
      {canRenew && (
        <div className="mt-3 border-t border-current/15 pt-3">
          {!renewOpen ? (
            <button
              type="button"
              onClick={() => setRenewOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-current/30 bg-black/5 px-3 py-2 text-xs font-bold transition-colors hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
            >
              <Plus className="h-3.5 w-3.5" />
              {expired ? 'Comprar acesso novamente' : 'Comprar — adicione mais tempo de uso'}
            </button>
          ) : (
            <div className="space-y-2">
              <TimedAccessOptions
                versions={versions!}
                value={selectedVersionId ?? versions![0]?.id ?? null}
                onChange={onSelectVersion!}
                fullPrice={fullPrice ?? 0}
                fullPriceLabel={fullPriceLabel}
                allowLifetime={(fullPrice ?? 0) > 0}
                disabled={renewLoading}
              />
              {!expired && selectedVersion && (
                <p className="rounded-lg bg-black/5 px-2.5 py-2 text-[11px] font-medium dark:bg-white/10">
                  Somamos ao tempo que ainda resta: comprando {selectedVersion.label}, seu acesso passa a
                  valer até <strong>{projectedEndLabel}</strong>.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onRenew}
                  disabled={renewLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-current px-3 py-2 text-xs font-bold disabled:opacity-60"
                >
                  <span className="text-white dark:text-black">
                    {renewLoading ? 'Processando…' : expired ? 'Comprar acesso' : 'Adicionar tempo'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRenewOpen(false)}
                  className="rounded-lg border border-current/30 px-3 py-2 text-xs font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** Versão compacta — cartões do catálogo e cabeçalho do leitor. */
export function TimedAccessPill({
  access,
  className = '',
}: {
  access: TimedAccessView | null | undefined
  className?: string
}) {
  const live = useRemainingTime(access?.expiresAt)
  if (!access?.isTimed) return null

  const remainingMs = access.expiresAt ? live.remainingMs : access.remainingMs
  const remainingLabel = access.expiresAt ? live.label : access.remainingLabel
  const expired = remainingMs <= 0
  const endingSoon = !expired && remainingMs <= 24 * 60 * MINUTE

  const tone = expired
    ? 'bg-red-500/10 text-red-600 border-red-500/25 dark:text-red-400'
    : endingSoon
      ? 'bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-300'
      : 'bg-sky-500/10 text-sky-700 border-sky-500/25 dark:text-sky-300'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-bold ${tone} ${className}`}
      title={access.expiresAtLabel ? `Acesso até ${access.expiresAtLabel}` : undefined}
    >
      <Clock className="h-3 w-3" />
      {expired ? 'Acesso encerrado' : `Restam ${remainingLabel}`}
    </span>
  )
}

// ── Antes da compra ─────────────────────────────────────────────────────────

/**
 * Seletor das formas de acesso: vitalício (padrão) ou uma das versões por
 * tempo. `value === null` significa a versão vitalícia.
 */
export function TimedAccessOptions({
  versions,
  value,
  onChange,
  fullPrice,
  fullPriceLabel = 'Acesso vitalício',
  allowLifetime = true,
  disabled,
  className = '',
}: {
  versions: TimedAccessVersionView[]
  value: string | null
  onChange: (versionId: string | null) => void
  fullPrice: number
  fullPriceLabel?: string
  /** Na renovação de quem já tem prazo correndo, some se não fizer sentido. */
  allowLifetime?: boolean
  disabled?: boolean
  className?: string
}) {
  if (!versions || versions.length === 0) return null

  const options: Array<{ id: string | null; title: string; sub: string; price: number; highlight?: boolean }> = [
    ...(allowLifetime
      ? [{
          id: null,
          title: fullPriceLabel,
          sub: 'Para sempre, com download quando disponível',
          price: fullPrice,
        }]
      : []),
    ...versions.map((version) => ({
      id: version.id,
      title: version.label,
      sub: version.description || `${version.durationLabel} de acesso, sem download`,
      price: version.price,
      highlight: version.highlight,
    })),
  ]

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Clock className="h-3.5 w-3.5" /> Como você quer o acesso
      </p>
      <div className="grid gap-2">
        {options.map((option) => {
          const selected = option.id === value
          return (
            <button
              key={option.id ?? 'lifetime'}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.id)}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                selected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                  : 'border-border/60 bg-card hover:border-primary/40'
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                  selected ? 'border-primary' : 'border-muted-foreground/40'
                }`}
              >
                {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-bold">{option.title}</span>
                  {option.highlight && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                      <Sparkles className="h-2.5 w-2.5" /> Recomendado
                    </span>
                  )}
                  {option.id === null && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                      <ShieldCheck className="h-2.5 w-2.5" /> Sem prazo
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{option.sub}</span>
              </span>
              <span className="shrink-0 text-sm font-extrabold">{fmtBRL(option.price)}</span>
            </button>
          )
        })}
      </div>
      {value !== null && (
        <p className="flex items-start gap-1.5 rounded-lg border border-sky-500/25 bg-sky-500/5 p-2 text-[11px] leading-relaxed text-sky-700 dark:text-sky-300">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Esta é a versão por tempo limitado: leitura no visualizador protegido,{' '}
            <strong>sem download</strong>. O prazo começa a contar quando você ativa a Serial Key.
          </span>
        </p>
      )}
    </div>
  )
}

/**
 * Aviso estático da regra — usado no checkout, no comprovante e no e-mail
 * renderizado em tela. Sempre com as três informações que importam: duração,
 * quando o relógio começa e que não há download.
 */
export function TimedAccessNotice({
  durationLabel,
  versionLabel,
  expiresAtLabel,
  viaSerialKey = true,
  variant = 'light',
  className = '',
}: {
  durationLabel: string
  versionLabel?: string
  /** Quando já ativado, mostra a data exata de término. */
  expiresAtLabel?: string | null
  viaSerialKey?: boolean
  variant?: 'light' | 'dark'
  className?: string
}) {
  const isDark = variant === 'dark'
  return (
    <div
      className={`rounded-xl border p-3 ${
        isDark ? 'border-sky-400/30 bg-sky-400/5' : 'border-sky-500/25 bg-sky-500/5'
      } ${className}`}
    >
      <p className={`flex items-center gap-1.5 text-[12px] font-bold ${isDark ? 'text-sky-300' : 'text-sky-700 dark:text-sky-300'}`}>
        <Hourglass className="h-3.5 w-3.5" />
        {versionLabel ? `${versionLabel} — acesso por ${durationLabel}` : `Acesso por ${durationLabel}`}
      </p>
      <ul className={`mt-1.5 space-y-1 text-[11px] leading-relaxed ${isDark ? 'text-white/70' : 'text-muted-foreground'}`}>
        <li className="flex items-start gap-1.5">
          <Clock className="mt-0.5 h-3 w-3 shrink-0 opacity-70" />
          {expiresAtLabel
            ? <span>Seu acesso vai até <strong>{expiresAtLabel}</strong>.</span>
            : viaSerialKey
              ? <span>A contagem <strong>só começa quando você ativa a Serial Key</strong> — comprar hoje e ativar depois não consome o seu prazo.</span>
              : <span>A contagem começa assim que o acesso é liberado na sua conta.</span>}
        </li>
        <li className="flex items-start gap-1.5">
          <Plus className="mt-0.5 h-3 w-3 shrink-0 opacity-70" />
          <span>Já tem acesso a este item? O novo prazo <strong>soma</strong> ao tempo que ainda resta.</span>
        </li>
        <li className="flex items-start gap-1.5">
          <Download className="mt-0.5 h-3 w-3 shrink-0 opacity-70" />
          <span>Sem download: o conteúdo é lido no visualizador protegido dentro da plataforma.</span>
        </li>
      </ul>
    </div>
  )
}
