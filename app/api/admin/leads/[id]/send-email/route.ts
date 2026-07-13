import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { sendLeadMaterialEmail } from '@/lib/mail'

// POST - Enviar email manualmente para um lead específico
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { id } = params // ID da campanha
        const body = await req.json()
        const { leadId } = body

        if (!ObjectId.isValid(id) || !ObjectId.isValid(leadId)) {
            return NextResponse.json({ error: 'IDs inválidos' }, { status: 400 })
        }

        const client = await clientPromise
        const db = client.db()

        // Buscar campanha
        const campaign = await db.collection('lead_campaigns').findOne({ _id: new ObjectId(id) })
        if (!campaign) {
            return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
        }

        // Buscar lead
        const lead = await db.collection('leads').findOne({ _id: new ObjectId(leadId) })
        if (!lead) {
            return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
        }

        // Verificar se já foi enviado
        if (lead.emailSent) {
            return NextResponse.json({
                error: 'E-mail já foi enviado para este lead anteriormente',
                alreadySent: true,
                sentAt: lead.emailSentAt
            }, { status: 400 })
        }

        // Enviar email
        try {
            await sendLeadMaterialEmail(
                lead.email,
                lead.name,
                campaign.name,
                campaign.emailSubject || `Seu material: ${campaign.name}`,
                campaign.emailBlocks || campaign.blocks,
                lead.city
            )

            // Marcar como enviado
            await db.collection('leads').updateOne(
                { _id: new ObjectId(leadId) },
                { $set: { emailSent: true, emailSentAt: new Date() } }
            )

            return NextResponse.json({ success: true, message: 'E-mail enviado com sucesso!' })
        } catch (emailError) {
            console.error('Erro ao enviar email:', emailError)
            return NextResponse.json({ error: 'Erro ao enviar e-mail' }, { status: 500 })
        }
    } catch (error) {
        console.error('Erro ao enviar email para lead:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
