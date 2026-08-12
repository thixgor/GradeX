/**
 * Acesso por tempo limitado a materiais e pacotes.
 *
 * Um material (ou pacote) tem sempre a sua versão vitalícia — o preço normal,
 * que dá acesso para sempre. Além dela, o admin pode publicar *versões de
 * acesso*: o mesmo conteúdo por um preço menor, válido por X dias/horas.
 *
 * Regras (aplicadas no servidor, nunca só na interface):
 *  - O relógio começa a correr na ATIVAÇÃO da serial key (ou, na compra
 *    logada sem key, no momento em que a compra é liberada). Nunca no
 *    pagamento — quem compra e ativa depois não perde tempo.
 *  - Passada a data, a compra deixa de dar acesso (ver `activeAccessFilter`).
 *  - Versão por tempo NÃO permite download: o conteúdo é consumido no PDF
 *    Viewer / leitor protegido. Flashcards e vídeo-aulas não têm PDF, então
 *    para eles a versão apenas limita o período de uso.
 */

export type MaterialAccessMode = 'lifetime' | 'timed'

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
  /** Duração — dias e horas somam o período total de acesso. */
  durationDays: number
  durationHours: number
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
const MINUTES_PER_DAY = 24 * 60
/** Teto de segurança: 10 anos. Acima disso, use a versão vitalícia. */
const MAX_DURATION_MINUTES = 10 * 365 * MINUTES_PER_DAY
/** Falta menos que isso → a interface trata como "acabando". */
export const ENDING_SOON_MS = 24 * 60 * 60 * 1000

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

/** Duração total da versão em minutos. */
export function versionDurationMinutes(version: Pick<TimedAccessVersion, 'durationDays' | 'durationHours'>): number {
  const days = Math.max(0, Math.floor(Number(version.durationDays) || 0))
  const hours = Math.max(0, Math.floor(Number(version.durationHours) || 0))
  return Math.min(MAX_DURATION_MINUTES, days * MINUTES_PER_DAY + hours * 60)
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

    const durationDays = toInt(item.durationDays, 0, 3650)
    const durationHours = toInt(item.durationHours, 0, 23)
    if (versionDurationMinutes({ durationDays, durationHours }) <= 0) continue

    let id = cleanText(item.id, 40)
    if (!id || seen.has(id)) id = makeVersionId()
    seen.add(id)

    out.push({
      id,
      label,
      description: cleanText(item.description, 180) || undefined,
      price: toMoney(item.price),
      durationDays,
      durationHours,
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
    .filter((v: any) => v && v.isActive !== false && versionDurationMinutes(v) > 0)
    .map((v: any) => ({
      id: String(v.id || ''),
      label: String(v.label || 'Acesso temporário'),
      description: v.description ? String(v.description) : undefined,
      price: toMoney(v.price),
      durationDays: Math.max(0, Math.floor(Number(v.durationDays) || 0)),
      durationHours: Math.max(0, Math.floor(Number(v.durationHours) || 0)),
      isActive: true,
      highlight: v.highlight === true,
      order: Math.max(0, Math.floor(Number(v.order) || 0)),
    }))
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
  return getActiveTimedAccessVersions(item).map((version) => ({
    id: version.id,
    label: version.label,
    description: version.description || '',
    price: version.price,
    durationDays: version.durationDays,
    durationHours: version.durationHours,
    durationMinutes: versionDurationMinutes(version),
    durationLabel: formatDurationMinutes(versionDurationMinutes(version)),
    highlight: version.highlight === true,
  }))
}

/** Data em que o acesso termina, contando a partir de `startsAt`. */
export function computeAccessExpiry(startsAt: Date, durationMinutes: number): Date {
  return new Date(startsAt.getTime() + Math.max(1, Math.floor(durationMinutes)) * 60_000)
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
  return buildTimedPurchaseFieldsFromMinutes(
    { id: version.id, label: version.label, durationMinutes: versionDurationMinutes(version) },
    startsAt
  )
}

/**
 * Mesma coisa a partir dos dados já achatados que viajam no pedido/serial key
 * (id + rótulo + minutos) — é o formato que sobrevive ao checkout.
 */
export function buildTimedPurchaseFieldsFromMinutes(
  version: { id?: string; label?: string; durationMinutes: number },
  startsAt: Date = new Date()
): TimedAccessPurchaseFields {
  const durationMinutes = Math.max(1, Math.floor(Number(version.durationMinutes) || 0))
  return {
    accessMode: 'timed',
    accessVersionId: version.id || undefined,
    accessVersionLabel: version.label || undefined,
    accessDurationMinutes: durationMinutes,
    accessStartsAt: startsAt,
    accessExpiresAt: computeAccessExpiry(startsAt, durationMinutes),
    downloadDisabled: true,
  }
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
  const durationMinutes = Number(purchase.accessDurationMinutes) || undefined
  const remainingMs = expiresAt ? Math.max(0, expiresAt.getTime() - now.getTime()) : 0
  const expired = !!expiresAt && remainingMs <= 0

  return {
    isTimed: true,
    versionId: purchase.accessVersionId ? String(purchase.accessVersionId) : undefined,
    label: purchase.accessVersionLabel ? String(purchase.accessVersionLabel) : undefined,
    durationMinutes,
    durationLabel: durationMinutes ? formatDurationMinutes(durationMinutes) : undefined,
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

/** "30 dias", "12 horas", "1 dia e 6 h". */
export function formatDurationMinutes(minutes: number): string {
  const total = Math.max(0, Math.floor(minutes))
  const days = Math.floor(total / MINUTES_PER_DAY)
  const hours = Math.floor((total % MINUTES_PER_DAY) / 60)
  const mins = total % 60

  if (days > 0 && hours > 0) return `${days} ${days === 1 ? 'dia' : 'dias'} e ${hours} h`
  if (days > 0) return `${days} ${days === 1 ? 'dia' : 'dias'}`
  if (hours > 0 && mins > 0) return `${hours} h e ${mins} min`
  if (hours > 0) return `${hours} ${hours === 1 ? 'hora' : 'horas'}`
  return `${mins} ${mins === 1 ? 'minuto' : 'minutos'}`
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
