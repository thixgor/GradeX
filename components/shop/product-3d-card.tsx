'use client'

/**
 * Card 3D de produto físico para a vitrine. Usa CSS 3D + framer-motion:
 * inclina (tilt) seguindo o cursor com profundidade em camadas. Leve, sem
 * dependências de WebGL.
 */

import { useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Package, Truck, Clock } from 'lucide-react'

export interface Product3DCardData {
  _id: string
  title: string
  price: number
  compareAtPrice?: number
  images?: string[]
  madeToOrder?: boolean
  isFeatured?: boolean
  linkMode?: string
}

export function Product3DCard({ product, href }: { product: Product3DCardData; href?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [9, -9]), { stiffness: 200, damping: 18 })
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), { stiffness: 200, damping: 18 })

  function onMouseMove(e: React.MouseEvent) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }
  function onLeave() {
    mx.set(0)
    my.set(0)
    setHovered(false)
  }

  const brl = (n: number) => n.toFixed(2).replace('.', ',')
  const cover = product.images?.[0]
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : 0

  const inner = (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', transformPerspective: 900 }}
      className="group relative h-full rounded-2xl border border-border/50 bg-card/70 backdrop-blur-sm overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-shadow"
    >
      {/* brilho que segue o hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            'radial-gradient(600px circle at var(--x,50%) var(--y,50%), hsl(var(--primary)/0.12), transparent 40%)',
        }}
      />
      {/* imagem */}
      <div
        className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-muted/60 to-muted/20"
        style={{ transform: 'translateZ(30px)' }}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
            <Package className="h-16 w-16" />
          </div>
        )}

        {/* selos */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5" style={{ transform: 'translateZ(50px)' }}>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-lg">
            <Truck className="h-3 w-3" /> Físico
          </span>
          {product.madeToOrder && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
              <Clock className="h-3 w-3" /> Sob encomenda
            </span>
          )}
        </div>
        {discount > 0 && (
          <span
            className="absolute right-3 top-3 rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-lg"
            style={{ transform: 'translateZ(50px)' }}
          >
            -{discount}%
          </span>
        )}
      </div>

      {/* corpo */}
      <div className="p-4" style={{ transform: 'translateZ(24px)' }}>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight text-foreground">
          {product.title}
        </h3>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-lg font-extrabold text-foreground">R$ {brl(product.price)}</span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="mb-0.5 text-xs text-muted-foreground line-through">R$ {brl(product.compareAtPrice)}</span>
          )}
        </div>
      </div>

      <motion.div
        className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary via-domina-yellow to-secondary"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: hovered ? 1 : 0 }}
        style={{ originX: 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  )

  if (href) {
    return (
      <Link href={href} className="block h-full [perspective:900px]">
        {inner}
      </Link>
    )
  }
  return <div className="h-full [perspective:900px]">{inner}</div>
}
