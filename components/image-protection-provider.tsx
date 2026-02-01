'use client'

import { useEffect } from 'react'

/**
 * Provider que protege todas as imagens da plataforma contra:
 * - Clique com botão direito
 * - Arrastar imagem
 * - Copiar imagem
 */
export function ImageProtectionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Prevenir clique direito em imagens
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'IMG') {
        e.preventDefault()
        return false
      }
    }

    // Prevenir arrastar imagens
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'IMG') {
        e.preventDefault()
        return false
      }
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('dragstart', handleDragStart)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('dragstart', handleDragStart)
    }
  }, [])

  return <>{children}</>
}
