'use client'

import { useRef, useState } from 'react'
import { PanelRightClose, PanelRightOpen, Tags } from 'lucide-react'

import type { MarcacaoExibida } from '@/lib/histopatologia-zoom/tipos'

import { SinalDePatologia } from './sinal-de-patologia'

import { CatalogoDeEstruturas } from './estruturas'
import { Visualizador, type LaminaDoVisualizador, type Vizinha } from './visualizador'

/**
 * Visualizador + catálogo de estruturas ao lado.
 *
 * O catálogo mora na lateral (desktop) ou logo abaixo (celular), recolhível. A
 * seleção é única e compartilhada: escolher uma estrutura aqui ou no painel do
 * visualizador em tela cheia leva ao mesmo lugar da lâmina.
 */
export function LaminaInterativa({
  lamina,
  caracteristicas,
  urlDaLamina,
  anterior,
  proxima,
  estruturas,
  selecionada: selecionadaExterna,
  onSelecionar,
  visualizadorRef: refExterna,
}: {
  lamina: LaminaDoVisualizador
  caracteristicas: React.ReactNode
  urlDaLamina: string
  anterior: Vizinha | null
  proxima: Vizinha | null
  estruturas: MarcacaoExibida[]
  /** Seleção controlada por fora (Histopatologia: a lista de achados abaixo também seleciona). */
  selecionada?: string | null
  onSelecionar?: (id: string | null) => void
  visualizadorRef?: React.MutableRefObject<HTMLDivElement | null>
}) {
  const [selecaoInterna, setSelecaoInterna] = useState<string | null>(null)
  const selecionada = selecionadaExterna !== undefined ? selecionadaExterna : selecaoInterna
  const [lateralAberta, setLateralAberta] = useState(true)
  const refInterna = useRef<HTMLDivElement | null>(null)
  const visualizadorRef = refExterna ?? refInterna
  const temEstruturas = estruturas.length > 0
  const patologica = estruturas.some((e) => e.categoria === 'patologica')
  const total = new Set(estruturas.map((e) => `${e.categoria ?? ''}:${e.estrutura}`)).size
  const achados = new Set(estruturas.filter((e) => e.categoria === 'patologica').map((e) => e.estrutura)).size

  const selecionar = (id: string | null) => {
    if (onSelecionar) onSelecionar(id)
    else setSelecaoInterna(id)
    // No celular o catálogo fica abaixo da lâmina: rola até ela para mostrar a marcação.
    if (id && visualizadorRef.current && window.matchMedia('(max-width: 1023px)').matches) {
      visualizadorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const visualizador = (
    <Visualizador
      lamina={lamina}
      caracteristicas={caracteristicas}
      urlDaLamina={urlDaLamina}
      anterior={anterior}
      proxima={proxima}
      estruturas={estruturas}
      estruturaSelecionada={selecionada}
      onSelecionarEstrutura={selecionar}
    />
  )

  if (!temEstruturas) return visualizador

  return (
    <div className={`grid gap-4 ${lateralAberta ? 'lg:grid-cols-[minmax(0,1fr)_360px]' : ''}`}>
      <div ref={visualizadorRef} className="relative min-w-0">
        {visualizador}
        {!lateralAberta && (
          <button
            type="button"
            onClick={() => setLateralAberta(true)}
            className="absolute -top-11 right-0 hidden items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold shadow-sm hover:border-cyan-500/50 lg:inline-flex"
          >
            <PanelRightOpen className="h-4 w-4" aria-hidden /> {patologica ? 'Achados' : 'Estruturas'} ({total})
          </button>
        )}
      </div>

      {lateralAberta && (
        <aside
          aria-labelledby="titulo-estruturas"
          className="flex min-h-0 flex-col rounded-2xl border border-border bg-card lg:max-h-[72vh] lg:min-h-[460px]"
        >
          <header className="flex items-center justify-between gap-2 border-b border-border px-3.5 py-3">
            <div className="min-w-0">
              <h2 id="titulo-estruturas" className="flex items-center gap-2 font-heading text-base font-semibold">
                {patologica ? (
                  <SinalDePatologia className="h-4 w-4" />
                ) : (
                  <Tags className="h-4 w-4 text-cyan-600 dark:text-cyan-300" aria-hidden />
                )}
                {patologica ? 'Marcações desta lâmina' : 'Estruturas desta lâmina'}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {patologica
                  ? `${achados} ${achados === 1 ? 'achado patológico' : 'achados patológicos'} e ${total - achados} ${total - achados === 1 ? 'estrutura normal' : 'estruturas normais'} · toque para ver na lâmina`
                  : `${total} ${total === 1 ? 'estrutura marcada' : 'estruturas marcadas'} · toque para ver na lâmina`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLateralAberta(false)}
              aria-label="Recolher catálogo de estruturas"
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground lg:inline-flex"
            >
              <PanelRightClose className="h-4 w-4" aria-hidden />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
            <CatalogoDeEstruturas estruturas={estruturas} selecionada={selecionada} onSelecionar={selecionar} />
          </div>
        </aside>
      )}
    </div>
  )
}
