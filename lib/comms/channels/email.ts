// ────────────────────────────────────────────────────────────────────────────
// Adapter do canal de E-mail.
//
// Reaproveita o transporter pooled de lib/mail.ts e renderiza a partir do
// template + payload no momento do envio. Falhas são lançadas para o dispatcher
// tratar o retry/backoff.
// ────────────────────────────────────────────────────────────────────────────

import { transporter } from '@/lib/mail'
import { getMarketingEmailTemplate, personalize } from '../email-render'
import { PermanentSendError } from '../types'
import type { ChannelAdapter, OutboxMessage, OutboxTarget, SendResult } from '../types'

const FROM = process.env.SMTP_FROM || '"DomineAqui" <no-reply@domineaqui.com.br>'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Renderiza assunto + HTML a partir do payload da mensagem.
 * Suporta o template de campanha ('campaign-broadcast'); para outros templates,
 * usa `renderedBody`/`renderedSubject` se o enfileirador já os tiver preenchido.
 */
function render(msg: OutboxMessage): { subject: string; html: string } {
    const name = msg.to.name || ''
    const p = msg.payload as {
        subject?: string
        content?: string
        previewText?: string
        html?: string
    }

    if (msg.renderedBody) {
        return {
            subject: personalize(msg.renderedSubject || p.subject || '', name),
            html: personalize(msg.renderedBody, name),
        }
    }

    // Template de campanha: content = HTML dos blocos, envolvido no layout base.
    const html = p.html || getMarketingEmailTemplate(p.content || '', p.previewText)
    return {
        subject: personalize(p.subject || '', name),
        html: personalize(html, name),
    }
}

export const emailAdapter: ChannelAdapter = {
    channel: 'email',

    supports(to: OutboxTarget): boolean {
        return !!to.email && EMAIL_RE.test(to.email)
    },

    async send(msg: OutboxMessage): Promise<SendResult> {
        const to = msg.to.email
        if (!to || !EMAIL_RE.test(to)) {
            // Endereço inválido nunca vai funcionar: falha permanente (dead-letter).
            throw new PermanentSendError(`E-mail inválido: ${to ?? '(vazio)'}`)
        }
        const { subject, html } = render(msg)
        const info = await transporter.sendMail({ from: FROM, to, subject, html })
        return { providerMessageId: info.messageId }
    },
}
