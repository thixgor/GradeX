import { getDb } from './mongodb'

// ============================================================
// Trilha de auditoria de segurança do painel.
//
// Registra quem destravou, quem errou o código, quem trancou e quem
// derrubou as sessões dos administradores. Existe justamente para o
// caso "conta esquecida logada": se alguém tentar entrar, fica o
// rastro com IP, dispositivo e horário.
//
// Best-effort por design — nenhuma falha de escrita aqui pode
// derrubar a ação de segurança em si.
// ============================================================

export type AdminSecurityEventType =
  | 'gate_unlocked'        // código correto
  | 'gate_failed'          // código errado
  | 'gate_locked'          // admin trancou o painel manualmente
  | 'gate_rate_limited'    // excesso de tentativas
  | 'admins_logged_out'    // logout em massa dos administradores
  | 'database_reset_challenged'  // alguém pediu o desafio para esvaziar o banco
  | 'database_reset'             // o banco foi esvaziado (coleções movidas para a lixeira)
  | 'database_reset_failed'      // tentativa de esvaziar o banco recusada

export interface AdminSecurityEvent {
  type: AdminSecurityEventType
  userId?: string
  userName?: string
  userEmail?: string
  ip?: string
  deviceName?: string
  /** Detalhes específicos do evento (ex.: quantas sessões foram revogadas). */
  meta?: Record<string, unknown>
  createdAt: Date
}

const COLLECTION = 'admin_security_events'

/** Mantém a coleção enxuta: eventos somem sozinhos depois de 180 dias. */
let indexesEnsured = false
async function ensureIndexes() {
  if (indexesEnsured) return
  try {
    const db = await getDb()
    const col = db.collection<AdminSecurityEvent>(COLLECTION)
    await Promise.all([
      col.createIndex({ createdAt: -1 }),
      col.createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 }),
    ])
    indexesEnsured = true
  } catch (err) {
    console.error('[admin-audit] ensureIndexes error:', err)
  }
}

export async function logAdminSecurityEvent(
  event: Omit<AdminSecurityEvent, 'createdAt'>
): Promise<void> {
  try {
    void ensureIndexes()
    const db = await getDb()
    await db
      .collection<AdminSecurityEvent>(COLLECTION)
      .insertOne({ ...event, createdAt: new Date() })
  } catch (err) {
    console.error('[admin-audit] logAdminSecurityEvent error:', err)
  }
}

export async function listAdminSecurityEvents(limit = 20) {
  try {
    const db = await getDb()
    const events = await db
      .collection<AdminSecurityEvent>(COLLECTION)
      .find({})
      .sort({ createdAt: -1 })
      .limit(Math.min(Math.max(limit, 1), 100))
      .toArray()

    return events.map((event) => ({
      id: event._id?.toString(),
      type: event.type,
      userName: event.userName || '',
      userEmail: event.userEmail || '',
      ip: event.ip || 'desconhecido',
      deviceName: event.deviceName || '',
      meta: event.meta || {},
      createdAt: event.createdAt ? new Date(event.createdAt).toISOString() : undefined,
    }))
  } catch (err) {
    console.error('[admin-audit] listAdminSecurityEvents error:', err)
    return []
  }
}
