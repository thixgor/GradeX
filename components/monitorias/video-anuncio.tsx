'use client'

import { useEffect, useRef, useState } from 'react'
import { Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Vídeo-anúncio das Monitorias (arquivos em public/videos/monitorias, nome
 * versionado e cache imutável). Pensado para pesar pouco:
 *  - `preload="none"` + pôster: nada baixa antes de o vídeo aparecer na tela;
 *  - toca sem som, SÓ enquanto está visível (sai da tela → pausa);
 *  - quem pediu menos movimento ou economia de dados vê o pôster e um botão
 *    de play, sem tocar sozinho;
 *  - um formato por tela: o herói escolhe qual montar (nunca os dois juntos).
 * "Ativar som" volta ao começo, para a narração ser ouvida do início.
 */
export function VideoAnuncio({
  formato,
  className,
}: {
  formato: '1x1' | '4x1'
  className?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const [mudo, setMudo] = useState(true)
  const [tocando, setTocando] = useState(false)
  const [automatico, setAutomatico] = useState(false)

  // Autoplay só se a pessoa não pediu menos movimento nem economia de dados.
  useEffect(() => {
    const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const economia = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true
    setAutomatico(!reduz && !economia)
  }, [])

  // Toca quando ao menos 40% do vídeo está visível; pausa ao sair.
  useEffect(() => {
    const v = ref.current
    if (!v || !automatico) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {})
        else v.pause()
      },
      { threshold: 0.4 },
    )
    obs.observe(v)
    return () => obs.disconnect()
  }, [automatico])

  function alternarSom() {
    const v = ref.current
    if (!v) return
    const novo = !mudo
    v.muted = novo
    setMudo(novo)
    if (!novo) {
      v.currentTime = 0
      v.play().catch(() => {})
    }
  }

  function alternarPlay() {
    const v = ref.current
    if (!v) return
    if (v.paused) v.play().catch(() => {})
    else v.pause()
  }

  const base = `/videos/monitorias/monitorias-${formato}-v1`
  return (
    <div className={cn('group relative overflow-hidden rounded-3xl border border-border bg-[#0c1410] shadow-[0_24px_60px_-28px_hsl(var(--primary)/0.45)]', className)}>
      <video
        ref={ref}
        className={cn('block h-full w-full', formato === '1x1' ? 'aspect-[720/746]' : 'aspect-[1440/368]')}
        poster={`${base}.webp`}
        muted={mudo}
        loop
        playsInline
        preload="none"
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
        aria-label="Vídeo: como funcionam as Monitorias da DomineAqui, para aluno e monitor"
      >
        <source src={`${base}.mp4`} type="video/mp4" />
      </video>

      {/* Sem autoplay (menos movimento / economia de dados): um play grande no centro. */}
      {!tocando && !automatico && (
        <button
          type="button"
          onClick={alternarPlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition hover:bg-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          aria-label="Assistir ao vídeo"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
            <Play className="ml-1 h-7 w-7" />
          </span>
        </button>
      )}

      {/* No alto: embaixo fica o rodapé do vídeo (razão social), que não pode ser coberto. */}
      <div className="absolute right-3 top-3 flex gap-2">
        {(tocando || automatico) && (
          <button
            type="button"
            onClick={alternarPlay}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={tocando ? 'Pausar vídeo' : 'Continuar vídeo'}
          >
            {tocando ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </button>
        )}
        <button
          type="button"
          onClick={alternarSom}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-black/55 px-3 text-xs font-semibold text-white backdrop-blur transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-pressed={!mudo}
        >
          {mudo ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          {mudo ? 'Ativar som' : 'Som ligado'}
        </button>
      </div>
    </div>
  )
}

/**
 * Um vídeo por largura de tela: quadrado no celular e no computador (coluna
 * do herói), banner 4:1 no tablet (largura cheia). Escolhido no navegador,
 * então só UM arquivo é baixado.
 */
export function VideoAnuncioResponsivo({ className }: { className?: string }) {
  const [formato, setFormato] = useState<'1x1' | '4x1' | null>(null)
  useEffect(() => {
    const tablet = window.matchMedia('(min-width: 768px) and (max-width: 1023px)')
    const atualizar = () => setFormato(tablet.matches ? '4x1' : '1x1')
    atualizar()
    tablet.addEventListener('change', atualizar)
    return () => tablet.removeEventListener('change', atualizar)
  }, [])
  if (!formato) return <div className={cn('aspect-square w-full rounded-3xl border border-border bg-[#0c1410] md:aspect-[1440/368] lg:aspect-[720/746]', className)} aria-hidden />
  return <VideoAnuncio key={formato} formato={formato} className={className} />
}
