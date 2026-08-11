'use client'

import { useEffect, useRef, useState } from 'react'
import { MousePointerClick, Target } from 'lucide-react'
import { CantosFilme, urlFilme } from './filme'

/**
 * Demonstração do mecanismo do atlas de Raio-X para quem ainda não tem acesso.
 *
 * O argumento não é a lista de recursos — é o gesto: clicar no nome e ver a
 * estrutura acender sobre o filme. Um print não comunica isso, então a prévia
 * acende sozinha em ciclo e aceita o clique do visitante.
 *
 * O que ela NÃO entrega é o produto: três demarcações de uma única incidência,
 * sem dossiê, sem roteiro de leitura, sem as outras 27 incidências.
 */

const PASTA = '/img/radiologia/raio-x/v1/thorax'

const DEMO = [
  { arquivo: 'CW.png', nome: 'Largura cardíaca', original: 'cardiac width' },
  { arquivo: 'CA.png', nome: 'Ângulos costofrênicos', original: 'costophrenic angles' },
  { arquivo: 'Clav.png', nome: 'Clavículas', original: 'clavicles' },
]

const CICLO_MS = 2600

export function PreviaRaioX() {
  const [indice, setIndice] = useState(0)
  const [automatico, setAutomatico] = useState(true)
  const [basePronta, setBasePronta] = useState(false)
  const base = useRef<HTMLImageElement | null>(null)

  // Imagem vinda do cache dispara `load` antes da hidratação.
  useEffect(() => {
    if (base.current?.complete && base.current.naturalWidth > 0) setBasePronta(true)
  }, [])

  useEffect(() => {
    if (!automatico) return
    const relogio = window.setInterval(() => setIndice((i) => (i + 1) % DEMO.length), CICLO_MS)
    return () => window.clearInterval(relogio)
  }, [automatico])

  return (
    <figure className="m-0">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-white/10 bg-black sm:aspect-[4/4.4]">
        <span
          aria-hidden
          className={`rx-esqueleto pointer-events-none absolute inset-0 transition-opacity duration-500 ${
            basePronta ? 'opacity-0' : 'opacity-100'
          }`}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={base}
          src={urlFilme(`${PASTA}/thoraxPA.png`, 640, 72)}
          alt="Radiografia de tórax em incidência PA"
          draggable={false}
          decoding="async"
          onLoad={() => setBasePronta(true)}
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${
            basePronta ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {DEMO.map((item, posicao) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={item.arquivo}
            src={`${PASTA}/${item.arquivo}`}
            alt=""
            aria-hidden
            draggable={false}
            decoding="async"
            className={`pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${
              posicao === indice ? 'rx-pulso opacity-100' : 'opacity-0'
            }`}
          />
        ))}

        <CantosFilme />

        <span className="pointer-events-none absolute right-3 top-3 rounded border border-sky-300/25 bg-black/60 px-1.5 py-0.5 font-clinical text-[10px] font-bold tracking-widest text-sky-200/80">
          TÓRAX · PA
        </span>

        <div className="absolute inset-x-2 bottom-2 flex flex-wrap justify-center gap-1.5">
          {DEMO.map((item, posicao) => (
            <button
              key={item.arquivo}
              type="button"
              onClick={() => {
                setAutomatico(false)
                setIndice(posicao)
              }}
              aria-pressed={posicao === indice}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-bold backdrop-blur transition ${
                posicao === indice
                  ? 'border-sky-400/60 bg-sky-400/20 text-sky-100'
                  : 'border-white/15 bg-black/60 text-white/60 hover:text-white'
              }`}
            >
              {item.nome}
            </button>
          ))}
        </div>
      </div>

      <figcaption className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-white/55">
        <Target className="h-3 w-3 shrink-0" />
        <span>
          3 demarcações de 1 incidência. O atlas tem 28 incidências, cada estrutura com dossiê próprio.
        </span>
      </figcaption>
      <p className="mt-1 flex items-center justify-center gap-1.5 text-center text-[11px] text-sky-200/50">
        <MousePointerClick className="h-3 w-3 shrink-0" /> Toque num nome para acender a estrutura
      </p>
    </figure>
  )
}
