'use client'

import { useState } from 'react'
import { Copy, Highlighter, Eraser, Strikethrough, Bold, Underline } from 'lucide-react'
import { HighlightColor, HighlightType } from '@/lib/types'

interface TextHighlightMenuProps {
  position: { x: number; y: number }
  onHighlight: (color: HighlightColor, customColor?: string) => void
  onApplyStyle: (type: HighlightType) => void
  onRemoveHighlight: () => void
  onCopy: () => void
  onClose: () => void
}

const HIGHLIGHT_COLORS: { color: HighlightColor; label: string; bgClass: string }[] = [
  { color: 'yellow', label: 'Amarelo', bgClass: 'bg-yellow-300' },
  { color: 'green', label: 'Verde', bgClass: 'bg-green-300' },
  { color: 'cyan', label: 'Ciano', bgClass: 'bg-cyan-300' },
  { color: 'magenta', label: 'Magenta', bgClass: 'bg-pink-300' },
  { color: 'red', label: 'Vermelho', bgClass: 'bg-red-300' },
]

export function TextHighlightMenu({ position, onHighlight, onApplyStyle, onRemoveHighlight, onCopy, onClose }: TextHighlightMenuProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [customColor, setCustomColor] = useState('#ffff00')

  return (
    <>
      {/* Overlay para fechar ao clicar fora */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Menu principal */}
      <div
        className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <div className="p-1 min-w-[200px]">
          {/* Botão Copiar */}
          <button
            onClick={() => {
              onCopy()
              onClose()
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <Copy className="h-4 w-4" />
            <span>Copiar</span>
          </button>

          {/* Separador */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

          {/* Grifar - Mostrar cores direto no menu se aberto */}
          <div className="space-y-1">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <div className="flex items-center gap-2">
                <Highlighter className="h-4 w-4" />
                <span>Grifar</span>
              </div>
              <span className="text-xs text-gray-400">{showColorPicker ? '▼' : '▶'}</span>
            </button>

            {showColorPicker && (
              <div className="px-2 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-md mx-1 border border-gray-100 dark:border-gray-800">
                <div className="grid grid-cols-5 gap-2 mb-2">
                  {HIGHLIGHT_COLORS.map(({ color, label, bgClass }) => (
                    <button
                      key={color}
                      onClick={() => {
                        onHighlight(color)
                        onClose()
                      }}
                      title={label}
                      className={`w-8 h-8 rounded-full ${bgClass} border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform flex-shrink-0`}
                    />
                  ))}
                </div>

                {/* Cor personalizada inline */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="w-6 h-6 rounded-full cursor-pointer border-none p-0 bg-transparent"
                    />
                    <button
                      onClick={() => {
                        onHighlight('custom', customColor)
                        onClose()
                      }}
                      className="flex-1 px-2 py-1 text-[10px] bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors uppercase font-bold"
                    >
                      Cor Personalizada
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Separador */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

          {/* Negritar */}
          <button
            onClick={() => {
              onApplyStyle('bold')
              onClose()
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <Bold className="h-4 w-4" />
            <span>Negritar</span>
          </button>

          {/* Sublinhar */}
          <button
            onClick={() => {
              onApplyStyle('underline')
              onClose()
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <Underline className="h-4 w-4" />
            <span>Sublinhar</span>
          </button>

          {/* Riscar */}
          <button
            onClick={() => {
              onApplyStyle('strikethrough')
              onClose()
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <Strikethrough className="h-4 w-4" />
            <span>Riscar</span>
          </button>

          {/* Separador */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

          {/* Botão Remover Marcação */}
          <button
            onClick={() => {
              onRemoveHighlight()
              onClose()
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <Eraser className="h-4 w-4" />
            <span>Remover marcação</span>
          </button>
        </div>
      </div>
    </>
  )
}
