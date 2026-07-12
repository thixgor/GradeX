import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { LeadCampaign, LeadBlock } from '@/lib/types'

// Gerar slug a partir do nome
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '-') // Espaços para hífens
        .replace(/-+/g, '-') // Múltiplos hífens para um
        .trim()
}

// GET - Listar todas as campanhas de leads
export async function GET(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const client = await clientPromise
        const db = client.db()

        const campaigns = await db
            .collection('lead_campaigns')
            .find()
            .sort({ createdAt: -1 })
            .toArray()

        return NextResponse.json({ campaigns })
    } catch (error) {
        console.error('Erro ao listar campanhas de leads:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

// POST - Criar nova campanha de leads
export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await req.json()
        const {
            name,
            description,
            imageUrl,
            welcomeMessage,
            blocks,
            collectButtonText,
            sendEmail,
            emailSubject,
            emailBlocks,
            channels,
            collectPhone,
            requirePhone,
            whatsappTemplate,
            defaultPersuasiveTag,
            sequenceId,
            isActive = true
        } = body

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
        }

        const client = await clientPromise
        const db = client.db()

        // Gerar slug único
        let baseSlug = generateSlug(name)
        let slug = baseSlug
        let counter = 1
        while (await db.collection('lead_campaigns').findOne({ slug })) {
            slug = `${baseSlug}-${counter}`
            counter++
        }

        const campaign: Omit<LeadCampaign, '_id'> = {
            name: name.trim(),
            slug,
            description: description?.trim() || undefined,
            imageUrl: imageUrl?.trim() || undefined,
            welcomeMessage: welcomeMessage?.trim() || 'Aqui está seu material, {nome}!',
            blocks: blocks || [],
            collectButtonText: collectButtonText?.trim() || 'Acessar Material',
            sendEmail: sendEmail || false,
            emailSubject: emailSubject?.trim() || `Seu material: ${name}`,
            emailBlocks: emailBlocks || [],
            channels: Array.isArray(channels) && channels.length ? channels : ['email'],
            collectPhone: collectPhone || false,
            requirePhone: requirePhone || false,
            whatsappTemplate: whatsappTemplate?.trim() || undefined,
            defaultPersuasiveTag: defaultPersuasiveTag?.trim() || undefined,
            sequenceId: sequenceId?.trim() || undefined,
            isActive: isActive,
            totalLeads: 0,
            totalViews: 0,
            createdBy: session.userId,
            createdByName: session.name,
            createdAt: new Date(),
            updatedAt: new Date()
        }

        const result = await db.collection('lead_campaigns').insertOne(campaign)

        return NextResponse.json({
            success: true,
            campaign: { ...campaign, _id: result.insertedId }
        })
    } catch (error) {
        console.error('Erro ao criar campanha de leads:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
