// ════════════════════════════════════════════════════════════════════════════
// WhatsApp Worker (integração NÃO-OFICIAL via Baileys)
//
// POR QUE ISTO É UM PROCESSO SEPARADO:
// A integração não-oficial mantém uma conexão WebSocket persistente com o
// WhatsApp e uma sessão autenticada por QR code. Isso NÃO funciona em funções
// serverless (Vercel), que sobem e descem a cada request. Este worker precisa
// rodar num host SEMPRE-LIGADO (VPS, Railway, Render, Fly.io, um mini-servidor
// em casa, etc.), separado do deploy Next.js na Vercel.
//
// COMO SE CONECTA AO RESTO DO SISTEMA:
// As rotas serverless apenas ENFILEIRAM mensagens no MongoDB (lib/comms). O cron
// `comms-dispatcher` chama o adapter de WhatsApp (lib/comms/channels/whatsapp.ts),
// que faz um POST HTTP para o endpoint /send DESTE worker. O worker envia pela
// sessão do Baileys e responde com o messageId.
//
// ⚠️ RISCO: números em integrações não-oficiais podem ser banidos pelo WhatsApp
// a qualquer momento. Use um número dedicado (descartável), aqueça o volume
// devagar, e mantenha a API oficial como plano B — como o adapter é plugável,
// migrar depois não exige reescrever o sistema.
//
// COMO RODAR (primeira vez):
//   1. npm install @whiskeysockets/baileys qrcode-terminal pino
//   2. WHATSAPP_WORKER_SECRET=<mesmo-do-.env> node server/whatsapp-worker.js
//   3. Escaneie o QR code que aparece no terminal com o WhatsApp do número.
//   4. A sessão fica salva em ./.wa-session — não precisa reescanear a cada boot.
// ════════════════════════════════════════════════════════════════════════════

const { createServer } = require('http')
const path = require('path')

// Baileys é ESM-only nas versões recentes; carregamos via import() dinâmico.
let baileys = null
let qrcodeTerminal = null

const PORT = Number(process.env.WHATSAPP_WORKER_PORT) || 8088
const SECRET = process.env.WHATSAPP_WORKER_SECRET || ''
const SESSION_DIR = process.env.WHATSAPP_SESSION_DIR || path.join(process.cwd(), '.wa-session')
// Atraso mínimo entre envios (ms) — reduz risco de flag anti-spam do WhatsApp.
const MIN_SEND_INTERVAL_MS = Number(process.env.WHATSAPP_MIN_INTERVAL_MS) || 4000

if (!SECRET) {
  console.error('[WA] WHATSAPP_WORKER_SECRET é obrigatório. Abortando.')
  process.exit(1)
}

let sock = null
let connectionState = 'connecting' // connecting | open | close | qr
let lastQr = null
let lastSendAt = 0

async function startSock() {
  if (!baileys) {
    baileys = await import('@whiskeysockets/baileys')
    try {
      qrcodeTerminal = require('qrcode-terminal')
    } catch {
      qrcodeTerminal = null
    }
  }

  const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = baileys

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)
  const { version } = await fetchLatestBaileysVersion()

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false, // tratamos o QR manualmente abaixo
    markOnlineOnConnect: false,
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update
    if (qr) {
      connectionState = 'qr'
      lastQr = qr
      if (qrcodeTerminal) {
        console.log('[WA] Escaneie o QR code abaixo com o WhatsApp:')
        qrcodeTerminal.generate(qr, { small: true })
      } else {
        console.log('[WA] QR string (use um gerador de QR):', qr)
      }
    }
    if (connection === 'open') {
      connectionState = 'open'
      lastQr = null
      console.log('[WA] Conectado ✔')
    }
    if (connection === 'close') {
      connectionState = 'close'
      const statusCode = lastDisconnect?.error?.output?.statusCode
      const loggedOut = statusCode === DisconnectReason.loggedOut
      console.log(`[WA] Conexão fechada (code=${statusCode}). ${loggedOut ? 'Deslogado — reescaneie o QR.' : 'Reconectando…'}`)
      if (!loggedOut) {
        setTimeout(() => startSock().catch((e) => console.error('[WA] reconnect erro', e)), 3000)
      }
    }
  })
}

/** Envia uma mensagem de texto. Retorna o messageId. */
async function sendText(numberDigitsOnly, text) {
  if (connectionState !== 'open' || !sock) {
    const err = new Error('WhatsApp não conectado')
    err.retryable = true
    throw err
  }
  // Espaçamento mínimo entre envios (anti-spam simples).
  const wait = Math.max(0, lastSendAt + MIN_SEND_INTERVAL_MS - Date.now())
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastSendAt = Date.now()

  const jid = `${numberDigitsOnly}@s.whatsapp.net`

  // Confere se o número existe no WhatsApp antes de enviar.
  const [exists] = await sock.onWhatsApp(jid).catch(() => [])
  if (!exists || !exists.exists) {
    const err = new Error('Número não está no WhatsApp')
    err.permanent = true
    throw err
  }

  const sent = await sock.sendMessage(jid, { text })
  return sent?.key?.id || null
}

// ── Servidor HTTP interno (consumido pelo adapter serverless) ────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (c) => {
      data += c
      if (data.length > 1_000_000) reject(new Error('payload grande demais'))
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

const server = createServer(async (req, res) => {
  const send = (status, obj) => {
    res.writeHead(status, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(obj))
  }

  // Health/status é público (sem segredos vazados).
  if (req.method === 'GET' && req.url === '/status') {
    return send(200, { connection: connectionState, hasQr: !!lastQr })
  }

  const auth = req.headers['authorization'] || ''
  if (auth !== `Bearer ${SECRET}`) {
    return send(401, { error: 'unauthorized' })
  }

  // QR atual (para autenticar via painel, se não tiver acesso ao terminal).
  if (req.method === 'GET' && req.url === '/qr') {
    return send(200, { qr: lastQr, connection: connectionState })
  }

  if (req.method === 'POST' && req.url === '/send') {
    try {
      const body = JSON.parse((await readBody(req)) || '{}')
      const { to, text } = body
      if (!to || !text) return send(400, { error: 'campos "to" e "text" obrigatórios' })
      const messageId = await sendText(String(to), String(text))
      return send(200, { ok: true, messageId })
    } catch (err) {
      if (err.permanent) return send(422, { error: err.message }) // não reenviar
      return send(503, { error: err.message || 'falha ao enviar' })   // reenviar depois
    }
  }

  return send(404, { error: 'not found' })
})

server.listen(PORT, () => {
  console.log(`[WA] Worker HTTP ouvindo na porta ${PORT}`)
  startSock().catch((e) => {
    console.error('[WA] Falha ao iniciar sessão:', e)
    process.exit(1)
  })
})
