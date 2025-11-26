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

  // Detectar câmera preta - NOVA ABORDAGEM: verificar elemento visual renderizado
  const checkBlackCamera = useCallback(() => {
    if (!cameraStream || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    // Usar dimensões REAIS do elemento renderizado (192x144 = w-48 h-36)
    const width = 192
    const height = 144
    canvas.width = width
    canvas.height = height

    try {
      // Capturar o que está sendo EXIBIDO no elemento de vídeo
      ctx.drawImage(video, 0, 0, width, height)
      const imageData = ctx.getImageData(0, 0, width, height)
      const pixels = imageData.data

      // Calcular média de brilho
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

      // Calcular variância para detectar movimento
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

      // NOVA LÓGICA: Apenas detecta como preta se for OBVIAMENTE preta
      // - Brilho QUASE ZERO (< 5) - praticamente nenhum pixel aceso
      // - E variância ZERO ABSOLUTO (< 0.1) - imagem completamente congelada
      // - Precisa 8 VERIFICAÇÕES CONSECUTIVAS (16 segundos)

      const isCompletelyBlack = avgBrightness < 5
      const isCompletelyStatic = stdDev < 0.1

      const currentFrameIsBlack = isCompletelyBlack && isCompletelyStatic

      // Para recuperação: qualquer sinal de vida
      const cameraIsWorking = avgBrightness >= 10 || stdDev >= 0.5

      // Debug
      console.log('[CAMERA DEBUG]', {
        avgBrightness: avgBrightness.toFixed(2),
        stdDev: stdDev.toFixed(2),
        isCompletelyBlack,
        isCompletelyStatic,
        currentFrameIsBlack,
        cameraIsWorking,
        isBlackCamera,
        consecutiveBlackFrames: consecutiveBlackFrames.current,
        threshold: '8 frames = 16 segundos'
      })

      // Lógica de confirmação - precisa 8 verificações consecutivas (16 segundos)
      if (currentFrameIsBlack) {
        consecutiveBlackFrames.current++

        if (consecutiveBlackFrames.current >= 8 && !isBlackCamera) {
          setIsBlackCamera(true)
          onCameraBlack?.()
          console.log('[CAMERA DEBUG] 🚨 CÂMERA BLOQUEADA (8 verificações consecutivas = 16 segundos)')
        }
      } else {
        if (consecutiveBlackFrames.current > 0) {
          console.log('[CAMERA DEBUG] ✅ Frame OK - resetando contador (estava em', consecutiveBlackFrames.current, ')')
        }
        consecutiveBlackFrames.current = 0
      }

      // Recuperação imediata
      if (isBlackCamera && cameraIsWorking) {
        console.log('[CAMERA DEBUG] ✅ CÂMERA RECUPERADA')
        setIsBlackCamera(false)
        onCameraRestored?.()
        consecutiveBlackFrames.current = 0
      }
    } catch (error) {
      console.error('[CAMERA DEBUG] Erro ao capturar frame:', error)
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
