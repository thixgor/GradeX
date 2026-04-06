'use client'

import { X, ZoomIn, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  src: string
  alt?: string
}

export function ImageModal({ isOpen, onClose, src, alt = 'Imagem' }: ImageModalProps) {
  const [rotation, setRotation] = useState(0)

  function handleRotate() {
    setRotation(prev => (prev + 90) % 360)
  }

  function handleClose() {
    setRotation(0)
    onClose()
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
      />
      <div className="relative z-[101] animate-in zoom-in-95 duration-200 w-full flex items-center justify-center">
        <div className="relative bg-black rounded-xl shadow-2xl border-0 w-full max-w-[96vw] sm:max-w-[85vw] max-h-[92vh] flex flex-col overflow-hidden">
          {/* Top controls */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRotate}
              className="bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10 sm:w-9 sm:h-9"
              title="Rotacionar imagem"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10 sm:w-9 sm:h-9"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Image area — overflow-auto enables scroll if image is large after rotation */}
          <div
            className="flex items-center justify-center w-full overflow-auto p-4 sm:p-8"
            style={{ maxHeight: '88vh', touchAction: 'pan-x pan-y pinch-zoom' }}
          >
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-[80vh] object-contain transition-transform duration-300 select-none"
              style={{ transform: `rotate(${rotation}deg)` }}
              draggable={false}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Bottom hint */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <span className="bg-black/55 text-white text-[11px] px-3 py-1 rounded-full backdrop-blur-sm whitespace-nowrap">
              Toque fora para fechar
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
