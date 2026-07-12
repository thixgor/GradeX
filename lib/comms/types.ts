// ────────────────────────────────────────────────────────────────────────────
// Núcleo de comunicação multicanal (E-mail + WhatsApp + futuros canais).
//
// Toda a plataforma passa a ENFILEIRAR mensagens numa única coleção MongoDB
// (`outbox_messages`), que funciona ao mesmo tempo como fila de trabalho e como
// log de auditoria por destinatário. Rotas serverless nunca enviam direto: elas
// só enfileiram. Um worker (cron `comms-dispatcher`) drena a fila, chama o
// adapter do canal e registra o resultado, com retry + backoff exponencial.
//
// Adicionar um canal novo (SMS, push) = criar um novo ChannelAdapter e
// registrá-lo em `registry.ts`. Nada mais muda.
// ────────────────────────────────────────────────────────────────────────────

import type { ObjectId } from 'mongodb'

export type CommChannel = 'email' | 'whatsapp' | 'sms' | 'push'

export type OutboxStatus =
    | 'pending'      // aguardando processamento
    | 'processing'   // reservada por um worker (lease ativo)
    | 'sent'         // entregue ao provedor com sucesso
    | 'delivered'    // confirmada como entregue (via webhook do provedor)
    | 'failed'       // falhou nesta tentativa, será reprocessada
    | 'dead'         // esgotou as tentativas (dead-letter, inspeção manual)
    | 'skipped'      // não enviada por falta de consentimento/contato

/** Destinatário resolvido de uma mensagem. */
export interface OutboxTarget {
    userId?: string
    leadUuid?: string
    email?: string
    /** Telefone em formato E.164, ex.: +5511999998888 */
    phoneE164?: string
    /** Nome usado para personalização. */
    name?: string
}

/** Snapshot do consentimento no momento em que a mensagem foi enfileirada (LGPD). */
export interface ConsentSnapshot {
    granted: boolean
    source?: string
    at?: Date
    ip?: string
}

/** Documento único da fila/auditoria. Um por destinatário por canal. */
export interface OutboxMessage {
    _id?: ObjectId
    channel: CommChannel
    status: OutboxStatus

    to: OutboxTarget

    /** Chave lógica do template (ex.: 'lead-material', 'campaign-broadcast'). */
    templateKey: string
    /** Variáveis para renderização (nome, persuasiveTag, etc.). */
    payload: Record<string, unknown>

    /** Assunto/corpo já renderizados (snapshot do que foi de fato enviado). */
    renderedSubject?: string
    renderedBody?: string

    // Controle de fila / retry
    attempts: number
    maxAttempts: number
    nextAttemptAt: Date
    /** Enquanto reservada por um worker, até quando o lease é válido. */
    leaseUntil?: Date

    // Rastreabilidade
    providerMessageId?: string
    lastError?: string
    /** Chave de idempotência para evitar envio duplicado do mesmo conteúdo. */
    idempotencyKey?: string

    // Agrupamento
    campaignId?: string
    sequenceId?: string
    consentSnapshot?: ConsentSnapshot

    createdAt: Date
    updatedAt: Date
    sentAt?: Date
    deliveredAt?: Date
}

/** Resultado do envio por um adapter de canal. */
export interface SendResult {
    /** ID retornado pelo provedor (messageId SMTP, id da Cloud API, etc.). */
    providerMessageId?: string
}

/** Conteúdo renderizado por um canal a partir do template + payload. */
export interface RenderedContent {
    subject?: string
    body: string
}

/**
 * Contrato comum a todo canal (padrão Strategy/Adapter). Um adapter só precisa
 * saber renderizar e enviar; fila, retry, rate-limit e log são responsabilidade
 * do dispatcher.
 */
export interface ChannelAdapter {
    readonly channel: CommChannel
    /** Este destinatário tem os dados necessários para este canal? */
    supports(to: OutboxTarget): boolean
    /** Envia a mensagem. Deve lançar em caso de falha (o dispatcher trata o retry). */
    send(msg: OutboxMessage): Promise<SendResult>
}

/** Erro que sinaliza ao dispatcher que a falha é permanente (vai direto p/ dead). */
export class PermanentSendError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'PermanentSendError'
    }
}
