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
  /** Alguém editou o registro de cargos em /admin/cargos. */
  | 'cargos_updated'
  /** Monitorias (lib/monitorias): moderação, disputas e dinheiro do monitor. */
  | 'monitoria_anuncio_moderado'
  | 'monitoria_tutor_status'
  | 'monitoria_disputa_resolvida'
  | 'monitoria_pix_alterado'
  | 'monitoria_pix_revelado'
  /** Repasse retido por divergência com o MP, decidido pelo admin. */
  | 'monitoria_retencao_decidida'
  | 'monitoria_payout_criado'
  | 'monitoria_payout_comprovante'
  | 'monitoria_payout_pago'
  | 'monitoria_payout_cancelado'
  /** Chaves da sala de aula (Admin → Monitorias → Sala de vídeo) e o corte do TURN. */
  | 'monitoria_sala_config'
  | 'monitoria_sala_turn_cortado'
  /** Suporte agindo numa aula: encerrar/reabrir, tirar/liberar alguém, cancelar. */
  | 'monitoria_sala_suporte'
  | 'monitoria_cancelada_suporte'
  | 'monitoria_excluida_suporte'
  | 'monitoria_restaurada_suporte'
  /** O admin abriu a conversa de uma monitoria (prestação de contas, LGPD). */
  | 'monitoria_chat_lido'
  /** Suporte mudou o horário (ou "iniciar agora") e salas de teste do admin. */
  | 'monitoria_horario_suporte'
  | 'monitoria_sala_teste'
  | 'monitoria_sala_teste_excluida'

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
