import { getDb } from '../mongodb'

export type AuditAction =
  | 'order_created'
  | 'payment_approved'
  | 'payment_rejected'
  | 'payment_refunded'
  | 'webhook_received'
  | 'webhook_invalid'
  | 'role_granted'
  | 'role_revoked'
  | 'subscription_created'
  | 'subscription_canceled'
  | 'subscription_renewed'
  | 'subscription_expired'
  | 'material_unlocked'
  | 'manual_clinico_unlocked'
  | 'manual_clinico_revoked'
  | 'donation_approved'

export interface AuditLogEntry {
  action: AuditAction
  actorUserId?: string
  targetUserId?: string
  resourceType?: string
  resourceId?: string
  metadata?: Record<string, any>
  ip?: string
  userAgent?: string
  ts: Date
}

export async function audit(entry: Omit<AuditLogEntry, 'ts'>) {
  try {
    const db = await getDb()
    await db.collection<AuditLogEntry>('audit_logs').insertOne({ ...entry, ts: new Date() })
  } catch (err) {
    // logs nunca devem quebrar fluxo principal
    console.error('[audit] falha ao gravar log:', err)
  }
}
