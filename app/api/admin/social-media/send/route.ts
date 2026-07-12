import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { dispatch } from '@/lib/comms/dispatch'
import type { OutboxTarget, CommChannel } from '@/lib/comms/types'

export const dynamic = 'force-dynamic'

interface SendBody {
    channels: CommChannel[] // ['email'], ['whatsapp'] ou ['email','whatsapp']
    audience: 'all-users' | 'contacts' | 'campaign'
    campaignId?: string
    email?: { subject?: string; content?: string; previewText?: string }
    whatsapp?: { text?: string }
    /** Verificar consentimento (LGPD). Recomendado true para WhatsApp/marketing. */
    checkConsent?: boolean
}

/**
 * Central unificada: cria uma comunicação e escolhe o canal (só e-mail, só
 * WhatsApp ou ambos). Enfileira na outbox; o cron `comms-dispatcher` envia.
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        const body: SendBody = await request.json()
        const channels = (body.channels || []).filter((c) => c === 'email' || c === 'whatsapp')
        if (channels.length === 0) {
            return NextResponse.json({ error: 'Selecione ao menos um canal' }, { status: 400 })
        }
        if (channels.includes('email') && !body.email?.content) {
            return NextResponse.json({ error: 'Conteúdo do e-mail é obrigatório' }, { status: 400 })
        }
        if (channels.includes('whatsapp') && !body.whatsapp?.text) {
            return NextResponse.json({ error: 'Texto do WhatsApp é obrigatório' }, { status: 400 })
        }

        const db = await getDb()

        // ── Resolve o público em alvos multicanal ──
        let targets: OutboxTarget[] = []

        if (body.audience === 'all-users') {
            const users = await db.collection('users').find({}).project({ email: 1, name: 1 }).toArray()
            targets = users.map((u) => ({ email: u.email, name: u.name || '' }))
        } else if (body.audience === 'campaign' && body.campaignId) {
            const leads = await db
                .collection('leads')
                .find({ campaignId: body.campaignId })
                .project({ email: 1, name: 1, phoneE164: 1, leadUuid: 1, persuasiveTag: 1 })
                .toArray()
            targets = leads.map((l) => ({
                email: l.email,
                name: l.name || '',
                phoneE164: l.phoneE164,
                leadUuid: l.leadUuid,
            }))
        } else {
            // 'contacts' — base unificada com consentimento.
            const contacts = await db.collection('comms_contacts').find({}).toArray()
            targets = contacts.map((c) => ({
                email: c.email,
                name: c.name || '',
                phoneE164: c.phoneE164,
                leadUuid: c.leadUuid,
                userId: c.userId,
            }))
        }

        if (targets.length === 0) {
            return NextResponse.json({ error: 'Nenhum destinatário encontrado' }, { status: 400 })
        }

        // Snapshot do HTML de e-mail (renderizado por destinatário no envio).
        const emailPayload = body.email
            ? {
                  subject: body.email.subject || '',
                  content: body.email.content || '',
                  previewText: body.email.previewText,
              }
            : undefined
        const waPayload = body.whatsapp ? { text: body.whatsapp.text || '' } : undefined
        const campaignId = `social:${Date.now()}`

        // Enfileira por destinatário, respeitando consentimento quando pedido.
        const totals: Record<string, number> = { email: 0, whatsapp: 0 }
        const skippedByReason: Record<string, number> = {}

        const CAP = 20000
        for (const to of targets.slice(0, CAP)) {
            const { enqueued, skipped } = await dispatch({
                channels,
                to,
                templateKey: 'social-broadcast',
                payload: { ...(emailPayload || {}), ...(waPayload || {}) },
                campaignId,
                checkConsent: body.checkConsent !== false,
                assumeGranted: body.audience === 'all-users', // usuários cadastrados já opt-in do produto
                idempotencyKey: `${campaignId}:${to.email || to.phoneE164}`,
            })
            for (const ch of enqueued) totals[ch] = (totals[ch] || 0) + 1
            for (const s of skipped) skippedByReason[s.reason] = (skippedByReason[s.reason] || 0) + 1
        }

        return NextResponse.json({
            success: true,
            message: `Enfileirado — e-mail: ${totals.email || 0}, WhatsApp: ${totals.whatsapp || 0}`,
            campaignId,
            totals,
            skipped: skippedByReason,
            audienceSize: targets.length,
        })
    } catch (error) {
        console.error('Social-media send error:', error)
        return NextResponse.json({ error: 'Erro ao enfileirar comunicação' }, { status: 500 })
    }
}
