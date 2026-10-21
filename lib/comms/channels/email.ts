// ────────────────────────────────────────────────────────────────────────────
// Adapter do canal de E-mail.
//
// Envia por `enviarEmail` (lib/envio-de-email.ts) e renderiza a partir do
// template + payload no momento do envio. Falhas são lançadas para o dispatcher
// tratar o retry/backoff.
// ────────────────────────────────────────────────────────────────────────────

import { classificarFalhaSmtp, enviarEmail } from '@/lib/envio-de-email'
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
    const city = msg.to.city
    const p = msg.payload as {
        subject?: string
        content?: string
        previewText?: string
        html?: string
    }

    if (msg.renderedBody) {
        return {
            subject: personalize(msg.renderedSubject || p.subject || '', name, city),
            html: personalize(msg.renderedBody, name, city),
        }
    }

    // Template de campanha: content = HTML dos blocos, envolvido no layout base.
    const html = p.html || getMarketingEmailTemplate(p.content || '', p.previewText)
    return {
        subject: personalize(p.subject || '', name, city),
        html: personalize(html, name, city),
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
        // A outbox já tem retentativa com backoff e histórico próprio
        // (`email_history`): aqui só uma segunda chance imediata, para o caso
        // do socket velho no pool, e nada de registro duplicado.
        try {
            const info = await enviarEmail(
                { from: FROM, to, subject, html },
                { registrar: false, tentativas: 2, categoria: 'campanha' },
            )
            return { providerMessageId: info.messageId }
        } catch (err) {
            // Caixa inexistente ou mensagem grande demais não melhoram com o
            // tempo: vai direto para dead-letter em vez de gastar as 5
            // tentativas da outbox.
            const tipo = classificarFalhaSmtp(err)
            if (tipo === 'destinatario' || tipo === 'tamanho') {
                throw new PermanentSendError(err instanceof Error ? err.message : String(err))
            }
            throw err
        }
    },
}
