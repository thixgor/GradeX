'use client'

import { Home, Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react'
import type OpenSeadragon from 'openseadragon'
import { useEffect, useRef, useState } from 'react'

import { desenharMarcacao } from '@/lib/histologia-zoom/desenho-de-marcacoes'
import type { Marca } from '@/lib/histologia-zoom/estruturas/tipos'
import { criarFonteDeTiles } from '@/lib/histologia-zoom/fonte-de-tiles'
import type { PiramideDaLamina } from '@/lib/histologia-zoom/tipos'

/**
 * Visor do quiz: a lâmina sem nada que a identifique.
 *
 * Diferente do visualizador principal, não tem título, crédito, QR code,
 * captura nem link — tudo isso entregaria a resposta. As marcas são
 * desenhadas sem rótulo, e os tiles chegam por um proxy com endereço opaco.
 */
export function VisorDoQuiz({
  piramide,
  marcas,
  vista,
  chave,
}: {
  piramide: PiramideDaLamina
  marcas: Marca[]
  vista: [number, number, number, number] | null
  /** Muda a cada questão: reabre a lâmina e reenquadra. */
  chave: string
}) {
  const palcoRef = useRef<HTMLDivElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const raizRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<OpenSeadragon.Viewer | null>(null)
  const osdRef = useRef<typeof OpenSeadragon | null>(null)
  const [cheia, setCheia] = useState(false)

  useEffect(() => {
    let cancelado = false
    import('openseadragon').then((mod) => {
      const OSD = (mod.default ?? mod) as typeof OpenSeadragon
      if (cancelado || !palcoRef.current) return
      osdRef.current = OSD
      const viewer = OSD({
        element: palcoRef.current,
        tileSources: [],
        drawer: 'canvas',
        crossOriginPolicy: 'Anonymous',
        showNavigationControl: false,
        visibilityRatio: 0.35,
        minZoomImageRatio: 0.5,
        maxZoomPixelRatio: 1.5,
        zoomPerScroll: 1.25,
        animationTime: 0.8,
        imageLoaderLimit: 6,
        maxTilesPerFrame: 4,
        minPixelRatio: 0.55,
        placeholderFillStyle: '#0b0f0e',
        gestureSettingsMouse: { clickToZoom: false, dblClickToZoom: true, scrollToZoom: true },
        gestureSettingsTouch: { clickToZoom: false, dblClickToZoom: true, pinchRotate: false },
      } as unknown as OpenSeadragon.Options)
      viewerRef.current = viewer
      const redesenhar = () => {
        if (!svgRef.current || !viewerRef.current || !osdRef.current) return
        const m = marcasRef.current
        desenharMarcacao(
          svgRef.current,
          viewerRef.current,
          osdRef.current,
          m.length ? { id: 'q', estrutura: 'q', marcas: m, nome: '' } : null,
        )
      }
      redesenharRef.current = redesenhar
      viewer.addHandler('update-viewport', redesenhar)
      setPronto((v) => v + 1)
    })
    return () => {
      cancelado = true
      viewerRef.current?.destroy()
      viewerRef.current = null
    }
  }, [])

  const marcasRef = useRef<Marca[]>(marcas)
  marcasRef.current = marcas
  const redesenharRef = useRef<() => void>(() => {})
  const [pronto, setPronto] = useState(0)

  // Abre a lâmina de cada questão.
  useEffect(() => {
    const viewer = viewerRef.current
    const OSD = osdRef.current
    if (!viewer || !OSD) return
    viewer.world.removeAll()
    viewer.addTiledImage({
      tileSource: criarFonteDeTiles(OSD, piramide),
      success: () => {
        if (vista) {
          const [x0, y0, x1, y1] = vista
          viewer.viewport.fitBoundsWithConstraints(new OSD.Rect(x0, y0, x1 - x0, y1 - y0), true)
        } else {
          viewer.viewport.goHome(true)
        }
        redesenharRef.current()
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, pronto])

  useEffect(() => {
    document.body.style.overflow = cheia ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [cheia])

  const acao = (f: (v: OpenSeadragon.Viewer, OSD: typeof OpenSeadragon) => void) => () => {
    if (viewerRef.current && osdRef.current) f(viewerRef.current, osdRef.current)
  }

  const voltarAMarca = acao((v, OSD) => {
    if (vista) {
      const [x0, y0, x1, y1] = vista
      v.viewport.fitBoundsWithConstraints(new OSD.Rect(x0, y0, x1 - x0, y1 - y0))
    } else v.viewport.goHome()
  })

  return (
    <div
      ref={raizRef}
      className={
        cheia
          ? 'fixed inset-0 z-[80] bg-[#0b0f0e]'
          : 'relative h-[58vh] min-h-[320px] overflow-hidden rounded-xl border border-border bg-[#0b0f0e] sm:h-[64vh]'
      }
    >
      <div ref={palcoRef} className="absolute inset-0" />
      <svg ref={svgRef} className="pointer-events-none absolute inset-0 z-[5] h-full w-full" aria-hidden />
      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1 rounded-xl border border-white/10 bg-black/65 p-1 backdrop-blur-md">
        <Botao rotulo="Ampliar" onClick={acao((v) => v.viewport.zoomBy(1.6))}>
          <ZoomIn className="h-5 w-5" />
        </Botao>
        <Botao rotulo="Reduzir" onClick={acao((v) => v.viewport.zoomBy(1 / 1.6))}>
          <ZoomOut className="h-5 w-5" />
        </Botao>
        <Botao rotulo={vista ? 'Voltar à marcação' : 'Lâmina inteira'} onClick={voltarAMarca}>
          <Home className="h-5 w-5" />
        </Botao>
        <Botao rotulo={cheia ? 'Sair da tela cheia' : 'Tela cheia'} onClick={() => setCheia((c) => !c)}>
          {cheia ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </Botao>
      </div>
    </div>
  )
}

function Botao({ rotulo, onClick, children }: { rotulo: string; onClick: () => void; children: React.ReactNode }) {
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
