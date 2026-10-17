'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowUpRight, Eraser, Highlighter, PenLine, Trash2, Undo2, X } from 'lucide-react'
import { arredondar, CORES_DE_ANOTACAO, PONTOS_POR_MENSAGEM, type CorDeAnotacao, type Ferramenta, type MensagemDeAnotacao, type Traco } from '@/lib/monitorias/sala/tela-anotada'
import { cn } from '@/lib/utils'

/** Onde a imagem da tela de fato aparece dentro do `<video>` com `object-contain` (faixas pretas fora). */
function retanguloDoVideo(v: HTMLVideoElement): { x: number; y: number; w: number; h: number } {
  const cw = v.clientWidth
  const ch = v.clientHeight
  const vw = v.videoWidth || cw
  const vh = v.videoHeight || ch
  const escala = Math.min(cw / vw, ch / vh) || 1
  const w = vw * escala
  const h = vh * escala
  return { x: (cw - w) / 2, y: (ch - h) / 2, w, h }
}

function desenharTraco(ctx: CanvasRenderingContext2D, t: Pick<Traco, 'ferramenta' | 'cor' | 'pontos'>, w: number, h: number): void {
  const p = t.pontos
  if (p.length < 2) return
  const base = Math.max(2, w / 420)
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = t.cor
  ctx.fillStyle = t.cor
  if (t.ferramenta === 'marca') {
    ctx.globalAlpha = 0.35
    ctx.lineWidth = base * 6
  } else {
    ctx.lineWidth = base
    ctx.shadowColor = 'rgba(0,0,0,0.35)'
    ctx.shadowBlur = base
  }
  if (t.ferramenta === 'seta') {
    const x0 = p[0] * w
    const y0 = p[1] * h
    const x1 = p[p.length - 2] * w
    const y1 = p[p.length - 1] * h
    const ang = Math.atan2(y1 - y0, x1 - x0)
    const cabeca = base * 5
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x1 - cabeca * Math.cos(ang - 0.45), y1 - cabeca * Math.sin(ang - 0.45))
    ctx.lineTo(x1 - cabeca * Math.cos(ang + 0.45), y1 - cabeca * Math.sin(ang + 0.45))
    ctx.closePath()
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.moveTo(p[0] * w, p[1] * h)
    if (p.length === 2) ctx.lineTo(p[0] * w + 0.1, p[1] * h + 0.1)
    for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i] * w, p[i + 1] * h)
    ctx.stroke()
  }
  ctx.restore()
}

let contadorDeTraco = 0
const novoId = () => `${Date.now().toString(36)}${(++contadorDeTraco).toString(36)}`.slice(-24)

/**
 * A camada de desenho por cima de um `<video>` de tela compartilhada. Desenha
 * os traços de todos; com `desenhando`, o toque/mouse risca e cada pedaço do
 * traço sai em lotes de 50 ms (`aoAnotar`). Funciona também dentro da janela
 * flutuante (usa o `window` do próprio documento).
 */
export function CamadaDeAnotacao({
  alvo,
  tracos,
  desenhando,
  ferramenta,
  cor,
  aoAnotar,
}: {
  /** O elemento que contém o `<video>` da tela (a camada se alinha à imagem dele). */
  alvo: HTMLElement | null
  tracos: Traco[]
  desenhando: boolean
  ferramenta: Ferramenta
  cor: CorDeAnotacao
  aoAnotar: (m: MensagemDeAnotacao) => void
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [ret, setRet] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const atual = useRef<{ id: string; pontos: number[]; enviados: number; timer: number | null } | null>(null)

  // Acompanha o tamanho do vídeo (zoom, girar o celular, a tela que muda de tamanho).
  useLayoutEffect(() => {
    const video = alvo?.querySelector('video')
    if (!alvo || !video) return setRet(null)
    const janela = (alvo.ownerDocument.defaultView || window) as Window & typeof globalThis
    const medir = () => setRet(retanguloDoVideo(video))
    medir()
    const obs = new janela.ResizeObserver(medir)
    obs.observe(video)
    video.addEventListener('loadedmetadata', medir)
    video.addEventListener('resize', medir)
    return () => {
      obs.disconnect()
      video.removeEventListener('loadedmetadata', medir)
      video.removeEventListener('resize', medir)
    }
  }, [alvo])

  const redesenhar = useCallback(() => {
    const c = canvas.current
    if (!c || !ret) return
    const dpr = (c.ownerDocument.defaultView || window).devicePixelRatio || 1
    const w = Math.round(ret.w * dpr)
    const h = Math.round(ret.h * dpr)
    if (c.width !== w || c.height !== h) Object.assign(c, { width: w, height: h })
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, w, h)
    for (const t of tracos) desenharTraco(ctx, t, w, h)
    const a = atual.current
    if (a) desenharTraco(ctx, { ferramenta, cor, pontos: a.pontos }, w, h)
  }, [tracos, ret, ferramenta, cor])
  useEffect(() => redesenhar(), [redesenhar])

  const ponto = (ev: React.PointerEvent): [number, number] => {
    const r = canvas.current!.getBoundingClientRect()
    return [arredondar((ev.clientX - r.left) / r.width), arredondar((ev.clientY - r.top) / r.height)]
  }

  const enviar = (fim: boolean) => {
    const a = atual.current
    if (!a) return
    const janela = canvas.current?.ownerDocument.defaultView || window
    if (a.timer !== null) janela.clearTimeout(a.timer)
    a.timer = null
    if (ferramenta === 'seta') {
      if (fim && a.pontos.length >= 4) aoAnotar({ t: 'anotacao', op: 'traco', id: a.id, ferramenta, cor, pontos: [a.pontos[0], a.pontos[1], a.pontos[a.pontos.length - 2], a.pontos[a.pontos.length - 1]], fim: true })
      return
    }
    // Em pedaços que cabem numa mensagem; o último fecha o traço.
    while (a.enviados < a.pontos.length || fim) {
      const pedaco = a.pontos.slice(a.enviados, a.enviados + PONTOS_POR_MENSAGEM * 2)
      a.enviados += pedaco.length
      const acabou = fim && a.enviados >= a.pontos.length
      if (pedaco.length || acabou) aoAnotar({ t: 'anotacao', op: 'traco', id: a.id, ferramenta, cor, pontos: pedaco, fim: acabou })
      if (acabou || !pedaco.length) break
    }
  }

  const aoDescer = (ev: React.PointerEvent) => {
    if (!desenhando) return
    ev.preventDefault()
    ;(ev.target as HTMLElement).setPointerCapture?.(ev.pointerId)
    atual.current = { id: novoId(), pontos: ponto(ev), enviados: 0, timer: null }
    redesenhar()
  }
  const aoMover = (ev: React.PointerEvent) => {
    const a = atual.current
    if (!a) return
    const [x, y] = ponto(ev)
    const n = a.pontos.length
    // Passo mínimo: menos pontos, mesmo traço.
    if (n >= 2 && Math.abs(a.pontos[n - 2] - x) + Math.abs(a.pontos[n - 1] - y) < 0.002) return
    a.pontos.push(x, y)
    redesenhar()
    const janela = canvas.current?.ownerDocument.defaultView || window
    if (a.timer === null && ferramenta !== 'seta') a.timer = janela.setTimeout(() => enviar(false), 50)
  }
  const aoSubir = () => {
    if (!atual.current) return
    enviar(true)
    atual.current = null
  }

  if (!ret) return null
  return (
    <canvas
      ref={canvas}
      className={cn('absolute z-[3]', desenhando ? 'cursor-crosshair touch-none' : 'pointer-events-none')}
      style={{ left: ret.x, top: ret.y, width: ret.w, height: ret.h }}
      onPointerDown={aoDescer}
      onPointerMove={aoMover}
      onPointerUp={aoSubir}
      onPointerCancel={aoSubir}
      aria-label={desenhando ? 'Área de anotação: desenhe sobre a tela compartilhada' : undefined}
      aria-hidden={!desenhando}
    />
  )
}

/** Ferramentas de anotação: caneta, marca-texto, seta, cores, desfazer, limpar. Vidro escuro. */
export function FerramentasDeAnotacao({
  ferramenta,
  cor,
  aoFerramenta,
  aoCor,
  aoDesfazer,
  aoLimpar,
  aoFechar,
  compacta = false,
}: {
  ferramenta: Ferramenta
  cor: CorDeAnotacao
  aoFerramenta: (f: Ferramenta) => void
  aoCor: (c: CorDeAnotacao) => void
  aoDesfazer: () => void
  aoLimpar: () => void
  aoFechar?: () => void
  compacta?: boolean
}) {
  const botao = (ativo: boolean) =>
    cn('inline-flex touch-manipulation items-center justify-center rounded-lg transition-colors', compacta ? 'h-8 w-8' : 'h-9 w-9', ativo ? 'bg-white text-neutral-900' : 'text-white/85 hover:bg-white/15')
  const FERRAMENTAS: Array<{ id: Ferramenta; icone: typeof PenLine; rotulo: string }> = [
    { id: 'caneta', icone: PenLine, rotulo: 'Caneta' },
    { id: 'marca', icone: Highlighter, rotulo: 'Marca-texto' },
    { id: 'seta', icone: ArrowUpRight, rotulo: 'Seta' },
  ]
  return (
    <div
      className="flex flex-wrap items-center gap-1 rounded-2xl border border-white/15 bg-neutral-900/70 p-1.5 text-white shadow-2xl backdrop-blur-xl"
      role="toolbar"
      aria-label="Ferramentas de anotação"
    >
      {FERRAMENTAS.map(({ id, icone: Icone, rotulo }) => (
        <button key={id} type="button" className={botao(ferramenta === id)} aria-pressed={ferramenta === id} aria-label={rotulo} title={rotulo} onClick={() => aoFerramenta(id)}>
          <Icone className="h-4 w-4" />
        </button>
      ))}
      <span className="mx-0.5 h-6 w-px bg-white/15" aria-hidden />
      {CORES_DE_ANOTACAO.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => aoCor(c)}
          aria-label={`Cor ${c}`}
          aria-pressed={cor === c}
          className={cn('rounded-full border border-white/30 transition-transform', compacta ? 'h-5 w-5' : 'h-6 w-6', cor === c ? 'scale-110 ring-2 ring-white ring-offset-1 ring-offset-neutral-900' : 'hover:scale-110')}
          style={{ background: c }}
        />
      ))}
      <span className="mx-0.5 h-6 w-px bg-white/15" aria-hidden />
      <button type="button" className={botao(false)} onClick={aoDesfazer} aria-label="Desfazer meu último traço" title="Desfazer">
        <Undo2 className="h-4 w-4" />
      </button>
      <button type="button" className={botao(false)} onClick={aoLimpar} aria-label="Limpar anotações" title="Limpar">
        {compacta ? <Eraser className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
      </button>
      {aoFechar && (
        <button type="button" className={botao(false)} onClick={aoFechar} aria-label="Parar de anotar" title="Parar de anotar">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

/**
 * O estado de quem anota (ferramenta, cor, os próprios traços para desfazer),
 * compartilhado entre a sala e a janela flutuante.
 */
export function useAnotador(meuPid: string | null, tracos: Traco[], anotar: (m: MensagemDeAnotacao) => void) {
  const [ferramenta, setFerramenta] = useState<Ferramenta>('caneta')
  const [cor, setCor] = useState<CorDeAnotacao>('#ef4444')
  const desfazer = useCallback(() => {
    const meu = [...tracos].reverse().find((t) => t.de === meuPid)
    if (meu) anotar({ t: 'anotacao', op: 'apagar', id: meu.id })
  }, [tracos, meuPid, anotar])
  const limpar = useCallback(() => anotar({ t: 'anotacao', op: 'limpar' }), [anotar])
  return { ferramenta, setFerramenta, cor, setCor, desfazer, limpar }
}
