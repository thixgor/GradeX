import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import clientPromise from '@/lib/mongodb'
import { sendLeadMaterialEmail } from '@/lib/mail'
import { upsertContact } from '@/lib/comms/contacts'
import { dispatch } from '@/lib/comms/dispatch'
import { recordHistory } from '@/lib/comms/history'
import { enroll } from '@/lib/comms/sequences'
import { normalizeBRPhone } from '@/lib/comms/phone'
import { renderPersuasion, buildPersuasionVars } from '@/lib/comms/persuasion'
import { personalize } from '@/lib/comms/email-render'
import type { OutboxMessage } from '@/lib/comms/types'

// Função para verificar email real (formato + MX record simples)
async function isValidEmail(email: string): Promise<boolean> {
    // Verificar formato
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return false

    // Lista de domínios de email válidos conhecidos
    const validDomains = [
        'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com',
        'live.com', 'msn.com', 'uol.com.br', 'bol.com.br', 'terra.com.br',
        'ig.com.br', 'globo.com', 'protonmail.com', 'zoho.com', 'aol.com',
        'me.com', 'mac.com', 'mail.com', 'yandex.com', 'gmx.com', 'gmx.net'
    ]

    const domain = email.split('@')[1]?.toLowerCase()

    // Se for um domínio conhecido, considerar válido
    if (validDomains.includes(domain)) return true

    // Para outros domínios, aceitar se tiver formato válido
    // (em produção, poderia fazer verificação DNS/MX)
    return true
}

export async function GET(
    req: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const { slug } = params

        const client = await clientPromise
        const db = client.db()

        const campaign = await db.collection('lead_campaigns').findOne({
            slug: slug,
            isActive: true
        })

        if (!campaign) {
            return NextResponse.json({ error: 'Material não encontrado' }, { status: 404 })
        }

        // Registrar visualização por IP
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
            req.headers.get('x-real-ip') ||
            'unknown'
        const userAgent = req.headers.get('user-agent') || undefined

        // Verificar se este IP já visualizou esta campanha

        const existingView = await db.collection('lead_page_views').findOne({
            campaignId: campaign._id.toString(),
            ip: ip
        })

        if (!existingView) {
            // Registrar nova visualização única
            await db.collection('lead_page_views').insertOne({
                campaignId: campaign._id.toString(),
                ip,
                userAgent,
                viewedAt: new Date()
            })

            // Incrementar contador de views
            await db.collection('lead_campaigns').updateOne(
                { _id: campaign._id },
                { $inc: { totalViews: 1 } }
            )
        }

        // Retornar dados públicos (sem emailBlocks para segurança)
        return NextResponse.json({
            campaign: {
                _id: campaign._id,
                name: campaign.name,
                imageUrl: campaign.imageUrl,
                collectButtonText: campaign.collectButtonText || 'Acessar Material',
                collectPhone: campaign.collectPhone || false,
                requirePhone: campaign.requirePhone || false
            }
        })
    } catch (error) {
        console.error('Erro ao buscar campanha pública:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const { slug } = params
        const body = await req.json()
        const { name, email, phone, consentWhatsapp } = body

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
        }

        if (!email?.trim()) {
            return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 })
        }

        // Validar email
        const isValid = await isValidEmail(email.trim().toLowerCase())
        if (!isValid) {
            return NextResponse.json({ error: 'Por favor, insira um e-mail válido' }, { status: 400 })
        }

        const client = await clientPromise
        const db = client.db()

        const campaign = await db.collection('lead_campaigns').findOne({
            slug: slug,
            isActive: true
        })

        if (!campaign) {
            return NextResponse.json({ error: 'Material não encontrado' }, { status: 404 })
        }

        const normalizedEmail = email.trim().toLowerCase()
        const normalizedName = name.trim()
        const phoneE164 = normalizeBRPhone(phone)

        // Canais de entrega da campanha (default: só e-mail).
        const channels: ('email' | 'whatsapp')[] =
            Array.isArray(campaign.channels) && campaign.channels.length
                ? campaign.channels
                : ['email']
        const persuasiveTag = campaign.defaultPersuasiveTag || undefined

        // Capturar IP do usuário
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            req.headers.get('x-real-ip') ||
            'unknown'

        // Verificar se email já existe nesta campanha

        const existingLead = await db.collection('leads').findOne({
            campaignId: campaign._id.toString(),
            email: normalizedEmail
        })

        // UUID: reaproveita o do lead existente ou gera um novo.
        const leadUuid: string = existingLead?.leadUuid || uuidv4()

        let emailSent = false
        let alreadySentBefore = false
        // Cidade geolocalizada do lead (existente ou recém-capturada) — usada para
        // personalizar mensagens com %cidade%.
        let leadCity: string | undefined = existingLead?.city

        if (existingLead) {
            // Lead já existe - verificar se email já foi enviado
            if (existingLead.emailSent) {
                alreadySentBefore = true
            }
            // Retrofit: garante UUID e telefone em leads antigos.
            const patch: Record<string, unknown> = {}
            if (!existingLead.leadUuid) patch.leadUuid = leadUuid
            if (phoneE164 && !existingLead.phoneE164) patch.phoneE164 = phoneE164
            if (persuasiveTag && !existingLead.persuasiveTag) patch.persuasiveTag = persuasiveTag
            if (Object.keys(patch).length) {
                await db.collection('leads').updateOne({ _id: existingLead._id }, { $set: patch })
            }
        } else {
            // Buscar geolocalização do IP
            let geoData: { state?: string; stateCode?: string; city?: string; country?: string } = {}

            try {
                if (ip && ip !== 'unknown' && !ip.startsWith('127.') && !ip.startsWith('192.168.') && !ip.startsWith('10.')) {
                    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,region,city`, {
                        signal: AbortSignal.timeout(3000) // Timeout de 3s
                    })
                    const geoJson = await geoRes.json()

                    if (geoJson.status === 'success') {
                        geoData = {
                            state: geoJson.regionName,
                            stateCode: geoJson.region,
                            city: geoJson.city,
                            country: geoJson.country
                        }
                    }
                }
            } catch (geoError) {
                console.error('Erro ao buscar geolocalização:', geoError)
                // Continua mesmo se falhar geolocalização
            }

            leadCity = geoData.city

            // Criar novo lead com IP e localização
            await db.collection('leads').insertOne({
                campaignId: campaign._id.toString(),
                leadUuid,
                name: normalizedName,
                email: normalizedEmail,
                phoneE164: phoneE164 || undefined,
                persuasiveTag,
                ip: ip,
                state: geoData.state,
                stateCode: geoData.stateCode,
                city: geoData.city,
                country: geoData.country,
                emailSent: false,
                whatsappQueued: false,
                createdAt: new Date()
            })

            // Incrementar contador de leads
            await db.collection('lead_campaigns').updateOne(
                { _id: campaign._id },
                { $inc: { totalLeads: 1 } }
            )
        }

        // Registra o contato nos dois sistemas (e-mail + WhatsApp) com consentimento
        // (LGPD): e-mail é consentido pelo próprio envio do formulário; WhatsApp só
        // se o usuário marcou o opt-in e informou telefone.
        const wantsWhatsapp = channels.includes('whatsapp') && !!phoneE164 && consentWhatsapp === true
        try {
            await upsertContact({
                leadUuid,
                email: normalizedEmail,
                phoneE164: phoneE164 || undefined,
                name: normalizedName,
                grant: { email: true, ...(wantsWhatsapp ? { whatsapp: true } : {}) },
                source: `lead-form:${campaign.slug}`,
                ip: ip !== 'unknown' ? ip : undefined,
                tags: [`campaign:${campaign.slug}`],
            })
        } catch (e) {
            console.error('Erro ao registrar contato:', e)
        }

        const target = { leadUuid, email: normalizedEmail, phoneE164: phoneE164 || undefined, name: normalizedName, city: leadCity }

        // ── E-mail: entrega imediata do material (template de blocos existente) ──
        if (channels.includes('email') && campaign.sendEmail && !alreadySentBefore) {
            try {
                await sendLeadMaterialEmail(
                    normalizedEmail,
                    normalizedName,
                    campaign.name,
                    campaign.emailSubject || `Seu material: ${campaign.name}`,
                    campaign.emailBlocks || campaign.blocks,
                    leadCity
                )

                await db.collection('leads').updateOne(
                    { campaignId: campaign._id.toString(), email: normalizedEmail },
                    { $set: { emailSent: true, emailSentAt: new Date() } }
                )
                // Registra no histórico unificado.
                await recordHistory(
                    { channel: 'email', to: target, templateKey: 'lead-material', campaignId: campaign._id.toString() } as OutboxMessage,
                    'sent',
                )
                emailSent = true
            } catch (emailError) {
                console.error('Erro ao enviar email:', emailError)
                // Continua mesmo se falhar o email
            }
        }

        // ── WhatsApp: primeiro toque (enfileirado, enviado pelo worker) ──
        if (wantsWhatsapp && !existingLead?.whatsappQueued) {
            try {
                const waVars = await buildPersuasionVars({
                    name: normalizedName,
                    city: leadCity,
                    persuasiveTag,
                    campaignId: campaign._id.toString(),
                    campaignName: campaign.name,
                })
                const waText = renderPersuasion(
                    campaign.whatsappTemplate ||
                        'Olá {{firstName}}! 👋 Aqui está seu material *{{campaignName}}*. Qualquer dúvida, é só responder por aqui.',
                    waVars,
                )
                await dispatch({
                    channels: ['whatsapp'],
                    to: target,
                    templateKey: 'lead-material',
                    payload: { text: waText },
                    campaignId: campaign._id.toString(),
                    checkConsent: true,
                    assumeGranted: true,
                    idempotencyKey: `lead-material:${leadUuid}`,
                })
                await db.collection('leads').updateOne(
                    { campaignId: campaign._id.toString(), email: normalizedEmail },
                    { $set: { whatsappQueued: true, whatsappSentAt: new Date() } }
                )
            } catch (waError) {
                console.error('Erro ao enfileirar WhatsApp:', waError)
            }
        }

        // ── Jornada/sequência de nurturing (se a campanha tiver uma) ──
        if (campaign.sequenceId && !existingLead) {
            try {
                await enroll({
                    sequenceKey: campaign.sequenceId,
                    to: target,
                    campaignId: campaign._id.toString(),
                    campaignName: campaign.name,
                    persuasiveTag,
                })
            } catch (seqError) {
                console.error('Erro ao matricular na jornada:', seqError)
            }
        }

        // Retornar material completo. Suporta {nome} (legado) e %nome%/%nome
        // completo%/%cidade% (mesma sintaxe usada no e-mail e no WhatsApp).
        const welcomeMessage = personalize(
            (campaign.welcomeMessage || 'Aqui está seu material, {nome}!').replace('{nome}', normalizedName),
            normalizedName,
            leadCity,
        )

        return NextResponse.json({
            success: true,
            welcomeMessage,
            blocks: campaign.blocks,
            emailSent,
            alreadySentBefore,
            message: alreadySentBefore
                ? 'Você já recebeu este material no seu e-mail anteriormente!'
                : (emailSent ? 'Material enviado para seu e-mail!' : undefined)
        })
    } catch (error) {
        console.error('Erro ao cadastrar lead:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
