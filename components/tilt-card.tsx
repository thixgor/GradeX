'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * TiltCard — subtle 3D pointer-tracking tilt for "hero" surfaces.
 * Mouse-only (checks pointer: fine) and skipped under prefers-reduced-motion,
 * so touch devices keep their normal tap behaviour with zero jank.
 */
export function TiltCard({
  children,
  className,
  maxTilt = 6,
  scale = 1.015,
  disabled = false,
}: {
  children: React.ReactNode
  className?: string
  maxTilt?: number
  scale?: number
  disabled?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [canTilt, setCanTilt] = useState(false)

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setCanTilt(fine && !reduced && !disabled)
  }, [disabled])

  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const springX = useSpring(px, { stiffness: 300, damping: 30 })
  const springY = useSpring(py, { stiffness: 300, damping: 30 })

  const rotateX = useTransform(springY, [0, 1], [maxTilt, -maxTilt])
  const rotateY = useTransform(springX, [0, 1], [-maxTilt, maxTilt])
  const glareX = useTransform(springX, [0, 1], ['0%', '100%'])
  const glareY = useTransform(springY, [0, 1], ['0%', '100%'])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canTilt || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    px.set((e.clientX - rect.left) / rect.width)
    py.set((e.clientY - rect.top) / rect.height)
  }, [canTilt, px, py])

  const handleMouseLeave = useCallback(() => {
    px.set(0.5)
    py.set(0.5)
  }, [px, py])

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={canTilt ? { rotateX, rotateY, transformPerspective: 1000 } : undefined}
      whileHover={canTilt ? { scale } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn('relative group', className)}
    >
      {canTilt && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: useTransform(
              [glareX, glareY],
              ([gx, gy]: string[]) => `radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,0.14), transparent 55%)`
            ),
          }}
        />
      )}
      {children}
    </motion.div>
  )
}
