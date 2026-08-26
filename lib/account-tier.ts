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
 *  - `isPlusAccount()` é o único teste de "esse usuário tem a plataforma toda?".
 *
 * Desde o lançamento do **Quest+** (`accountType: 'quest'`, o produto avulso do
 * Banco de Questões) existe um segundo cargo pago, e "pagante" deixou de ser
 * sinônimo de "Plus+": use `isPaidAccount()` para dinheiro e
 * `temAcessoAoBanco()` para o Banco.
 *
 * Nunca compare `accountType === 'premium'` diretamente. Use os helpers.
 */

import type { AccountType } from './types'

/** Cargo pago canônico. */
export const PLUS_TIER = 'plus' as const

/** Rótulo de marca do cargo pago. Não traduzir/abreviar. */
export const PLUS_LABEL = 'Plus+'

/**
 * Cargo do **Quest+** — o produto avulso do Banco de Questões.
 *
 * O Plus+ é "a plataforma inteira"; o Quest+ é uma fatia só: o Banco de
 * Questões liberado por completo (questões ilimitadas, listas, histórico e
 * desempenho) mais o download em PDF das provas — prova em branco, gabarito e
 * resposta comentada, que é o par que a venda promete a quem quer estudar no
 * papel (`canDownloadExamPdf()` em `lib/tier-limits.ts`). Fora disso, a conta
 * Quest+ vale o mesmo que uma conta gratuita — quem quiser Manual Clínico,
 * materiais, aulas ou provas por IA continua precisando do Plus+.
 *
 * É um cargo pago de verdade (tem prazo, vence e é rebaixado pelo cron), então
 * ele NUNCA passa em `isPlusAccount()`. O teste certo depende da pergunta:
 *
 *  - "essa conta paga alguma coisa?" → `isPaidAccount()`
 *  - "essa conta tem a plataforma inteira?" → `isPlusAccount()`
 *  - "essa conta tem o Banco?" → `temAcessoAoBanco()` (ou, no servidor,
 *    `bancoLiberadoPeloPlano()` em `lib/banco/acesso-servidor.ts`)
 */
export const QUEST_TIER = 'quest' as const

/**
 * Rótulo de marca do cargo do Banco de Questões.
 *
 * O "+" não é enfeite: é como o produto é vendido e como o aluno o chama. Todo
 * cargo pago da plataforma carrega o sinal ("Plus+", "Quest+"), e escrever
 * "Quest" solo numa tela de venda faz parecer outro produto. Não traduzir/abreviar.
 */
export const QUEST_LABEL = 'Quest+'

/**
 * Para onde vai quem clica em "Assinar".
 *
 * Existe como constante porque a resposta errada é invisível em revisão de
 * código: vários botões apontavam para `/loja`, que nunca teve página (só
 * `/loja/[id]` e `/loja/checkout` existem), e o clique que mais importa —
 * o de quem decidiu pagar — caía num 404. A vitrine de planos é `/buy`.
 */
export const ROTA_ASSINATURA = '/buy'

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
export const CANONICAL_ACCOUNT_TYPES: AccountType[] = ['gratuito', 'trial', QUEST_TIER, PLUS_TIER]

/**
 * Cargos que representam dinheiro entrando — os que vencem e são rebaixados.
 * Use em filtros de expiração, não em checagem de acesso.
 */
export const PAID_ACCOUNT_TYPES = [PLUS_TIER, QUEST_TIER, ...LEGACY_PLUS_TIERS] as const

/**
 * Formato de id que um cargo criado em `/admin/cargos` pode ter.
 * Espelha `slugDeCargo()` em `lib/cargos.ts` — mudar um exige mudar o outro.
 */
const FORMATO_DE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Traduz qualquer valor vindo do banco/entrada do usuário para o cargo
 * canônico.
 *
 * Os aliases legados viram o cargo de hoje (`premium` → `plus`). Um id de
 * cargo criado pelo admin **passa direto**: esta função é um normalizador de
 * formato, não um validador de existência — ela não pode consultar o registro
 * (é síncrona e roda no navegador), e devolver `'gratuito'` para todo cargo
 * que ela não conhece de fábrica rebaixaria silenciosamente cada conta com
 * cargo personalizado. Quem precisa saber se o cargo existe de verdade
 * consulta o registro (`acharCargo`), que devolve `null` para id órfão.
 *
 * Só valor ausente ou fora do formato de slug vira `'gratuito'`.
 */
export function normalizeAccountType(value?: string | null): AccountType {
  if (!value) return 'gratuito'
  const v = String(value).trim().toLowerCase()
  if (v === 'premium' || v === 'essential' || v === 'plus' || v === 'plus+') return PLUS_TIER
  if (v === 'quest' || v === 'quest+') return QUEST_TIER
  if (v === 'trial') return 'trial'
  if (v === 'gratuito') return 'gratuito'
  return FORMATO_DE_SLUG.test(v) ? (v as AccountType) : 'gratuito'
}

/**
 * O usuário é um assinante Plus+? Admin sempre tem acesso total.
 * Aceita `string` solto porque muitos callers leem o campo direto do Mongo.
 */
export function isPlusAccount(accountType?: string | null, isAdmin?: boolean): boolean {
  if (isAdmin) return true
  return normalizeAccountType(accountType) === PLUS_TIER
}

/**
 * O usuário tem o cargo Quest+? Admin passa sempre.
 *
 * Isto responde "tem o cargo", e não "pode ver o Banco": um assinante Plus+
 * também pode, e é `temAcessoAoBanco()` que junta os dois.
 */
export function isQuestAccount(accountType?: string | null, isAdmin?: boolean): boolean {
  if (isAdmin) return true
  return normalizeAccountType(accountType) === QUEST_TIER
}

/** A conta paga algum plano (Plus+ ou Quest+)? Trial não conta — não é receita. */
export function isPaidAccount(accountType?: string | null, isAdmin?: boolean): boolean {
  if (isAdmin) return true
  const t = normalizeAccountType(accountType)
  return t === PLUS_TIER || t === QUEST_TIER
}

/**
 * O cargo, sozinho, dá direito ao Banco de Questões?
 *
 * Plus+ (a plataforma inteira) e Quest+ (o Banco) passam. O plano assinado
 * ainda pode restringir a área — quem fecha a conta no servidor é
 * `bancoLiberadoPeloPlano()`, que chama esta função e depois confere as
 * permissões do plano.
 */
export function temAcessoAoBanco(accountType?: string | null, isAdmin?: boolean): boolean {
  if (isAdmin) return true
  const t = normalizeAccountType(accountType)
  return t === PLUS_TIER || t === QUEST_TIER
}

/** Atalho para checagens de sessão (`session.role === 'admin'`). */
export function isAdminRole(role?: string | null): boolean {
  return role === 'admin'
}

/** Rótulos de exibição. Não expõe mais "Premium"/"Essential" na interface. */
export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  gratuito: 'Gratuito',
  trial: 'Trial',
  quest: QUEST_LABEL,
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
  { id: QUEST_TIER, label: QUEST_LABEL },
  { id: PLUS_TIER, label: PLUS_LABEL },
  { id: 'monitor', label: 'Monitor' },
] as const

/** Inclui os legados para validar payloads antigos sem rejeitá-los. */
export const VALID_ACCESS_GROUPS = [
  'gratuito',
  'trial',
  QUEST_TIER,
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

// ─── Assinantes ativos ────────────────────────────────────────────────────────

/**
 * Filtro Mongo para "assinante Plus+ ativo agora".
 *
 * Ter `accountType: 'plus'` não basta para contar como assinante:
 *
 *  - **expirados** mantêm o cargo até o cron noturno ou o próximo login
 *    rebaixarem a conta, então a janela entre o vencimento e o rebaixamento
 *    inflaria qualquer contagem que olhasse só o cargo;
 *  - **admins** podem ter o cargo por conveniência de teste e não são receita;
 *  - **banidos** não consomem nem renovam.
 *
 * `premiumExpiresAt` ausente/nulo significa vitalício — conta como ativo.
 */
export function activePlusUserFilter(now: Date = new Date()): Record<string, unknown> {
  return {
    role: 'user',
    banned: { $ne: true },
    accountType: { $in: [...PLUS_ACCOUNT_TYPES] },
    $or: [
      { premiumExpiresAt: { $exists: false } },
      { premiumExpiresAt: null },
      { premiumExpiresAt: { $gt: now } },
    ],
  }
}

/**
 * Contas que ainda carregam o cargo pago mas cujo prazo já venceu — ficam
 * assim até o cron rebaixar. Número alto aqui indica cron parado.
 */
export function expiredPlusUserFilter(now: Date = new Date()): Record<string, unknown> {
  return {
    role: 'user',
    accountType: { $in: [...PLUS_ACCOUNT_TYPES] },
    premiumExpiresAt: { $lte: now },
  }
}

/** Versão em memória de `activePlusUserFilter`, para listas já carregadas. */
export function isActivePlusUser(
  user: {
    role?: string
    banned?: boolean
    accountType?: string | null
    premiumExpiresAt?: Date | string | null
  } | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!user) return false
  if (user.role !== 'user') return false
  if (user.banned) return false
  if (!isPlusAccount(user.accountType)) return false
  if (!user.premiumExpiresAt) return true
  return new Date(user.premiumExpiresAt) > now
}
