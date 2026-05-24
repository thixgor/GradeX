/**
 * Sistema de Período (semestre) do usuário.
 *
 * O usuário guarda um período-base (`periodoBase`) e o semestre-âncora
 * (`periodoBaseRef`, no formato "AAAA.S") em que esse período foi definido —
 * no cadastro ou pelo admin. O período atual é calculado avançando 1 a cada
 * virada de semestre acadêmico desde a âncora:
 *   - 1º semestre: janeiro a junho
 *   - 2º semestre: julho a dezembro
 *
 * Ex.: definido como 1º período em 2025.1 (jan–jun/2025) → vira 2º período em
 * 2025.2 (jul–dez/2025), 3º em 2026.1, e assim por diante (limitado a MAX_PERIODO).
 *
 * Funções são puras (sem dependências de servidor) para uso no cliente também.
 */

export const MIN_PERIODO = 1
export const MAX_PERIODO = 12

export const PERIODO_OPTIONS: number[] = Array.from(
  { length: MAX_PERIODO - MIN_PERIODO + 1 },
  (_, i) => MIN_PERIODO + i,
)

/** Índice monotônico de semestre: ano*2 + (2º semestre ? 1 : 0). Jul–Dez = 2º. */
export function getSemesterIndex(date: Date): number {
  const month = date.getMonth() + 1 // 1-12
  const isSecondHalf = month >= 7
  return date.getFullYear() * 2 + (isSecondHalf ? 1 : 0)
}

/** Referência do semestre atual no formato "AAAA.S" (S = 1 ou 2). */
export function getCurrentSemesterRef(date: Date = new Date()): string {
  const semestre = date.getMonth() + 1 >= 7 ? 2 : 1
  return `${date.getFullYear()}.${semestre}`
}

/** Converte "AAAA.S" no índice monotônico de semestre. Retorna null se inválido. */
export function semesterRefToIndex(ref?: string | null): number | null {
  if (!ref || typeof ref !== 'string') return null
  const match = ref.trim().match(/^(\d{4})\.([12])$/)
  if (!match) return null
  const year = Number(match[1])
  const semestre = Number(match[2])
  return year * 2 + (semestre === 2 ? 1 : 0)
}

/** Normaliza um valor arbitrário para um período válido (1..MAX) ou null. */
export function normalizePeriodo(value: unknown): number | null {
  const num = typeof value === 'string' ? Number(value) : value
  if (typeof num !== 'number' || !Number.isFinite(num)) return null
  const rounded = Math.trunc(num)
  if (rounded < MIN_PERIODO || rounded > MAX_PERIODO) return null
  return rounded
}

/**
 * Calcula o período atual do usuário a partir do período-base e da âncora,
 * aplicando o avanço automático por semestre. Retorna null quando o usuário
 * não tem período definido (ex.: cadastros antigos que não preencheram nada).
 */
export function computeCurrentPeriodo(
  periodoBase?: number | null,
  periodoBaseRef?: string | null,
  now: Date = new Date(),
): number | null {
  const base = normalizePeriodo(periodoBase)
  if (base === null) return null

  const baseIdx = semesterRefToIndex(periodoBaseRef)
  if (baseIdx === null) return base // sem âncora: mantém o base sem avançar

  const currentIdx = getSemesterIndex(now)
  const advanced = Math.max(0, currentIdx - baseIdx)
  return Math.min(MAX_PERIODO, base + advanced)
}

/** Versão que aceita o documento do usuário diretamente. */
export function getUserCurrentPeriodo(
  user?: { periodoBase?: number | null; periodoBaseRef?: string | null } | null,
  now: Date = new Date(),
): number | null {
  if (!user) return null
  return computeCurrentPeriodo(user.periodoBase, user.periodoBaseRef, now)
}

/** Rótulo amigável: 3 → "3º período". null → "Sem período". */
export function formatPeriodoLabel(periodo?: number | null): string {
  if (periodo === null || periodo === undefined) return 'Sem período'
  return `${periodo}º período`
}
