// Fallback do Suspense do segmento /materiais/[id]/viewer.
//
// Sem este arquivo, o fallback herdado era o de `app/materiais/loading.tsx` —
// uma grade de cards com barra lateral, formato completamente diferente de um
// leitor em tela cheia. O leitor piscava um layout de listagem antes de virar
// documento. Aqui a silhueta já é a do leitor: barra superior + moldura A4.
export default function ViewerRouteLoading() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(135deg,#061411_0%,#13251f_44%,#09090b_100%)]" />
      <div className="relative min-h-screen text-white">
        <div className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/80 backdrop-blur-2xl">
          <div className="flex items-center gap-2 px-3 py-3 sm:px-4">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-white/10" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3.5 w-2/5 max-w-xs animate-pulse rounded bg-white/15" />
              <div className="h-2.5 w-1/4 max-w-[10rem] animate-pulse rounded bg-white/10" />
            </div>
            <div className="h-10 w-24 shrink-0 animate-pulse rounded-xl bg-white/10" />
          </div>
        </div>
        <div className="flex justify-center px-3 py-6 sm:px-4 sm:py-8">
          <div className="w-full max-w-3xl">
            <div
              className="w-full animate-pulse rounded-xl border border-white/10 bg-white/[0.06]"
              style={{ aspectRatio: '595 / 842' }}
            />
            <p className="mt-4 text-center text-xs text-white/45">Preparando seu material…</p>
          </div>
        </div>
      </div>
    </div>
  )
}
