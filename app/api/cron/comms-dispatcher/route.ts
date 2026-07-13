import { NextRequest, NextResponse } from 'next/server'
import { processAllChannels } from '@/lib/comms/process'
import { advanceSequences } from '@/lib/comms/sequences'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Dispatcher da fila de comunicação multicanal.
 *
 * Acionado pelo Vercel Cron (ver vercel.json — no plano Hobby só pode ser
 * diário, por isso ele funciona como REDE DE SEGURANÇA) e/ou por um ticker
 * externo (scripts/comms-ticker.js) rodando a cada minuto. A maioria dos
 * envios, porém, já sai na hora: o próprio endpoint de envio
 * (app/api/admin/social-media/send) drena a fila que acabou de criar antes
 * de responder — ver lib/comms/process.ts.
 *
 * A cada execução:
 *  1. Avança jornadas/sequências (matrícula devida → enfileira o próximo passo).
 *  2. Para cada canal registrado, reserva atomicamente um lote de mensagens
 *     pendentes/reagendadas (claim com lease evita processamento duplo),
 *     respeita o rate-limit e envia via adapter.
 *
 * É seguro rodar concorrentemente e é idempotente por mensagem.
 *
 * Autenticação: header `x-vercel-cron` (Vercel) ou `Bearer ${CRON_SECRET}`.
 * Também aceita POST manual (mesmo auth) para "drenar" a fila sob demanda.
 */
async function handle(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const sequences = await advanceSequences()
    const results = await processAllChannels()

    return NextResponse.json({ ok: true, at: new Date().toISOString(), sequences, results })
}

export async function GET(request: NextRequest) {
    return handle(request)
}

export async function POST(request: NextRequest) {
    return handle(request)
}

function isAuthorized(request: NextRequest): boolean {
    if (request.headers.get('x-vercel-cron')) return true
    const auth = request.headers.get('authorization') || ''
    const expected = `Bearer ${process.env.CRON_SECRET || ''}`
    return !!process.env.CRON_SECRET && auth === expected
}
