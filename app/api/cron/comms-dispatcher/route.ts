import { NextRequest, NextResponse } from 'next/server'
import { processAllChannels } from '@/lib/comms/process'
import { advanceSequences } from '@/lib/comms/sequences'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Dispatcher da fila de comunicação multicanal.
 *
 * NÃO é registrado no Vercel Cron (removido de vercel.json — o plano Hobby
 * do projeto já usa o teto de cron jobs com as outras rotinas existentes).
 * Este endpoint continua existindo e funcionando; ele só é acionado por:
 *  1. O próprio envio (`app/api/admin/social-media/send`), que drena a fila
 *     que acabou de criar antes de responder — ver lib/comms/process.ts. Isso
 *     cobre a maioria dos casos (envio parece instantâneo).
 *  2. O botão "Processar fila agora" no admin (`/api/admin/social-media/
 *     dispatch-now`), para o que sobrar de lotes grandes.
 *  3. Um ticker externo opcional (scripts/comms-ticker.js), rodando fora da
 *     Vercel (ex.: no mesmo host do worker de WhatsApp), que chama este
 *     endpoint a cada minuto — útil se quiser processamento contínuo mesmo
 *     sem ninguém abrir o admin.
 *
 * A cada execução:
 *  1. Avança jornadas/sequências (matrícula devida → enfileira o próximo passo).
 *  2. Para cada canal registrado, reserva atomicamente um lote de mensagens
 *     pendentes/reagendadas (claim com lease evita processamento duplo),
 *     respeita o rate-limit e envia via adapter.
 *
 * É seguro rodar concorrentemente e é idempotente por mensagem.
 *
 * Autenticação: `Bearer ${CRON_SECRET}` (o header `x-vercel-cron` continua
 * aceito, mas não é mais enviado por nada nesta configuração).
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
