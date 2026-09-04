'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Check, PenLine, RotateCcw, Undo2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * A assinatura da prova.
 *
 * ## O que estava quebrado
 *
 * 1. **Tinta preta sobre papel preto.** O canvas era `bg-white dark:bg-gray-900`
 *    e a caneta, `#000000` fixo. No tema escuro a pessoa assinava e não via
 *    nada — assinatura invisível, botão de iniciar destravando do mesmo jeito
 *    (porque `isEmpty` virava falso), e uma imagem preta-sobre-preto indo para
 *    o relatório.
 * 2. **Tamanho medido uma vez só.** O canvas se dimensionava no `useEffect` de
 *    montagem, por `getBoundingClientRect()`. Montado dentro de algo ainda sem
 *    layout — ou o celular girado depois —, o buffer ficava com o tamanho
 *    errado e o traço saía deslocado do dedo.
 * 3. **Um toque não é um traço.** `isEmpty` só caía no `move`: um ponto, um
 *    pingo, uma assinatura curta de caneta que encosta e sai não contavam.
 * 4. **Sem desfazer.** Errou o traço, perdeu a assinatura inteira.
 *
 * ## As decisões
 *
 * **O papel é sempre claro, nos dois temas.** Não é descuido de tema escuro: a
 * imagem gerada aqui é colada no PDF do relatório, que é branco, e numa folha
 * A4 impressa. Uma assinatura de tinta clara — coerente com o tema escuro da
 * tela — desapareceria justamente onde ela vale alguma coisa. O que muda no
 * escuro é a moldura, não a folha.
 *
 * **Ponteiros, não mouse + touch.** `PointerEvent` cobre mouse, dedo e caneta
 * na mesma API, e traz `pressure`: com uma S Pen ou Apple Pencil o traço
 * engrossa conforme a pressão, como caneta de verdade. Dedo e mouse relatam
 * pressão constante e caem na espessura fixa de sempre.
 *
 * **Os traços ficam guardados como pontos**, não só como pixels. É o que
 * permite desfazer o último traço e redesenhar tudo quando o canvas muda de
 * tamanho (girar o celular deixava o traço esticado).
 */

interface SignaturePadProps {
  onSignatureChange: (signature: string) => void
  label?: string
  /** Assinatura já existente (retomada de prova) — desenhada ao montar. */
  valorInicial?: string
  disabled?: boolean
  className?: string
}

type Ponto = { x: number; y: number; pressao: number }
type Traco = Ponto[]

const COR_DA_TINTA = '#16233a'
const COR_DO_PAPEL = '#ffffff'
const ESPESSURA_BASE = 2.2

export function SignaturePad({
  onSignatureChange,
  label = 'Assinatura *',
  valorInicial,
  disabled = false,
  className,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tracosRef = useRef<Traco[]>([])
  const tracoAtualRef = useRef<Traco | null>(null)
  const ponteiroAtivoRef = useRef<number | null>(null)
  // A imagem de uma assinatura anterior (retomada): fica no fundo, abaixo dos
  // traços novos, e é reaplicada em todo redesenho.
  const fundoRef = useRef<HTMLImageElement | null>(null)

  const [temTraco, setTemTraco] = useState(false)
  const [desenhando, setDesenhando] = useState(false)
  // A contagem vive no estado, não só no ref: é ela que habilita "Desfazer", e
  // um ref não reagenda render — o botão ficaria desabilitado até algum outro
  // estado mudar por acaso.
  const [tracos, setTracos] = useState(0)

  /** Redesenha tudo do zero: papel, fundo herdado e cada traço guardado. */
  const redesenhar = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const largura = canvas.width / (window.devicePixelRatio || 1)
    const altura = canvas.height / (window.devicePixelRatio || 1)

    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()

    ctx.fillStyle = COR_DO_PAPEL
    ctx.fillRect(0, 0, largura, altura)

    if (fundoRef.current) {
      try {
        ctx.drawImage(fundoRef.current, 0, 0, largura, altura)
      } catch {
        // Imagem herdada inválida: o papel em branco é um estado melhor do que
        // um canvas quebrado.
      }
    }

    ctx.strokeStyle = COR_DA_TINTA
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    for (const traco of tracosRef.current) {
      if (traco.length === 0) continue

      if (traco.length === 1) {
        // Um toque só — o pingo do "i", o ponto final. Vira um círculo, porque
        // um `lineTo` de um ponto para ele mesmo não pinta nada.
        const ponto = traco[0]
        ctx.beginPath()
        ctx.fillStyle = COR_DA_TINTA
        ctx.arc(ponto.x, ponto.y, (ESPESSURA_BASE * ponto.pressao) / 2, 0, Math.PI * 2)
        ctx.fill()
        continue
      }

      // Curvas quadráticas entre os pontos médios: é o que tira o serrilhado de
      // um `lineTo` puro, sem precisar de biblioteca.
      for (let i = 1; i < traco.length; i++) {
        const anterior = traco[i - 1]
        const atual = traco[i]
        ctx.beginPath()
        ctx.lineWidth = ESPESSURA_BASE * ((anterior.pressao + atual.pressao) / 2)
        ctx.moveTo(anterior.x, anterior.y)
        const meioX = (anterior.x + atual.x) / 2
        const meioY = (anterior.y + atual.y) / 2
        ctx.quadraticCurveTo(anterior.x, anterior.y, meioX, meioY)
        ctx.lineTo(atual.x, atual.y)
        ctx.stroke()
      }
    }
  }, [])

  /** Ajusta o buffer ao tamanho real na tela e à densidade do display. */
  const dimensionar = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    const dpr = window.devicePixelRatio || 1
    const larguraNova = Math.round(rect.width * dpr)
    const alturaNova = Math.round(rect.height * dpr)
    if (canvas.width === larguraNova && canvas.height === alturaNova) return

    canvas.width = larguraNova
    canvas.height = alturaNova
    const ctx = canvas.getContext('2d')
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
    redesenhar()
  }, [redesenhar])

  useEffect(() => {
    dimensionar()
    const container = containerRef.current
    if (!container || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', dimensionar)
      return () => window.removeEventListener('resize', dimensionar)
    }
    // ResizeObserver e não `resize`: o canvas pode nascer com largura zero
    // dentro de um contêiner que só ganha layout depois (uma aba, um modal), e
    // o `resize` da janela nunca dispara nesse caso.
    const observador = new ResizeObserver(dimensionar)
    observador.observe(container)
    return () => observador.disconnect()
  }, [dimensionar])

  // Assinatura herdada de uma retomada: entra como fundo e conta como traço.
  useEffect(() => {
    if (!valorInicial || !valorInicial.startsWith('data:image/')) return
    const imagem = new Image()
    imagem.onload = () => {
      fundoRef.current = imagem
      setTemTraco(true)
      redesenhar()
    }
    imagem.src = valorInicial
  }, [valorInicial, redesenhar])

  function pontoDoEvento(e: React.PointerEvent<HTMLCanvasElement>): Ponto {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      // Mouse e dedo relatam 0.5 (ou 0) constante; só a caneta varia de verdade.
      pressao: e.pointerType === 'pen' && e.pressure > 0 ? 0.4 + e.pressure * 1.2 : 1,
    }
  }

  function publicar() {
    const canvas = canvasRef.current
    if (!canvas) return
    onSignatureChange(tracosRef.current.length > 0 || fundoRef.current ? canvas.toDataURL('image/png') : '')
  }

  function comecar(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return
    // Um dedo por vez: o segundo toque durante um traço (a mão apoiada na tela)
    // criava um traço paralelo atravessando a assinatura.
    if (ponteiroAtivoRef.current !== null) return

    ponteiroAtivoRef.current = e.pointerId
    e.currentTarget.setPointerCapture(e.pointerId)
    tracoAtualRef.current = [pontoDoEvento(e)]
    tracosRef.current.push(tracoAtualRef.current)
    setTracos(tracosRef.current.length)
    setDesenhando(true)
    // O ponto entra já como traço: uma assinatura de um toque só é assinatura.
    setTemTraco(true)
    redesenhar()
  }

  function mover(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled || ponteiroAtivoRef.current !== e.pointerId || !tracoAtualRef.current) return
    tracoAtualRef.current.push(pontoDoEvento(e))
    redesenhar()
  }

  function terminar(e: React.PointerEvent<HTMLCanvasElement>) {
    if (ponteiroAtivoRef.current !== e.pointerId) return
    ponteiroAtivoRef.current = null
    tracoAtualRef.current = null
    setDesenhando(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // O ponteiro pode já ter sido liberado pelo navegador (saiu da tela).
    }
    publicar()
  }

  function desfazer() {
    if (tracosRef.current.length === 0) return
    tracosRef.current.pop()
    setTracos(tracosRef.current.length)
    const vazio = tracosRef.current.length === 0 && !fundoRef.current
    setTemTraco(!vazio)
    redesenhar()
    publicar()
  }

  function limpar() {
    tracosRef.current = []
    tracoAtualRef.current = null
    fundoRef.current = null
    setTracos(0)
    setTemTraco(false)
    redesenhar()
    onSignatureChange('')
  }

  return (
    <div className={cn('space-y-2.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label className="flex items-center gap-2 text-sm">
          <PenLine className="h-3.5 w-3.5 text-muted-foreground" />
          {label}
          {temTraco && (
            <span className="assinatura-selo inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <Check className="h-3 w-3" />
              Assinado
            </span>
          )}
        </Label>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={desfazer}
            disabled={disabled || tracos === 0}
            className="h-8 rounded-lg px-2 text-xs"
          >
            <Undo2 className="mr-1 h-3.5 w-3.5" />
            Desfazer
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={limpar}
            disabled={disabled || !temTraco}
            className="h-8 rounded-lg px-2 text-xs"
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Limpar
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={cn(
          'assinatura-papel relative h-36 overflow-hidden rounded-2xl border-2 transition-colors duration-300',
          desenhando
            ? 'border-emerald-500/70 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]'
            : temTraco
              ? 'border-emerald-500/35'
              : 'border-dashed border-border',
          disabled && 'pointer-events-none opacity-60',
        )}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={comecar}
          onPointerMove={mover}
          onPointerUp={terminar}
          onPointerCancel={terminar}
          onPointerLeave={terminar}
          aria-label="Área de assinatura. Use o mouse, o dedo ou a caneta para assinar."
          role="img"
          className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
          style={{ touchAction: 'none' }}
        />

        {/* Pauta e chamada: some assim que a pessoa encosta a caneta. */}
        <div
          className={cn(
            'pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-5 transition-opacity duration-500',
            temTraco ? 'opacity-0' : 'opacity-100',
          )}
        >
          <div className="assinatura-pauta mb-2 h-px w-3/5 bg-slate-300" />
          <p className="text-xs font-medium text-slate-400">Assine aqui, como na identidade</p>
        </div>
      </div>

      <p className="text-[11px] leading-snug text-muted-foreground">
        Mouse, dedo ou caneta. Com caneta ativa, a espessura acompanha a pressão. A assinatura precisa
        corresponder à sua identidade.
      </p>
    </div>
  )
}
