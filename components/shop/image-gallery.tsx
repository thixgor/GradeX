'use client'

/**
 * Galeria de imagens de produto físico. Imagem principal com efeito 3D de
 * profundidade (tilt suave no hover) + tira de miniaturas selecionáveis.
 */

import { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Package } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ImageGallery({ images, title }: { images: string[]; title: string }) {
  const list = images?.filter(Boolean) || []
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 150, damping: 15 })
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 150, damping: 15 })

  function onMove(e: React.MouseEvent) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }
  function onLeave() {
    mx.set(0)
    my.set(0)
  }

  if (list.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-border/50 bg-muted/40 text-muted-foreground/40">
        <Package className="h-24 w-24" />
      </div>
    )
  }

  return (
    <div className="[perspective:1200px]">
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d', transformPerspective: 1200 }}
        className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-muted/50 to-muted/10 shadow-xl"
      >
        <motion.img
          key={active}
          // eslint-disable-next-line @next/next/no-img-element
          src={list[active]}
          alt={title}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="h-full w-full object-cover"
          style={{ transform: 'translateZ(40px)' }}
        />
      </motion.div>

      {list.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {list.map((img, i) => (
            <button
              key={img + i}
              onClick={() => setActive(i)}
              className={cn(
                'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all',
                i === active ? 'border-primary shadow-md shadow-primary/20 scale-105' : 'border-border/40 opacity-70 hover:opacity-100'
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`${title} ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
