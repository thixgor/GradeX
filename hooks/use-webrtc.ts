'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface UseWebRTCOptions {
  localStream: MediaStream | null // Stream local (câmera/áudio/tela do aluno)
  sendSignal: (signal: any) => void // Função para enviar sinalização via WebSocket
  onRemoteStream?: (stream: MediaStream) => void // Callback quando stream remoto chegar
  enabled?: boolean
}

export function useWebRTC({
  localStream,
  sendSignal,
  onRemoteStream,
  enabled = true,
}: UseWebRTCOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const iceCandidatesQueue = useRef<RTCIceCandidate[]>([])

  // Configuração STUN/TURN (Google STUN servers públicos)
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  }

  // Criar oferta WebRTC (aluno inicia)
  const createOffer = useCallback(async () => {
    console.log('[WebRTC] createOffer chamado', { enabled, hasLocalStream: !!localStream })

    if (!enabled || !localStream) {
      console.log('[WebRTC] ❌ Não habilitado ou sem stream local')
      return
    }

    try {
      // Criar PeerConnection
      const pc = new RTCPeerConnection(rtcConfig)
      peerConnectionRef.current = pc

      console.log('[WebRTC] ✅ PeerConnection criada:', pc)

      // Adicionar stream local às tracks
      const tracks = localStream.getTracks()
      console.log('[WebRTC] Tracks disponíveis:', tracks.map(t => ({ kind: t.kind, label: t.label, enabled: t.enabled })))

      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream)
        console.log(`[WebRTC] ✅ Track adicionada: ${track.kind} (${track.label})`)
      })

      // Listener para ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('[WebRTC] ICE candidate gerado')
          sendSignal({
            type: 'webrtc-ice-candidate',
            candidate: event.candidate,
          })
        }
      }

      // Listener para conexão estabelecida
      pc.onconnectionstatechange = () => {
        console.log('[WebRTC] Connection state:', pc.connectionState)
        setIsConnected(pc.connectionState === 'connected')

        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setError('Conexão WebRTC perdida')
        }
      }

      // Listener para stream remoto (não usado no caso aluno→admin, mas útil para admin→aluno)
      pc.ontrack = (event) => {
        console.log('[WebRTC] Track remota recebida:', event.streams[0])
        onRemoteStream?.(event.streams[0])
      }

      // Criar oferta
      const offer = await pc.createOffer({
        offerToReceiveAudio: false, // Aluno não precisa receber áudio do admin
        offerToReceiveVideo: false, // Aluno não precisa receber vídeo do admin
      })

      await pc.setLocalDescription(offer)
      console.log('[WebRTC] Oferta criada e setada como local description')

      // Enviar oferta via WebSocket
      sendSignal({
        type: 'webrtc-offer',
        offer: pc.localDescription,
      })

      console.log('[WebRTC] Oferta enviada via WebSocket')
    } catch (err: any) {
      console.error('[WebRTC] Erro ao criar oferta:', err)
      setError(err.message)
    }
  }, [enabled, localStream, sendSignal, onRemoteStream])

  // Processar resposta WebRTC (answer do admin)
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    const pc = peerConnectionRef.current
    if (!pc) {
      console.warn('[WebRTC] PeerConnection não existe ainda')
      return
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer))
      console.log('[WebRTC] Answer recebido e setado como remote description')

      // Adicionar ICE candidates que estavam na fila
      iceCandidatesQueue.current.forEach(async (candidate) => {
        await pc.addIceCandidate(candidate)
      })
      iceCandidatesQueue.current = []
    } catch (err: any) {
      console.error('[WebRTC] Erro ao processar answer:', err)
      setError(err.message)
    }
  }, [])

  // Adicionar ICE candidate remoto
  const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    const pc = peerConnectionRef.current
    if (!pc) {
      console.warn('[WebRTC] PeerConnection não existe, candidato na fila')
      iceCandidatesQueue.current.push(new RTCIceCandidate(candidate))
      return
    }

    try {
      // Só adicionar se remote description já foi setada
      if (pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
        console.log('[WebRTC] ICE candidate adicionado')
      } else {
        iceCandidatesQueue.current.push(new RTCIceCandidate(candidate))
        console.log('[WebRTC] ICE candidate na fila (aguardando remote description)')
      }
    } catch (err: any) {
      console.error('[WebRTC] Erro ao adicionar ICE candidate:', err)
    }
  }, [])

  // Processar oferta WebRTC (admin recebe)
  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit, sendAnswerFn: (answer: RTCSessionDescriptionInit) => void) => {
    try {
      // Criar PeerConnection
      const pc = new RTCPeerConnection(rtcConfig)
      peerConnectionRef.current = pc

      console.log('[WebRTC Admin] PeerConnection criada')

      // Listener para ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('[WebRTC Admin] ICE candidate gerado')
          sendSignal({
            type: 'webrtc-ice-candidate',
            candidate: event.candidate,
          })
        }
      }

      // Listener para conexão
      pc.onconnectionstatechange = () => {
        console.log('[WebRTC Admin] Connection state:', pc.connectionState)
        setIsConnected(pc.connectionState === 'connected')
      }

      // Listener para stream remoto (vídeo/áudio do aluno)
      pc.ontrack = (event) => {
        console.log('[WebRTC Admin] Track remota recebida do aluno:', event.streams[0])
        onRemoteStream?.(event.streams[0])
      }

      // Setar oferta como remote description
      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      console.log('[WebRTC Admin] Oferta recebida e setada como remote description')

      // Criar answer
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      console.log('[WebRTC Admin] Answer criada e setada como local description')

      // Enviar answer via callback
      sendAnswerFn(pc.localDescription!)

      // Adicionar ICE candidates que estavam na fila
      iceCandidatesQueue.current.forEach(async (candidate) => {
        await pc.addIceCandidate(candidate)
      })
      iceCandidatesQueue.current = []
    } catch (err: any) {
      console.error('[WebRTC Admin] Erro ao processar oferta:', err)
      setError(err.message)
    }
  }, [sendSignal, onRemoteStream])

  // Cleanup
  const cleanup = useCallback(() => {
    const pc = peerConnectionRef.current
    if (pc) {
      pc.close()
      peerConnectionRef.current = null
      console.log('[WebRTC] PeerConnection fechada')
    }
    setIsConnected(false)
  }, [])

  // Cleanup ao desmontar
  useEffect(() => {
    return cleanup
  }, [cleanup])

  return {
    isConnected,
    error,
    createOffer,
    handleAnswer,
    handleOffer,
    addIceCandidate,
    cleanup,
  }
}
