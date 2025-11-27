'use client'

import { useState, useRef, useEffect } from 'react'
import { TextHighlight, HighlightColor } from '@/lib/types'
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
      color,
      customColor,
      target,
    }

    // Filtrar highlights que sobrepõem completamente o novo (para permitir sobrescrever)
    const filteredHighlights = highlights.filter((h) => {
      if (h.target !== target) return true
      // Manter se não houver sobreposição
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

    // Ordenar por posição
    const sortedHighlights = [...targetHighlights].sort((a, b) => a.startOffset - b.startOffset)

    const segments: React.ReactNode[] = []
    let currentPos = 0

    sortedHighlights.forEach((highlight, idx) => {
      // Texto antes do highlight
      if (currentPos < highlight.startOffset) {
        segments.push(
          <span key={`text-${idx}`}>{text.slice(currentPos, highlight.startOffset)}</span>
        )
      }

      // Texto destacado
      const bgColor =
        highlight.color === 'custom' && highlight.customColor
          ? highlight.customColor
          : HIGHLIGHT_COLOR_MAP[highlight.color]

      segments.push(
        <mark
          key={`highlight-${highlight.id}`}
          className={highlight.color !== 'custom' ? bgColor : ''}
          style={
            highlight.color === 'custom' && highlight.customColor
              ? { backgroundColor: highlight.customColor + '99' } // Adiciona transparência
              : undefined
          }
        >
          {text.slice(highlight.startOffset, highlight.endOffset)}
        </mark>
      )

      currentPos = highlight.endOffset
    })

    // Texto restante
    if (currentPos < text.length) {
      segments.push(<span key="text-end">{text.slice(currentPos)}</span>)
    }

    return <>{segments}</>
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
          onRemoveHighlight={handleRemoveHighlight}
          onCopy={handleCopy}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  )
}
