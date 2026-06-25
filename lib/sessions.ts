import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from './mongodb'
import { UserSession } from './types'
import { invalidateSessionCache } from './auth'

// Limite padrão de dispositivos logados simultaneamente por conta. Acima disso,
// o login mais novo derruba o mais antigo (sessão deslizante). Isso transforma
// o compartilhamento de conta num incômodo constante (um derruba o outro) e
// limita a pirataria de material. Ajustável por env sem novo deploy.
export const DEFAULT_MAX_DEVICES = (() => {
  const value = Number(process.env.MAX_DEVICES_PER_USER)
  if (!Number.isInteger(value) || value < 1 || value > 20) return 3
  return value
})()

// Considera uma sessão "online" se teve atividade nos últimos 10 min.
const ONLINE_THRESHOLD_MS = 10 * 60 * 1000

function sessionsCollection() {
  return getDb().then((db) => db.collection<UserSession>('sessions'))
}

/**
 * Garante os índices da coleção de sessões. Idempotente — chamado de forma
 * preguiçosa no primeiro createSession. Índice em jti acelera a validação por
 * request; índice em userId acelera a listagem do admin; TTL limpa sessões
 * revogadas/antigas automaticamente após 30 dias.
 */
let indexesEnsured = false
async function ensureIndexes() {
  if (indexesEnsured) return
  try {
    const col = await sessionsCollection()
    await col.createIndex({ jti: 1 }, { unique: true })
    await col.createIndex({ userId: 1, lastActiveAt: -1 })
    // Expira sessões 30 dias após a última atividade (mais que os 7d do token).
    await col.createIndex({ lastActiveAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 })
    indexesEnsured = true
  } catch (err) {
    // Não falha o login se a criação de índice der erro (ex: concorrência).
    console.error('[sessions] ensureIndexes error:', err)
  }
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return request.headers.get('x-real-ip') || 'desconhecido'
}

/**
 * Deriva um nome amigável de aparelho a partir do user-agent. Não pretende ser
 * exaustivo — só o suficiente para o admin reconhecer "Chrome no Windows" vs
 * "Safari no iPhone".
 */
export function parseDeviceName(userAgent?: string | null): string {
  const ua = (userAgent || '').toLowerCase()
  if (!ua) return 'Dispositivo desconhecido'

  // Sistema operacional / plataforma
  let os = 'Desconhecido'
  if (/windows/.test(ua)) os = 'Windows'
  else if (/iphone/.test(ua)) os = 'iPhone'
  else if (/ipad/.test(ua)) os = 'iPad'
  else if (/android/.test(ua)) os = 'Android'
  else if (/mac os x|macintosh/.test(ua)) os = 'Mac'
  else if (/linux/.test(ua)) os = 'Linux'

  // Navegador (ordem importa: Edge/Chrome contêm "safari"/"chrome")
  let browser = 'Navegador'
  if (/edg\//.test(ua)) browser = 'Edge'
  else if (/opr\/|opera/.test(ua)) browser = 'Opera'
  else if (/chrome|crios/.test(ua)) browser = 'Chrome'
  else if (/firefox|fxios/.test(ua)) browser = 'Firefox'
  else if (/safari/.test(ua)) browser = 'Safari'

  return `${browser} no ${os}`
}

/**
 * Cria o registro de sessão para um login e aplica o limite de dispositivos.
 * Deve ser chamado logo após emitir o token, passando o mesmo `jti` do JWT.
 */
export async function recordLoginSession(input: {
  request: NextRequest
  userId: string
  jti: string
  maxDevices?: number
}): Promise<void> {
  const { request, userId, jti } = input
  await ensureIndexes()
  const col = await sessionsCollection()
  const now = new Date()
  const userAgent = request.headers.get('user-agent') || ''

  await col.insertOne({
    userId,
    jti,
    ip: getClientIp(request),
    userAgent,
    deviceName: parseDeviceName(userAgent),
    createdAt: now,
    lastActiveAt: now,
  })

  await enforceDeviceLimit(userId, input.maxDevices ?? DEFAULT_MAX_DEVICES, jti)
}

/**
 * Revoga as sessões ativas mais antigas que excedem o limite, preservando a
 * recém-criada (keepJti). Revogadas por 'limit'.
 */
export async function enforceDeviceLimit(
  userId: string,
  maxDevices: number,
  keepJti?: string
): Promise<void> {
  const col = await sessionsCollection()
  const active = await col
    .find({ userId, revokedAt: { $exists: false } })
    .sort({ lastActiveAt: -1 })
    .toArray()

  if (active.length <= maxDevices) return

  // Mantém as `maxDevices` mais recentes; revoga o resto.
  const toRevoke = active.slice(maxDevices).filter((s) => s.jti !== keepJti)
  if (toRevoke.length === 0) return

  await col.updateMany(
    { _id: { $in: toRevoke.map((s) => s._id as ObjectId) } },
    { $set: { revokedAt: new Date(), revokedBy: 'limit' } }
  )
  invalidateSessionCache(userId)
}

/**
 * Estado de uma sessão por jti. Retorna:
 *  - 'active'   → sessão registrada e válida
 *  - 'revoked'  → sessão registrada porém revogada (deve deslogar)
 *  - 'untracked'→ sem registro (login legado; não enforce, deixa passar)
 */
export async function getSessionState(
  jti: string
): Promise<'active' | 'revoked' | 'untracked'> {
  const col = await sessionsCollection()
  const session = await col.findOne(
    { jti },
    { projection: { revokedAt: 1 } }
  )
  if (!session) return 'untracked'
  return session.revokedAt ? 'revoked' : 'active'
}

/** Atualiza lastActiveAt (throttle implícito: chamado no cache-miss do getSession). */
export async function touchSession(jti: string): Promise<void> {
  try {
    const col = await sessionsCollection()
    await col.updateOne(
      { jti, revokedAt: { $exists: false } },
      { $set: { lastActiveAt: new Date() } }
    )
  } catch {
    // best-effort
  }
}

export async function listUserSessions(userId: string) {
  const col = await sessionsCollection()
  const sessions = await col
    .find({ userId })
    .sort({ lastActiveAt: -1 })
    .limit(50)
    .toArray()

  const now = Date.now()
  return sessions.map((s) => ({
    id: s._id?.toString(),
    ip: s.ip || 'desconhecido',
    deviceName: s.deviceName || 'Dispositivo desconhecido',
    userAgent: s.userAgent || '',
    createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : undefined,
    lastActiveAt: s.lastActiveAt ? new Date(s.lastActiveAt).toISOString() : undefined,
    revoked: !!s.revokedAt,
    revokedBy: s.revokedBy,
    online:
      !s.revokedAt &&
      !!s.lastActiveAt &&
      now - new Date(s.lastActiveAt).getTime() < ONLINE_THRESHOLD_MS,
  }))
}

/** Conta dispositivos ativos (não revogados) de um usuário. */
export async function countActiveSessions(userId: string): Promise<number> {
  const col = await sessionsCollection()
  return col.countDocuments({ userId, revokedAt: { $exists: false } })
}

export async function revokeSessionById(
  userId: string,
  sessionId: string,
  revokedBy: UserSession['revokedBy'] = 'admin'
): Promise<boolean> {
  if (!ObjectId.isValid(sessionId)) return false
  const col = await sessionsCollection()
  const result = await col.updateOne(
    { _id: new ObjectId(sessionId), userId, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date(), revokedBy } }
  )
  if (result.modifiedCount > 0) invalidateSessionCache(userId)
  return result.modifiedCount > 0
}

export async function revokeAllUserSessions(
  userId: string,
  options: { exceptJti?: string; revokedBy?: UserSession['revokedBy'] } = {}
): Promise<number> {
  const col = await sessionsCollection()
  const filter: Record<string, unknown> = {
    userId,
    revokedAt: { $exists: false },
  }
  if (options.exceptJti) filter.jti = { $ne: options.exceptJti }

  const result = await col.updateMany(filter, {
    $set: { revokedAt: new Date(), revokedBy: options.revokedBy ?? 'admin' },
  })
  if (result.modifiedCount > 0) invalidateSessionCache(userId)
  return result.modifiedCount
}
