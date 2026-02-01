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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
      />
      <div className="relative z-[101] animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="relative bg-black rounded-lg shadow-2xl border-0 max-w-[80vw] max-h-[85vh] flex flex-col">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10"
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="absolute top-4 left-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRotate}
              className="bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10"
              title="Rotacionar imagem"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center justify-center w-full h-full p-8">
            <img
              src={src}
              alt={alt}
              className="max-w-[70vw] max-h-[75vh] object-contain transition-transform duration-300"
              style={{ transform: `rotate(${rotation}deg)` }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <Button
              variant="ghost"
              size="sm"
              className="bg-black/50 hover:bg-black/70 text-white rounded-full px-4"
            >
              <ZoomIn className="h-4 w-4 mr-2" />
              Clique fora para fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
