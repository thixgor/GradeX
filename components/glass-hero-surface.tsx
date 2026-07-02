import { cn } from '@/lib/utils'

/**
 * Layered background for the page's signature glass moments (hero cards).
 * Drop inside any `relative isolate` container with rounded corners —
 * absolutely fills it with blurred glass + an animated iridescent rim.
 * Not for use in lists: backdrop-filter blur is too costly at scale.
 */
export function GlassHeroSurface({ className }: { className?: string }) {
  return (
    <div className={cn('glass-hero-surface', className)} aria-hidden>
      <div className="glass-hero-refraction-top" />
    </div>
  )
}
