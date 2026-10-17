'use client'

import { useEffect, type RefObject } from 'react'

/**
 * O brilho de quem fala, colado na voz: lê o nível a cada quadro da tela
 * (`requestAnimationFrame`, que para sozinho com a aba oculta), suaviza —
 * acende rápido, apaga devagar — e escreve `--voz` (0 a 1) direto no elemento,
 * sem re-render do React. `data-falando="sim"` liga o realce de vidro.
 *
 * `ler` deve ser estável (useCallback): trocar de função reinicia o laço.
 */
export function useBrilhoDaVoz(ref: RefObject<HTMLElement>, ler: (() => number) | null): void {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!ler) {
      el.style.setProperty('--voz', '0')
      delete el.dataset.falando
      return
    }
    let atual = 0
    let falando = false
    let quadro = 0
    const passo = () => {
      const alvo = Math.min(1, Math.max(0, ler()))
      atual += (alvo - atual) * (alvo > atual ? 0.55 : 0.08)
      if (atual < 0.004) atual = 0
      el.style.setProperty('--voz', atual.toFixed(3))
      const agora = atual > 0.14
      if (agora !== falando) {
        falando = agora
        if (falando) el.dataset.falando = 'sim'
        else delete el.dataset.falando
      }
      quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => {
      cancelAnimationFrame(quadro)
      el.style.setProperty('--voz', '0')
      delete el.dataset.falando
    }
  }, [ref, ler])
}
