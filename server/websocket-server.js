const { createServer } = require('http')
const { WebSocketServer, WebSocket } = require('ws')
const { parse } = require('url')

const clients = new Map()

function startWebSocketServer(port = 3001) {
  const server = createServer()
  const wss = new WebSocketServer({ server })

  wss.on('connection', (ws, req) => {
    const { query } = parse(req.url || '', true)
    const userId = query.userId
    const role = query.role
    const examId = query.examId
    const userName = query.userName

    if (!userId || !role) {
      ws.close()
      return
    }

    const clientId = `${role}-${userId}-${Date.now()}`
    clients.set(clientId, {
      ws,
      userId,
      role,
      examId,
      userName,
    })

    console.log(`[WS] Cliente conectado: ${clientId} (${role})`)

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString())
        handleMessage(clientId, message)
      } catch (error) {
        console.error('[WS] Erro ao processar mensagem:', error)
      }
    })

    ws.on('close', () => {
      clients.delete(clientId)
      console.log(`[WS] Cliente desconectado: ${clientId}`)
    })

    ws.on('error', (error) => {
      console.error(`[WS] Erro no cliente ${clientId}:`, error)
      clients.delete(clientId)
    })

    // Enviar confirmação de conexão
    sendToClient(clientId, {
      type: 'connected',
      clientId,
      timestamp: new Date().toISOString(),
    })
  })

  function handleMessage(clientId, message) {
    const client = clients.get(clientId)
    if (!client) return

    console.log(`[WS] Mensagem de ${clientId}:`, message.type)

    switch (message.type) {
      case 'tab-switch':
        // Aluno trocou de aba - notificar todos os admins
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
        // Oferta do aluno: broadcast para todos os admins
        console.log(`[WS] WebRTC Offer de ${client.userName} - broadcasting para admins`)
        broadcastToAdmins({
          ...message,
          fromId: clientId,
          fromUserId: client.userId,
          fromUserName: client.userName,
        })
        break

      case 'webrtc-answer':
      case 'webrtc-ice-candidate':
        // Answer e ICE candidates: enviar para destinatário específico
        const targetId = message.targetId
        if (targetId) {
          console.log(`[WS] ${message.type} para targetId: ${targetId}`)
          sendToClient(targetId, {
            ...message,
            fromId: clientId,
            fromUserId: client.userId,
            fromUserName: client.userName,
          })
        } else {
          console.error(`[WS] ${message.type} sem targetId!`)
        }
        break

      case 'ping':
        sendToClient(clientId, { type: 'pong', timestamp: new Date().toISOString() })
        break

      default:
        console.log(`[WS] Tipo de mensagem desconhecido: ${message.type}`)
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
    console.log(`[WS] Broadcast para ${sentCount} admins:`, message.type)
  }

  server.listen(port, () => {
    console.log(`[WS] Servidor WebSocket rodando na porta ${port}`)
  })

  return { server, wss }
}

// Iniciar servidor se executado diretamente
if (require.main === module) {
  startWebSocketServer()
}

module.exports = { startWebSocketServer }
