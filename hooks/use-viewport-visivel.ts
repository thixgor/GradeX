'use client'

import { useEffect, useState } from 'react'

/**
 * A parte da tela que a pessoa enxerga de fato. No iOS, o teclado aberto
 * encolhe só a "visual viewport": uma tela `fixed` com `100dvh` ficaria com o
 * campo do chat escondido atrás do teclado. Medindo aqui, a sala inteira cabe
 * acima dele. Sem `visualViewport` (navegador antigo): `null`, e vale o CSS.
 */
export function useViewportVisivel(): { altura: number | null; topo: number } {
  const [v, setV] = useState<{ altura: number | null; topo: number }>({ altura: null, topo: 0 })
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    let quadro = 0
    const ler = () => {
      cancelAnimationFrame(quadro)
      quadro = requestAnimationFrame(() => setV({ altura: Math.round(vv.height), topo: Math.round(vv.offsetTop) }))
    }
    ler()
    vv.addEventListener('resize', ler)
    vv.addEventListener('scroll', ler)
    return () => {
      cancelAnimationFrame(quadro)
      vv.removeEventListener('resize', ler)
      vv.removeEventListener('scroll', ler)
    }
  }, [])
  return v
}

/** Celular em pé (retrato e estreito): o vídeo de quem está em paisagem não deve ser cortado. */
export function useCelularEmPe(): boolean {
  const [emPe, setEmPe] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait) and (max-width: 640px)')
    const ler = () => setEmPe(mq.matches)
    ler()
    mq.addEventListener?.('change', ler)
    return () => mq.removeEventListener?.('change', ler)
  }, [])
  return emPe
}
