'use client'

import { useCallback, useEffect, useRef } from 'react'
import { AUDIOS_PRONTOS, PASTA_DE_AUDIO } from '@/lib/jornada/narracao'
import { estaMudo, EVENTO_DO_MUDO } from '@/components/dom/voz'

/**
 * A mesma música lofi do cadastro (jornada) tocando por baixo do tour da
 * plataforma: entra em fade, abaixa quando o Dom fala e sai em fade ao fechar.
 *
 * Mesmos volumes da jornada (`use-som-da-jornada.ts`): a música chega a
 * -20 LUFS e as falas do Dom a -19, então 30% a deixa bem atrás e 10% a deixa
 * quase só como clima enquanto ele fala. Ganho num `GainNode` porque no iPhone
 * `audio.volume` é só leitura. Respeita o som do Dom: silenciado, sem música.
 *
 * O tour abre sozinho, antes de qualquer toque — o navegador recusa o play;
 * nesse caso a música começa no primeiro toque dentro do tour.
 */

const VOLUME = 0.3
const VOLUME_SOB_VOZ = 0.1

export function useMusicaDoTour(aberto: boolean) {
  const ctx = useRef<AudioContext | null>(null)
  const ganho = useRef<GainNode | null>(null)
  const el = useRef<HTMLAudioElement | null>(null)
  const falando = useRef(false)

  const rampa = useCallback((alvo: number, segundos = 0.6) => {
    const c = ctx.current
    const g = ganho.current
    if (!c || !g) return
    g.gain.cancelScheduledValues(c.currentTime)
    g.gain.setValueAtTime(g.gain.value, c.currentTime)
    g.gain.linearRampToValueAtTime(alvo, c.currentTime + segundos)
  }, [])

  const tocar = useCallback(() => {
    if (!AUDIOS_PRONTOS.musica || estaMudo()) return
    if (!el.current) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return
      try {
        ctx.current = new Ctor()
        const audio = new Audio(`${PASTA_DE_AUDIO}/musica.mp3`)
        audio.loop = true
        audio.preload = 'auto'
        const g = ctx.current.createGain()
        g.gain.value = 0
        ctx.current.createMediaElementSource(audio).connect(g).connect(ctx.current.destination)
        ganho.current = g
        el.current = audio
      } catch {
        return
      }
    }
    void ctx.current?.resume()
    el.current.play().then(
      () => rampa(falando.current ? VOLUME_SOB_VOZ : VOLUME, 2),
      () => {},
    )
  }, [rampa])

  useEffect(() => {
    if (!aberto) return
    tocar()
    // Autoplay recusado: começa no primeiro toque.
    const noToque = () => tocar()
    window.addEventListener('pointerdown', noToque, { once: true })
    const aoMudo = (e: Event) => {
      if ((e as CustomEvent<{ mudo: boolean }>).detail?.mudo) rampa(0, 0.4)
      else tocar()
    }
    window.addEventListener(EVENTO_DO_MUDO, aoMudo)
    return () => {
      window.removeEventListener('pointerdown', noToque)
      window.removeEventListener(EVENTO_DO_MUDO, aoMudo)
      // Sai em fade e solta tudo.
      rampa(0, 0.8)
      const audio = el.current
      const c = ctx.current
      setTimeout(() => {
        audio?.pause()
        void c?.close().catch(() => {})
      }, 900)
      el.current = null
      ctx.current = null
      ganho.current = null
    }
  }, [aberto, rampa, tocar])

  /** O Dom começou/parou de falar: a música abaixa e volta. */
  const aoFalar = useCallback(
    (sim: boolean) => {
      falando.current = sim
      rampa(sim ? VOLUME_SOB_VOZ : VOLUME, sim ? 0.25 : 0.8)
    },
    [rampa],
  )

  return { aoFalar }
}
