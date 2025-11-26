'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ScreenCaptureMode } from '@/lib/types'

interface UseProctoringOptions {
  camera: boolean
  audio: boolean
  screen: boolean
  screenMode?: ScreenCaptureMode
  onCameraBlack?: () => void // Callback quando câmera ficar preta
  onCameraRestored?: () => void // Callback quando câmera voltar ao normal
}

export function useProctoring({
  camera,
  audio,
  screen,
  screenMode = 'window',
  onCameraBlack,
  onCameraRestored,
}: UseProctoringOptions) {
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isBlackCamera, setIsBlackCamera] = useState(false)
  const consecutiveBlackFrames = useRef(0) // Contador de frames consecutivos detectados como preto

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const blackCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Inicializar captura de mídia
  const initializeMedia = useCallback(async () => {
    setError(null)

    try {
      // Capturar câmera e/ou áudio
      if (camera || audio) {
        const constraints: MediaStreamConstraints = {
          video: camera ? { width: 640, height: 480 } : false,
          audio: audio,
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)

        if (camera) {
          setCameraStream(stream)
        }
        if (audio && !camera) {
          setAudioStream(stream)
        }
      }

      // Capturar tela
      if (screen) {
        const displayConstraints: DisplayMediaStreamOptions = {
          video: {
            // @ts-ignore - displaySurface não está nos types oficiais
            displaySurface: screenMode === 'window' ? 'window' : 'monitor',
          } as MediaTrackConstraints,
          audio: false,
        }

        const screenMediaStream = await navigator.mediaDevices.getDisplayMedia(displayConstraints)
        setScreenStream(screenMediaStream)

        // Detectar quando o usuário parar o compartilhamento
        screenMediaStream.getVideoTracks()[0].addEventListener('ended', () => {
          setError('Compartilhamento de tela foi interrompido')
          setScreenStream(null)
        })
      }

      return true
    } catch (err: any) {
      console.error('Erro ao capturar mídia:', err)
      let errorMessage = 'Erro ao acessar dispositivos de captura'

      if (err.name === 'NotAllowedError') {
        errorMessage = 'Permissão negada. Você precisa autorizar o acesso para continuar.'
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'Dispositivo não encontrado. Verifique se sua câmera/microfone está conectado.'
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Dispositivo está sendo usado por outro aplicativo.'
      }

      setError(errorMessage)
      return false
    }
  }, [camera, audio, screen, screenMode])

  // Detectar câmera preta
  const checkBlackCamera = useCallback(() => {
    if (!cameraStream || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    // Configurar canvas
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    // Se vídeo ainda não está pronto, não verificar
    if (canvas.width === 0 || canvas.height === 0) return

    // Capturar frame atual
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data

    // Calcular média de brilho E variância dos pixels
    let totalBrightness = 0
    let validPixels = 0

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      const brightness = (r + g + b) / 3
      totalBrightness += brightness
      validPixels++
    }

    const avgBrightness = totalBrightness / validPixels

    // Calcular variância (desvio padrão) para detectar imagem estática
    let variance = 0
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      const brightness = (r + g + b) / 3
      variance += Math.pow(brightness - avgBrightness, 2)
    }
    variance = variance / validPixels
    const stdDev = Math.sqrt(variance)

    // Considerações para câmera preta/bloqueada (MUITO rigoroso para evitar falsos positivos):
    // DETECÇÃO (rigorosa): Brilho extremo (< 3 ou > 252) E variância quase zero (< 1) por 3x consecutivas
    // RECUPERAÇÃO (tolerante): Brilho dentro da faixa normal (10-245) OU variância detectável (> 3)
    // Isso garante que falsos positivos sejam raros, mas recuperação seja rápida

    const isVeryDark = avgBrightness < 3
    const isVeryBright = avgBrightness > 252
    const isStatic = stdDev < 1

    // Para detectar como BLOQUEADA: muito rigoroso
    const currentFrameIsBlack = (isVeryDark || isVeryBright) && isStatic

    // Para detectar como RECUPERADA: mais tolerante (qualquer sinal de vida na câmera)
    const hasNormalBrightness = avgBrightness >= 10 && avgBrightness <= 245
    const hasMovement = stdDev > 3
    const cameraIsWorking = hasNormalBrightness || hasMovement

    // Debug
    console.log('[CAMERA DEBUG]', {
      avgBrightness: avgBrightness.toFixed(2),
      stdDev: stdDev.toFixed(2),
      isVeryDark,
      isVeryBright,
      isStatic,
      currentFrameIsBlack,
      cameraIsWorking,
      isBlackCamera,
      consecutiveBlackFrames: consecutiveBlackFrames.current,
    })

    // Lógica de confirmação consecutiva para DETECÇÃO
    if (currentFrameIsBlack) {
      consecutiveBlackFrames.current++

      // Só ativa aviso após 3 verificações consecutivas (6 segundos)
      if (consecutiveBlackFrames.current >= 3 && !isBlackCamera) {
        setIsBlackCamera(true)
        onCameraBlack?.()
        console.log('[CAMERA DEBUG] 🚨 CÂMERA BLOQUEADA CONFIRMADA (3 verificações consecutivas)')
      }
    } else {
      // Frame não é completamente preto - resetar contador
      consecutiveBlackFrames.current = 0
    }

    // Lógica IMEDIATA para RECUPERAÇÃO - não precisa esperar múltiplas verificações
    if (isBlackCamera && cameraIsWorking) {
      console.log('[CAMERA DEBUG] ✅ CÂMERA RECUPERADA - Voltando à prova imediatamente')
      setIsBlackCamera(false)
      onCameraRestored?.()
      consecutiveBlackFrames.current = 0
    }
  }, [cameraStream, isBlackCamera, onCameraBlack, onCameraRestored])

  // Iniciar verificação de câmera preta
  useEffect(() => {
    if (camera && cameraStream && videoRef.current) {
      // Verificar a cada 2 segundos
      blackCheckIntervalRef.current = setInterval(checkBlackCamera, 2000)

      return () => {
        if (blackCheckIntervalRef.current) {
          clearInterval(blackCheckIntervalRef.current)
        }
      }
    }
  }, [camera, cameraStream, checkBlackCamera])

  // Atualizar vídeo quando stream mudar
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream
    }
  }, [cameraStream])

  // Cleanup ao desmontar
  const cleanup = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop())
      setAudioStream(null)
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop())
      setScreenStream(null)
    }
    if (blackCheckIntervalRef.current) {
      clearInterval(blackCheckIntervalRef.current)
    }
  }, [cameraStream, audioStream, screenStream])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  return {
    cameraStream,
    audioStream,
    screenStream,
    error,
    isBlackCamera,
    initializeMedia,
    cleanup,
    videoRef,
    canvasRef,
  }
}
