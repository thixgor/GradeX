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

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()

    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !textRef.current) {
      return
    }

    const selectedText = selection.toString()
    if (!selectedText.trim()) {
      return
    }

    // Calcular offsets relativos ao texto completo
    const range = selection.getRangeAt(0)
    const preSelectionRange = range.cloneRange()
    preSelectionRange.selectNodeContents(textRef.current)
    preSelectionRange.setEnd(range.startContainer, range.startOffset)
    const start = preSelectionRange.toString().length
    const end = start + selectedText.length

    setSelectedText(selectedText)
    setSelectionRange({ start, end })
    setContextMenu({ x: e.clientX, y: e.clientY })
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
        className={`select-text ${className}`}
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
