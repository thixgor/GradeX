import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { normalizeBRPhone } from '@/lib/comms/phone'
import { upsertContact } from '@/lib/comms/contacts'

/**
 * Atualiza campos de um lead individual (metatag persuasiva, telefone).
 * POST { leadId, persuasiveTag?, phone? }
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { leadId, persuasiveTag, phone } = await req.json()
        if (!leadId || !ObjectId.isValid(leadId)) {
            return NextResponse.json({ error: 'leadId inválido' }, { status: 400 })
        }

        const client = await clientPromise
        const db = client.db()

        const lead = await db.collection('leads').findOne({ _id: new ObjectId(leadId) })
        if (!lead) {
            return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
        }

        const set: Record<string, unknown> = {}
        if (persuasiveTag !== undefined) set.persuasiveTag = String(persuasiveTag).trim() || null

        let phoneE164: string | null = null
        if (phone !== undefined) {
            phoneE164 = normalizeBRPhone(phone)
            if (phone && !phoneE164) {
                return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 })
            }
            set.phoneE164 = phoneE164 || null
        }

        await db.collection('leads').updateOne({ _id: new ObjectId(leadId) }, { $set: set })

        // Mantém o contato sincronizado (sem alterar consentimento existente).
        if (lead.leadUuid && (phoneE164 || persuasiveTag !== undefined)) {
            await upsertContact({
                leadUuid: lead.leadUuid,
                email: lead.email,
                phoneE164: phoneE164 || lead.phoneE164 || undefined,
                name: lead.name,
            })
        }

        return NextResponse.json({ success: true, phoneE164 })
    } catch (error) {
        console.error('Erro ao atualizar lead:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
