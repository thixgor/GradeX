'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Hand, Layers3 } from 'lucide-react'

/**
 * Demonstração do mecanismo de scroll para quem ainda não tem acesso.
 *
 * O argumento de venda desta seção não é uma lista de recursos — é a sensação
 * de rolar a pilha e ver o corpo se abrir corte a corte. Um print não comunica
 * isso; por isso a prévia roda em cine sozinha e aceita o scroll do visitante.
 *
 * O que ela NÃO entrega é o produto: são poucos cortes soltos, sem lista de
 * estruturas, sem ficha, sem janela, sem quiz. Mostra o gesto, não o conteúdo.
 */

interface PreviaProps {
  /** Rótulo da região exibida. */
  regiao: string
  /** URLs dos cortes da amostra, na ordem. */
  urls: string[]
}

export function PreviaCine({ regiao, urls }: PreviaProps) {
  const [indice, setIndice] = useState(0)
  const [autoplay, setAutoplay] = useState(true)
  const [tocou, setTocou] = useState(false)
  const palcoRef = useRef<HTMLDivElement>(null)
  const acumulado = useRef(0)

  // Pré-carrega a amostra inteira: são poucos cortes e o cine precisa rodar
  // liso desde o primeiro segundo, senão a demonstração engasga justamente no
  // momento em que deveria impressionar.
  useEffect(() => {
    urls.forEach((u) => {
      const img = new Image()
      img.src = u
    })
  }, [urls])

  useEffect(() => {
    setIndice(0)
    setAutoplay(true)
    setTocou(false)
  }, [urls])

  useEffect(() => {
    if (!autoplay || urls.length < 2) return
    const id = window.setInterval(() => setIndice((i) => (i + 1) % urls.length), 260)
    return () => window.clearInterval(id)
  }, [autoplay, urls.length])

  const mover = useCallback(
    (passo: number) => {
      setIndice((i) => {
        const n = (i + passo) % urls.length
        return n < 0 ? n + urls.length : n
      })
    },
    [urls.length],
  )

  useEffect(() => {
    const el = palcoRef.current
    if (!el) return
    function aoRolar(e: WheelEvent) {
      e.preventDefault()
      setAutoplay(false)
      setTocou(true)
      acumulado.current += e.deltaY
      const passos = Math.trunc(acumulado.current / 90)
      if (passos !== 0) {
        acumulado.current -= passos * 90
        mover(passos)
      }
    }
    el.addEventListener('wheel', aoRolar, { passive: false })
    return () => el.removeEventListener('wheel', aoRolar)
  }, [mover])

  const arraste = useRef<{ y0: number; i0: number } | null>(null)

  return (
    <figure className="m-0">
      <div
        ref={palcoRef}
        onPointerDown={(e) => {
          ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
          arraste.current = { y0: e.clientY, i0: indice }
          setAutoplay(false)
          setTocou(true)
        }}
        onPointerMove={(e) => {
          const a = arraste.current
          if (!a) return
          const passo = Math.round((e.clientY - a.y0) / 12)
          setIndice(((a.i0 + passo) % urls.length + urls.length) % urls.length)
        }}
        onPointerUp={(e) => {
          ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
          arraste.current = null
        }}
        onPointerCancel={() => { arraste.current = null }}
        className="relative aspect-square w-full cursor-ns-resize select-none overflow-hidden rounded-2xl border border-white/10 bg-black"
        style={{ touchAction: 'none' }}
        role="img"
        aria-label={`Demonstração de ${regiao}: corte ${indice + 1} de ${urls.length}`}
      >
        {urls.map((u, i) => (
          <img
            key={u}
            src={u}
            alt=""
            draggable={false}
            decoding="async"
            className="pointer-events-none absolute inset-0 h-full w-full object-contain"
            style={{ opacity: i === indice ? 1 : 0 }}
          />
        ))}

        {/* HUD reduzido — dá o clima de estação de trabalho sem prometer o produto */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3 font-mono text-[10px] text-emerald-300/70">
          <span className="font-bold uppercase tracking-wider">{regiao}</span>
          <span>
            {String(indice + 1).padStart(2, '0')} / {urls.length}
          </span>
        </div>

        {!tocou && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-3">
            <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-[11px] font-semibold text-white/85 backdrop-blur-sm">
              <Hand className="h-3.5 w-3.5" />
              Role aqui — é assim que o atlas funciona
            </span>
          </div>
        )}

        {/* Régua decorativa */}
        <div className="pointer-events-none absolute inset-x-3 bottom-2 h-0.5 rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-emerald-400/70 transition-[width] duration-200"
            style={{ width: `${((indice + 1) / urls.length) * 100}%` }}
          />
        </div>
      </div>
      <figcaption className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
        <Layers3 className="h-3 w-3" />
        Amostra de {urls.length} cortes. O atlas completo tem as séries inteiras, com rótulos, janelas e fichas.
      </figcaption>
    </figure>
  )
}
