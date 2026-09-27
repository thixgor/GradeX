import Link from 'next/link'
import { Leaf, PawPrint } from 'lucide-react'

import type { LaminaResumida } from '@/lib/histologia-zoom/tipos'

/**
 * Cartão de lâmina: a miniatura real do scan é o próprio rótulo visual.
 *
 * A miniatura vem do servidor de origem e tem proporção variável; o quadro é
 * fixo (4:3) com `object-contain` sobre fundo de vidro escuro, para lâminas
 * altas e largas conviverem na mesma grade sem cortar o corte.
 */
export function CartaoDeLamina({
  lamina,
  href,
  mostrarOrgao = false,
  atual = false,
}: {
  lamina: LaminaResumida
  href: string
  mostrarOrgao?: boolean
  atual?: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={atual ? 'page' : undefined}
      className={`group block h-full overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500 ${
        atual ? 'border-teal-600 ring-2 ring-teal-500/30' : 'border-border hover:border-teal-500/40'
      }`}
    >
      <span className="relative block aspect-[4/3] overflow-hidden bg-[#101614]">
        {lamina.mosaico ? (
          // SVG com viewBox: escala como object-contain, e cada tile cai no
          // pixel certo (com a sobreposição de 1 px do DZI descontada).
          <svg
            viewBox={`0 0 ${lamina.mosaico.largura} ${lamina.mosaico.altura}`}
            preserveAspectRatio="xMidYMid meet"
            className="h-full w-full p-1.5 transition-transform duration-300 group-hover:scale-[1.04]"
            aria-hidden
          >
            {lamina.mosaico.tiles.map((t) => (
              <image key={t.url} href={t.url} x={t.x} y={t.y} width={t.l} height={t.a} preserveAspectRatio="none" />
            ))}
          </svg>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={lamina.miniatura}
            alt=""
            loading="lazy"
            decoding="async"
            width={lamina.miniaturaL}
            height={lamina.miniaturaA}
            className="h-full w-full object-contain p-1.5 transition-transform duration-300 group-hover:scale-[1.04]"
          />
        )}
        {(lamina.categoriaDeOrigem === 'nao-humana' || lamina.categoriaDeOrigem === 'vegetal') && (
          // Espécie não humana sempre visível já no cartão, antes do clique.
          <span className="absolute left-1.5 top-1.5 inline-flex max-w-[calc(100%-12px)] items-center gap-1 rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-bold text-amber-950 shadow">
            {lamina.categoriaDeOrigem === 'vegetal' ? (
              <Leaf className="h-3 w-3 shrink-0" aria-hidden />
            ) : (
              <PawPrint className="h-3 w-3 shrink-0" aria-hidden />
            )}
            <span className="sr-only">Peça não humana:</span>
            <span className="truncate">{lamina.especie.replace(' (primata não humano)', '')}</span>
          </span>
        )}
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/65 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
          até {lamina.ampliacaoMaxima}×
        </span>
      </span>
      <span className="block p-2.5">
        {mostrarOrgao && (
          <span className="block truncate text-[13px] font-semibold leading-snug">{lamina.orgaoNome}</span>
        )}
        {(lamina.subtitulo || !mostrarOrgao) && (
          <span
            className={`block truncate leading-snug ${
              mostrarOrgao ? 'text-xs text-muted-foreground' : 'text-[13px] font-semibold'
            }`}
          >
            {lamina.subtitulo ?? 'Lâmina principal'}
          </span>
        )}
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{lamina.coloracao}</span>
      </span>
    </Link>
  )
}
