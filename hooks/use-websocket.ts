'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface UseWebSocketOptions {
  userId: string
  role: 'student' | 'admin'
  examId?: string
  userName?: string
  onMessage?: (message: any) => void
  autoReconnect?: boolean
}

export function useWebSocket({
  userId,
  role,
  examId,
  userName,
  onMessage,
  autoReconnect = true,
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[WS Client] Já conectado')
      return
    }

    try {
      // Construir URL com parâmetros
      const params = new URLSearchParams({
        userId,
        role,
        ...(examId && { examId }),
        ...(userName && { userName }),
      })

      const wsUrl = `ws://localhost:3001?${params.toString()}`
      console.log('[WS Client] Conectando:', wsUrl)

      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('[WS Client] Conectado!')
        setIsConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('[WS Client] Mensagem recebida:', message.type)
          onMessage?.(message)
        } catch (err) {
          console.error('[WS Client] Erro ao processar mensagem:', err)
        }
      }

      ws.onerror = (event) => {
        console.error('[WS Client] Erro:', event)
        setError('Erro de conexão WebSocket')
      }

      ws.onclose = () => {
        console.log('[WS Client] Desconectado')
        setIsConnected(false)
        wsRef.current = null

        // Tentar reconectar
        if (autoReconnect && reconnectAttemptsRef.current < 10) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          console.log(`[WS Client] Reconectando em ${delay}ms...`)
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            connect()
          }, delay)
        }
      }

      wsRef.current = ws
    } catch (err: any) {
      console.error('[WS Client] Erro ao conectar:', err)
      setError(err.message)
    }
  }, [userId, role, examId, userName, onMessage, autoReconnect])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }, [])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
      console.log('[WS Client] Mensagem enviada:', message.type)
    } else {
      console.warn('[WS Client] WebSocket não está conectado')
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected,
    error,
    sendMessage,
    connect,
    disconnect,
  }
}
