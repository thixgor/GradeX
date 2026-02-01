'use client'

import { cn } from '@/lib/utils'

interface ProtectedImageProps {
  src: string
  alt: string
  className?: string
  style?: React.CSSProperties
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void
  onClick?: () => void
}

/**
 * Componente de imagem protegida que impede:
 * - Clique com botão direito
 * - Arrastar imagem
 * - Copiar imagem
 */
export function ProtectedImage({
  src,
  alt,
  className,
  style,
  onError,
  onClick
}: ProtectedImageProps) {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    return false
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault()
    return false
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn("select-none pointer-events-auto", className)}
      style={{
        ...style,
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      onError={onError}
      onClick={onClick}
      draggable={false}
    />
  )
}
