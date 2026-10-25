'use client'

import { useEffect, useRef, useState } from 'react'
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

/** Velocidade da rolagem automática, em px por segundo: lê como deriva, não como corrida. */
const VELOCIDADE = 26
/** Depois de um toque/arraste, quanto esperar para voltar a andar sozinho. */
const RETOMAR_MS = 3500

export function DepoimentosDeCompra() {
  const [itens, setItens] = useState<Depoimento[] | null>(null)
  const [tocandoId, setTocandoId] = useState<string | null>(null)

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

  const trilho = useRef<HTMLDivElement>(null)
  const conjunto = useRef<HTMLDivElement>(null)
  const { emLaco, pausar } = useRolagemContinua(trilho, conjunto, itens?.length ?? 0, tocandoId !== null)

  if (!itens || itens.length === 0) return null

  return (
    <section aria-labelledby="depoimentos-titulo">
      <h2
        id="depoimentos-titulo"
        className="font-heading text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl"
      >
        Quem já paga fala melhor do que eu.
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Alunos da plataforma, gravados por eles mesmos. Toque para ouvir.
      </p>

      {/*
        Esteira contínua, sem barra de rolagem: anda sozinha devagar e para
        quando a pessoa encosta (mouse em cima, dedo, foco do teclado ou um
        vídeo tocando). Para dar a volta sem salto, a lista vai duas vezes; a
        cópia é `inert` — o leitor de tela e o Tab só veem a original. As
        bordas somem num degradê em vez de cortar o cartão no meio.
      */}
      <div
        ref={trilho}
        {...pausar}
        className="-mx-4 mt-6 overflow-x-auto px-4 pb-1 [mask-image:linear-gradient(90deg,transparent,#000_20px,#000_calc(100%-20px),transparent)] [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
        role="region"
        aria-label="Depoimentos de alunos em vídeo"
        tabIndex={0}
      >
        <div className="flex w-max gap-4">
          <div ref={conjunto} className="flex gap-4">
            {itens.map((item) => (
              <CartaoDeDepoimento
                key={item._id}
                item={item}
                tocando={tocandoId === item._id}
                onTocar={() => setTocandoId(item._id)}
              />
            ))}
          </div>
          {emLaco && (
            <div className="flex gap-4" aria-hidden inert>
              {itens.map((item) => (
                <CartaoDeDepoimento key={`copia-${item._id}`} item={item} tocando={false} onTocar={() => {}} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/**
 * A esteira: `scrollLeft` andando num `requestAnimationFrame`, e só enquanto
 * vale a pena — o trilho na tela, a aba visível (o rAF já para sozinho), sem
 * "reduzir movimento" e sem ninguém mexendo. Quando passa de uma volta inteira
 * (a largura da lista original + o vão), desconta a volta: como a cópia é
 * idêntica, o salto não aparece. Arrastar à mão continua valendo; a esteira
 * retoma de onde a pessoa deixou.
 */
function useRolagemContinua(
  trilho: React.RefObject<HTMLDivElement | null>,
  conjunto: React.RefObject<HTMLDivElement | null>,
  quantidade: number,
  videoTocando: boolean,
) {
  const [emLaco, setEmLaco] = useState(false)
  const [naTela, setNaTela] = useState(false)
  const [mexendo, setMexendo] = useState(false)
  const [focado, setFocado] = useState(false)
  const [reduzir, setReduzir] = useState(false)
  const retomar = useRef<number | undefined>(undefined)

  // Só vira esteira quando a lista não cabe inteira — três cartões num
  // monitor largo ficam parados, lado a lado.
  useEffect(() => {
    const t = trilho.current
    const c = conjunto.current
    if (!t || !c) return
    const medir = () => setEmLaco(c.offsetWidth > t.clientWidth + 1)
    medir()
    const obs = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(medir) : null
    obs?.observe(t)
    obs?.observe(c)
    return () => obs?.disconnect()
  }, [trilho, conjunto, quantidade])

  useEffect(() => {
    const t = trilho.current
    if (!t || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(([e]) => setNaTela(e.isIntersecting))
    obs.observe(t)
    return () => obs.disconnect()
  }, [trilho, quantidade])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const ler = () => setReduzir(mq.matches || document.documentElement.classList.contains('lite-mode'))
    ler()
    mq.addEventListener('change', ler)
    return () => mq.removeEventListener('change', ler)
  }, [])

  useEffect(() => () => window.clearTimeout(retomar.current), [])

  const andando = emLaco && naTela && !mexendo && !focado && !videoTocando && !reduzir

  useEffect(() => {
    const t = trilho.current
    const c = conjunto.current
    if (!andando || !t || !c) return
    const vao = parseFloat(getComputedStyle(c).columnGap) || 16
    let posicao = t.scrollLeft
    let antes = performance.now()
    let quadro = 0
    const passo = (agora: number) => {
      const volta = c.offsetWidth + vao
      // Limita o salto depois de uma pausa longa do navegador.
      posicao += (VELOCIDADE * Math.min(64, agora - antes)) / 1000
      antes = agora
      if (posicao >= volta) posicao -= volta
      t.scrollLeft = posicao
      quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [andando, trilho, conjunto])

  const segurar = () => {
    window.clearTimeout(retomar.current)
    setMexendo(true)
  }
  const soltarDepois = () => {
    window.clearTimeout(retomar.current)
    retomar.current = window.setTimeout(() => setMexendo(false), RETOMAR_MS)
  }

  const pausar = {
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse') segurar()
    },
    onPointerLeave: (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse') {
        window.clearTimeout(retomar.current)
        setMexendo(false)
      }
    },
    onPointerDown: segurar,
    onPointerUp: (e: React.PointerEvent) => {
      if (e.pointerType !== 'mouse') soltarDepois()
    },
    onTouchStart: segurar,
    onTouchEnd: soltarDepois,
    onWheel: () => {
      segurar()
      soltarDepois()
    },
    // Só o foco do teclado segura: o clique também foca, e aí a esteira
    // ficaria parada até a pessoa clicar em outro lugar.
    onFocus: (e: React.FocusEvent) => {
      if ((e.target as HTMLElement).matches?.(':focus-visible')) setFocado(true)
    },
    onBlur: (e: React.FocusEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocado(false)
    },
  }

  return { emLaco, pausar }
}

function CartaoDeDepoimento({
  item,
  tocando,
  onTocar,
}: {
  item: Depoimento
  tocando: boolean
  onTocar: () => void
}) {
  const src = `${item.embedUrl}${item.embedUrl.includes('?') ? '&' : '?'}autoplay=1`

  return (
    <article className="w-[72vw] shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm sm:w-[248px]">
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
            onClick={onTocar}
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
