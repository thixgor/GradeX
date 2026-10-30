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
 *   desvia da barra inferior do celular.
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

export function useArrastar<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [posicao, setPosicao] = useState<Posicao | null>(null)
  const [livre, setLivre] = useState<{ x: number; y: number } | null>(null)
  const [arrastando, setArrastando] = useState(false)
  const [inclinacao, setInclinacao] = useState(0)
  const [, setJanela] = useState(0)
  const gesto = useRef<{ id: number; x0: number; y0: number; ox: number; oy: number; ultimoX: number; ultimoT: number; ativo: boolean } | null>(null)
  const arrastou = useRef(false)

  useEffect(() => {
    setPosicao(ler())
    // Girar o celular/redimensionar: recalcula a borda com o tamanho novo.
    const aoRedimensionar = () => setJanela((n) => n + 1)
    window.addEventListener('resize', aoRedimensionar)
    return () => window.removeEventListener('resize', aoRedimensionar)
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
    const { width, height } = ref.current.getBoundingClientRect()
    setLivre({
      x: limitar(e.clientX - g.ox, MARGEM, window.innerWidth - width - MARGEM),
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
      lado: r.left + r.width / 2 < window.innerWidth / 2 ? 'esquerda' : 'direita',
      topo: limitar(r.top / window.innerHeight, 0, 1),
    }
    guardar(nova)
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
    const caixa = ref.current?.getBoundingClientRect()
    const largura = caixa?.width || 68
    const altura = caixa?.height || 68
    const top = limitar(posicao.topo * window.innerHeight, MARGEM, window.innerHeight - altura - MARGEM)
    const left = posicao.lado === 'esquerda' ? MARGEM : window.innerWidth - largura - MARGEM
    estilo = { left, top, right: 'auto', bottom: 'auto' }
  }

  return {
    ref,
    estilo,
    lado: (livre ? (livre.x < (typeof window !== 'undefined' ? window.innerWidth / 2 : 0) ? 'esquerda' : 'direita') : posicao?.lado || 'direita') as LadoDoBotao,
    arrastando,
    inclinacao,
    foiArrasto,
    eventos: { onPointerDown: aoPressionar, onPointerMove: aoMover, onPointerUp: aoSoltar, onPointerCancel: aoSoltar },
  }
}
