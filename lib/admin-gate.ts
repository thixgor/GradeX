import { SignJWT, jwtVerify } from 'jose'

// ============================================================
// Trava de segurança do painel administrativo
// ------------------------------------------------------------
// Ter o cookie `auth-token` de um admin não basta mais para abrir
// /admin (nem as rotas /api/admin). É preciso destravar o painel com
// um código numérico, que emite um segundo cookie de curta duração
// (`admin-gate`) validado no middleware a cada request.
//
// O objetivo é o cenário "esqueci logado num PC": quem senta na
// máquina continua com a sessão do site, mas não consegue entrar no
// painel nem disparar as rotas destrutivas sem saber o código.
//
// O token do gate é assinado com o mesmo JWT_SECRET, porém com
// `audience` própria — um auth-token nunca é aceito como gate e
// vice-versa. Ele também é amarrado ao par (userId, jti da sessão):
// copiar o cookie para outro navegador/sessão não funciona, e
// revogar a sessão do dispositivo derruba o gate junto.
//
// Tudo aqui é edge-safe (só `jose`), porque o middleware importa
// este módulo.
// ============================================================

export const ADMIN_GATE_COOKIE = 'admin-gate'
export const ADMIN_GATE_AUDIENCE = 'gradex:admin-gate'
export const ADMIN_GATE_ISSUER = 'gradex:auth'

/** Código padrão do painel. Sobrescrito por ADMIN_SECURITY_CODE. */
const DEFAULT_ADMIN_SECURITY_CODE = '1302'

/** Erro devolvido às rotas /api/* quando falta o gate (o client usa para abrir a tela de código). */
export const ADMIN_GATE_ERROR_CODE = 'ADMIN_CODE_REQUIRED'

/** Página que pede o código. */
export const ADMIN_GATE_PAGE = '/admin/verificacao'

function readIntEnv(name: string, fallback: number, min: number, max: number): number {
  const value = Number(process.env[name])
  if (!Number.isFinite(value)) return fallback
  const rounded = Math.round(value)
  if (rounded < min || rounded > max) return fallback
  return rounded
}

/**
 * Janela de inatividade do painel destravado (padrão 30 min). O cookie é
 * renovado a cada request admin, então só expira de fato depois de ficar
 * esse tempo parado — que é exatamente o caso do PC esquecido.
 */
export function getAdminGateIdleSeconds(): number {
  return readIntEnv('ADMIN_GATE_IDLE_MINUTES', 30, 1, 720) * 60
}

/**
 * Teto absoluto de um destravamento (padrão 12h). Mesmo em uso contínuo, o
 * código é pedido de novo ao fim desse período — evita que uma aba aberta
 * mantenha o painel destravado para sempre.
 */
export function getAdminGateAbsoluteSeconds(): number {
  return readIntEnv('ADMIN_GATE_MAX_HOURS', 12, 1, 168) * 3600
}

export function getAdminSecurityCode(): string {
  const configured = (process.env.ADMIN_SECURITY_CODE || '').trim()
  return configured || DEFAULT_ADMIN_SECURITY_CODE
}

/**
 * Comparação em tempo constante (sem `crypto` do Node, para rodar no Edge).
 * Compara sempre o mesmo número de posições para não vazar o tamanho nem o
 * prefixo correto do código pelo tempo de resposta.
 */
export function safeCompare(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length)
  let diff = a.length ^ b.length
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
  }
  return diff === 0
}

export function isAdminSecurityCodeValid(input: unknown): boolean {
  if (typeof input !== 'string') return false
  const candidate = input.trim()
  if (!candidate) return false
  return safeCompare(candidate, getAdminSecurityCode())
}

function getSecret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key-change-this'
  )
}

export interface AdminGatePayload {
  /** userId do admin que destravou. */
  sub: string
  /** jti da sessão de login (amarra o gate ao dispositivo). */
  sid: string
  /** Epoch em segundos do teto absoluto do destravamento. */
  abs: number
  exp?: number
  iat?: number
}

interface IssueOptions {
  userId: string
  sessionJti: string
  /** Preserva o teto absoluto ao renovar (deslizante). Novo destravamento omite. */
  absoluteExpiresAt?: number
}

export async function issueAdminGateToken(
  options: IssueOptions
): Promise<{ token: string; expiresAt: number; absoluteExpiresAt: number }> {
  const nowSeconds = Math.floor(Date.now() / 1000)
  const absoluteExpiresAt =
    options.absoluteExpiresAt ?? nowSeconds + getAdminGateAbsoluteSeconds()

  // Nunca deslizar para além do teto absoluto.
  const expiresAt = Math.min(nowSeconds + getAdminGateIdleSeconds(), absoluteExpiresAt)

  const token = await new SignJWT({ sid: options.sessionJti, abs: absoluteExpiresAt })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(options.userId)
    .setAudience(ADMIN_GATE_AUDIENCE)
    .setIssuer(ADMIN_GATE_ISSUER)
    .setIssuedAt(nowSeconds)
    .setExpirationTime(expiresAt)
    .sign(getSecret())

  return { token, expiresAt, absoluteExpiresAt }
}

export type AdminGateStatus =
  | { valid: true; payload: AdminGatePayload }
  | { valid: false; reason: 'missing' | 'invalid' | 'expired' | 'mismatch' }

export async function verifyAdminGateToken(
  token: string | undefined | null,
  binding: { userId?: string; sessionJti?: string }
): Promise<AdminGateStatus> {
  if (!token) return { valid: false, reason: 'missing' }

  let payload: AdminGatePayload
  try {
    const result = await jwtVerify(token, getSecret(), {
      audience: ADMIN_GATE_AUDIENCE,
      issuer: ADMIN_GATE_ISSUER,
    })
    payload = result.payload as unknown as AdminGatePayload
  } catch {
    // `jose` não separa assinatura inválida de expirada de forma barata aqui;
    // ambos os casos levam ao mesmo lugar (pedir o código de novo).
    return { valid: false, reason: 'invalid' }
  }

  const nowSeconds = Math.floor(Date.now() / 1000)
  if (!payload.abs || payload.abs <= nowSeconds) {
    return { valid: false, reason: 'expired' }
  }

  // Gate de outro admin ou de outra sessão do mesmo admin não vale.
  if (binding.userId && payload.sub !== binding.userId) {
    return { valid: false, reason: 'mismatch' }
  }
  if ((binding.sessionJti || '') !== (payload.sid || '')) {
    return { valid: false, reason: 'mismatch' }
  }

  return { valid: true, payload }
}

/**
 * Renova o cookie quando já passou metade da janela de inatividade. Evita
 * reassinar um JWT em toda navegação do painel sem deixar o admin expirar
 * no meio do trabalho.
 */
export function shouldRefreshAdminGate(payload: AdminGatePayload): boolean {
  const nowSeconds = Math.floor(Date.now() / 1000)
  const exp = payload.exp || 0
  if (exp <= nowSeconds) return false
  if (payload.abs && payload.abs <= exp) return false // já colado no teto
  return exp - nowSeconds < getAdminGateIdleSeconds() / 2
}

export function adminGateCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    // Restrito ao painel e às rotas administrativas: o cookie nem é enviado
    // no resto do site. Precisa cobrir /admin e /api/admin, então fica em '/'.
    path: '/',
    maxAge: Math.max(0, maxAgeSeconds),
  }
}

// ============================================================
// Mapa de rotas
// ============================================================

/** Rotas dentro do painel que precisam funcionar SEM o gate (senão, deadlock). */
const GATE_EXEMPT_PATHS = new Set<string>([
  ADMIN_GATE_PAGE,
  '/api/admin/security/gate',
])

export function isAdminGateExemptPath(pathname: string): boolean {
  return GATE_EXEMPT_PATHS.has(pathname)
}

/** Páginas e APIs do painel. Cobre `/admin` exato, não só `/admin/...`. */
export function isAdminAreaPath(pathname: string): boolean {
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/api/admin' ||
    pathname.startsWith('/api/admin/')
  )
}

// "Áreas adjacentes": rotas administrativas que vivem fora de /api/admin e são
// chamadas pelas telas do painel. Todas já exigem admin no próprio handler, e
// o gate só é cobrado de quem tem role admin — nenhum usuário comum é afetado.
// O que isso fecha é o atalho: chamar a API destrutiva direto, sem passar pela
// tela do painel.

/** Subárvores 100% administrativas (qualquer método, incluindo GET). */
const ADJACENT_ADMIN_SUBTREES = [
  '/api/users',     // listar, editar cargo/plano e excluir contas
  '/api/settings',  // configuração global + reset-database
]

/** Rotas administrativas isoladas (qualquer método). */
const ADJACENT_ADMIN_EXACT = new Set([
  '/api/loja/settings',
  '/api/loja/upload',
  '/api/forum/settings',
  '/api/serial-keys/clear-history',
  '/api/proctoring/sessions',
])

/**
 * Rotas de leitura compartilhada mas escrita administrativa. Casam no caminho
 * exato ou em `caminho/<objectId>` — o suficiente para cobrir o CRUD do painel
 * sem alcançar sub-rotas de uso geral (ex.: /api/serial-keys/checkout, que é
 * compra pública, ou /api/exams/<id>/submissions, que é fluxo de aluno).
 */
const ADJACENT_ADMIN_WRITE = [
  '/api/exams',
  '/api/materiais',
  '/api/serial-keys',
  '/api/loja/produtos',
  '/api/display-settings',
  '/api/flashcards/themes',
]

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const OBJECT_ID_SEGMENT = /^[a-fA-F0-9]{24}$/

function matchesExactOrObjectId(pathname: string, base: string): boolean {
  if (pathname === base) return true
  if (!pathname.startsWith(base + '/')) return false
  return OBJECT_ID_SEGMENT.test(pathname.slice(base.length + 1))
}

/**
 * Decide se um request precisa do gate. `method` só importa para as rotas
 * adjacentes de escrita; o painel em si é protegido em qualquer método.
 */
export function requiresAdminGate(pathname: string, method: string): boolean {
  if (isAdminGateExemptPath(pathname)) return false
  if (isAdminAreaPath(pathname)) return true
  if (ADJACENT_ADMIN_EXACT.has(pathname)) return true

  if (
    ADJACENT_ADMIN_SUBTREES.some(
      (base) => pathname === base || pathname.startsWith(base + '/')
    )
  ) {
    return true
  }

  if (WRITE_METHODS.has(method.toUpperCase())) {
    return ADJACENT_ADMIN_WRITE.some((base) => matchesExactOrObjectId(pathname, base))
  }

  return false
}
