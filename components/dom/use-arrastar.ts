'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as PointerDoReact } from 'react'

/**
 * O botão do Dom arrastável (mouse e dedo). Ao soltar, ele gruda na borda
 * mais próxima (esquerda ou direita) e a posição fica guardada no aparelho.
 *
 * - Só vira arrasto depois de 6 px: toque curto continua sendo clique.
 * - `inclinacao` acompanha a velocidade horizontal — o Dom balança para o
 *   lado em que está sendo puxado (e se sacode, pelo CSS de `arrastando`).
 * - Sem posição guardada, quem manda é o CSS (`.dom-lancador`), que já
 *   desvia da barra inferior do celular e do botão de música.
 * - Grudado à esquerda, fica depois da barra lateral; e desvia dos botões
 *   flutuantes marcados com `data-dom-obstaculo`.
 */

const CHAVE = 'dom:posicao:v1'
const MARGEM = 12
const LIMIAR_PX = 6

export type LadoDoBotao = 'esquerda' | 'direita'
interface Posicao {
  lado: LadoDoBotao
  /** Topo como fração da altura da janela (sobrevive a girar o celular). */
  topo: number
}

function ler(): Posicao | null {
  try {
    const p = JSON.parse(localStorage.getItem(CHAVE) || 'null')
    return p && (p.lado === 'esquerda' || p.lado === 'direita') && Number.isFinite(p.topo) ? p : null
  } catch {
    return null
  }
}

function guardar(p: Posicao) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(p))
  } catch {
    /* sem armazenamento: vale só nesta visita */
  }
}

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/**
 * Largura livre da janela, SEM a barra de rolagem. `innerWidth` conta a barra:
 * grudado à direita, o botão ficava com uns 15 px embaixo dela.
 */
function larguraDaJanela(): number {
  return document.documentElement.clientWidth || window.innerWidth
}

/**
 * Tamanho do botão sem as transformações do CSS. Com o painel aberto o
 * lançador encolhe (`scale(0.6)`) e some; medido com `getBoundingClientRect`
 * nessa hora, ele "tinha" 40 px de largura, e ao fechar o painel voltava aos
 * 68 px na posição calculada para 40 — metade para fora da tela, cortado no
 * canto. `offsetWidth` ignora a escala.
 */
function tamanho(el: HTMLElement | null): { largura: number; altura: number } {
  return { largura: el?.offsetWidth || 68, altura: el?.offsetHeight || 68 }
}

/** Posição já lida nesta visita: na troca de página o botão nasce no lugar (sem pular). */
let emMemoria: Posicao | null | undefined

/**
 * Obstáculos marcados na página: `lateral` (a barra lateral — o botão não
 * gruda embaixo dela) e `botao` (música, suporte — o botão desvia).
 */
function obstaculos(tipo: 'lateral' | 'botao'): DOMRect[] {
  if (typeof document === 'undefined') return []
  return [...document.querySelectorAll(`[data-dom-obstaculo="${tipo}"]`)]
    .map((e) => e.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.height > 0 && r.right > 0 && r.left < larguraDaJanela())
}

/** Borda esquerda livre: depois da barra lateral, quando ela está na tela. */
function bordaEsquerda(): number {
  return Math.max(MARGEM, ...obstaculos('lateral').map((r) => r.right + MARGEM))
}

/** Sobe (ou desce) o botão até não cobrir nenhum botão flutuante. */
function desviar(left: number, top: number, largura: number, altura: number): number {
  const folga = 10
  const cobertos = obstaculos('botao')
  for (let i = 0; i < 4; i++) {
    const r = cobertos.find((o) => left < o.right + folga && left + largura > o.left - folga && top < o.bottom + folga && top + altura > o.top - folga)
    if (!r) break
    const acima = r.top - altura - folga
    top = acima >= MARGEM ? acima : r.bottom + folga
  }
  return limitar(top, MARGEM, window.innerHeight - altura - MARGEM)
}

export function useArrastar<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [posicao, setPosicao] = useState<Posicao | null>(() => emMemoria ?? null)
  const [livre, setLivre] = useState<{ x: number; y: number } | null>(null)
  const [arrastando, setArrastando] = useState(false)
  const [inclinacao, setInclinacao] = useState(0)
  const [, setJanela] = useState(0)
  const gesto = useRef<{ id: number; x0: number; y0: number; ox: number; oy: number; ultimoX: number; ultimoT: number; ativo: boolean } | null>(null)
  const arrastou = useRef(false)

  useEffect(() => {
    if (emMemoria === undefined) emMemoria = ler()
    setPosicao(emMemoria)
    // Girar o celular/redimensionar: recalcula a borda com o tamanho novo.
    const aoRedimensionar = () => setJanela((n) => n + 1)
    window.addEventListener('resize', aoRedimensionar)
    // Barra lateral recolhendo/abrindo muda a borda livre da esquerda.
    const observador = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(aoRedimensionar) : null
    document.querySelectorAll('[data-dom-obstaculo="lateral"]').forEach((e) => observador?.observe(e))
    return () => {
      window.removeEventListener('resize', aoRedimensionar)
      observador?.disconnect()
    }
  }, [])

  const aoPressionar = useCallback((e: PointerDoReact<HTMLElement>) => {
    if (e.button !== 0 || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    gesto.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top, ultimoX: e.clientX, ultimoT: e.timeStamp, ativo: false }
    arrastou.current = false
    // Captura já no toque, em quem tem os ouvintes (o botão): um puxão rápido
    // sai de cima dele antes do primeiro "move" e o arrasto se perderia.
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }, [])

  const aoMover = useCallback((e: PointerDoReact<HTMLElement>) => {
    const g = gesto.current
    if (!g || g.id !== e.pointerId || !ref.current) return
    if (!g.ativo) {
      if (Math.hypot(e.clientX - g.x0, e.clientY - g.y0) < LIMIAR_PX) return
      g.ativo = true
      arrastou.current = true
      setArrastando(true)
    }
    const { largura: width, altura: height } = tamanho(ref.current)
    setLivre({
      x: limitar(e.clientX - g.ox, bordaEsquerda(), larguraDaJanela() - width - MARGEM),
      y: limitar(e.clientY - g.oy, MARGEM, window.innerHeight - height - MARGEM),
    })
    const dt = Math.max(1, e.timeStamp - g.ultimoT)
    const velocidade = (e.clientX - g.ultimoX) / dt // px por ms
    setInclinacao(limitar(velocidade * 18, -22, 22))
    g.ultimoX = e.clientX
    g.ultimoT = e.timeStamp
  }, [])

  const aoSoltar = useCallback((e: PointerDoReact<HTMLElement>) => {
    const g = gesto.current
    if (!g || g.id !== e.pointerId) return
    gesto.current = null
    if (!g.ativo || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const nova: Posicao = {
      lado: r.left + r.width / 2 < larguraDaJanela() / 2 ? 'esquerda' : 'direita',
      topo: limitar(r.top / window.innerHeight, 0, 1),
    }
    guardar(nova)
    emMemoria = nova
    setPosicao(nova)
    setLivre(null)
    setArrastando(false)
    setInclinacao(0)
  }, [])

  /** O clique que encerra um arrasto não abre o painel. */
  const foiArrasto = useCallback(() => {
    const sim = arrastou.current
    arrastou.current = false
    return sim
  }, [])

  let estilo: CSSProperties | undefined
  if (livre) {
    estilo = { left: livre.x, top: livre.y, right: 'auto', bottom: 'auto' }
  } else if (posicao && typeof window !== 'undefined') {
    // Sempre por `left`/`top`: assim o "grudar na borda" anima a partir de onde soltou.
    const { largura, altura } = tamanho(ref.current)
    // Esquerda: depois da barra lateral (não some embaixo dela). E desvia dos
    // botões de música e suporte.
    const left = posicao.lado === 'esquerda' ? bordaEsquerda() : larguraDaJanela() - largura - MARGEM
    const top = desviar(left, limitar(posicao.topo * window.innerHeight, MARGEM, window.innerHeight - altura - MARGEM), largura, altura)
    estilo = { left, top, right: 'auto', bottom: 'auto' }
  }

  return {
    ref,
    estilo,
    lado: (livre ? (livre.x < (typeof window !== 'undefined' ? larguraDaJanela() / 2 : 0) ? 'esquerda' : 'direita') : posicao?.lado || 'direita') as LadoDoBotao,
    arrastando,
    inclinacao,
    foiArrasto,
    eventos: { onPointerDown: aoPressionar, onPointerMove: aoMover, onPointerUp: aoSoltar, onPointerCancel: aoSoltar },
  }
}
