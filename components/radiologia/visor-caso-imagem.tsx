'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Contrast,
  Eye,
  EyeOff,
  Loader2,
  Maximize2,
  Minimize2,
  RotateCcw,
  Tag,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import type { ApontamentoCaso } from '@/lib/radiologia/casos-imagem'

/** Acúmulo de delta de roda para avançar um corte (~1 corte por clique). */
const RODA_POR_CORTE = 80
/** Pixels de arraste vertical por corte. */
const PX_POR_CORTE = 8

const CORES = ['#facc15', '#38bdf8', '#f472b6', '#4ade80', '#fb923c', '#a78bfa', '#f87171', '#2dd4bf', '#e879f9', '#a3e635']

export function corDoApontamento(indice: number): string {
  return CORES[indice % CORES.length]
}

export interface VisorCasoImagemProps {
  urls: string[]
  largura: number
  altura: number
  /** Apontamentos desta série. */
  apontamentos: ApontamentoCaso[]
  /** Número global (0-based) de cada apontamento no caso — cor e etiqueta. */
  numeracao: Record<string, number>
  /** Corte atual, 0-based (controlado). */
  corte: number
  onCorte: (corte: number) => void
  mostrarSetas: boolean
  onMostrarSetas: (valor: boolean) => void
  /** Apontamento em foco: as outras setas esmaecem e a ponta pulsa. */
  foco?: string | null
  rotuloSerie?: string
}

/**
 * Pilha de cortes — ou uma radiografia só — com as setas do autor redesenhadas.
 *
 * Cada seta do Radiopaedia guarda a ponta (x, y) em pixels da imagem original e
 * a rotação; o SVG usa o mesmo sistema de coordenadas, então a seta cai no
 * mesmo lugar em qualquer tamanho de tela e acompanha o zoom.
 *
 * Com uma imagem só, a roda e o arraste deixam de trocar corte: a roda volta a
 * rolar a página e o arraste move a imagem ampliada.
 */
export function VisorCasoImagem({
  urls,
  largura,
  altura,
  apontamentos,
  numeracao,
  corte,
  onCorte,
  mostrarSetas,
  onMostrarSetas,
  foco = null,
  rotuloSerie,
}: VisorCasoImagemProps) {
  const total = urls.length
  const pilha = total > 1
  const [carregados, setCarregados] = useState(0)
  const [brilho, setBrilho] = useState(100)
  const [contraste, setContraste] = useState(100)
  const [invertido, setInvertido] = useState(false)
  const [nomes, setNomes] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [telaCheia, setTelaCheia] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)
  const palco = useRef<HTMLDivElement>(null)
  const roda = useRef(0)
  const arraste = useRef<{ x0: number; y0: number; corte0: number; pan0: { x: number; y: number } } | null>(null)
  const corteRef = useRef(corte)
  corteRef.current = corte

  const irPara = useCallback((n: number) => onCorte(Math.max(0, Math.min(total - 1, Math.round(n)))), [onCorte, total])

  // Pré-carrega a pilha inteira: rolar só é fluido se o corte seguinte já chegou.
  useEffect(() => {
    let vivo = true
    let n = 0
    setCarregados(0)
    const imagens = urls.map((url) => {
      const img = new Image()
      img.onload = img.onerror = () => {
        n += 1
        if (vivo) setCarregados(n)
      }
      img.src = url
      return img
    })
    return () => {
      vivo = false
      imagens.forEach((img) => (img.onload = img.onerror = null))
    }
  }, [urls])

  // Trocar de série volta ao enquadramento inteiro.
  useEffect(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [urls])

  // A roda precisa de listener não passivo para não rolar a página junto.
  useEffect(() => {
    const no = palco.current
    if (!no || !pilha) return
    const aoRolar = (evento: WheelEvent) => {
      evento.preventDefault()
      roda.current += evento.deltaY
      const passos = Math.trunc(roda.current / RODA_POR_CORTE)
      if (passos !== 0) {
        roda.current -= passos * RODA_POR_CORTE
        onCorte(Math.max(0, Math.min(total - 1, corteRef.current + passos)))
      }
    }
    no.addEventListener('wheel', aoRolar, { passive: false })
    return () => no.removeEventListener('wheel', aoRolar)
  }, [onCorte, total, pilha])

  useEffect(() => {
    const aoMudar = () => setTelaCheia(document.fullscreenElement === raiz.current)
    document.addEventListener('fullscreenchange', aoMudar)
    return () => document.removeEventListener('fullscreenchange', aoMudar)
  }, [])

  const setasDoCorte = useMemo(() => {
    const lista: { a: ApontamentoCaso; n: number; x: number; y: number; rotacao: number }[] = []
    for (const a of apontamentos) {
      for (const p of a.pontos) if (p.corte === corte) lista.push({ a, n: numeracao[a.id] ?? 0, x: p.x, y: p.y, rotacao: p.rotacao })
    }
    return lista
  }, [apontamentos, corte, numeracao])

  const cortesComSeta = useMemo(() => {
    const mapa = new Map<number, string>()
    for (const a of apontamentos) for (const p of a.pontos) mapa.set(p.corte, corDoApontamento(numeracao[a.id] ?? 0))
    return mapa
  }, [apontamentos, numeracao])

  const escala = Math.max(largura, altura) / 512
  const comprimento = 46 * escala
  const ampliar = (fator: number) => {
    const novo = Math.max(1, Math.min(4, zoom * fator))
    setZoom(novo)
    if (novo === 1) setPan({ x: 0, y: 0 })
  }
  const alternarTelaCheia = () => {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else raiz.current?.requestFullscreen?.()
  }

  return (
    <div ref={raiz} className={`overflow-hidden rounded-2xl border border-slate-800 bg-black text-white shadow-xl ${telaCheia ? 'flex flex-col' : ''}`}>
      <div
        ref={palco}
        tabIndex={0}
        role="img"
        aria-label={
          pilha
            ? `Corte ${corte + 1} de ${total}. Role, arraste ou use as setas do teclado para percorrer a pilha.`
            : 'Radiografia. Use o zoom para ampliar e arraste para mover.'
        }
        className={`relative mx-auto w-full touch-none select-none overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
          zoom > 1 ? 'cursor-grab' : pilha ? 'cursor-ns-resize' : ''
        } ${telaCheia ? 'flex-1' : ''}`}
        style={telaCheia ? undefined : { aspectRatio: `${largura} / ${altura}`, maxHeight: '72vh' }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); irPara(corte - 1) }
          if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); irPara(corte + 1) }
          if (e.key.toLowerCase() === 'a') onMostrarSetas(!mostrarSetas)
          if (e.key === '+') ampliar(1.5)
          if (e.key === '-') ampliar(1 / 1.5)
        }}
        onPointerDown={(e) => {
          arraste.current = { x0: e.clientX, y0: e.clientY, corte0: corte, pan0: pan }
          ;(e.target as Element).setPointerCapture?.(e.pointerId)
        }}
        onPointerMove={(e) => {
          const a = arraste.current
          if (!a) return
          if (zoom > 1) {
            const caixa = palco.current?.getBoundingClientRect()
            const w = caixa?.width ?? 1
            const h = caixa?.height ?? 1
            setPan({ x: a.pan0.x + ((e.clientX - a.x0) / w) * 100, y: a.pan0.y + ((e.clientY - a.y0) / h) * 100 })
          } else if (pilha) {
            irPara(a.corte0 + (e.clientY - a.y0) / PX_POR_CORTE)
          }
        }}
        onPointerUp={() => (arraste.current = null)}
        onPointerCancel={() => (arraste.current = null)}
        onDoubleClick={() => (zoom > 1 ? (setZoom(1), setPan({ x: 0, y: 0 })) : setZoom(2))}
      >
        <div
          className="absolute inset-0 transition-transform duration-100"
          style={{ transform: `translate(${pan.x}%, ${pan.y}%) scale(${zoom})` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={urls[corte]}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full object-contain"
            style={{ filter: `brightness(${brilho}%) contrast(${contraste}%)${invertido ? ' invert(1)' : ''}` }}
          />
          {mostrarSetas && setasDoCorte.length > 0 && (
            <svg viewBox={`0 0 ${largura} ${altura}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
              {setasDoCorte.map(({ a, n, x, y, rotacao }, k) => {
                const cor = corDoApontamento(n)
                const emFoco = foco === a.id
                const apagada = foco && !emFoco
                // A seta do Radiopaedia aponta para a esquerda com rotação zero;
                // a cauda fica do lado oposto à ponta.
                const rad = (rotacao * Math.PI) / 180
                const cx = x + Math.cos(rad) * comprimento
                const cy = y + Math.sin(rad) * comprimento
                const cabeca = 13 * escala
                const ang = Math.atan2(y - cy, x - cx)
                const p1 = `${x - Math.cos(ang - 0.45) * cabeca},${y - Math.sin(ang - 0.45) * cabeca}`
                const p2 = `${x - Math.cos(ang + 0.45) * cabeca},${y - Math.sin(ang + 0.45) * cabeca}`
                // O nome vai do lado oposto à ponta; se não couber na imagem,
                // desce para baixo do número, alinhado para dentro.
                const larguraTexto = a.nome.length * 6.6 * escala
                const ladoDireito = cx >= x
                const cabeAoLado = ladoDireito ? cx + 13 * escala + larguraTexto <= largura - 4 : cx - 13 * escala - larguraTexto >= 4
                const tx = cabeAoLado
                  ? cx + (ladoDireito ? 13 : -13) * escala
                  : Math.max(4 + larguraTexto / 2, Math.min(largura - 4 - larguraTexto / 2, cx))
                const ty = cabeAoLado ? cy + 4 * escala : cy + (cy > altura - 30 * escala ? -16 : 24) * escala
                const ancora = cabeAoLado ? (ladoDireito ? 'start' : 'end') : 'middle'
                return (
                  <g key={`${a.id}-${k}`} opacity={apagada ? 0.22 : 1}>
                    {emFoco && (
                      <circle cx={x} cy={y} r={14 * escala} fill="none" stroke={cor} strokeWidth={2 * escala}>
                        <animate attributeName="r" values={`${10 * escala};${22 * escala};${10 * escala}`} dur="1.6s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="1;0.2;1" dur="1.6s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <line x1={cx} y1={cy} x2={x} y2={y} stroke="#000" strokeOpacity={0.6} strokeWidth={5 * escala} strokeLinecap="round" />
                    <line x1={cx} y1={cy} x2={x} y2={y} stroke={cor} strokeWidth={2.4 * escala} strokeLinecap="round" />
                    <polygon points={`${x},${y} ${p1} ${p2}`} fill={cor} stroke="#000" strokeOpacity={0.6} strokeWidth={1 * escala} />
                    <circle cx={cx} cy={cy} r={9 * escala} fill="#000" fillOpacity={0.75} stroke={cor} strokeWidth={1.6 * escala} />
                    <text x={cx} y={cy + 3.6 * escala} textAnchor="middle" fontSize={10.5 * escala} fontWeight={800} fill={cor}>
                      {n + 1}
                    </text>
                    {nomes && (
                      <text x={tx} y={ty} textAnchor={ancora} fontSize={12 * escala} fontWeight={700} fill="#fff" stroke="#000" strokeWidth={3.2 * escala} paintOrder="stroke">
                        {a.nome}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          )}
        </div>
        <div className="pointer-events-none absolute left-2 top-2 rounded bg-black/60 px-2 py-1 font-mono text-[11px] text-sky-100/80">
          {rotuloSerie ?? ''}
          {pilha ? `${rotuloSerie ? ' · ' : ''}${corte + 1}/${total}` : ''}
          {zoom > 1 ? ` · ${zoom.toFixed(1)}×` : ''}
        </div>
        {carregados < total && (
          <div className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1.5 rounded bg-black/60 px-2 py-1 text-[11px] text-sky-100/80">
            <Loader2 className="h-3 w-3 animate-spin" /> {Math.round((carregados / total) * 100)}%
          </div>
        )}
      </div>

      <div className="border-t border-white/10 px-3 pb-3 pt-2">
        {pilha && (
          <>
            {/* Régua: ticks coloridos nos cortes que têm seta. */}
            <div className="relative h-3">
              {[...cortesComSeta.entries()].map(([c, cor]) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Ir ao corte ${c + 1}`}
                  onClick={() => irPara(c)}
                  className="absolute top-0 h-3 w-1.5 -translate-x-1/2 rounded-sm"
                  style={{ left: `${(c / (total - 1)) * 100}%`, background: cor }}
                />
              ))}
            </div>
            <input type="range" min={0} max={total - 1} value={corte} onChange={(e) => irPara(Number(e.target.value))} aria-label="Corte" className="mt-1 w-full accent-sky-400" />
          </>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          {pilha && (
            <>
              <Botao onClick={() => irPara(corte - 1)} rotulo="Corte anterior"><ChevronUp className="h-4 w-4" /></Botao>
              <Botao onClick={() => irPara(corte + 1)} rotulo="Próximo corte"><ChevronDown className="h-4 w-4" /></Botao>
            </>
          )}
          <Botao onClick={() => onMostrarSetas(!mostrarSetas)} ativo={mostrarSetas} rotulo="Mostrar apontamentos (A)">
            {mostrarSetas ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            <span className="ml-1">Apontamentos</span>
          </Botao>
          <Botao onClick={() => setNomes(!nomes)} ativo={nomes} rotulo="Nomes sobre a imagem">
            <Tag className="h-4 w-4" />
            <span className="ml-1">Nomes</span>
          </Botao>
          <Botao onClick={() => ampliar(1.5)} rotulo="Ampliar (+)"><ZoomIn className="h-4 w-4" /></Botao>
          <Botao onClick={() => ampliar(1 / 1.5)} rotulo="Reduzir (−)"><ZoomOut className="h-4 w-4" /></Botao>
          <Botao onClick={() => setInvertido(!invertido)} ativo={invertido} rotulo="Inverter tons"><Contrast className="h-4 w-4" /></Botao>
          <Botao onClick={alternarTelaCheia} ativo={telaCheia} rotulo="Tela cheia">
            {telaCheia ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Botao>
          <label className="ml-auto inline-flex items-center gap-1 text-sky-100/60">
            Brilho
            <input type="range" min={50} max={170} value={brilho} onChange={(e) => setBrilho(Number(e.target.value))} className="w-16 accent-sky-400 sm:w-20" />
          </label>
          <label className="inline-flex items-center gap-1 text-sky-100/60">
            Contraste
            <input type="range" min={50} max={220} value={contraste} onChange={(e) => setContraste(Number(e.target.value))} className="w-16 accent-sky-400 sm:w-20" />
          </label>
          <Botao
            onClick={() => { setBrilho(100); setContraste(100); setInvertido(false); setZoom(1); setPan({ x: 0, y: 0 }) }}
            rotulo="Restaurar imagem"
          >
            <RotateCcw className="h-4 w-4" />
          </Botao>
        </div>
      </div>
    </div>
  )
}

function Botao({ children, onClick, rotulo, ativo }: { children: React.ReactNode; onClick: () => void; rotulo: string; ativo?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={rotulo}
      aria-label={rotulo}
      aria-pressed={ativo}
      className={`inline-flex h-8 items-center rounded-lg border px-2 font-semibold transition ${
        ativo ? 'border-sky-400/60 bg-sky-400/15 text-sky-200' : 'border-white/10 text-sky-100/70 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}
