'use client'

import { useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

/**
 * GlassGlow — wraps any element and adds a mouse-tracking
 * blurred light / laser that follows the cursor inside the card.
 * Pure CSS + vanilla JS, zero Framer Motion overhead.
 * GPU-accelerated via transform + opacity.
 */
export function GlassGlow({
  children,
  className,
  glowColor = 'rgba(70, 129, 82, 0.35)',
  glowSize = 180,
  disabled = false,
  ...props
}: {
  children: React.ReactNode
  className?: string
  glowColor?: string
  glowSize?: number
  disabled?: boolean
  [key: string]: any
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const [isInside, setIsInside] = useState(false)

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (disabled || !containerRef.current || !glowRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    glowRef.current.style.transform = `translate(${x - glowSize / 2}px, ${y - glowSize / 2}px)`
  }, [disabled, glowSize])

  const handleMouseEnter = useCallback(() => {
    if (!disabled) setIsInside(true)
  }, [disabled])

  const handleMouseLeave = useCallback(() => {
    setIsInside(false)
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn('glass-glow-container', className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <div
        ref={glowRef}
        className="glass-glow-spot"
        style={{
          width: glowSize,
          height: glowSize,
          background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)`,
          opacity: isInside ? 1 : 0,
        }}
      />
      <div
        className="glass-glow-border"
        style={{ opacity: isInside ? 1 : 0 }}
      />
      {children}
    </div>
  )
}
