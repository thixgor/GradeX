import { getDb } from '../mongodb'

export type AuditAction =
  | 'order_created'
  | 'order_approved_manually'
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
  | 'raffle_created'
  | 'raffle_updated'
  | 'raffle_deleted'
  | 'raffle_numbers_sold'
  | 'raffle_numbers_released'
  | 'raffle_drawn'
  | 'plus_guard_action'
  | 'plus_claims_revoked'
  | 'plus_claims_restored'
  | 'prouni_request_created'
  | 'prouni_request_reviewed'
  | 'prouni_attachments_purged'
  | 'prouni_benefit_updated'
  | 'prouni_benefit_deleted'
  | 'prouni_discount_applied'

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
