import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { getSession } from '@/lib/auth'

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { id } = params
        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
        }

        const client = await clientPromise
        const db = client.db()


        const campaign = await db.collection('lead_campaigns').findOne({ _id: new ObjectId(id) })
        if (!campaign) {
            return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
        }

        // Buscar leads desta campanha
        const leads = await db
            .collection('leads')
            .find({ campaignId: id })
            .sort({ createdAt: -1 })
            .toArray()

        // Contar views únicas via Aggregation (mais performático que distinct em grandes datasets)
        const uniqueViewsResult = await db
            .collection('lead_page_views')
            .aggregate([
                { $match: { campaignId: id } },
                { $group: { _id: '$ip' } },
                { $count: 'total' }
            ])
            .toArray()

        const uniqueViewsCount = uniqueViewsResult[0]?.total || 0

        // Agregar leads por estado para gráfico
        const stateStats = await db.collection('leads').aggregate([
            { $match: { campaignId: id, state: { $ne: null, $exists: true } } },
            { $group: { _id: '$stateCode', state: { $first: '$state' }, count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]).toArray()

        // Formatar para o gráfico
        const stateData = stateStats.map(s => ({
            stateCode: s._id || 'N/A',
            state: s.state || 'Desconhecido',
            count: s.count
        }))

        return NextResponse.json({
            campaign,
            leads,
            stats: {
                totalLeads: leads.length,
                uniqueEmails: new Set(leads.map(l => l.email.toLowerCase())).size,
                totalViews: uniqueViewsCount
            },
            stateData
        })
    } catch (error) {
        console.error('Erro ao buscar campanha:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { id } = params
        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
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
            isActive
        } = body

        const client = await clientPromise
        const db = client.db()

        const updateData: Record<string, unknown> = {
            updatedAt: new Date()
        }

        if (name !== undefined) updateData.name = name.trim()
        if (description !== undefined) updateData.description = description?.trim() || null
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl?.trim() || null
        if (welcomeMessage !== undefined) updateData.welcomeMessage = welcomeMessage?.trim()
        if (blocks !== undefined) updateData.blocks = blocks
        if (collectButtonText !== undefined) updateData.collectButtonText = collectButtonText?.trim()
        if (sendEmail !== undefined) updateData.sendEmail = sendEmail
        if (emailSubject !== undefined) updateData.emailSubject = emailSubject?.trim()
        if (emailBlocks !== undefined) updateData.emailBlocks = emailBlocks
        if (isActive !== undefined) updateData.isActive = isActive

        const result = await db.collection('lead_campaigns').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        )

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Erro ao atualizar campanha:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { id } = params
        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
        }

        const client = await clientPromise
        const db = client.db()

        // Excluir campanha
        const result = await db.collection('lead_campaigns').deleteOne({ _id: new ObjectId(id) })
        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
        }

        // Excluir leads associados
        await db.collection('leads').deleteMany({ campaignId: id })

        // Excluir views associadas
        await db.collection('lead_page_views').deleteMany({ campaignId: id })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Erro ao excluir campanha:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
