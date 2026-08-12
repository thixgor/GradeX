/**
 * Acesso por tempo limitado a materiais e pacotes.
 *
 * Um material (ou pacote) tem sempre a sua versão vitalícia — o preço normal,
 * que dá acesso para sempre. Além dela, o admin pode publicar *versões de
 * acesso*: o mesmo conteúdo por um preço menor, válido por um prazo que ele
 * monta em minutos, horas, dias, meses e anos (somados).
 *
 * Regras (aplicadas no servidor, nunca só na interface):
 *  - O relógio começa a correr na ATIVAÇÃO da serial key (ou, na compra
 *    logada sem key, no momento em que a compra é liberada). Nunca no
 *    pagamento — quem compra e ativa depois não perde tempo.
 *  - Passada a data, a compra deixa de dar acesso (ver `activeAccessFilter`).
 *  - Versão por tempo NÃO permite download: o conteúdo é consumido no PDF
 *    Viewer / leitor protegido. Flashcards e vídeo-aulas não têm PDF, então
 *    para eles a versão apenas limita o período de uso.
 *
 * Meses e anos são de CALENDÁRIO, não blocos de 30/365 dias: "1 mês" comprado
 * em 31/01 vence em 28/02, e não em 02/03. Por isso a duração viaja inteira
 * (as cinco unidades) até a ativação, onde vira data — ver `computeAccessExpiry`.
 */

export type MaterialAccessMode = 'lifetime' | 'timed'

/** As cinco unidades que o admin pode somar para montar um prazo. */
export interface TimedAccessDuration {
  years: number
  months: number
  days: number
  hours: number
  minutes: number
}

/** Uma versão de acesso por tempo publicada pelo admin. */
export interface TimedAccessVersion {
  /** Id estável (gerado no admin) usado no checkout e na compra. */
  id: string
  /** Rótulo curto exibido ao usuário. Ex.: "Acesso 30 dias". */
  label: string
  /** Texto opcional de apoio no card da versão. */
  description?: string
  /** Preço desta versão em R$. */
  price: number
  /** Duração — as cinco unidades somam o período total de acesso. */
  durationYears: number
  durationMonths: number
  durationDays: number
  durationHours: number
  durationMinutes: number
  /** Versão desligada não aparece no catálogo nem pode ser comprada. */
  isActive: boolean
  /** Marca a versão como recomendada (destaque visual). */
  highlight?: boolean
  order: number
}

/** Campos gravados em `material_purchases` quando a compra é por tempo. */
export interface TimedAccessPurchaseFields {
  accessMode: MaterialAccessMode
  accessVersionId?: string
  accessVersionLabel?: string
  /** Duração de calendário comprada (fonte da verdade para recalcular datas). */
  accessDuration?: TimedAccessDuration
  /** Aproximação em minutos — ordenação, compatibilidade e fallback de rótulo. */
  accessDurationMinutes?: number
  accessStartsAt?: Date
  accessExpiresAt?: Date
  /** Compra por tempo nunca libera download do PDF. */
  downloadDisabled?: boolean
}

/** Retrato do estado de acesso de uma compra, pronto para a interface. */
export interface TimedAccessStatus {
  isTimed: boolean
  versionId?: string
  label?: string
  durationMinutes?: number
  durationLabel?: string
  startsAt?: string
  expiresAt?: string
  expiresAtLabel?: string
  /** Milissegundos restantes (0 quando expirou). */
  remainingMs: number
  remainingLabel: string
  expired: boolean
  /** True quando falta menos de 24 h — a interface acende o alerta. */
  endingSoon: boolean
  downloadAllowed: boolean
}

export const MAX_TIMED_ACCESS_VERSIONS = 6
const MINUTES_PER_HOUR = 60
const MINUTES_PER_DAY = 24 * 60
/**
 * Equivalências usadas SÓ para estimar minutos (ordenação, rótulo de legado).
 * A data real de término nunca sai daqui — sai de `computeAccessExpiry`.
 */
const MINUTES_PER_MONTH = 30 * MINUTES_PER_DAY
const MINUTES_PER_YEAR = 365 * MINUTES_PER_DAY
/** Teto de segurança: 10 anos. Acima disso, use a versão vitalícia. */
const MAX_DURATION_MINUTES = 10 * MINUTES_PER_YEAR
/** Falta menos que isso → a interface trata como "acabando". */
export const ENDING_SOON_MS = 24 * 60 * 60 * 1000

/** Limites por unidade no formulário do admin. */
export const DURATION_LIMITS = {
  years: 10,
  months: 120,
  days: 3650,
  hours: 8760,
  minutes: 525_600,
} as const

export const EMPTY_DURATION: TimedAccessDuration = {
  years: 0,
  months: 0,
  days: 0,
  hours: 0,
  minutes: 0,
}

function toInt(value: unknown, min: number, max: number): number {
  const n = Math.floor(Number(value))
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

function toMoney(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.round(n * 100) / 100
}

function cleanText(value: unknown, max: number): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

function makeVersionId(): string {
  return `tav-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** Lê as cinco unidades de um objeto solto (versão, compra ou grant). */
export function normalizeDuration(raw: any): TimedAccessDuration {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_DURATION }
  // Objeto que carrega a duração aninhada (versão serializada, compra): a
  // duração de dentro é a boa — o `durationMinutes` ao lado dela é só a
  // estimativa total e leria "minutos" errado.
  if (raw.duration && typeof raw.duration === 'object') return normalizeDuration(raw.duration)
  if (raw.accessDuration && typeof raw.accessDuration === 'object') return normalizeDuration(raw.accessDuration)
  // Aceita tanto o formato aninhado (`accessDuration`) quanto o achatado da
  // versão (`durationYears`, …) — é o mesmo prazo escrito de dois jeitos.
  const pick = (nested: string, flat: string, max: number) =>
    toInt(raw[nested] ?? raw[flat], 0, max)
  return {
    years: pick('years', 'durationYears', DURATION_LIMITS.years),
    months: pick('months', 'durationMonths', DURATION_LIMITS.months),
    days: pick('days', 'durationDays', DURATION_LIMITS.days),
    hours: pick('hours', 'durationHours', DURATION_LIMITS.hours),
    minutes: pick('minutes', 'durationMinutes', DURATION_LIMITS.minutes),
  }
}

/** A duração de uma versão, no formato canônico. */
export function versionDuration(version: any): TimedAccessDuration {
  return normalizeDuration(version)
}

/** A duração tem alguma unidade preenchida? */
export function hasDuration(duration: TimedAccessDuration): boolean {
  return duration.years > 0 || duration.months > 0 || duration.days > 0 ||
    duration.hours > 0 || duration.minutes > 0
}

/**
 * Estimativa da duração em minutos (mês = 30 dias, ano = 365). Serve para
 * ordenar versões, comparar prazos e como rótulo de compras antigas. A data de
 * término real nunca vem daqui.
 */
export function durationToApproxMinutes(duration: TimedAccessDuration): number {
  const total =
    duration.years * MINUTES_PER_YEAR +
    duration.months * MINUTES_PER_MONTH +
    duration.days * MINUTES_PER_DAY +
    duration.hours * MINUTES_PER_HOUR +
    duration.minutes
  return Math.min(MAX_DURATION_MINUTES, Math.max(0, Math.floor(total)))
}

/** Atalho: duração aproximada de uma versão, em minutos. */
export function versionDurationMinutes(version: any): number {
  return durationToApproxMinutes(versionDuration(version))
}

/**
 * Normaliza as versões vindas do formulário do admin. Descarta as inválidas
 * (sem rótulo, sem duração) e garante ids estáveis — o id é o que liga a
 * compra à versão, então nunca pode ser regravado para uma versão existente.
 */
export function sanitizeTimedAccessVersions(raw: unknown): TimedAccessVersion[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: TimedAccessVersion[] = []

  for (const item of raw as any[]) {
    if (!item || typeof item !== 'object') continue
    const label = cleanText(item.label, 60)
    if (!label) continue

    const duration = normalizeDuration(item)
    if (!hasDuration(duration)) continue

    let id = cleanText(item.id, 40)
    if (!id || seen.has(id)) id = makeVersionId()
    seen.add(id)

    out.push({
      id,
      label,
      description: cleanText(item.description, 180) || undefined,
      price: toMoney(item.price),
      durationYears: duration.years,
      durationMonths: duration.months,
      durationDays: duration.days,
      durationHours: duration.hours,
      durationMinutes: duration.minutes,
      isActive: item.isActive !== false,
      highlight: item.highlight === true,
      order: toInt(item.order ?? out.length, 0, 999),
    })
    if (out.length >= MAX_TIMED_ACCESS_VERSIONS) break
  }

  return out.sort((a, b) => a.order - b.order || a.price - b.price)
}

/** Versões publicadas de um material/pacote (as desligadas ficam de fora). */
export function getActiveTimedAccessVersions(item: any): TimedAccessVersion[] {
  const raw = item?.timedAccessVersions
  if (!Array.isArray(raw)) return []
  return raw
    .filter((v: any) => v && v.isActive !== false && hasDuration(normalizeDuration(v)))
    .map((v: any) => {
      const duration = normalizeDuration(v)
      return {
        id: String(v.id || ''),
        label: String(v.label || 'Acesso temporário'),
        description: v.description ? String(v.description) : undefined,
        price: toMoney(v.price),
        durationYears: duration.years,
        durationMonths: duration.months,
        durationDays: duration.days,
        durationHours: duration.hours,
        durationMinutes: duration.minutes,
        isActive: true,
        highlight: v.highlight === true,
        order: Math.max(0, Math.floor(Number(v.order) || 0)),
      }
    })
    .filter((v) => !!v.id)
    .sort((a, b) => a.order - b.order || a.price - b.price)
}

/** Busca uma versão ativa pelo id. Retorna null quando não existe/está off. */
export function findTimedAccessVersion(item: any, versionId?: string | null): TimedAccessVersion | null {
  const id = String(versionId || '').trim()
  if (!id) return null
  return getActiveTimedAccessVersions(item).find((v) => v.id === id) || null
}

/** Serializa as versões para o cliente, já com rótulos prontos. */
export function serializeTimedAccessVersions(item: any) {
  return getActiveTimedAccessVersions(item).map((version) => {
    const duration = versionDuration(version)
    return {
      id: version.id,
      label: version.label,
      description: version.description || '',
      price: version.price,
      duration,
      durationMinutes: durationToApproxMinutes(duration),
      durationLabel: formatDuration(duration),
      highlight: version.highlight === true,
    }
  })
}

/**
 * Data em que o acesso termina, contando a partir de `startsAt`.
 *
 * Anos e meses andam no calendário (em UTC, para não depender do fuso do
 * servidor); dias, horas e minutos são somados como tempo absoluto. Quando o
 * dia do mês não existe no mês de destino, a data cai no último dia dele —
 * "1 mês" a partir de 31/01 termina em 28/02, e não escorrega para março.
 */
export function computeAccessExpiry(startsAt: Date, duration: TimedAccessDuration): Date {
  const result = new Date(startsAt.getTime())

  if (duration.years > 0 || duration.months > 0) {
    const day = result.getUTCDate()
    const targetMonth = result.getUTCMonth() + duration.months + duration.years * 12
    // Dia 1 antes de mexer no mês: evita o rollover automático do JS
    // (31/01 + 1 mês viraria 03/03) antes de podermos limitar ao fim do mês.
    result.setUTCDate(1)
    result.setUTCMonth(targetMonth)
    const lastDayOfMonth = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate()
    result.setUTCDate(Math.min(day, lastDayOfMonth))
  }

  const absoluteMinutes =
    duration.days * MINUTES_PER_DAY + duration.hours * MINUTES_PER_HOUR + duration.minutes
  return new Date(result.getTime() + absoluteMinutes * 60_000)
}

/**
 * Campos de compra para uma aquisição por tempo. `startsAt` é o instante em que
 * o acesso é liberado — na compra com serial key isso é a ATIVAÇÃO da key, não
 * o pagamento.
 */
export function buildTimedPurchaseFields(
  version: TimedAccessVersion,
  startsAt: Date = new Date()
): TimedAccessPurchaseFields {
  return buildTimedPurchaseFieldsFor(
    { id: version.id, label: version.label, duration: versionDuration(version) },
    startsAt
  )
}

/**
 * Mesma coisa a partir dos dados achatados que viajam no pedido/serial key.
 * Aceita a duração completa (`duration`) ou, para keys geradas antes das cinco
 * unidades existirem, apenas os minutos.
 */
export function buildTimedPurchaseFieldsFor(
  version: { id?: string; label?: string; duration?: TimedAccessDuration | null; durationMinutes?: number },
  startsAt: Date = new Date()
): TimedAccessPurchaseFields {
  const duration = version.duration && hasDuration(version.duration)
    ? version.duration
    : { ...EMPTY_DURATION, minutes: Math.max(1, Math.floor(Number(version.durationMinutes) || 0)) }

  return {
    accessMode: 'timed',
    accessVersionId: version.id || undefined,
    accessVersionLabel: version.label || undefined,
    accessDuration: duration,
    accessDurationMinutes: durationToApproxMinutes(duration),
    accessStartsAt: startsAt,
    accessExpiresAt: computeAccessExpiry(startsAt, duration),
    downloadDisabled: true,
  }
}

/** @deprecated use `buildTimedPurchaseFieldsFor`. Mantido para keys antigas. */
export function buildTimedPurchaseFieldsFromMinutes(
  version: { id?: string; label?: string; durationMinutes: number },
  startsAt: Date = new Date()
): TimedAccessPurchaseFields {
  return buildTimedPurchaseFieldsFor(version, startsAt)
}

/**
 * Cláusula Mongo que descarta compras cujo acesso por tempo já venceu.
 * Usa `$nor` (e não `$or`) de propósito: os filtros de compra já usam `$or`
 * para casar userId/e-mail, e duas chaves `$or` no mesmo objeto se anulariam.
 */
export function activeAccessFilter(now: Date = new Date()) {
  return { $nor: [{ accessExpiresAt: { $type: 'date', $lte: now } }] }
}

/**
 * Cláusula Mongo que casa apenas posse VITALÍCIA. É o que define "já é dono"
 * para bloquear recompra: quem tem só a versão por tempo pode comprar de novo
 * — para renovar o prazo ou para trocar pelo acesso definitivo.
 */
export function lifetimeOwnershipFilter() {
  return {
    accessExpiresAt: { $exists: false },
    accessMode: { $ne: 'timed' as MaterialAccessMode },
  }
}

/** A compra ainda vale? (lifetime sempre vale; por tempo, só até a data.) */
export function isPurchaseActive(purchase: any, now: Date = new Date()): boolean {
  const expiresAt = toDate(purchase?.accessExpiresAt)
  if (!expiresAt) return true
  return expiresAt.getTime() > now.getTime()
}

/** A compra é por tempo limitado? */
export function isTimedPurchase(purchase: any): boolean {
  return purchase?.accessMode === 'timed' || !!toDate(purchase?.accessExpiresAt)
}

function toDate(value: unknown): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Estado de acesso pronto para a interface. Retorna `null` para compras
 * vitalícias — a interface só mostra aviso quando há prazo correndo.
 */
export function summarizeTimedAccess(purchase: any, now: Date = new Date()): TimedAccessStatus | null {
  if (!purchase || !isTimedPurchase(purchase)) return null
  const expiresAt = toDate(purchase.accessExpiresAt)
  const startsAt = toDate(purchase.accessStartsAt)
  const remainingMs = expiresAt ? Math.max(0, expiresAt.getTime() - now.getTime()) : 0
  const expired = !!expiresAt && remainingMs <= 0

  // Compras novas guardam a duração completa; as antigas, só os minutos.
  const duration = purchase.accessDuration ? normalizeDuration(purchase.accessDuration) : null
  const durationMinutes = duration
    ? durationToApproxMinutes(duration)
    : Number(purchase.accessDurationMinutes) || undefined
  const durationLabel = duration && hasDuration(duration)
    ? formatDuration(duration)
    : durationMinutes
      ? formatDurationMinutes(durationMinutes)
      : undefined

  return {
    isTimed: true,
    versionId: purchase.accessVersionId ? String(purchase.accessVersionId) : undefined,
    label: purchase.accessVersionLabel ? String(purchase.accessVersionLabel) : undefined,
    durationMinutes,
    durationLabel,
    startsAt: startsAt ? startsAt.toISOString() : undefined,
    expiresAt: expiresAt ? expiresAt.toISOString() : undefined,
    expiresAtLabel: expiresAt ? formatAccessDate(expiresAt) : undefined,
    remainingMs,
    remainingLabel: formatRemaining(remainingMs),
    expired,
    endingSoon: !expired && remainingMs > 0 && remainingMs <= ENDING_SOON_MS,
    downloadAllowed: false,
  }
}

const UNIT_LABELS: Array<{ key: keyof TimedAccessDuration; one: string; many: string }> = [
  { key: 'years', one: 'ano', many: 'anos' },
  { key: 'months', one: 'mês', many: 'meses' },
  { key: 'days', one: 'dia', many: 'dias' },
  { key: 'hours', one: 'hora', many: 'horas' },
  { key: 'minutes', one: 'minuto', many: 'minutos' },
]

/**
 * "30 dias", "1 ano e 6 meses", "2 h e 30 min". Mostra no máximo as duas
 * maiores unidades preenchidas — "1 ano, 2 meses, 3 dias e 15 minutos" não
 * ajuda ninguém a decidir uma compra.
 */
export function formatDuration(duration: TimedAccessDuration): string {
  const filled = UNIT_LABELS
    .map(({ key, one, many }) => ({ key, one, many, value: Math.max(0, Math.floor(duration[key] || 0)) }))
    .filter((entry) => entry.value > 0)

  if (filled.length === 0) return '0 minutos'

  // Sozinha, a unidade vai por extenso ("2 horas"); acompanhada, abrevia as
  // menores para a frase não ficar comprida ("1 dia e 6 h").
  const render = (entry: (typeof filled)[number], abbreviate: boolean) => {
    if (abbreviate && entry.key === 'hours') return `${entry.value} h`
    if (abbreviate && entry.key === 'minutes') return `${entry.value} min`
    return `${entry.value} ${entry.value === 1 ? entry.one : entry.many}`
  }

  if (filled.length === 1) return render(filled[0], false)
  return `${render(filled[0], true)} e ${render(filled[1], true)}`
}

/** Mesma leitura, a partir de uma quantidade de minutos (compras antigas). */
export function formatDurationMinutes(minutes: number): string {
  const total = Math.max(0, Math.floor(minutes))
  return formatDuration({
    ...EMPTY_DURATION,
    days: Math.floor(total / MINUTES_PER_DAY),
    hours: Math.floor((total % MINUTES_PER_DAY) / MINUTES_PER_HOUR),
    minutes: total % MINUTES_PER_HOUR,
  })
}

/** "12 dias e 4 h restantes" vira "12 dias e 4 h" — a frase fica com a UI. */
export function formatRemaining(remainingMs: number): string {
  if (remainingMs <= 0) return 'Acesso encerrado'
  const totalMinutes = Math.floor(remainingMs / 60_000)
  if (totalMinutes < 1) return 'Menos de 1 minuto'
  return formatDurationMinutes(totalMinutes)
}

/** Data de fim no fuso de São Paulo (o mesmo usado nos comprovantes). */
export function formatAccessDate(date: Date): string {
  return date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Frase padrão usada em checkout, comprovante e e-mail. Mantida em um lugar só
 * para o comprador ler exatamente a mesma regra em todos os pontos de contato.
 */
export function timedAccessDisclaimer(durationLabel: string, options: { viaSerialKey?: boolean } = {}): string {
  const base = `Acesso por ${durationLabel}, sem download — o conteúdo fica disponível no leitor protegido dentro da plataforma.`
  return options.viaSerialKey
    ? `${base} A contagem começa quando você ativa a sua Serial Key.`
    : `${base} A contagem começa assim que o acesso é liberado.`
}
