'use client'

import { useEffect, useState } from 'react'
import { Play } from 'lucide-react'

/**
 * Prova social real em /buy — os mesmos depoimentos em vídeo que o admin
 * cadastra em /admin/depoimentos e que a landing já mostra.
 *
 * Duas regras, ambas deliberadas:
 *  1. Se não houver depoimento cadastrado, a seção NÃO renderiza nada. Página
 *     de venda com bloco de prova vazio (ou com nome inventado) é pior do que
 *     página sem prova nenhuma.
 *  2. O iframe do YouTube (~1MB) só entra no DOM depois do clique — antes
 *     disso é só a miniatura. Mesmo cuidado que a landing toma.
 */

interface Depoimento {
  _id: string
  embedUrl: string
  videoId: string
  name: string
  description: string
}

export function DepoimentosDeCompra() {
  const [itens, setItens] = useState<Depoimento[] | null>(null)

  useEffect(() => {
    let vivo = true
    fetch('/api/testimonials')
      .then((r) => (r.ok ? r.json() : { testimonials: [] }))
      .then((json) => {
        if (vivo) setItens(Array.isArray(json?.testimonials) ? json.testimonials : [])
      })
      .catch(() => {
        if (vivo) setItens([])
      })
    return () => {
      vivo = false
    }
  }, [])

  if (!itens || itens.length === 0) return null

  return (
    <section aria-labelledby="depoimentos-titulo" className="mt-14 sm:mt-20">
      <h2
        id="depoimentos-titulo"
        className="font-heading text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl"
      >
        Quem já paga fala melhor do que eu.
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Alunos da plataforma, gravados por eles mesmos. Toque para ouvir.
      </p>

      {/* Trilho com sangria até a borda no mobile: o próximo card fica sempre
          cortado na lateral, que é a dica visual de "dá para arrastar". */}
      <div
        className="-mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0"
        role="region"
        aria-label="Depoimentos de alunos em vídeo"
        tabIndex={0}
      >
        {itens.map((item) => (
          <CartaoDeDepoimento key={item._id} item={item} />
        ))}
      </div>
    </section>
  )
}

function CartaoDeDepoimento({ item }: { item: Depoimento }) {
  const [tocando, setTocando] = useState(false)
  const src = `${item.embedUrl}${item.embedUrl.includes('?') ? '&' : '?'}autoplay=1`

  return (
    <article className="w-[72vw] shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-card shadow-sm sm:w-[248px]">
      <div className="relative w-full bg-foreground/90" style={{ aspectRatio: '4 / 5' }}>
        {tocando ? (
          <iframe
            src={src}
            title={item.name ? `Depoimento de ${item.name}` : 'Depoimento de aluno'}
            className="absolute inset-0 h-full w-full"
            style={{ border: 0 }}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setTocando(true)}
            className="group absolute inset-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            aria-label={item.name ? `Reproduzir depoimento de ${item.name}` : 'Reproduzir depoimento'}
          >
            <img
              src={`https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`}
              alt=""
              aria-hidden
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
            />
            <span className="relative grid h-14 w-14 place-items-center rounded-full bg-secondary text-secondary-foreground shadow-lg transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
              <Play className="h-6 w-6 translate-x-0.5 fill-current" />
            </span>
          </button>
        )}
      </div>
      {(item.name || item.description) && (
        <div className="p-4">
          {item.name && (
            <p className="text-sm font-semibold text-foreground">{item.name}</p>
          )}
          {item.description && (
            <p className="mt-1 line-clamp-3 whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          )}
        </div>
      )}
    </article>
  )
}
