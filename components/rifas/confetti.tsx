'use client'

import { useEffect, useRef } from 'react'

interface ConfettiProps {
  /** Quando muda para true, dispara uma rajada. */
  active: boolean
  colors?: string[]
  durationMs?: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rot: number
  vrot: number
  life: number
}

/**
 * Confete em canvas, sem dependências externas. Leve e auto-limpante para não
 * pesar no Vercel/cliente.
 */
export function Confetti({ active, colors, durationMs = 4000 }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>()
  const startedRef = useRef(false)

  useEffect(() => {
    if (!active || startedRef.current) return
    startedRef.current = true

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.scale(dpr, dpr)
    }
    resize()

    const palette = colors && colors.length ? colors : ['#34d399', '#f5c542', '#a855f7', '#f43f5e', '#3b82f6', '#facc15']
    const particles: Particle[] = []
    const count = 160
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * window.innerHeight * 0.4,
        vx: (Math.random() - 0.5) * 6,
        vy: 2 + Math.random() * 5,
        size: 5 + Math.random() * 7,
        color: palette[Math.floor(Math.random() * palette.length)],
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.3,
        life: 1,
      })
    }

    const startTime = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startTime
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      let alive = false
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.08
        p.rot += p.vrot
        if (elapsed > durationMs * 0.6) p.life -= 0.02
        if (p.life > 0 && p.y < window.innerHeight + 40) {
          alive = true
          ctx.save()
          ctx.globalAlpha = Math.max(0, p.life)
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rot)
          ctx.fillStyle = p.color
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
          ctx.restore()
        }
      }
      if (alive && elapsed < durationMs + 1500) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
        startedRef.current = false
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    window.addEventListener('resize', resize)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [active, colors, durationMs])

  if (!active) return null
  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, width: '100vw', height: '100vh' }}
    />
  )
}
