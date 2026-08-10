/**
 * Retomada de leitura do PDF Viewer (armazenamento local).
 *
 * O leitor já guardava a última página/modo por material no localStorage para
 * reabrir de onde o usuário parou — mas essa informação vivia dentro do próprio
 * componente do leitor e não servia para mais nada. Aqui ela vira um módulo
 * compartilhado e ganha um índice extra ("recentes") com o mínimo necessário
 * para montar um cartão fora do leitor: título, capa, página, total e quando
 * foi lido. É o que alimenta a área "Continuar lendo" em /materiais e
 * /dashboard.
 *
 * Por que localStorage e não banco: a posição de leitura sempre foi local (o
 * leitor nunca sincronizou página entre aparelhos), então gravar no servidor
 * criaria uma segunda fonte de verdade — e uma escrita no Mongo a cada virada
 * de página, no endpoint mais quente do produto. O índice acompanha exatamente
 * o que a retomada do leitor já consegue honrar.
 *
 * Tudo aqui é tolerante a falha (modo privado, cota estourada, JSON corrompido):
 * na dúvida devolve vazio e segue, nunca lança.
 */

export type ReadingMode = 'single' | 'width' | 'continuous'

export interface ReadingPosition {
  page?: number
  mode?: ReadingMode
}

export interface ReadingProgressEntry {
  materialId: string
  title: string
  /** Capa do material (mesma imagem usada no card do catálogo). */
  coverImage?: string
  /** Última página vista (1-based). */
  page: number
  /** Total de páginas conhecido no momento da leitura (0 = desconhecido). */
  totalPages: number
  mode: ReadingMode
  /** Epoch em ms da última leitura. */
  updatedAt: number
}

const POSITION_STORAGE_PREFIX = 'domineaqui:pdf-viewer:last-position:'
const RECENT_STORAGE_KEY = 'domineaqui:pdf-viewer:recent:v1'

/** Quantos materiais o índice de recentes guarda (a UI mostra menos que isso). */
const MAX_RECENT = 8

/**
 * Evento disparado na própria aba a cada escrita — o `storage` do navegador só
 * avisa as OUTRAS abas, então sem isto a lista de "Continuar lendo" só
 * atualizaria depois de um F5.
 */
export const READING_PROGRESS_EVENT = 'domineaqui:reading-progress'

function isReadingMode(value: unknown): value is ReadingMode {
  return value === 'single' || value === 'width' || value === 'continuous'
}

function notifyChange() {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new Event(READING_PROGRESS_EVENT))
  } catch {}
}

// ─── Posição por material (retomada dentro do leitor) ───────────────────────

export function readSavedPosition(materialId: string): ReadingPosition | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(POSITION_STORAGE_PREFIX + materialId)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { page?: unknown; mode?: unknown }
    if (!parsed || typeof parsed !== 'object') return null
    const page = Number(parsed.page)
    return {
      page: Number.isFinite(page) && page > 0 ? Math.floor(page) : undefined,
      mode: isReadingMode(parsed.mode) ? parsed.mode : undefined,
    }
  } catch {
    return null
  }
}

export function writeSavedPosition(materialId: string, position: { page: number; mode: ReadingMode }) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(POSITION_STORAGE_PREFIX + materialId, JSON.stringify(position))
  } catch {}
}

// ─── Índice de leituras recentes ("Continuar lendo") ────────────────────────

function sanitizeEntry(raw: any): ReadingProgressEntry | null {
  if (!raw || typeof raw !== 'object') return null
  const materialId = String(raw.materialId || '').trim()
  const title = String(raw.title || '').trim()
  if (!materialId || !title) return null

  const page = Math.floor(Number(raw.page))
  const totalPages = Math.floor(Number(raw.totalPages))
  const updatedAt = Number(raw.updatedAt)
  const coverImage = typeof raw.coverImage === 'string' ? raw.coverImage.trim() : ''

  return {
    materialId,
    title: title.slice(0, 180),
    coverImage: coverImage || undefined,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    totalPages: Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 0,
    mode: isReadingMode(raw.mode) ? raw.mode : 'continuous',
    updatedAt: Number.isFinite(updatedAt) && updatedAt > 0 ? updatedAt : 0,
  }
}

/** Leituras recentes, da mais recente para a mais antiga. */
export function readRecentReadings(limit = MAX_RECENT): ReadingProgressEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(RECENT_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const seen = new Set<string>()
    return parsed
      .map(sanitizeEntry)
      .filter((entry): entry is ReadingProgressEntry => {
        if (!entry || seen.has(entry.materialId)) return false
        seen.add(entry.materialId)
        return true
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, Math.max(0, limit))
  } catch {
    return []
  }
}

/**
 * Registra (ou atualiza) a leitura de um material no índice de recentes.
 * Chamado pelo leitor junto com a gravação da posição.
 */
export function recordReadingProgress(
  entry: Omit<ReadingProgressEntry, 'updatedAt'> & { updatedAt?: number }
) {
  if (typeof window === 'undefined') return
  const normalized = sanitizeEntry({ ...entry, updatedAt: entry.updatedAt || Date.now() })
  if (!normalized) return
  try {
    const others = readRecentReadings(MAX_RECENT).filter(
      (item) => item.materialId !== normalized.materialId
    )
    const next = [normalized, ...others].slice(0, MAX_RECENT)
    window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next))
    notifyChange()
  } catch {}
}

/**
 * Tira um material da lista de "Continuar lendo". A posição salva do leitor é
 * mantida de propósito: dispensar o cartão é esconder um lembrete, não jogar
 * fora onde a pessoa parou caso ela reabra o material.
 */
export function removeReadingProgress(materialId: string) {
  if (typeof window === 'undefined') return
  try {
    const next = readRecentReadings(MAX_RECENT).filter((item) => item.materialId !== materialId)
    window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next))
    notifyChange()
  } catch {}
}

/**
 * Apaga o índice de recentes e as posições salvas. Chamado no logout: o
 * aparelho pode ser compartilhado, e a lista de "Continuar lendo" carrega
 * título e capa dos materiais — o próximo a entrar não deve ver nada disso.
 */
export function clearReadingProgress() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(RECENT_STORAGE_KEY)
    const stale: string[] = []
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i)
      if (key?.startsWith(POSITION_STORAGE_PREFIX)) stale.push(key)
    }
    stale.forEach((key) => window.localStorage.removeItem(key))
    notifyChange()
  } catch {}
}

/** Percentual lido (0–100). Devolve null quando o total é desconhecido. */
export function readingPercent(entry: ReadingProgressEntry): number | null {
  if (!entry.totalPages || entry.totalPages < 1) return null
  return Math.min(100, Math.max(0, Math.round((entry.page / entry.totalPages) * 100)))
}
