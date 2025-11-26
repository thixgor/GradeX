'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface UseWebSocketOptions {
  userId: string
  role: 'student' | 'admin'
  examId?: string
  userName?: string
  onMessage?: (message: any) => void
  autoReconnect?: boolean
  enabled?: boolean // Adicionar flag para habilitar/desabilitar
}

export function useWebSocket({
  userId,
  role,
  examId,
  userName,
  onMessage,
  autoReconnect = true,
  enabled = true, // Por padrão habilitado
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  // Usar refs para valores mais recentes
  const userIdRef = useRef(userId)
  const roleRef = useRef(role)
  const examIdRef = useRef(examId)
  const userNameRef = useRef(userName)
  const onMessageRef = useRef(onMessage)

  // Atualizar refs quando props mudarem
  useEffect(() => {
    userIdRef.current = userId
    roleRef.current = role
    examIdRef.current = examId
    userNameRef.current = userName
    onMessageRef.current = onMessage
  }, [userId, role, examId, userName, onMessage])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[WS Client] Já conectado')
      return
    }

    try {
      // Construir URL com parâmetros usando refs
      const params = new URLSearchParams({
        userId: userIdRef.current,
        role: roleRef.current,
        ...(examIdRef.current && { examId: examIdRef.current }),
        ...(userNameRef.current && { userName: userNameRef.current }),
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
          onMessageRef.current?.(message)
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

        // NÃO reconectar automaticamente - causa loop infinito
        // O useEffect já gerencia reconexão quando enabled muda
      }

      wsRef.current = ws
    } catch (err: any) {
      console.error('[WS Client] Erro ao conectar:', err)
      setError(err.message)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Sem dependências - valores são estáveis via refs

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
    if (enabled) {
      connect()
    } else {
      disconnect()
    }
    return () => {
      disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]) // Apenas 'enabled' - SEM connect/disconnect para evitar loop infinito

  return {
    isConnected,
    error,
    sendMessage,
    connect,
    disconnect,
  }
}
