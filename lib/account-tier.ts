/**
 * Fonte única da verdade sobre o cargo/plano da conta.
 *
 * A plataforma tinha dois cargos pagos — PREMIUM e ESSENTIAL — que foram
 * consolidados em um único: **Plus+** (`accountType: 'plus'`).
 *
 * Registros antigos no Mongo (usuários, planos, materiais, decks, aulas,
 * serial keys) ainda carregam `'premium'` ou `'essential'`. Em vez de exigir
 * uma migração perfeita antes do deploy, todo o código passa por aqui:
 *
 *  - `normalizeAccountType()` traduz o legado na leitura;
 *  - `PLUS_ACCOUNT_TYPES` é o conjunto aceito em filtros do Mongo;
 *  - `isPlusAccount()` é o único teste de "esse usuário é pagante?".
 *
 * Nunca compare `accountType === 'premium'` diretamente. Use os helpers.
 */

import type { AccountType } from './types'

/** Cargo pago canônico. */
export const PLUS_TIER = 'plus' as const

/** Rótulo de marca do cargo pago. Não traduzir/abreviar. */
export const PLUS_LABEL = 'Plus+'

/**
 * Cargos legados que hoje significam exatamente a mesma coisa que `plus`.
 * Mantidos apenas para leitura de documentos antigos.
 */
export const LEGACY_PLUS_TIERS = ['premium', 'essential'] as const

/**
 * Todos os valores de `accountType` que representam um assinante Plus+.
 * Use em queries: `{ accountType: { $in: [...PLUS_ACCOUNT_TYPES] } }`.
 */
export const PLUS_ACCOUNT_TYPES = [PLUS_TIER, ...LEGACY_PLUS_TIERS] as const

/** Todos os cargos canônicos oferecidos hoje (o que o admin pode escolher). */
export const CANONICAL_ACCOUNT_TYPES: AccountType[] = ['gratuito', 'trial', PLUS_TIER]

/**
 * Traduz qualquer valor vindo do banco/entrada do usuário para o cargo
 * canônico. Valores desconhecidos ou ausentes viram `'gratuito'`.
 */
export function normalizeAccountType(value?: string | null): AccountType {
  if (!value) return 'gratuito'
  const v = String(value).trim().toLowerCase()
  if (v === 'premium' || v === 'essential' || v === 'plus' || v === 'plus+') return PLUS_TIER
  if (v === 'trial') return 'trial'
  return 'gratuito'
}

/**
 * O usuário é um assinante Plus+? Admin sempre tem acesso total.
 * Aceita `string` solto porque muitos callers leem o campo direto do Mongo.
 */
export function isPlusAccount(accountType?: string | null, isAdmin?: boolean): boolean {
  if (isAdmin) return true
  return normalizeAccountType(accountType) === PLUS_TIER
}

/** Atalho para checagens de sessão (`session.role === 'admin'`). */
export function isAdminRole(role?: string | null): boolean {
  return role === 'admin'
}

/** Rótulos de exibição. Não expõe mais "Premium"/"Essential" na interface. */
export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  gratuito: 'Gratuito',
  trial: 'Trial',
  plus: PLUS_LABEL,
  // Legado — usuários ainda não migrados aparecem como Plus+ na interface.
  premium: PLUS_LABEL,
  essential: PLUS_LABEL,
  admin: 'Administrador',
  monitor: 'Monitor',
}

export function getAccountTypeLabel(accountType?: string | null, isAdmin?: boolean): string {
  if (isAdmin) return ACCOUNT_TYPE_LABELS.admin
  return ACCOUNT_TYPE_LABELS[String(accountType || 'gratuito')] || ACCOUNT_TYPE_LABELS.gratuito
}

// ─── Grupos de acesso (materiais, decks, aulas) ───────────────────────────────

/**
 * Grupos que o admin pode marcar em um material/deck/pacote.
 * `monitor` é cargo secundário, independente do plano.
 */
export const ACCESS_GROUP_OPTIONS = [
  { id: 'gratuito', label: 'Gratuito' },
  { id: 'trial', label: 'Trial' },
  { id: PLUS_TIER, label: PLUS_LABEL },
  { id: 'monitor', label: 'Monitor' },
] as const

/** Inclui os legados para validar payloads antigos sem rejeitá-los. */
export const VALID_ACCESS_GROUPS = [
  'gratuito',
  'trial',
  PLUS_TIER,
  'monitor',
  ...LEGACY_PLUS_TIERS,
] as const

/**
 * Expande os grupos de um usuário para incluir os aliases legados, de modo que
 * um assinante `plus` continue enxergando material marcado como `premium` ou
 * `essential` (e vice-versa) enquanto a migração não terminou.
 */
export function expandUserAccessGroups(
  accountType?: string | null,
  secondaryRole?: string | null,
): string[] {
  const groups: string[] = []
  const normalized = normalizeAccountType(accountType)
  groups.push(normalized)
  if (normalized === PLUS_TIER) groups.push(...LEGACY_PLUS_TIERS)
  if (secondaryRole === 'monitor') groups.push('monitor')
  return groups
}

/**
 * Normaliza a lista `allowedGroups` de um item: se ela cita qualquer cargo pago
 * legado, o `plus` passa a valer também (e o inverso).
 */
export function normalizeAllowedGroups(groups?: string[] | null): string[] {
  if (!Array.isArray(groups) || groups.length === 0) return []
  const set = new Set<string>()
  for (const g of groups) {
    const raw = String(g)
    if ((PLUS_ACCOUNT_TYPES as readonly string[]).includes(raw)) {
      set.add(PLUS_TIER)
      LEGACY_PLUS_TIERS.forEach(l => set.add(l))
    } else {
      set.add(raw)
    }
  }
  return Array.from(set)
}

/**
 * O usuário passa na restrição de grupos do item?
 * Lista vazia = liberado para todos os cargos.
 */
export function matchesAccessGroups(
  allowedGroups: string[] | null | undefined,
  accountType?: string | null,
  secondaryRole?: string | null,
  isAdmin?: boolean,
): boolean {
  if (isAdmin) return true
  if (!Array.isArray(allowedGroups) || allowedGroups.length === 0) return true
  const allowed = normalizeAllowedGroups(allowedGroups)
  const userGroups = expandUserAccessGroups(accountType, secondaryRole)
  return userGroups.some(g => allowed.includes(g))
}

// ─── Visibilidade de aulas ────────────────────────────────────────────────────

/** `'premium'` continua sendo aceito na leitura de aulas antigas. */
export function isPlusOnlyAula(visibilidade?: string | null): boolean {
  const v = String(visibilidade || '').toLowerCase()
  return v === PLUS_TIER || v === 'premium' || v === 'essential'
}
