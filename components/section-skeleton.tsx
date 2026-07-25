import { Skeleton } from '@/components/ui/skeleton'

/**
 * Esqueleto no formato do AppShell (sidebar + header + conteúdo).
 *
 * Renderizado pelos `loading.tsx` de cada seção. Como é 100% apresentacional
 * (sem fetch, sem hooks de dados), aparece no instante em que a navegação
 * começa — o usuário vê o "molde" do app se preenchendo em vez de um spinner
 * fullscreen que dá sensação de recarregar tudo. Quando o JS da rota termina
 * de baixar, o AppShell real assume no mesmo lugar, sem pulo de layout.
 *
 * @param variant  'cards' (grade de cartões — provas, materiais, flashcards),
 *                 'list' (linhas — banco de questões, fórum) ou
 *                 'dashboard' (hero + métricas + grade).
 */
export function SectionSkeleton({
  variant = 'cards',
}: {
  variant?: 'cards' | 'list' | 'dashboard'
}) {
  return (
    <div className="min-h-screen surface-page">
      {/* Rail lateral (só desktop, espelha o Sidebar de 280px) */}
      <div className="hidden lg:flex fixed inset-y-0 left-0 w-[280px] flex-col gap-2 border-r border-border bg-background/60 p-4">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <div className="mt-4 flex flex-col gap-1.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-md" />
          ))}
        </div>
      </div>

      <div className="lg:pl-[280px]">
        {/* Header sticky (espelha h-14 sm:h-16) */}
        <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-3 px-3 sm:px-4 lg:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <Skeleton className="h-9 w-9 rounded-md lg:hidden" />
              <Skeleton className="h-5 w-40 rounded" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          {variant === 'dashboard' ? (
            <DashboardBody />
          ) : variant === 'list' ? (
            <ListBody />
          ) : (
            <CardsBody />
          )}
        </div>
      </div>
    </div>
  )
}

function HeroBand() {
  return (
    <div className="mb-6 rounded-2xl border border-border bg-card/50 p-5 sm:p-6">
      <Skeleton className="h-7 w-56 max-w-full rounded-lg" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full rounded" />
      <div className="mt-5 flex flex-wrap gap-2.5">
        <Skeleton className="h-10 w-36 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
    </div>
  )
}

function CardsBody() {
  return (
    <>
      <HeroBand />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card/50 p-5"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="mt-2 h-3 w-1/2 rounded" />
              </div>
            </div>
            <Skeleton className="mt-4 h-3 w-full rounded" />
            <Skeleton className="mt-2 h-3 w-5/6 rounded" />
            <Skeleton className="mt-5 h-9 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </>
  )
}

function ListBody() {
  return (
    <>
      {/* Barra de filtros/busca */}
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <Skeleton className="h-11 flex-1 min-w-[200px] rounded-lg" />
        <Skeleton className="h-11 w-32 rounded-lg" />
        <Skeleton className="h-11 w-11 rounded-lg" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-border bg-card/50 p-4"
          >
            <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-2/3 rounded" />
              <Skeleton className="mt-2 h-3 w-1/3 rounded" />
            </div>
            <Skeleton className="hidden h-8 w-24 rounded-lg sm:block" />
          </div>
        ))}
      </div>
    </>
  )
}

function DashboardBody() {
  return (
    <>
      <HeroBand />
      {/* Métricas */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card/50 p-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="mt-3 h-6 w-16 rounded" />
            <Skeleton className="mt-2 h-3 w-20 rounded" />
          </div>
        ))}
      </div>
      {/* Carrossel de experiências — espelha o trilho real (cards de ~80% da
          largura no celular), senão haveria um salto grade→carrossel quando os
          dados chegam. */}
      <Skeleton className="mb-3 h-5 w-48 rounded" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="w-[80%] shrink-0 rounded-2xl border border-border bg-card/50 p-4 sm:w-[46%] lg:w-[31%] xl:w-[23%]"
          >
            <Skeleton className="h-11 w-11 rounded-xl" />
            <Skeleton className="mt-3 h-4 w-2/3 rounded" />
            <Skeleton className="mt-2 h-3 w-full rounded" />
            <Skeleton className="mt-2 h-3 w-4/5 rounded" />
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-1.5 w-1.5 rounded-full" />
        ))}
      </div>
    </>
  )
}
