'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Maximize2, Minus, Move, Plus, RotateCcw, Shrink } from 'lucide-react'
import type { AtlasMarker } from '@/lib/atlas-anatomia/catalogo'

/**
 * Visualizador da prancha anatômica.
 *
 * Prancha de anatomia é imagem densa: numa tela de celular, um marcador cobre
 * três estruturas vizinhas. Por isso o palco tem zoom (roda, pinça e botões),
 * arraste, tela cheia e um modo de estudo que esconde os números para o aluno
 * tentar nomear a estrutura antes de conferir.
 *
 * O zoom é aplicado num contêiner que envolve imagem e marcadores juntos, de
 * modo que os pinos acompanhem a peça; a escala inversa aplicada a cada pino
 * mantém o círculo do mesmo tamanho na tela em qualquer nível de aproximação.
 */

const ZOOM_MIN = 1
const ZOOM_MAX = 6
const ZOOM_PASSO = 0.4

interface Transformacao {
  escala: number
  x: number
  y: number
}

const INICIAL: Transformacao = { escala: 1, x: 0, y: 0 }

export interface PranchaInterativaProps {
  imagem: string
  alt: string
  marcadores: AtlasMarker[]
  indiceAtivo: number | null
  onSelecionar: (indice: number | null) => void
  /** Esconde os números até o aluno tocar no pino. */
  modoEstudo: boolean
  /** Chave que reinicia o zoom quando a prancha muda. */
  chaveDaPeca: string
  prioridade?: boolean
}

export function PranchaInterativa({
  imagem,
  alt,
  marcadores,
  indiceAtivo,
  onSelecionar,
  modoEstudo,
  chaveDaPeca,
  prioridade,
}: PranchaInterativaProps) {
  const palcoRef = useRef<HTMLDivElement>(null)
  const [transformacao, setTransformacao] = useState<Transformacao>(INICIAL)
  const [arrastando, setArrastando] = useState(false)
  const [telaCheia, setTelaCheia] = useState(false)
  const [revelados, setRevelados] = useState<Set<number>>(new Set())

  const ponteiros = useRef(new Map<number, { x: number; y: number }>())
  const gesto = useRef<{ distancia: number; escala: number } | null>(null)
  const arrasteInicial = useRef<{ x: number; y: number; origemX: number; origemY: number } | null>(null)

  // Cada prancha começa do zero: manter o zoom da anterior desorienta.
  useEffect(() => {
    setTransformacao(INICIAL)
    setRevelados(new Set())
  }, [chaveDaPeca])

  useEffect(() => {
    const aoMudar = () => setTelaCheia(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', aoMudar)
    return () => document.removeEventListener('fullscreenchange', aoMudar)
  }, [])

  const limitar = useCallback((valor: Transformacao): Transformacao => {
    const escala = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, valor.escala))
    // Em escala 1 não há para onde arrastar; acima disso, o deslocamento é
    // limitado à metade do excedente para a peça nunca sumir da moldura.
    const limite = ((escala - 1) / 2) * 100
    return {
      escala,
      x: Math.min(limite, Math.max(-limite, escala === 1 ? 0 : valor.x)),
      y: Math.min(limite, Math.max(-limite, escala === 1 ? 0 : valor.y)),
    }
  }, [])

  const aplicarZoom = useCallback(
    (delta: number) => setTransformacao(atual => limitar({ ...atual, escala: atual.escala + delta })),
    [limitar],
  )

  const reiniciar = useCallback(() => setTransformacao(INICIAL), [])

  // Zoom pela roda só com Ctrl/⌘ (que é também o que a pinça do trackpad envia).
  // Sem isso, passar o mouse sobre uma prancha de tela cheia sequestraria a
  // rolagem da página. O listener é nativo e não passivo porque o React
  // registra `wheel` como passivo e `preventDefault` seria ignorado.
  useEffect(() => {
    const palco = palcoRef.current
    if (!palco) return
    const aoRolar = (evento: WheelEvent) => {
      if (!evento.ctrlKey && !evento.metaKey) return
      evento.preventDefault()
      setTransformacao(atual => limitar({ ...atual, escala: atual.escala - Math.sign(evento.deltaY) * ZOOM_PASSO }))
    }
    palco.addEventListener('wheel', aoRolar, { passive: false })
    return () => palco.removeEventListener('wheel', aoRolar)
  }, [limitar])

  function aoPressionar(evento: React.PointerEvent) {
    ponteiros.current.set(evento.pointerId, { x: evento.clientX, y: evento.clientY })
    if (ponteiros.current.size === 2) {
      const [a, b] = [...ponteiros.current.values()]
      gesto.current = { distancia: Math.hypot(a.x - b.x, a.y - b.y), escala: transformacao.escala }
      return
    }
    if (transformacao.escala === 1) return
    ;(evento.target as Element).setPointerCapture?.(evento.pointerId)
    arrasteInicial.current = {
      x: evento.clientX,
      y: evento.clientY,
      origemX: transformacao.x,
      origemY: transformacao.y,
    }
    setArrastando(true)
  }

  function aoMover(evento: React.PointerEvent) {
    if (!ponteiros.current.has(evento.pointerId)) return
    ponteiros.current.set(evento.pointerId, { x: evento.clientX, y: evento.clientY })

    if (ponteiros.current.size === 2 && gesto.current) {
      const [a, b] = [...ponteiros.current.values()]
      const distancia = Math.hypot(a.x - b.x, a.y - b.y)
      const fator = distancia / (gesto.current.distancia || 1)
      setTransformacao(atual => limitar({ ...atual, escala: gesto.current!.escala * fator }))
      return
    }

    const inicio = arrasteInicial.current
    if (!inicio) return
    const largura = palcoRef.current?.clientWidth || 1
    const altura = palcoRef.current?.clientHeight || 1
    setTransformacao(atual =>
      limitar({
        ...atual,
        x: inicio.origemX + ((evento.clientX - inicio.x) / largura) * 100,
        y: inicio.origemY + ((evento.clientY - inicio.y) / altura) * 100,
      }),
    )
  }

  function aoSoltar(evento: React.PointerEvent) {
    ponteiros.current.delete(evento.pointerId)
    if (ponteiros.current.size < 2) gesto.current = null
    if (ponteiros.current.size === 0) {
      arrasteInicial.current = null
      setArrastando(false)
    }
  }

  async function alternarTelaCheia() {
    if (!palcoRef.current) return
    if (document.fullscreenElement) await document.exitFullscreen()
    else await palcoRef.current.requestFullscreen?.()
  }

  function selecionar(indice: number) {
    if (modoEstudo) setRevelados(atual => new Set(atual).add(indice))
    onSelecionar(indiceAtivo === indice ? null : indice)
  }

  return (
    <div
      ref={palcoRef}
      className={`group/palco relative isolate overflow-hidden bg-[radial-gradient(ellipse_at_center,#161d26_0%,#080b10_75%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${
        telaCheia ? 'flex h-full w-full items-center justify-center' : 'rounded-2xl border border-white/10'
      }`}
    >
      {/* `pb-14` reserva a faixa dos controles: sem ela, um marcador no rodapé
          da prancha ficaria escondido atrás dos botões de zoom. */}
      <div
        className={`relative mx-auto w-full touch-none select-none pb-14 ${
          telaCheia ? 'h-full max-h-full' : 'aspect-square max-w-[900px]'
        } ${transformacao.escala > 1 ? (arrastando ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'}`}
        onPointerDown={aoPressionar}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onPointerCancel={aoSoltar}
        onDoubleClick={() => (transformacao.escala > 1 ? reiniciar() : aplicarZoom(ZOOM_PASSO * 3))}
      >
        <div
          className="absolute inset-x-0 bottom-14 top-0 origin-center transition-transform duration-100 ease-out"
          style={{ transform: `translate(${transformacao.x}%, ${transformacao.y}%) scale(${transformacao.escala})` }}
        >
          <Image
            key={imagem}
            src={imagem}
            alt={alt}
            fill
            priority={prioridade}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 70vw, 900px"
            className="pointer-events-none object-contain"
            draggable={false}
          />

          {marcadores.map((marcador, indice) => {
            const ativo = indiceAtivo === indice
            const oculto = modoEstudo && !revelados.has(indice) && !ativo
            return (
              <button
                key={`${marcador.title}-${indice}`}
                type="button"
                onClick={event => {
                  event.stopPropagation()
                  selecionar(indice)
                }}
                aria-label={`${indice + 1}. ${marcador.title}`}
                aria-pressed={ativo}
                style={{
                  left: `${marcador.x * 100}%`,
                  top: `${marcador.y * 100}%`,
                  transform: `translate(-50%, -50%) scale(${1 / transformacao.escala})`,
                }}
                className="absolute z-10 origin-center focus:outline-none"
              >
                <span
                  className={`relative flex items-center justify-center rounded-full border font-black tabular-nums shadow-[0_2px_10px_rgba(0,0,0,0.55)] transition duration-200 ${
                    ativo
                      ? 'h-9 w-9 border-amber-200 bg-amber-400 text-[13px] text-amber-950 ring-4 ring-amber-400/30'
                      : oculto
                        ? 'h-7 w-7 border-white/70 bg-white/20 text-[12px] text-white/80 backdrop-blur-sm hover:bg-white/35 sm:h-8 sm:w-8'
                        : 'h-7 w-7 border-white/85 bg-sky-600 text-[11px] text-white hover:scale-110 hover:bg-sky-500 sm:h-8 sm:w-8 sm:text-xs'
                  }`}
                >
                  {oculto ? '?' : indice + 1}
                  {ativo && (
                    <span className="absolute inset-0 animate-ping rounded-full bg-amber-400/40" aria-hidden />
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Controles: discretos no desktop, sempre visíveis no toque. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2.5 sm:p-3">
        <span className="pointer-events-none hidden items-center gap-1.5 rounded-lg bg-black/45 px-2.5 py-1.5 text-[11px] font-medium text-white/70 backdrop-blur sm:inline-flex">
          <Move className="h-3.5 w-3.5" />
          {transformacao.escala > 1 ? 'Arraste para navegar' : 'Duplo clique, pinça ou Ctrl + roda para aproximar'}
        </span>
        <div className="pointer-events-auto ml-auto flex items-center gap-1 rounded-xl border border-white/10 bg-black/55 p-1 backdrop-blur">
          <BotaoPalco titulo="Afastar" onClick={() => aplicarZoom(-ZOOM_PASSO)} desabilitado={transformacao.escala <= ZOOM_MIN}>
            <Minus className="h-4 w-4" />
          </BotaoPalco>
          <span className="min-w-[3ch] text-center text-[11px] font-bold tabular-nums text-white/70">
            {Math.round(transformacao.escala * 100)}%
          </span>
          <BotaoPalco titulo="Aproximar" onClick={() => aplicarZoom(ZOOM_PASSO)} desabilitado={transformacao.escala >= ZOOM_MAX}>
            <Plus className="h-4 w-4" />
          </BotaoPalco>
          <BotaoPalco titulo="Enquadrar" onClick={reiniciar} desabilitado={transformacao.escala === 1}>
            <RotateCcw className="h-4 w-4" />
          </BotaoPalco>
          <BotaoPalco titulo={telaCheia ? 'Sair da tela cheia' : 'Tela cheia'} onClick={alternarTelaCheia}>
            {telaCheia ? <Shrink className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </BotaoPalco>
        </div>
      </div>
    </div>
  )
}

function BotaoPalco({
  children,
  titulo,
  onClick,
  desabilitado,
}: {
  children: React.ReactNode
  titulo: string
  onClick: () => void
  desabilitado?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desabilitado}
      title={titulo}
      aria-label={titulo}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}
