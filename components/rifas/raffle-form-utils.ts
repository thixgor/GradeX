import type { RaffleFormValues } from './admin-raffle-form'

/** Converte um datetime-local ("2026-06-26T15:30") para ISO, ou null. */
function localToIso(local: string): string | null {
  if (!local) return null
  const d = new Date(local)
  if (isNaN(d.getTime())) return null
  return d.toISOString()
}

/** Converte ISO para o formato aceito por <input type="datetime-local">. */
export function isoToLocalInput(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Monta o corpo da requisição (create/update) a partir dos valores do form. */
export function formToPayload(v: RaffleFormValues): Record<string, any> {
  const customDesign = Object.fromEntries(
    Object.entries(v.customDesign || {}).filter(([, val]) => val !== '' && val != null),
  )
  return {
    name: v.name.trim(),
    slug: v.slug.trim() || undefined,
    description: v.description.trim() || undefined,
    pricePerNumber: Number(v.pricePerNumber),
    totalNumbers: Math.floor(Number(v.totalNumbers)),
    winnersCount: Math.floor(Number(v.winnersCount)),
    coverImageUrl: v.coverImageUrl || undefined,
    prizeName: v.prizeName.trim(),
    prizeDescription: v.prizeDescription.trim() || undefined,
    prizeCategory: v.prizeCategory.trim() || undefined,
    prizeImageUrl: v.prizeImageUrl || undefined,
    template: v.template,
    customDesign: Object.keys(customDesign).length ? customDesign : undefined,
    visibility: v.visibility,
    status: v.status,
    rules: v.rules.trim() || undefined,
    allowManualDrawWhileOpen: v.allowManualDrawWhileOpen,
    allowDrawUnsoldNumbers: v.allowDrawUnsoldNumbers,
    startsAt: localToIso(v.startsAt),
    endsAt: localToIso(v.endsAt),
  }
}
