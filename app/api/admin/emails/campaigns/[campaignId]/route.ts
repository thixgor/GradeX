import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { drainQueueNow } from '@/lib/comms/process'
import { getCampaignProgress } from '@/lib/comms/email-campaigns'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Estado de uma campanha, destinatário a destinatário.
 *
 * A UI consulta em polling enquanto houver pendências — é assim que ela
 * consegue dizer QUEM já recebeu em vez de só declarar "enviado".
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: { campaignId: string } },
) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        const progress = await getCampaignProgress(params.campaignId)
        if (!progress) {
            return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
        }
        return NextResponse.json(progress)
    } catch (error) {
        console.error('Campaign progress error:', error)
        return NextResponse.json({ error: 'Erro ao consultar campanha' }, { status: 500 })
    }
}

/**
 * "Continuar envio agora": drena mais uma leva da fila sem esperar o cron.
 * Útil para campanhas grandes, em que uma requisição só não dá conta.
 */
export async function POST(
    _request: NextRequest,
    { params }: { params: { campaignId: string } },
) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        await drainQueueNow(['email'], { timeBudgetMs: 35_000 })

        const progress = await getCampaignProgress(params.campaignId)
        if (!progress) {
            return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
        }
        return NextResponse.json(progress)
    } catch (error) {
        console.error('Campaign drain error:', error)
        return NextResponse.json({ error: 'Erro ao continuar o envio' }, { status: 500 })
    }
}
