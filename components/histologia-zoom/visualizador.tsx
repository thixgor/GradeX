'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type OpenSeadragon from 'openseadragon'
import { QRCodeSVG } from 'qrcode.react'
import {
  ArrowDownRight,
  Bookmark,
  Camera,
  ChevronLeft,
  ChevronRight,
  Circle,
  Crosshair,
  FlipHorizontal,
  Home,
  Info,
  Keyboard,
  Loader2,
  Map as IconeMapa,
  Maximize,
  Minimize,
  MousePointer2,
  RotateCcw,
  QrCode,
  RotateCw,
  Settings2,
  Share2,
  SlidersHorizontal,
  Tags,
  Trash2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'

import { exitAppFullscreen, onFullscreenChange, requestAppFullscreen } from '@/lib/fullscreen'
import type { CategoriaDeOrigem } from '@/lib/histologia-zoom/especies'
import { MARCA_DO_ACERVO, creditoDaLamina, linhaDeCredito } from '@/lib/histologia-zoom/fonte'
import { criarFonteDeTiles, type AjusteDeNitidez } from '@/lib/histologia-zoom/fonte-de-tiles'
import {
  LIMITE_POR_QUALIDADE,
  PreCarregador,
  escalasDosNiveis,
  fatorDeNitidez,
  proximoNivel,
  razaoMaximaDeZoom,
  tamanhoDoCache,
  tilesDoRetangulo,
} from '@/lib/histologia-zoom/nitidez'
import {
  ANGULO_PADRAO,
  ORDEM_DAS_CORES,
  anguloNaLamina,
  anguloNaTela,
  carregarSetas,
  desenharSetaNoCanvas,
  normalizarAngulo,
  salvarSetas,
  type SetaMarcada,
} from '@/lib/histologia-zoom/setas'
import {
  COR_DA_LUZ,
  IMAGEM_ORIGINAL,
  PADRAO,
  PREDEFINICOES,
  carregarMarcadores,
  carregarPreferencias,
  codificarPosicao,
  decodificarPosicao,
  filtroCss,
  imagemAlterada,
  salvarMarcadores,
  salvarPreferencias,
  type Indicador,
  type Marcador,
  type Preferencias,
} from '@/lib/histologia-zoom/preferencias'
import type { CreditoDaImagem, FonteDaLamina, PiramideDaLamina } from '@/lib/histologia-zoom/tipos'
import type { EstruturaMarcada } from '@/lib/histologia-zoom/estruturas/tipos'
import { desenharMarcacao, paradasDaMarcacao, vistaDaMarcacao } from '@/lib/histologia-zoom/desenho-de-marcacoes'

import { Alternador, BotaoDeFerramenta, Deslizador, Folha, Separador } from './controles'
import { AmostraDeCor, ESTILO_DAS_SETAS, PonteiroDaOcular, criarElementoDeSeta } from './setas'
import { CatalogoDeEstruturas } from './estruturas'

/**
 * Visualizador de lâminas com zoom profundo.
 *
 * ## Motor
 *
 * OpenSeadragon com uma fonte de tiles própria para a pirâmide do HistoViewer
 * (ver `lib/histologia-zoom/fonte-de-tiles.ts`). Ele resolve o que o
 * visualizador de origem fazia mal: zoom contínuo (e não em degraus fixos),
 * pinça e arrasto com inércia no toque, rotação, carregamento progressivo do
 * nível certo para a tela e para a densidade de pixels do aparelho.
 *
 * ## Uma camada, várias lentes
 *
 * Filtros de imagem (brilho, contraste, saturação…) são CSS aplicados ao
 * palco do OpenSeadragon; ocular, retícula e luz são camadas irmãs acima dele,
 * com `pointer-events: none`. Nada disso toca nos tiles — por isso trocar um
 * ajuste é instantâneo, mesmo em 60×.
 *
 * ## Tela cheia
 *
 * A Fullscreen API recebe a raiz inteira do componente: marca, QR code, nome
 * da lâmina e o painel de características estão dentro dela. No iPhone, onde
 * `requestFullscreen` não existe para `<div>`, cai para um modo imersivo em
 * CSS (`fixed inset-0`), com o mesmo conteúdo — ver `lib/fullscreen.ts`.
 *
 * Trocar de lâmina não desmonta o componente: a mesma instância reabre a nova
 * pirâmide, e por isso a tela cheia sobrevive à navegação entre lâminas.
 *
 * ## Rolagem da página
 *
 * No PC, a roda do mouse amplia (pedido explícito). Em tela de toque, fora da
 * tela cheia, um dedo rola a página e dois dedos movem a lâmina — os "gestos
 * cooperativos" do OpenSeadragon, os mesmos do Google Maps. Sem isso, um
 * visualizador de 60 % da altura prende o polegar e a página deixa de rolar. A
 * preferência pode ser invertida no painel de navegação.
 */

export interface LaminaDoVisualizador {
  slug: string
  titulo: string
  subtitulo: string | null
  coloracao: string
  especie: string
  categoriaDeOrigem: CategoriaDeOrigem
  fonte: FonteDaLamina
  credito: CreditoDaImagem | null
  objetiva: string
  ampliacaoMaxima: number
  piramide: PiramideDaLamina
}

export interface Vizinha {
  href: string
  rotulo: string
}

type Painel = null | 'caracteristicas' | 'estruturas' | 'ajustes' | 'navegacao' | 'marcacoes' | 'atalhos'
type TelaCheia = 'nao' | 'nativa' | 'css'

const OBJETIVAS = [1, 2, 4, 10, 20, 40, 60, 100]

export function Visualizador({
  lamina,
  caracteristicas,
  urlDaLamina,
  anterior,
  proxima,
  estruturas = [],
  estruturaSelecionada,
  onSelecionarEstrutura,
  logoDoManual = '/img/histologia/logo-manual-da-histologia.svg',
}: {
  lamina: LaminaDoVisualizador
  /** Ficha de características renderizada no servidor. */
  caracteristicas: React.ReactNode
  /** URL absoluta e canônica da lâmina (QR code e compartilhamento). */
  urlDaLamina: string
  anterior: Vizinha | null
  proxima: Vizinha | null
  /** Estruturas marcadas nesta lâmina (catálogo). */
  estruturas?: EstruturaMarcada[]
  /** Controlado pelo pai (catálogo lateral da página); sem ele, o visualizador guarda o estado. */
  estruturaSelecionada?: string | null
  onSelecionarEstrutura?: (id: string | null) => void
  logoDoManual?: string
}) {
  const router = useRouter()
  const raizRef = useRef<HTMLDivElement | null>(null)
  const palcoRef = useRef<HTMLDivElement | null>(null)
  const minimapaRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<OpenSeadragon.Viewer | null>(null)
  const osdRef = useRef<typeof OpenSeadragon | null>(null)
  const slugAbertoRef = useRef<string | null>(null)
  const tempoUrlRef = useRef<number | null>(null)
  const telaCheiaRef = useRef<TelaCheia>('nao')
  // Nitidez: o fator é lido pela fonte de tiles a cada quadro (ver lib/histologia-zoom/nitidez.ts).
  const ajusteRef = useRef<AjusteDeNitidez>({ fator: 1 })
  const escalasRef = useRef<number[]>([])
  const piramideRef = useRef<PiramideDaLamina>(lamina.piramide)
  const preCarregadorRef = useRef<PreCarregador | null>(null)
  const tempoPreCargaRef = useRef<number | null>(null)
  const prefsRef = useRef<Preferencias>(PADRAO)
  // Setas: o clique no palco é tratado dentro de um handler do OpenSeadragon, criado uma vez.
  const modoSetaRef = useRef(false)
  const ultimoCliqueRef = useRef<{ t: number; x: number; y: number } | null>(null)
  const adicionarSetaRef = useRef<(x: number, y: number) => void>(() => {})
  const atualizarNitidezRef = useRef<() => void>(() => {})
  const camadaRef = useRef<SVGSVGElement | null>(null)
  const marcacaoAtivaRef = useRef<(EstruturaMarcada & { nome: string }) | null>(null)
  const desenharRef = useRef<() => void>(() => {})

  const [prefs, setPrefs] = useState<Preferencias>(PADRAO)
  const [prefsCarregadas, setPrefsCarregadas] = useState(false)
  const [painel, setPainel] = useState<Painel>(null)
  const [telaCheia, setTelaCheia] = useState<TelaCheia>('nao')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)
  const [ampliacao, setAmpliacao] = useState(0)
  const [faixa, setFaixa] = useState({ min: 0, max: 1, posicao: 0 })
  const [rotacao, setRotacao] = useState(0)
  const [espelhado, setEspelhado] = useState(false)
  const [qrVisivel, setQrVisivel] = useState(true)
  const [posicaoCodificada, setPosicaoCodificada] = useState<string | null>(null)
  const [marcadores, setMarcadores] = useState<Marcador[]>([])
  const [nomeDoMarcador, setNomeDoMarcador] = useState('')
  const [aviso, setAviso] = useState<string | null>(null)
  const [palco, setPalco] = useState({ largura: 0, altura: 0 })
  const [toque, setToque] = useState(false)
  const [refinando, setRefinando] = useState(false)
  const [setas, setSetas] = useState<SetaMarcada[]>([])
  const [modoSeta, setModoSeta] = useState(false)
  const [setaEmEdicao, setSetaEmEdicao] = useState<string | null>(null)
  const [selecaoInterna, setSelecaoInterna] = useState<string | null>(null)
  const selecao = estruturaSelecionada !== undefined ? estruturaSelecionada : selecaoInterna
  /** Qual das marcas da estrutura selecionada está enquadrada (setas espalhadas). */
  const [parada, setParada] = useState(0)
  useEffect(() => setParada(0), [selecao])
  const marcacaoSelecionada = estruturas.find((e) => e.id === selecao) ?? null
  const totalDeParadas = marcacaoSelecionada ? paradasDaMarcacao(marcacaoSelecionada) : 1
  const selecionarEstrutura = useCallback(
    (id: string | null) => {
      if (onSelecionarEstrutura) onSelecionarEstrutura(id)
      else setSelecaoInterna(id)
    },
    [onSelecionarEstrutura],
  )
  /** Sobe quando o OpenSeadragon fica pronto (ou é recriado): os efeitos que dependem dele reagem. */
  const [versao, setVersao] = useState(0)
  // A primeira lâmina aberta é a única que pode herdar a posição do link.
  const slugInicialRef = useRef(lamina.slug)

  const emTelaCheia = telaCheia !== 'nao'
  const topo = lamina.ampliacaoMaxima

  // ─── Preferências (navegador) ────────────────────────────────────────────
  useEffect(() => {
    setPrefs(carregarPreferencias())
    setPrefsCarregadas(true)
    setToque(window.matchMedia('(pointer: coarse)').matches)
    // No celular o QR é para o outro: começa escondido.
    if (window.matchMedia('(max-width: 640px)').matches) setQrVisivel(false)
  }, [])

  useEffect(() => {
    if (prefsCarregadas) salvarPreferencias(prefs)
  }, [prefs, prefsCarregadas])

  useEffect(() => {
    setMarcadores(carregarMarcadores(lamina.slug))
    setSetas(carregarSetas(lamina.slug))
    setSetaEmEdicao(null)
  }, [lamina.slug])

  useEffect(() => {
    prefsRef.current = prefs
  }, [prefs])

  useEffect(() => {
    modoSetaRef.current = modoSeta
  }, [modoSeta])

  const mostrarAviso = useCallback((texto: string) => {
    setAviso(texto)
    window.setTimeout(() => setAviso((atual) => (atual === texto ? null : atual)), 2600)
  }, [])

  // ─── Leitura do viewport ─────────────────────────────────────────────────
  const lerViewport = useCallback(() => {
    const viewer = viewerRef.current
    if (!viewer || !viewer.world.getItemCount()) return
    const vp = viewer.viewport
    const z = vp.getZoom(true)
    const min = vp.getMinZoom()
    const max = vp.getMaxZoom()
    setAmpliacao(vp.viewportToImageZoom(z) * topo)
    setFaixa({ min, max, posicao: Math.log(z / min) / Math.log(max / min) })
  }, [topo])

  const posicaoAtual = useCallback((): string | null => {
    const viewer = viewerRef.current
    if (!viewer || !viewer.world.getItemCount()) return null
    const vp = viewer.viewport
    const c = vp.getCenter(false)
    return codificarPosicao({ x: c.x, y: c.y, z: vp.getZoom(false), r: vp.getRotation() })
  }, [])

  const agendarUrl = useCallback(() => {
    if (tempoUrlRef.current) window.clearTimeout(tempoUrlRef.current)
    tempoUrlRef.current = window.setTimeout(() => {
      const v = posicaoAtual()
      if (!v) return
      setPosicaoCodificada(v)
      try {
        // Montado à mão: `searchParams.set` codificaria as vírgulas (%2C) e o
        // link compartilhado ficaria ilegível.
        const url = new URL(window.location.href)
        url.searchParams.delete('v')
        const base = url.toString()
        window.history.replaceState(window.history.state, '', `${base}${url.search ? '&' : '?'}v=${v}`)
      } catch {
        // URL não gravável (iframe restrito): a posição só não fica no link.
      }
    }, 450)
  }, [posicaoAtual])

  // ─── Criação do OpenSeadragon (uma vez) ──────────────────────────────────
  useEffect(() => {
    let cancelado = false
    let quadro = 0

    import('openseadragon').then((mod) => {
      const OSD = (mod.default ?? mod) as typeof OpenSeadragon
      if (cancelado || !palcoRef.current || !minimapaRef.current) return
      osdRef.current = OSD
      OSD.setString('GestureHints.Touch', 'Use dois dedos para mover e ampliar a lâmina')
      OSD.setString('GestureHints.Scroll', 'Use {0} + rolagem para ampliar')

      const p = carregarPreferencias()
      const viewer = OSD({
        element: palcoRef.current,
        tileSources: [],
        drawer: 'canvas',
        crossOriginPolicy: 'Anonymous',
        showNavigationControl: false,
        showNavigator: true,
        navigatorElement: minimapaRef.current,
        navigatorAutoFade: false,
        navigatorBackground: '#050706',
        navigatorOpacity: 1,
        navigatorBorderColor: 'rgba(255,255,255,0.18)',
        navigatorDisplayRegionColor: '#5eead4',
        visibilityRatio: 0.35,
        minZoomImageRatio: 0.5,
        // Padrão: para na resolução real do scan (1 pixel do scan por pixel CSS).
        maxZoomPixelRatio: razaoMaximaDeZoom(p.navegacao.zoomDigital, window.devicePixelRatio || 1),
        zoomPerScroll: p.navegacao.zoomPorRolagem,
        zoomPerClick: 2,
        animationTime: p.navegacao.animacao,
        springStiffness: 8,
        blendTime: 0.15,
        // O servidor de tiles fala HTTP/1.1: 6 conexões por host. Pedir mais só
        // enfileira no navegador; a pré-carga usa as sobras com prioridade baixa.
        imageLoaderLimit: 6,
        // O padrão do OpenSeadragon é 1 tile novo por quadro — lento para
        // pirâmides com tiles de 384–400 px em telas grandes.
        maxTilesPerFrame: window.matchMedia('(pointer: coarse)').matches ? 2 : 4,
        maxImageCacheCount: tamanhoDoCache(),
        smoothTileEdgesMinZoom: 1.1,
        // Com o fator de nitidez, o nível seguinte ao necessário fica com razão
        // aparente ≈ 1,02 / salto (0,51 num salto de 2×). No limiar padrão de
        // 0,5 o OpenSeadragon o baixaria inteiro para a vista, sem mostrá-lo.
        // Em 0,55 ele fica de fora, e a pré-carga ociosa (centro primeiro,
        // prioridade baixa, com teto) cuida de antecipá-lo.
        minPixelRatio: 0.55,
        placeholderFillStyle: '#0b0f0e',
        gestureSettingsMouse: {
          clickToZoom: false,
          dblClickToZoom: p.navegacao.duploCliqueAmplia,
          scrollToZoom: true,
          flickEnabled: true,
        },
        gestureSettingsTouch: {
          clickToZoom: false,
          dblClickToZoom: true,
          pinchRotate: true,
          flickEnabled: true,
        },
        gestureSettingsPen: { clickToZoom: false },
      } as unknown as OpenSeadragon.Options)
      viewerRef.current = viewer
      preCarregadorRef.current = new PreCarregador(2)

      // Interpolação de alta qualidade. O drawer de canvas liga a suavização mas
      // deixa `imageSmoothingQuality` em 'low' (bilinear), que serrilha e cria
      // moiré ao reduzir um tile mais de 2×. O método é chamado de novo a cada
      // redimensionamento do canvas (que zera o estado do contexto).
      const refinarDesenho = (alvo: unknown) => {
        const drawer = alvo as {
          context?: CanvasRenderingContext2D | null
          _updateImageSmoothingEnabled?: (ctx: CanvasRenderingContext2D) => void
        } | null
        const original = drawer?._updateImageSmoothingEnabled
        if (!drawer || typeof original !== 'function') return
        drawer._updateImageSmoothingEnabled = (ctx) => {
          original.call(drawer, ctx)
          if (ctx) ctx.imageSmoothingQuality = 'high'
        }
        if (drawer.context) drawer._updateImageSmoothingEnabled(drawer.context)
      }
      refinarDesenho(viewer.drawer)
      refinarDesenho((viewer as unknown as { navigator?: { drawer?: unknown } }).navigator?.drawer)

      const densidade = () =>
        (OSD as unknown as { pixelDensityRatio?: number }).pixelDensityRatio || window.devicePixelRatio || 1
      const pixelsDeTelaPorPixelDoTopo = () => {
        const v = viewer.viewport
        // O mais exigente entre o zoom atual e o de destino: ao ampliar, o nível
        // fino começa a vir antes de a animação terminar.
        const z = Math.max(v.getZoom(true), v.getZoom(false))
        return v.viewportToImageZoom(z) * densidade()
      }
      const atualizarNitidez = () => {
        if (!viewer.world.getItemCount() || !escalasRef.current.length) return
        const limite = LIMITE_POR_QUALIDADE[prefsRef.current.navegacao.qualidade]
        const fator = fatorDeNitidez(escalasRef.current, pixelsDeTelaPorPixelDoTopo(), limite)
        if (Math.abs(fator - ajusteRef.current.fator) > 0.005) {
          ajusteRef.current.fator = fator
          viewer.forceRedraw()
        }
      }
      const agendarPreCarga = () => {
        if (tempoPreCargaRef.current) window.clearTimeout(tempoPreCargaRef.current)
        tempoPreCargaRef.current = window.setTimeout(() => {
          const pre = preCarregadorRef.current
          const conexao = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
          if (!pre || !viewer.world.getItemCount() || conexao?.saveData) return
          const q = prefsRef.current.navegacao.qualidade
          if (q === 'economia') return
          const v = viewer.viewport
          const r = v.viewportToImageRectangle(v.getBounds(true))
          const indice = proximoNivel(escalasRef.current, pixelsDeTelaPorPixelDoTopo(), LIMITE_POR_QUALIDADE[q])
          if (indice === null) return
          const limite = window.matchMedia('(pointer: coarse)').matches ? 24 : 48
          pre.agendar(
            tilesDoRetangulo(
              piramideRef.current,
              indice,
              { x: r.x, y: r.y, largura: r.width, altura: r.height },
              0.1,
              limite,
            ),
          )
        }, 450)
      }
      atualizarNitidezRef.current = atualizarNitidez

      const agendarLeitura = () => {
        cancelAnimationFrame(quadro)
        quadro = requestAnimationFrame(lerViewport)
      }
      viewer.addHandler('viewport-change', atualizarNitidez)
      viewer.addHandler('update-viewport', () => desenharRef.current())
      viewer.addHandler('animation', agendarLeitura)
      viewer.addHandler('resize', () => {
        atualizarNitidez()
        agendarLeitura()
      })
      viewer.addHandler('animation-start', () => preCarregadorRef.current?.cancelar())
      viewer.addHandler('fully-loaded-change', (e) => {
        const completo = (e as unknown as { fullyLoaded: boolean }).fullyLoaded
        setRefinando(!completo)
        if (completo) agendarPreCarga()
      })
      viewer.addHandler('canvas-click', (e) => {
        if (!modoSetaRef.current || !e.quick) return
        e.preventDefaultAction = true
        // Duplo clique no modo seta não crava duas setas no mesmo lugar.
        const agora = Date.now()
        const ultimo = ultimoCliqueRef.current
        const bruto = e.position as OpenSeadragon.Point
        if (ultimo && agora - ultimo.t < 350 && Math.hypot(ultimo.x - bruto.x, ultimo.y - bruto.y) < 12) return
        ultimoCliqueRef.current = { t: agora, x: bruto.x, y: bruto.y }
        // Com a lâmina espelhada, o canvas é invertido na tela mas
        // pointFromPixel não sabe disso: desfaz o espelho antes de converter.
        const pos = viewer.viewport.getFlip()
          ? new OSD.Point(viewer.viewport.getContainerSize().x - bruto.x, bruto.y)
          : bruto
        const ponto = viewer.viewport.pointFromPixel(pos)
        adicionarSetaRef.current(ponto.x, ponto.y)
      })
      viewer.addHandler('animation-finish', () => {
        agendarLeitura()
        agendarUrl()
      })
      viewer.addHandler('rotate', () => setRotacao(viewer.viewport.getRotation()))
      viewer.addHandler('open-failed', () => {
        setErro(true)
        setCarregando(false)
      })
      viewer.addHandler('tile-drawn', () => setCarregando(false))
      viewer.addHandler('canvas-key', (e) => {
        // F e R são atalhos nossos (tela cheia, rotação com estado na interface).
        const codigo = (e.originalEvent as KeyboardEvent).code
        if (codigo === 'KeyF' || codigo === 'KeyR') e.preventDefaultAction = true
      })
      viewer.addHandler('open', () => {
        const v = decodificarPosicao(new URLSearchParams(window.location.search).get('v'))
        if (v && slugAbertoRef.current === slugInicialRef.current) {
          viewer.viewport.setRotation(v.r, true)
          viewer.viewport.zoomTo(v.z, undefined, true)
          viewer.viewport.panTo(new OSD.Point(v.x, v.y), true)
        }
        setRotacao(viewer.viewport.getRotation())
        setEspelhado(viewer.viewport.getFlip())
        atualizarNitidez()
        agendarLeitura()
        agendarUrl()
      })

      setVersao((n) => n + 1)
    })

    return () => {
      cancelado = true
      cancelAnimationFrame(quadro)
      if (tempoPreCargaRef.current) window.clearTimeout(tempoPreCargaRef.current)
      preCarregadorRef.current?.cancelar()
      viewerRef.current?.destroy()
      viewerRef.current = null
    }
    // A instância é criada uma vez; as dependências abaixo são estáveis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Abrir / trocar a lâmina ─────────────────────────────────────────────
  useEffect(() => {
    const viewer = viewerRef.current
    const OSD = osdRef.current
    if (!viewer || !OSD) return
    if (slugAbertoRef.current === lamina.slug) return
    slugAbertoRef.current = lamina.slug
    setCarregando(true)
    setErro(false)
    piramideRef.current = lamina.piramide
    escalasRef.current = escalasDosNiveis(lamina.piramide)
    ajusteRef.current.fator = 1
    preCarregadorRef.current?.cancelar()
    viewer.open(
      criarFonteDeTiles(OSD, lamina.piramide, ajusteRef.current) as unknown as OpenSeadragon.TileSourceSpecifier,
    )
  }, [lamina.slug, lamina.piramide, versao])

  // ─── Preferências aplicadas ao vivo ──────────────────────────────────────
  useEffect(() => {
    const viewer = viewerRef.current as unknown as Record<string, any> | null
    if (!viewer) return
    viewer.zoomPerScroll = prefs.navegacao.zoomPorRolagem
    // No modo seta, o duplo clique cravaria duas setas e ainda ampliaria.
    viewer.gestureSettingsMouse.dblClickToZoom = prefs.navegacao.duploCliqueAmplia && !modoSeta
    viewer.gestureSettingsTouch.dblClickToZoom = !modoSeta
    const vp = viewer.viewport
    for (const mola of [vp.centerSpringX, vp.centerSpringY, vp.zoomSpring]) {
      if (mola) mola.animationTime = prefs.navegacao.animacao
    }
    vp.maxZoomPixelRatio = razaoMaximaDeZoom(prefs.navegacao.zoomDigital, window.devicePixelRatio || 1)
    vp.applyConstraints()
    atualizarNitidezRef.current()
  }, [prefs.navegacao, modoSeta, versao])

  useEffect(() => {
    const viewer = viewerRef.current as unknown as { setCooperativeGestures?: (v: boolean) => void } | null
    viewer?.setCooperativeGestures?.(toque && !emTelaCheia && prefs.navegacao.umDedo === 'pagina')
  }, [toque, emTelaCheia, prefs.navegacao.umDedo, versao])

  // ─── Tamanho do palco (para a ocular) ────────────────────────────────────
  useEffect(() => {
    const el = palcoRef.current
    if (!el) return
    // Medida inicial imediata: o ResizeObserver só dispara no ciclo de
    // renderização, e a ocular/seta ficariam invisíveis até lá.
    const inicial = el.getBoundingClientRect()
    setPalco({ largura: inicial.width, altura: inicial.height })
    const ro = new ResizeObserver(([entrada]) => {
      const r = entrada.contentRect
      setPalco({ largura: r.width, altura: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ─── Marcações sobre a lâmina: pinos dos pontos salvos e setas cravadas ──
  useEffect(() => {
    const viewer = viewerRef.current
    const OSD = osdRef.current
    if (!viewer || !OSD) return
    viewer.clearOverlays()
    marcadores.forEach((m, i) => {
      const pino = document.createElement('div')
      pino.className = 'hz-pino'
      pino.textContent = String(i + 1)
      pino.title = m.nome
      viewer.addOverlay({ element: pino, location: new OSD.Point(m.x, m.y), placement: OSD.Placement.CENTER })
    })
    setas.forEach((seta, i) => {
      const elemento = criarElementoDeSeta(seta, {
        numero: i + 1,
        tamanho: prefs.setas.tamanho,
        mostrarRotulo: prefs.setas.rotulos,
        destacada: seta.id === setaEmEdicao,
        rotacao,
        espelhado,
      })
      viewer.addOverlay({
        element: elemento,
        location: new OSD.Point(seta.x, seta.y),
        placement: OSD.Placement.TOP_LEFT,
        checkResize: false,
      } as unknown as OpenSeadragon.OverlayOptions)
    })
  }, [marcadores, setas, prefs.setas, setaEmEdicao, rotacao, espelhado, versao, lamina.slug])

  // ─── Estrutura selecionada: enquadrar e desenhar a marcação ─────────────
  useEffect(() => {
    const viewer = viewerRef.current
    const OSD = osdRef.current
    const alvo = estruturas.find((e) => e.id === selecao) ?? null
    marcacaoAtivaRef.current = alvo ? { ...alvo, nome: alvo.rotulo ?? alvo.verbete.nome } : null
    desenharRef.current = () => {
      if (camadaRef.current && viewerRef.current && osdRef.current) {
        desenharMarcacao(camadaRef.current, viewerRef.current, osdRef.current, marcacaoAtivaRef.current)
      }
    }
    desenharRef.current()
    if (!viewer || !OSD || !alvo || !viewer.world.getItemCount()) return
    const [x0, y0, x1, y1] = vistaDaMarcacao(alvo, parada, lamina.piramide.niveis.at(-1)?.largura)
    viewer.viewport.fitBoundsWithConstraints(new OSD.Rect(x0, y0, x1 - x0, y1 - y0))
  }, [selecao, estruturas, versao, parada])

  // ─── Tela cheia ──────────────────────────────────────────────────────────
  useEffect(
    () =>
      onFullscreenChange((ativo) => {
        setTelaCheia((atual) => (ativo ? 'nativa' : atual === 'nativa' ? 'nao' : atual))
      }),
    [],
  )

  useEffect(() => {
    if (telaCheia !== 'css') return
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Um ancestral com z-index cria contexto de empilhamento e prende o
    // `fixed` abaixo de avisos flutuantes do app (z 45). Neutraliza enquanto
    // durar o modo imersivo, e devolve tudo como estava na saída.
    const alterados: Array<[HTMLElement, string]> = []
    for (let el = raizRef.current?.parentElement; el && el !== document.body; el = el.parentElement) {
      if (getComputedStyle(el).zIndex !== 'auto') {
        alterados.push([el, el.style.zIndex])
        el.style.zIndex = 'auto'
      }
    }
    return () => {
      document.body.style.overflow = anterior
      for (const [el, z] of alterados) el.style.zIndex = z
    }
  }, [telaCheia])

  const alternarTelaCheia = useCallback(async () => {
    if (telaCheia === 'nativa') {
      await exitAppFullscreen()
      setTelaCheia('nao')
      return
    }
    if (telaCheia === 'css') {
      setTelaCheia('nao')
      return
    }
    // O modo imersivo em CSS entra na hora; a tela cheia nativa, se o navegador
    // concedê-la, assume por cima. Esperar a promessa antes de reagir travaria o
    // botão em navegadores embutidos (webviews de apps), onde ela nunca resolve.
    setTelaCheia('css')
    telaCheiaRef.current = 'css'
    void requestAppFullscreen(raizRef.current).then((ok) => {
      if (!ok) return
      // Concedida tarde demais: o usuário já saiu do modo imersivo.
      if (telaCheiaRef.current !== 'css') void exitAppFullscreen()
      else setTelaCheia('nativa')
    })
  }, [telaCheia])

  useEffect(() => {
    telaCheiaRef.current = telaCheia
  }, [telaCheia])

  // ─── Ações ───────────────────────────────────────────────────────────────
  const vp = () => viewerRef.current?.viewport
  const ampliar = (fator: number) => vp()?.zoomBy(fator)
  const inicio = () => {
    vp()?.goHome()
  }
  const irParaObjetiva = (m: number) => {
    const v = vp()
    if (v) v.zoomTo(v.imageToViewportZoom(m / topo))
  }
  const girar = (graus: number) => {
    const v = vp()
    if (!v) return
    const nova = (((v.getRotation() + graus) % 360) + 360) % 360
    v.setRotation(nova)
    setRotacao(nova)
  }
  const espelhar = () => {
    const v = vp()
    if (!v) return
    v.toggleFlip()
    setEspelhado(v.getFlip())
  }
  const irParaPosicaoDoDeslizador = (t: number) => {
    const v = vp()
    if (!v) return
    v.zoomTo(faixa.min * Math.pow(faixa.max / faixa.min, t))
  }

  const urlComPosicao = useCallback(() => {
    const v = posicaoAtual()
    return v ? `${urlDaLamina}?v=${v}` : urlDaLamina
  }, [posicaoAtual, urlDaLamina])

  const compartilhar = async () => {
    const url = urlComPosicao()
    const titulo = `${lamina.titulo}${lamina.subtitulo ? ` — ${lamina.subtitulo}` : ''} · Histologia com Zoom`
    try {
      if (navigator.share && toque) {
        await navigator.share({ title: titulo, url })
        return
      }
      await navigator.clipboard.writeText(url)
      mostrarAviso('Link copiado — abre neste ponto e neste zoom')
    } catch {
      mostrarAviso('Não foi possível copiar o link')
    }
  }

  const adicionarMarcador = () => {
    const v = vp()
    if (!v) return
    const c = v.getCenter(false)
    const novo: Marcador = {
      id: Math.random().toString(36).slice(2, 9),
      nome: nomeDoMarcador.trim() || `Ponto ${marcadores.length + 1}`,
      x: c.x,
      y: c.y,
      z: v.getZoom(false),
      criadoEm: Date.now(),
    }
    const lista = [...marcadores, novo]
    setMarcadores(lista)
    salvarMarcadores(lamina.slug, lista)
    setNomeDoMarcador('')
    mostrarAviso(`Marcador “${novo.nome}” salvo`)
  }

  const irParaMarcador = (m: Marcador) => {
    const v = vp()
    const OSD = osdRef.current
    if (!v || !OSD) return
    v.panTo(new OSD.Point(m.x, m.y))
    v.zoomTo(m.z)
    if (window.matchMedia('(max-width: 640px)').matches) setPainel(null)
  }

  const removerMarcador = (id: string) => {
    const lista = marcadores.filter((m) => m.id !== id)
    setMarcadores(lista)
    salvarMarcadores(lamina.slug, lista)
  }

  // ─── Setas cravadas ──────────────────────────────────────────────────────
  const gravarSetas = (lista: SetaMarcada[]) => {
    setSetas(lista)
    salvarSetas(lamina.slug, lista)
  }

  const adicionarSeta = (x: number, y: number) => {
    const nova: SetaMarcada = {
      id: Math.random().toString(36).slice(2, 9),
      x,
      y,
      // Aparece sempre "de cima-esquerda para baixo-direita" na tela, qualquer
      // que seja a rotação atual; o ângulo gravado é o da lâmina.
      angulo: anguloNaLamina(ANGULO_PADRAO, rotacao, espelhado),
      rotulo: '',
      cor: prefs.setas.cor,
      criadaEm: Date.now(),
    }
    const lista = [...setas, nova]
    gravarSetas(lista)
    setSetaEmEdicao(nova.id)
    const telaLarga = window.matchMedia('(min-width: 640px)').matches
    if (telaLarga) setPainel('marcacoes')
    else mostrarAviso(`Seta ${lista.length} cravada — dê um nome em Marcações`)
  }
  adicionarSetaRef.current = adicionarSeta

  const atualizarSeta = (id: string, parcial: Partial<SetaMarcada>) =>
    gravarSetas(setas.map((s) => (s.id === id ? { ...s, ...parcial } : s)))

  const girarSeta = (id: string, graus: number) => {
    const alvo = setas.find((s) => s.id === id)
    if (alvo) atualizarSeta(id, { angulo: normalizarAngulo(alvo.angulo + graus) })
  }

  const removerSeta = (id: string) => {
    gravarSetas(setas.filter((s) => s.id !== id))
    if (setaEmEdicao === id) setSetaEmEdicao(null)
  }

  const irParaSeta = (seta: SetaMarcada) => {
    const v = vp()
    const OSD = osdRef.current
    if (!v || !OSD) return
    v.panTo(new OSD.Point(seta.x, seta.y))
    setSetaEmEdicao(seta.id)
    if (window.matchMedia('(max-width: 640px)').matches) setPainel(null)
  }

  const alternarModoSeta = () => {
    setModoSeta((ativo) => {
      if (!ativo) mostrarAviso(toque ? 'Toque na lâmina para cravar a seta' : 'Clique na lâmina para cravar a seta')
      return !ativo
    })
  }

  const capturar = async () => {
    const viewer = viewerRef.current as unknown as { drawer?: { canvas?: HTMLCanvasElement } } | null
    const origem = viewer?.drawer?.canvas
    if (!origem) return
    try {
      const w = origem.width
      const h = origem.height
      const escala = w / Math.max(1, origem.clientWidth || w)
      const rodape = Math.round(64 * escala)
      const c = document.createElement('canvas')
      c.width = w
      c.height = h + rodape
      const ctx = c.getContext('2d')!
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, w, h)
      ctx.save()
      if (prefs.ocular.ativa) {
        const r = (Math.min(w, h) * prefs.ocular.diametro) / 200
        ctx.beginPath()
        ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2)
        ctx.clip()
      }
      ctx.imageSmoothingQuality = 'high'
      ctx.filter = filtroCss(prefs.imagem)
      ctx.drawImage(origem, 0, 0)
      ctx.filter = 'none'
      const luz = COR_DA_LUZ[prefs.imagem.luz]
      if (luz) {
        ctx.globalCompositeOperation = 'multiply'
        ctx.fillStyle = luz
        ctx.fillRect(0, 0, w, h)
        ctx.globalCompositeOperation = 'source-over'
      }
      ctx.restore()

      // As marcações vão para a imagem: sem elas, a captura perde o motivo de existir.
      const viewerOsd = viewerRef.current
      const OSD = osdRef.current
      if (viewerOsd && OSD) {
        const larguraCss = origem.clientWidth || w / escala
        setas.forEach((seta, i) => {
          const px = viewerOsd.viewport.pixelFromPoint(new OSD.Point(seta.x, seta.y), true)
          const xCss = espelhado ? larguraCss - px.x : px.x
          if (xCss < -200 || px.y < -200 || xCss > larguraCss + 200 || px.y > h / escala + 200) return
          desenharSetaNoCanvas(
            ctx,
            xCss * escala,
            px.y * escala,
            anguloNaTela(seta.angulo, rotacao, espelhado),
            prefs.setas.tamanho,
            seta.cor,
            prefs.setas.rotulos ? seta.rotulo.trim() || String(i + 1) : undefined,
            escala,
          )
        })
      }
      if (prefs.ocular.indicador === 'ponteiro') {
        const raio = prefs.ocular.ativa ? (Math.min(w, h) * prefs.ocular.diametro) / 200 : Math.min(w, h) * 0.45
        desenharSetaNoCanvas(
          ctx,
          w / 2,
          h / 2,
          prefs.ocular.anguloDoPonteiro,
          Math.max(40 * escala, raio * 0.62),
          prefs.ocular.corDoPonteiro,
          undefined,
          1,
          'ponteiro',
        )
      }

      ctx.fillStyle = '#0d1210'
      ctx.fillRect(0, h, w, rodape)
      const logo = await carregarImagem('/logo-icon.webp').catch(() => null)
      const margem = 14 * escala
      let x = margem
      if (logo) {
        const lado = rodape - 2 * margem * 0.8
        ctx.drawImage(logo, x, h + (rodape - lado) / 2, lado, lado)
        x += lado + margem * 0.8
      }
      ctx.fillStyle = '#ffffff'
      ctx.font = `600 ${15 * escala}px system-ui, sans-serif`
      ctx.fillText(
        `${lamina.titulo}${lamina.subtitulo ? ` — ${lamina.subtitulo}` : ''}`,
        x,
        h + rodape * 0.44,
      )
      ctx.fillStyle = 'rgba(255,255,255,0.62)'
      ctx.font = `${11.5 * escala}px system-ui, sans-serif`
      ctx.fillText(
        [
          lamina.coloracao,
          `≈${formatarAmpliacao(ampliacao)}`,
          textoDaOrigem(lamina.categoriaDeOrigem, lamina.especie),
          lamina.credito
            ? `${MARCA_DO_ACERVO} · ${linhaDeCredito(lamina.credito)}`
            : lamina.fonte === 'gtex'
              ? `${MARCA_DO_ACERVO} · GTEx Project (NIH)`
              : MARCA_DO_ACERVO,
        ].join(' · '),
        x,
        h + rodape * 0.76,
      )
      const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, 'image/png'))
      if (!blob) throw new Error('sem blob')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `domineaqui-${lamina.slug}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 4000)
      mostrarAviso('Imagem salva')
    } catch {
      mostrarAviso('Não foi possível gerar a imagem neste navegador')
    }
  }

  const irPara = (vizinha: Vizinha | null) => {
    if (vizinha) router.push(vizinha.href, { scroll: false })
  }

  // ─── Teclado ─────────────────────────────────────────────────────────────
  const aoTeclar = (e: React.KeyboardEvent) => {
    const alvo = e.target as HTMLElement
    if (alvo.closest('input, textarea, select, [contenteditable="true"]')) return
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const tecla = e.key.toLowerCase()
    const acoes: Record<string, () => void> = {
      f: () => void alternarTelaCheia(),
      c: () => setPainel((p) => (p === 'caracteristicas' ? null : 'caracteristicas')),
      i: () => setPainel((p) => (p === 'ajustes' ? null : 'ajustes')),
      m: () => setPrefs((p) => ({ ...p, navegacao: { ...p.navegacao, minimapa: !p.navegacao.minimapa } })),
      o: () => setPrefs((p) => ({ ...p, ocular: { ...p.ocular, ativa: !p.ocular.ativa } })),
      g: () => setPrefs((p) => ({ ...p, ocular: { ...p.ocular, indicador: proximoIndicador(p.ocular.indicador) } })),
      p: alternarModoSeta,
      e: () => estruturas.length && setPainel((p) => (p === 'estruturas' ? null : 'estruturas')),
      r: () => girar(e.shiftKey ? -90 : 90),
      h: espelhar,
      b: () => setPainel((p) => (p === 'marcacoes' ? null : 'marcacoes')),
      q: () => setQrVisivel((v) => !v),
      '?': () => setPainel((p) => (p === 'atalhos' ? null : 'atalhos')),
      '[': () => irPara(anterior),
      ']': () => irPara(proxima),
      escape: () => {
        if (modoSeta) setModoSeta(false)
        else if (painel) setPainel(null)
        else if (telaCheia === 'css') setTelaCheia('nao')
      },
    }
    for (const m of OBJETIVAS) {
      const i = OBJETIVAS.indexOf(m)
      if (i < 7) acoes[String(i + 1)] = () => irParaObjetiva(m)
    }
    const acao = acoes[tecla]
    if (acao) {
      e.preventDefault()
      acao()
    }
  }

  // ─── Derivados ───────────────────────────────────────────────────────────
  const objetivas = useMemo(() => OBJETIVAS.filter((m) => m <= topo * 1.001), [topo])
  const filtro = filtroCss(prefs.imagem)
  const corDaLuz = COR_DA_LUZ[prefs.imagem.luz]
  const raioDaOcular = (Math.min(palco.largura, palco.altura) * prefs.ocular.diametro) / 200
  const objetivaMaisProxima = objetivas.reduce(
    (melhor, m) => (Math.abs(Math.log(m / ampliacao)) < Math.abs(Math.log(melhor / ampliacao)) ? m : melhor),
    objetivas[0] ?? 1,
  )
  const naResolucaoMaxima = faixa.posicao > 0.995 && ampliacao >= topo * 0.95
  const qrValor = posicaoCodificada ? `${urlDaLamina}?v=${posicaoCodificada}` : urlDaLamina
  const nomeCompleto = `${lamina.titulo}${lamina.subtitulo ? ` — ${lamina.subtitulo}` : ''}`

  const atualizarImagem = (parcial: Partial<Preferencias['imagem']>) =>
    setPrefs((p) => ({ ...p, imagem: { ...p.imagem, ...parcial } }))
  const atualizarOcular = (parcial: Partial<Preferencias['ocular']>) =>
    setPrefs((p) => ({ ...p, ocular: { ...p.ocular, ...parcial } }))
  const atualizarNavegacao = (parcial: Partial<Preferencias['navegacao']>) =>
    setPrefs((p) => ({ ...p, navegacao: { ...p.navegacao, ...parcial } }))

  return (
    <div
      ref={raizRef}
      onKeyDown={aoTeclar}
      className={`hz-raiz group/hz isolate flex flex-col overflow-hidden bg-[#0b0f0e] text-white ${
        telaCheia === 'css'
          ? 'fixed inset-0 z-[1000] h-[100dvh] w-screen'
          : telaCheia === 'nativa'
            ? 'relative h-full w-full'
            : 'relative h-[68svh] min-h-[380px] rounded-2xl ring-1 ring-black/10 sm:h-[72vh] sm:min-h-[460px] lg:max-h-[900px]'
      }`}
      data-tela-cheia={emTelaCheia || undefined}
      data-modo-seta={modoSeta || undefined}
    >
      {/* Cabeçalho de marca — só em tela cheia */}
      {emTelaCheia && (
        <header className="relative z-30 flex shrink-0 items-center gap-2 border-b border-white/10 bg-[#0b0f0e]/95 px-2 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:gap-3 sm:px-4">
          <div className="flex shrink-0 items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.webp" alt="" width={32} height={32} className="h-8 w-8 rounded-md bg-white p-0.5" />
            <span className="hidden font-heading text-sm font-bold tracking-tight sm:inline">DomineAqui</span>
            <span className="hidden h-6 w-px bg-white/15 sm:block" aria-hidden />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoDoManual}
              alt="Manual da Histologia"
              width={46}
              height={40}
              className="hidden h-9 w-auto rounded bg-white/95 p-0.5 sm:block"
            />
          </div>
          <div className="min-w-0 flex-1 px-1">
            <p className="truncate font-heading text-sm font-semibold leading-tight sm:text-base">{nomeCompleto}</p>
            <p className="flex min-w-0 items-center gap-1.5 text-[11px] text-white/55">
              <EtiquetaDeOrigem categoria={lamina.categoriaDeOrigem} especie={lamina.especie} />
              <span className="truncate">{lamina.coloracao} · Histologia com Zoom</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <BotaoDeFerramenta rotulo="Lâmina anterior" atalho="[" onClick={() => irPara(anterior)} desabilitado={!anterior}>
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </BotaoDeFerramenta>
            <BotaoDeFerramenta rotulo="Próxima lâmina" atalho="]" onClick={() => irPara(proxima)} desabilitado={!proxima}>
              <ChevronRight className="h-5 w-5" aria-hidden />
            </BotaoDeFerramenta>
            <Separador />
            <BotaoDeFerramenta
              rotulo="Características"
              atalho="C"
              ativo={painel === 'caracteristicas'}
              onClick={() => setPainel((p) => (p === 'caracteristicas' ? null : 'caracteristicas'))}
              className="sm:px-3"
            >
              <Info className="h-5 w-5" aria-hidden />
              <span className="hidden text-sm font-semibold md:inline">Características</span>
            </BotaoDeFerramenta>
            <BotaoDeFerramenta
              rotulo="QR code"
              atalho="Q"
              ativo={qrVisivel}
              onClick={() => setQrVisivel((v) => !v)}
              className="hidden min-[400px]:inline-flex"
            >
              <QrCode className="h-5 w-5" aria-hidden />
            </BotaoDeFerramenta>
            <BotaoDeFerramenta rotulo="Sair da tela cheia" atalho="F" onClick={() => void alternarTelaCheia()}>
              <Minimize className="h-5 w-5" aria-hidden />
            </BotaoDeFerramenta>
          </div>
        </header>
      )}

      <div className="relative min-h-0 flex-1">
        {/* Palco do OpenSeadragon — os filtros de imagem valem só aqui. */}
        <div
          ref={palcoRef}
          className="absolute inset-0"
          style={{ filter: filtro === 'none' ? undefined : filtro }}
          aria-label={`Lâmina: ${nomeCompleto}. Arraste para mover, role ou use pinça para ampliar.`}
          role="application"
        />

        {/* Luz do microscópio */}
        {corDaLuz && (
          <div
            className="pointer-events-none absolute inset-0 mix-blend-multiply"
            style={{ backgroundColor: corDaLuz }}
            aria-hidden
          />
        )}

        {/* Marcações de estrutura (desenhadas a cada quadro) */}
        <svg ref={camadaRef} className="pointer-events-none absolute inset-0 z-[5] h-full w-full" aria-hidden />

        {/* Ocular: campo circular com borda de vidro e vinheta */}
        {prefs.ocular.ativa && raioDaOcular > 0 && (
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden
            style={{
              background: `radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 0, rgba(0,0,0,${
                (prefs.ocular.vinheta / 100) * 0.55
              }) ${raioDaOcular * 0.96}px, rgba(0,0,0,0.92) ${raioDaOcular + 1}px, #000 ${raioDaOcular + 14}px)`,
            }}
          >
            <div
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: raioDaOcular * 2,
                height: raioDaOcular * 2,
                transform: 'translate(-50%, -50%)',
                boxShadow:
                  'inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 0 32px rgba(0,0,0,0.55), 0 0 0 2px rgba(0,0,0,0.9)',
              }}
            />
          </div>
        )}

        {/* Indicador fixo da ocular: retícula (sem calibração) ou seta */}
        {prefs.ocular.indicador === 'reticula' && palco.largura > 0 && (
          <Reticula largura={palco.largura} altura={palco.altura} raio={prefs.ocular.ativa ? raioDaOcular : null} />
        )}
        {prefs.ocular.indicador === 'ponteiro' && palco.largura > 0 && (
          <PonteiroDaOcular
            largura={palco.largura}
            altura={palco.altura}
            raio={prefs.ocular.ativa ? raioDaOcular : null}
            angulo={prefs.ocular.anguloDoPonteiro}
            cor={prefs.ocular.corDoPonteiro}
          />
        )}

        {/* Modo seta: instrução persistente enquanto estiver ativo */}
        {modoSeta && (
          <div className="pointer-events-none absolute inset-x-0 top-14 z-30 flex justify-center px-3">
            <span className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-bold text-amber-950 shadow-lg">
              <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
              {toque ? 'Toque' : 'Clique'} na lâmina para cravar uma seta
              <button
                type="button"
                onClick={() => setModoSeta(false)}
                className="rounded-full bg-amber-950/15 px-2 py-0.5 hover:bg-amber-950/25"
              >
                Concluir
              </button>
            </span>
          </div>
        )}

        {/* Carregando / erro */}
        {carregando && !erro && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white/80 backdrop-blur">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Carregando lâmina…
            </span>
          </div>
        )}
        {erro && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
            <p className="text-sm font-semibold">Não foi possível abrir esta lâmina agora.</p>
            <p className="max-w-sm text-xs text-white/60">
              Verifique a conexão com a internet e tente de novo.
            </p>
            <button
              type="button"
              onClick={() => {
                slugAbertoRef.current = null
                setVersao((n) => n + 1)
              }}
              className="mt-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/20"
            >
              Tentar de novo
            </button>
          </div>
        )}

        {/* Rótulo da lâmina — modo incorporado */}
        {!emTelaCheia && (
          <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[60%] rounded-lg bg-black/55 px-2.5 py-1.5 backdrop-blur-sm">
            <p className="truncate text-[11px] font-semibold leading-tight">{lamina.coloracao}</p>
            <p className="truncate text-[10px] text-white/60">Scan {lamina.objetiva}</p>
            <p className="mt-1">
              <EtiquetaDeOrigem categoria={lamina.categoriaDeOrigem} especie={lamina.especie} />
            </p>
          </div>
        )}

        {/* HUD de ampliação */}
        <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-1.5">
          <div
            className="rounded-lg bg-black/55 px-2.5 py-1.5 text-right backdrop-blur-sm"
            title="Ampliação equivalente à objetiva usada no scan. Acima do topo, o zoom é digital."
          >
            <p className="font-mono text-base font-bold leading-none tabular-nums">
              {ampliacao ? formatarAmpliacao(ampliacao) : '—'}
            </p>
            <p className="mt-1 text-[9px] uppercase tracking-wider text-white/55">
              {ampliacao > topo * 1.05
                ? 'zoom digital'
                : naResolucaoMaxima
                  ? 'resolução máxima'
                  : `objetiva ≈ ${objetivaMaisProxima}×`}
            </p>
            {refinando && !carregando && (
              <p className="mt-1 flex items-center justify-end gap-1 text-[9px] uppercase tracking-wider text-teal-200/90">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-300" aria-hidden />
                refinando detalhes
              </p>
            )}
          </div>
          {!emTelaCheia && (
            <BotaoDeFerramenta
              rotulo="Tela cheia"
              atalho="F"
              onClick={() => void alternarTelaCheia()}
              className="bg-black/55 backdrop-blur-sm"
            >
              <Maximize className="h-5 w-5" aria-hidden />
            </BotaoDeFerramenta>
          )}
        </div>

        {/* Minimapa (criado pelo OpenSeadragon dentro deste elemento) */}
        <div
          className={`absolute right-3 z-10 overflow-hidden rounded-md shadow-lg ring-1 ring-white/15 transition-opacity ${
            prefs.navegacao.minimapa ? 'opacity-100' : 'pointer-events-none opacity-0'
          } bottom-[68px] h-[78px] w-[110px] sm:bottom-[72px] sm:h-[110px] sm:w-[160px]`}
          aria-hidden={!prefs.navegacao.minimapa}
        >
          <div ref={minimapaRef} className="h-full w-full" />
        </div>

        {/* QR code — tela cheia */}
        {emTelaCheia && qrVisivel && (
          <div className="absolute bottom-[68px] left-3 z-20 rounded-xl bg-white p-2.5 text-[#0b0f0e] shadow-2xl sm:bottom-[76px]">
            <QRCodeSVG value={qrValor} size={112} level="M" marginSize={0} aria-label="QR code desta lâmina" />
            <p className="mt-1.5 max-w-[112px] text-center text-[10px] font-semibold leading-tight">
              Abra esta lâmina no celular
            </p>
          </div>
        )}

        {/* Crédito */}
        <p className="pointer-events-none absolute bottom-[62px] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap text-[9px] text-white/40 sm:bottom-[66px]">
          {creditoDaLamina(lamina)}
        </p>

        {/* Percorrer as marcas de uma estrutura com setas em vários pontos */}
        {marcacaoSelecionada && totalDeParadas > 1 && (
          <div className="absolute left-1/2 top-3 z-20 -translate-x-1/2">
            <button
              type="button"
              onClick={() => setParada((p) => (p + 1) % totalDeParadas)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-white/15 bg-black/70 px-3.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md hover:border-cyan-400/60"
              aria-label={`Ver o próximo exemplo (${(parada % totalDeParadas) + 1} de ${totalDeParadas})`}
            >
              {(parada % totalDeParadas) + 1} de {totalDeParadas}
              <span aria-hidden className="text-cyan-300">
                próximo ›
              </span>
            </button>
          </div>
        )}

        {/* Aviso transitório */}
        <div aria-live="polite" className="pointer-events-none absolute inset-x-0 top-16 z-50 flex justify-center">
          {aviso && (
            <span className="rounded-full bg-black/80 px-3 py-1.5 text-xs font-medium text-white shadow-lg">{aviso}</span>
          )}
        </div>

        {/* Barra de ferramentas */}
        <div className="absolute inset-x-2 bottom-2 z-20 flex justify-center pb-[env(safe-area-inset-bottom)]">
          <div
            role="toolbar"
            aria-label="Ferramentas do visualizador"
            className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-xl border border-white/10 bg-black/65 p-1 shadow-2xl backdrop-blur-md [scrollbar-width:none]"
          >
            <BotaoDeFerramenta rotulo="Reduzir" atalho="−" onClick={() => ampliar(1 / 1.6)}>
              <ZoomOut className="h-5 w-5" aria-hidden />
            </BotaoDeFerramenta>
            <label className="hidden items-center md:flex">
              <span className="sr-only">Nível de zoom</span>
              <input
                type="range"
                min={0}
                max={1000}
                value={Math.round(Math.min(1, Math.max(0, faixa.posicao)) * 1000)}
                onChange={(e) => irParaPosicaoDoDeslizador(Number(e.target.value) / 1000)}
                className="mx-1 h-6 w-28 cursor-pointer accent-teal-400 lg:w-36"
              />
            </label>
            <BotaoDeFerramenta rotulo="Ampliar" atalho="+" onClick={() => ampliar(1.6)}>
              <ZoomIn className="h-5 w-5" aria-hidden />
            </BotaoDeFerramenta>
            <Separador />
            <div className="flex items-center" role="group" aria-label="Objetivas">
              {objetivas.map((m, i) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => irParaObjetiva(m)}
                  title={`Objetiva ${m}× (tecla ${i + 1})`}
                  aria-label={`Ir para objetiva ${m}×`}
                  className={`h-10 min-w-[38px] shrink-0 rounded-lg px-1.5 font-mono text-xs font-bold tabular-nums transition-colors [@media(pointer:coarse)]:h-11 ${
                    ampliacao && objetivaMaisProxima === m && ampliacao <= topo * 1.05
                      ? 'bg-white text-[#0b0f0e]'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {m}×
                </button>
              ))}
            </div>
            <Separador />
            <BotaoDeFerramenta rotulo="Ver lâmina inteira" atalho="0" onClick={inicio}>
              <Home className="h-5 w-5" aria-hidden />
            </BotaoDeFerramenta>
            <BotaoDeFerramenta rotulo={`Girar 90° (atual ${Math.round(rotacao)}°)`} atalho="R" onClick={() => girar(90)}>
              <RotateCw className="h-5 w-5" aria-hidden />
            </BotaoDeFerramenta>
            <BotaoDeFerramenta rotulo="Espelhar" atalho="H" ativo={espelhado} onClick={espelhar}>
              <FlipHorizontal className="h-5 w-5" aria-hidden />
            </BotaoDeFerramenta>
            <Separador />
            <BotaoDeFerramenta
              rotulo="Ocular circular"
              atalho="O"
              ativo={prefs.ocular.ativa}
              onClick={() => atualizarOcular({ ativa: !prefs.ocular.ativa })}
            >
              <Circle className="h-5 w-5" aria-hidden />
            </BotaoDeFerramenta>
            <BotaoDeFerramenta
              rotulo={`Indicador da ocular: ${ROTULO_DO_INDICADOR[prefs.ocular.indicador]}`}
              atalho="G"
              ativo={prefs.ocular.indicador !== 'nenhum'}
              onClick={() => atualizarOcular({ indicador: proximoIndicador(prefs.ocular.indicador) })}
            >
              {prefs.ocular.indicador === 'ponteiro' ? (
                <MousePointer2 className="h-5 w-5 -scale-x-100" aria-hidden />
              ) : (
                <Crosshair className="h-5 w-5" aria-hidden />
              )}
            </BotaoDeFerramenta>
            <BotaoDeFerramenta
              rotulo="Minimapa"
              atalho="M"
              ativo={prefs.navegacao.minimapa}
              onClick={() => atualizarNavegacao({ minimapa: !prefs.navegacao.minimapa })}
            >
              <IconeMapa className="h-5 w-5" aria-hidden />
            </BotaoDeFerramenta>
            <BotaoDeFerramenta
              rotulo="Ajustes de imagem"
              atalho="I"
              ativo={painel === 'ajustes' || imagemAlterada(prefs.imagem)}
              onClick={() => setPainel((p) => (p === 'ajustes' ? null : 'ajustes'))}
            >
              <SlidersHorizontal className="h-5 w-5" aria-hidden />
            </BotaoDeFerramenta>
            <Separador />
            {estruturas.length > 0 && (
              <BotaoDeFerramenta
                rotulo="Estruturas desta lâmina"
                atalho="E"
                ativo={painel === 'estruturas' || !!selecao}
                onClick={() => setPainel((p) => (p === 'estruturas' ? null : 'estruturas'))}
              >
                <Tags className="h-5 w-5" aria-hidden />
                <span className="font-mono text-[11px] font-bold">{new Set(estruturas.map((e) => e.estrutura)).size}</span>
              </BotaoDeFerramenta>
            )}
            <BotaoDeFerramenta rotulo="Cravar seta na lâmina" atalho="P" ativo={modoSeta} onClick={alternarModoSeta}>
              <ArrowDownRight className="h-5 w-5" aria-hidden />
              {setas.length > 0 && <span className="font-mono text-[11px] font-bold">{setas.length}</span>}
            </BotaoDeFerramenta>
            <BotaoDeFerramenta
              rotulo="Marcações (setas e pontos salvos)"
              atalho="B"
              ativo={painel === 'marcacoes'}
              onClick={() => setPainel((p) => (p === 'marcacoes' ? null : 'marcacoes'))}
            >
              <Bookmark className="h-5 w-5" aria-hidden />
              {marcadores.length > 0 && <span className="font-mono text-[11px] font-bold">{marcadores.length}</span>}
            </BotaoDeFerramenta>
            <BotaoDeFerramenta rotulo="Salvar imagem da vista" onClick={() => void capturar()}>
              <Camera className="h-5 w-5" aria-hidden />
            </BotaoDeFerramenta>
            <BotaoDeFerramenta rotulo="Compartilhar este ponto" onClick={() => void compartilhar()}>
              <Share2 className="h-5 w-5" aria-hidden />
            </BotaoDeFerramenta>
            <BotaoDeFerramenta
              rotulo="Navegação e zoom"
              ativo={painel === 'navegacao'}
              onClick={() => setPainel((p) => (p === 'navegacao' ? null : 'navegacao'))}
            >
              <Settings2 className="h-5 w-5" aria-hidden />
            </BotaoDeFerramenta>
            <BotaoDeFerramenta
              rotulo="Atalhos de teclado"
              atalho="?"
              ativo={painel === 'atalhos'}
              onClick={() => setPainel((p) => (p === 'atalhos' ? null : 'atalhos'))}
              className="hidden sm:inline-flex"
            >
              <Keyboard className="h-5 w-5" aria-hidden />
            </BotaoDeFerramenta>
            {!emTelaCheia && (
              <>
                <Separador />
                <BotaoDeFerramenta
                  rotulo="Características"
                  atalho="C"
                  ativo={painel === 'caracteristicas'}
                  onClick={() => setPainel((p) => (p === 'caracteristicas' ? null : 'caracteristicas'))}
                >
                  <Info className="h-5 w-5" aria-hidden />
                </BotaoDeFerramenta>
              </>
            )}
          </div>
        </div>

        {/* ── Painéis ─────────────────────────────────────────────────── */}
        <Folha
          titulo="Características"
          subtitulo={nomeCompleto}
          aberta={painel === 'caracteristicas'}
          onFechar={() => setPainel(null)}
          largura="larga"
        >
          {caracteristicas}
        </Folha>

        <Folha
          titulo="Estruturas desta lâmina"
          subtitulo="Toque numa estrutura para vê-la marcada"
          aberta={painel === 'estruturas'}
          onFechar={() => setPainel(null)}
          largura="larga"
        >
          <CatalogoDeEstruturas
            estruturas={estruturas}
            selecionada={selecao}
            compacto
            onSelecionar={(id) => {
              selecionarEstrutura(id)
              // No celular a folha cobre a lâmina: fecha para mostrar a marcação.
              if (id && window.matchMedia('(max-width: 640px)').matches) setPainel(null)
            }}
          />
        </Folha>

        <Folha titulo="Ajustes de imagem" aberta={painel === 'ajustes'} onFechar={() => setPainel(null)}>
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Predefinições</p>
              <div className="grid grid-cols-2 gap-1.5">
                {PREDEFINICOES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    title={p.descricao}
                    onClick={() => atualizarImagem({ ...IMAGEM_ORIGINAL, ...p.imagem })}
                    className="rounded-lg border border-border px-2.5 py-2 text-left text-xs font-semibold transition-colors hover:border-teal-500/50 hover:bg-teal-500/5"
                  >
                    {p.nome}
                  </button>
                ))}
              </div>
            </div>
            <Deslizador rotulo="Brilho" valor={prefs.imagem.brilho} min={40} max={180} padrao={100} unidade="%" onChange={(v) => atualizarImagem({ brilho: v })} />
            <Deslizador rotulo="Contraste" valor={prefs.imagem.contraste} min={40} max={220} padrao={100} unidade="%" onChange={(v) => atualizarImagem({ contraste: v })} />
            <Deslizador rotulo="Saturação" valor={prefs.imagem.saturacao} min={0} max={260} padrao={100} unidade="%" onChange={(v) => atualizarImagem({ saturacao: v })} />
            <Deslizador rotulo="Matiz" valor={prefs.imagem.matiz} min={-180} max={180} padrao={0} unidade="°" onChange={(v) => atualizarImagem({ matiz: v })} />
            <Deslizador rotulo="Realce de detalhes" valor={prefs.imagem.nitidez} min={0} max={100} padrao={0} unidade="%" onChange={(v) => atualizarImagem({ nitidez: v })} />
            <div>
              <p className="mb-2 text-xs font-semibold">Luz do microscópio</p>
              <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Luz do microscópio">
                {(
                  [
                    ['neutra', 'Neutra'],
                    ['halogena', 'Halógena'],
                    ['fria', 'LED fria'],
                  ] as const
                ).map(([id, nome]) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={prefs.imagem.luz === id}
                    onClick={() => atualizarImagem({ luz: id })}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                      prefs.imagem.luz === id ? 'border-teal-600 bg-teal-600 text-white' : 'border-border hover:bg-muted'
                    }`}
                  >
                    {nome}
                  </button>
                ))}
              </div>
            </div>
            <Alternador rotulo="Tons de cinza" ativo={prefs.imagem.cinza} onChange={(v) => atualizarImagem({ cinza: v })} />
            <Alternador rotulo="Inverter (campo escuro)" ativo={prefs.imagem.inverter} onChange={(v) => atualizarImagem({ inverter: v })} />

            <hr className="border-border" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ocular</p>
            <Alternador
              rotulo="Campo circular"
              descricao="Recorta a vista como na ocular de um microscópio de verdade."
              ativo={prefs.ocular.ativa}
              onChange={(v) => atualizarOcular({ ativa: v })}
            />
            {prefs.ocular.ativa && (
              <>
                <Deslizador rotulo="Diâmetro do campo" valor={prefs.ocular.diametro} min={45} max={140} padrao={PADRAO.ocular.diametro} unidade="%" onChange={(v) => atualizarOcular({ diametro: v })} />
                <Deslizador rotulo="Vinheta" valor={prefs.ocular.vinheta} min={0} max={100} padrao={PADRAO.ocular.vinheta} unidade="%" onChange={(v) => atualizarOcular({ vinheta: v })} />
              </>
            )}
            <div>
              <p className="mb-1 text-xs font-semibold">Indicador da ocular</p>
              <p className="mb-2 text-[11px] leading-snug text-muted-foreground">
                Fixo no campo: a lâmina se move por baixo dele. A retícula tem cruz e escala (sem calibração); a
                seta é a agulha que muitos microscópios de ensino usam para apontar uma estrutura.
              </p>
              <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Indicador da ocular">
                {(['nenhum', 'reticula', 'ponteiro'] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={prefs.ocular.indicador === id}
                    onClick={() => atualizarOcular({ indicador: id })}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                      prefs.ocular.indicador === id ? 'border-teal-600 bg-teal-600 text-white' : 'border-border hover:bg-muted'
                    }`}
                  >
                    {ROTULO_DO_INDICADOR[id]}
                  </button>
                ))}
              </div>
            </div>
            {prefs.ocular.indicador === 'ponteiro' && (
              <>
                <Deslizador
                  rotulo="Direção da seta"
                  valor={prefs.ocular.anguloDoPonteiro}
                  min={0}
                  max={359}
                  padrao={PADRAO.ocular.anguloDoPonteiro}
                  unidade="°"
                  onChange={(v) => atualizarOcular({ anguloDoPonteiro: v })}
                />
                <div>
                  <p className="mb-2 text-xs font-semibold">Cor da seta da ocular</p>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Cor da seta da ocular">
                    {ORDEM_DAS_CORES.map((cor) => (
                      <AmostraDeCor
                        key={cor}
                        cor={cor}
                        ativa={prefs.ocular.corDoPonteiro === cor}
                        onClick={() => atualizarOcular({ corDoPonteiro: cor })}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
            <button
              type="button"
              onClick={() => setPrefs((p) => ({ ...p, imagem: IMAGEM_ORIGINAL, ocular: PADRAO.ocular }))}
              className="w-full rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
            >
              Restaurar tudo
            </button>
          </div>
        </Folha>

        <Folha titulo="Navegação e zoom" aberta={painel === 'navegacao'} onFechar={() => setPainel(null)}>
          <div className="space-y-5">
            <Deslizador
              rotulo="Velocidade do zoom na rolagem"
              valor={prefs.navegacao.zoomPorRolagem}
              min={1.05}
              max={2}
              passo={0.05}
              padrao={PADRAO.navegacao.zoomPorRolagem}
              formatar={(v) => `×${v.toFixed(2)}`}
              onChange={(v) => atualizarNavegacao({ zoomPorRolagem: v })}
            />
            <Deslizador
              rotulo="Suavidade das animações"
              valor={prefs.navegacao.animacao}
              min={0}
              max={2}
              passo={0.1}
              padrao={PADRAO.navegacao.animacao}
              formatar={(v) => (v === 0 ? 'instantâneo' : `${v.toFixed(1)} s`)}
              onChange={(v) => atualizarNavegacao({ animacao: v })}
            />
            <Alternador
              rotulo="Duplo clique amplia"
              ativo={prefs.navegacao.duploCliqueAmplia}
              onChange={(v) => atualizarNavegacao({ duploCliqueAmplia: v })}
            />
            <Alternador
              rotulo="Minimapa"
              descricao="Mostra onde você está na lâmina inteira."
              ativo={prefs.navegacao.minimapa}
              onChange={(v) => atualizarNavegacao({ minimapa: v })}
            />
            <Alternador
              rotulo="Um dedo move a lâmina (toque)"
              descricao="Desligado: um dedo rola a página e dois dedos movem a lâmina. Em tela cheia, um dedo sempre move a lâmina."
              ativo={prefs.navegacao.umDedo === 'lamina'}
              onChange={(v) => atualizarNavegacao({ umDedo: v ? 'lamina' : 'pagina' })}
            />
            <Escolha
              titulo="Qualidade da imagem"
              valor={prefs.navegacao.qualidade}
              onChange={(v) => atualizarNavegacao({ qualidade: v })}
              opcoes={[
                ['maxima', 'Máxima', 'Nunca estica a imagem enquanto houver resolução maior: carrega o nível fino antes e pré-carrega o próximo.'],
                ['equilibrada', 'Equilibrada', 'Tolera um leve esticamento (até 1,5×) para baixar menos dados.'],
                ['economia', 'Economia de dados', 'Para conexão móvel lenta: sem pré-carga e com mais esticamento tolerado.'],
              ]}
            />
            <Escolha
              titulo="Zoom além da resolução do scan"
              valor={prefs.navegacao.zoomDigital}
              onChange={(v) => atualizarNavegacao({ zoomDigital: v })}
              opcoes={[
                ['sem-perda', 'Sem perda', 'Para quando cada pixel do scan ocupa um pixel físico da tela: imagem sempre nítida.'],
                ['padrao', 'Padrão', `Para na resolução real do scan (${topo}×). Em telas de alta densidade, leve ampliação.`],
                ['livre', 'Livre', 'Permite ampliar até 4× além do scan. A imagem fica maior, sem detalhe novo.'],
              ]}
            />
            <div className="rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
              A ampliação mostrada equivale à objetiva usada no scan ({lamina.objetiva}). Acima de{' '}
              {topo}× o zoom é digital: aumenta os pixels, não revela detalhe novo.
            </div>
          </div>
        </Folha>

        <Folha
          titulo="Marcações"
          subtitulo="Setas e pontos salvos neste navegador"
          aberta={painel === 'marcacoes'}
          onFechar={() => setPainel(null)}
        >
          <section aria-labelledby="hz-titulo-setas" className="mb-6">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 id="hz-titulo-setas" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Setas na lâmina ({setas.length})
              </h3>
              <button
                type="button"
                onClick={alternarModoSeta}
                aria-pressed={modoSeta}
                className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors ${
                  modoSeta ? 'bg-amber-400 text-amber-950' : 'bg-teal-700 text-white hover:bg-teal-800'
                }`}
              >
                <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
                {modoSeta ? 'Concluir' : 'Cravar seta'}
              </button>
            </div>
            <p className="mb-3 text-[11px] leading-snug text-muted-foreground">
              Ative e {toque ? 'toque' : 'clique'} sobre a estrutura: a ponta da seta fica presa a ela em qualquer
              zoom e acompanha a lâmina quando você gira.
            </p>

            {setas.length > 0 && (
              <ol className="space-y-2">
                {setas.map((seta, i) => (
                  <li
                    key={seta.id}
                    className={`rounded-lg border p-2 ${seta.id === setaEmEdicao ? 'border-teal-500/60 bg-teal-500/5' : 'border-border'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[11px] font-bold">
                        {i + 1}
                      </span>
                      <label className="sr-only" htmlFor={`hz-rotulo-${seta.id}`}>
                        Rótulo da seta {i + 1}
                      </label>
                      <input
                        id={`hz-rotulo-${seta.id}`}
                        value={seta.rotulo}
                        autoFocus={seta.id === setaEmEdicao && !toque}
                        onFocus={() => setSetaEmEdicao(seta.id)}
                        onChange={(e) => atualizarSeta(seta.id, { rotulo: e.target.value })}
                        placeholder="Nome (ex.: glomérulo)"
                        maxLength={60}
                        className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removerSeta(seta.id)}
                        aria-label={`Apagar seta ${i + 1}`}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-8">
                      <div className="flex gap-1" role="radiogroup" aria-label={`Cor da seta ${i + 1}`}>
                        {ORDEM_DAS_CORES.map((cor) => (
                          <AmostraDeCor
                            key={cor}
                            cor={cor}
                            tamanho="mini"
                            ativa={seta.cor === cor}
                            onClick={() => atualizarSeta(seta.id, { cor })}
                          />
                        ))}
                      </div>
                      <span className="ml-auto flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => girarSeta(seta.id, -45)}
                          aria-label={`Girar seta ${i + 1} para a esquerda`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <RotateCcw className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => girarSeta(seta.id, 45)}
                          aria-label={`Girar seta ${i + 1} para a direita`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <RotateCw className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => irParaSeta(seta)}
                          className="rounded-md px-2 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-500/10 dark:text-teal-300"
                        >
                          Ir até
                        </button>
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            <div className="mt-4 space-y-4 rounded-lg bg-muted/40 p-3">
              <Deslizador
                rotulo="Tamanho das setas"
                valor={prefs.setas.tamanho}
                min={32}
                max={140}
                padrao={PADRAO.setas.tamanho}
                unidade=" px"
                onChange={(v) => setPrefs((p) => ({ ...p, setas: { ...p.setas, tamanho: v } }))}
              />
              <div>
                <p className="mb-2 text-xs font-semibold">Cor das próximas setas</p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Cor das próximas setas">
                  {ORDEM_DAS_CORES.map((cor) => (
                    <AmostraDeCor
                      key={cor}
                      cor={cor}
                      ativa={prefs.setas.cor === cor}
                      onClick={() => setPrefs((p) => ({ ...p, setas: { ...p.setas, cor } }))}
                    />
                  ))}
                </div>
              </div>
              <Alternador
                rotulo="Mostrar nomes junto das setas"
                ativo={prefs.setas.rotulos}
                onChange={(v) => setPrefs((p) => ({ ...p, setas: { ...p.setas, rotulos: v } }))}
              />
              {setas.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Apagar as ${setas.length} setas desta lâmina?`)) gravarSetas([])
                  }}
                  className="w-full rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  Apagar todas as setas
                </button>
              )}
            </div>
          </section>

          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Pontos salvos ({marcadores.length})
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              adicionarMarcador()
            }}
            className="flex gap-2"
          >
            <label className="sr-only" htmlFor="hz-nome-marcador">
              Nome do marcador
            </label>
            <input
              id="hz-nome-marcador"
              value={nomeDoMarcador}
              onChange={(e) => setNomeDoMarcador(e.target.value)}
              placeholder={`Ponto ${marcadores.length + 1} (ex.: glomérulo)`}
              maxLength={60}
              className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <button type="submit" className="shrink-0 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800">
              Salvar aqui
            </button>
          </form>
          <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
            Salva o centro e o zoom atuais. Os pinos numerados aparecem sobre a lâmina.
          </p>
          {marcadores.length === 0 ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">Nenhum marcador ainda.</p>
          ) : (
            <ol className="mt-4 space-y-1.5">
              {marcadores.map((m, i) => (
                <li key={m.id} className="flex items-center gap-2 rounded-lg border border-border p-1.5 pl-2">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-600 font-mono text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <button type="button" onClick={() => irParaMarcador(m)} className="min-w-0 flex-1 truncate text-left text-sm font-medium hover:underline">
                    {m.nome}
                  </button>
                  <button
                    type="button"
                    onClick={() => removerMarcador(m.id)}
                    aria-label={`Remover ${m.nome}`}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </Folha>

        <Folha titulo="Atalhos de teclado" aberta={painel === 'atalhos'} onFechar={() => setPainel(null)}>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
            {ATALHOS.map(([tecla, acao]) => (
              <div key={tecla} className="contents">
                <dt>
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px]">{tecla}</kbd>
                </dt>
                <dd className="text-muted-foreground">{acao}</dd>
              </div>
            ))}
          </dl>
        </Folha>
      </div>

      {/* Pinos dos marcadores */}
      <style>{`
        .hz-pino{width:22px;height:22px;border-radius:9999px;background:#0d9488;color:#fff;font:700 11px ui-monospace,monospace;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px #fff,0 2px 8px rgba(0,0,0,.5);pointer-events:none}
        .hz-raiz .openseadragon-canvas:focus-visible{outline:2px solid #5eead4;outline-offset:-2px}
        .hz-raiz[data-modo-seta] .openseadragon-canvas{cursor:crosshair}
        ${ESTILO_DAS_SETAS}
      `}</style>
    </div>
  )
}

const ATALHOS: Array<[string, string]> = [
  ['Rolagem', 'Ampliar / reduzir'],
  ['Arrastar', 'Mover a lâmina'],
  ['Setas / WASD', 'Mover'],
  ['+ / −', 'Ampliar / reduzir'],
  ['0', 'Lâmina inteira'],
  ['1 – 7', 'Objetivas (1×, 2×, 4×, 10×, 20×, 40×, 60×)'],
  ['F', 'Tela cheia'],
  ['C', 'Características'],
  ['I', 'Ajustes de imagem'],
  ['O', 'Ocular circular'],
  ['G', 'Indicador da ocular (retícula / seta)'],
  ['P', 'Cravar seta na lâmina'],
  ['E', 'Estruturas desta lâmina'],
  ['M', 'Minimapa'],
  ['R / Shift+R', 'Girar 90°'],
  ['H', 'Espelhar'],
  ['B', 'Marcações (setas e pontos)'],
  ['Q', 'QR code (tela cheia)'],
  ['[ / ]', 'Lâmina anterior / próxima'],
  ['Esc', 'Sair do modo seta / fechar painel'],
]

const ROTULO_DO_INDICADOR: Record<Indicador, string> = {
  nenhum: 'Nenhum',
  reticula: 'Retícula',
  ponteiro: 'Seta',
}

function proximoIndicador(atual: Indicador): Indicador {
  return atual === 'nenhum' ? 'reticula' : atual === 'reticula' ? 'ponteiro' : 'nenhum'
}

/** Grupo de opções exclusivas com descrição de cada uma. */
function Escolha<T extends string>({
  titulo,
  valor,
  opcoes,
  onChange,
}: {
  titulo: string
  valor: T
  opcoes: Array<[T, string, string]>
  onChange: (v: T) => void
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold">{titulo}</legend>
      <div className="space-y-1.5" role="radiogroup" aria-label={titulo}>
        {opcoes.map(([id, nome, descricao]) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={valor === id}
            onClick={() => onChange(id)}
            className={`block w-full rounded-lg border px-3 py-2 text-left transition-colors ${
              valor === id ? 'border-teal-600 bg-teal-500/10' : 'border-border hover:bg-muted'
            }`}
          >
            <span className="block text-xs font-semibold">{nome}</span>
            <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{descricao}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}

/** Texto da origem para o rodapé da imagem salva. */
function textoDaOrigem(categoria: CategoriaDeOrigem, especie: string): string {
  if (categoria === 'humana') return 'Peça humana'
  if (categoria === 'nao-informada') return 'Espécie não informada'
  if (categoria === 'vegetal') return `Peça vegetal: ${especie}`
  return `Peça não humana: ${especie.replace(' (primata não humano)', '')}`
}

/**
 * Etiqueta de espécie sobre o palco escuro. Âmbar para peça não humana, para
 * que ninguém — nem quem chega depois na sala de aula projetada — tome uma
 * lâmina de gato por humana. Sempre com texto, nunca só a cor.
 */
function EtiquetaDeOrigem({ categoria, especie }: { categoria: CategoriaDeOrigem; especie: string }) {
  const estilo: Record<CategoriaDeOrigem, string> = {
    humana: 'bg-emerald-400/15 text-emerald-200 ring-emerald-300/30',
    'nao-humana': 'bg-amber-400/20 text-amber-200 ring-amber-300/40',
    vegetal: 'bg-lime-400/20 text-lime-200 ring-lime-300/40',
    'nao-informada': 'bg-white/10 text-white/70 ring-white/15',
  }
  const texto =
    categoria === 'humana'
      ? 'Humana'
      : categoria === 'nao-informada'
        ? 'Espécie não informada'
        : categoria === 'vegetal'
          ? `Vegetal · ${especie}`
          : `Não humana · ${especie.replace(' (primata não humano)', '')}`
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-1.5 py-px text-[10px] font-semibold ring-1 ring-inset ${estilo[categoria]}`}
    >
      {texto}
    </span>
  )
}

function formatarAmpliacao(m: number): string {
  if (m >= 10) return `${Math.round(m)}×`
  if (m >= 1) return `${m.toFixed(1).replace('.', ',')}×`
  return `${m.toFixed(2).replace('.', ',')}×`
}

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, falha) => {
    const img = new Image()
    img.onload = () => ok(img)
    img.onerror = falha
    img.src = src
  })
}

/** Retícula de ocular: cruz central e escala de 0 a 100 no eixo horizontal. */
function Reticula({ largura, altura, raio }: { largura: number; altura: number; raio: number | null }) {
  const cx = largura / 2
  const cy = altura / 2
  const meia = raio ?? Math.min(largura, altura) * 0.42
  const traco = 'rgba(255,255,255,0.75)'
  const sombra = 'rgba(0,0,0,0.6)'
  const marcas = Array.from({ length: 21 }, (_, i) => i)
  const linhas = (cor: string, largura: number) => (
    <g stroke={cor} strokeWidth={largura} strokeLinecap="round">
      <line x1={cx - meia} y1={cy} x2={cx + meia} y2={cy} />
      <line x1={cx} y1={cy - meia} x2={cx} y2={cy + meia} />
      {marcas.map((i) => {
        const x = cx - meia * 0.8 + (i * meia * 1.6) / 20
        const alto = i % 10 === 0 ? 10 : i % 5 === 0 ? 7 : 4
        return <line key={i} x1={x} y1={cy - alto} x2={x} y2={cy + alto} />
      })}
    </g>
  )
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
      {linhas(sombra, 3)}
      {linhas(traco, 1)}
      <circle cx={cx} cy={cy} r={3} fill="none" stroke={traco} strokeWidth={1} />
    </svg>
  )
}
