import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { parse } from 'url'

interface ClientConnection {
  ws: WebSocket
  userId: string
  role: 'student' | 'admin'
  examId?: string
  userName?: string
}

const clients = new Map<string, ClientConnection>()

export function startWebSocketServer(port: number = 3001) {
  const server = createServer()
  const wss = new WebSocketServer({ server })

  wss.on('connection', (ws: WebSocket, req) => {
    const { query } = parse(req.url || '', true)
    const userId = query.userId as string
    const role = query.role as string
    const examId = query.examId as string
    const userName = query.userName as string

    if (!userId || !role) {
      ws.close()
      return
    }

    const clientId = `${role}-${userId}-${Date.now()}`
    clients.set(clientId, {
      ws,
      userId,
      role: role as 'student' | 'admin',
      examId,
      userName,
    })

    console.log(`[WS] Cliente conectado: ${clientId} (${role})`)

    ws.on('message', (data: Buffer) => {
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

  function handleMessage(clientId: string, message: any) {
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
      case 'webrtc-answer':
      case 'webrtc-ice-candidate':
        // Repassar mensagem WebRTC para o destinatário
        const targetId = message.targetId
        if (targetId) {
          sendToClient(targetId, {
            ...message,
            fromId: clientId,
            fromUserId: client.userId,
            fromUserName: client.userName,
          })
        }
        break

      case 'ping':
        sendToClient(clientId, { type: 'pong', timestamp: new Date().toISOString() })
        break

      default:
        console.log(`[WS] Tipo de mensagem desconhecido: ${message.type}`)
    }
  }

  function sendToClient(clientId: string, message: any) {
    const client = clients.get(clientId)
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message))
    }
  }

  function broadcastToAdmins(message: any) {
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
