import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { dispatch } from '@/lib/comms/dispatch'
import { normalizeBRPhone } from '@/lib/comms/phone'
import { buildPersuasionVars, renderPersuasion } from '@/lib/comms/persuasion'
import { drainQueueNow } from '@/lib/comms/process'
import type { OutboxTarget, CommChannel } from '@/lib/comms/types'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface ManualTarget extends OutboxTarget {
    persuasiveTag?: string
}

interface SendBody {
    channels: CommChannel[] // ['email'], ['whatsapp'] ou ['email','whatsapp']
    audience: 'all-users' | 'contacts' | 'campaign' | 'manual'
    campaignId?: string
    /** Linhas cruas (uma por linha) com e-mail ou telefone — audience 'manual'. */
    manualRecipients?: string
    /** Aplicada a todos os destinatários manuais (não há lead individual). */
    manualPersuasiveTag?: string
    email?: { subject?: string; content?: string; previewText?: string }
    whatsapp?: { text?: string }
    /** Verificar consentimento (LGPD). Recomendado true, exceto para listas manuais confiáveis. */
    checkConsent?: boolean
    /** Assumir consentimento concedido quando não há registro prévio. */
    assumeGranted?: boolean
}

/** Interpreta uma lista de linhas em e-mails e telefones (detecção automática). */
function parseManualRecipients(raw: string): { targets: ManualTarget[]; invalid: string[] } {
    const lines = raw
        .split(/[\n,;]+/)
        .map((l) => l.trim())
        .filter(Boolean)

    const targets: ManualTarget[] = []
    const invalid: string[] = []
    const seen = new Set<string>()

    for (const line of lines) {
        if (EMAIL_RE.test(line)) {
            const email = line.toLowerCase()
            if (seen.has(`e:${email}`)) continue
            seen.add(`e:${email}`)
            targets.push({ email })
            continue
        }
        const phone = normalizeBRPhone(line)
        if (phone) {
            if (seen.has(`p:${phone}`)) continue
            seen.add(`p:${phone}`)
            targets.push({ phoneE164: phone })
            continue
        }
        invalid.push(line)
    }
    return { targets, invalid }
}

/**
 * Central unificada: cria uma comunicação e escolhe o canal (só e-mail, só
 * WhatsApp ou ambos). Personaliza por destinatário (tokens {{...}} + %nome%) e
 * enfileira na outbox; o cron `comms-dispatcher` envia.
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
        let targets: ManualTarget[] = []
        let campaignName: string | undefined
        let invalidManualEntries: string[] = []

        if (body.audience === 'all-users') {
            const users = await db.collection('users').find({}).project({ email: 1, name: 1 }).toArray()
            targets = users.map((u) => ({ email: u.email, name: u.name || '' }))
        } else if (body.audience === 'campaign' && body.campaignId) {
            if (!ObjectId.isValid(body.campaignId)) {
                return NextResponse.json({ error: 'ID de campanha inválido' }, { status: 400 })
            }
            const campaign = await db.collection('lead_campaigns').findOne({ _id: new ObjectId(body.campaignId) })
            campaignName = campaign?.name
            const leads = await db
                .collection('leads')
                .find({ campaignId: body.campaignId })
                .project({ email: 1, name: 1, phoneE164: 1, leadUuid: 1, persuasiveTag: 1, city: 1 })
                .toArray()
            targets = leads.map((l) => ({
                email: l.email,
                name: l.name || '',
                phoneE164: l.phoneE164,
                leadUuid: l.leadUuid,
                persuasiveTag: l.persuasiveTag,
                city: l.city,
            }))
        } else if (body.audience === 'manual') {
            const parsed = parseManualRecipients(body.manualRecipients || '')
            targets = parsed.targets.map((t) => ({ ...t, persuasiveTag: body.manualPersuasiveTag }))
            invalidManualEntries = parsed.invalid
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
            return NextResponse.json(
                {
                    error:
                        body.audience === 'manual' && invalidManualEntries.length
                            ? `Nenhum e-mail/telefone válido encontrado. Não reconhecidos: ${invalidManualEntries.slice(0, 5).join(', ')}`
                            : 'Nenhum destinatário encontrado',
                },
                { status: 400 },
            )
        }

        const rawSubject = body.email?.subject || ''
        const rawContent = body.email?.content || ''
        const rawPreview = body.email?.previewText
        const rawWaText = body.whatsapp?.text || ''
        const campaignIdTag = `social:${Date.now()}`
        const assumeGranted = body.assumeGranted ?? (body.audience === 'all-users' || body.audience === 'manual')

        // Variáveis de prova social (totalStudents/campaignLeads) exigem consultas
        // ao banco — resolvidas UMA vez para o lote inteiro (não por destinatário),
        // senão uma campanha com milhares de leads faria milhares de queries extras.
        const baseVars = await buildPersuasionVars({
            campaignId: body.audience === 'campaign' ? body.campaignId : undefined,
            campaignName,
        })

        // Enfileira por destinatário: personaliza nome/tag persuasiva de CADA um em
        // cima das variáveis-base, e renderiza subject/content/texto antes de
        // enfileirar — mesma lógica usada nas jornadas automáticas.
        const totals: Record<string, number> = { email: 0, whatsapp: 0 }
        const skippedByReason: Record<string, number> = {}

        const CAP = 20000
        for (const to of targets.slice(0, CAP)) {
            const firstName = (to.name || '').trim().split(/\s+/)[0] || 'estudante'
            const vars = {
                ...baseVars,
                firstName,
                nome: firstName,
                name: to.name || firstName,
                city: to.city || baseVars.city || '',
                cidade: to.city || baseVars.cidade || '',
                persuasiveTag: to.persuasiveTag || baseVars.persuasiveTag || '',
            }

            const emailPayload = channels.includes('email')
                ? {
                      subject: renderPersuasion(rawSubject, vars),
                      content: renderPersuasion(rawContent, vars),
                      previewText: rawPreview ? renderPersuasion(rawPreview, vars) : undefined,
                  }
                : {}
            const waPayload = channels.includes('whatsapp') ? { text: renderPersuasion(rawWaText, vars) } : {}

            const { enqueued, skipped } = await dispatch({
                channels,
                to,
                templateKey: 'social-broadcast',
                payload: { ...emailPayload, ...waPayload },
                campaignId: campaignIdTag,
                checkConsent: body.checkConsent !== false,
                assumeGranted,
                idempotencyKey: `${campaignIdTag}:${to.email || to.phoneE164}`,
            })
            for (const ch of enqueued) totals[ch] = (totals[ch] || 0) + 1
            for (const s of skipped) skippedByReason[s.reason] = (skippedByReason[s.reason] || 0) + 1
        }

        // Envia AGORA (não espera o cron, que no plano Hobby só roda 1x/dia, nem o
        // ticker externo). Respeita o rate-limit normalmente — só evita a espera.
        // Se o lote for grande, o que não couber no orçamento de tempo continua
        // "pending" e é pego pelo próximo tick do cron/ticker.
        const drainResults = await drainQueueNow(channels, { timeBudgetMs: 20_000 })
        const sentNow: Record<string, number> = {}
        const deadNow: Record<string, number> = {}
        for (const r of drainResults) {
            sentNow[r.channel] = r.sent
            deadNow[r.channel] = r.dead
        }
        const totalSentNow = drainResults.reduce((a, r) => a + r.sent, 0)
        const totalQueued = (totals.email || 0) + (totals.whatsapp || 0)
        const stillPending = totalQueued - totalSentNow

        return NextResponse.json({
            success: true,
            message:
                stillPending > 0
                    ? `Enviado agora: ${totalSentNow} de ${totalQueued} — o restante (${stillPending}) continua na fila e será enviado em instantes.`
                    : `Enviado: ${totalSentNow} de ${totalQueued}.`,
            campaignId: campaignIdTag,
            totals,
            sentNow,
            deadNow,
            skipped: skippedByReason,
            audienceSize: targets.length,
            invalidManualEntries: invalidManualEntries.length > 0 ? invalidManualEntries.slice(0, 20) : undefined,
        })
    } catch (error) {
        console.error('Social-media send error:', error)
        return NextResponse.json({ error: 'Erro ao enfileirar comunicação' }, { status: 500 })
    }
}
