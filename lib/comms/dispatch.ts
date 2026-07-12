// ────────────────────────────────────────────────────────────────────────────
// Orquestrador de alto nível: ponto de entrada que o resto da plataforma usa
// para "enviar" uma comunicação. Ele NÃO envia nada de fato — apenas enfileira
// (uma mensagem por canal escolhido) na outbox. O worker/cron faz o envio.
//
// Este é o lugar onde, na Parte 3, as preferências/consentimento do usuário
// (LGPD) são resolvidas antes de enfileirar cada canal.
// ────────────────────────────────────────────────────────────────────────────

import { enqueue, enqueueMany } from './outbox'
import type { EnqueueInput } from './outbox'
import { getAdapter } from './registry'
import type { CommChannel, OutboxTarget } from './types'

export interface DispatchInput {
    /** Canais desejados: ['email'], ['whatsapp'] ou ['email','whatsapp']. */
    channels: CommChannel[]
    to: OutboxTarget
    templateKey: string
    payload?: Record<string, unknown>
    campaignId?: string
    sequenceId?: string
    scheduledAt?: Date
    idempotencyKey?: string
}

/**
 * Enfileira uma comunicação nos canais escolhidos, pulando os canais para os
 * quais o destinatário não tem dados de contato (ex.: sem telefone → sem WhatsApp).
 * Retorna quais canais foram efetivamente enfileirados.
 */
export async function dispatch(input: DispatchInput): Promise<{ enqueued: CommChannel[] }> {
    const enqueued: CommChannel[] = []
    for (const channel of input.channels) {
        const adapter = getAdapter(channel)
        if (!adapter || !adapter.supports(input.to)) continue

        const id = await enqueue({
            channel,
            to: input.to,
            templateKey: input.templateKey,
            payload: input.payload,
            campaignId: input.campaignId,
            sequenceId: input.sequenceId,
            scheduledAt: input.scheduledAt,
            idempotencyKey: input.idempotencyKey
                ? `${input.idempotencyKey}:${channel}`
                : undefined,
        })
        if (id !== null) enqueued.push(channel)
    }
    return { enqueued }
}

/**
 * Versão em lote para campanhas (muitos destinatários, um mesmo template).
 * Enfileira em massa por canal. Retorna o total inserido.
 */
export async function dispatchBulk(
    channel: CommChannel,
    targets: OutboxTarget[],
    templateKey: string,
    payload: Record<string, unknown>,
    opts: { campaignId?: string; idempotencyPrefix?: string } = {},
): Promise<number> {
    const adapter = getAdapter(channel)
    if (!adapter) return 0

    const inputs: EnqueueInput[] = targets
        .filter((to) => adapter.supports(to))
        .map((to) => ({
            channel,
            to,
            templateKey,
            payload,
            campaignId: opts.campaignId,
            idempotencyKey: opts.idempotencyPrefix
                ? `${opts.idempotencyPrefix}:${channel}:${to.email || to.phoneE164 || to.userId}`
                : undefined,
        }))

    return enqueueMany(inputs)
}
