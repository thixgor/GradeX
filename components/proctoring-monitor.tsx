'use client'

import { useEffect, useRef } from 'react'
import { Camera, AlertTriangle } from 'lucide-react'

interface ProctoringMonitorProps {
  cameraStream: MediaStream | null
  isBlackCamera: boolean
  blackCameraTimeRemaining?: number // Segundos restantes antes da submissão automática
}

export function ProctoringMonitor({
  cameraStream,
  isBlackCamera,
  blackCameraTimeRemaining,
}: ProctoringMonitorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream
      videoRef.current.play().catch(err => {
        console.error('Erro ao reproduzir vídeo:', err)
      })
    }
  }, [cameraStream])

  if (!cameraStream) {
    return null
  }

  return (
    <>
      {/* Monitor de câmera fixo no canto superior esquerdo */}
      <div className="fixed top-4 left-4 z-50">
        <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl border-2 border-white">
          {/* Vídeo da câmera */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-48 h-36 object-cover"
          />

          {/* Indicador de monitoramento ativo */}
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded text-xs font-semibold">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            REC
          </div>

          {/* Ícone da câmera */}
          <div className="absolute bottom-2 left-2">
            <Camera className="h-4 w-4 text-white drop-shadow" />
          </div>

          {/* Alerta de câmera preta */}
          {isBlackCamera && (
            <div className="absolute inset-0 bg-red-900/90 flex flex-col items-center justify-center p-2 text-white text-center">
              <AlertTriangle className="h-8 w-8 mb-2 animate-pulse" />
              <p className="text-xs font-bold">CÂMERA BLOQUEADA</p>
              {blackCameraTimeRemaining !== undefined && blackCameraTimeRemaining > 0 && (
                <p className="text-xs mt-1">
                  {Math.floor(blackCameraTimeRemaining / 60)}:{String(blackCameraTimeRemaining % 60).padStart(2, '0')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Texto informativo */}
        <div className="mt-1 text-xs text-muted-foreground bg-background/80 backdrop-blur px-2 py-1 rounded">
          🎥 Monitoramento Ativo
        </div>
      </div>

      {/* Popup de aviso quando câmera fica preta */}
      {isBlackCamera && blackCameraTimeRemaining !== undefined && blackCameraTimeRemaining > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 pointer-events-none">
          <div className="bg-red-600 text-white p-6 rounded-lg shadow-2xl max-w-md pointer-events-auto">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-8 w-8 animate-pulse" />
              <h3 className="text-xl font-bold">⚠️ AVISO DE SEGURANÇA</h3>
            </div>
            <p className="mb-4">
              Sua câmera está bloqueada, preta ou desconectada. Por favor, estabilize a câmera imediatamente.
            </p>
            <div className="bg-white text-red-600 p-4 rounded text-center">
              <p className="text-sm font-semibold mb-2">Tempo restante:</p>
              <p className="text-4xl font-bold tabular-nums">
                {Math.floor(blackCameraTimeRemaining / 60)}:{String(blackCameraTimeRemaining % 60).padStart(2, '0')}
              </p>
            </div>
            <p className="mt-4 text-sm">
              Se o problema não for resolvido, a prova será automaticamente submetida com as respostas atuais.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
