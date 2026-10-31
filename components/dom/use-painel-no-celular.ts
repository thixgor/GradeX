'use client'

import { useEffect, type RefObject } from 'react'

/**
 * O painel do Dom no celular ocupa a tela inteira. Duas coisas estragavam isso:
 *
 * 1. **A página de baixo rolava junto.** O dedo que rolava a conversa até o
 *    fim continuava rolando o `<body>` atrás do painel (o iOS ignora
 *    `overflow: hidden` no body para o toque), e ao abrir o teclado a página
 *    aparecia por baixo. Enquanto o painel está aberto o `<body>` fica preso
 *    no lugar (`position: fixed` no ponto em que estava) e volta ao mesmo
 *    ponto quando ele fecha.
 *
 * 2. **O "zoom" ao tocar em "Pergunte qualquer coisa…".** Com o teclado
 *    aberto, a área visível encolhe mas o painel (`inset: 0`) continuava do
 *    tamanho da tela — o navegador então deslizava a tela inteira para baixo
 *    até achar o campo, o que parecia um zoom no rodapé, com a página
 *    aparecendo atrás. Aqui o painel acompanha a área visível de verdade
 *    (`visualViewport`): altura e topo vão em `--dom-vv-h` / `--dom-vv-topo`,
 *    e o campo fica logo acima do teclado, sem a tela pular.
 *
 * Só vale na largura de celular (o painel em tela cheia); no computador ele
 * é uma janela no canto e a página pode continuar rolando.
 */

const CELULAR = '(max-width: 639px)'

export function usePainelNoCelular(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const consulta = window.matchMedia(CELULAR)
    let destravar: (() => void) | null = null
    let soltarViewport: (() => void) | null = null

    const travarRolagem = () => {
      const { body, documentElement: html } = document
      const y = window.scrollY
      const rota = window.location.pathname
      const antes = {
        position: body.style.position,
        top: body.style.top,
        left: body.style.left,
        right: body.style.right,
        width: body.style.width,
        overflow: body.style.overflow,
        overscroll: html.style.overscrollBehavior,
      }
      body.style.position = 'fixed'
      body.style.top = `-${y}px`
      body.style.left = '0'
      body.style.right = '0'
      body.style.width = '100%'
      body.style.overflow = 'hidden'
      html.style.overscrollBehavior = 'none'
      return () => {
        body.style.position = antes.position
        body.style.top = antes.top
        body.style.left = antes.left
        body.style.right = antes.right
        body.style.width = antes.width
        body.style.overflow = antes.overflow
        html.style.overscrollBehavior = antes.overscroll
        // Fechou aqui mesmo: volta ao ponto em que a pessoa estava. Se o Dom
        // levou para outra página ("vou te levar lá"), a página nova manda.
        if (window.location.pathname === rota) window.scrollTo(0, y)
      }
    }

    const seguirViewport = () => {
      const vv = window.visualViewport
      const el = ref.current
      if (!vv || !el) return null
      let quadro = 0
      const aplicar = () => {
        quadro = 0
        el.style.setProperty('--dom-vv-h', `${Math.round(vv.height)}px`)
        el.style.setProperty('--dom-vv-topo', `${Math.max(0, Math.round(vv.offsetTop))}px`)
      }
      const agendar = () => {
        if (!quadro) quadro = requestAnimationFrame(aplicar)
      }
      aplicar()
      vv.addEventListener('resize', agendar)
      vv.addEventListener('scroll', agendar)
      return () => {
        if (quadro) cancelAnimationFrame(quadro)
        vv.removeEventListener('resize', agendar)
        vv.removeEventListener('scroll', agendar)
        el.style.removeProperty('--dom-vv-h')
        el.style.removeProperty('--dom-vv-topo')
      }
    }

    const aplicar = () => {
      if (consulta.matches) {
        destravar ??= travarRolagem()
        soltarViewport ??= seguirViewport()
      } else {
        destravar?.()
        soltarViewport?.()
        destravar = soltarViewport = null
      }
    }
    aplicar()
    consulta.addEventListener?.('change', aplicar)
    return () => {
      consulta.removeEventListener?.('change', aplicar)
      destravar?.()
      soltarViewport?.()
    }
  }, [ref])
}
