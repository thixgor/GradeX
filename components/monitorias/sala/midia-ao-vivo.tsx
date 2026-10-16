'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * Vídeo e áudio ao vivo. O vídeo é sempre mudo; o som de cada pessoa sai de um
 * `<audio>` próprio — assim, esconder o vídeo (câmera desligada) nunca corta a
 * voz, e a escolha de alto-falante (`setSinkId`) vale para todos.
 */

export function VideoAoVivo({
  stream,
  versao = 0,
  espelhar = false,
  contain = false,
  rotulo,
  className,
}: {
  stream: MediaStream | null
  /** Muda quando as trilhas do stream mudam: reatribui o `srcObject`. */
  versao?: number
  espelhar?: boolean
  contain?: boolean
  rotulo: string
  className?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    if (v.srcObject !== stream) v.srcObject = stream
    // Trilha que chegou (ou voltou) no mesmo stream: um `play()` acorda o quadro.
    if (stream) void v.play().catch(() => {})
  }, [stream, versao])
  useEffect(() => {
    const v = ref.current
    return () => {
      if (v) v.srcObject = null
    }
  }, [])
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted
      aria-label={rotulo}
      className={cn('h-full w-full bg-neutral-900', contain ? 'object-contain' : 'object-cover', espelhar && '-scale-x-100', className)}
    />
  )
}

export function AudioRemoto({
  stream,
  versao = 0,
  saidaId,
  aoBloquear,
}: {
  stream: MediaStream | null
  versao?: number
  saidaId: string | null
  /** O navegador recusou tocar sem um toque na tela (iOS, Safari): a sala mostra o botão. */
  aoBloquear: () => void
}) {
  const ref = useRef<HTMLAudioElement>(null)
  useEffect(() => {
    const a = ref.current
    if (!a) return
    if (a.srcObject !== stream) a.srcObject = stream
    // Só o "não" do navegador (sem toque na tela) pede o botão; uma reprodução
    // interrompida por trilha nova (AbortError) se resolve sozinha na próxima.
    if (stream && stream.getAudioTracks().length) {
      void a.play().catch((err: { name?: string }) => {
        if (err?.name === 'NotAllowedError') aoBloquear()
      })
    }
  }, [stream, versao, aoBloquear])
  useEffect(() => {
    const a = ref.current as (HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }) | null
    if (a?.setSinkId && saidaId) void a.setSinkId(saidaId).catch(() => {})
  }, [saidaId])
  useEffect(() => {
    const a = ref.current
    return () => {
      if (a) a.srcObject = null
    }
  }, [])
  return <audio ref={ref} autoPlay data-sala-audio="" className="hidden" />
}

/** Depois do toque em "Ativar som": tenta de novo em todos os áudios da sala. */
export function destravarAudios(): void {
  document.querySelectorAll<HTMLAudioElement>('audio[data-sala-audio]').forEach((a) => void a.play().catch(() => {}))
}
