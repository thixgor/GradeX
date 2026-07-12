// ────────────────────────────────────────────────────────────────────────────
// Histórico unificado por canal.
//
// Requisito (Parte 3): cada mensagem deve ser registrada nos "sistemas de
// histórico" de e-mail E WhatsApp, para haver registro unificado.
//
// A fonte da verdade é `outbox_messages`. Estas coleções-espelho
// (`email_history`, `whatsapp_history`) são derivadas: cada envio grava uma
// linha no histórico do seu canal, permitindo painéis por-canal e por-contato
// sem varrer a outbox inteira.
// ────────────────────────────────────────────────────────────────────────────

import { getDb } from '@/lib/mongodb'
import type { CommChannel, OutboxMessage } from './types'

const HISTORY_COLLECTION: Record<CommChannel, string> = {
    email: 'email_history',
    whatsapp: 'whatsapp_history',
    sms: 'sms_history',
    push: 'push_history',
}

export interface HistoryEntry {
    outboxId?: string
    channel: CommChannel
    to: OutboxMessage['to']
    templateKey: string
    campaignId?: string
    sequenceId?: string
    status: 'sent' | 'failed' | 'dead'
    providerMessageId?: string
    error?: string
    at: Date
}

/** Registra uma linha no histórico do canal correspondente à mensagem. */
export async function recordHistory(
    msg: OutboxMessage,
    status: HistoryEntry['status'],
    extra: { providerMessageId?: string; error?: string } = {},
): Promise<void> {
    try {
        const db = await getDb()
        const entry: HistoryEntry = {
            outboxId: msg._id?.toString(),
            channel: msg.channel,
            to: msg.to,
            templateKey: msg.templateKey,
            campaignId: msg.campaignId,
            sequenceId: msg.sequenceId,
            status,
            providerMessageId: extra.providerMessageId,
            error: extra.error,
            at: new Date(),
        }
        await db.collection<HistoryEntry>(HISTORY_COLLECTION[msg.channel]).insertOne(entry)
    } catch (err) {
        // Histórico é auxiliar: nunca deve derrubar o envio.
        console.error('[comms] falha ao registrar histórico:', err)
    }
}
