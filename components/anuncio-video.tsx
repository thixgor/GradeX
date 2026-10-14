'use client'

/**
 * Vídeo de anúncio enviado pelo admin — o mesmo player no modal e na página.
 *
 * Herda as regras do vídeo das Monitorias (`components/monitorias/video-anuncio`)
 * e acrescenta as que um vídeo que pode estar em QUALQUER página precisa:
 *
 *  - Nada é baixado antes de o vídeo chegar perto da tela. Até lá existe só a
 *    capa (WebP leve, `loading="lazy"`); o `<video>` nasce a ~300 px de entrar
 *    na tela, e com `preload="none"`.
 *  - Toca sem som e só com ao menos 40% dele à mostra E a aba visível. Saiu da
 *    tela, trocou de aba: pausa — vídeo tocando escondido é banda e bateria
 *    gastas para ninguém.
 *  - Modo Lite, "menos movimento" ou "economia de dados": não toca sozinho;
 *    mostra a capa e um botão de play.
 *  - "Ativar som" volta ao começo, para a mensagem ser ouvida do início.
 *  - O espaço é reservado pela proporção real do arquivo: nada salta quando a
 *    capa ou o vídeo terminam de carregar.
 *
 * Os botões param a propagação do clique; o resto da área é do anúncio (o pai
 * decide se o clique abre o link ou o modal).
 */

import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { Pause, Play, Volume2, VolumeX } from 'lucide-react'

import { useLiteMode } from '@/hooks/use-lite-mode'
import type { AnuncioMidia } from '@/lib/anuncio-midia'
import { cn } from '@/lib/utils'

interface AnuncioVideoProps {
  midia: AnuncioMidia
  rotulo: string
  className?: string
  /** Monta o `<video>` já de cara (modal aberto pela própria pessoa). */
  imediato?: boolean
}

function preferePoucoMovimento(): boolean {
  if (typeof window === 'undefined') return true
  const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const economia =
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true
  return reduz || economia
}

export function AnuncioVideo({ midia, rotulo, className, imediato = false }: AnuncioVideoProps) {
  const caixaRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { liteMode } = useLiteMode()

  const [montado, setMontado] = useState(imediato)
  const [mudo, setMudo] = useState(true)
  const [tocando, setTocando] = useState(false)
  const [automatico, setAutomatico] = useState(false)
  // Play pedido antes de o <video> existir: assim que ele montar, toca.
  const [playPendente, setPlayPendente] = useState(false)

  useEffect(() => {
    setAutomatico(!liteMode && !preferePoucoMovimento())
  }, [liteMode])

  // Monta o <video> só quando a peça se aproxima da tela.
  useEffect(() => {
    if (montado) return
    const caixa = caixaRef.current
    if (!caixa || typeof IntersectionObserver === 'undefined') {
      setMontado(true)
      return
    }
    const obs = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setMontado(true)
          obs.disconnect()
        }
      },
      { rootMargin: '300px 0px' },
    )
    obs.observe(caixa)
    return () => obs.disconnect()
  }, [montado])

  // Toca enquanto visível (≥40%) e com a aba à mostra; pausa no resto.
  useEffect(() => {
    const video = videoRef.current
    if (!montado || !video || !automatico) return

    let visivel = false
    const decidir = () => {
      if (visivel && document.visibilityState === 'visible') video.play().catch(() => {})
      else video.pause()
    }
    const obs = new IntersectionObserver(
      ([entrada]) => {
        visivel = entrada.isIntersecting
        decidir()
      },
      { threshold: 0.4 },
    )
    obs.observe(video)
    document.addEventListener('visibilitychange', decidir)
    return () => {
      obs.disconnect()
      document.removeEventListener('visibilitychange', decidir)
    }
  }, [montado, automatico])

  function alternarSom(event: MouseEvent) {
    event.stopPropagation()
    const video = videoRef.current
    if (!video) {
      setMontado(true)
      setMudo(false)
      setPlayPendente(true)
      return
    }
    const novo = !mudo
    video.muted = novo
    setMudo(novo)
    if (!novo) {
      video.currentTime = 0
      video.play().catch(() => {})
    }
  }

  function alternarPlay(event: MouseEvent) {
    event.stopPropagation()
    const video = videoRef.current
    if (!video) {
      setMontado(true)
      setPlayPendente(true)
      return
    }
    if (video.paused) video.play().catch(() => {})
    else video.pause()
  }

  useEffect(() => {
    if (montado && playPendente) {
      videoRef.current?.play().catch(() => {})
      setPlayPendente(false)
    }
  }, [montado, playPendente])

  return (
    <div
      ref={caixaRef}
      className={cn('relative w-full overflow-hidden bg-black', className)}
      style={{ aspectRatio: `${midia.largura} / ${midia.altura}` }}
    >
      {montado ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          poster={midia.posterUrl}
          muted={mudo}
          loop
          playsInline
          preload={imediato ? 'metadata' : 'none'}
          disablePictureInPicture
          controlsList="nodownload noplaybackrate"
          onPlay={() => setTocando(true)}
          onPause={() => setTocando(false)}
          aria-label={rotulo}
        >
          <source src={midia.url} type="video/mp4" />
        </video>
      ) : (
        midia.posterUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={midia.posterUrl}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            width={midia.largura}
            height={midia.altura}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )
      )}

      {/* Sem autoplay: um play grande no centro. */}
      {!tocando && !automatico && (
        <button
          type="button"
          onClick={alternarPlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition hover:bg-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
          aria-label="Assistir ao vídeo"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg sm:h-16 sm:w-16">
            <Play className="ml-1 h-6 w-6 sm:h-7 sm:w-7" />
          </span>
        </button>
      )}

      <div className="absolute right-2 top-2 flex gap-1.5 sm:right-3 sm:top-3 sm:gap-2">
        {(tocando || automatico) && (
          <button
            type="button"
            onClick={alternarPlay}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={tocando ? 'Pausar vídeo' : 'Continuar vídeo'}
          >
            {tocando ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </button>
        )}
        <button
          type="button"
          onClick={alternarSom}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-black/55 px-3 text-xs font-semibold text-white backdrop-blur transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-pressed={!mudo}
        >
          {mudo ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          <span className="hidden sm:inline">{mudo ? 'Ativar som' : 'Som ligado'}</span>
        </button>
      </div>
    </div>
  )
}
