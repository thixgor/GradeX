import Link from 'next/link'
import { ArrowRight, ScanSearch } from 'lucide-react'

import { laminasDaDoenca, resumirPatologica } from '@/lib/histopatologia-zoom/repositorio'
import { rotaDaDoencaZoom, rotaDaLaminaPatologica } from '@/lib/histopatologia-zoom/rotas'
import type { DoencaZoom } from '@/lib/histopatologia-zoom/tipos'

/**
 * Lâminas com zoom de uma doença, dentro do capítulo dela.
 *
 * O capítulo e a "Histopatologia com Zoom" eram duas páginas da mesma doença
 * que não se citavam: quem lia o capítulo não sabia que havia lâmina inteira,
 * e quem abria a lâmina não achava o capítulo. Este bloco fica no alto do
 * capítulo — a imagem em destaque vem antes do texto — e cada miniatura abre o
 * visualizador direto. A ficha de achados por lâmina continua a um clique.
 */
export function LaminasComZoomDaDoenca({ doenca }: { doenca: DoencaZoom }) {
  const laminas = laminasDaDoenca(doenca.id)
  if (laminas.length === 0) return null

  return (
    <section
      aria-labelledby="laminas-com-zoom"
      className="mt-6 overflow-hidden rounded-2xl bg-[#0B1F1A] p-4 text-white ring-1 ring-[#E8763A]/30 sm:p-5"
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="laminas-com-zoom" className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight">
            <ScanSearch className="h-5 w-5 text-[#E8763A]" aria-hidden />
            {laminas.length === 1 ? 'Lâmina com zoom interativo' : `${laminas.length} lâminas com zoom interativo`}
          </h2>
          <p className="mt-0.5 text-xs text-white/65">
            Lâmina inteira, com os achados desta doença marcados onde aparecem e o normal ao lado.
          </p>
        </div>
        <Link
          href={rotaDaDoencaZoom(doenca.id)}
          className="inline-flex min-h-[36px] items-center gap-1 rounded-md px-2 text-xs font-bold text-[#E8763A] hover:bg-white/5"
        >
          Ficha de achados <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      <ul className="catalogo-fileira -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
        {laminas.map((l) => {
          const r = resumirPatologica(l)
          return (
            <li key={l.slug} className="w-[62%] shrink-0 snap-start sm:w-[38%] md:w-[30%]">
              <Link
                href={rotaDaLaminaPatologica(doenca.id, l.slug)}
                className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8763A]"
              >
                <span className="relative block aspect-[4/3] overflow-hidden rounded-xl bg-white ring-1 ring-white/10 transition group-hover:ring-[#E8763A]/70">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.miniatura}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    <ScanSearch className="h-3 w-3 text-[#E8763A]" aria-hidden /> Zoom
                  </span>
                </span>
                <span className="mt-1.5 block truncate text-sm font-semibold">{l.subtitulo ?? l.titulo}</span>
                <span className="block text-[11px] text-white/55">{r.achadosPresentes} achados marcados</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
