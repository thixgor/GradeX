'use client'

import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface FloatingMenuProps {
  open: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLElement>
  align?: 'left' | 'right'
  width?: number
  children: ReactNode
  className?: string
}

/**
 * Dropdown menu rendered via portal into document.body, positioned with `fixed`
 * coordinates computed from the anchor's bounding rect and clamped to the viewport.
 * Avoids clipping by `overflow-hidden` ancestors (e.g. rounded image cards) and
 * off-screen overflow in narrow layouts (e.g. mobile grid cards).
 */
export function FloatingMenu({ open, onClose, anchorRef, align = 'right', width = 224, children, className }: FloatingMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null)
      return
    }
    const anchor = anchorRef.current
    if (!anchor) return

    const update = () => {
      const rect = anchor.getBoundingClientRect()
      const margin = 8
      const menuHeight = menuRef.current?.offsetHeight ?? 0

      let left = align === 'right' ? rect.right - width : rect.left
      left = Math.min(Math.max(left, margin), window.innerWidth - width - margin)

      const spaceBelow = window.innerHeight - rect.bottom
      const placeAbove = spaceBelow < menuHeight + margin && rect.top > menuHeight + margin
      const top = placeAbove ? rect.top - menuHeight - 6 : rect.bottom + 6

      setCoords({ top, left })
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, anchorRef, align, width])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <>
      <div className="fixed inset-0 z-[90]" onClick={onClose} />
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          top: coords?.top ?? -9999,
          left: coords?.left ?? -9999,
          width,
          visibility: coords ? 'visible' : 'hidden',
        }}
        className={cn(
          'z-[95] overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-2xl animate-in fade-in duration-150',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>,
    document.body
  )
}
