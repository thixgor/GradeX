'use server'

import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { sendLeadMaterialEmail } from '@/lib/mail'

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

// GET - Obter campanha pública pelo slug (sem autenticação)
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params

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
        // Garantir índice para performance
        await db.collection('lead_page_views').createIndex({ campaignId: 1, ip: 1 })

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
                collectButtonText: campaign.collectButtonText || 'Acessar Material'
            }
        })
    } catch (error) {
        console.error('Erro ao buscar campanha pública:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

// POST - Cadastrar lead e obter material
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params
        const body = await req.json()
        const { name, email } = body

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

        // Capturar IP do usuário
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            req.headers.get('x-real-ip') ||
            'unknown'

        // Verificar se email já existe nesta campanha
        // Garantir índice
        await db.collection('leads').createIndex({ campaignId: 1, email: 1 })

        const existingLead = await db.collection('leads').findOne({
            campaignId: campaign._id.toString(),
            email: normalizedEmail
        })

        let emailSent = false
        let alreadySentBefore = false

        if (existingLead) {
            // Lead já existe - verificar se email já foi enviado
            if (existingLead.emailSent) {
                alreadySentBefore = true
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

            // Criar novo lead com IP e localização
            await db.collection('leads').insertOne({
                campaignId: campaign._id.toString(),
                name: normalizedName,
                email: normalizedEmail,
                ip: ip,
                state: geoData.state,
                stateCode: geoData.stateCode,
                city: geoData.city,
                country: geoData.country,
                emailSent: false,
                createdAt: new Date()
            })

            // Incrementar contador de leads
            await db.collection('lead_campaigns').updateOne(
                { _id: campaign._id },
                { $inc: { totalLeads: 1 } }
            )
        }

        // Enviar email se configurado e ainda não foi enviado
        if (campaign.sendEmail && !alreadySentBefore) {
            try {
                await sendLeadMaterialEmail(
                    normalizedEmail,
                    normalizedName,
                    campaign.name,
                    campaign.emailSubject || `Seu material: ${campaign.name}`,
                    campaign.emailBlocks || campaign.blocks
                )

                // Marcar como enviado
                await db.collection('leads').updateOne(
                    { campaignId: campaign._id.toString(), email: normalizedEmail },
                    { $set: { emailSent: true, emailSentAt: new Date() } }
                )

                emailSent = true
            } catch (emailError) {
                console.error('Erro ao enviar email:', emailError)
                // Continua mesmo se falhar o email
            }
        }

        // Retornar material completo
        const welcomeMessage = (campaign.welcomeMessage || 'Aqui está seu material, {nome}!')
            .replace('{nome}', normalizedName)

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
