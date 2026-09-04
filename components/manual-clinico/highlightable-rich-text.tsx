'use client'

import { useState, useRef, useEffect, useCallback, Fragment } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { v4 as uuidv4 } from 'uuid'
import { TextHighlightMenu } from '@/components/text-highlight-menu'
import { type ManualHighlight } from '@/lib/manual-clinico-highlights'
import { type HighlightColor, type HighlightType } from '@/lib/types'
import { RichTextRenderer, tokenizeLine } from '@/components/manual-clinico/rich-text-renderer'

// ── Inline token parser (re-exported from RichTextRenderer) ──────
interface Token {
  type: 'text' | 'bold' | 'italic' | 'link'
  content: string
  href?: string
}

const EMBED_REGEX = /^!(video|audio|image)\[([^\]]*)\]\(([^)]+)\)\s*$/

// ── Highlight color CSS classes ───────────────────────────────────
const HL_COLOR: Record<HighlightColor, string> = {
  yellow: 'bg-yellow-300/60',
  green: 'bg-green-300/60',
  cyan: 'bg-cyan-300/60',
  magenta: 'bg-pink-300/60',
  red: 'bg-red-300/60',
  custom: '',
}

// ── Render a single text segment with accumulated styles ──────────
function renderSegment(
  key: string,
  text: string,
  tokenType: Token['type'],
  href: string | undefined,
  activeHighlights: ManualHighlight[],
): React.ReactNode {
  let cls = ''
  const sty: React.CSSProperties = {}

  for (const h of activeHighlights) {
    if (h.type === 'highlight') {
      if (h.color === 'custom' && h.customColor) {
        sty.backgroundColor = h.customColor + '99'
      } else if (h.color) {
        cls += ' ' + HL_COLOR[h.color]
      }
    } else if (h.type === 'bold') {
      sty.fontWeight = 'bold'
    } else if (h.type === 'underline') {
      sty.textDecoration = ((sty.textDecoration as string) || '') + ' underline'
    } else if (h.type === 'strikethrough') {
      sty.textDecoration = ((sty.textDecoration as string) || '') + ' line-through'
    }
  }

  const hasStyle = activeHighlights.length > 0
  const inner = hasStyle
    ? <span key={`${key}-hl`} className={cls.trim() || undefined} style={Object.keys(sty).length > 0 ? sty : undefined}>{text}</span>
    : <>{text}</>

  switch (tokenType) {
    case 'bold':
      return <strong key={key} className="font-bold text-foreground">{inner}</strong>
    case 'italic':
      return <em key={key} className="italic text-foreground/80">{inner}</em>
    case 'link': {
      const isInternal = href?.startsWith('/') || href?.startsWith('#')
      const linkCls = 'text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/40 hover:decoration-primary/70 font-medium transition-colors'
      if (isInternal) return <Link key={key} href={href!} className={linkCls}>{inner}</Link>
      return <a key={key} href={href} target="_blank" rel="noopener noreferrer" className={linkCls}>{inner}</a>
    }
    default:
      return <Fragment key={key}>{inner}</Fragment>
  }
}

// ── Core render: rich text + highlights ──────────────────────────
function renderHighlighted(rawText: string, highlights: ManualHighlight[]): React.ReactNode {
  if (!rawText) return null
  const paragraphs = rawText.split(/\n\s*\n/)
  let pos = 0
  const nodes: React.ReactNode[] = []

  paragraphs.forEach((paragraph, pIdx) => {
    const trimmed = paragraph.trim()
    if (!trimmed) return
    const lines = trimmed.split('\n')
    const lineNodes: React.ReactNode[] = []

    lines.forEach((line, lineIdx) => {
      // Check if this line is an embed — render via RichTextRenderer (no highlighting)
      if (EMBED_REGEX.test(line.trim())) {
        // Flush accumulated inline nodes as a paragraph first
        if (lineNodes.length > 0) {
          nodes.push(<p key={`${pIdx}-pre-${lineIdx}`}>{[...lineNodes]}</p>)
          lineNodes.length = 0
        }
        nodes.push(
          <RichTextRenderer key={`embed-${pIdx}-${lineIdx}`} text={line.trim()} />
        )
        return
      }

      if (lineIdx > 0 && lineNodes.length > 0) lineNodes.push(<br key={`br-${pIdx}-${lineIdx}`} />)

      tokenizeLine(line).forEach((token, tIdx) => {
        const tokenStart = pos
        const tokenEnd = pos + token.content.length
        const overlapping = highlights.filter(h => h.startOffset < tokenEnd && h.endOffset > tokenStart)

        if (overlapping.length === 0) {
          lineNodes.push(renderSegment(`${pIdx}-${lineIdx}-${tIdx}`, token.content, token.type, token.href, []))
        } else {
          const bps = new Set<number>([tokenStart, tokenEnd])
          overlapping.forEach(h => {
            if (h.startOffset > tokenStart && h.startOffset < tokenEnd) bps.add(h.startOffset)
            if (h.endOffset > tokenStart && h.endOffset < tokenEnd) bps.add(h.endOffset)
          })
          const sorted = Array.from(bps).sort((a, b) => a - b)
          sorted.forEach((bp, bpIdx) => {
            if (bpIdx === sorted.length - 1) return
            const segStart = sorted[bpIdx]
            const segEnd = sorted[bpIdx + 1]
            const segText = token.content.slice(segStart - tokenStart, segEnd - tokenStart)
            const active = overlapping.filter(h => h.startOffset <= segStart && h.endOffset >= segEnd)
            lineNodes.push(renderSegment(`${pIdx}-${lineIdx}-${tIdx}-${bpIdx}`, segText, token.type, token.href, active))
          })
        }

        pos = tokenEnd
      })
    })

    if (lineNodes.length > 0) {
      nodes.push(<p key={pIdx}>{lineNodes}</p>)
    }
  })

  return <div className="space-y-4">{nodes}</div>
}

// ── Component ─────────────────────────────────────────────────────
interface HighlightableRichTextProps {
  text: string
  highlights: ManualHighlight[]
  onHighlightsChange: (highlights: ManualHighlight[]) => void
  className?: string
}

export function HighlightableRichText({
  text,
  highlights,
  onHighlightsChange,
  className = '',
}: HighlightableRichTextProps) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [selText, setSelText] = useState('')
  const [selRange, setSelRange] = useState<{ start: number; end: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  /*
   * De onde veio o último toque/clique.
   *
   * `contextmenu` é um MouseEvent e não diz se nasceu de um clique direito ou
   * de um toque longo — e os dois pedem tratamentos opostos (ver
   * `handleContextMenu`). O tipo de ponteiro só existe no evento anterior.
   */
  const ultimoPonteiro = useRef<string>('mouse')

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null) }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [])

  const detectSelection = useCallback((clickX?: number, clickY?: number) => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !containerRef.current) return
    const txt = sel.toString()
    if (txt.trim().length < 2 || txt.length > 1000) return

    try {
      const range = sel.getRangeAt(0)
      if (
        !containerRef.current.contains(range.startContainer) ||
        !containerRef.current.contains(range.endContainer)
      ) return

      const preRange = range.cloneRange()
      preRange.selectNodeContents(containerRef.current)
      preRange.setEnd(range.startContainer, range.startOffset)
      const start = preRange.toString().length
      const end = start + txt.length

      setSelText(txt)
      setSelRange({ start, end })

      // Position menu above selection (use viewport coords for fixed positioning)
      const rects = range.getClientRects()
      const first = rects[0]
      const last = rects[rects.length - 1]
      const menuW = 220
      const menuH = 300

      // Center horizontally on the midpoint between first and last rects
      const midX = first
        ? (first.left + (last || first).right) / 2
        : (clickX ?? window.innerWidth / 2)
      let x = midX - menuW / 2
      let y = first ? first.top - menuH - 10 : (clickY ?? 200) - menuH

      // Clamp X within viewport
      x = Math.max(8, Math.min(x, window.innerWidth - menuW - 8))

      // If above viewport, flip below selection
      if (y < 8) {
        y = (last || first)?.bottom ? (last || first).bottom + 10 : (clickY ?? 200) + 10
      }

      // Clamp Y within viewport
      y = Math.max(8, Math.min(y, window.innerHeight - menuH - 8))
      setMenu({ x, y })
    } catch {}
  }, [])

  /*
   * O menu também acompanha a seleção que muda SEM passar por nós.
   *
   * No celular, esticar a seleção é arrastar as alcinhas — que são interface
   * do navegador, não elementos da página: o `pointerup` desse arrasto nunca
   * chega ao nosso container, e por isso o menu ficava preso ao recorte da
   * palavra inicial. `selectionchange` é o único aviso que existe.
   *
   * A espera de 350ms é o que separa "terminou de ajustar" de "está no meio do
   * arrasto": sem ela o menu saltaria a cada pixel de alcinha arrastada.
   */
  useEffect(() => {
    let espera: ReturnType<typeof setTimeout>
    const aoMudarSelecao = () => {
      clearTimeout(espera)
      espera = setTimeout(() => detectSelection(), 350)
    }
    document.addEventListener('selectionchange', aoMudarSelecao)
    return () => {
      document.removeEventListener('selectionchange', aoMudarSelecao)
      clearTimeout(espera)
    }
  }, [detectSelection])

  const handlePointerDown = (e: React.PointerEvent) => {
    ultimoPonteiro.current = e.pointerType || 'mouse'
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    const touch = e.pointerType === 'touch'
    setTimeout(() => detectSelection(e.clientX, e.clientY), touch ? 150 : 20)
  }

  /*
   * No mouse, `contextmenu` é o clique direito e cancelá-lo é o certo: quem
   * manda no menu aqui somos nós.
   *
   * No toque, `contextmenu` É O TOQUE LONGO — o mesmo gesto com que o
   * navegador seleciona a palavra sob o dedo e mostra as alcinhas. Cancelá-lo
   * cancela a seleção nativa junto, e o que sobra é o comportamento sem
   * granularidade: em vez da palavra tocada, o navegador acaba pegando o bloco
   * inteiro. Por isso o `preventDefault` só vale para ponteiro de mouse.
   */
  const handleContextMenu = (e: React.MouseEvent) => {
    if (ultimoPonteiro.current === 'mouse') e.preventDefault()
    detectSelection(e.clientX, e.clientY)
  }

  /**
   * Fecha o menu. `limparSelecao` só é verdadeiro depois de a seleção ter
   * CUMPRIDO o papel dela (uma marcação aplicada ou removida): apagá-la quando
   * a pessoa apenas tocou fora desfaria, sem pedir, o trecho que ela acabou de
   * escolher a dedo — que é justamente o gesto mais caro no celular.
   */
  const closeMenu = (limparSelecao = false) => {
    setMenu(null)
    if (limparSelecao) window.getSelection()?.removeAllRanges()
  }

  const applyHighlight = (type: HighlightType, color?: HighlightColor, customColor?: string) => {
    if (!selRange) return
    const newH: ManualHighlight = {
      id: uuidv4(),
      startOffset: selRange.start,
      endOffset: selRange.end,
      type,
      color,
      customColor,
    }
    // Remove overlapping marks of same type
    const filtered = highlights.filter(h => {
      if (h.type !== type) return true
      return h.endOffset <= selRange.start || h.startOffset >= selRange.end
    })
    onHighlightsChange([...filtered, newH])
    closeMenu(true)
  }

  const removeHighlight = () => {
    if (!selRange) return
    const filtered = highlights.filter(h =>
      h.endOffset <= selRange.start || h.startOffset >= selRange.end
    )
    onHighlightsChange(filtered)
    closeMenu(true)
  }

  const handleCopy = () => {
    if (selText) navigator.clipboard.writeText(selText)
  }

  return (
    <>
      <div
        ref={containerRef}
        onContextMenu={handleContextMenu}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className={`select-text text-[15px] leading-[1.8] text-foreground/90 selection:bg-primary/20 ${className}`}
        style={{ userSelect: 'text' }}
      >
        {renderHighlighted(text, highlights)}
      </div>

      {menu && createPortal(
        <TextHighlightMenu
          position={menu}
          onHighlight={(color, customColor) => applyHighlight('highlight', color, customColor)}
          onApplyStyle={(type) => applyHighlight(type)}
          onRemoveHighlight={removeHighlight}
          onCopy={handleCopy}
          onClose={() => closeMenu()}
        />,
        document.body
      )}
    </>
  )
}
