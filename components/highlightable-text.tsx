'use client'

import { useState, useRef, useEffect } from 'react'
import { TextHighlight, HighlightColor, HighlightType } from '@/lib/types'
import { TextHighlightMenu } from './text-highlight-menu'
import { v4 as uuidv4 } from 'uuid'

interface HighlightableTextProps {
  text: string
  highlights: TextHighlight[]
  target: 'statement' | 'command'
  onHighlightsChange: (highlights: TextHighlight[]) => void
  className?: string
}

const HIGHLIGHT_COLOR_MAP: Record<HighlightColor, string> = {
  yellow: 'bg-yellow-300/60',
  green: 'bg-green-300/60',
  cyan: 'bg-cyan-300/60',
  magenta: 'bg-pink-300/60',
  red: 'bg-red-300/60',
  custom: '', // Será definido inline
}

interface MarkupSegment {
  start: number
  end: number
  highlights: TextHighlight[]
}

export function HighlightableText({
  text,
  highlights,
  target,
  onHighlightsChange,
  className = '',
}: HighlightableTextProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [selectedText, setSelectedText] = useState<string>('')
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null)
  const textRef = useRef<HTMLDivElement>(null)
  /*
   * De onde veio o último toque/clique. `contextmenu` é um MouseEvent e não
   * diz se nasceu de clique direito ou de toque longo — e os dois pedem
   * tratamentos opostos (ver `handleContextMenu`).
   */
  const ultimoPonteiro = useRef<string>('mouse')

  // Fechar menu ao pressionar ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null)
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  /*
   * No mouse, `contextmenu` é o clique direito e cancelá-lo é o certo. No
   * toque, ele É O TOQUE LONGO — o mesmo gesto com que o navegador seleciona a
   * palavra sob o dedo e mostra as alcinhas —, e cancelá-lo leva a seleção
   * nativa junto. Ver o comentário gêmeo em
   * components/manual-clinico/highlightable-rich-text.tsx.
   */
  const handleContextMenu = (e: React.MouseEvent) => {
    if (ultimoPonteiro.current === 'mouse') e.preventDefault()
    handleSelection(e.clientX, e.clientY)
  }

  const handleSelection = (clickX?: number, clickY?: number) => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !textRef.current) {
      return
    }

    const selectedText = selection.toString()
    // Evitar seleções muito curtas ou muito longas (provavelmente erro no mobile)
    if (selectedText.trim().length < 3 || selectedText.length > 1000) {
      return
    }

    // Se selecionou praticamente o texto todo, ignorar (provavelmente "Selecionar Tudo" por engano)
    if (selectedText.length >= text.length - 2) {
      return
    }

    // Calcular offsets relativos ao texto completo
    try {
      const range = selection.getRangeAt(0)

      // Verificar se a seleção está RIGOROSAMENTE dentro do nosso container
      if (!textRef.current.contains(range.startContainer) || !textRef.current.contains(range.endContainer)) {
        return
      }

      const preSelectionRange = range.cloneRange()
      preSelectionRange.selectNodeContents(textRef.current)
      preSelectionRange.setEnd(range.startContainer, range.startOffset)
      const start = preSelectionRange.toString().length
      const end = start + selectedText.length

      setSelectedText(selectedText)
      setSelectionRange({ start, end })

      // Posicionamento inteligente
      let x = clickX
      let y = clickY

      const rects = range.getClientRects()
      const firstRect = rects[0]
      const lastRect = rects[rects.length - 1]

      if (firstRect) {
        x = firstRect.left + firstRect.width / 2
        y = firstRect.top - 10
      }

      // Ajustes para não sair da tela
      const menuWidth = 220
      const menuHeight = 280

      x = (x || window.innerWidth / 2) - (menuWidth / 2)
      x = Math.max(10, Math.min(x, window.innerWidth - menuWidth - 10))

      y = (y || 100)
      if (y < 60 && lastRect) {
        y = lastRect.bottom + 10
      } else {
        y = y - menuHeight
      }

      y = Math.max(10, Math.min(y, window.innerHeight - menuHeight - 10))

      setContextMenu({ x, y })
    } catch (err) {
      // Ignorar erros na seleção
    }
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    ultimoPonteiro.current = e.pointerType || 'mouse'
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    // Pequeno delay para garantir que o Selection API atualizou
    const isTouch = e.pointerType === 'touch'
    setTimeout(() => handleSelection(e.clientX, e.clientY), isTouch ? 150 : 20)
  }

  const handleCopy = () => {
    if (selectedText) {
      navigator.clipboard.writeText(selectedText)
    }
  }

  const handleHighlight = (color: HighlightColor, customColor?: string) => {
    if (!selectionRange) return

    const newHighlight: TextHighlight = {
      id: uuidv4(),
      text: selectedText,
      startOffset: selectionRange.start,
      endOffset: selectionRange.end,
      type: 'highlight',
      color,
      customColor,
      target,
    }

    // Filtrar apenas highlights do tipo 'highlight' que sobrepõem
    // Permite múltiplos estilos (bold, underline, etc) coexistirem
    const filteredHighlights = highlights.filter((h) => {
      if (h.target !== target) return true
      if (h.type !== 'highlight') return true // Manter outros tipos
      // Remover apenas highlights que sobrepõem
      return h.endOffset <= selectionRange.start || h.startOffset >= selectionRange.end
    })

    onHighlightsChange([...filteredHighlights, newHighlight])

    // Limpar seleção
    window.getSelection()?.removeAllRanges()
  }

  const handleApplyStyle = (styleType: HighlightType) => {
    if (!selectionRange) return

    const newHighlight: TextHighlight = {
      id: uuidv4(),
      text: selectedText,
      startOffset: selectionRange.start,
      endOffset: selectionRange.end,
      type: styleType,
      target,
    }

    // Filtrar apenas marcações do mesmo tipo que sobrepõem
    // Isso permite ter highlight + bold + underline no mesmo texto
    const filteredHighlights = highlights.filter((h) => {
      if (h.target !== target) return true
      if (h.type !== styleType) return true // Manter outros tipos
      // Remover apenas do mesmo tipo que sobrepõem
      return h.endOffset <= selectionRange.start || h.startOffset >= selectionRange.end
    })

    onHighlightsChange([...filteredHighlights, newHighlight])

    // Limpar seleção
    window.getSelection()?.removeAllRanges()
  }

  const handleRemoveHighlight = () => {
    if (!selectionRange) return

    // Remover highlights que estão dentro ou sobrepõem a seleção atual
    const filteredHighlights = highlights.filter((h) => {
      if (h.target !== target) return true
      // Remover se houver qualquer sobreposição com a seleção
      const hasOverlap = !(h.endOffset <= selectionRange.start || h.startOffset >= selectionRange.end)
      return !hasOverlap
    })

    onHighlightsChange(filteredHighlights)

    // Limpar seleção
    window.getSelection()?.removeAllRanges()
  }

  // Renderizar texto com highlights aplicados
  const renderHighlightedText = () => {
    // Filtrar highlights deste target
    const targetHighlights = highlights.filter((h) => h.target === target)

    if (targetHighlights.length === 0) {
      return <span>{text}</span>
    }

    // Criar pontos de quebra para todos os highlights
    const breakpoints = new Set<number>([0, text.length])
    targetHighlights.forEach((h) => {
      breakpoints.add(h.startOffset)
      breakpoints.add(h.endOffset)
    })
    const sortedBreakpoints = Array.from(breakpoints).sort((a, b) => a - b)

    // Criar segmentos
    const segments: MarkupSegment[] = []
    for (let i = 0; i < sortedBreakpoints.length - 1; i++) {
      const start = sortedBreakpoints[i]
      const end = sortedBreakpoints[i + 1]

      // Encontrar todos os highlights que afetam este segmento
      const activeHighlights = targetHighlights.filter(
        (h) => h.startOffset <= start && h.endOffset >= end
      )

      segments.push({ start, end, highlights: activeHighlights })
    }

    // Renderizar segmentos
    return (
      <>
        {segments.map((segment, idx) => {
          const segmentText = text.slice(segment.start, segment.end)

          if (segment.highlights.length === 0) {
            return <span key={idx}>{segmentText}</span>
          }

          // Aplicar estilos acumulados
          let content: React.ReactNode = segmentText
          let className = ''
          let style: React.CSSProperties = {}

          segment.highlights.forEach((h) => {
            if (h.type === 'highlight') {
              if (h.color === 'custom' && h.customColor) {
                style.backgroundColor = h.customColor + '99'
              } else if (h.color) {
                className += ' ' + HIGHLIGHT_COLOR_MAP[h.color]
              }
            } else if (h.type === 'bold') {
              style.fontWeight = 'bold'
            } else if (h.type === 'underline') {
              style.textDecoration = (style.textDecoration || '') + ' underline'
            } else if (h.type === 'strikethrough') {
              style.textDecoration = (style.textDecoration || '') + ' line-through'
            }
          })

          return (
            <span
              key={idx}
              className={className.trim()}
              style={Object.keys(style).length > 0 ? style : undefined}
            >
              {content}
            </span>
          )
        })}
      </>
    )
  }

  return (
    <>
      <div
        ref={textRef}
        onContextMenu={handleContextMenu}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className={`select-text whitespace-pre-line ${className}`}
        style={{ userSelect: 'text' }}
      >
        {renderHighlightedText()}
      </div>

      {contextMenu && (
        <TextHighlightMenu
          position={contextMenu}
          onHighlight={handleHighlight}
          onApplyStyle={handleApplyStyle}
          onRemoveHighlight={handleRemoveHighlight}
          onCopy={handleCopy}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  )
}
