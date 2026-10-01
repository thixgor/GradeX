'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Fileira horizontal do catálogo — o "trilho" de um serviço de streaming.
 *
 * - No toque, rola com o dedo e encaixa cartão a cartão (`scroll-snap`).
 * - No desktop, as setas aparecem nas bordas e avançam uma "página" da fileira;
 *   somem na ponta onde não há mais o que rolar.
 * - O título da fileira diz **o que é** (Histologia, Histopatologia, sistema),
 *   e o "Ver tudo" leva à listagem completa daquele recorte.
 *
 * Os cartões chegam prontos do servidor como `children` (cada `<li>`): a ilha
 * de cliente é só o trilho e as setas, não o conteúdo.
 */
export function FileiraDoCatalogo({
  id,
  titulo,
  subtitulo,
  verTudo,
  formato = 'paisagem',
  children,
}: {
  id: string
  titulo: React.ReactNode
  subtitulo?: React.ReactNode
  verTudo?: { href: string; rotulo?: string }
  formato?: 'paisagem' | 'retrato'
  children: React.ReactNode
}) {
  const trilho = useRef<HTMLUListElement>(null)
  const [podeVoltar, setPodeVoltar] = useState(false)
  const [podeAvancar, setPodeAvancar] = useState(false)

  const medir = useCallback(() => {
    const el = trilho.current
    if (!el) return
    setPodeVoltar(el.scrollLeft > 4)
    setPodeAvancar(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    medir()
    const el = trilho.current
    if (!el) return
    el.addEventListener('scroll', medir, { passive: true })
    const observador = new ResizeObserver(medir)
    observador.observe(el)
    return () => {
      el.removeEventListener('scroll', medir)
      observador.disconnect()
    }
  }, [medir])

  const rolar = (sentido: 1 | -1) => {
    const el = trilho.current
    if (!el) return
    el.scrollBy({ left: sentido * el.clientWidth * 0.85, behavior: 'smooth' })
  }

  const larguraDoCartao =
    formato === 'retrato'
      ? '[&>li]:w-[42%] min-[480px]:[&>li]:w-[30%] md:[&>li]:w-[22%] lg:[&>li]:w-[17%] xl:[&>li]:w-[14.2%]'
      : '[&>li]:w-[72%] min-[480px]:[&>li]:w-[46%] md:[&>li]:w-[31.5%] lg:[&>li]:w-[23.6%] xl:[&>li]:w-[19%]'

  return (
    <section aria-labelledby={`fileira-${id}`} className="group/fileira relative mt-9">
      <div className="mb-3 flex items-end justify-between gap-3 px-4 md:px-10">
        <div className="min-w-0">
          <h2 id={`fileira-${id}`} className="font-heading text-lg font-semibold tracking-tight text-white sm:text-xl">
            {titulo}
          </h2>
          {subtitulo && <p className="mt-0.5 text-xs leading-relaxed text-white/55 sm:text-sm">{subtitulo}</p>}
        </div>
        {verTudo && (
          <Link
            href={verTudo.href}
            className="inline-flex min-h-[36px] shrink-0 items-center gap-0.5 rounded-md px-2 text-xs font-bold text-[#E8763A] transition-colors hover:bg-white/5 hover:text-[#ff9a63]"
          >
            {verTudo.rotulo ?? 'Ver tudo'}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </div>

      <div className="relative">
        <ul
          ref={trilho}
          className={`catalogo-fileira flex gap-3 overflow-x-auto px-4 pb-3 pt-1 md:gap-4 md:px-10 [&>li]:shrink-0 [&>li]:snap-start ${larguraDoCartao}`}
        >
          {children}
        </ul>

        {/* Setas só no desktop: no toque, o dedo já é o controle. */}
        <button
          type="button"
          onClick={() => rolar(-1)}
          aria-label="Voltar na fileira"
          tabIndex={-1}
          className={`absolute inset-y-0 left-0 z-10 hidden h-auto min-h-[36px] w-10 items-center justify-center bg-gradient-to-r from-[#071411] to-transparent text-white transition-opacity md:flex ${
            podeVoltar ? 'opacity-0 group-hover/fileira:opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <ChevronLeft className="h-7 w-7" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => rolar(1)}
          aria-label="Avançar na fileira"
          tabIndex={-1}
          className={`absolute inset-y-0 right-0 z-10 hidden h-auto min-h-[36px] w-10 items-center justify-center bg-gradient-to-l from-[#071411] to-transparent text-white transition-opacity md:flex ${
            podeAvancar ? 'opacity-0 group-hover/fileira:opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <ChevronRight className="h-7 w-7" aria-hidden />
        </button>
      </div>
    </section>
  )
}
