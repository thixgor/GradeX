'use client'

import { useState } from 'react'
import { Copy, Highlighter, Eraser } from 'lucide-react'
import { HighlightColor } from '@/lib/types'

interface TextHighlightMenuProps {
  position: { x: number; y: number }
  onHighlight: (color: HighlightColor, customColor?: string) => void
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

export function TextHighlightMenu({ position, onHighlight, onRemoveHighlight, onCopy, onClose }: TextHighlightMenuProps) {
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

          {/* Grifar - Expandível */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <div className="flex items-center gap-2">
                <Highlighter className="h-4 w-4" />
                <span>Grifar</span>
              </div>
              <span className="text-xs text-gray-400">▶</span>
            </button>

            {/* Submenu de cores */}
            {showColorPicker && (
              <div className="absolute left-full top-0 ml-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-2">
                <div className="space-y-1">
                  {HIGHLIGHT_COLORS.map(({ color, label, bgClass }) => (
                    <button
                      key={color}
                      onClick={() => {
                        onHighlight(color)
                        onClose()
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <div className={`w-5 h-5 rounded ${bgClass} border border-gray-300`} />
                      <span className="whitespace-nowrap">{label}</span>
                    </button>
                  ))}

                  {/* Separador */}
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

                  {/* Cor personalizada */}
                  <div className="px-3 py-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Cor personalizada:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customColor}
                        onChange={(e) => setCustomColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer"
                      />
                      <button
                        onClick={() => {
                          onHighlight('custom', customColor)
                          onClose()
                        }}
                        className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botão Remover Grifação */}
          <button
            onClick={() => {
              onRemoveHighlight()
              onClose()
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <Eraser className="h-4 w-4" />
            <span>Remover grifação</span>
          </button>
        </div>
      </div>
    </>
  )
}
