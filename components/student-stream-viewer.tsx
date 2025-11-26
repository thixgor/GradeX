'use client'

import { useEffect, useRef } from 'react'
import { Camera, Mic, MicOff, Video, VideoOff } from 'lucide-react'

interface StudentStreamViewerProps {
  stream: MediaStream | null
  userName: string
  cameraEnabled: boolean
  audioEnabled: boolean
}

export function StudentStreamViewer({
  stream,
  userName,
  cameraEnabled,
  audioEnabled,
}: StudentStreamViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Conectar stream de vídeo
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch((err) => {
        console.error('[StudentStreamViewer] Erro ao reproduzir vídeo:', err)
      })
    }
  }, [stream])

  // Conectar stream de áudio
  useEffect(() => {
    if (stream && audioRef.current) {
      audioRef.current.srcObject = stream
      audioRef.current.play().catch((err) => {
        console.error('[StudentStreamViewer] Erro ao reproduzir áudio:', err)
      })
    }
  }, [stream])

  if (!stream) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center gap-3 p-6">
        <VideoOff className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Aguardando conexão...</p>
        <p className="text-xs text-muted-foreground">{userName}</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Vídeo do aluno */}
      {cameraEnabled ? (
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Overlay com informações */}
          <div className="absolute top-2 left-2 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur rounded-full text-white text-sm font-medium">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            AO VIVO
          </div>

          <div className="absolute bottom-2 left-2 px-3 py-1.5 bg-black/60 backdrop-blur rounded-full text-white text-sm font-medium">
            <Camera className="h-4 w-4 inline mr-1" />
            {userName}
          </div>

          {/* Indicador de áudio */}
          {audioEnabled && (
            <div className="absolute bottom-2 right-2 px-3 py-1.5 bg-green-600/80 backdrop-blur rounded-full text-white text-sm font-medium">
              <Mic className="h-4 w-4 inline" />
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center gap-3 p-6">
          <VideoOff className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Câmera desabilitada</p>
          <p className="text-xs text-muted-foreground">{userName}</p>
        </div>
      )}

      {/* Elemento de áudio (invisível) */}
      {audioEnabled && (
        <audio ref={audioRef} autoPlay className="hidden" />
      )}
    </div>
  )
}
