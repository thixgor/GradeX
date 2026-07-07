'use client'

/**
 * Card 3D de produto físico para a vitrine. Tilt em CSS puro (sem framer-motion
 * por card): o mousemove escreve variáveis CSS direto no elemento (sem re-render
 * React), e o transform é interpolado por transition. Leve e rápido em listas.
 */

import { useRef } from 'react'
import Link from 'next/link'
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

  function onMove(e: React.MouseEvent) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    el.style.setProperty('--ry', `${(px - 0.5) * 16}deg`)
    el.style.setProperty('--rx', `${(0.5 - py) * 16}deg`)
    el.style.setProperty('--gx', `${px * 100}%`)
    el.style.setProperty('--gy', `${py * 100}%`)
  }
  function onLeave() {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--ry', '0deg')
    el.style.setProperty('--rx', '0deg')
  }

  const brl = (n: number) => n.toFixed(2).replace('.', ',')
  const cover = product.images?.[0]
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : 0

  const inner = (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="group relative h-full overflow-hidden rounded-2xl border border-border/50 bg-card/70 shadow-sm transition-[transform,box-shadow] duration-200 ease-out will-change-transform hover:shadow-2xl hover:shadow-primary/10"
      style={{
        transformStyle: 'preserve-3d',
        transform: 'perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))',
      }}
    >
      {/* brilho que segue o hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: 'radial-gradient(500px circle at var(--gx,50%) var(--gy,50%), hsl(var(--primary)/0.12), transparent 40%)',
        }}
      />
      {/* imagem */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-muted/60 to-muted/20">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={product.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
            <Package className="h-16 w-16" />
          </div>
        )}

        {/* selos */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
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
          <span className="absolute right-3 top-3 rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-lg">
            -{discount}%
          </span>
        )}
      </div>

      {/* corpo */}
      <div className="p-4">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight text-foreground">{product.title}</h3>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-lg font-extrabold text-foreground">R$ {brl(product.price)}</span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="mb-0.5 text-xs text-muted-foreground line-through">R$ {brl(product.compareAtPrice)}</span>
          )}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-primary via-domina-yellow to-secondary transition-transform duration-300 group-hover:scale-x-100" />
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {inner}
      </Link>
    )
  }
  return <div className="h-full">{inner}</div>
}
