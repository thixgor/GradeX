import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { listCampaigns } from '@/lib/comms/email-campaigns'

export const dynamic = 'force-dynamic'

/** Histórico das últimas campanhas disparadas (manuais e agendadas). */
export async function GET() {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        const campaigns = await listCampaigns(25)
        return NextResponse.json({ campaigns })
    } catch (error) {
        console.error('List campaigns error:', error)
        return NextResponse.json({ error: 'Erro ao listar campanhas' }, { status: 500 })
    }
}
