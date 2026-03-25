'use client'

import Link from 'next/link'
import { Fragment, useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Volume2, VolumeX, Image as ImageIcon, Film, Play, Pause, SkipBack, SkipForward, X, Maximize2 } from 'lucide-react'

/**
 * Parses text with inline markup:
 *  **bold** → <strong>
 *  *italic* → <em>
 *  [text](url) → <a> or <Link> (internal)
 *
 * Block-level embeds (must be on their own line):
 *  !video[caption](youtube-url)  → YouTube video embed
 *  !audio[caption](youtube-url)  → YouTube audio player (compact)
 *  !image[caption](image-url)    → Inline image with caption
 *
 * Preserves newlines as <br />.
 */

interface Token {
  type: 'text' | 'bold' | 'italic' | 'link'
  content: string
  href?: string
}

// ── Embed types ──────────────────────────────────────────────────
interface Embed {
  type: 'video' | 'audio' | 'image'
  caption: string
  url: string
}

const EMBED_REGEX = /^!(video|audio|image)\[([^\]]*)\]\(([^)]+)\)\s*$/

function parseEmbed(line: string): Embed | null {
  const m = line.match(EMBED_REGEX)
  if (!m) return null
  return { type: m[1] as Embed['type'], caption: m[2], url: m[3] }
}

/** Extract YouTube video ID from various URL formats */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // bare ID
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

// ── Embed renderers ──────────────────────────────────────────────

function VideoEmbed({ embed }: { embed: Embed }) {
  const ytId = extractYouTubeId(embed.url)
  if (!ytId) {
    return (
      <div className="my-4 relative rounded-2xl overflow-hidden p-4 liquid-glass-bubble">
        <div className="liquid-glass-surface !rounded-2xl" />
        <div className="relative z-10 text-sm text-red-400">URL de vídeo inválida: {embed.url}</div>
      </div>
    )
  }
  return (
    <div className="my-4 relative rounded-2xl overflow-visible liquid-glass-bubble">
      {/* Glass layers */}
      <div className="liquid-glass-surface !rounded-2xl" />
      <div className="liquid-glass-refraction-top" style={{ borderRadius: '16px' }} />
      <div className="liquid-glass-refraction-bottom" style={{ borderRadius: '16px' }} />

      <div className="relative z-10 p-1.5 sm:p-2">
        <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full rounded-xl"
            src={`https://www.youtube-nocookie.com/embed/${ytId}`}
            title={embed.caption || 'Vídeo'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {embed.caption && (
          <div className="px-3 sm:px-4 py-2.5 flex items-center gap-2">
            <Film className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs sm:text-[13px] text-foreground/60">{embed.caption}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── YouTube IFrame API loader (singleton) ────────────────────────
let ytApiLoading = false
let ytApiCallbacks: (() => void)[] = []

function ensureYTApi(cb: () => void) {
  // Already fully loaded — call immediately
  if ((window as any).YT?.Player) { cb(); return }

  ytApiCallbacks.push(cb)

  if (typeof document === 'undefined' || ytApiLoading) return
  ytApiLoading = true

  // Remove stale script tag if present (HMR / re-mount)
  const old = document.getElementById('yt-iframe-api')
  if (old) old.remove()

  // Clear previous global callback
  delete (window as any).onYouTubeIframeAPIReady

  const tag = document.createElement('script')
  tag.id = 'yt-iframe-api'
  tag.src = 'https://www.youtube.com/iframe_api'
  ;(window as any).onYouTubeIframeAPIReady = () => {
    ytApiLoading = false
    const cbs = [...ytApiCallbacks]
    ytApiCallbacks = []
    cbs.forEach(fn => fn())
  }
  document.head.appendChild(tag)
}

function formatTime(s: number): string {
  if (!s || !isFinite(s)) return '0:00'
  const mins = Math.floor(s / 60)
  const secs = Math.floor(s % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function AudioEmbed({ embed }: { embed: Embed }) {
  const ytId = extractYouTubeId(embed.url)
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)

  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(80)
  const [muted, setMuted] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [showVolume, setShowVolume] = useState(false)
  const [captionExpanded, setCaptionExpanded] = useState(false)

  // Create hidden YT player
  useEffect(() => {
    if (!ytId) return
    let destroyed = false
    const divId = `yt-audio-${ytId}-${Math.random().toString(36).slice(2, 8)}`

    function createPlayer() {
      if (destroyed) return
      // Create a hidden host element in document.body (avoids container ref issues)
      const host = document.createElement('div')
      host.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;pointer-events:none;'
      const el = document.createElement('div')
      el.id = divId
      host.appendChild(el)
      document.body.appendChild(host)

      // Store host ref for cleanup
      containerRef.current = host as any

      try {
        playerRef.current = new (window as any).YT.Player(divId, {
          videoId: ytId,
          height: '1',
          width: '1',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (e: any) => {
              if (destroyed) return
              setReady(true)
              setDuration(e.target.getDuration() || 0)
              e.target.setVolume(volume)
            },
            onStateChange: (e: any) => {
              if (destroyed) return
              const YT = (window as any).YT
              if (e.data === YT.PlayerState.PLAYING) {
                setPlaying(true)
                setDuration(e.target.getDuration() || 0)
              } else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) {
                setPlaying(false)
              }
            },
            onError: () => {
              if (destroyed) return
              // On error, still mark ready so user doesn't see infinite loading
              setReady(true)
            },
          },
        })
      } catch {
        setReady(true) // fail gracefully
      }
    }

    ensureYTApi(createPlayer)

    return () => {
      destroyed = true
      if (intervalRef.current) clearInterval(intervalRef.current)
      try { playerRef.current?.destroy() } catch {}
      // Remove the host element from body
      try { (containerRef.current as any)?.remove?.() } catch {}
    }
  }, [ytId])

  // Progress polling
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (playing && !dragging) {
      intervalRef.current = setInterval(() => {
        const t = playerRef.current?.getCurrentTime?.()
        if (t != null) setCurrentTime(t)
      }, 250)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [playing, dragging])

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return
    if (playing) playerRef.current.pauseVideo()
    else playerRef.current.playVideo()
  }, [playing])

  const seekTo = useCallback((fraction: number) => {
    if (!playerRef.current || !duration) return
    const t = fraction * duration
    playerRef.current.seekTo(t, true)
    setCurrentTime(t)
  }, [duration])

  const skip = useCallback((delta: number) => {
    if (!playerRef.current) return
    const t = Math.max(0, Math.min(duration, (playerRef.current.getCurrentTime?.() || 0) + delta))
    playerRef.current.seekTo(t, true)
    setCurrentTime(t)
  }, [duration])

  const handleVolumeChange = useCallback((v: number) => {
    setVolume(v)
    setMuted(v === 0)
    playerRef.current?.setVolume?.(v)
    if (v > 0) playerRef.current?.unMute?.()
  }, [])

  const toggleMute = useCallback(() => {
    if (muted) {
      playerRef.current?.unMute?.()
      playerRef.current?.setVolume?.(volume || 80)
      setMuted(false)
    } else {
      playerRef.current?.mute?.()
      setMuted(true)
    }
  }, [muted, volume])

  // ── Progress bar pointer interaction (works for mouse + touch) ──
  const getProgressFraction = useCallback((clientX: number) => {
    if (!progressBarRef.current) return 0
    const rect = progressBarRef.current.getBoundingClientRect()
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!duration) return
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    setDragging(true)
    const fraction = getProgressFraction(e.clientX)
    setCurrentTime(fraction * duration)
  }, [duration, getProgressFraction])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging || !duration) return
    const fraction = getProgressFraction(e.clientX)
    setCurrentTime(fraction * duration)
  }, [dragging, duration, getProgressFraction])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragging || !duration) return
    const fraction = getProgressFraction(e.clientX)
    seekTo(fraction)
    setDragging(false)
  }, [dragging, duration, getProgressFraction, seekTo])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  if (!ytId) {
    return (
      <div className="my-4 relative rounded-2xl overflow-hidden p-4">
        <div className="liquid-glass-surface !rounded-2xl" />
        <div className="relative z-10 text-sm text-red-400">URL de áudio inválida: {embed.url}</div>
      </div>
    )
  }

  return (
    <div className="my-4 relative rounded-2xl overflow-visible liquid-glass-bubble select-none">
      {/* ── Liquid glass background layers ── */}
      <div className="liquid-glass-surface !rounded-2xl" />
      <div className="liquid-glass-refraction-top" style={{ borderRadius: '16px' }} />
      <div className="liquid-glass-refraction-bottom" style={{ borderRadius: '16px' }} />

      {/* YT player is created in document.body via useEffect — no container needed here */}

      {/* ── Player content ── */}
      <div className="relative z-10 px-4 sm:px-5 pt-4 pb-3.5">

        {/* ── Top: icon + title + volume toggle ── */}
        <div className="flex items-center gap-3 mb-3.5">
          {/* Animated icon */}
          <div className="shrink-0 relative">
            <div className={`p-2.5 sm:p-3 rounded-xl backdrop-blur-sm transition-all duration-300 ${
              playing
                ? 'bg-primary/20 shadow-[0_0_20px_rgba(var(--primary-rgb,100,200,150),0.15)]'
                : 'bg-white/[0.06]'
            }`}>
              <Volume2 className={`h-5 w-5 sm:h-[22px] sm:w-[22px] transition-colors duration-300 ${
                playing ? 'text-primary' : 'text-foreground/50'
              }`} />
            </div>
            {playing && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-40" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary shadow-sm shadow-primary/50" />
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0" onClick={() => embed.caption && embed.caption.length > 25 && setCaptionExpanded(v => !v)}>
            <p className={`text-sm sm:text-[15px] font-semibold text-foreground leading-tight ${
              captionExpanded ? 'whitespace-normal break-words' : 'truncate'
            } ${embed.caption && embed.caption.length > 25 ? 'cursor-pointer' : ''}`}>
              {embed.caption || 'Áudio'}
            </p>
            <p className="text-[11px] sm:text-xs text-muted-foreground/70 mt-0.5">
              {!ready ? 'Carregando...' : playing ? 'Reproduzindo' : 'Pausado'}
              {duration > 0 && ` · ${formatTime(duration)}`}
            </p>
          </div>
          {/* Volume button (reveals slider) */}
          <button
            onClick={() => setShowVolume(v => !v)}
            className={`shrink-0 p-2 rounded-xl transition-all duration-200 active:scale-90
              ${showVolume ? 'bg-white/[0.1]' : 'bg-transparent hover:bg-white/[0.06]'}`}
            aria-label={muted ? 'Ativar som' : 'Silenciar'}
          >
            {muted ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4 text-muted-foreground" />}
          </button>
        </div>

        {/* ── Volume slider (collapsible) ── */}
        {showVolume && (
          <div className="flex items-center gap-3 mb-3 px-1 py-2 rounded-xl bg-white/[0.04]">
            <button
              onClick={toggleMute}
              className="shrink-0 p-1.5 rounded-lg hover:bg-white/[0.08] active:scale-90 transition-all"
              aria-label={muted ? 'Ativar som' : 'Silenciar'}
            >
              {muted
                ? <VolumeX className="h-3.5 w-3.5 text-red-400" />
                : <Volume2 className="h-3.5 w-3.5 text-primary" />
              }
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={muted ? 0 : volume}
              onChange={e => handleVolumeChange(parseInt(e.target.value))}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer touch-none
                bg-white/[0.08]
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary
                [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(var(--primary-rgb,100,200,150),0.3)]
                [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent
                [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0
                [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent"
              aria-label={`Volume: ${muted ? 0 : volume}%`}
            />
            <span className="text-[10px] tabular-nums text-muted-foreground/60 w-7 text-right shrink-0">
              {muted ? 0 : volume}%
            </span>
          </div>
        )}

        {/* ── Progress bar — touch-optimized with pointer events ── */}
        <div className="mb-2.5">
          <div
            ref={progressBarRef}
            className="relative h-1.5 rounded-full cursor-pointer group touch-none"
            style={{ background: 'rgba(255,255,255,0.06)' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Large invisible touch target for mobile (44px min) */}
            <div className="absolute -inset-x-0 -top-4 -bottom-4" />
            {/* Progress fill with glow */}
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-[width] duration-75"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))',
                boxShadow: playing ? '0 0 12px hsl(var(--primary) / 0.3)' : 'none',
              }}
            />
            {/* Thumb — always visible on touch, hover-only on desktop */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-primary transition-all duration-150
                shadow-[0_0_10px_hsl(var(--primary)/0.35)]
                ${dragging ? 'w-5 h-5 scale-110' : 'w-3.5 h-3.5 sm:w-3 sm:h-3 sm:opacity-0 sm:group-hover:opacity-100'}
                border-2 border-background/80`}
              style={{ left: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 px-0.5">
            <span className="text-[10px] sm:text-[11px] tabular-nums text-foreground/40 font-medium">{formatTime(currentTime)}</span>
            <span className="text-[10px] sm:text-[11px] tabular-nums text-foreground/40 font-medium">{formatTime(duration)}</span>
          </div>
        </div>

        {/* ── Controls row ── */}
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          {/* Skip back */}
          <button
            onClick={() => skip(-10)}
            disabled={!ready}
            className="p-2.5 sm:p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-90
              text-foreground/50 hover:text-foreground transition-all duration-200 disabled:opacity-20 touch-manipulation"
            aria-label="Voltar 10 segundos"
          >
            <SkipBack className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
          </button>

          {/* Play / Pause — hero button */}
          <button
            onClick={togglePlay}
            disabled={!ready}
            className={`relative p-4 sm:p-3.5 rounded-2xl transition-all duration-300 active:scale-90 touch-manipulation
              disabled:opacity-30 disabled:cursor-not-allowed
              ${playing
                ? 'bg-primary/90 text-primary-foreground shadow-[0_4px_24px_hsl(var(--primary)/0.35)]'
                : 'bg-white/[0.08] hover:bg-white/[0.12] text-foreground shadow-[0_4px_20px_rgba(0,0,0,0.1)]'
              }`}
            aria-label={playing ? 'Pausar' : 'Reproduzir'}
          >
            {/* Glass shine on button */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.15] to-transparent rounded-t-2xl" />
            </div>
            {playing
              ? <Pause className="relative z-10 h-5 w-5 sm:h-[22px] sm:w-[22px]" fill="currentColor" />
              : <Play className="relative z-10 h-5 w-5 sm:h-[22px] sm:w-[22px] ml-0.5" fill="currentColor" />
            }
          </button>

          {/* Skip forward */}
          <button
            onClick={() => skip(10)}
            disabled={!ready}
            className="p-2.5 sm:p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-90
              text-foreground/50 hover:text-foreground transition-all duration-200 disabled:opacity-20 touch-manipulation"
            aria-label="Avançar 10 segundos"
          >
            <SkipForward className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
          </button>
        </div>

        {/* Loading shimmer overlay */}
        {!ready && (
          <div className="absolute inset-0 z-20 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(2px)' }}>
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/[0.06]">
              <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-xs text-foreground/60 font-medium">Carregando áudio...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ImageEmbed({ embed }: { embed: Embed }) {
  const [error, setError] = useState(false)
  const [lightbox, setLightbox] = useState(false)

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(false) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [lightbox])

  if (error) {
    return (
      <div className="my-4 relative rounded-2xl overflow-hidden p-4 liquid-glass-bubble">
        <div className="liquid-glass-surface !rounded-2xl" />
        <div className="relative z-10 text-sm text-amber-400 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 shrink-0" />
          Erro ao carregar imagem: {embed.url}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="my-4 relative rounded-2xl overflow-visible liquid-glass-bubble">
        {/* Glass layers */}
        <div className="liquid-glass-surface !rounded-2xl" />
        <div className="liquid-glass-refraction-top" style={{ borderRadius: '16px' }} />
        <div className="liquid-glass-refraction-bottom" style={{ borderRadius: '16px' }} />

        <div className="relative z-10 p-1.5 sm:p-2">
          <div
            className="relative rounded-xl overflow-hidden cursor-pointer group"
            onClick={() => setLightbox(true)}
          >
            <img
              src={embed.url}
              alt={embed.caption || 'Imagem'}
              className="w-full h-auto transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
              onError={() => setError(true)}
            />
            {/* Hover overlay with expand icon */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2.5 rounded-full bg-white/20 backdrop-blur-sm">
                <Maximize2 className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          {embed.caption && (
            <div className="px-3 sm:px-4 py-2.5 flex items-center gap-2">
              <ImageIcon className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-xs sm:text-[13px] text-foreground/60">{embed.caption}</span>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="relative z-10 max-w-[90vw] max-h-[90vh] flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={embed.url}
              alt={embed.caption || 'Imagem'}
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              draggable={false}
            />
            {embed.caption && (
              <div className="mt-3 px-5 py-3 rounded-xl bg-white/10 backdrop-blur-md text-white/90 text-sm leading-relaxed max-w-3xl">
                {embed.caption}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

function RenderEmbed({ embed }: { embed: Embed }) {
  switch (embed.type) {
    case 'video': return <VideoEmbed embed={embed} />
    case 'audio': return <AudioEmbed embed={embed} />
    case 'image': return <ImageEmbed embed={embed} />
  }
}

// ── Inline token parser ──────────────────────────────────────────

export function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = []
  // Regex to match **bold**, *italic*, [text](url)
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(\[(.+?)\]\((.+?)\))/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(line)) !== null) {
    // Push text before this match
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', content: line.substring(lastIndex, match.index) })
    }

    if (match[1]) {
      // **bold**
      tokens.push({ type: 'bold', content: match[2] })
    } else if (match[3]) {
      // *italic*
      tokens.push({ type: 'italic', content: match[4] })
    } else if (match[5]) {
      // [text](url)
      tokens.push({ type: 'link', content: match[6], href: match[7] })
    }

    lastIndex = match.index + match[0].length
  }

  // Push remaining text
  if (lastIndex < line.length) {
    tokens.push({ type: 'text', content: line.substring(lastIndex) })
  }

  return tokens
}

function RenderToken({ token }: { token: Token }) {
  switch (token.type) {
    case 'bold':
      return <strong className="font-bold text-foreground">{token.content}</strong>
    case 'italic':
      return <em className="italic text-foreground/80">{token.content}</em>
    case 'link': {
      const isInternal = token.href?.startsWith('/') || token.href?.startsWith('#')
      if (isInternal) {
        return (
          <Link
            href={token.href!}
            className="text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/40 hover:decoration-primary/70 font-medium transition-colors"
          >
            {token.content}
          </Link>
        )
      }
      return (
        <a
          href={token.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/40 hover:decoration-primary/70 font-medium transition-colors"
        >
          {token.content}
        </a>
      )
    }
    default:
      return <>{token.content}</>
  }
}

interface RichTextRendererProps {
  text: string
  className?: string
}

export function RichTextRenderer({ text, className = '' }: RichTextRendererProps) {
  if (!text) return null

  // Split into paragraphs by double newline, preserve single newlines within paragraphs
  const paragraphs = text.split(/\n\s*\n/)

  return (
    <div className={`${className} space-y-4`}>
      {paragraphs.map((paragraph, pIdx) => {
        const trimmed = paragraph.trim()
        if (!trimmed) return null

        // Within a paragraph, single newlines become <br />
        const lines = trimmed.split('\n')

        // Collect nodes — some lines are embeds (block-level), others are inline text
        const nodes: React.ReactNode[] = []
        let inlineBuffer: { line: string; lineIdx: number }[] = []

        function flushInline() {
          if (inlineBuffer.length === 0) return
          const buf = inlineBuffer
          inlineBuffer = []
          nodes.push(
            <p key={`p-${pIdx}-${buf[0].lineIdx}`}>
              {buf.map(({ line, lineIdx }, i) => {
                const tokens = tokenizeLine(line)
                return (
                  <Fragment key={lineIdx}>
                    {i > 0 && <br />}
                    {tokens.map((token, tokenIdx) => (
                      <RenderToken key={tokenIdx} token={token} />
                    ))}
                  </Fragment>
                )
              })}
            </p>
          )
        }

        lines.forEach((line, lineIdx) => {
          const embed = parseEmbed(line.trim())
          if (embed) {
            flushInline()
            nodes.push(<RenderEmbed key={`embed-${pIdx}-${lineIdx}`} embed={embed} />)
          } else {
            inlineBuffer.push({ line, lineIdx })
          }
        })
        flushInline()

        return <Fragment key={pIdx}>{nodes}</Fragment>
      })}
    </div>
  )
}
