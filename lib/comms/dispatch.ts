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
import { resolveConsent } from './contacts'
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
    /** Se true, verifica o consentimento (LGPD) do canal antes de enfileirar. */
    checkConsent?: boolean
    /** Se não houver registro de consentimento, assumir concedido (ex.: opt-in no ato). */
    assumeGranted?: boolean
}

export interface DispatchResult {
    enqueued: CommChannel[]
    skipped: { channel: CommChannel; reason: string }[]
}

/**
 * Enfileira uma comunicação nos canais escolhidos, pulando canais sem contato
 * (ex.: sem telefone → sem WhatsApp) ou sem consentimento (quando checkConsent).
 * Retorna quais canais foram enfileirados e quais foram pulados (com motivo).
 */
export async function dispatch(input: DispatchInput): Promise<DispatchResult> {
    const enqueued: CommChannel[] = []
    const skipped: { channel: CommChannel; reason: string }[] = []

    for (const channel of input.channels) {
        const adapter = getAdapter(channel)
        if (!adapter) {
            skipped.push({ channel, reason: 'canal não registrado' })
            continue
        }
        if (!adapter.supports(input.to)) {
            skipped.push({ channel, reason: 'sem dado de contato para o canal' })
            continue
        }

        let consentSnapshot
        if (input.checkConsent) {
            const { allowed, snapshot } = await resolveConsent(
                {
                    email: input.to.email,
                    phoneE164: input.to.phoneE164,
                    leadUuid: input.to.leadUuid,
                    userId: input.to.userId,
                },
                channel,
                input.assumeGranted,
            )
            if (!allowed) {
                skipped.push({ channel, reason: 'sem consentimento (LGPD)' })
                continue
            }
            consentSnapshot = snapshot
        }

        const id = await enqueue({
            channel,
            to: input.to,
            templateKey: input.templateKey,
            payload: input.payload,
            campaignId: input.campaignId,
            sequenceId: input.sequenceId,
            scheduledAt: input.scheduledAt,
            consentSnapshot,
            idempotencyKey: input.idempotencyKey
                ? `${input.idempotencyKey}:${channel}`
                : undefined,
        })
        if (id !== null) enqueued.push(channel)
    }
    return { enqueued, skipped }
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
