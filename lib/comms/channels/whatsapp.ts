// ────────────────────────────────────────────────────────────────────────────
// Adapter do canal de WhatsApp (integração NÃO-OFICIAL via Baileys).
//
// IMPORTANTE: o cliente Baileys mantém uma conexão WebSocket persistente e uma
// sessão (autenticada por QR code) — isso NÃO roda em funções serverless da
// Vercel. Por isso o cliente vive num worker Node sempre-ligado
// (server/whatsapp-worker.js), e este adapter apenas faz uma chamada HTTP
// autenticada para esse worker enfileirar/enviar a mensagem.
//
// Risco assumido: contas não-oficiais podem ser banidas pelo WhatsApp a
// qualquer momento. Por isso o adapter é plugável — trocar para a API oficial
// (Meta Cloud API) depois é só substituir este arquivo, sem tocar no resto.
// ────────────────────────────────────────────────────────────────────────────

import { PermanentSendError } from '../types'
import { personalize } from '../email-render'
import type { ChannelAdapter, OutboxMessage, OutboxTarget, SendResult } from '../types'

const WORKER_URL = process.env.WHATSAPP_WORKER_URL || ''
const WORKER_SECRET = process.env.WHATSAPP_WORKER_SECRET || ''
const PHONE_RE = /^\+?[1-9]\d{7,14}$/ // E.164 (com ou sem o '+')

/** Normaliza para dígitos E.164 sem '+', como o Baileys espera (JID). */
function toJidNumber(phone: string): string {
    return phone.replace(/[^\d]/g, '')
}

/**
 * Renderiza o texto do WhatsApp a partir do payload.
 * Para o primeiro toque (fora da janela de 24h) o worker é responsável por usar
 * um "template" — aqui só montamos o texto e substituímos variáveis simples:
 * %nome%, %nome completo% (mesma sintaxe do e-mail) e %cidade% — resolvidas
 * com os dados do destinatário (só se disponíveis; sem sobrenome/cidade
 * cadastrados, o texto degrada graciosamente para o primeiro nome / vazio).
 * Mantém {{nome}}/{{nome_completo}} por compatibilidade com mensagens antigas.
 */
function renderText(msg: OutboxMessage): string {
    const p = msg.payload as { text?: string; templateText?: string }
    const raw = msg.renderedBody || p.text || p.templateText || ''
    const name = msg.to.name || ''
    const firstName = name.split(' ')[0] || 'você'
    return personalize(raw, name, msg.to.city)
        .replace(/\{\{\s*nome\s*\}\}/gi, firstName)
        .replace(/\{\{\s*nome_completo\s*\}\}/gi, name || 'você')
        .replace(/\{nome\}/gi, firstName)
}

export const whatsappAdapter: ChannelAdapter = {
    channel: 'whatsapp',

    supports(to: OutboxTarget): boolean {
        return !!to.phoneE164 && PHONE_RE.test(to.phoneE164)
    },

    async send(msg: OutboxMessage): Promise<SendResult> {
        if (!WORKER_URL || !WORKER_SECRET) {
            // Sem worker configurado é falha transitória (o worker pode subir depois),
            // então NÃO é permanente: o dispatcher tentará de novo com backoff.
            throw new Error('WhatsApp worker não configurado (WHATSAPP_WORKER_URL/SECRET)')
        }
        const phone = msg.to.phoneE164
        if (!phone || !PHONE_RE.test(phone)) {
            throw new PermanentSendError(`Telefone inválido: ${phone ?? '(vazio)'}`)
        }

        const text = renderText(msg)
        if (!text.trim()) {
            throw new PermanentSendError('Mensagem de WhatsApp vazia')
        }

        const res = await fetch(`${WORKER_URL.replace(/\/$/, '')}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${WORKER_SECRET}`,
            },
            body: JSON.stringify({
                to: toJidNumber(phone),
                text,
                // O worker usa como chave de idempotência do lado dele também.
                ref: msg._id?.toString(),
            }),
            signal: AbortSignal.timeout(20_000),
        })

        if (!res.ok) {
            const body = await res.text().catch(() => '')
            // 4xx (exceto 429) = pedido inválido → permanente. 429/5xx → retry.
            if (res.status >= 400 && res.status < 500 && res.status !== 429) {
                throw new PermanentSendError(`Worker recusou (${res.status}): ${body.slice(0, 200)}`)
            }
            throw new Error(`Worker indisponível (${res.status}): ${body.slice(0, 200)}`)
        }

        const data = (await res.json().catch(() => ({}))) as { messageId?: string }
        return { providerMessageId: data.messageId }
    },
}
