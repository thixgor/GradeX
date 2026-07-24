import { cn } from '@/lib/utils'

/**
 * Placeholder de carregamento com shimmer.
 *
 * Usa a classe global `.skeleton-pulse` (globals.css), que já respeita o
 * lite-mode (animações zeradas) e `prefers-reduced-motion`. Puramente
 * apresentacional — nunca faz fetch — então pode ser renderizado dentro de um
 * `loading.tsx` para aparecer instantaneamente na navegação.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('skeleton-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

export { Skeleton }
