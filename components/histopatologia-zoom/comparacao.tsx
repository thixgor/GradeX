'use client'

import { useEffect, useRef, useState } from 'react'
import { Home, Link2, Link2Off, ZoomIn, ZoomOut } from 'lucide-react'
import type OpenSeadragon from 'openseadragon'

import { SinalDePatologia } from '@/components/histologia-zoom/sinal-de-patologia'
import { desenharMarcacao, vistaDaMarcacao } from '@/lib/histologia-zoom/desenho-de-marcacoes'
import { criarFonteDeTiles } from '@/lib/histologia-zoom/fonte-de-tiles'
import type { PiramideDaLamina } from '@/lib/histologia-zoom/tipos'
import type { MarcacaoExibida } from '@/lib/histopatologia-zoom/tipos'

export interface LadoDaComparacao {
  rotulo: string
  titulo: string
  subtitulo: string | null
  piramide: PiramideDaLamina
  /** Ampliação da objetiva no topo da pirâmide: é o que permite igualar o aumento dos dois lados. */
  ampliacaoMaxima: number
  marcacoes: MarcacaoExibida[]
  tom: 'patologico' | 'normal'
}

interface Controle {
  viewer: OpenSeadragon.Viewer
  OSD: typeof OpenSeadragon
  ampliacaoMaxima: number
}

/**
 * Lâmina doente ao lado da normal do mesmo órgão.
 *
 * Com "mesma ampliação" ligada, dar zoom de um lado leva o outro ao mesmo
 * aumento aparente (ampliação da objetiva × zoom da imagem) — o aluno compara
 * células do mesmo tamanho, não imagens do mesmo tamanho de tela. O
 * deslocamento é livre: os tecidos não se sobrepõem ponto a ponto.
 */
export function ComparacaoComNormal({ esquerda, direita }: { esquerda: LadoDaComparacao; direita: LadoDaComparacao }) {
  const [sincronizar, setSincronizar] = useState(true)
  const controles = useRef<Array<Controle | null>>([null, null])
  const sincronizarRef = useRef(sincronizar)
  sincronizarRef.current = sincronizar
  const emEcoRef = useRef(false)
  /** Lado em que o aluno mexeu por último: só ele comanda (a abertura e o eco não sincronizam). */
  const ativoRef = useRef<0 | 1 | null>(null)

  const aoZoom = (lado: 0 | 1) => {
    if (!sincronizarRef.current || emEcoRef.current || ativoRef.current !== lado) return
    const a = controles.current[lado]
    const b = controles.current[lado === 0 ? 1 : 0]
    if (!a || !b || !a.viewer.world.getItemCount() || !b.viewer.world.getItemCount()) return
    const ampliacao = a.viewer.viewport.viewportToImageZoom(a.viewer.viewport.getZoom()) * a.ampliacaoMaxima
    const alvo = b.viewer.viewport.imageToViewportZoom(ampliacao / b.ampliacaoMaxima)
    emEcoRef.current = true
    b.viewer.viewport.zoomTo(alvo, undefined, true)
    emEcoRef.current = false
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSincronizar((v) => !v)}
          aria-pressed={sincronizar}
          className={`inline-flex min-h-[40px] items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors ${
            sincronizar ? 'border-teal-600 bg-teal-600 text-white' : 'border-border bg-card hover:border-teal-500/50'
          }`}
        >
          {sincronizar ? <Link2 className="h-4 w-4" aria-hidden /> : <Link2Off className="h-4 w-4" aria-hidden />}
          Mesma ampliação nos dois lados
        </button>
        <p className="text-xs text-muted-foreground">
          {sincronizar
            ? 'O zoom de um lado leva o outro ao mesmo aumento; arraste cada lâmina livremente.'
            : 'Zoom independente em cada lado.'}
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <PainelComparativo
          lado={esquerda}
          onPronto={(c) => (controles.current[0] = c)}
          onZoom={() => aoZoom(0)}
          onInteragir={() => (ativoRef.current = 0)}
        />
        <PainelComparativo
          lado={direita}
          onPronto={(c) => (controles.current[1] = c)}
          onZoom={() => aoZoom(1)}
          onInteragir={() => (ativoRef.current = 1)}
        />
      </div>
    </div>
  )
}

function PainelComparativo({
  lado,
  onPronto,
  onZoom,
  onInteragir,
}: {
  lado: LadoDaComparacao
  onPronto: (c: Controle) => void
  onZoom: () => void
  onInteragir: () => void
}) {
  const palcoRef = useRef<HTMLDivElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const viewerRef = useRef<OpenSeadragon.Viewer | null>(null)
  const osdRef = useRef<typeof OpenSeadragon | null>(null)
  const [selecao, setSelecao] = useState<string>('')
  const selecaoRef = useRef(selecao)
  selecaoRef.current = selecao
  const onZoomRef = useRef(onZoom)
  onZoomRef.current = onZoom

  const redesenhar = () => {
    if (!svgRef.current || !viewerRef.current || !osdRef.current) return
    const m = lado.marcacoes.find((x) => x.id === selecaoRef.current)
    desenharMarcacao(svgRef.current, viewerRef.current, osdRef.current, m ? { ...m, nome: m.rotulo ?? m.verbete.nome } : null)
  }
  const redesenharRef = useRef(redesenhar)
  redesenharRef.current = redesenhar

  useEffect(() => {
    let cancelado = false
    import('openseadragon').then((mod) => {
      const OSD = (mod.default ?? mod) as typeof OpenSeadragon
      if (cancelado || !palcoRef.current) return
      osdRef.current = OSD
      const viewer = OSD({
        element: palcoRef.current,
        tileSources: [criarFonteDeTiles(OSD, lado.piramide)],
        drawer: 'canvas',
        crossOriginPolicy: 'Anonymous',
        showNavigationControl: false,
        showNavigator: true,
        navigatorPosition: 'BOTTOM_RIGHT',
        navigatorSizeRatio: 0.18,
        navigatorAutoFade: false,
        visibilityRatio: 0.35,
        minZoomImageRatio: 0.5,
        maxZoomPixelRatio: 1.5,
        zoomPerScroll: 1.25,
        animationTime: 0.6,
        imageLoaderLimit: 6,
        minPixelRatio: 0.55,
        placeholderFillStyle: '#0b0f0e',
        gestureSettingsMouse: { clickToZoom: false, dblClickToZoom: true, scrollToZoom: true },
        gestureSettingsTouch: { clickToZoom: false, dblClickToZoom: true, pinchRotate: false },
      } as unknown as OpenSeadragon.Options)
      viewerRef.current = viewer
      viewer.addHandler('update-viewport', () => redesenharRef.current())
      viewer.addHandler('zoom', () => onZoomRef.current())
      viewer.addHandler('open', () => {
        onPronto({ viewer, OSD, ampliacaoMaxima: lado.ampliacaoMaxima })
      })
    })
    return () => {
      cancelado = true
      viewerRef.current?.destroy()
      viewerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lado.piramide.base])

  const escolher = (id: string) => {
    setSelecao(id)
    selecaoRef.current = id
    const v = viewerRef.current
    const OSD = osdRef.current
    const m = lado.marcacoes.find((x) => x.id === id)
    if (v && OSD && m) {
      const [x0, y0, x1, y1] = vistaDaMarcacao(m, 0, lado.piramide.niveis.at(-1)?.largura)
      v.viewport.fitBoundsWithConstraints(new OSD.Rect(x0, y0, x1 - x0, y1 - y0))
    }
    redesenharRef.current()
  }

  const acao = (f: (v: OpenSeadragon.Viewer) => void) => () => viewerRef.current && f(viewerRef.current)
  const achados = lado.marcacoes.filter((m) => m.categoria === 'patologica')
  const normais = lado.marcacoes.filter((m) => m.categoria !== 'patologica')

  return (
    <section
      onPointerDownCapture={onInteragir}
      onWheelCapture={onInteragir}
      onTouchStartCapture={onInteragir}
      className={`overflow-hidden rounded-2xl border bg-card ${
        lado.tom === 'patologico' ? 'border-rose-500/40' : 'border-teal-500/40'
      }`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <div className="min-w-0">
          <p
            className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${
              lado.tom === 'patologico' ? 'text-rose-700 dark:text-rose-300' : 'text-teal-700 dark:text-teal-300'
            }`}
          >
            {lado.tom === 'patologico' && <SinalDePatologia className="h-3.5 w-3.5" />}
            {lado.rotulo}
          </p>
          <h2 className="truncate font-heading text-base font-semibold">
            {lado.titulo}
            {lado.subtitulo && <span className="font-normal text-muted-foreground"> — {lado.subtitulo}</span>}
          </h2>
        </div>
        {lado.marcacoes.length > 0 && (
          <label className="flex min-w-0 items-center gap-2 text-xs">
            <span className="sr-only">Mostrar marcação</span>
            <select
              value={selecao}
              onChange={(e) => escolher(e.target.value)}
              className="h-9 max-w-[260px] rounded-lg border border-border bg-background px-2 text-sm"
            >
              <option value="">Mostrar marcação…</option>
              {achados.length > 0 && (
                <optgroup label="Achados patológicos">
                  {achados.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.rotulo ?? m.verbete.nome}
                    </option>
                  ))}
                </optgroup>
              )}
              {normais.length > 0 && (
                <optgroup label="Histologia">
                  {normais.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.rotulo ?? m.verbete.nome}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>
        )}
      </header>
      <div className="relative h-[46vh] min-h-[300px] bg-[#0b0f0e] lg:h-[68vh]">
        <div ref={palcoRef} className="absolute inset-0" />
        <svg ref={svgRef} className="pointer-events-none absolute inset-0 z-[5] h-full w-full" aria-hidden />
        <div className="absolute bottom-3 left-3 z-10 flex gap-1 rounded-xl border border-white/10 bg-black/65 p-1 backdrop-blur-md">
          <BotaoDoPainel rotulo="Ampliar" onClick={acao((v) => v.viewport.zoomBy(1.6))}>
            <ZoomIn className="h-5 w-5" />
          </BotaoDoPainel>
          <BotaoDoPainel rotulo="Reduzir" onClick={acao((v) => v.viewport.zoomBy(1 / 1.6))}>
            <ZoomOut className="h-5 w-5" />
          </BotaoDoPainel>
          <BotaoDoPainel rotulo="Lâmina inteira" onClick={acao((v) => v.viewport.goHome())}>
            <Home className="h-5 w-5" />
          </BotaoDoPainel>
        </div>
      </div>
    </section>
  )
}

function BotaoDoPainel({ rotulo, onClick, children }: { rotulo: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      title={rotulo}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/85 transition-colors hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  )
}
