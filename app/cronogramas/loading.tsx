/**
 * Esqueleto da área de cronogramas.
 *
 * Antes era o esqueleto genérico de "grade de cartões", que desenhava uma
 * forma que a página não tem — e a troca do genérico pela página real dava um
 * salto de layout logo no primeiro segundo. Este imita a composição de verdade:
 * pílula de contexto, três leituras no topo, faixa de abas e o calendário.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:py-7">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="skeleton-pulse h-10 w-52 rounded-full" />
          <div className="skeleton-pulse ml-auto h-10 w-40 rounded-xl" />
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="skeleton-pulse h-[7.5rem] rounded-2xl opacity-70" />
          ))}
        </div>

        <div className="skeleton-pulse mb-4 h-[3.25rem] rounded-2xl opacity-70" />

        <div className="glass-page-card rounded-2xl p-4 sm:p-5">
          <div className="skeleton-pulse mb-4 h-6 w-48 rounded-lg" />
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 35 }, (_, i) => (
              <div key={i} className="skeleton-pulse h-14 rounded-lg opacity-60 sm:h-20" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
