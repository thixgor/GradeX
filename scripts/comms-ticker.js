// ════════════════════════════════════════════════════════════════════════════
// Comms Ticker — aciona o dispatcher da fila a cada minuto DE FORA da Vercel.
//
// POR QUE ISTO EXISTE:
// O plano Hobby da Vercel só permite cron 1×/dia — insuficiente para uma fila de
// mensagens. Este script roda num host sempre-ligado (o mesmo PC do worker de
// WhatsApp) e chama o endpoint `/api/cron/comms-dispatcher` a cada N segundos,
// dando a cadência de 1 minuto sem depender do plano da Vercel.
//
// (Alternativa sem instalar nada: um serviço gratuito como cron-job.org batendo
//  no mesmo endpoint com o header Authorization: Bearer <CRON_SECRET>.)
//
// COMO RODAR:
//   export APP_URL="https://domineaqui.com.br"
//   export CRON_SECRET="<mesmo do .env do app>"
//   npm run comms:ticker
//
// Com PM2 (recomendado, junto do worker):
//   pm2 start "npm run comms:ticker" --name comms-ticker && pm2 save
// ════════════════════════════════════════════════════════════════════════════

const APP_URL = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
const CRON_SECRET = process.env.CRON_SECRET || ''
const INTERVAL_MS = Number(process.env.COMMS_TICKER_INTERVAL_MS) || 60_000

if (!APP_URL) {
    console.error('[ticker] Defina APP_URL (ex.: https://domineaqui.com.br). Abortando.')
    process.exit(1)
}
if (!CRON_SECRET) {
    console.error('[ticker] Defina CRON_SECRET (o mesmo do app). Abortando.')
    process.exit(1)
}

const ENDPOINT = `${APP_URL}/api/cron/comms-dispatcher`
let running = false

async function tick() {
    if (running) return // evita sobreposição se um tick demorar
    running = true
    try {
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { Authorization: `Bearer ${CRON_SECRET}` },
            signal: AbortSignal.timeout(55_000),
        })
        if (!res.ok) {
            console.error(`[ticker] ${new Date().toISOString()} → HTTP ${res.status}`)
        } else {
            const data = await res.json().catch(() => ({}))
            const sent = (data.results || []).reduce((a, r) => a + (r.sent || 0), 0)
            const seq = data.sequences ? `, seq +${data.sequences.advanced || 0}` : ''
            if (sent > 0 || (data.sequences && data.sequences.advanced > 0)) {
                console.log(`[ticker] ${new Date().toISOString()} → enviados ${sent}${seq}`)
            }
        }
    } catch (err) {
        console.error(`[ticker] ${new Date().toISOString()} → erro:`, err.message || err)
    } finally {
        running = false
    }
}

console.log(`[ticker] Acionando ${ENDPOINT} a cada ${INTERVAL_MS / 1000}s`)
tick()
setInterval(tick, INTERVAL_MS)
