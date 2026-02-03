const { createServer } = require('http')
const { WebSocketServer, WebSocket } = require('ws')
const { parse } = require('url')
const crypto = require('crypto')

// ==========================================
// CONFIGURAÇÃO DE SEGURANÇA
// ==========================================

// Chave secreta para validação de tokens (deve ser a mesma do JWT_SECRET)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

// Rate limit para conexões por IP
const connectionRateLimits = new Map()
const MAX_CONNECTIONS_PER_IP = 10
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minuto

// Tokens de conexão válidos (gerados pelo servidor Next.js)
const validConnectionTokens = new Map()

// ==========================================
// FUNÇÕES DE SEGURANÇA
// ==========================================

// Valida token de conexão usando HMAC
function validateConnectionToken(token, userId, role, timestamp) {
  if (!token || !userId || !role || !timestamp) {
    return false
  }

  // Verificar se o timestamp não está muito velho (5 minutos)
  const tokenTime = parseInt(timestamp, 10)
  const now = Date.now()
  if (isNaN(tokenTime) || now - tokenTime > 5 * 60 * 1000) {
    console.log('[WS] Token expirado')
    return false
  }

  // Calcular HMAC esperado
  const data = `${userId}:${role}:${timestamp}`
  const expectedToken = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('hex')

  // Comparação segura contra timing attacks
  if (token.length !== expectedToken.length) {
    return false
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(expectedToken)
    )
  } catch {
    return false
  }
}

// Gera token de conexão (para uso no servidor Next.js)
function generateConnectionToken(userId, role) {
  const timestamp = Date.now().toString()
  const data = `${userId}:${role}:${timestamp}`
  const token = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('hex')

  return { token, timestamp }
}

// Rate limiting por IP
function checkRateLimit(ip) {
  const now = Date.now()
  const record = connectionRateLimits.get(ip)

  if (!record || record.resetAt < now) {
    connectionRateLimits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (record.count >= MAX_CONNECTIONS_PER_IP) {
    return false
  }

  record.count++
  return true
}

// Sanitiza string para prevenir injeção
function sanitizeString(str, maxLength = 100) {
  if (!str || typeof str !== 'string') return ''
  return str.slice(0, maxLength).replace(/[<>"'&]/g, '')
}

// ==========================================
// SERVIDOR WEBSOCKET
// ==========================================

const clients = new Map()

function startWebSocketServer(port = 3001) {
  const server = createServer()
  const wss = new WebSocketServer({ server })

  // Limpar rate limits expirados periodicamente
  setInterval(() => {
    const now = Date.now()
    for (const [ip, record] of connectionRateLimits.entries()) {
      if (record.resetAt < now) {
        connectionRateLimits.delete(ip)
      }
    }
  }, 60 * 1000)

  wss.on('connection', (ws, req) => {
    // Obter IP do cliente
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
               req.socket.remoteAddress ||
               'unknown'

    // Rate limit check
    if (!checkRateLimit(ip)) {
      console.log(`[WS] Rate limit excedido para IP: ${ip}`)
      ws.close(1008, 'Rate limit exceeded')
      return
    }

    const { query } = parse(req.url || '', true)
    const userId = sanitizeString(query.userId, 50)
    const role = sanitizeString(query.role, 20)
    const examId = sanitizeString(query.examId, 50)
    const userName = sanitizeString(query.userName, 100)
    const token = query.token
    const timestamp = query.timestamp

    // Validação básica de parâmetros
    if (!userId || !role) {
      console.log('[WS] Conexão rejeitada: userId ou role ausente')
      ws.close(1008, 'Missing required parameters')
      return
    }

    // Validar role
    if (!['admin', 'user'].includes(role)) {
      console.log(`[WS] Conexão rejeitada: role inválido: ${role}`)
      ws.close(1008, 'Invalid role')
      return
    }

    // CRÍTICO: Validar token de conexão
    // Em produção, isso DEVE ser validado
    if (process.env.NODE_ENV === 'production') {
      if (!validateConnectionToken(token, userId, role, timestamp)) {
        console.log(`[WS] Conexão rejeitada: token inválido para userId: ${userId}`)
        ws.close(1008, 'Invalid authentication token')
        return
      }
    } else {
      // Em desenvolvimento, apenas log de aviso
      if (!token) {
        console.warn('[WS] AVISO: Conexão sem token em ambiente de desenvolvimento')
      }
    }

    const clientId = `${role}-${userId}-${Date.now()}`
    clients.set(clientId, {
      ws,
      userId,
      role,
      examId,
      userName,
      ip,
      connectedAt: new Date()
    })

    // Log sem dados sensíveis em produção
    if (process.env.NODE_ENV === 'production') {
      console.log(`[WS] Cliente conectado: ${role} (${clientId.slice(-8)})`)
    } else {
      console.log(`[WS] Cliente conectado: ${clientId} (${role})`)
    }

    ws.on('message', (data) => {
      try {
        // Limitar tamanho da mensagem
        if (data.length > 64 * 1024) { // 64KB max
          console.log(`[WS] Mensagem muito grande de ${clientId}`)
          return
        }

        const message = JSON.parse(data.toString())
        handleMessage(clientId, message)
      } catch (error) {
        console.error('[WS] Erro ao processar mensagem')
      }
    })

    ws.on('close', () => {
      clients.delete(clientId)
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[WS] Cliente desconectado: ${clientId}`)
      }
    })

    ws.on('error', (error) => {
      console.error(`[WS] Erro no cliente`)
      clients.delete(clientId)
    })

    // Enviar confirmação de conexão (sem expor clientId completo)
    sendToClient(clientId, {
      type: 'connected',
      clientId: clientId.slice(-8), // Apenas últimos 8 caracteres
      timestamp: new Date().toISOString(),
    })
  })

  function handleMessage(clientId, message) {
    const client = clients.get(clientId)
    if (!client) return

    // Validar tipo de mensagem
    const validTypes = ['tab-switch', 'webrtc-offer', 'webrtc-answer', 'webrtc-ice-candidate', 'ping']
    if (!message.type || !validTypes.includes(message.type)) {
      return
    }

    switch (message.type) {
      case 'tab-switch':
        // Apenas usuários podem reportar tab-switch
        if (client.role !== 'user') return

        broadcastToAdmins({
          type: 'alert',
          alertType: 'tab-switch',
          userId: client.userId,
          userName: client.userName,
          examId: client.examId,
          timestamp: new Date().toISOString(),
          data: message.data,
        })
        break

      case 'webrtc-offer':
        // Apenas usuários podem enviar offers
        if (client.role !== 'user') return

        broadcastToAdmins({
          ...message,
          fromId: clientId,
          fromUserId: client.userId,
          fromUserName: client.userName,
        })
        break

      case 'webrtc-answer':
      case 'webrtc-ice-candidate':
        // Apenas admins podem enviar answers/ICE candidates
        if (client.role !== 'admin') return

        const targetId = sanitizeString(message.targetId, 100)
        if (targetId) {
          // Verificar se o target existe e é um usuário
          const targetClient = clients.get(targetId)
          if (targetClient && targetClient.role === 'user') {
            sendToClient(targetId, {
              ...message,
              fromId: clientId,
              fromUserId: client.userId,
              fromUserName: client.userName,
            })
          }
        }
        break

      case 'ping':
        sendToClient(clientId, { type: 'pong', timestamp: new Date().toISOString() })
        break
    }
  }

  function sendToClient(clientId, message) {
    const client = clients.get(clientId)
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message))
    }
  }

  function broadcastToAdmins(message) {
    let sentCount = 0
    clients.forEach((client, clientId) => {
      if (client.role === 'admin' && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message))
        sentCount++
      }
    })
  }

  server.listen(port, () => {
    console.log(`[WS] Servidor WebSocket rodando na porta ${port}`)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[WS] AVISO: Executando em modo de desenvolvimento - autenticação relaxada')
    }
  })

  return { server, wss, generateConnectionToken }
}

// Iniciar servidor se executado diretamente
if (require.main === module) {
  startWebSocketServer()
}

module.exports = { startWebSocketServer, generateConnectionToken: (userId, role) => {
  const timestamp = Date.now().toString()
  const data = `${userId}:${role}:${timestamp}`
  const token = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('hex')
  return { token, timestamp }
}}
