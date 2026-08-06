'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Contrast,
  Keyboard,
  ChevronUp,
  ChevronDown,
  Loader2,
  MousePointer2,
  Move,
  Gauge,
  SunMedium,
  X,
} from 'lucide-react'
import { JANELAS, JANELA_POR_ID } from './tema'
import type { JanelaId } from '@/lib/tomografia/tipos'
import { useSerie } from './use-serie'

/** Quantos cortes ficam montados de cada lado do atual. */
const JANELA_MONTAGEM = 4
/** Pixels de arraste vertical para avançar um corte. */
const PX_POR_CORTE = 7
/** Acúmulo de delta de roda necessário para avançar um corte. Calibrado para
 *  que um "clique" de roda comum (~100 de delta) ande cerca de um corte. */
const RODA_POR_CORTE = 90

export interface MarcaCorte {
  corte: number
  cor: string
  rotulo: string
}

export interface VisualizadorProps {
  /** URLs dos cortes, na ordem da série. */
  urls: string[]
  /** Corte atual, 1-indexado (controlado pelo pai). */
  corte: number
  onCorteChange: (corte: number) => void
  /**
   * Janela em que a série JÁ foi reconstruída pelo aparelho. Serve só para
   * informar quem está estudando — o visualizador abre sempre em "Original",
   * porque aplicar o preset correspondente por cima de uma imagem que já saiu
   * naquela janela estoura o brilho e ensina o contrário do que se pretende.
   */
  janelaNativa?: JanelaId
  /** Ticks coloridos na régua — cortes onde a estrutura selecionada aparece. */
  marcas?: MarcaCorte[]
  /** Rótulo do que está destacado agora (aparece no canto da imagem). */
  destaque?: string | null
  orientacao?: 'cranio-caudal' | 'caudo-cranial'
  /** Texto curto identificando a série (canto superior esquerdo). */
  serie?: string
  className?: string
}

function clamp(v: number, min: number, max: number) {
  return v < min ? min : v > max ? max : v
}

export function VisualizadorTC({
  urls,
  corte,
  onCorteChange,
  janelaNativa,
  marcas = [],
  destaque = null,
  orientacao = 'cranio-caudal',
  serie,
  className = '',
}: VisualizadorProps) {
  const total = urls.length
  const indice = clamp(corte, 1, Math.max(1, total)) - 1
  const estado = useSerie(urls, indice)

  const [janela, setJanela] = useState<JanelaId>('padrao')
  const [brilho, setBrilho] = useState(100)
  const [contraste, setContraste] = useState(100)
  const [invertido, setInvertido] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [tocando, setTocando] = useState(false)
  const [fps, setFps] = useState(12)
  const [telaCheia, setTelaCheia] = useState(false)
  const [mostrarAtalhos, setMostrarAtalhos] = useState(false)
  const [mostrarAjustes, setMostrarAjustes] = useState(false)
  const [modoArraste, setModoArraste] = useState<'cortes' | 'pan'>('cortes')
  const [dica, setDica] = useState(true)

  const containerRef = useRef<HTMLDivElement>(null)
  const palcoRef = useRef<HTMLDivElement>(null)
  const acumuladoRoda = useRef(0)
  const arraste = useRef<{
    ativo: boolean
    modo: 'cortes' | 'pan'
    y0: number
    x0: number
    corte0: number
    pan0: { x: number; y: number }
    moveu: boolean
  } | null>(null)
  const pinca = useRef<{ dist: number; zoom0: number } | null>(null)

  const irPara = useCallback(
    (n: number) => {
      onCorteChange(clamp(Math.round(n), 1, Math.max(1, total)))
    },
    [onCorteChange, total],
  )

  const avancar = useCallback(
    (passo: number) => {
      onCorteChange((() => {
        const alvo = indice + 1 + passo
        // Cine dá a volta; navegação manual encosta nas pontas.
        return clamp(alvo, 1, Math.max(1, total))
      })())
    },
    [indice, onCorteChange, total],
  )

  const resetar = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setBrilho(100)
    setContraste(100)
    setInvertido(false)
    setJanela('padrao')
  }, [])

  // ── Cine ──
  useEffect(() => {
    if (!tocando || total < 2) return
    const id = window.setInterval(() => {
      onCorteChange(((indiceRef.current + 1) % total) + 1)
    }, Math.max(30, 1000 / fps))
    return () => window.clearInterval(id)
  }, [tocando, fps, total, onCorteChange])

  const indiceRef = useRef(indice)
  indiceRef.current = indice

  // ── Roda do mouse / trackpad ──
  // `passive: false` só é possível com listener manual: o React registra os
  // handlers de wheel como passivos e o preventDefault seria ignorado, fazendo
  // a página inteira rolar junto com os cortes.
  useEffect(() => {
    const el = palcoRef.current
    if (!el) return
    function aoRolar(e: WheelEvent) {
      if (e.ctrlKey) {
        // Pinça de trackpad → zoom, como em qualquer estação de trabalho.
        e.preventDefault()
        setZoom((z) => clamp(z * (e.deltaY > 0 ? 0.92 : 1.08), 1, 6))
        return
      }
      e.preventDefault()
      acumuladoRoda.current += e.deltaY
      const passos = Math.trunc(acumuladoRoda.current / RODA_POR_CORTE)
      if (passos !== 0) {
        acumuladoRoda.current -= passos * RODA_POR_CORTE
        setTocando(false)
        setDica(false)
        avancar(passos)
      }
    }
    el.addEventListener('wheel', aoRolar, { passive: false })
    return () => el.removeEventListener('wheel', aoRolar)
  }, [avancar])

  // ── Teclado ──
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement | null
      if (alvo && /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName)) return
      const dentro = containerRef.current?.contains(document.activeElement) || telaCheia
      const teclasGlobais = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']
      if (!dentro && teclasGlobais.includes(e.key)) return

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault(); setTocando(false); avancar(-1); break
        case 'ArrowDown':
          e.preventDefault(); setTocando(false); avancar(1); break
        case 'PageUp':
          e.preventDefault(); setTocando(false); avancar(-10); break
        case 'PageDown':
          e.preventDefault(); setTocando(false); avancar(10); break
        case 'Home':
          e.preventDefault(); irPara(1); break
        case 'End':
          e.preventDefault(); irPara(total); break
        case ' ':
          e.preventDefault(); setTocando((v) => !v); break
        case '+': case '=':
          setZoom((z) => clamp(z * 1.2, 1, 6)); break
        case '-': case '_':
          setZoom((z) => clamp(z / 1.2, 1, 6)); break
        case 'i': case 'I':
          setInvertido((v) => !v); break
        case 'r': case 'R':
          resetar(); break
        case 'f': case 'F':
          setTelaCheia((v) => !v); break
        case 'Escape':
          if (telaCheia) { e.preventDefault(); setTelaCheia(false) }
          break
        default:
          if (/^[1-7]$/.test(e.key)) {
            const p = JANELAS[Number(e.key) - 1]
            if (p) setJanela(p.id)
          }
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [avancar, irPara, resetar, total, telaCheia])

  // Trava o scroll do body em tela cheia (sem isso o fundo rola atrás).
  useEffect(() => {
    if (!telaCheia) return
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = anterior }
  }, [telaCheia])

  // ── Ponteiro (mouse + toque unificados) ──
  function aoDescer(e: React.PointerEvent) {
    if (e.pointerType === 'touch' && e.isPrimary === false) return
    const alvo = e.currentTarget as HTMLElement
    alvo.setPointerCapture?.(e.pointerId)
    const modo = e.button === 2 || e.shiftKey || modoArraste === 'pan' || zoom > 1.02 ? 'pan' : 'cortes'
    arraste.current = {
      ativo: true,
      modo: modoArraste === 'pan' ? 'pan' : modo,
      y0: e.clientY,
      x0: e.clientX,
      corte0: indice + 1,
      pan0: { ...pan },
      moveu: false,
    }
    setTocando(false)
  }

  function aoMover(e: React.PointerEvent) {
    const a = arraste.current
    if (!a?.ativo) return
    const dy = e.clientY - a.y0
    const dx = e.clientX - a.x0
    if (Math.abs(dy) > 3 || Math.abs(dx) > 3) a.moveu = true
    if (a.modo === 'pan') {
      setPan({ x: a.pan0.x + dx, y: a.pan0.y + dy })
    } else {
      if (a.moveu) setDica(false)
      irPara(a.corte0 + dy / PX_POR_CORTE)
    }
  }

  function aoSubir(e: React.PointerEvent) {
    const alvo = e.currentTarget as HTMLElement
    alvo.releasePointerCapture?.(e.pointerId)
    arraste.current = null
    pinca.current = null
  }

  // Pinça de dois dedos: zoom no celular/tablet.
  function aoTocarMover(e: React.TouchEvent) {
    if (e.touches.length !== 2) return
    const [a, b] = [e.touches[0], e.touches[1]]
    const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
    if (!pinca.current) {
      pinca.current = { dist, zoom0: zoom }
      return
    }
    arraste.current = null
    setZoom(clamp(pinca.current.zoom0 * (dist / pinca.current.dist), 1, 6))
  }

  const preset = JANELA_POR_ID[janela] || JANELA_POR_ID.padrao
  const filtro = useMemo(() => {
    const partes: string[] = []
    if (preset.filtro !== 'none') partes.push(preset.filtro)
    if (brilho !== 100) partes.push(`brightness(${brilho / 100})`)
    if (contraste !== 100) partes.push(`contrast(${contraste / 100})`)
    if (invertido) partes.push('invert(1)')
    return partes.length ? partes.join(' ') : 'none'
  }, [preset, brilho, contraste, invertido])

  const marcasPorCorte = useMemo(() => {
    const m = new Map<number, MarcaCorte>()
    marcas.forEach((mk) => m.set(mk.corte, mk))
    return m
  }, [marcas])

  const montados = useMemo(() => {
    const lista: number[] = []
    for (let i = indice - JANELA_MONTAGEM; i <= indice + JANELA_MONTAGEM; i++) {
      if (i >= 0 && i < total) lista.push(i)
    }
    return lista
  }, [indice, total])

  const rotuloPosicao = orientacao === 'cranio-caudal'
    ? indice < total / 3 ? 'Cranial' : indice > (2 * total) / 3 ? 'Caudal' : 'Médio'
    : indice < total / 3 ? 'Caudal' : indice > (2 * total) / 3 ? 'Cranial' : 'Médio'

  const corpo = (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`group/visor relative flex flex-col overflow-hidden rounded-2xl border border-border bg-black outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
        telaCheia ? 'h-full w-full rounded-none border-0' : ''
      } ${className}`}
    >
      {/* ══ Palco da imagem ══ */}
      <div
        ref={palcoRef}
        onPointerDown={aoDescer}
        onPointerMove={aoMover}
        onPointerUp={aoSubir}
        onPointerCancel={aoSubir}
        onTouchMove={aoTocarMover}
        onTouchEnd={() => { pinca.current = null }}
        onDoubleClick={() => setZoom((z) => (z > 1.02 ? 1 : 2))}
        onContextMenu={(e) => e.preventDefault()}
        className={`relative flex-1 select-none overflow-hidden bg-black ${
          telaCheia ? 'min-h-0' : 'aspect-[4/3] sm:aspect-[16/11]'
        } ${arraste.current?.modo === 'pan' || modoArraste === 'pan' ? 'cursor-grab' : 'cursor-ns-resize'}`}
        style={{ touchAction: 'none' }}
        role="img"
        aria-label={`Corte ${indice + 1} de ${total}${destaque ? ` — ${destaque}` : ''}`}
      >
        <div
          className="absolute inset-0 origin-center transition-transform duration-75 will-change-transform"
          style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})` }}
        >
          {montados.map((i) => (
            <img
              key={urls[i]}
              src={urls[i]}
              alt=""
              draggable={false}
              decoding="async"
              onLoad={() => estado.marcarPronto(i)}
              className="pointer-events-none absolute inset-0 h-full w-full object-contain"
              style={{
                opacity: i === indice ? 1 : 0,
                filter: filtro,
                // Sem transição: em TC, o corte tem de trocar seco. Fade dá a
                // impressão falsa de estruturas "aparecendo" gradualmente.
              }}
            />
          ))}
        </div>

        {/* Carregando o corte atual */}
        {!estado.atualPronto && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-white/40" />
          </div>
        )}

        {/* HUD — estilo estação de trabalho */}
        <div className="pointer-events-none absolute inset-0 p-2.5 font-mono text-[10px] leading-tight text-emerald-300/80 sm:p-3 sm:text-[11px]">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              {serie && <p className="max-w-[42vw] truncate font-bold uppercase tracking-wider">{serie}</p>}
              <p>Corte {String(indice + 1).padStart(2, '0')} / {total}</p>
              <p className="text-emerald-300/50">{rotuloPosicao}</p>
            </div>
            <div className="space-y-0.5 text-right">
              <p>{preset.ww > 0 ? `WW ${preset.ww} · WL ${preset.wl}` : 'como adquirido'}</p>
              <p className="text-emerald-300/50">Zoom {zoom.toFixed(1)}×</p>
              {invertido && <p className="text-amber-300/80">INVERTIDO</p>}
            </div>
          </div>
        </div>

        {/* Estrutura em destaque */}
        {destaque && (
          <div className="pointer-events-none absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3 sm:left-3 sm:right-3">
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-black/70 px-2.5 py-1.5 text-[11px] font-bold text-emerald-200 backdrop-blur-sm sm:text-xs">
              <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-emerald-400" />
              <span className="truncate">{destaque}</span>
            </span>
          </div>
        )}

        {/* Dica inicial — some no primeiro gesto */}
        {dica && estado.atualPronto && (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center gap-1.5 text-center">
            <div className="animate-bounce rounded-full border border-white/15 bg-black/60 p-2 backdrop-blur-sm">
              <ChevronUp className="h-4 w-4 text-white/70" />
            </div>
            <p className="rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-semibold text-white/80 backdrop-blur-sm">
              Role ou arraste para percorrer os cortes
            </p>
            <div className="animate-bounce rounded-full border border-white/15 bg-black/60 p-2 backdrop-blur-sm">
              <ChevronDown className="h-4 w-4 text-white/70" />
            </div>
          </div>
        )}

        {/* Barra de carregamento da série */}
        {estado.progresso < 1 && (
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10">
            <div
              className="h-full bg-emerald-400/70 transition-[width] duration-300"
              style={{ width: `${Math.round(estado.progresso * 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* ══ Régua de cortes ══ */}
      <div className="relative border-t border-white/10 bg-neutral-950 px-3 pb-1 pt-3">
        <div className="relative">
          {/* Ticks das marcas (cortes onde a estrutura aparece) */}
          {total > 1 && marcas.length > 0 && (
            <div className="pointer-events-none absolute inset-x-0 -top-1.5 h-2">
              {marcas.map((m) => (
                <span
                  key={`${m.corte}-${m.rotulo}`}
                  title={`${m.rotulo} — corte ${m.corte}`}
                  className="absolute top-0 h-2 w-[3px] -translate-x-1/2 rounded-full"
                  style={{ left: `${((m.corte - 1) / (total - 1)) * 100}%`, background: m.cor }}
                />
              ))}
            </div>
          )}
          <input
            type="range"
            min={1}
            max={Math.max(1, total)}
            value={indice + 1}
            onChange={(e) => { setTocando(false); irPara(Number(e.target.value)) }}
            aria-label="Navegar entre os cortes"
            className="tc-range h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-emerald-400"
          />
        </div>

        {/* Controles */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5 pb-1">
          <button
            onClick={() => setTocando((v) => !v)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/10 px-2.5 text-[11px] font-bold text-white transition hover:bg-white/20"
            aria-label={tocando ? 'Pausar cine' : 'Reproduzir cine'}
          >
            {tocando ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Cine</span>
          </button>

          <div className="inline-flex h-8 items-center gap-1 rounded-lg bg-white/5 px-2">
            <Gauge className="h-3 w-3 text-white/40" />
            <input
              type="range"
              min={2}
              max={30}
              value={fps}
              onChange={(e) => setFps(Number(e.target.value))}
              aria-label="Velocidade do cine"
              className="tc-range h-1 w-14 cursor-pointer appearance-none rounded-full bg-white/15 accent-emerald-400 sm:w-20"
            />
            <span className="w-9 font-mono text-[10px] text-white/50">{fps}fps</span>
          </div>

          <div className="inline-flex h-8 overflow-hidden rounded-lg bg-white/10">
            <button onClick={() => { setTocando(false); avancar(-1) }} className="px-2 text-white/80 transition hover:bg-white/15" aria-label="Corte anterior">
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => { setTocando(false); avancar(1) }} className="px-2 text-white/80 transition hover:bg-white/15" aria-label="Próximo corte">
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>

          <span className="mx-0.5 hidden h-5 w-px bg-white/10 sm:inline-block" />

          <button
            onClick={() => setModoArraste((m) => (m === 'cortes' ? 'pan' : 'cortes'))}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold transition ${
              modoArraste === 'pan' ? 'bg-emerald-400 text-neutral-900' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title="Alternar o que o arraste faz: percorrer cortes ou mover a imagem"
          >
            {modoArraste === 'pan' ? <Move className="h-3.5 w-3.5" /> : <MousePointer2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{modoArraste === 'pan' ? 'Mover' : 'Cortes'}</span>
          </button>

          <div className="inline-flex h-8 overflow-hidden rounded-lg bg-white/10">
            <button onClick={() => setZoom((z) => clamp(z / 1.25, 1, 6))} className="px-2 text-white/80 transition hover:bg-white/15" aria-label="Diminuir zoom">
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setZoom((z) => clamp(z * 1.25, 1, 6))} className="px-2 text-white/80 transition hover:bg-white/15" aria-label="Aumentar zoom">
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={() => setMostrarAjustes((v) => !v)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold transition ${
              mostrarAjustes ? 'bg-emerald-400 text-neutral-900' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Contrast className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Janela</span>
          </button>

          <button onClick={resetar} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/10 px-2.5 text-[11px] font-bold text-white transition hover:bg-white/20" aria-label="Restaurar visualização">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setMostrarAtalhos(true)}
              className="hidden h-8 items-center gap-1.5 rounded-lg bg-white/10 px-2.5 text-[11px] font-bold text-white transition hover:bg-white/20 lg:inline-flex"
            >
              <Keyboard className="h-3.5 w-3.5" /> Atalhos
            </button>
            <button
              onClick={() => setTelaCheia((v) => !v)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/10 px-2.5 text-[11px] font-bold text-white transition hover:bg-white/20"
              aria-label={telaCheia ? 'Sair da tela cheia' : 'Tela cheia'}
            >
              {telaCheia ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Painel de janela */}
        {mostrarAjustes && (
          <div className="mb-2 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-white/40">Presets de janela</p>
            <div className="flex flex-wrap gap-1.5">
              {JANELAS.map((j, i) => (
                <button
                  key={j.id}
                  onClick={() => setJanela(j.id)}
                  title={`${j.descricao} — ${j.uso}`}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                    janela === j.id ? 'bg-emerald-400 text-neutral-900' : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  <span className="mr-1 font-mono text-[9px] opacity-50">{i + 1}</span>
                  {j.nome}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-white/50">{preset.uso}</p>

            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">
                  <SunMedium className="h-3 w-3" /> Brilho {brilho}%
                </span>
                <input
                  type="range" min={40} max={200} value={brilho}
                  onChange={(e) => setBrilho(Number(e.target.value))}
                  className="tc-range h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-emerald-400"
                />
              </label>
              <label className="block">
                <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">
                  <Contrast className="h-3 w-3" /> Contraste {contraste}%
                </span>
                <input
                  type="range" min={40} max={260} value={contraste}
                  onChange={(e) => setContraste(Number(e.target.value))}
                  className="tc-range h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-emerald-400"
                />
              </label>
            </div>
            <button
              onClick={() => setInvertido((v) => !v)}
              className={`mt-2.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                invertido ? 'bg-amber-400 text-neutral-900' : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              Inverter escala de cinza
            </button>
            <p className="mt-2.5 border-t border-white/10 pt-2 text-[10px] leading-relaxed text-white/35">
              {janelaNativa && janelaNativa !== 'padrao' ? (
                <>
                  Esta série já saiu do aparelho reconstruída em janela{' '}
                  <strong className="font-bold text-white/60">{JANELA_POR_ID[janelaNativa].nome}</strong>, que é
                  a de leitura para esta região. Por isso o visualizador abre em &ldquo;Original&rdquo;: os presets
                  acima simulam o efeito de trocar de janela sobre a imagem já renderizada, e os valores em UH
                  não são recalculáveis a partir dela.{' '}
                </>
              ) : (
                <>
                  Estes cortes já vieram renderizados do exame, então a janela é reproduzida por brilho e
                  contraste — o efeito visual é o mesmo, mas os valores em UH não são recalculáveis a partir da
                  imagem final.
                </>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Atalhos */}
      {mostrarAtalhos && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="max-w-md rounded-2xl border border-white/15 bg-neutral-900 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-heading text-base font-bold text-white">Atalhos do visualizador</h4>
              <button onClick={() => setMostrarAtalhos(false)} className="rounded-lg p-1 text-white/60 hover:bg-white/10" aria-label="Fechar">
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-xs text-white/70">
              {[
                ['Roda / arraste ↕', 'Percorrer os cortes'],
                ['↑ ↓', 'Um corte por vez'],
                ['PgUp / PgDn', 'Dez cortes'],
                ['Home / End', 'Primeiro / último corte'],
                ['Espaço', 'Play/pause do cine'],
                ['Ctrl + roda · pinça', 'Zoom'],
                ['+ / −', 'Zoom'],
                ['Shift + arraste', 'Mover a imagem'],
                ['Duplo clique', 'Zoom 2× / voltar'],
                ['1 a 7', 'Trocar de janela'],
                ['I', 'Inverter a escala de cinza'],
                ['R', 'Restaurar tudo'],
                ['F', 'Tela cheia'],
              ].map(([k, v]) => (
                <React.Fragment key={k}>
                  <dt className="whitespace-nowrap rounded bg-white/10 px-1.5 py-0.5 text-center font-mono text-[10px] text-white/90">{k}</dt>
                  <dd className="self-center">{v}</dd>
                </React.Fragment>
              ))}
            </dl>
          </div>
        </div>
      )}
    </div>
  )

  if (telaCheia) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-black p-0">
        {corpo}
      </div>
    )
  }
  return corpo
}
