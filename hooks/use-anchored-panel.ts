'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'

/**
 * Painel flutuante ancorado a um botão do cabeçalho (sino de notificações,
 * sessão de foco).
 *
 * Antes cada um desses painéis era um `absolute right-0` dentro do próprio
 * botão. No desktop funciona; no celular não: o botão fica a ~90px da borda
 * direita, o painel tem 320px e a borda esquerda dele cai FORA da tela — era o
 * "modal indo muito pra esquerda". Além disso, qualquer ancestral com
 * `backdrop-filter`/`transform` (o cabeçalho tem os dois) vira bloco de
 * contenção e quebra `position: fixed` de dentro.
 *
 * Aqui o painel é renderizado num portal no `<body>` e posicionado a partir do
 * retângulo real do gatilho: no celular ocupa a largura da tela com uma margem
 * de cada lado; no desktop encosta na direita do gatilho, sem nunca vazar. A
 * altura máxima também é calculada, para o painel nunca passar do rodapé da
 * tela.
 */

interface AnchoredPanelOptions {
  /** Largura do painel a partir de `sm` (px). No celular ele é fluido. */
  width?: number
  /** Espaço entre o gatilho e o painel (px). */
  gap?: number
}

export function useAnchoredPanel<T extends HTMLElement = HTMLButtonElement>(
  open: boolean,
  onClose: () => void,
  { width = 320, gap = 8 }: AnchoredPanelOptions = {},
) {
  const triggerRef = useRef<T | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [style, setStyle] = useState<CSSProperties | null>(null)
  const [mounted, setMounted] = useState(false)

  // O portal só pode ser criado depois da montagem no cliente.
  useEffect(() => setMounted(true), [])

  const measure = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const margin = 12
    const top = Math.round(rect.bottom + gap)
    const maxHeight = Math.max(220, Math.round(vh - top - margin))

    if (vw < 640) {
      setStyle({ position: 'fixed', top, left: margin, right: margin, maxHeight, zIndex: 70 })
      return
    }

    // Encosta na direita do gatilho, mas nunca deixa a borda esquerda passar da
    // margem — em telas estreitas o painel simplesmente desliza para dentro.
    const preferred = Math.round(vw - rect.right)
    const right = Math.min(Math.max(margin, preferred), Math.max(margin, vw - width - margin))
    setStyle({ position: 'fixed', top, right, width, maxHeight, zIndex: 70 })
  }, [gap, width])

  useEffect(() => {
    if (!open) return
    measure()
    const onViewportChange = () => measure()
    window.addEventListener('resize', onViewportChange)
    // `capture` para acompanhar também a rolagem de contêineres internos
    // (o cabeçalho é sticky, mas a página abaixo dele rola).
    window.addEventListener('scroll', onViewportChange, true)
    return () => {
      window.removeEventListener('resize', onViewportChange)
      window.removeEventListener('scroll', onViewportChange, true)
    }
  }, [open, measure])

  // Fecha no clique/toque fora e no Esc. `pointerdown` cobre mouse, caneta e
  // toque de uma vez — `mousedown` sozinho não é disparado de forma confiável
  // em todos os navegadores móveis.
  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: Event) => {
      const target = event.target as Node | null
      if (!target) return
      if (triggerRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      onClose()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  return { triggerRef, panelRef, style, mounted }
}
