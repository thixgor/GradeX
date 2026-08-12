'use client'

import type * as React from 'react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Bold,
  Bookmark,
  Brush,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Eraser,
  Eye,
  HelpCircle,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Keyboard,
  List,
  Lock,
  Maximize2,
  MessageSquare,
  Minimize2,
  Minus,
  MoreHorizontal,
  MousePointer2,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  PenLine,
  Plus,
  Rows3,
  SearchX,
  ShieldCheck,
  Sparkles,
  StickyNote,
  Trash2,
  Type,
  Underline,
  X,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRemainingTime, type TimedAccessView } from '@/components/materiais/timed-access'
import { GuidedTour, type TourStep } from '@/components/manual-clinico/guided-tour'
import {
  exitAppFullscreen,
  getFullscreenElement,
  onFullscreenChange,
  requestAppFullscreen,
} from '@/lib/fullscreen'
import {
  readSavedPosition,
  recordReadingProgress,
  writeSavedPosition,
} from '@/lib/material-reading-progress'
import {
  buildSummaryOutline,
  findActiveSummaryId,
  outlineAncestors,
  visibleOutlineNodes,
  type SummaryOutlineNode,
} from '@/lib/pdf-summary-outline'
import {
  SCROLL_EDGE_TOLERANCE,
  type SwipeStart,
  isSwipeAllowed,
  lockSwipeAxis,
  readScrollEdges,
  resolveSwipe,
  rubberBand,
} from '@/lib/pdf-viewer-swipe'

type ViewerMode = 'single' | 'width' | 'continuous'
// Folhas do celular. O cabeçalho antigo empilhava até cinco linhas de rolagem
// horizontal — num telefone isso comia metade da tela e escondia controles
// atrás de scroll lateral. Agora cada grupo vira uma folha sob demanda.
type MobileSheet = null | 'nav' | 'tools' | 'mode' | 'goto' | 'more'

// Rótulos em linguagem de gente. "Pagina/Largura/Continuo" só faz sentido para
// quem já conhece leitores de PDF; o público aqui não conhece.
const MODE_OPTIONS: Array<{ value: ViewerMode; label: string; hint: string }> = [
  { value: 'continuous', label: 'Rolagem contínua', hint: 'Deslize para baixo, como numa página comum' },
  { value: 'single', label: 'Uma página por vez', hint: 'Deslize o dedo para o lado ou para cima' },
  { value: 'width', label: 'Largura da tela', hint: 'Ajusta a página à largura do aparelho' },
]

type AnnotationType = 'highlight' | 'note' | 'bookmark' | 'text' | 'drawing'
type AnnotationTool = 'cursor' | AnnotationType | 'eraser' | 'laser'
type DrawingMode = 'free' | 'marker' | 'line' | 'dash' | 'circle'
type TextAlign = 'left' | 'center' | 'right'

interface SummaryEntry {
  id: string
  title: string
  page: number
  level?: number
}

interface NavEntry {
  id: string
  label: string
  page: number
}

interface PreviewInfo {
  active: boolean
  pages: number[]
  ranges: Array<{ start: number; end: number }>
  totalPages: number
}

interface ViewerAccess {
  material: {
    id: string
    title: string
    /** Capa do catálogo — usada no cartão de "Continuar lendo". */
    coverImage?: string
    pageCount: number
    viewerEnabled: boolean
    // O leitor NÃO oferece download, nem quando esta flag é true — decisão de
    // produto, não esquecimento. O download continua sendo feito só a partir
    // da página do material, com o termo de uso e a marca d'água do
    // /api/materiais/download. Aqui a flag serve apenas para decidir se
    // mostramos a explicação "por que não posso baixar?" no menu de ajuda.
    downloadEnabled: boolean
  }
  audit: {
    openedAt: string
  }
  viewer: {
    defaultMode: ViewerMode
    minZoom: number
    maxZoom: number
    coverPage?: number
    summary?: SummaryEntry[]
    navigation?: NavEntry[]
  }
  preview?: PreviewInfo | null
  /**
   * Prazo restante quando o acesso veio de uma versão por tempo limitado.
   * `null` = acesso vitalício. Presente ⇒ leitura só aqui, sem download.
   */
  timedAccess?: TimedAccessView | null
}

interface PdfAnnotation {
  _id: string
  id: string
  userId: string
  materialId: string
  pageNumber: number
  type: AnnotationType
  position: {
    x?: number
    y?: number
    width?: number
    height?: number
    points?: PdfPoint[]
  }
  content: string
  color: string
  data?: AnnotationData
  createdAt: string
  updatedAt: string
}

// Referência estável para páginas sem anotações — evita recriar `[]` a cada
// render, o que quebraria a memoização de PdfCanvasPage durante o scroll.
const EMPTY_ANNOTATIONS: PdfAnnotation[] = []

// Virtualização (windowing) dos modos contínuo/largura: só as páginas dentro
// de um raio da página atual são montadas como PdfCanvasPage "pesado" (canvas,
// observers, handlers de ponteiro, overlay de anotações). O resto vira um
// espaçador leve que apenas reserva a altura e reporta o foco ao rolar. Sem
// isso, um material de 3000 páginas montava 3000 componentes pesados de uma vez
// e travava o navegador. O raio dá folga suficiente para leitura fluida e
// pré-carrega algumas páginas à frente/atrás.
const LIVE_PAGE_RADIUS = 3

// Quantas páginas à frente têm os bytes baixados de antemão. Diferente do raio
// acima: aqui não se cria canvas nenhum, só se guarda o PDF de uma página
// (centenas de KB) no cache. É o jeito barato de a página seguinte aparecer na
// hora — o caro é canvas, não byte.
function prefetchAhead() {
  return isLowMemoryDevice() ? 1 : isMobileViewport() ? 2 : 3
}

function liveRadiusForZoom(zoom: number) {
  // No celular o raio é FIXO em 3 (7 páginas vivas, ~112 MB de canvas com o
  // teto de 3,5 Mpx). Fixo é o ponto: quando ele variava, uma mudança de zoom
  // montava/desmontava páginas no meio do gesto e todas re-rasterizavam de uma
  // vez. O teto de megapixels já é quem limita a memória — o raio não precisa
  // fazer esse trabalho também.
  if (isLowMemoryDevice()) return 1
  if (isMobileViewport()) return 2
  // No desktop o zoom é absoluto e pode ir bem alto, com canvas de 9 Mpx. Aí
  // vale encolher: numa página muito ampliada as vizinhas nem aparecem na tela.
  if (zoom > 1.8) return 1
  if (zoom > 1.2) return 2
  return LIVE_PAGE_RADIUS
}

// Quantas páginas ficam materializadas no DOM (como página real OU espaçador)
// ao redor da âncora. O resto vira dois blocos de preenchimento com a altura
// somada. Num material de 2000+ páginas, renderizar todas é ~4 mil elementos
// que o React percorre a cada rolagem — trava o aparelho.
const WINDOW_RADIUS = 25
// De quantas páginas a leitura precisa se afastar da âncora para a janela ser
// recentrada. Bem menor que o raio, para a posição atual nunca chegar perto da
// borda da janela materializada.
const WINDOW_RECENTER_BAND = 10

// Quantas miniaturas o painel lateral monta de uma vez, ao redor da página
// atual. Sem isso, um material de 2000+ páginas monta milhares de botões assim
// que o painel abre — e no desktop ele abre ligado por padrão.
const THUMB_WINDOW = 60

// A partir de quantas páginas o material é tratado como "grande" e abre em
// "uma página por vez".
//
// Rolagem contínua empilha o documento inteiro numa única página web, e isso
// não escala. Com 5000 páginas o documento passa de 4 milhões de pixels de
// altura já em 100% de zoom (11 milhões no zoom máximo), e o Safari do iOS
// para de pintar regiões acima disso — daí molduras colapsadas e faixas
// vazias. Some-se a isso o erro acumulado: a altura das páginas ainda não
// desenhadas é ESTIMADA pela primeira página medida, e num material com
// páginas de tamanhos diferentes esse erro cresce a cada página até a posição
// calculada não corresponder mais ao que está na tela.
//
// Em "uma página por vez" nada disso existe: há UMA página no DOM, sem
// documento gigante, sem preenchimento estimado e sem erro para acumular.
// Os outros modos continuam disponíveis no seletor — só deixam de ser o
// padrão neste tamanho de material.
const LARGE_DOCUMENT_PAGES = 400

// Dimensões-padrão de página (A4 em pt) usadas como fallback do espaçador antes
// de a primeira página real reportar o tamanho verdadeiro.
const DEFAULT_PAGE_WIDTH = 595
const DEFAULT_PAGE_HEIGHT = 842

interface AnnotationData {
  drawingMode?: DrawingMode
  strokeWidthRatio?: number
  opacity?: number
  fontFamily?: string
  fontSize?: number
  bold?: boolean
  italic?: boolean
  underline?: boolean
  align?: TextAlign
  noteColor?: string
}

interface PageSize {
  width: number
  height: number
}

interface PdfPoint {
  x: number
  y: number
}

interface DrawingStyle {
  mode: DrawingMode
  color: string
  width: number
  opacity: number
  holdToShape: boolean
}

interface TextStyle {
  fontFamily: string
  fontSize: number
  color: string
  bold: boolean
  italic: boolean
  underline: boolean
  align: TextAlign
}

interface EditorState {
  kind: 'text' | 'note'
  point: PdfPoint
  content: string
  annotation?: PdfAnnotation
  textStyle: TextStyle
  noteColor: string
}

interface DrawingDraft {
  points: PdfPoint[]
  mode: DrawingMode
  color: string
  strokeWidthRatio: number
  opacity: number
  start: PdfPoint
  current: PdfPoint
  autoShape: boolean
}

interface HighlightDraft {
  start: PdfPoint
  current: PdfPoint
  points: PdfPoint[]
  strokeWidthRatio: number
  color: string
}

const PAGE_BYTES_CACHE_TTL_MS = 10 * 60 * 1000
// Limite por BYTES, não por quantidade de páginas.
//
// Era só um teto de 36 entradas. O tamanho de uma página varia demais para
// isso significar alguma coisa: um PDF de texto puro tem páginas de ~100 KB,
// mas um material com imagens (o caso aqui) pode ter vários MB por página,
// porque a página recortada carrega junto as imagens e fontes que usa. 36
// páginas de 3 MB são 108 MB de buffer — e ainda por cima o cache de
// documentos parseados guarda uma CÓPIA de cada um deles. Somado ao canvas,
// estourava a memória e o iOS matava a aba ("um problema ocorreu
// repetidamente"). Com teto em bytes, o pior caso é conhecido.
const PAGE_BYTES_CACHE_MAX_ENTRIES = 36
function pageBytesBudget() {
  return isLowMemoryDevice() ? 12 * 1024 * 1024 : isMobileViewport() ? 20 * 1024 * 1024 : 80 * 1024 * 1024
}
// Domínio da assinatura no rodapé do celular. Sai da MESMA variável que o resto
// do app já usa (lib/serial-keys.ts faz igual), sem protocolo nem "www": ali é
// assinatura de marca, não link clicável.
const BRAND_DOMAIN = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.domineaqui.com.br')
  .replace(/^https?:\/\//, '')
  .replace(/^www\./, '')
  .replace(/\/+$/, '')

const COLOR_SWATCHES = ['#22c55e', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#111827']
const HIGHLIGHT_SWATCHES = ['#facc15', '#fb923c', '#86efac', '#93c5fd', '#f9a8d4']
const NOTE_SWATCHES = ['#fde68a', '#bbf7d0', '#bfdbfe', '#fecdd3', '#ddd6fe']
const LASER_SWATCHES = ['#ef4444', '#ec4899', '#f97316', '#22c55e', '#3b82f6']
// Tempo (ms) que cada traço da caneta laser leva para desaparecer sozinho,
// no estilo GoodNotes: escreve/aponta e a tinta some pouco depois.
const LASER_FADE_MS = 900
const FONT_OPTIONS = ['Inter', 'Arial', 'Georgia', 'Times New Roman', 'Courier New']
const ERASER_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cpath d='M9 18 17.5 9.5a3 3 0 0 1 4.24 4.24L14.5 21H8l-3-3 4-4Z' fill='%23fff' stroke='%23111827' stroke-width='2' stroke-linejoin='round'/%3E%3Cpath d='M13 14 17 18' stroke='%23111827' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") 7 21, cell`
const pageBytesCache = new Map<string, { bytes: Uint8Array; pageCount?: number; expiresAt: number }>()
const pageBytesInflight = new Map<string, Promise<{ bytes: Uint8Array; pageCount?: number }>>()

let pdfWorkerConfigured = false

async function getPdfJs() {
  const pdfjsLib = await import('pdfjs-dist')
  if (!pdfWorkerConfigured) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
    pdfWorkerConfigured = true
  }
  return pdfjsLib
}

// Cada página é um PDF marcado individualmente no servidor (operação pesada
// de CPU/memória). Ao abrir o documento, uma requisição por página visível era
// disparada ao mesmo tempo, sem limite de concorrência, sem timeout e sem
// retry. A rajada sobrecarregava o endpoint de marca d'água e algumas
// requisições travavam ou falhavam, deixando a página presa no spinner até um
// F5 reativá-la. As constantes/fila abaixo resolvem isso na origem.
const PAGE_FETCH_MAX_CONCURRENCY = 3
const PAGE_FETCH_TIMEOUT_MS = 25000
const PAGE_FETCH_MAX_ATTEMPTS = 4

// Prioridade da requisição. As miniaturas do painel lateral usam exatamente o
// mesmo endpoint caro das páginas de leitura; como o painel abre ligado por
// padrão, ~10 miniaturas entravam na fila ANTES da página que o usuário quer
// ler e ficavam com os 3 slots. Era o "uma carrega e a outra não". Agora a
// leitura tem precedência absoluta: miniatura só ganha slot quando não há
// nenhuma página de leitura ativa nem esperando.
type FetchPriority = 'reader' | 'thumb'

let pageFetchActive = 0
let readerFetchActive = 0
const pageFetchQueues: Record<FetchPriority, Array<() => void>> = { reader: [], thumb: [] }

function drainPageFetchQueue() {
  // Leitura primeiro, sempre.
  if (pageFetchActive < PAGE_FETCH_MAX_CONCURRENCY) {
    const nextReader = pageFetchQueues.reader.shift()
    if (nextReader) {
      nextReader()
      return
    }
  }
  // Miniatura só entra com a leitura totalmente quieta — nada ativo e nada na
  // fila. Assim o painel se preenche sozinho depois, sem competir na abertura.
  if (readerFetchActive === 0 && pageFetchQueues.reader.length === 0 && pageFetchActive < PAGE_FETCH_MAX_CONCURRENCY) {
    const nextThumb = pageFetchQueues.thumb.shift()
    if (nextThumb) nextThumb()
  }
}

function acquirePageFetchSlot(priority: FetchPriority): Promise<() => void> {
  return new Promise((resolve) => {
    const grant = () => {
      pageFetchActive += 1
      if (priority === 'reader') readerFetchActive += 1
      let released = false
      resolve(() => {
        if (released) return
        released = true
        pageFetchActive -= 1
        if (priority === 'reader') readerFetchActive -= 1
        drainPageFetchQueue()
      })
    }
    const canRunNow = priority === 'reader'
      ? pageFetchActive < PAGE_FETCH_MAX_CONCURRENCY
      : readerFetchActive === 0 && pageFetchQueues.reader.length === 0 && pageFetchActive < PAGE_FETCH_MAX_CONCURRENCY
    if (canRunNow) grant()
    else pageFetchQueues[priority].push(grant)
  })
}

const pageFetchSleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Erro de carregamento de página enriquecido: `status` distingue rate limit
// (429) de falha real, e `retryAfterMs` carrega a espera pedida pelo servidor
// até a UI, que mostra uma contagem regressiva em vez de um erro vermelho.
type PageFetchError = Error & { status?: number; retryAfterMs?: number }

async function fetchPdfPageBytesOnce(materialId: string, pageNumber: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PAGE_FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(
      `/api/materiais/${materialId}/pdf-viewer/page?page=${pageNumber}`,
      { cache: 'no-store', signal: controller.signal }
    )
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      // `adminDetail` só vem preenchido quando quem chamou é admin (ver
      // route.ts) — mostra o motivo real do 500 em vez do texto genérico,
      // sem expor detalhe nenhum pro usuário comum.
      const message = data.adminDetail
        ? `${data.error || 'Falha ao carregar pagina'} (${data.adminDetail})`
        : data.error || 'Falha ao carregar pagina'
      const err = new Error(message) as PageFetchError
      err.status = response.status
      // O servidor manda Retry-After junto do 429. Respeitar esse valor evita
      // que o backoff cego bata de novo antes de a janela do rate limit virar.
      const retryAfter = Number(response.headers.get('Retry-After') || 0)
      if (Number.isFinite(retryAfter) && retryAfter > 0) {
        err.retryAfterMs = Math.min(60_000, retryAfter * 1000)
      }
      throw err
    }

    const pageCountHeader = Number(response.headers.get('X-DomineAqui-Page-Count') || 0)
    return {
      bytes: new Uint8Array(await response.arrayBuffer()),
      pageCount: Number.isFinite(pageCountHeader) && pageCountHeader > 0 ? pageCountHeader : undefined,
    }
  } finally {
    clearTimeout(timer)
  }
}

async function fetchPdfPageBytes(
  materialId: string,
  pageNumber: number,
  priority: FetchPriority = 'reader'
) {
  const key = `${materialId}:${pageNumber}`
  const now = Date.now()
  const cached = pageBytesCache.get(key)
  if (cached && cached.expiresAt > now) {
    return { bytes: cached.bytes, pageCount: cached.pageCount }
  }
  if (cached) pageBytesCache.delete(key)

  const pending = pageBytesInflight.get(key)
  if (pending) return pending

  const request = (async () => {
    const release = await acquirePageFetchSlot(priority)
    try {
      let lastError: unknown
      for (let attempt = 1; attempt <= PAGE_FETCH_MAX_ATTEMPTS; attempt += 1) {
        try {
          const result = await fetchPdfPageBytesOnce(materialId, pageNumber)

          pageBytesCache.set(key, {
            ...result,
            expiresAt: Date.now() + PAGE_BYTES_CACHE_TTL_MS,
          })
          // Descarta os mais antigos até caber no orçamento de bytes E na
          // contagem. O Map preserva a ordem de inserção, então o primeiro da
          // iteração é sempre o mais velho.
          const budget = pageBytesBudget()
          let total = 0
          for (const entry of pageBytesCache.values()) total += entry.bytes.byteLength
          while ((total > budget || pageBytesCache.size > PAGE_BYTES_CACHE_MAX_ENTRIES) && pageBytesCache.size > 1) {
            const oldestKey = pageBytesCache.keys().next().value
            if (!oldestKey || oldestKey === key) break
            total -= pageBytesCache.get(oldestKey)?.bytes.byteLength || 0
            pageBytesCache.delete(oldestKey)
          }
          return result
        } catch (err) {
          lastError = err
          // Só re-tenta falhas transitórias (rede/abort, 5xx, 408, 429);
          // erros de cliente reais (ex.: 403) falham rápido.
          const { status, retryAfterMs } = (err || {}) as PageFetchError
          const retriable =
            status === undefined || status >= 500 || status === 408 || status === 429
          if (!retriable || attempt >= PAGE_FETCH_MAX_ATTEMPTS) break
          // Quando o servidor disse quanto esperar (429), obedecemos; senão,
          // backoff exponencial como antes.
          await pageFetchSleep(retryAfterMs || Math.min(8000, 500 * 2 ** (attempt - 1)))
        }
      }
      throw lastError
    } finally {
      release()
    }
  })()

  pageBytesInflight.set(key, request)
  try {
    return await request
  } finally {
    pageBytesInflight.delete(key)
  }
}

// ─── Cache de documentos pdf.js já parseados ────────────────────────────────
// Antes, o efeito de render tinha `zoom` nas dependências e fazia
// getDocument → getPage → render → doc.destroy() a cada passo de zoom. Ou
// seja: arrastar o zoom re-parseava o PDF de TODAS as páginas vivas, uma vez
// por passo, e jogava fora o resultado. Era a maior fonte de travamento.
// Agora o parse acontece uma vez por página e o proxy fica vivo num LRU; o
// zoom só re-rasteriza (ver `rasterScaleFor` e o debounce de `renderScale`).
//
// A contagem de referências é obrigatória: destruir um doc enquanto um
// `page.render()` ainda está em curso quebra a página. Na eviction marcamos
// `doomed` e só destruímos quando o último consumidor solta.
// Precisa caber a janela inteira de páginas vivas (7) COM folga: se o teto
// ficar rente ao número de páginas referenciadas, virar uma página evicta um
// documento que vai ser pedido de novo em seguida, e o parse se repete à toa.
// Cada documento parseado guarda uma CÓPIA dos bytes da página (o pdf.js
// assume a posse do buffer que recebe), então este teto multiplica o tamanho
// de página igual ao cache de bytes. Precisa caber a janela de páginas vivas
// com folga — abaixo disso, virar uma página evicta um documento que será
// pedido logo em seguida e o parse se repete à toa.
function pageProxyCacheMax() {
  return isLowMemoryDevice() ? 7 : isMobileViewport() ? 9 : 14
}

// Teto por bytes, além do de quantidade: numa página com imagens a cópia é de
// megabytes, e só contar entradas não diz nada sobre a memória usada.
function pageProxyBudget() {
  return isLowMemoryDevice() ? 12 * 1024 * 1024 : isMobileViewport() ? 24 * 1024 * 1024 : 96 * 1024 * 1024
}

interface PageProxyEntry {
  doc: any
  page: any
  totalPages: number
  bytes: number
  refs: number
  doomed: boolean
  lastUsed: number
}

const pageProxyCache = new Map<string, PageProxyEntry>()
const pageProxyInflight = new Map<string, Promise<PageProxyEntry>>()

function destroyProxyEntry(entry: PageProxyEntry) {
  try {
    entry.doc?.destroy?.()
  } catch {}
}

function evictPageProxies() {
  const maxEntries = pageProxyCacheMax()
  const budget = pageProxyBudget()
  let totalBytes = 0
  for (const entry of pageProxyCache.values()) totalBytes += entry.bytes
  if (pageProxyCache.size <= maxEntries && totalBytes <= budget) return

  // Só entradas ociosas podem sair; as em uso ficam até serem soltas.
  const idle = Array.from(pageProxyCache.entries())
    .filter(([, entry]) => entry.refs === 0)
    .sort((a, b) => a[1].lastUsed - b[1].lastUsed)

  for (const [key, entry] of idle) {
    if (pageProxyCache.size <= maxEntries && totalBytes <= budget) break
    pageProxyCache.delete(key)
    totalBytes -= entry.bytes
    destroyProxyEntry(entry)
  }

  if ((pageProxyCache.size > maxEntries || totalBytes > budget) && process.env.NODE_ENV !== 'production') {
    // Sinal de vazamento: todo mundo referenciado e nada pôde ser liberado.
    console.warn('[pdf-viewer] cache de proxies acima do teto com todas as entradas em uso')
  }
}

async function acquirePageProxy(
  materialId: string,
  pageNumber: number,
  priority: FetchPriority = 'reader'
): Promise<PageProxyEntry> {
  const key = `${materialId}:${pageNumber}`
  const cached = pageProxyCache.get(key)
  if (cached && !cached.doomed) {
    cached.refs += 1
    cached.lastUsed = Date.now()
    return cached
  }

  const pending = pageProxyInflight.get(key)
  if (pending) {
    const entry = await pending
    entry.refs += 1
    entry.lastUsed = Date.now()
    evictPageProxies()
    return entry
  }

  const load = (async () => {
    const { bytes, pageCount } = await fetchPdfPageBytes(materialId, pageNumber, priority)
    const pdfjs = await getPdfJs()
    // `slice()` porque o pdf.js assume a posse do buffer que recebe e os
    // mesmos bytes ficam no `pageBytesCache` para reuso.
    const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise
    const page = await doc.getPage(1)
    const entry: PageProxyEntry = {
      doc,
      page,
      totalPages: pageCount || 0,
      // Tamanho da cópia que o pdf.js está segurando, para a eviction poder
      // raciocinar em memória e não em "número de páginas".
      bytes: bytes.byteLength,
      refs: 0,
      doomed: false,
      lastUsed: Date.now(),
    }
    pageProxyCache.set(key, entry)
    // A eviction NÃO roda aqui: neste ponto a entrada recém-criada ainda está
    // com refs = 0 e, se todas as outras estivessem em uso, ela seria a única
    // candidata — seria destruída no instante anterior a quem a pediu
    // contabilizar a referência. Evictamos depois do incremento, abaixo.
    return entry
  })()

  pageProxyInflight.set(key, load)
  try {
    const entry = await load
    entry.refs += 1
    entry.lastUsed = Date.now()
    evictPageProxies()
    return entry
  } finally {
    pageProxyInflight.delete(key)
  }
}

function releasePageProxy(materialId: string, pageNumber: number) {
  const key = `${materialId}:${pageNumber}`
  const entry = pageProxyCache.get(key)
  if (!entry) return
  entry.refs = Math.max(0, entry.refs - 1)
  entry.lastUsed = Date.now()
  if (entry.doomed && entry.refs === 0) {
    pageProxyCache.delete(key)
    destroyProxyEntry(entry)
    return
  }
  evictPageProxies()
}

// ─── Orçamento de pixels do canvas ──────────────────────────────────────────
// A versão anterior forçava um PISO de DPR (2 no celular, 2,5 no desktop) e
// multiplicava por `zoom` sem teto nenhum. Em zoom 2,6 com DPR 3,5 a escala
// chegava a 9,1 — uma A4 virava ~5400x7660px, ~41 Mpx, ~165 MB de canvas.
// Vezes as páginas vivas, passava de 1 GB e a aba morria no celular.
// Agora: DPR real limitado a 2 e um TETO de megapixels por canvas. A escala
// continua crescendo com o zoom (a página fica mesmo mais nítida ao ampliar),
// só que dentro de um orçamento fixo de memória.
// Teto de megapixels por canvas.
//
// A conta que define o valor do celular (A4 de 595x842pt, tela de ~390pt com
// DPR 3 = 1170px reais de largura):
//
//   2,2 Mpx -> 1247px de canvas -> 1,07x a tela na largura ajustada
//   3,5 Mpx -> 1573px de canvas -> 1,34x a tela na largura ajustada
//
// Ou seja: na largura ajustada já 2,2 entrega mais pixels do que a tela mostra,
// e subir não muda nada de visível. A diferença aparece AMPLIADO, onde a mesma
// imagem é esticada: em 2,5x o zoom, 2,2 Mpx cai para 0,43x a densidade da tela
// (visivelmente borrado) e 3,5 Mpx vai a 0,54x. Daí a escolha de 3,5.
//
// O pico com 7 páginas vivas fica em ~112 MB, com folga larga para o limite de
// memória de canvas do Safari do iOS. O que tinha derrubado a aba não era este
// número: era `window.innerWidth` (viewport VISUAL no iOS) fazendo o leitor se
// achar desktop no meio da pinça e trocar 2,2 por 9 Mpx de uma vez. Ver
// isMobileViewport().
const MAX_CANVAS_MPX_MOBILE = 3.0
const MAX_CANVAS_MPX_LOW_MEMORY = 2.0
const MAX_CANVAS_MPX_DESKTOP = 9

// ATENÇÃO: não usar `window.innerWidth` aqui.
//
// No Safari do iOS, `window.innerWidth` reflete o viewport VISUAL — ele cresce
// quando o usuário pinça para trás. Como esta função decidia o teto de
// megapixels e quantas páginas ficam vivas, pinçar para trás fazia o valor
// cruzar 768 e virar "desktop" no meio do gesto: o teto saltava de 2,2 para
// 9 Mpx (4x mais pixels por canvas) e as páginas vivas de 3 para 7. Resultado:
// todas as páginas re-rasterizavam de uma vez, ~250 MB de canvas, e o Safari
// pintava tudo de branco. Era exatamente o "pinço pra trás e recarrega a tela".
//
// `matchMedia` responde pelo viewport de LAYOUT, que a pinça não altera.
let mobileQuery: MediaQueryList | null = null

// Aparelho com pouca memória. `deviceMemory` existe no Chrome/Android e NÃO
// existe no Safari do iOS — então isto só ajuda no Android fraco; para o iOS
// quem protege são os orçamentos de celular, que já são conservadores.
function isLowMemoryDevice() {
  if (typeof navigator === 'undefined') return false
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  return typeof memory === 'number' && memory > 0 && memory <= 4
}

function isMobileViewport() {
  if (typeof window === 'undefined') return false
  if (typeof window.matchMedia !== 'function') return false
  if (!mobileQuery) mobileQuery = window.matchMedia('(max-width: 767px)')
  return mobileQuery.matches
}

function rasterScaleFor(baseWidth: number, baseHeight: number, scale: number) {
  const deviceDpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1
  const dpr = Math.min(Math.max(deviceDpr, 1), 2)
  let effective = scale * dpr
  const budgetMpx = isLowMemoryDevice()
    ? MAX_CANVAS_MPX_LOW_MEMORY
    : isMobileViewport() ? MAX_CANVAS_MPX_MOBILE : MAX_CANVAS_MPX_DESKTOP
  const budget = budgetMpx * 1_000_000
  const wanted = baseWidth * baseHeight * effective * effective
  if (wanted > budget) effective *= Math.sqrt(budget / wanted)
  return effective
}

// Rasterização em fila de UM. O render vai para um canvas fora da tela antes de
// ser copiado para o visível (para a página não piscar em branco), e isso dobra
// a memória daquela página enquanto acontece. Sem esta fila, um evento que
// invalidasse todas as páginas vivas ao mesmo tempo alocava um canvas extra
// para CADA uma — o pico multiplicado por 7 era o que derrubava a aba no iOS.
let rasterQueue: Promise<unknown> = Promise.resolve()

// `requestIdleCallback` não existe no Safari mais antigo; o timeout cobre.
function scheduleIdle(task: () => void): number {
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback
  if (typeof ric === 'function') return ric(task, { timeout: 1200 })
  return window.setTimeout(task, 240)
}

function cancelIdle(handle: number) {
  const cic = (window as Window & { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback
  if (typeof cic === 'function') cic(handle)
  else window.clearTimeout(handle)
}

function enqueueRaster<T>(task: () => Promise<T>): Promise<T> {
  const run = rasterQueue.then(task, task)
  // A cauda ignora o resultado (e a falha) para a fila nunca travar.
  rasterQueue = run.catch(() => {})
  return run
}

// ─── IntersectionObservers compartilhados ───────────────────────────────────
// Cada página e cada espaçador criava o SEU próprio IntersectionObserver. Num
// material de milhares de páginas em modo contínuo — que agora é o padrão —
// isso significava milhares de observers no primeiro paint. O painel de
// miniaturas já usava um observer compartilhado; aqui aplicamos o mesmo
// desenho para o foco de leitura e para a visibilidade das páginas.
function createSharedObserver(rootMargin: string) {
  let observer: IntersectionObserver | null = null
  const callbacks = new WeakMap<Element, () => void>()

  function ensure() {
    if (observer || typeof window === 'undefined') return observer
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          callbacks.get(entry.target)?.()
        }
      },
      { rootMargin, threshold: 0 }
    )
    return observer
  }

  return function observe(element: Element, onEnter: () => void) {
    const instance = ensure()
    if (!instance) return () => {}
    callbacks.set(element, onEnter)
    instance.observe(element)
    return () => {
      callbacks.delete(element)
      instance.unobserve(element)
    }
  }
}

// Foco de leitura: a página passa a ser "a atual" quando cruza a faixa central.
const observePageFocus = createSharedObserver('-18% 0px -68% 0px')
// Visibilidade: dispara o carregamento um pouco antes de a página entrar.
const observePageVisible = createSharedObserver('220px 0px')

// ─── Tutorial da primeira visita ────────────────────────────────────────────
// Reusa o GuidedTour do Manual Clínico (holofote + cartão), mesmo padrão de
// flag no localStorage. A versão vai no nome da chave: mexeu nos passos a
// ponto de valer remostrar, sobe para v2.
const TOUR_STORAGE_KEY = 'domineaqui:pdf-viewer:tour:v1'

// Escrito para quem nunca usou um leitor de PDF.
//
// `targets` é uma LISTA de candidatos em ordem de preferência, e não um
// seletor com vírgulas: os controles de desktop continuam no HTML sob
// `hidden lg:flex` no celular, então um `querySelector('a, b')` devolveria
// sempre o primeiro do DOM (o de desktop) mesmo com ele invisível — e o passo
// do celular sumiria. Aqui escolhemos o primeiro candidato realmente VISÍVEL.
interface ViewerTourStep {
  targets?: string[]
  title: string
  body: string
}

const TOUR_STEPS: ViewerTourStep[] = [
  {
    title: 'Bem-vindo ao seu material',
    body: 'Vou te mostrar o essencial em 30 segundos. Pode pular a qualquer momento — este tutorial fica guardado no botão de ajuda.',
  },
  {
    targets: ['[data-tour="viewer-mode"]', '[data-tour="viewer-mode-mobile"]'],
    title: 'Escolha como quer ler',
    body: 'O padrão é rolagem contínua: é só deslizar para baixo, como numa página comum. Se preferir virar de página em página, troque aqui — e é aqui também que você aumenta o tamanho da letra.',
  },
  {
    targets: ['[data-tour="viewer-pagenav"]', '[data-tour="viewer-pagenav-mobile"]'],
    title: 'Onde você está',
    body: 'Este número mostra a página atual e o total. Toque nele para pular direto para qualquer página.',
  },
  {
    // Só no celular/tablet: no desktop este alvo não existe e o passo some
    // sozinho (ver findVisibleTourTarget) — o gesto também não faz sentido lá.
    targets: ['[data-tour="viewer-pagenav-mobile"]'],
    title: 'Vire a página com o dedo',
    body: 'Não precisa mirar nas setinhas: deslize o dedo para o lado — ou para cima e para baixo, no modo "uma página por vez" — e a página vira. Se a página estiver ampliada, o dedo primeiro arrasta o que falta ver; ao chegar na borda, o próximo gesto vira.',
  },
  {
    targets: ['[data-tour="viewer-zoom"]'],
    title: 'Deixe a letra do seu tamanho',
    body: 'Aumente ou diminua o texto quando quiser. Ampliado, a página fica mais larga que a tela e você arrasta para o lado para ler — aparece um aviso embaixo com o tamanho atual, e um toque nele volta ao normal.',
  },
  {
    targets: ['[data-tour="viewer-summary"]', '[data-tour="viewer-summary-strip"]'],
    title: 'Pule direto para o capítulo',
    body: 'O sumário lista os tópicos do material. Um toque no título e você já está lá; a setinha ao lado abre os subtópicos daquele tópico, então a lista fica curta mesmo em material grande.',
  },
  {
    targets: ['[data-tour="viewer-thumbs"]', '[data-tour="viewer-nav-mobile"]'],
    title: 'Reconheça a página pela imagem',
    body: 'Aqui ficam miniaturas de todas as páginas. Ajuda quando você lembra da aparência da página, mas não do número.',
  },
  {
    targets: ['[data-tour="viewer-tools"]', '[data-tour="viewer-tools-mobile"]'],
    title: 'Grife e escreva, como num caderno',
    body: 'Marca-texto, notas, caneta, texto e marcadores. Tudo fica salvo na sua conta e reaparece quando você voltar, em qualquer aparelho.',
  },
  {
    targets: ['[data-tour="viewer-fit"]'],
    title: 'Perdeu o tamanho ideal?',
    body: '"Ajustar à tela" devolve a página inteira à tela de uma vez, sem você ter que acertar o zoom na mão.',
  },
  {
    title: 'Pronto, é só ler',
    body: 'Seu progresso é salvo sozinho: na próxima vez você volta exatamente nesta página. O botão de ajuda tem este tutorial e a lista de atalhos.',
  },
]

// Um alvo só conta se estiver de fato ocupando espaço na tela.
function findVisibleTourTarget(candidates: string[]): string | null {
  for (const selector of candidates) {
    const element = document.querySelector(selector) as HTMLElement | null
    if (!element) continue
    const rect = element.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) return selector
  }
  return null
}

function buildTourSteps(): TourStep[] {
  const steps: TourStep[] = []
  for (const step of TOUR_STEPS) {
    if (!step.targets) {
      steps.push({ title: step.title, body: step.body })
      continue
    }
    const target = findVisibleTourTarget(step.targets)
    if (target) steps.push({ target, title: step.title, body: step.body })
  }
  return steps
}

// Retomada de leitura: a última página/modo por material vive no localStorage
// (lib/material-reading-progress), junto com o índice de leituras recentes que
// alimenta a área "Continuar lendo" em /materiais e /dashboard.

// ─── Preferências do leitor (globais, não por material) ─────────────────────
// Só a posição de leitura era guardada. Zoom, modo, ferramenta, cores,
// espessura e os painéis voltavam ao padrão a cada abertura — quem finalmente
// achava uma configuração confortável perdia tudo no F5. Mesmo molde do
// UIPreferencesContext do projeto: leitura tolerante a falha, escrita com
// debounce, sem hook genérico (o projeto não tem um).
const PREFS_STORAGE_KEY = 'domineaqui:pdf-viewer:prefs:v1'

interface ViewerPrefs {
  zoom?: number
  mode?: ViewerMode
  tool?: AnnotationTool
  showThumbs?: boolean
  sidePanelTab?: 'pages' | 'summary'
  showAnnotations?: boolean
  showGuide?: boolean
  highlightColor?: string
  highlightWidth?: number
  noteColor?: string
  laserColor?: string
  drawingStyle?: DrawingStyle
  textStyle?: TextStyle
}

function readViewerPrefs(): ViewerPrefs {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as ViewerPrefs) : {}
  } catch {
    return {}
  }
}

let prefsWriteTimer: number | null = null
let prefsPending: ViewerPrefs = {}

function writeViewerPrefs(patch: ViewerPrefs) {
  if (typeof window === 'undefined') return
  prefsPending = { ...prefsPending, ...patch }
  if (prefsWriteTimer) window.clearTimeout(prefsWriteTimer)
  prefsWriteTimer = window.setTimeout(() => {
    prefsWriteTimer = null
    const merged = { ...readViewerPrefs(), ...prefsPending }
    prefsPending = {}
    try {
      window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(merged))
    } catch {}
  }, 300)
}

function clampZoom(value: number, min = 0.55, max = 2.6) {
  return Math.min(max, Math.max(min, Number(value.toFixed(2))))
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function createEmptyAnnotation(input: Partial<PdfAnnotation>, materialId: string): PdfAnnotation {
  const now = new Date().toISOString()
  const id = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
  return {
    _id: id,
    id,
    userId: 'local',
    materialId,
    pageNumber: input.pageNumber || 1,
    type: input.type || 'note',
    position: input.position || {},
    content: input.content || '',
    color: input.color || '#22c55e',
    data: input.data || {},
    createdAt: now,
    updatedAt: now,
  }
}

function extractObjectId(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') {
    if (value.startsWith('temp-') || value === 'draft') return ''
    const exact = value.match(/^[a-f\d]{24}$/i)
    if (exact) return exact[0]
    const embedded = value.match(/[a-f\d]{24}/i)
    return embedded?.[0] || ''
  }
  if (typeof value === 'object') {
    const objectValue = value as Record<string, unknown>
    return (
      extractObjectId(objectValue.$oid) ||
      extractObjectId(objectValue.oid) ||
      extractObjectId(objectValue.id) ||
      extractObjectId(objectValue._id) ||
      extractObjectId(String(value))
    )
  }
  return extractObjectId(String(value))
}

function getPersistedAnnotationId(annotation: PdfAnnotation) {
  return extractObjectId(annotation.id) || extractObjectId(annotation._id)
}

function normalizeRect(start: PdfPoint, current: PdfPoint, minWidth = 0.012, minHeight = 0.008) {
  const x = Math.min(start.x, current.x)
  const y = Math.min(start.y, current.y)
  const width = Math.abs(start.x - current.x)
  const height = Math.abs(start.y - current.y)
  return {
    x: clamp01(width < minWidth ? start.x - minWidth / 2 : x),
    y: clamp01(height < minHeight ? start.y - minHeight / 2 : y),
    width: Math.min(width < minWidth ? minWidth : width, 1 - x),
    height: Math.min(height < minHeight ? minHeight : height, 1 - y),
  }
}

function distance(a: PdfPoint, b: PdfPoint) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

function getPathLength(points: PdfPoint[]) {
  let total = 0
  for (let index = 1; index < points.length; index++) {
    total += distance(points[index - 1], points[index])
  }
  return total
}

function getLineDeviation(points: PdfPoint[]) {
  if (points.length < 3) return 0
  const start = points[0]
  const end = points[points.length - 1]
  const base = distance(start, end)
  if (base < 0.001) return Number.POSITIVE_INFINITY

  let maxDeviation = 0
  for (const point of points) {
    const deviation = Math.abs(
      (end.y - start.y) * point.x -
      (end.x - start.x) * point.y +
      end.x * start.y -
      end.y * start.x
    ) / base
    maxDeviation = Math.max(maxDeviation, deviation)
  }
  return maxDeviation
}

function shouldConvertToLine(points: PdfPoint[]) {
  if (points.length < 2 || points.length > 14) return false
  const start = points[0]
  const end = points[points.length - 1]
  const straightDistance = distance(start, end)
  const pathLength = getPathLength(points)
  const bounds = getPointBounds(points)
  const maxDimension = Math.max(bounds.width, bounds.height)
  if (straightDistance < 0.045 || pathLength <= 0) return false

  const efficiency = straightDistance / pathLength
  const deviation = getLineDeviation(points)
  return efficiency > 0.965 && deviation < Math.max(0.006, maxDimension * 0.035)
}

function getPointBounds(points: PdfPoint[]) {
  if (!points.length) return { x: 0, y: 0, width: 0.08, height: 0.05 }
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  return {
    x: minX,
    y: minY,
    width: Math.max(0.01, maxX - minX),
    height: Math.max(0.01, maxY - minY),
  }
}

function getAnnotationBounds(annotation: PdfAnnotation) {
  if (annotation.position.points?.length) return getPointBounds(annotation.position.points)
  return {
    x: annotation.position.x || 0,
    y: annotation.position.y || 0,
    width: annotation.position.width || 0.08,
    height: annotation.position.height || 0.05,
  }
}

function pointsToSvgPath(points: PdfPoint[]) {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x * 100} ${points[0].y * 100}`
  const segments = [`M ${points[0].x * 100} ${points[0].y * 100}`]
  for (let index = 1; index < points.length - 1; index++) {
    const current = points[index]
    const next = points[index + 1]
    const midX = ((current.x + next.x) / 2) * 100
    const midY = ((current.y + next.y) / 2) * 100
    segments.push(`Q ${current.x * 100} ${current.y * 100} ${midX} ${midY}`)
  }
  const last = points[points.length - 1]
  segments.push(`L ${last.x * 100} ${last.y * 100}`)
  return segments.join(' ')
}

function pointsToCanvasPath(context: CanvasRenderingContext2D, points: PdfPoint[], width: number, height: number) {
  if (!points.length) return
  context.beginPath()
  context.moveTo(points[0].x * width, points[0].y * height)
  if (points.length === 1) {
    context.lineTo(points[0].x * width + 0.1, points[0].y * height + 0.1)
    return
  }

  for (let index = 1; index < points.length - 1; index++) {
    const current = points[index]
    const next = points[index + 1]
    context.quadraticCurveTo(
      current.x * width,
      current.y * height,
      ((current.x + next.x) / 2) * width,
      ((current.y + next.y) / 2) * height
    )
  }
  const last = points[points.length - 1]
  context.lineTo(last.x * width, last.y * height)
}

function shouldConvertToCircle(points: PdfPoint[]) {
  if (points.length < 10 || points.length > 80) return false
  const first = points[0]
  const last = points[points.length - 1]
  const bounds = getPointBounds(points)
  const maxDimension = Math.max(bounds.width, bounds.height)
  const minDimension = Math.min(bounds.width, bounds.height)
  const pathLength = getPathLength(points)
  if (maxDimension < 0.045 || minDimension < 0.035 || pathLength <= 0) return false

  const closeEnough = distance(first, last) < maxDimension * 0.16
  const roundEnough = bounds.width / bounds.height > 0.58 && bounds.width / bounds.height < 1.72
  const enoughPerimeter = pathLength > maxDimension * 2.45
  const notTooMessy = pathLength < maxDimension * 5.6
  return closeEnough && roundEnough && enoughPerimeter && notTooMessy
}

function resolveDrawingMode(draft: DrawingDraft, durationMs: number) {
  if (!draft.autoShape || draft.mode !== 'free' || durationMs < 620) return draft.mode
  if (shouldConvertToCircle(draft.points)) return 'circle'
  if (shouldConvertToLine(draft.points)) return 'line'
  return 'free'
}

function annotationLabel(type: AnnotationType) {
  const labels: Record<AnnotationType, string> = {
    highlight: 'Marca texto',
    note: 'Nota',
    bookmark: 'Marcador',
    text: 'Texto',
    drawing: 'Desenho',
  }
  return labels[type]
}

function useResizeWidth(ref: React.RefObject<HTMLElement>, deps: React.DependencyList) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const updateWidth = () => setWidth(element.clientWidth)
    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(element)
    return () => observer.disconnect()
  }, deps)
  return width
}

// ─── Gestos de toque ────────────────────────────────────────────────────────
// Aqui houve uma tentativa de pinça PRÓPRIA (escrevendo no zoom do viewer para
// re-rasterizar nítido) e ela foi revertida, porque quebrava na prática:
// o `touchAction` só virava 'none' DEPOIS do re-render que sinalizava "estou
// pinçando". Nos primeiros quadros o navegador já havia começado a rolar, o
// flip cancelava os ponteiros (pointercancel), o gesto reiniciava com os dedos
// já afastados — ou seja, com uma distância-base grande registrada como se
// fosse o início — e o movimento seguinte produzia uma razão enorme. Resultado:
// saltos absurdos de zoom. Corrigir isso exigiria `touchAction: none` fixo, o
// que mataria a rolagem vertical da leitura.
//
// Então a pinça voltou a ser a do NAVEGADOR (`touchAction: pinch-zoom`): amplia
// o bitmap sem re-rasterizar, mas é previsível e é o que o leitor já conhece.
// Para ler com letra maior de verdade existem os botões de zoom, que mexem no
// zoom real e redesenham nítido.
//
// Sobrou só o swipe para virar página: um dedo, sem disputa com o pinch, e
// apenas com a ferramenta "navegar" ativa — desenhar não pode virar página.
//
// O swipe vale nos DOIS eixos, como no GoodNotes: para o lado sempre, e para
// cima/baixo quando não há mais o que rolar naquele eixo (página inteira na
// tela, ou já no fim/começo de uma página ampliada). A regra "só vira quando
// não há rolagem disponível" é o que evita o pior dos dois mundos: virar
// página no meio de uma leitura rolando, ou travar a rolagem por causa do
// gesto de virar.
//
// As medidas e a decisão do gesto moram em `lib/pdf-viewer-swipe.ts` (sem DOM,
// testável sozinho). Aqui fica só a ponte com os eventos de ponteiro.

// Quem realmente rola na vertical sob o dedo: o ancestral com overflow próprio
// (é o caso da tela cheia, onde o shell vira o contêiner de rolagem) ou, na
// falta dele, o documento. Sem isso o gesto vertical se comportaria diferente
// dentro e fora da tela cheia.
function findVerticalScroller(target: EventTarget | null): Element | null {
  let node = target instanceof HTMLElement ? target : null
  while (node) {
    const overflowY = window.getComputedStyle(node).overflowY
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight + SCROLL_EDGE_TOLERANCE) {
      return node
    }
    node = node.parentElement
  }
  return document.scrollingElement || document.documentElement
}

function useViewerGestures(
  ref: React.RefObject<HTMLElement>,
  {
    enabled,
    horizontal,
    vertical,
    onSwipe,
    trackRef,
  }: {
    enabled: boolean
    horizontal: boolean
    vertical: boolean
    onSwipe: (direction: 1 | -1) => void
    trackRef?: React.RefObject<HTMLElement>
  }
) {
  const swipeStartRef = useRef<SwipeStart | null>(null)
  const activePointersRef = useRef(0)
  const pointerIdRef = useRef<number | null>(null)
  const onSwipeRef = useRef(onSwipe)
  onSwipeRef.current = onSwipe
  const axesRef = useRef({ horizontal, vertical })
  axesRef.current = { horizontal, vertical }

  useEffect(() => {
    const element = ref.current
    if (!element || !enabled) return

    activePointersRef.current = 0
    pointerIdRef.current = null

    // Feedback visual direto no DOM: a cada quadro do dedo um setState
    // re-renderizaria a página inteira (canvas incluso) — caro e trêmulo.
    const setTrackOffset = (dx: number, dy: number, animated: boolean) => {
      const track = trackRef?.current
      if (!track) return
      track.style.transition = animated ? 'transform 180ms cubic-bezier(0.22, 1, 0.36, 1)' : ''
      track.style.transform = dx === 0 && dy === 0 ? '' : `translate3d(${dx}px, ${dy}px, 0)`
    }

    const resetTrack = (animated: boolean) => {
      const track = trackRef?.current
      if (!track) return
      if (!animated) {
        track.style.transition = ''
        track.style.transform = ''
        return
      }
      setTrackOffset(0, 0, true)
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return
      activePointersRef.current += 1
      if (activePointersRef.current > 1) {
        // Dois dedos = pinça do navegador. Nada de swipe.
        swipeStartRef.current = null
        pointerIdRef.current = null
        resetTrack(false)
        return
      }
      // O contador vale para a tela inteira (senão um dedo no cabeçalho e
      // outro na página passariam por gesto de um dedo só), mas o gesto em si
      // só começa quando o toque nasce sobre as páginas.
      const target = event.target as Node | null
      if (!target || !element.contains(target)) return

      const { horizontal: allowX, vertical: allowY } = axesRef.current
      // Numa página ampliada, arrastar na horizontal é panorâmica (a linha da
      // página rola), não virada de página — a não ser que a linha já esteja
      // encostada na borda, e aí o gesto seguinte é claramente "virar".
      const row = (event.target as HTMLElement | null)?.closest?.('[data-pdf-page-row]') as HTMLElement | null
      const rowEdges = readScrollEdges({
        scrollStart: row?.scrollLeft ?? 0,
        viewport: row?.clientWidth ?? 0,
        content: row?.scrollWidth ?? 0,
      })
      const scroller = findVerticalScroller(event.target)
      const pageEdges = readScrollEdges({
        scrollStart: scroller?.scrollTop ?? 0,
        viewport: scroller?.clientHeight ?? 0,
        content: scroller?.scrollHeight ?? 0,
      })

      pointerIdRef.current = event.pointerId
      swipeStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        t: Date.now(),
        // "next" = dedo para a esquerda / para cima.
        allowNext: { x: allowX && rowEdges.atEnd, y: allowY && pageEdges.atEnd },
        allowPrev: { x: allowX && rowEdges.atStart, y: allowY && pageEdges.atStart },
        axis: null,
        dropped: false,
      }
      resetTrack(false)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return
      const start = swipeStartRef.current
      if (!start || start.dropped || pointerIdRef.current !== event.pointerId) return

      const dx = event.clientX - start.x
      const dy = event.clientY - start.y

      if (!start.axis) {
        start.axis = lockSwipeAxis(dx, dy)
        if (!start.axis) return
      }

      const delta = start.axis === 'x' ? dx : dy
      if (!isSwipeAllowed(start, start.axis, delta)) {
        // Aquele eixo é da rolagem/panorâmica nativa neste gesto. Solta o
        // gesto de vez para não virar página quando o dedo voltar.
        start.dropped = true
        resetTrack(true)
        return
      }
      setTrackOffset(
        start.axis === 'x' ? rubberBand(dx) : 0,
        start.axis === 'y' ? rubberBand(dy) : 0,
        false
      )
    }

    const finishPointer = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return
      activePointersRef.current = Math.max(0, activePointersRef.current - 1)
      const start = swipeStartRef.current
      if (activePointersRef.current > 0 || pointerIdRef.current !== event.pointerId) {
        // Dedo que não era o do gesto (ou que sobrou de uma pinça): só desfaz o
        // que houver. Sem o `start` nada foi deslocado, e mexer no estilo do
        // track em todo toque da tela seria trabalho à toa.
        if (start) resetTrack(true)
        swipeStartRef.current = null
        pointerIdRef.current = null
        return
      }

      swipeStartRef.current = null
      pointerIdRef.current = null

      const direction = resolveSwipe(start, {
        x: event.clientX,
        y: event.clientY,
        t: Date.now(),
        cancelled: event.type === 'pointercancel',
      })
      // Virou página: o deslocamento sai NA HORA, sem transição. Quem vai
      // posicionar a nova página (scrollIntoView / scrollTo) mede o elemento no
      // quadro seguinte, e um track ainda deslocado deslocaria a conta junto.
      // Sem virada, o gesto volta ao lugar com uma animação curta.
      resetTrack(direction === null)
      if (direction !== null) onSwipeRef.current(direction)
    }

    // Tudo na janela, não no elemento: o dedo que sai da área das páginas antes
    // de levantar (é o que acontece justamente nos gestos longos) entregaria o
    // `pointerup` a outro elemento. Preso no elemento, o contador de dedos
    // nunca voltava a zero e o swipe parava de funcionar até recarregar.
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerup', finishPointer, { passive: true })
    window.addEventListener('pointercancel', finishPointer, { passive: true })
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', finishPointer)
      window.removeEventListener('pointercancel', finishPointer)
      resetTrack(false)
      swipeStartRef.current = null
      pointerIdRef.current = null
      activePointersRef.current = 0
    }
  }, [enabled, ref, trackRef])
}

export function SecurePdfViewer({ materialId }: { materialId: string }) {
  const router = useRouter()
  const viewerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLElement>(null)
  // Coluna das páginas. Só o gesto de swipe escreve nela (transform), para a
  // página acompanhar o dedo sem passar por re-render a cada quadro.
  const pagesTrackRef = useRef<HTMLDivElement>(null)
  const zoomTouchedRef = useRef(false)
  // O leitor já escolheu um modo de leitura à mão? Se sim, não sobrescrevemos.
  const modeTouchedRef = useRef(false)
  // Zoom atual num ref: a pinça precisa do valor no INÍCIO do gesto, sem
  // reanexar os listeners nativos a cada quadro de zoom.
  const zoomRef = useRef(1)
  // Espelha a página atual para leitura síncrona dentro de callbacks estáveis
  // (goToPage) sem recriá-los a cada mudança de página.
  const currentPageRef = useRef(1)
  // Retomada de leitura nos modos contínuo/largura: página para onde rolar
  // assim que o layout existir, e janela de tempo em que o foco por scroll é
  // ignorado — senão o IntersectionObserver do topo reverteria para a pág. 1.
  const pendingResumeRef = useRef<number | null>(null)
  const suppressFocusUntilRef = useRef(0)
  const [access, setAccess] = useState<ViewerAccess | null>(null)
  const [annotations, setAnnotations] = useState<PdfAnnotation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState('1')
  const [zoom, setZoom] = useState(1)
  const [settledZoom, setSettledZoom] = useState(1)
  // Índice em torno do qual a janela de páginas materializadas fica centrada.
  const [windowAnchor, setWindowAnchor] = useState(0)
  const [mode, setMode] = useState<ViewerMode>('single')
  const [tool, setTool] = useState<AnnotationTool>('cursor')
  const [pageSize, setPageSize] = useState<PageSize | null>(null)
  const [showThumbs, setShowThumbs] = useState(true)
  const [sidePanelTab, setSidePanelTab] = useState<'pages' | 'summary'>('pages')
  const [showAnnotations, setShowAnnotations] = useState(true)
  // Começa fechado: o guia estático ocupava o painel de anotações desde a
  // abertura, empurrando as anotações do usuário para baixo. Ele continua
  // existindo, agora pelo menu de ajuda — e o estado passa a ser lembrado.
  const [showGuide, setShowGuide] = useState(false)
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [notice, setNotice] = useState('')
  const [isPrinting, setIsPrinting] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  // Folha (bottom sheet) aberta no celular. Uma de cada vez.
  const [mobileSheet, setMobileSheet] = useState<MobileSheet>(null)
  const [helpMenuOpen, setHelpMenuOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showDownloadInfo, setShowDownloadInfo] = useState(false)
  const [tourSteps, setTourSteps] = useState<TourStep[]>([])
  const [tourOpen, setTourOpen] = useState(false)
  // O tour escuta as setas do teclado; o leitor também, para virar página.
  // Sem este ref as duas coisas aconteceriam ao mesmo tempo.
  const tourOpenRef = useRef(false)
  const [highlightColor, setHighlightColor] = useState('#facc15')
  const [highlightWidth, setHighlightWidth] = useState(20)
  const [noteColor, setNoteColor] = useState('#fde68a')
  const [laserColor, setLaserColor] = useState('#ef4444')
  const [drawingStyle, setDrawingStyle] = useState<DrawingStyle>({
    mode: 'free',
    color: '#22c55e',
    width: 4,
    opacity: 0.9,
    holdToShape: true,
  })
  const [textStyle, setTextStyle] = useState<TextStyle>({
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#111827',
    bold: false,
    italic: false,
    underline: false,
    align: 'left',
  })

  const minZoom = access?.viewer.minZoom ?? 0.55
  const apiMaxZoom = access?.viewer.maxZoom ?? 2.6
  const pageCount = access?.material.pageCount ?? 0
  const summary = useMemo(() => access?.viewer.summary ?? [], [access])
  const navigation = useMemo(() => access?.viewer.navigation ?? [], [access])
  const coverPage = access?.viewer.coverPage
  const hasSummary = summary.length > 0

  // Seção do sumário em que o leitor está agora, para o indicador "você está em".
  // Mesma regra que o painel usa para destacar a linha — daí o helper comum.
  const activeSummaryEntry = useMemo(() => {
    const activeId = findActiveSummaryId(summary, currentPage)
    return activeId ? summary.find((entry) => entry.id === activeId) ?? null : null
  }, [summary, currentPage])

  // Modo prévia: usuário sem acesso pleno. `allowedPages` é a lista (ordenada)
  // de páginas que ele pode ver; toda a navegação é presa a esse conjunto. O
  // bloqueio real é no servidor — isto é só para não oferecer o proibido.
  const previewActive = access?.preview?.active === true
  // Acesso por tempo: contagem viva no cabeçalho do leitor.
  const timedAccess = access?.timedAccess || null
  const timedRemaining = useRemainingTime(timedAccess?.expiresAt)
  const allowedPages = useMemo(() => {
    if (!previewActive) return [] as number[]
    const list = (access?.preview?.pages ?? []).filter((p) => Number.isFinite(p) && p >= 1)
    return Array.from(new Set(list)).sort((a, b) => a - b)
  }, [previewActive, access])
  const isPageAllowed = useCallback(
    (page: number) => !previewActive || allowedPages.includes(page),
    [previewActive, allowedPages]
  )
  // Painel de anotações nunca aparece na prévia (leitura apenas / não salva).
  const annotationsVisible = showAnnotations && !previewActive

  // Lista de páginas para os modos contínuos: só muda quando a contagem de
  // páginas ou a liberação de prévia mudam — mantém a MESMA referência de
  // array durante o scroll (currentPage não entra aqui), evitando trabalho
  // de reconciliação desnecessário a cada mudança de página focada.
  const continuousPages = useMemo(() => {
    if (previewActive) return allowedPages
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }, [previewActive, allowedPages, pageCount])
  const pages = useMemo(() => {
    if (mode === 'single') return [currentPage]
    if (previewActive && continuousPages.length === 0) return [currentPage]
    return continuousPages
  }, [mode, currentPage, previewActive, continuousPages])
  const contentWidth = useResizeWidth(contentRef, [loading, showAnnotations, showThumbs])

  // Zoom em que a página cabe exatamente na largura disponível. É a referência
  // do que é "tamanho normal" para ESTE aparelho — no celular costuma ser bem
  // menos que 100%, porque uma A4 é mais larga que a tela.
  const fitWidthZoom = useMemo(() => {
    if (!pageSize?.width || !contentWidth) return null
    return (contentWidth - 24) / pageSize.width
  }, [contentWidth, pageSize])

  // Teto de zoom relativo ao aparelho, não absoluto. O teto da API (280%)
  // significava, num celular onde a página cabe a ~45%, uma página SEIS vezes
  // mais larga que a tela: impossível de navegar, e foi o que gerou o "zoom
  // ficando muito". Amarrando a 2,5x o tamanho que cabe, o limite faz sentido
  // em qualquer tela.
  const maxZoom = useMemo(() => {
    if (!fitWidthZoom) return apiMaxZoom
    return Math.min(apiMaxZoom, Math.max(1, fitWidthZoom * 2.5))
  }, [apiMaxZoom, fitWidthZoom])

  // Está ampliado além do que cabe na tela? É o que o indicador mostra.
  const zoomedIn = fitWidthZoom != null && zoom > fitWidthZoom * 1.02

  // Ver LARGE_DOCUMENT_PAGES.
  const isLargeDocument = pageCount >= LARGE_DOCUMENT_PAGES

  const annotationsByPage = useMemo(() => {
    const grouped = new Map<number, PdfAnnotation[]>()
    for (const annotation of annotations) {
      const pageAnnotations = grouped.get(annotation.pageNumber) || []
      pageAnnotations.push(annotation)
      grouped.set(annotation.pageNumber, pageAnnotations)
    }
    return grouped
  }, [annotations])

  const handlePageFocused = useCallback((page: number) => {
    if (mode === 'single') return
    // Durante a retomada (rolagem programática até a última página salva),
    // ignora o foco por scroll para as callbacks pendentes do observer no topo
    // não reverterem `currentPage` para a pág. 1.
    if (Date.now() < suppressFocusUntilRef.current) return
    setCurrentPage((current) => current === page ? current : page)
  }, [mode])

  // Só atualiza o tamanho compartilhado quando ele realmente muda. Antes, cada
  // página renderizada chamava setPageSize com um objeto NOVO (mesmo valor),
  // disparando re-render de todas as páginas vivas a cada scroll — uma
  // tempestade de re-renders que contribuía para os travamentos.
  const handlePageSize = useCallback((size: PageSize) => {
    setPageSize((current) => {
      if (current && Math.abs(current.width - size.width) < 0.5 && Math.abs(current.height - size.height) < 0.5) {
        return current
      }
      return size
    })
  }, [])

  // Tamanho de reserva do espaçador de virtualização — deve casar com a altura
  // que a página real reserva (dimensões da página * zoom + moldura), para o
  // scroll não pular quando um espaçador vira página real e vice-versa.
  // Memoizado para manter a MESMA referência enquanto tamanho/zoom não mudam,
  // evitando re-render de todos os espaçadores a cada rolagem (mudança de
  // página atual).
  // Usa o zoom ASSENTADO, não o cru: durante uma pinça o zoom muda a cada
  // quadro, e com o zoom cru aqui todos os espaçadores da janela re-renderizam
  // 60 vezes por segundo no meio do gesto. Fora da tela ninguém vê a diferença.
  const spacerSize = useMemo<PageSize>(() => ({
    width: (pageSize?.width ?? DEFAULT_PAGE_WIDTH) * settledZoom,
    height: (pageSize?.height ?? DEFAULT_PAGE_HEIGHT) * settledZoom,
  }), [pageSize, settledZoom])

  // Altura que cada página ocupa no fluxo: moldura (16px) + gap-5 (20px).
  // Num ref para o listener de rolagem lê-la sem precisar ser reanexado.
  const pageSlotHeight = spacerSize.height + 36
  const pageSlotHeightRef = useRef(pageSlotHeight)
  pageSlotHeightRef.current = pageSlotHeight

  const updateKnownPageCount = useCallback((totalPages?: number) => {
    if (!totalPages || totalPages < 1) return
    setAccess((current) => {
      if (!current || totalPages <= current.material.pageCount) return current
      return {
        ...current,
        material: {
          ...current.material,
          pageCount: totalPages,
        },
      }
    })
  }, [])

  const loadAnnotations = useCallback(async () => {
    const res = await fetch(`/api/materiais/${materialId}/pdf-viewer/annotations`, { cache: 'no-store' })
    if (res.ok) {
      const json = await res.json()
      setAnnotations(json.annotations || [])
    }
  }, [materialId])

  useEffect(() => {
    let mounted = true
    async function loadAccess() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/materiais/${materialId}/pdf-viewer/access`, { cache: 'no-store' })
        if (res.status === 401) {
          router.push('/auth/login')
          return
        }
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(json.error || 'Nao foi possivel abrir o visualizador.')
          return
        }
        if (!mounted) return
        setAccess(json)
        // Retoma de onde o usuário parou (última página/modo salvos). Se não
        // houver posição salva, abre na capa designada pelo admin ou na pág. 1.
        const total = Number(json.material?.pageCount) || 0
        const coverStart = Number(json.viewer?.coverPage) > 0 ? Number(json.viewer.coverPage) : 1
        const saved = readSavedPosition(materialId)
        const savedPage = saved?.page && (total < 1 || saved.page <= total) ? saved.page : undefined
        let startPage = savedPage ?? coverStart
        // Em prévia, a abertura precisa cair numa página liberada.
        const previewPages: number[] = Array.isArray(json.preview?.pages) ? json.preview.pages : []
        if (json.preview?.active && previewPages.length && !previewPages.includes(startPage)) {
          startPage = previewPages.reduce(
            (best, candidate) => (Math.abs(candidate - startPage) < Math.abs(best - startPage) ? candidate : best),
            previewPages[0]
          )
        }
        setCurrentPage(startPage)
        setPageInput(String(startPage))
        // Material grande abre em "uma página por vez", mesmo que o modo salvo
        // seja outro. Ver LARGE_DOCUMENT_PAGES: rolar milhares de páginas como
        // um documento só não é viável, e essa combinação é a origem dos
        // travamentos e das telas em branco em materiais deste tamanho.
        const isLargeDocument = total >= LARGE_DOCUMENT_PAGES
        const resolvedMode: ViewerMode = isLargeDocument
          ? 'single'
          : saved?.mode || json.viewer?.defaultMode || 'single'
        setMode(resolvedMode)
        // Em contínuo/largura a lista começa na primeira página, então apenas
        // restaurar `currentPage` não basta: é preciso rolar até a página salva
        // quando ela existir no DOM — e suprimir o foco por scroll por um
        // instante para o observer não reverter para a pág. 1 no topo.
        if (resolvedMode !== 'single' && startPage > 1) {
          pendingResumeRef.current = startPage
          suppressFocusUntilRef.current = Date.now() + 1500
        }
        if (!json.preview?.active && savedPage && savedPage > 1 && startPage === savedPage) {
          setNotice(`Retomando da pagina ${savedPage}`)
        }
        // Prévia não deve puxar anotações (endpoint exige acesso pleno).
        if (!json.preview?.active) {
          loadAnnotations().catch(() => {})
        }
      } catch {
        if (mounted) setError('PDF nao pode ser carregado agora. Tente novamente.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadAccess()
    return () => { mounted = false }
  }, [loadAnnotations, materialId, router])

  useEffect(() => {
    currentPageRef.current = currentPage
    setPageInput(String(currentPage))
  }, [currentPage])

  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

  // O teto de zoom depende do aparelho, então um zoom salvo no computador pode
  // chegar acima do teto do celular. Reamarra em vez de deixar a página numa
  // largura que não dá para navegar.
  // Margem de tolerância para o reamarre não brigar com arredondamento de
  // ponto flutuante: sem ela, uma diferença de 0,0001 vira setZoom em loop.
  useEffect(() => {
    if (zoom > maxZoom + 0.005) setZoom(maxZoom)
  }, [maxZoom, zoom])

  // ── Âncora da janela de páginas ─────────────────────────────────────────
  // Fonte 1: a página atual. Cobre saltos (sumário, "ir para página"), que
  // precisam materializar o destino antes de rolar até ele.
  useEffect(() => {
    if (mode === 'single') return
    const index = Math.max(0, pages.indexOf(currentPage))
    setWindowAnchor((current) => (Math.abs(index - current) > WINDOW_RECENTER_BAND ? index : current))
  }, [currentPage, mode, pages])

  // Fonte 2: a posição de rolagem. Esta é a que impede a ZONA MORTA.
  //
  // A versão anterior movia a âncora só a partir da página atual, que por sua
  // vez só era atualizada por IntersectionObserver nos elementos de página. Se
  // a rolagem parasse dentro de um bloco de preenchimento — que é um div vazio,
  // sem observer — nada reportava nada: a janela nunca vinha, a tela ficava
  // vazia e não havia saída. Calcular o índice a partir do deslocamento resolve
  // porque não depende de elemento nenhum existir naquela posição.
  useEffect(() => {
    if (mode === 'single' || pages.length === 0) return
    let frame = 0
    let trailing: number | null = null
    let lastMeasuredAt = 0

    const applyAnchor = () => {
      const element = contentRef.current
      if (!element) return
      const slot = pageSlotHeightRef.current
      if (!(slot > 0)) return
      // Relativo à viewport: funciona tanto quando quem rola é o documento
      // quanto quando é o shell (tela cheia), sem saber qual dos dois é.
      const viewportHeight = document.documentElement.clientHeight || window.innerHeight
      const offset = -element.getBoundingClientRect().top + viewportHeight / 2
      const index = Math.min(pages.length - 1, Math.max(0, Math.round(offset / slot)))
      setWindowAnchor((current) => (Math.abs(index - current) > WINDOW_RECENTER_BAND ? index : current))
    }

    // `getBoundingClientRect` força o navegador a recalcular o layout, e fazer
    // isso a cada quadro de uma rolagem por inércia trava o celular. A janela
    // tem 10 páginas de folga antes de precisar se mover, então medir ~7x por
    // segundo basta — com uma medição de fechamento, senão parar de rolar logo
    // depois de uma medida deixaria a posição final sem ser vista.
    const measure = () => {
      frame = 0
      const now = Date.now()
      const elapsed = now - lastMeasuredAt
      if (elapsed < 140) {
        if (trailing == null) {
          trailing = window.setTimeout(() => {
            trailing = null
            lastMeasuredAt = Date.now()
            applyAnchor()
          }, 140 - elapsed)
        }
        return
      }
      lastMeasuredAt = now
      applyAnchor()
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(measure)
    }

    // `capture`: eventos de scroll não borbulham, e o contêiner que rola pode
    // ser o documento ou o shell. Capturando na janela, os dois casos chegam.
    window.addEventListener('scroll', onScroll, { passive: true, capture: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
      if (trailing != null) window.clearTimeout(trailing)
    }
  }, [mode, pages.length])

  // Zoom "assentado": acompanha o zoom com atraso, para que decisões de LAYOUT
  // (altura dos espaçadores, quantas páginas ficam vivas) não sejam refeitas a
  // cada quadro de uma pinça. Sem isso, o gesto montava e desmontava páginas no
  // meio do caminho — origem de boa parte do flicker.
  useEffect(() => {
    if (settledZoom === zoom) return
    const timer = window.setTimeout(() => setSettledZoom(zoom), 150)
    return () => window.clearTimeout(timer)
  }, [zoom, settledZoom])

  // ── Preferências ─────────────────────────────────────────────────────────
  // Hidratação depois da montagem (e não em useState inicial) para o HTML do
  // servidor bater com o do cliente — mesmo padrão do UIPreferencesContext.
  const prefsHydratedRef = useRef(false)
  useEffect(() => {
    const prefs = readViewerPrefs()
    if (typeof prefs.zoom === 'number' && Number.isFinite(prefs.zoom)) {
      setZoom(prefs.zoom)
      // Sem isto, o auto-ajuste-à-largura sobrescreveria a escolha do usuário
      // logo na primeira medição da página.
      zoomTouchedRef.current = true
    }
    if (prefs.tool) setTool(prefs.tool)
    if (typeof prefs.showThumbs === 'boolean') setShowThumbs(prefs.showThumbs)
    if (prefs.sidePanelTab) setSidePanelTab(prefs.sidePanelTab)
    if (typeof prefs.showAnnotations === 'boolean') setShowAnnotations(prefs.showAnnotations)
    if (typeof prefs.showGuide === 'boolean') setShowGuide(prefs.showGuide)
    if (prefs.highlightColor) setHighlightColor(prefs.highlightColor)
    if (typeof prefs.highlightWidth === 'number') setHighlightWidth(prefs.highlightWidth)
    if (prefs.noteColor) setNoteColor(prefs.noteColor)
    if (prefs.laserColor) setLaserColor(prefs.laserColor)
    if (prefs.drawingStyle) setDrawingStyle((current) => ({ ...current, ...prefs.drawingStyle }))
    if (prefs.textStyle) setTextStyle((current) => ({ ...current, ...prefs.textStyle }))
    prefsHydratedRef.current = true
  }, [])

  // Salva as preferências conforme mudam. O guard evita gravar os valores
  // padrão por cima dos salvos no primeiro render, antes da hidratação.
  useEffect(() => {
    if (!prefsHydratedRef.current) return
    writeViewerPrefs({
      zoom,
      mode,
      tool,
      showThumbs,
      sidePanelTab,
      showAnnotations,
      showGuide,
      highlightColor,
      highlightWidth,
      noteColor,
      laserColor,
      drawingStyle,
      textStyle,
    })
  }, [
    zoom, mode, tool, showThumbs, sidePanelTab, showAnnotations, showGuide,
    highlightColor, highlightWidth, noteColor, laserColor, drawingStyle, textStyle,
  ])

  // Salva a posição de leitura para retomar na próxima abertura. Com atraso:
  // rolar rápido troca de página dezenas de vezes por segundo, e gravar no
  // localStorage a cada troca é escrita síncrona no meio da rolagem.
  useEffect(() => {
    if (!access) return
    const timer = window.setTimeout(() => {
      writeSavedPosition(materialId, { page: currentPage, mode })
      // Índice de "Continuar lendo". Leitura em prévia (quem ainda não tem o
      // material) fica de fora de propósito: a área é um atalho para o que a
      // pessoa está lendo de verdade, não vitrine de amostra.
      if (!access.preview?.active) {
        recordReadingProgress({
          materialId,
          title: access.material.title,
          coverImage: access.material.coverImage,
          page: currentPage,
          totalPages: access.material.pageCount || 0,
          mode,
        })
      }
    }, 400)
    return () => window.clearTimeout(timer)
  }, [access, currentPage, mode, materialId])

  // Retomada em modo contínuo/largura: rola até a última página salva assim que
  // o layout existe. Tenta por alguns frames porque o elemento-alvo pode montar
  // um tick depois. Corrige o bug de abrir sempre no início mesmo tendo salvo a
  // última página vista.
  useEffect(() => {
    if (!access || mode === 'single') return
    const target = pendingResumeRef.current
    if (target == null) return
    let cancelled = false
    let frame = 0
    const attempt = () => {
      if (cancelled) return
      const element = document.getElementById(`pdf-page-${target}`)
      if (element) {
        // Cada passada da retomada renova a janela em que o foco por scroll é
        // ignorado, senão o observer do topo reverte para a página 1.
        suppressFocusUntilRef.current = Math.max(suppressFocusUntilRef.current, Date.now() + 500)
        element.scrollIntoView({ behavior: 'auto', block: 'start' })
        // A retomada só termina quando o layout PAROU de mudar: é preciso já
        // conhecer a altura real da página E o zoom já ter assentado. Antes os
        // espaçadores usam a estimativa A4 com zoom 1; quando a medida real
        // chega e o auto-ajuste encolhe o zoom, todas as alturas acima mudam e
        // a posição desliza. Largar o controle cedo demais era o que deixava o
        // leitor parado longe da página que ele pediu no sumário.
        if (pageSize && settledZoom === zoom) pendingResumeRef.current = null
        return
      }
      if (frame++ < 30) window.requestAnimationFrame(attempt)
    }
    window.requestAnimationFrame(attempt)
    return () => { cancelled = true }
    // `zoom`/`settledZoom` nas dependências: cada mudança de escala remexe a
    // altura de todos os espaçadores acima, então a retomada precisa reajustar
    // o destino até o layout parar de se mexer.
  }, [access, mode, pageSize, settledZoom, zoom])

  useEffect(() => {
    if (!pageSize || !contentWidth || zoomTouchedRef.current) return
    const availableWidth = Math.max(280, contentWidth - 24)
    const fittedZoom = clampZoom(availableWidth / pageSize.width, minZoom, maxZoom)
    if (fittedZoom < 0.98) setZoom(fittedZoom)
  }, [contentWidth, maxZoom, minZoom, pageSize])

  useEffect(() => {
    if (!access) return
    // Pré-carrega as próximas páginas — só os BYTES, sem canvas. Barato PERTO
    // de um canvas, mas não de graça: num material com imagens uma página pode
    // ter megabytes, e pré-carregar demais enche o cache mais rápido do que ele
    // esvazia. Por isso o número varia com o aparelho.
    // Em prévia, "próxima" é a próxima LIBERADA — nunca uma bloqueada (403 à toa).
    const ahead = prefetchAhead()
    const upcoming: number[] = []
    if (previewActive) {
      const index = allowedPages.indexOf(currentPage)
      if (index === -1) return
      for (let step = 1; step <= ahead && index + step < allowedPages.length; step += 1) {
        upcoming.push(allowedPages[index + step])
      }
    } else {
      for (let step = 1; step <= ahead && currentPage + step <= pageCount; step += 1) {
        upcoming.push(currentPage + step)
      }
      // Uma para trás também: voltar página é tão comum quanto avançar.
      if (currentPage > 1) upcoming.push(currentPage - 1)
    }
    if (upcoming.length === 0) return

    const timer = window.setTimeout(() => {
      for (const page of upcoming) {
        fetchPdfPageBytes(materialId, page)
          .then((result) => updateKnownPageCount(result.pageCount))
          .catch(() => {})
      }
    }, 400)
    return () => window.clearTimeout(timer)
  }, [access, currentPage, materialId, pageCount, updateKnownPageCount, previewActive, allowedPages])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  // O ícone precisa acompanhar a saída pelo Esc ou pelo gesto do sistema, não
  // só o clique no botão.
  useEffect(() => onFullscreenChange(setIsFullscreen), [])

  useEffect(() => {
    const block = (event: Event) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('[data-pdf-editor="true"]')) return
      event.preventDefault()
    }
    const blockKeys = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const target = event.target as HTMLElement | null
      const isEditing = target?.closest('[data-pdf-editor="true"]')
      if (isEditing) return
      if ((event.ctrlKey || event.metaKey) && ['c', 'p', 's', 'u', 'a'].includes(key)) {
        event.preventDefault()
      }
    }
    const handleBeforePrint = () => setIsPrinting(true)
    const handleAfterPrint = () => setIsPrinting(false)
    const printQuery = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('print')
      : null
    const handlePrintChange = (event: MediaQueryListEvent) => setIsPrinting(event.matches)
    document.addEventListener('contextmenu', block)
    document.addEventListener('copy', block)
    document.addEventListener('cut', block)
    document.addEventListener('keydown', blockKeys)
    window.addEventListener('beforeprint', handleBeforePrint)
    window.addEventListener('afterprint', handleAfterPrint)
    if (printQuery?.addEventListener) {
      printQuery.addEventListener('change', handlePrintChange)
    } else if (printQuery?.addListener) {
      printQuery.addListener(handlePrintChange)
    }
    return () => {
      document.removeEventListener('contextmenu', block)
      document.removeEventListener('copy', block)
      document.removeEventListener('cut', block)
      document.removeEventListener('keydown', blockKeys)
      window.removeEventListener('beforeprint', handleBeforePrint)
      window.removeEventListener('afterprint', handleAfterPrint)
      if (printQuery?.removeEventListener) {
        printQuery.removeEventListener('change', handlePrintChange)
      } else if (printQuery?.removeListener) {
        printQuery.removeListener(handlePrintChange)
      }
    }
  }, [])

  const goToPage = useCallback((page: number) => {
    // Em prévia o teto é a maior página liberada (não o pageCount, que pode
    // ainda estar desconhecido/1 na primeira abertura).
    const upperBound = previewActive && allowedPages.length
      ? allowedPages[allowedPages.length - 1]
      : (pageCount || 1)
    let next = Math.min(Math.max(page, 1), upperBound)
    // Em prévia, qualquer destino cai na página liberada mais próxima — nunca
    // deixa o usuário parar numa página bloqueada.
    if (previewActive && allowedPages.length && !allowedPages.includes(next)) {
      next = allowedPages.reduce(
        (best, candidate) => (Math.abs(candidate - next) < Math.abs(best - next) ? candidate : best),
        allowedPages[0]
      )
    }
    setCurrentPage((current) => (current === next ? current : next))
    if (mode !== 'single') {
      // Saltos longos (ex.: clicar numa seção distante do sumário) rolam de
      // forma INSTANTÂNEA — o scroll suave atravessaria todas as páginas do
      // caminho, disparando o carregamento de cada uma. Passos curtos
      // (próxima/anterior) mantêm o scroll suave, que é agradável e barato.
      const isJump = Math.abs(next - currentPageRef.current) > 2
      const behavior: ScrollBehavior = isJump ? 'auto' : 'smooth'
      // Num salto longo a página de destino pode ainda não existir no DOM: ela
      // só entra quando o React re-renderiza com a nova janela de páginas
      // materializadas. Tentamos por alguns quadros em vez de uma vez só —
      // senão um clique no sumário para uma seção distante não sairia do lugar.
      //
      // E, durante essas tentativas, o foco por rolagem fica SUSPENSO (mesmo
      // mecanismo da retomada). Enquanto a janela de páginas se reposiciona, os
      // espaçadores que cruzam a faixa central do caminho reportam foco e
      // puxam `currentPage` de volta — cada um desses puxões re-renderiza o
      // leitor inteiro e remexe a âncora no meio do salto. Era o que fazia um
      // toque no sumário parecer engasgado antes de assentar no destino.
      let frame = 0
      const holdFocus = () => {
        if (!isJump) return
        suppressFocusUntilRef.current = Math.max(suppressFocusUntilRef.current, Date.now() + 260)
      }
      const scrollToTarget = () => {
        holdFocus()
        const element = document.getElementById(`pdf-page-${next}`)
        if (element) {
          element.scrollIntoView({ behavior, block: 'start' })
          return
        }
        if (frame++ < 10) requestAnimationFrame(scrollToTarget)
      }
      holdFocus()
      requestAnimationFrame(scrollToTarget)
    } else {
      // Em modo página única, sobe suavemente para o topo da nova página.
      requestAnimationFrame(() => {
        const top = contentRef.current?.getBoundingClientRect().top ?? 0
        if (top < 0) window.scrollTo({ top: window.scrollY + top - 12, behavior: 'smooth' })
      })
    }
  }, [mode, pageCount, previewActive, allowedPages])

  // Passo de página que respeita o conjunto de páginas da prévia: avança/volta
  // pela lista liberada em vez de +1/-1 (que travaria num "buraco" de páginas).
  const stepPage = useCallback((dir: -1 | 1) => {
    if (previewActive && allowedPages.length) {
      const index = allowedPages.indexOf(currentPage)
      if (index === -1) {
        goToPage(allowedPages[0])
        return
      }
      const target = index + dir
      if (target < 0 || target >= allowedPages.length) return
      goToPage(allowedPages[target])
      return
    }
    goToPage(currentPage + dir)
  }, [previewActive, allowedPages, currentPage, goToPage])

  const previewIndex = previewActive ? allowedPages.indexOf(currentPage) : -1
  const canStepPrev = previewActive ? previewIndex > 0 : currentPage > 1
  const canStepNext = previewActive
    ? previewIndex >= 0 && previewIndex < allowedPages.length - 1
    : currentPage < pageCount

  const submitPageInput = () => {
    const next = Number.parseInt(pageInput, 10)
    if (Number.isFinite(next)) goToPage(next)
  }

  // Atalho unificado para abrir o painel lateral (miniaturas ou sumário):
  // em telas grandes garante a coluna visível; em telas menores abre o drawer.
  const openSidePanel = useCallback((tab: 'pages' | 'summary') => {
    setSidePanelTab(tab)
    // matchMedia e não innerWidth: com o usuário pinçado, `innerWidth` no iOS
    // não corresponde ao layout e o painel abriria na variante errada.
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
      // No celular tudo passa pela folha inferior — mesma SidePanel, só que
      // ancorada onde o polegar alcança. Antes havia um drawer lateral
      // separado fazendo exatamente isto, com dois estados para manter.
      setMobileSheet('nav')
    } else {
      setShowThumbs(true)
    }
  }, [])

  // Ir para a página e fechar a folha que originou o clique: no celular o
  // painel cobre o material, e ficar aberto depois do pulo esconderia
  // justamente o que o leitor acabou de pedir para ver.
  const navigateTo = useCallback((page: number) => {
    goToPage(page)
    setMobileSheet(null)
  }, [goToPage])

  const fitToWidth = useCallback(() => {
    const element = contentRef.current || viewerRef.current
    if (!element || !pageSize) return
    zoomTouchedRef.current = true
    const availableWidth = element.clientWidth - 24
    setZoom(clampZoom(availableWidth / pageSize.width, minZoom, maxZoom))
    setMode('width')
  }, [maxZoom, minZoom, pageSize])

  const fitToPage = useCallback(() => {
    const element = contentRef.current || viewerRef.current
    if (!element || !pageSize) return
    zoomTouchedRef.current = true
    const availableWidth = element.clientWidth - 24
    // `documentElement.clientHeight` acompanha o layout; `window.innerHeight`
    // encolhe/cresce com a pinça no iOS e daria uma altura falsa aqui.
    const viewportHeight = document.documentElement.clientHeight || window.innerHeight
    const availableHeight = viewportHeight - 148
    setZoom(clampZoom(Math.min(availableWidth / pageSize.width, availableHeight / pageSize.height), minZoom, maxZoom))
    setMode('single')
  }, [maxZoom, minZoom, pageSize])

  // Troca de modo em um lugar só: "Largura" precisa recalcular o zoom, os
  // outros dois não. Antes essa diferença estava espalhada pelo JSX e o modo
  // nem existia no celular.
  const applyMode = useCallback((next: ViewerMode) => {
    modeTouchedRef.current = true
    if (next === 'width') fitToWidth()
    else setMode(next)
  }, [fitToWidth])

  // A contagem de páginas nem sempre está em cache no banco quando o viewer
  // abre — nesse caso ela só aparece depois que a primeira página é
  // renderizada. Se o material se revelar grande, cai para "uma página por
  // vez", a menos que o leitor já tenha escolhido um modo à mão.
  useEffect(() => {
    if (!access || modeTouchedRef.current) return
    if (pageCount >= LARGE_DOCUMENT_PAGES && mode !== 'single') setMode('single')
  }, [access, pageCount, mode])

  // ── Gestos ──────────────────────────────────────────────────────────────
  const handleSwipe = useCallback((direction: 1 | -1) => {
    stepPage(direction)
    // Confirmação tátil onde existe (Android/PWA). No iOS não faz nada e não
    // custa nada — não vale um caminho separado.
    try {
      navigator.vibrate?.(8)
    } catch {}
  }, [stepPage])

  // `!loading && !error && access` não é detalhe: enquanto o material carrega,
  // o componente retorna a tela de espera e a área das páginas NEM EXISTE no
  // DOM. Sem esta condição nas dependências do efeito, ele rodava uma única vez
  // (com o container ainda nulo), não reagia à montagem das páginas e o swipe
  // simplesmente nunca era ligado — sobrava virar página só nas setinhas.
  const gesturesEnabled = tool === 'cursor' && !loading && !error && !!access
  useViewerGestures(contentRef, {
    enabled: gesturesEnabled,
    // Para o lado vale em qualquer modo: nada no leitor usa arrasto horizontal
    // além da panorâmica da página ampliada, e essa o próprio gesto respeita
    // (só vira quando a página já está encostada na borda).
    horizontal: true,
    // Para cima/baixo só em "uma página por vez". Nos modos de rolagem o
    // vertical É a leitura — virar página ali brigaria com o scroll o tempo
    // todo. Dentro do modo página única o gesto ainda espera a página chegar
    // ao fim (ou ao começo) antes de virar, então página ampliada continua
    // rolando normalmente.
    vertical: mode === 'single',
    onSwipe: handleSwipe,
    trackRef: pagesTrackRef,
  })

  // Com o swipe vertical, o mesmo movimento que vira página no topo da leitura
  // é o "puxar para atualizar" do Android/PWA — que recarregaria o material no
  // meio do gesto. `overscroll-behavior` precisa estar em quem ROLA (o
  // documento), não neste componente, por isso vai no elemento raiz e volta ao
  // que era quando o leitor sai.
  useEffect(() => {
    const root = document.documentElement
    const previous = root.style.overscrollBehaviorY
    root.style.overscrollBehaviorY = 'contain'
    return () => {
      root.style.overscrollBehaviorY = previous
    }
  }, [])

  // ── Tutorial ────────────────────────────────────────────────────────────
  // Resolve cada passo para o alvo visível daquele tamanho de tela (ver
  // buildTourSteps): é assim que a mesma lista serve para desktop e celular
  // sem duas versões para manter.
  const startTour = useCallback(() => {
    const steps = buildTourSteps()
    if (steps.length === 0) return
    setTourSteps(steps)
    setTourOpen(true)
    tourOpenRef.current = true
  }, [])

  const closeTour = useCallback(() => {
    setTourOpen(false)
    tourOpenRef.current = false
    try {
      window.localStorage.setItem(TOUR_STORAGE_KEY, 'done')
    } catch {}
  }, [])

  // Abre sozinho na primeira visita. Nunca na prévia: quem ainda não comprou
  // está avaliando o material, não aprendendo a ferramenta.
  useEffect(() => {
    if (!access || previewActive) return
    let seen = false
    try {
      seen = window.localStorage.getItem(TOUR_STORAGE_KEY) === 'done'
    } catch {
      seen = true
    }
    if (seen) return
    // Espera o layout assentar para os alvos já estarem medidos.
    const timer = window.setTimeout(startTour, 700)
    return () => window.clearTimeout(timer)
  }, [access, previewActive, startTour])

  // Tela cheia SÓ com a API nativa, e só onde ela existe — ou seja, no
  // desktop. Houve uma tentativa de fallback "imersivo" em CSS para o celular
  // (onde o Safari do iOS não implementa requestFullscreen fora de <video>) e
  // ela foi revertida: transformar o shell em `fixed inset-0` troca o contêiner
  // de rolagem no meio da leitura, e o resultado no aparelho ficou pior que não
  // ter o botão. No celular a barra do navegador já se esconde sozinha ao
  // rolar, que é o ganho que o usuário queria.
  const toggleFullScreen = useCallback(async () => {
    const element = viewerRef.current
    if (!element) return
    if (getFullscreenElement()) {
      await exitAppFullscreen()
      return
    }
    await requestAppFullscreen(element)
  }, [])

  // Navegação por teclado: setas, PageUp/Down, Home/End, mais os atalhos de
  // zoom/modo/painéis. Ignora quando o foco está em um campo de edição
  // (anotações, input de página, etc). Fica DEPOIS dos callbacks que usa —
  // o array de dependências é avaliado durante o render, então referenciar um
  // `const` declarado abaixo estouraria em TDZ.
  useEffect(() => {
    if (!access) return
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (
        target.closest('[data-pdf-editor="true"]') ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      )) return
      if (event.ctrlKey || event.metaKey || event.altKey) return
      // Com o tutorial aberto as setas são dele (avançar/voltar passo). Sem
      // este guard, uma seta avançaria o passo E viraria a página junto.
      if (tourOpenRef.current) return
      switch (event.key) {
        case 'ArrowRight':
        case 'PageDown':
          event.preventDefault(); stepPage(1); break
        case 'ArrowLeft':
        case 'PageUp':
          event.preventDefault(); stepPage(-1); break
        case 'Home':
          event.preventDefault(); goToPage(previewActive && allowedPages.length ? allowedPages[0] : 1); break
        case 'End':
          event.preventDefault(); goToPage(previewActive && allowedPages.length ? allowedPages[allowedPages.length - 1] : pageCount); break
        // Atalhos novos. Todos passam pelos mesmos guards acima (campo de
        // edição, Ctrl/Cmd do anti-pirataria, tutorial aberto).
        case '+':
        case '=':
          event.preventDefault(); zoomTouchedRef.current = true; setZoom((z) => clampZoom(z + 0.12, minZoom, maxZoom)); break
        case '-':
        case '_':
          event.preventDefault(); zoomTouchedRef.current = true; setZoom((z) => clampZoom(z - 0.12, minZoom, maxZoom)); break
        case '0':
          event.preventDefault(); fitToPage(); break
        case 'f':
        case 'F':
          event.preventDefault(); toggleFullScreen(); break
        case 't':
        case 'T':
          event.preventDefault(); openSidePanel('pages'); break
        case 's':
        case 'S':
          if (!hasSummary) break
          event.preventDefault(); openSidePanel('summary'); break
        case '1':
          event.preventDefault(); applyMode('continuous'); break
        case '2':
          event.preventDefault(); applyMode('single'); break
        case '3':
          event.preventDefault(); applyMode('width'); break
        case '?':
          event.preventDefault(); setShowShortcuts(true); break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [access, pageCount, goToPage, stepPage, previewActive, allowedPages, minZoom, maxZoom, fitToPage, toggleFullScreen, openSidePanel, applyMode, hasSummary])

  const createAnnotation = useCallback(async (annotation: Partial<PdfAnnotation>) => {
    const local = createEmptyAnnotation(annotation, materialId)
    setAnnotations((prev) => [...prev, local])

    try {
      const res = await fetch(`/api/materiais/${materialId}/pdf-viewer/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annotation),
      })
      if (!res.ok) throw new Error('create failed')
      const json = await res.json()
      setAnnotations((prev) => prev.map((item) => item.id === local.id ? json.annotation : item))
    } catch {
      setAnnotations((prev) => prev.filter((item) => item.id !== local.id))
      setNotice('Nao foi possivel salvar esta anotacao.')
    }
  }, [materialId])

  const updateAnnotation = useCallback(async (annotation: PdfAnnotation, patch: Partial<PdfAnnotation>) => {
    const previous = annotation
    const optimistic = { ...annotation, ...patch, data: { ...(annotation.data || {}), ...(patch.data || {}) } }
    setAnnotations((prev) => prev.map((item) => item.id === annotation.id ? optimistic : item))
    const annotationId = getPersistedAnnotationId(annotation)
    if (!annotationId) return

    try {
      const res = await fetch(`/api/materiais/${materialId}/pdf-viewer/annotations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...optimistic, id: annotationId }),
      })
      if (!res.ok) throw new Error('update failed')
      const json = await res.json()
      setAnnotations((prev) => prev.map((item) => item.id === annotation.id ? json.annotation : item))
    } catch {
      setAnnotations((prev) => prev.map((item) => item.id === annotation.id ? previous : item))
      setNotice('Nao foi possivel atualizar a anotacao.')
    }
  }, [materialId])

  const deleteAnnotation = useCallback(async (annotation: PdfAnnotation) => {
    setAnnotations((prev) => prev.filter((item) => item.id !== annotation.id))
    const annotationId = getPersistedAnnotationId(annotation)
    if (!annotationId) return

    try {
      const res = await fetch(`/api/materiais/${materialId}/pdf-viewer/annotations?id=${encodeURIComponent(annotationId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: annotationId, _id: annotationId }),
      })
      if (!res.ok) throw new Error('delete failed')
    } catch {
      setAnnotations((prev) => [...prev, annotation].sort((a, b) => a.pageNumber - b.pageNumber))
      setNotice('Nao foi possivel apagar a anotacao.')
    }
  }, [materialId])

  const deleteAllAnnotations = useCallback(async () => {
    if (!annotations.length) return
    const previous = annotations
    setAnnotations([])
    setShowDeleteAllConfirm(false)
    try {
      const res = await fetch(`/api/materiais/${materialId}/pdf-viewer/annotations?all=true`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('delete all failed')
    } catch {
      setAnnotations(previous)
      setNotice('Nao foi possivel apagar as anotacoes.')
    }
  }, [annotations, materialId])

  if (loading) {
    return <ViewerShell><ViewerLoading /></ViewerShell>
  }

  if (error || !access) {
    return (
      <ViewerShell>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md rounded-2xl border border-white/15 bg-white/10 p-6 text-center text-white shadow-2xl backdrop-blur-xl">
            <SearchX className="h-10 w-10 mx-auto mb-3 text-amber-200" />
            <h1 className="font-heading text-xl font-bold mb-2">PDF indisponivel</h1>
            <p className="text-sm text-white/70 mb-5">{error || 'Nao foi possivel carregar este material.'}</p>
            <Button onClick={() => router.push(`/materiais/${materialId}`)} className="rounded-xl bg-emerald-500 hover:bg-emerald-600">
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao material
            </Button>
          </div>
        </div>
      </ViewerShell>
    )
  }

  // Janela de páginas "vivas" (virtualização). Em página única tudo é a página
  // atual. Nos modos contínuo/largura, só o raio ao redor da página atual é
  // montado como componente pesado; as demais ficam como espaçadores leves.
  const centerIndex = mode === 'single' ? 0 : Math.max(0, pages.indexOf(currentPage))
  const liveRadius = liveRadiusForZoom(settledZoom)
  const liveStart = centerIndex - liveRadius
  const liveEnd = centerIndex + liveRadius

  // Segunda camada de virtualização: fora desta janela nem espaçador é criado.
  // Num material de 2000+ páginas, materializar todas são milhares de elementos
  // que o React percorre a cada rolagem — o aparelho congela.
  //
  // Os dois blocos de preenchimento reservam a altura das páginas ocultas para
  // o documento manter a altura total e o scrollbar ficar proporcional. Eles
  // são divs vazios, sem observer — foi por isso que uma versão anterior criou
  // uma ZONA MORTA (parar de rolar em cima de um deles não reportava nada, a
  // janela nunca vinha e a tela ficava vazia sem saída). Agora a âncora também
  // é calculada a partir do DESLOCAMENTO da rolagem, que não depende de
  // elemento nenhum existir naquela posição. Ver o efeito "Fonte 2" acima.
  const anchorIndex = Math.min(Math.max(0, windowAnchor), Math.max(0, pages.length - 1))
  const windowStart = mode === 'single' ? 0 : Math.max(0, anchorIndex - WINDOW_RADIUS)
  const windowEnd = mode === 'single'
    ? pages.length - 1
    : Math.min(pages.length - 1, anchorIndex + WINDOW_RADIUS)
  const renderedPages = mode === 'single' ? pages : pages.slice(windowStart, windowEnd + 1)
  const fillerTopHeight = Math.max(0, windowStart * pageSlotHeight)
  const fillerBottomHeight = Math.max(0, (pages.length - 1 - windowEnd) * pageSlotHeight)

  return (
    <ViewerShell>
      <style jsx global>{`
        @keyframes pdfPageFade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pdf-page-fade {
          animation: pdfPageFade 0.22s ease-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .pdf-page-fade { animation: none; }
        }
        /* Em tela cheia o elemento raiz vira o próprio viewport: sem rolagem
           própria o modo contínuo (e o "largura") não conseguiam passar da
           primeira dobra. Damos altura de tela + overflow para rolar tudo. */
        .pdf-viewer-shell:fullscreen {
          height: 100vh;
          overflow-y: auto;
          background: #09090b;
        }
        .pdf-viewer-shell:-webkit-full-screen {
          height: 100vh;
          overflow-y: auto;
          background: #09090b;
        }
        @media print {
          html, body {
            background: #000 !important;
          }
          body * {
            visibility: hidden !important;
          }
          body::after {
            content: "Impressao nao autorizada - Material protegido por DomineAqui";
            visibility: visible !important;
            position: fixed;
            inset: 0;
            background: #000;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: sans-serif;
            font-size: 18px;
            text-align: center;
            padding: 24px;
            z-index: 2147483647;
          }
        }
      `}</style>
      {isPrinting ? (
        <div
          aria-hidden
          className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black text-center text-white"
          style={{ fontFamily: 'sans-serif' }}
        >
          <div className="px-6">
            <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
            <p className="text-lg font-semibold">Impressao nao autorizada</p>
            <p className="mt-1 text-sm text-white/70">Este material e protegido. Tentativas de impressao ou captura sao registradas.</p>
          </div>
        </div>
      ) : null}
      {/* Sem modo "imersivo" em CSS aqui: transformar o shell em `fixed
          inset-0` troca o contêiner de rolagem no meio da leitura e no celular
          o resultado ficou pior que não ter tela cheia. A tela cheia nativa
          (desktop) usa o `:fullscreen` já definido no <style> acima. */}
      <div
        ref={viewerRef}
        className="pdf-viewer-shell min-h-screen overflow-x-clip text-white select-none"
        style={{ WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'pan-x pan-y pinch-zoom' }}
      >
        {/* Fundo OPACO e sem `backdrop-blur`, pela mesma razão já documentada na
            barra inferior do celular: `backdrop-filter` num elemento STICKY é
            recalculado a cada quadro da rolagem, porque o que está atrás dele
            muda o tempo todo. Aqui o custo era o pior de todos — o cabeçalho
            atravessa a tela inteira e fica por cima justamente das páginas em
            rolagem, então o Safari do iOS reamostrava e reborrava uma faixa de
            largura total a 120 Hz. Sobre um fundo escuro, `/95` com blur e
            opaco sem blur são indistinguíveis a olho nu; o que sai é só a
            conta. `translateZ(0)` dá camada própria de composição, para a
            rolagem das páginas não repintar o cabeçalho junto.
            (/95 e não /82: opacidade fora da escala do Tailwind não vira regra
            nenhuma, e o cabeçalho ficava sem fundo sobre página branca.) */}
        <header
          className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950 shadow-xl shadow-black/25"
          style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
        >
          {/* Progresso de leitura. Uma linha fina no topo responde à pergunta
              "quanto falta?" sem ocupar espaço nenhum. */}
          <div className="h-0.5 w-full bg-white/5">
            <div
              className="h-full bg-emerald-400 transition-[width] duration-200"
              style={{ width: `${pageCount > 0 ? Math.min(100, (currentPage / pageCount) * 100) : 0}%` }}
            />
          </div>
          <div className="px-2 py-2 sm:px-4">
            <div className="flex items-center gap-1.5 pb-1.5 sm:gap-2 lg:overflow-x-auto">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => router.push(`/materiais/${materialId}`)}
                className="h-10 w-10 shrink-0 rounded-xl text-white hover:bg-white/10 hover:text-white"
                title="Voltar"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-300 shrink-0" />
                  <h1 className="truncate text-sm font-semibold sm:text-base">{access.material.title}</h1>
                </div>
                <p className="hidden text-[11px] text-emerald-100/60 sm:block">DomineAqui PDF Viewer protegido</p>
              </div>

              {/* ── Controles de desktop ─────────────────────────────────── */}
              <div className="hidden items-center gap-1.5 lg:flex" data-tour="viewer-pagenav">
                <ToolbarButton onClick={() => stepPage(-1)} disabled={!canStepPrev} title="Pagina anterior">
                  <ChevronLeft className="h-4 w-4" />
                </ToolbarButton>
                <div className="flex h-10 shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-white/10 px-2">
                  <input
                    value={pageInput}
                    onChange={(event) => setPageInput(event.target.value.replace(/\D/g, ''))}
                    onKeyDown={(event) => event.key === 'Enter' && submitPageInput()}
                    onBlur={submitPageInput}
                    className="w-10 bg-transparent text-center text-sm text-white outline-none"
                    inputMode="numeric"
                    aria-label="Ir para a página"
                  />
                  <span className="text-xs text-white/55">/ {pageCount}</span>
                </div>
                <ToolbarButton onClick={() => stepPage(1)} disabled={!canStepNext} title="Proxima pagina">
                  <ChevronRight className="h-4 w-4" />
                </ToolbarButton>
              </div>

              <div className="hidden items-center gap-1 rounded-xl border border-white/10 bg-white/10 p-1 lg:flex" data-tour="viewer-zoom">
                <ToolbarButton compact onClick={() => { zoomTouchedRef.current = true; setZoom((z) => clampZoom(z - 0.12, minZoom, maxZoom)) }} title="Diminuir zoom">
                  <Minus className="h-4 w-4" />
                </ToolbarButton>
                <span className="min-w-12 text-center text-xs text-white/75">{Math.round(zoom * 100)}%</span>
                <ToolbarButton compact onClick={() => { zoomTouchedRef.current = true; setZoom((z) => clampZoom(z + 0.12, minZoom, maxZoom)) }} title="Aumentar zoom">
                  <Plus className="h-4 w-4" />
                </ToolbarButton>
              </div>

              {/* Seletor de modo: antes era `hidden lg:flex`, ou seja, no
                  celular não havia como sair do "uma página por vez". Agora
                  existe nos dois lugares — aqui e na barra inferior. */}
              <div className="hidden items-center gap-1 lg:flex" data-tour="viewer-mode">
                {MODE_OPTIONS.map((option) => (
                  <ToolbarTextButton
                    key={option.value}
                    active={mode === option.value}
                    onClick={() => applyMode(option.value)}
                  >
                    {option.label}
                  </ToolbarTextButton>
                ))}
              </div>

              <ToolbarButton
                className="hidden lg:inline-flex"
                onClick={toggleFullScreen}
                title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </ToolbarButton>

              {/* ── Único controle extra do celular: tudo o mais mora nas
                  folhas de baixo, para o cabeçalho caber em uma linha. ── */}
              <button
                type="button"
                onClick={() => setMobileSheet('more')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition-colors hover:bg-white/15 lg:hidden"
                title="Mais opções"
                aria-label="Mais opções"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>

            <div className="hidden items-center gap-1 overflow-x-auto pb-1 lg:flex">
              {/* Ferramentas de anotação ficam ocultas na prévia (leitura apenas). */}
              {!previewActive && (
                <div className="flex items-center gap-1" data-tour="viewer-tools">
                  <ToolButton active={tool === 'cursor'} onClick={() => setTool('cursor')} title="Navegar">
                    <MousePointer2 className="h-4 w-4" />
                  </ToolButton>
                  <ToolButton active={tool === 'highlight'} onClick={() => setTool('highlight')} title="Marca texto">
                    <Highlighter className="h-4 w-4" />
                  </ToolButton>
                  <ToolButton active={tool === 'note'} onClick={() => setTool('note')} title="Nota">
                    <MessageSquare className="h-4 w-4" />
                  </ToolButton>
                  <ToolButton active={tool === 'drawing'} onClick={() => setTool('drawing')} title="Caneta">
                    <PenLine className="h-4 w-4" />
                  </ToolButton>
                  <ToolButton active={tool === 'laser'} onClick={() => setTool('laser')} title="Caneta laser">
                    <Zap className="h-4 w-4" />
                  </ToolButton>
                  <ToolButton active={tool === 'text'} onClick={() => setTool('text')} title="Texto">
                    <Type className="h-4 w-4" />
                  </ToolButton>
                  <ToolButton active={tool === 'bookmark'} onClick={() => setTool('bookmark')} title="Marcador">
                    <Bookmark className="h-4 w-4" />
                  </ToolButton>
                  <ToolButton active={tool === 'eraser'} onClick={() => setTool('eraser')} title="Apagar item">
                    <Eraser className="h-4 w-4" />
                  </ToolButton>

                  <div className="mx-1 h-6 w-px shrink-0 bg-white/10" />
                </div>
              )}
              <div className="mx-1 h-6 w-px shrink-0 bg-white/10" />
              {hasSummary && (
                <button
                  type="button"
                  data-tour="viewer-summary"
                  onClick={() => openSidePanel('summary')}
                  title="Abrir sumário"
                  className={`flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-colors ${
                    showThumbs && sidePanelTab === 'summary'
                      ? 'border-emerald-300/60 bg-emerald-400/25 text-white'
                      : 'border-emerald-300/30 bg-emerald-400/10 text-emerald-200 hover:border-emerald-300/50 hover:bg-emerald-400/20 hover:text-white'
                  }`}
                >
                  <List className="h-4 w-4 shrink-0" />
                  Sumário
                </button>
              )}
              {/* Rótulo visível ao lado do ícone: para quem não é familiarizado
                  com leitores de PDF, um tooltip que só aparece no hover não
                  ensina nada. */}
              <ToolbarTextButton
                data-tour="viewer-thumbs"
                active={showThumbs}
                icon={showThumbs ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                onClick={() => {
                  if (showThumbs && sidePanelTab === 'summary') {
                    // Painel já aberto noutra aba: troca para miniaturas em vez de fechar.
                    setSidePanelTab('pages')
                  } else {
                    setSidePanelTab('pages')
                    setShowThumbs((value) => !value)
                  }
                }}
              >
                Páginas
              </ToolbarTextButton>
              {!previewActive && (
                <>
                  <ToolbarTextButton
                    active={showAnnotations}
                    icon={<StickyNote className="h-4 w-4" />}
                    onClick={() => setShowAnnotations((value) => !value)}
                  >
                    Anotações
                  </ToolbarTextButton>
                  <ToolbarTextButton
                    active={helpMenuOpen}
                    icon={<HelpCircle className="h-4 w-4" />}
                    onClick={() => setHelpMenuOpen((value) => !value)}
                  >
                    Ajuda
                  </ToolbarTextButton>
                </>
              )}
              <ToolbarTextButton data-tour="viewer-fit" onClick={fitToPage}>
                Ajustar à tela
              </ToolbarTextButton>
            </div>

            {!previewActive && (
              <div className="hidden lg:block">
                <ToolOptionsBar
                  tool={tool}
                  drawingStyle={drawingStyle}
                  onDrawingStyleChange={setDrawingStyle}
                  highlightColor={highlightColor}
                  onHighlightColorChange={setHighlightColor}
                  highlightWidth={highlightWidth}
                  onHighlightWidthChange={setHighlightWidth}
                  noteColor={noteColor}
                  onNoteColorChange={setNoteColor}
                  laserColor={laserColor}
                  onLaserColorChange={setLaserColor}
                  textStyle={textStyle}
                  onTextStyleChange={setTextStyle}
                />
              </div>
            )}

            {(navigation.length > 0 || coverPage) && (
              <div className="mt-1 hidden items-center gap-1.5 overflow-x-auto pb-0.5 lg:flex">
                {coverPage ? (
                  <button
                    type="button"
                    onClick={() => navigateTo(coverPage)}
                    className={`flex h-8 shrink-0 items-center gap-1 rounded-full border px-3 text-xs font-semibold transition-colors ${
                      currentPage === coverPage
                        ? 'border-emerald-300/60 bg-emerald-400/25 text-white'
                        : 'border-white/10 bg-white/10 text-white/75 hover:bg-white/15'
                    }`}
                    title={`Capa (pag. ${coverPage})`}
                  >
                    <Bookmark className="h-3.5 w-3.5" /> Capa
                  </button>
                ) : null}
                {navigation.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => navigateTo(entry.page)}
                    className={`flex h-8 shrink-0 items-center gap-1 rounded-full border px-3 text-xs font-medium transition-colors ${
                      currentPage === entry.page
                        ? 'border-emerald-300/60 bg-emerald-400/25 text-white'
                        : 'border-white/10 bg-white/10 text-white/75 hover:bg-white/15'
                    }`}
                    title={`${entry.label} — pag. ${entry.page}`}
                  >
                    {entry.label}
                    <span className="text-white/45">{entry.page}</span>
                  </button>
                ))}
              </div>
            )}

            {hasSummary && (
              <button
                type="button"
                data-tour="viewer-summary-strip"
                onClick={() => openSidePanel('summary')}
                title="Abrir sumário — pular para seções"
                className="mt-1 flex w-full items-center gap-2 rounded-lg border border-emerald-300/25 bg-emerald-400/[0.07] px-2.5 py-1.5 text-left text-white/75 transition-colors hover:border-emerald-300/40 hover:bg-emerald-400/15 hover:text-white"
              >
                <List className="h-4 w-4 shrink-0 text-emerald-300" />
                {activeSummaryEntry ? (
                  <>
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-white/40">
                      Você está em
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold">
                      {activeSummaryEntry.title}
                    </span>
                  </>
                ) : (
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-emerald-100">
                    Sumário — pular para seções
                  </span>
                )}
                <span className="shrink-0 text-[10px] font-semibold text-emerald-300/90">Abrir →</span>
              </button>
            )}
          </div>
        </header>

        {/* Acesso por tempo limitado: a contagem fica fixa abaixo do cabeçalho,
            no mesmo lugar onde a prévia avisa o seu limite. */}
        {timedAccess?.isTimed && (
          <div className="border-b border-sky-300/25 bg-sky-500/10 px-3 py-2">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
              <p className="flex items-center gap-2 text-xs font-semibold text-sky-100 sm:text-[13px]">
                <Clock className="h-4 w-4 shrink-0" />
                {timedRemaining.expired ? (
                  <>Seu acesso a este material terminou.</>
                ) : (
                  <>
                    Acesso por tempo limitado — restam{' '}
                    <strong className="text-white">{timedRemaining.label || timedAccess.remainingLabel}</strong>
                    {timedAccess.expiresAtLabel ? ` (até ${timedAccess.expiresAtLabel})` : ''}
                  </>
                )}
              </p>
              <span className="text-[11px] font-medium text-sky-200/80">
                Leitura na plataforma · sem download
              </span>
            </div>
          </div>
        )}

        {previewActive && (
          <div className="border-b border-amber-300/30 bg-gradient-to-r from-amber-500/95 via-amber-400/95 to-amber-500/95 px-3 py-2 text-amber-950 shadow-lg">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 sm:flex-row sm:justify-between">
              <div className="flex items-center gap-2 text-center sm:text-left">
                <Eye className="h-4 w-4 shrink-0" />
                <p className="text-xs font-semibold leading-snug sm:text-sm">
                  Você está vendo uma <strong>prévia gratuita</strong>
                  {allowedPages.length ? ` (${allowedPages.length} de ${pageCount} páginas)` : ''}.
                  Adquira o material para desbloquear o conteúdo completo.
                </p>
              </div>
              <Button
                onClick={() => router.push(`/materiais/${materialId}`)}
                className="h-9 shrink-0 rounded-xl bg-emerald-700 px-4 text-xs font-bold text-white shadow-md hover:bg-emerald-800"
              >
                Comprar agora
              </Button>
            </div>
          </div>
        )}

        {notice && (
          <div className="fixed left-1/2 top-28 z-50 -translate-x-1/2 rounded-xl border border-amber-200/40 bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-950 shadow-xl">
            {notice}
          </div>
        )}

        <main
          className={`grid grid-cols-1 gap-0 ${
            showThumbs && sidePanelTab === 'summary'
              ? 'lg:grid-cols-[19rem_minmax(0,1fr)_22rem] xl:grid-cols-[21rem_minmax(0,1fr)_22rem]'
              : 'lg:grid-cols-[11.5rem_minmax(0,1fr)_22rem]'
          }`}
        >
          {/* Sem `backdrop-blur` na coluna abaixo: atrás dela só existe o
              degradê fixo do leitor, que não muda — o blur não tinha o que
              borrar e ainda assim obrigava a recompor a coluna inteira a cada
              rolagem da lista de miniaturas/sumário. Um preto um pouco mais
              fechado dá o mesmo resultado na tela. */}
          {showThumbs && (
            <aside className="hidden border-r border-white/10 bg-black/30 p-3 lg:sticky lg:top-[132px] lg:col-start-1 lg:block lg:h-[calc(100vh-132px)] lg:overflow-hidden">
              <SidePanel
                tab={sidePanelTab}
                onTabChange={setSidePanelTab}
                hasSummary={hasSummary}
                summary={summary}
                materialId={materialId}
                pageCount={pageCount}
                pageList={previewActive ? allowedPages : undefined}
                currentPage={currentPage}
                coverPage={coverPage}
                onGoTo={navigateTo}
              />
            </aside>
          )}

          <section
            ref={contentRef}
            // A pinça é a do NAVEGADOR. Uma pinça própria foi tentada e
            // revertida (ver o comentário em useViewerGestures): alternar o
            // `touchAction` no meio do gesto cancelava os ponteiros e produzia
            // saltos absurdos de zoom.
            style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
            // Sem `overflow-hidden`: junto com o `max-w-full` da moldura ele
            // impedia a página de passar da largura do container, então
            // aumentar o zoom não mudava nada na tela. Cada página agora rola
            // na horizontal por conta própria (ver PdfCanvasPage).
            className={`min-w-0 px-2 py-4 sm:px-4 sm:py-7 ${
              showThumbs ? 'lg:col-start-2' : 'lg:col-start-1'
            } ${
              annotationsVisible
                ? showThumbs ? '' : 'lg:col-span-2'
                : showThumbs ? 'lg:col-span-2' : 'lg:col-span-3'
            }`}
          >
            <div ref={pagesTrackRef} className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5">
              {fillerTopHeight > 0 && (
                <div aria-hidden style={{ height: fillerTopHeight }} className="w-full shrink-0" />
              )}
              {renderedPages.map((page, offset) => {
                const index = mode === 'single' ? offset : windowStart + offset
                const isLive = mode === 'single' || (index >= liveStart && index <= liveEnd)
                if (!isLive) {
                  return (
                    <PdfPageSpacer
                      key={`spacer-${page}`}
                      pageNumber={page}
                      size={spacerSize}
                      containerWidth={contentWidth}
                      onPageFocus={handlePageFocused}
                    />
                  )
                }
                return (
                  <PdfCanvasPage
                    key={`${page}-${mode}`}
                    materialId={materialId}
                    pageNumber={page}
                    active={page === currentPage}
                    zoom={zoom}
                    annotations={previewActive ? EMPTY_ANNOTATIONS : annotationsByPage.get(page) ?? EMPTY_ANNOTATIONS}
                    tool={previewActive ? 'cursor' : tool}
                    drawingStyle={drawingStyle}
                    highlightColor={highlightColor}
                    highlightWidth={highlightWidth}
                    noteColor={noteColor}
                    laserColor={laserColor}
                    textStyle={textStyle}
                    onPageFocus={handlePageFocused}
                    onPageSize={handlePageSize}
                    fallbackSize={pageSize}
                    containerWidth={contentWidth}
                    onPageCount={updateKnownPageCount}
                    onCreateAnnotation={createAnnotation}
                    onUpdateAnnotation={updateAnnotation}
                    onDeleteAnnotation={deleteAnnotation}
                  />
                )
              })}
              {fillerBottomHeight > 0 && (
                <div aria-hidden style={{ height: fillerBottomHeight }} className="w-full shrink-0" />
              )}
            </div>
          </section>

          {annotationsVisible && (
            <AnnotationsPanel
              annotations={annotations}
              currentPage={currentPage}
              showGuide={showGuide}
              onGoTo={goToPage}
              onDelete={deleteAnnotation}
              onDeleteAll={() => setShowDeleteAllConfirm(true)}
            />
          )}
        </main>

        {/* Indicador de zoom. Ampliado, a página passa da largura da tela e o
            leitor precisa arrastar para o lado — sem aviso, isso parece defeito
            ("sumiu metade do texto"). A pastilha diz o tamanho atual e volta ao
            normal num toque. Aparece só quando há zoom de verdade. */}
        {zoomedIn && (
          <button
            type="button"
            onClick={() => { zoomTouchedRef.current = true; if (fitWidthZoom) setZoom(clampZoom(fitWidthZoom, minZoom, maxZoom)) }}
            className="pointer-events-auto fixed bottom-20 left-1/2 z-40 -translate-x-1/2 rounded-full border border-white/20 bg-zinc-950/90 px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg backdrop-blur-sm lg:bottom-6"
          >
            {Math.round((fitWidthZoom ? zoom / fitWidthZoom : zoom) * 100)}% · toque para ajustar
          </button>
        )}

        {/* ── Barra inferior do celular ──────────────────────────────────────
            O cabeçalho antigo empilhava até cinco linhas de rolagem horizontal
            e comia metade da tela do telefone. Agora os controles ficam onde o
            polegar alcança, e cada grupo abre uma folha sob demanda. */}
        {/* Fundo OPACO e sem backdrop-blur, de propósito. `bg-zinc-950/92` não
            existia: o Tailwind só gera opacidades da escala padrão (…90, 95,
            100), então a classe era descartada e a barra ficava só com blur —
            sobre uma página branca ela sumia junto com os botões. E o blur num
            elemento sticky recalcula a cada quadro da rolagem, que era outra
            fonte de flicker (o deck de flashcards já tinha documentado isso).
            `translateZ(0)` dá camada própria de composição.
            A área segura (a faixa do indicador de home, ~34pt no iPhone) deixou
            de ser padding vazio e virou a assinatura da casa — ver abaixo. */}
        <div
          className="sticky bottom-0 z-40 border-t border-white/15 bg-zinc-950 lg:hidden"
          style={{
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }}
        >
          <div className="flex items-center justify-between gap-1 px-2 pt-2">
            <button
              type="button"
              onClick={() => stepPage(-1)}
              disabled={!canStepPrev}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-white disabled:opacity-35"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              data-tour="viewer-pagenav-mobile"
              onClick={() => setMobileSheet('goto')}
              className="flex h-11 min-w-0 flex-1 items-center justify-center gap-1 rounded-xl border border-white/20 bg-white/15 px-2 text-sm font-semibold text-white"
            >
              {currentPage}
              <span className="text-white/45">/ {pageCount || '—'}</span>
            </button>
            <button
              type="button"
              onClick={() => stepPage(1)}
              disabled={!canStepNext}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-white disabled:opacity-35"
              aria-label="Próxima página"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              data-tour="viewer-mode-mobile"
              onClick={() => setMobileSheet('mode')}
              className="flex h-11 shrink-0 flex-col items-center justify-center rounded-xl border border-white/20 bg-white/15 px-2.5 text-[10px] font-semibold text-white"
            >
              <Rows3 className="h-4 w-4" />
              Modo
            </button>
            <button
              type="button"
              data-tour="viewer-nav-mobile"
              onClick={() => { setSidePanelTab(hasSummary ? 'summary' : 'pages'); setMobileSheet('nav') }}
              className="flex h-11 shrink-0 flex-col items-center justify-center rounded-xl border border-white/20 bg-white/15 px-2.5 text-[10px] font-semibold text-white"
            >
              <List className="h-4 w-4" />
              Navegar
            </button>
            {!previewActive && (
              <button
                type="button"
                data-tour="viewer-tools-mobile"
                onClick={() => setMobileSheet('tools')}
                className={`flex h-11 shrink-0 flex-col items-center justify-center rounded-xl border px-2.5 text-[10px] font-semibold ${
                  tool === 'cursor'
                    ? 'border-white/20 bg-white/15 text-white'
                    : 'border-emerald-300/50 bg-emerald-400/25 text-white'
                }`}
              >
                <PenLine className="h-4 w-4" />
                Marcar
              </button>
            )}
          </div>

          {/* Assinatura da casa, na área segura do aparelho.
              Aquela faixa preta embaixo dos botões não era decisão de desenho:
              é o `env(safe-area-inset-bottom)` do iPhone (~34pt reservados para
              o indicador de home) e estava indo embora como padding vazio. A
              linha abaixo a ocupa sem empurrar nada — a barra continua com a
              mesma altura.
              Por que a marca e o endereço, e não mais um controle: print de
              material é o jeito nº 1 de o conteúdo circular fora daqui. A
              página em si já sai carimbada com nome, e-mail, UID e QR de quem
              abriu (ver lib/material-pdf-viewer.ts) — isso identifica QUEM
              vazou, mas não diz a quem RECEBEU onde arrumar o material. O
              endereço no rodapé faz cada print virar vitrine, e o escudo repete
              em silêncio o que o carimbo da página já diz: esta cópia tem dono.
              NÃO é clicável de propósito: um alvo de toque bem em cima do
              indicador de home seria acionado sem querer a cada gesto de sair
              do app — e sair do leitor no meio da leitura é o pior desfecho
              possível para quem só queria voltar à tela inicial. */}
          <div
            aria-hidden
            className="pointer-events-none flex select-none items-center justify-center gap-1.5 pt-2"
            // O `max()` é o mesmo cuidado de antes: em aparelho sem notch o
            // env() vale 0 e a assinatura ficaria colada na borda da tela.
            style={{ paddingBottom: 'max(0.5rem, calc(env(safe-area-inset-bottom) - 0.75rem))' }}
          >
            <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-400/40" />
            <span className="text-[10px] font-semibold tracking-wide text-white/30">DomineAqui</span>
            <span className="text-[10px] text-white/15">·</span>
            <span className="text-[10px] tracking-wide text-white/25">{BRAND_DOMAIN}</span>
          </div>
        </div>

        {/* Folha: ir para a página */}
        <ViewerSheet open={mobileSheet === 'goto'} title="Ir para a página" onClose={() => setMobileSheet(null)}>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                value={pageInput}
                onChange={(event) => setPageInput(event.target.value.replace(/\D/g, ''))}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return
                  submitPageInput()
                  setMobileSheet(null)
                }}
                className="h-12 w-full rounded-xl border border-white/15 bg-white/10 px-3 text-center text-lg font-semibold text-white outline-none focus:border-emerald-300/60"
                inputMode="numeric"
                aria-label="Número da página"
                autoFocus
              />
              <Button
                onClick={() => { submitPageInput(); setMobileSheet(null) }}
                className="h-12 shrink-0 rounded-xl bg-emerald-500 px-5 font-bold text-white hover:bg-emerald-600"
              >
                Ir
              </Button>
            </div>
            <p className="text-xs text-white/50">
              Este material tem {pageCount || '—'} páginas. Você está na {currentPage}.
            </p>
            <div className="flex items-center gap-2">
              <ToolbarTextButton onClick={() => { navigateTo(coverPage || 1); setMobileSheet(null) }}>
                Ir para o início
              </ToolbarTextButton>
              {pageCount > 0 && (
                <ToolbarTextButton onClick={() => { navigateTo(pageCount); setMobileSheet(null) }}>
                  Ir para o fim
                </ToolbarTextButton>
              )}
            </div>
          </div>
        </ViewerSheet>

        {/* Folha: modo de leitura */}
        <ViewerSheet open={mobileSheet === 'mode'} title="Como você quer ler?" onClose={() => setMobileSheet(null)}>
          <div className="space-y-2">
            {MODE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => { applyMode(option.value); setMobileSheet(null) }}
                className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                  mode === option.value
                    ? 'border-emerald-300/60 bg-emerald-400/20'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  mode === option.value ? 'border-emerald-300 bg-emerald-400 text-emerald-950' : 'border-white/25'
                }`}>
                  {mode === option.value && <Check className="h-3 w-3" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{option.label}</p>
                  <p className="text-xs text-white/55">{option.hint}</p>
                  {isLargeDocument && option.value !== 'single' && (
                    <p className="mt-1 text-[11px] text-amber-300/80">
                      Pode ficar lento neste material, que tem {pageCount} páginas.
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
          {isLargeDocument && (
            <p className="mt-3 text-[11px] leading-relaxed text-white/45">
              Este material é muito extenso, então ele abre em &quot;uma página por vez&quot; —
              é o modo que se mantém leve nesse tamanho. Use o sumário ou o número da
              página para pular direto para onde você quer.
            </p>
          )}
          <div className="mt-4 border-t border-white/10 pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Tamanho da letra</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { zoomTouchedRef.current = true; setZoom((z) => clampZoom(z - 0.12, minZoom, maxZoom)) }}
                className="flex h-11 flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white"
                aria-label="Diminuir"
              >
                <Minus className="h-5 w-5" />
              </button>
              <span className="min-w-16 text-center text-sm font-semibold text-white">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => { zoomTouchedRef.current = true; setZoom((z) => clampZoom(z + 0.12, minZoom, maxZoom)) }}
                className="flex h-11 flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white"
                aria-label="Aumentar"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-xs text-white/45">
              Ampliado, a página fica mais larga que a tela: arraste para o lado
              para ler. O aviso embaixo mostra o tamanho e volta ao normal num toque.
            </p>
          </div>
        </ViewerSheet>

        {/* Folha: navegação (miniaturas + sumário) */}
        <ViewerSheet open={mobileSheet === 'nav'} title="Navegar pelo material" onClose={() => setMobileSheet(null)} tall>
          <div className="h-full min-h-0">
            <SidePanel
              tab={sidePanelTab}
              onTabChange={setSidePanelTab}
              hasSummary={hasSummary}
              summary={summary}
              materialId={materialId}
              pageCount={pageCount}
              pageList={previewActive ? allowedPages : undefined}
              currentPage={currentPage}
              coverPage={coverPage}
              // `navigateTo` JÁ fecha a folha, e é uma referência estável. A
              // closure que estava aqui era recriada a cada render do leitor
              // (isto é, a cada mudança de página), o que anulava o `memo` do
              // painel e mandava a lista inteira do sumário re-renderizar.
              onGoTo={navigateTo}
            />
          </div>
        </ViewerSheet>

        {/* Folha: ferramentas de anotação (as mesmas do desktop) */}
        {!previewActive && (
          <ViewerSheet open={mobileSheet === 'tools'} title="Grifar e escrever" onClose={() => setMobileSheet(null)}>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'cursor' as AnnotationTool, label: 'Navegar', icon: <MousePointer2 className="h-5 w-5" /> },
                { value: 'highlight' as AnnotationTool, label: 'Marca-texto', icon: <Highlighter className="h-5 w-5" /> },
                { value: 'note' as AnnotationTool, label: 'Nota', icon: <MessageSquare className="h-5 w-5" /> },
                { value: 'drawing' as AnnotationTool, label: 'Caneta', icon: <PenLine className="h-5 w-5" /> },
                { value: 'laser' as AnnotationTool, label: 'Laser', icon: <Zap className="h-5 w-5" /> },
                { value: 'text' as AnnotationTool, label: 'Texto', icon: <Type className="h-5 w-5" /> },
                { value: 'bookmark' as AnnotationTool, label: 'Marcador', icon: <Bookmark className="h-5 w-5" /> },
                { value: 'eraser' as AnnotationTool, label: 'Apagar', icon: <Eraser className="h-5 w-5" /> },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setTool(item.value)}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-[10px] font-semibold transition-colors ${
                    tool === item.value
                      ? 'border-emerald-300/60 bg-emerald-400/25 text-white'
                      : 'border-white/10 bg-white/5 text-white/75'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-3 border-t border-white/10 pt-2">
              <ToolOptionsBar
                tool={tool}
                drawingStyle={drawingStyle}
                onDrawingStyleChange={setDrawingStyle}
                highlightColor={highlightColor}
                onHighlightColorChange={setHighlightColor}
                highlightWidth={highlightWidth}
                onHighlightWidthChange={setHighlightWidth}
                noteColor={noteColor}
                onNoteColorChange={setNoteColor}
                laserColor={laserColor}
                onLaserColorChange={setLaserColor}
                textStyle={textStyle}
                onTextStyleChange={setTextStyle}
              />
            </div>
            <p className="mt-3 text-xs text-white/50">
              Tudo o que você marcar fica salvo na sua conta e reaparece quando voltar, em qualquer aparelho.
            </p>
          </ViewerSheet>
        )}

        {/* Folha: mais opções */}
        <ViewerSheet open={mobileSheet === 'more'} title="Mais opções" onClose={() => setMobileSheet(null)}>
          <div className="space-y-2">
            <SheetAction icon={<Maximize2 className="h-4 w-4" />} label="Ajustar página à tela" onClick={() => { fitToPage(); setMobileSheet(null) }} />
            {/* Nada de "Tela cheia" aqui: no celular a API nativa não existe
                (Safari do iOS) e o fallback em CSS ficou pior que não ter a
                opção. O botão continua no cabeçalho do desktop, onde funciona. */}
            {!previewActive && (
              <SheetAction
                icon={<StickyNote className="h-4 w-4" />}
                label={showAnnotations ? 'Ocultar minhas anotações' : 'Ver minhas anotações'}
                onClick={() => { setShowAnnotations((value) => !value); setMobileSheet(null) }}
              />
            )}
            <SheetAction icon={<Sparkles className="h-4 w-4" />} label="Ver o tutorial de novo" onClick={() => { setMobileSheet(null); startTour() }} />
            <SheetAction icon={<Keyboard className="h-4 w-4" />} label="Atalhos do teclado" onClick={() => { setMobileSheet(null); setShowShortcuts(true) }} />
            {!previewActive && (!access.material.downloadEnabled || timedAccess?.isTimed) && (
              <SheetAction icon={<Lock className="h-4 w-4" />} label="Por que não posso baixar?" onClick={() => { setMobileSheet(null); setShowDownloadInfo(true) }} />
            )}
          </div>
        </ViewerSheet>

        {showDeleteAllConfirm && (
          <ConfirmDialog
            title="Apagar todas as anotacoes?"
            body="Isso remove grifos, notas, textos, desenhos e marcadores deste material."
            confirmLabel="Apagar tudo"
            onCancel={() => setShowDeleteAllConfirm(false)}
            onConfirm={deleteAllAnnotations}
          />
        )}

        {/* Menu de ajuda do desktop. Reúne o tutorial, o guia das ferramentas
            (que antes ocupava o painel de anotações desde a abertura), os
            atalhos e a explicação sobre download. */}
        {helpMenuOpen && (
          <ViewerDialog title="Ajuda" onClose={() => setHelpMenuOpen(false)}>
            <div className="space-y-2">
              <SheetAction
                icon={<Sparkles className="h-4 w-4" />}
                label="Ver o tutorial de novo"
                onClick={() => { setHelpMenuOpen(false); startTour() }}
              />
              <SheetAction
                icon={<HelpCircle className="h-4 w-4" />}
                label={showGuide ? 'Ocultar guia das ferramentas' : 'Mostrar guia das ferramentas'}
                onClick={() => { setShowGuide((value) => !value); setShowAnnotations(true); setHelpMenuOpen(false) }}
              />
              <SheetAction
                icon={<Keyboard className="h-4 w-4" />}
                label="Atalhos do teclado"
                onClick={() => { setHelpMenuOpen(false); setShowShortcuts(true) }}
              />
              {!previewActive && (!access.material.downloadEnabled || timedAccess?.isTimed) && (
                <SheetAction
                  icon={<Lock className="h-4 w-4" />}
                  label="Por que não posso baixar?"
                  onClick={() => { setHelpMenuOpen(false); setShowDownloadInfo(true) }}
                />
              )}
            </div>
          </ViewerDialog>
        )}

        {showShortcuts && <ShortcutsDialog onClose={() => setShowShortcuts(false)} />}
        {showDownloadInfo && <DownloadInfoDialog onClose={() => setShowDownloadInfo(false)} timedAccess={timedAccess} />}

        <GuidedTour
          open={tourOpen}
          steps={tourSteps}
          onClose={closeTour}
          onFinish={closeTour}
        />
      </div>
    </ViewerShell>
  )
}

// ─── Painel lateral: miniaturas reais + sumário interativo ───────────────────
const SidePanel = memo(function SidePanel({
  tab,
  onTabChange,
  hasSummary,
  summary,
  materialId,
  pageCount,
  pageList,
  currentPage,
  coverPage,
  onGoTo,
}: {
  tab: 'pages' | 'summary'
  onTabChange: (tab: 'pages' | 'summary') => void
  hasSummary: boolean
  summary: SummaryEntry[]
  materialId: string
  pageCount: number
  // Quando definido (prévia), lista as miniaturas SÓ dessas páginas.
  pageList?: number[]
  currentPage: number
  coverPage?: number
  onGoTo: (page: number) => void
}) {
  const activeTab = !hasSummary ? 'pages' : tab
  // Memoizado: mantém a MESMA referência de array enquanto a contagem/prévia
  // não muda, para que a lista de miniaturas não seja reconstruída a cada
  // re-render do painel disparado pelo scroll (mudança de página atual).
  const allThumbPages = useMemo(
    () => (pageList && pageList.length
      ? pageList
      : Array.from({ length: pageCount }, (_, index) => index + 1)),
    [pageList, pageCount]
  )

  // Mostra uma janela ao redor da página atual em vez da lista inteira. Num
  // material de 2000+ páginas, montar todas as miniaturas de uma vez são
  // milhares de botões e outros tantos registros de observer — e o painel abre
  // ligado por padrão no desktop, então isso acontecia já na abertura.
  // O botão "carregar mais" abaixo estende a janela sob demanda.
  const [thumbLimit, setThumbLimit] = useState(THUMB_WINDOW)
  useEffect(() => {
    setThumbLimit(THUMB_WINDOW)
  }, [materialId])

  const currentThumbIndex = Math.max(0, allThumbPages.indexOf(currentPage))
  const thumbStart = Math.max(0, currentThumbIndex - Math.floor(thumbLimit / 2))
  const thumbEnd = Math.min(allThumbPages.length, thumbStart + thumbLimit)
  const thumbPages = useMemo(
    () => allThumbPages.slice(thumbStart, thumbEnd),
    [allThumbPages, thumbStart, thumbEnd]
  )
  const hiddenBefore = thumbStart
  const hiddenAfter = allThumbPages.length - thumbEnd

  // UM ÚNICO IntersectionObserver compartilhado por TODAS as miniaturas. Antes,
  // cada miniatura criava o seu próprio observer — num material de 3000 páginas
  // isso instanciava 3000 observers de uma vez ao abrir o painel, um custo alto
  // de montagem. Agora, cada miniatura só se registra neste observer, que
  // dispara o render (lazy) da miniatura quando ela entra na área visível.
  const thumbObserverRef = useRef<IntersectionObserver | null>(null)
  const thumbHandlersRef = useRef<Map<Element, () => void>>(new Map())

  const registerThumb = useCallback((element: Element, onEnter: () => void) => {
    if (!thumbObserverRef.current) {
      thumbObserverRef.current = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue
            const handler = thumbHandlersRef.current.get(entry.target)
            if (handler) {
              thumbObserverRef.current?.unobserve(entry.target)
              thumbHandlersRef.current.delete(entry.target)
              handler()
            }
          }
        },
        { rootMargin: '400px 0px' }
      )
    }
    thumbHandlersRef.current.set(element, onEnter)
    thumbObserverRef.current.observe(element)
    return () => {
      thumbHandlersRef.current.delete(element)
      thumbObserverRef.current?.unobserve(element)
    }
  }, [])

  useEffect(() => {
    return () => {
      thumbObserverRef.current?.disconnect()
      thumbObserverRef.current = null
      thumbHandlersRef.current.clear()
    }
  }, [])

  return (
    <div className="flex h-full min-h-0 flex-col">
      {hasSummary && (
        <div className="mb-3 grid shrink-0 grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => onTabChange('pages')}
            className={`flex h-8 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'pages' ? 'bg-emerald-400/25 text-white' : 'text-white/65 hover:bg-white/10'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" /> Páginas
          </button>
          <button
            type="button"
            onClick={() => onTabChange('summary')}
            className={`flex h-8 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'summary' ? 'bg-emerald-400/25 text-white' : 'text-white/65 hover:bg-white/10'
            }`}
          >
            <List className="h-3.5 w-3.5" /> Sumário
          </button>
        </div>
      )}

      {/* `overscroll-behavior: contain`: no celular esta lista vive dentro da
          folha inferior, e sem isto a inércia do dedo continuava no documento
          ao chegar no fim — o material rolava por baixo, trocava a página
          atual e re-renderizava o leitor inteiro no meio do gesto. Era a maior
          fonte do "trava um pouco pra navegar no sumário".
          `contain: paint`: o que sai da caixa não precisa ser considerado na
          pintura, então rolar aqui não repinta o resto da tela. */}
      <div
        className="clean-scrollbar min-h-0 flex-1 overflow-y-auto pr-1"
        style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', contain: 'paint' }}
      >
        {activeTab === 'summary' && hasSummary ? (
          <SummaryList summary={summary} currentPage={currentPage} onGoTo={onGoTo} />
        ) : (
          <div className="space-y-2">
            {hiddenBefore > 0 && (
              <button
                type="button"
                onClick={() => setThumbLimit((value) => value + THUMB_WINDOW)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2 text-[11px] font-semibold text-white/70 hover:bg-white/10"
              >
                Mostrar as {Math.min(hiddenBefore, THUMB_WINDOW)} páginas anteriores
              </button>
            )}
            {thumbPages.map((page) => (
              <PdfThumbnail
                key={page}
                materialId={materialId}
                pageNumber={page}
                active={page === currentPage}
                isCover={page === coverPage}
                onSelect={onGoTo}
                registerObserver={registerThumb}
              />
            ))}
            {hiddenAfter > 0 && (
              <button
                type="button"
                onClick={() => setThumbLimit((value) => value + THUMB_WINDOW)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2 text-[11px] font-semibold text-white/70 hover:bg-white/10"
              >
                Mostrar mais {Math.min(hiddenAfter, THUMB_WINDOW)} páginas
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

// Quantas linhas o sumário monta de uma vez.
//
// Antes, a lista inteira era montada na abertura e as linhas fora da tela
// ficavam com `content-visibility: auto` para adiar o custo. Só que adiar a
// PINTURA é justamente o que aparecia no celular: a linha entrava vazia (o
// fundo escuro da folha) e o texto surgia depois, enquanto o dedo rolava. Agora
// não há nada adiado — o que está na lista está pintado — e o teto é de
// montagem: com os subtópicos fechados a lista já começa curta, e o botão
// "mostrar mais" estende quando alguém expande tudo num material enorme.
const SUMMARY_WINDOW = 120

const SummaryList = memo(function SummaryList({
  summary,
  currentPage,
  onGoTo,
}: {
  summary: SummaryEntry[]
  currentPage: number
  onGoTo: (page: number) => void
}) {
  const activeItemRef = useRef<HTMLButtonElement | null>(null)
  const didAutoScroll = useRef(false)

  // Árvore: tópicos (nível 0) com os subtópicos (níveis 1 e 2) pendurados.
  const outline = useMemo(() => buildSummaryOutline(summary), [summary])
  // Entrada "ativa": a de maior página que ainda é <= página atual.
  const activeId = useMemo(() => findActiveSummaryId(summary, currentPage), [summary, currentPage])

  // Nós abertos = os que o LEITOR abriu (ficam abertos até ele fechar) + o
  // caminho até a seção em que ele está agora (esse a lista abre e fecha
  // sozinha). Assim o "você está em" nunca fica escondido, e ler o material
  // inteiro não vai abrindo tópico atrás de tópico até a lista virar a parede
  // que ela era antes.
  const userExpandedRef = useRef<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(outlineAncestors(outline, activeId))
  )
  const [limit, setLimit] = useState(SUMMARY_WINDOW)

  // Outro material (ou sumário recarregado): volta tudo ao estado inicial. Na
  // primeira montagem não faz nada — o `useState` acima já abriu o ramo certo.
  // Depois de zerar, o efeito seguinte reabre o ramo da seção atual.
  const revealedRef = useRef<string | null>(null)
  const outlineRef = useRef(outline)
  useEffect(() => {
    if (outlineRef.current === outline) return
    outlineRef.current = outline
    revealedRef.current = null
    userExpandedRef.current = new Set()
    setExpanded(new Set())
    setLimit(SUMMARY_WINDOW)
  }, [outline])

  // Rolar o material troca a seção ativa: abrimos o caminho até ela e fechamos
  // o ramo que a lista tinha aberto sozinha antes. Só quando a seção MUDA —
  // quem fecha um ramo de propósito não o vê reabrir no mesmo lugar.
  useEffect(() => {
    if (!activeId || revealedRef.current === activeId) return
    revealedRef.current = activeId
    const ancestors = outlineAncestors(outline, activeId)
    setExpanded((current) => {
      const next = new Set(userExpandedRef.current)
      for (const id of ancestors) next.add(id)
      if (next.size === current.size && Array.from(next).every((id) => current.has(id))) return current
      return next
    })
  }, [activeId, outline])

  const toggleNode = useCallback((id: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.delete(id)) userExpandedRef.current.delete(id)
      else {
        next.add(id)
        userExpandedRef.current.add(id)
      }
      return next
    })
  }, [])

  const hasBranches = outline.branchIds.length > 0
  const allExpanded = hasBranches && outline.branchIds.every((id) => expanded.has(id))
  const toggleAll = useCallback(() => {
    userExpandedRef.current = allExpanded ? new Set() : new Set(outline.branchIds)
    setExpanded(new Set(userExpandedRef.current))
  }, [allExpanded, outline])

  const visible = useMemo(() => visibleOutlineNodes(outline, expanded), [outline, expanded])

  // A seção atual precisa estar montada mesmo que caia fora da janela — é ela
  // que a lista rola para o centro ao abrir.
  const activeIndex = activeId ? visible.findIndex((node) => node.id === activeId) : -1
  const shownCount = Math.max(limit, activeIndex + 1)
  const shown = visible.length > shownCount ? visible.slice(0, shownCount) : visible
  const hiddenAfter = visible.length - shown.length

  useEffect(() => {
    if (didAutoScroll.current) return
    didAutoScroll.current = true
    activeItemRef.current?.scrollIntoView({ block: 'center' })
  }, [])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <span className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-wide text-white/40">
          Sumário · {summary.length} {summary.length === 1 ? 'seção' : 'seções'}
        </span>
        {hasBranches && (
          <button
            type="button"
            onClick={toggleAll}
            className="shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-white/55 transition-colors hover:bg-white/10 hover:text-white"
          >
            {allExpanded ? 'Recolher tudo' : 'Expandir tudo'}
          </button>
        )}
      </div>
      <div className="space-y-0.5">
        {shown.map((node) => (
          <SummaryRow
            key={node.id}
            node={node}
            active={node.id === activeId}
            expanded={expanded.has(node.id)}
            onToggle={toggleNode}
            onGoTo={onGoTo}
            // Só a linha ativa recebe a ref (as outras recebem `undefined`, que
            // é estável e não quebra a memoização delas).
            activeRef={node.id === activeId ? activeItemRef : undefined}
          />
        ))}
      </div>
      {hiddenAfter > 0 && (
        <button
          type="button"
          onClick={() => setLimit(shownCount + SUMMARY_WINDOW)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 py-2 text-[11px] font-semibold text-white/70 hover:bg-white/10"
        >
          Mostrar mais {Math.min(hiddenAfter, SUMMARY_WINDOW)} seções
        </button>
      )}
    </div>
  )
})

// Linha do sumário em componente próprio e memoizado: rolar o material troca a
// seção ativa, e sem isto CADA troca re-renderizava as centenas de linhas da
// lista. Agora re-renderizam duas — a que perdeu o destaque e a que ganhou.
const SummaryRow = memo(function SummaryRow({
  node,
  active,
  expanded,
  onToggle,
  onGoTo,
  activeRef,
}: {
  node: SummaryOutlineNode
  active: boolean
  expanded: boolean
  onToggle: (id: string) => void
  onGoTo: (page: number) => void
  activeRef?: React.MutableRefObject<HTMLButtonElement | null>
}) {
  const { entry, depth, descendantCount } = node
  const hasChildren = node.childIds.length > 0
  // Peso do texto pela profundidade REAL, não pelo nível declarado: num sumário
  // que começa em `##` o primeiro nível continua com cara de tópico.
  const rank = Math.min(2, depth)

  return (
    <div
      // O recuo vem da profundidade REAL na árvore, não do nível declarado:
      // subtópico de um sumário que começa em `##` não fica recuado à toa.
      style={{ marginLeft: `${rank}rem` }}
      // `transition-colors` e não `transition-all`: só a cor muda aqui, e
      // `all` põe padding/borda/tamanho na conta da animação — em lista longa
      // é recálculo de layout à toa a cada troca de seção ativa.
      className={`group relative flex items-stretch rounded-lg border transition-colors ${
        active
          ? 'border-emerald-300/50 bg-emerald-400/15 text-white'
          : 'border-transparent text-white/70 hover:border-white/10 hover:bg-white/5'
      }`}
    >
      {active && (
        <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-emerald-300" aria-hidden />
      )}
      {hasChildren ? (
        // Alvo próprio para o dedo: abrir o tópico e ir até ele são ações
        // diferentes, e no celular elas não podem disputar o mesmo toque.
        <button
          type="button"
          onClick={() => onToggle(entry.id)}
          aria-expanded={expanded}
          aria-label={expanded ? `Recolher ${entry.title}` : `Expandir ${entry.title}`}
          title={expanded ? 'Recolher subtópicos' : 'Expandir subtópicos'}
          className="flex w-8 shrink-0 items-center justify-center rounded-l-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ChevronRight
            className={`h-3.5 w-3.5 transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
            aria-hidden
          />
        </button>
      ) : (
        // Mesma largura da coluna do chevron: com ou sem filhos, os títulos de
        // um mesmo nível começam alinhados, e o recuo lido na lista é só a
        // profundidade do tópico.
        <span className="w-8 shrink-0" aria-hidden />
      )}
      <button
        ref={activeRef}
        type="button"
        onClick={() => onGoTo(entry.page)}
        title={entry.title}
        className="flex min-w-0 flex-1 items-start gap-2 py-2 pr-2 text-left"
      >
        <span
          className={`min-w-0 flex-1 whitespace-normal break-words leading-snug ${
            rank === 0 ? 'text-[13px] font-semibold' : rank === 1 ? 'text-xs' : 'text-[11px] text-white/60'
          }`}
        >
          {entry.title}
        </span>
        {hasChildren && !expanded && (
          <span
            className="shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-white/45"
            title={`${descendantCount} ${descendantCount === 1 ? 'subtópico' : 'subtópicos'}`}
          >
            +{descendantCount}
          </span>
        )}
        <span
          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
            active ? 'bg-emerald-300/25 text-white' : 'bg-white/10 text-white/65'
          }`}
        >
          {entry.page}
        </span>
      </button>
    </div>
  )
})

// Miniatura real: renderiza a página (lazy, via IntersectionObserver) no menor
// tamanho possível reaproveitando o cache de bytes do viewer principal.
const PdfThumbnail = memo(function PdfThumbnail({
  materialId,
  pageNumber,
  active,
  isCover,
  onSelect,
  registerObserver,
}: {
  materialId: string
  pageNumber: number
  active: boolean
  isCover?: boolean
  // Recebe o handler estável e passa a própria página — evita recriar uma
  // closure por miniatura a cada render (o que quebrava a memoização).
  onSelect: (page: number) => void
  // Registra a miniatura no observer compartilhado do painel; dispara o render
  // (lazy) quando ela entra na área visível. Retorna a função de desregistro.
  registerObserver: (element: Element, onEnter: () => void) => () => void
}) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderedRef = useRef(false)
  const [shouldRender, setShouldRender] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')

  useEffect(() => {
    if (active) buttonRef.current?.scrollIntoView({ block: 'nearest' })
  }, [active])

  useEffect(() => {
    const element = buttonRef.current
    if (!element) return
    return registerObserver(element, () => setShouldRender(true))
  }, [registerObserver])

  useEffect(() => {
    if (!shouldRender || renderedRef.current) return
    let cancelled = false
    let doc: any
    let renderTask: any

    async function renderThumb() {
      setStatus('loading')
      try {
        // Prioridade baixa: a miniatura nunca pode atrasar a página que o
        // usuário está de fato lendo (ver acquirePageFetchSlot).
        const { bytes } = await fetchPdfPageBytes(materialId, pageNumber, 'thumb')
        if (cancelled) return
        const pdfjs = await getPdfJs()
        doc = await pdfjs.getDocument({ data: bytes.slice() }).promise
        const page = await doc.getPage(1)
        const base = page.getViewport({ scale: 1 })
        const targetWidth = 150
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const scale = (targetWidth / base.width) * dpr
        const viewport = page.getViewport({ scale })
        const canvas = canvasRef.current
        const context = canvas?.getContext('2d', { alpha: false })
        if (!canvas || !context || cancelled) return
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        canvas.style.width = '100%'
        canvas.style.height = 'auto'
        renderTask = page.render({ canvasContext: context, viewport })
        await renderTask.promise
        if (!cancelled) {
          renderedRef.current = true
          setStatus('ready')
        }
      } catch (err: any) {
        if (!cancelled && err?.name !== 'RenderingCancelledException') setStatus('error')
      } finally {
        try { await doc?.destroy?.() } catch {}
      }
    }

    renderThumb()
    return () => {
      cancelled = true
      renderTask?.cancel?.()
      doc?.destroy?.()
    }
  }, [shouldRender, materialId, pageNumber])

  return (
    <button
      ref={buttonRef}
      onClick={() => onSelect(pageNumber)}
      // content-visibility: miniaturas fora da tela pulam layout/paint,
      // deixando o scroll do painel leve mesmo com muitas páginas.
      style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 224px' }}
      className={`w-full rounded-xl border p-1.5 text-left transition-colors ${
        active
          ? 'border-emerald-300/60 bg-emerald-400/20 text-white'
          : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
      }`}
    >
      <div className="relative mb-1 aspect-[3/4] overflow-hidden rounded-lg bg-white/90 shadow-inner">
        <canvas ref={canvasRef} className={`h-full w-full object-contain ${status === 'ready' ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
        {status !== 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center">
            {status === 'error' ? (
              <span className="text-[10px] font-medium text-rose-500">erro</span>
            ) : (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-700/20 border-t-emerald-700" />
            )}
          </div>
        )}
        {isCover && (
          <span className="absolute left-1 top-1 rounded-md bg-emerald-500/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow">
            Capa
          </span>
        )}
      </div>
      <span className="text-[11px] font-medium">Pag. {pageNumber}</span>
    </button>
  )
})

function ViewerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(135deg,#061411_0%,#13251f_44%,#09090b_100%)]" />
      <div className="relative">{children}</div>
    </div>
  )
}

// Esqueleto no FORMATO do leitor (barra + moldura de página), não um cartão
// centralizado. Um esqueleto que já tem a silhueta da tela final faz a espera
// parecer mais curta e evita o salto de layout quando o conteúdo entra.
function ViewerLoading() {
  return (
    <div className="min-h-screen text-white">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/80 backdrop-blur-2xl">
        <div className="flex items-center gap-2 px-3 py-3 sm:px-4">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-white/10" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-2/5 max-w-xs animate-pulse rounded bg-white/15" />
            <div className="h-2.5 w-1/4 max-w-[10rem] animate-pulse rounded bg-white/10" />
          </div>
          <div className="h-10 w-24 shrink-0 animate-pulse rounded-xl bg-white/10" />
        </div>
      </div>
      <div className="flex justify-center px-3 py-6 sm:px-4 sm:py-8">
        <div className="w-full max-w-3xl">
          <div
            className="w-full animate-pulse rounded-xl border border-white/10 bg-white/[0.06]"
            style={{ aspectRatio: '595 / 842' }}
          />
          <p className="mt-4 text-center text-xs text-white/45">Preparando seu material…</p>
        </div>
      </div>
    </div>
  )
}

// Espaçador leve para páginas fora da janela de virtualização. Reserva a
// altura estimada (para o scroll/scrollbar ficarem consistentes) e observa o
// foco: quando o leitor rola até ele, avisa o pai, que então o promove a
// PdfCanvasPage real. Custa uma fração do componente pesado — é o que permite
// abrir materiais de milhares de páginas sem travar.
const PdfPageSpacer = memo(function PdfPageSpacer({
  pageNumber,
  size,
  containerWidth,
  onPageFocus,
}: {
  pageNumber: number
  size: PageSize
  containerWidth: number
  onPageFocus: (page: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    return observePageFocus(element, () => onPageFocus(pageNumber))
  }, [onPageFocus, pageNumber])

  const frameWidth = Math.ceil(size.width + 16)
  const frameHeight = Math.ceil(size.height + 16)
  // Precisa reservar a MESMA altura que a página real ocupa; se o espaçador
  // fosse clampado à largura do container (como era, com `max-w-full`) e a
  // página real não, o scroll saltaria toda vez que um virasse o outro.
  const overflowing = containerWidth > 0 && frameWidth > containerWidth

  return (
    <div
      id={`pdf-page-${pageNumber}`}
      ref={ref}
      className="flex w-full scroll-mt-36 px-0 sm:px-2"
      // `clip` e não `auto`: um espaçador é só um lugar reservado, ninguém
      // arrasta ele. `auto` criaria um contêiner de rolagem por página — num
      // material de milhares de páginas, milhares deles. `clip` recorta sem
      // criar contêiner nenhum.
      style={{ justifyContent: overflowing ? 'flex-start' : 'center', overflowX: 'clip' }}
    >
      <div
        className="relative flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]"
        style={{
          width: frameWidth,
          height: frameHeight,
          contentVisibility: 'auto',
          containIntrinsicSize: `${frameWidth}px ${frameHeight}px`,
        }}
      >
        <span className="text-xs font-medium text-white/25">Pag. {pageNumber}</span>
      </div>
    </div>
  )
})

const PdfCanvasPage = memo(function PdfCanvasPage({
  materialId,
  pageNumber,
  active,
  zoom,
  annotations,
  tool,
  drawingStyle,
  highlightColor,
  highlightWidth,
  noteColor,
  laserColor,
  textStyle,
  onPageFocus,
  onPageSize,
  fallbackSize,
  containerWidth,
  onPageCount,
  onCreateAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
}: {
  materialId: string
  pageNumber: number
  active: boolean
  zoom: number
  containerWidth: number
  annotations: PdfAnnotation[]
  tool: AnnotationTool
  drawingStyle: DrawingStyle
  highlightColor: string
  highlightWidth: number
  noteColor: string
  laserColor: string
  textStyle: TextStyle
  onPageFocus: (page: number) => void
  onPageSize: (size: PageSize) => void
  fallbackSize: PageSize | null
  onPageCount: (totalPages?: number) => void
  onCreateAnnotation: (annotation: Partial<PdfAnnotation>) => void
  onUpdateAnnotation: (annotation: PdfAnnotation, patch: Partial<PdfAnnotation>) => void
  onDeleteAnnotation: (annotation: PdfAnnotation) => void
}) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const draftCanvasRef = useRef<HTMLCanvasElement>(null)
  const interactionRef = useRef<{
    kind: 'drawing'
    startedAt: number
    draft: DrawingDraft
    pointerId: number
  } | {
    kind: 'highlight'
    draft: HighlightDraft
    pointerId: number
  } | null>(null)
  const rafRef = useRef<number | null>(null)
  const laserCanvasRef = useRef<HTMLCanvasElement>(null)
  const laserStrokesRef = useRef<Array<{ points: Array<{ x: number; y: number; t: number }> }>>([])
  const laserDrawingRef = useRef(false)
  const laserPointerIdRef = useRef<number | null>(null)
  const laserRafRef = useRef<number | null>(null)
  const ignoreNextClickRef = useRef(false)
  const [visible, setVisible] = useState(active)
  const [error, setError] = useState('')
  // Espera pedida pelo servidor num 429. Quando presente, a UI mostra uma
  // contagem regressiva amigável em vez de um erro vermelho — o retry é
  // automático, então não é um beco sem saída para o leitor.
  const [waitSeconds, setWaitSeconds] = useState(0)
  const [pageProxy, setPageProxy] = useState<PageProxyEntry | null>(null)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [renderSize, setRenderSize] = useState<PageSize | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editor, setEditor] = useState<EditorState | null>(null)
  const requestedRef = useRef(false)
  const autoRetryRef = useRef(0)
  // O canvas já tem um desenho? Decide se vale pagar o canvas fora da tela
  // (só faz sentido quando há um bitmap antigo para não piscar).
  const hasBitmapRef = useRef(false)
  // `active` num ref: o efeito de rasterização precisa saber se esta é a página
  // que o leitor está olhando, mas sem `active` nas dependências — senão cada
  // troca de foco durante a rolagem redesenharia tudo.
  const activeRef = useRef(active)
  activeRef.current = active
  // Escala já rasterizada no canvas. O zoom muda na hora (o frame redimensiona
  // e o bitmap é reescalado pela GPU); a rasterização nítida vem depois, com
  // debounce, e só quando a diferença for grande o bastante para ser visível.
  const [renderScale, setRenderScale] = useState(zoom)

  useEffect(() => {
    requestedRef.current = false
    autoRetryRef.current = 0
    hasBitmapRef.current = false
    setPageProxy(null)
    setError('')
    setWaitSeconds(0)
    setRenderSize(null)
    setSelectedId(null)
    setEditor(null)
    laserStrokesRef.current = []
    laserDrawingRef.current = false
    if (laserRafRef.current) {
      window.cancelAnimationFrame(laserRafRef.current)
      laserRafRef.current = null
    }
  }, [materialId, pageNumber])

  useEffect(() => {
    const element = wrapperRef.current
    if (!element) return
    return observePageVisible(element, () => setVisible(true))
  }, [pageNumber])

  useEffect(() => {
    const element = wrapperRef.current
    if (!element) return
    return observePageFocus(element, () => onPageFocus(pageNumber))
  }, [onPageFocus, pageNumber])

  // Efeito de CARGA: busca os bytes e parseia o documento uma única vez por
  // página. O zoom não entra aqui — antes entrava, e era por isso que cada
  // passo de zoom re-parseava o PDF de todas as páginas vivas.
  useEffect(() => {
    if ((!visible && !active) || requestedRef.current || pageProxy) return
    let cancelled = false
    let settled = false
    // `owned` = temos uma referência que ninguém mais vai devolver. Fica true
    // apenas entre o acquire e o momento em que o estado assume a posse (ou em
    // que a soltamos aqui mesmo). Sem esse controle, o cleanup soltaria a
    // mesma referência que o efeito de posse também solta — release duplo, e o
    // documento seria destruído embaixo de uma página ainda montada.
    let owned = false

    async function loadPage() {
      requestedRef.current = true
      setError('')
      setWaitSeconds(0)
      try {
        const entry = await acquirePageProxy(materialId, pageNumber, 'reader')
        owned = true
        settled = true
        if (cancelled) {
          releasePageProxy(materialId, pageNumber)
          owned = false
          return
        }
        onPageCount(entry.totalPages || undefined)
        setPageProxy(entry)
        owned = false
      } catch (err: any) {
        settled = true
        if (!cancelled) {
          const { status, retryAfterMs } = (err || {}) as PageFetchError
          if (status === 429) {
            setWaitSeconds(Math.max(1, Math.ceil((retryAfterMs || 5000) / 1000)))
          }
          setError(err?.message || 'Pagina indisponivel')
        }
      }
    }

    loadPage()
    return () => {
      cancelled = true
      // Se a limpeza rodou por uma mudança de dependência (ex.: `active`
      // alternando durante o scroll) ANTES de a requisição concluir, o guard
      // `requestedRef` ficaria travado em true e a próxima execução do efeito
      // sairia cedo — deixando a página presa no spinner até um F5. Liberar o
      // guard quando não houve conclusão permite a retomada; a requisição em si
      // é deduplicada/cacheada, então não há refetch duplicado.
      if (!settled) requestedRef.current = false
      // Só solta se a posse ainda estiver com o efeito; quando o estado
      // assumiu, quem devolve é o efeito de posse abaixo.
      if (owned) {
        owned = false
        releasePageProxy(materialId, pageNumber)
      }
    }
  }, [active, loadAttempt, materialId, onPageCount, pageProxy, pageNumber, visible])

  // Posse do proxy enquanto esta página estiver montada. Ao desmontar (a
  // página sai da janela de virtualização) a referência é devolvida e o LRU
  // fica livre para destruir o documento.
  useEffect(() => {
    if (!pageProxy) return
    return () => {
      releasePageProxy(materialId, pageNumber)
    }
  }, [materialId, pageNumber, pageProxy])

  // Debounce do zoom: o frame já reescala o bitmap na hora, então a
  // rasterização nítida pode esperar o usuário parar de mexer. E só vale a
  // pena refazer quando a diferença é perceptível — reescalar um bitmap entre
  // 0,8x e 1,25x é indistinguível de re-rasterizar, e custa zero.
  useEffect(() => {
    const ratio = zoom / renderScale
    if (ratio > 0.8 && ratio < 1.25) return
    const timer = window.setTimeout(() => setRenderScale(zoom), 180)
    return () => window.clearTimeout(timer)
  }, [zoom, renderScale])

  // Efeito de RASTERIZAÇÃO: só desenha. Sem parse, sem destroy.
  useEffect(() => {
    const entry = pageProxy
    if (!entry) return
    let cancelled = false
    let renderTask: any

    async function renderPage() {
      setError('')
      // O canvas fora da tela existe para o REDESENHO não piscar: `canvas.width
      // = ...` apaga o bitmap, então mudar o zoom deixaria a página em branco
      // até o render terminar. Mas ele custa uma alocação do tamanho da página
      // inteira (megabytes) mais uma cópia completa — e na PRIMEIRA vez que uma
      // página é desenhada não há bitmap nenhum a proteger. Fazer isso a cada
      // virada de página era boa parte do congelamento no celular.
      const needsOffscreen = hasBitmapRef.current
      let offscreen: HTMLCanvasElement | null = null
      try {
        const page = entry!.page
        const baseViewport = page.getViewport({ scale: 1 })
        onPageSize({ width: baseViewport.width, height: baseViewport.height })

        // Escala de rasterização com teto de megapixels (ver rasterScaleFor).
        // Independe de `active`: manter a qualidade estável evita re-render de
        // todas as páginas vivas toda vez que o foco muda durante o scroll.
        const scale = rasterScaleFor(baseViewport.width, baseViewport.height, renderScale)
        const viewport = page.getViewport({ scale })
        const displayViewport = page.getViewport({ scale: renderScale })
        if (cancelled) return

        const canvas = canvasRef.current
        if (!canvas) return
        const width = Math.floor(viewport.width)
        const height = Math.floor(viewport.height)

        let target: HTMLCanvasElement = canvas
        if (needsOffscreen) {
          offscreen = document.createElement('canvas')
          target = offscreen
        }
        target.width = width
        target.height = height
        const context = target.getContext('2d', { alpha: false })
        if (!context) return
        context.imageSmoothingEnabled = true
        context.imageSmoothingQuality = 'high'

        if (!needsOffscreen) {
          canvas.style.width = '100%'
          canvas.style.height = 'auto'
          setRenderSize({ width: displayViewport.width, height: displayViewport.height })
        }

        renderTask = page.render({ canvasContext: context, viewport })
        await renderTask.promise
        if (cancelled) return

        if (needsOffscreen && offscreen) {
          // Troca: o bitmap antigo fica na tela até este instante.
          const visibleContext = canvas.getContext('2d', { alpha: false })
          if (!visibleContext) return
          canvas.width = width
          canvas.height = height
          canvas.style.width = '100%'
          canvas.style.height = 'auto'
          visibleContext.drawImage(offscreen, 0, 0)
          setRenderSize({ width: displayViewport.width, height: displayViewport.height })
        }
        hasBitmapRef.current = true
      } catch (err: any) {
        if (!cancelled && err?.name !== 'RenderingCancelledException') {
          setError(err?.message || 'Pagina indisponivel')
        }
      } finally {
        // Libera o backing store do offscreen também no caminho de erro.
        if (offscreen) {
          offscreen.width = 0
          offscreen.height = 0
        }
      }
    }

    // A página que o leitor está olhando desenha JÁ; as vizinhas (que são
    // pré-carga) esperam a thread principal ficar livre. Sem isso, virar a
    // página enfileirava o desenho das vizinhas na frente — ou junto — do que
    // se quer ver, e a interação travava. `active` vem de um ref para não
    // entrar nas dependências e disparar re-render a cada troca de foco.
    let idleHandle: number | null = null
    const start = () => {
      enqueueRaster(async () => {
        if (cancelled) return
        await renderPage()
      })
    }
    if (activeRef.current || hasBitmapRef.current) {
      start()
    } else {
      idleHandle = scheduleIdle(start)
    }

    return () => {
      cancelled = true
      if (idleHandle != null) cancelIdle(idleHandle)
      renderTask?.cancel?.()
    }
  }, [onPageSize, pageProxy, renderScale])

  // Libera a memória do canvas ao desmontar. O Safari do iOS segura o backing
  // store mesmo depois de o nó sair do DOM; zerar as dimensões devolve na hora.
  useEffect(() => {
    const canvas = canvasRef.current
    return () => {
      if (!canvas) return
      canvas.width = 0
      canvas.height = 0
    }
  }, [])

  useEffect(() => {
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
      if (laserRafRef.current) window.cancelAnimationFrame(laserRafRef.current)
    }
  }, [])

  useEffect(() => {
    setEditor((current) => current?.kind === 'text'
      ? { ...current, textStyle: { ...textStyle } }
      : current
    )
  }, [textStyle])

  useEffect(() => {
    setEditor((current) => current?.kind === 'note' && !current.annotation
      ? { ...current, noteColor }
      : current
    )
  }, [noteColor])

  const retryLoad = () => {
    requestedRef.current = false
    setPageProxy(null)
    setRenderSize(null)
    setError('')
    setWaitSeconds(0)
    setLoadAttempt((attempt) => attempt + 1)
  }

  // Auto-recuperação: se uma página falhar mesmo após os retries da requisição,
  // ela tenta sozinha mais 2 vezes antes de exibir o botão manual — assim o
  // usuário nunca precisa dar F5 para a página aparecer. Num 429 a espera vem
  // do próprio servidor (Retry-After), então respeitamos esse tempo.
  useEffect(() => {
    if (!error || autoRetryRef.current >= 2) return
    const delay = waitSeconds > 0
      ? waitSeconds * 1000
      : 1000 * (autoRetryRef.current + 1)
    const timer = window.setTimeout(() => {
      autoRetryRef.current += 1
      requestedRef.current = false
      setPageProxy(null)
      setRenderSize(null)
      setError('')
      setWaitSeconds(0)
      setLoadAttempt((attempt) => attempt + 1)
    }, delay)
    return () => window.clearTimeout(timer)
  }, [error, waitSeconds])

  // Contagem regressiva visível durante a espera de um 429.
  useEffect(() => {
    if (waitSeconds <= 0) return
    const timer = window.setTimeout(() => setWaitSeconds((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [waitSeconds])

  useEffect(() => {
    if (pageProxy) autoRetryRef.current = 0
  }, [pageProxy])

  // A moldura acompanha o zoom NA HORA, mesmo antes de a rasterização nítida
  // chegar: o canvas ocupa 100% dela, então o bitmap já existente é reescalado
  // pela GPU. É isso que faz o zoom parecer instantâneo sem re-parsear nada.
  const zoomRatio = renderScale > 0 ? zoom / renderScale : 1
  const pageFrameSize = renderSize
    ? { width: renderSize.width * zoomRatio, height: renderSize.height * zoomRatio }
    : fallbackSize
      ? { width: fallbackSize.width * zoom, height: fallbackSize.height * zoom }
      : { width: 595 * zoom, height: 842 * zoom }

  // +16 = padding p-2 da moldura nos dois lados.
  const frameOuterWidth = Math.ceil(pageFrameSize.width + 16)
  const overflowing = containerWidth > 0 && frameOuterWidth > containerWidth

  const getPosition = useCallback((clientX: number, clientY: number) => {
    const rect = overlayRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: clamp01((clientX - rect.left) / rect.width),
      y: clamp01((clientY - rect.top) / rect.height),
    }
  }, [])

  const prepareDraftCanvas = useCallback(() => {
    const canvas = draftCanvasRef.current
    const rect = overlayRef.current?.getBoundingClientRect()
    if (!canvas || !rect) return null
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = Math.max(1, Math.floor(rect.width * dpr))
    const height = Math.max(1, Math.floor(rect.height * dpr))
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    const context = canvas.getContext('2d')
    if (!context) return null
    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    context.clearRect(0, 0, rect.width, rect.height)
    return { context, width: rect.width, height: rect.height }
  }, [])

  const clearDraftCanvas = useCallback(() => {
    const canvas = draftCanvasRef.current
    const rect = overlayRef.current?.getBoundingClientRect()
    const context = canvas?.getContext('2d')
    if (!canvas || !rect || !context) return
    context.clearRect(0, 0, rect.width, rect.height)
  }, [])

  const renderDraftOnCanvas = useCallback((interaction = interactionRef.current) => {
    if (!interaction) return
    const prepared = prepareDraftCanvas()
    if (!prepared) return
    const { context, width, height } = prepared

    if (interaction.kind === 'highlight') {
      const points = interaction.draft.points
      context.save()
      context.globalAlpha = 0.34
      context.globalCompositeOperation = 'multiply'
      context.strokeStyle = interaction.draft.color
      context.lineWidth = Math.max(4, width * interaction.draft.strokeWidthRatio)
      context.lineCap = 'round'
      context.lineJoin = 'round'
      pointsToCanvasPath(context, points, width, height)
      context.stroke()
      context.restore()
      return
    }

    const draft = interaction.draft
    const mode = draft.mode
    context.save()
    context.globalAlpha = mode === 'marker' ? Math.min(draft.opacity, 0.52) : draft.opacity
    context.strokeStyle = draft.color
    context.lineWidth = Math.max(1, width * draft.strokeWidthRatio)
    context.lineCap = 'round'
    context.lineJoin = 'round'
    if (mode === 'dash') context.setLineDash([8, 8])

    if (mode === 'circle') {
      const rect = normalizeRect(draft.start, draft.current, 0.025, 0.025)
      context.beginPath()
      context.ellipse(
        (rect.x + rect.width / 2) * width,
        (rect.y + rect.height / 2) * height,
        (rect.width / 2) * width,
        (rect.height / 2) * height,
        0,
        0,
        Math.PI * 2
      )
      context.stroke()
    } else if (mode === 'line' || mode === 'dash') {
      context.beginPath()
      context.moveTo(draft.start.x * width, draft.start.y * height)
      context.lineTo(draft.current.x * width, draft.current.y * height)
      context.stroke()
    } else {
      pointsToCanvasPath(context, draft.points, width, height)
      context.stroke()
    }
    context.restore()
  }, [prepareDraftCanvas])

  const scheduleDraftUpdate = useCallback(() => {
    if (rafRef.current) return
    rafRef.current = window.requestAnimationFrame(() => {
      renderDraftOnCanvas()
      rafRef.current = null
    })
  }, [renderDraftOnCanvas])

  // Caneta laser (estilo GoodNotes): desenha um traço luminoso que some sozinho
  // pouco depois. Nada é salvo — é só para apontar durante a leitura. Um loop de
  // animação próprio mantém o efeito de rastro/desvanecimento após soltar.
  const renderLaser = useCallback(() => {
    const canvas = laserCanvasRef.current
    const rect = overlayRef.current?.getBoundingClientRect()
    if (!canvas || !rect) {
      laserRafRef.current = null
      return
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const pixelWidth = Math.max(1, Math.floor(rect.width * dpr))
    const pixelHeight = Math.max(1, Math.floor(rect.height * dpr))
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth
      canvas.height = pixelHeight
    }
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    const context = canvas.getContext('2d')
    if (!context) {
      laserRafRef.current = null
      return
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    context.clearRect(0, 0, rect.width, rect.height)

    const now = performance.now()
    const width = rect.width
    const height = rect.height
    const strokes = laserStrokesRef.current
    let alive = false

    context.lineCap = 'round'
    context.lineJoin = 'round'

    for (const stroke of strokes) {
      const points = stroke.points
      // Descarta a "cauda" já expirada, criando o rastro que segue o cursor.
      while (points.length && now - points[0].t > LASER_FADE_MS) points.shift()
      if (points.length) alive = true

      // Brilho externo.
      context.shadowColor = laserColor
      context.shadowBlur = 16
      for (let index = 1; index < points.length; index++) {
        const previous = points[index - 1]
        const current = points[index]
        const alpha = Math.max(0, 1 - (now - current.t) / LASER_FADE_MS)
        if (alpha <= 0) continue
        context.globalAlpha = alpha * 0.55
        context.strokeStyle = laserColor
        context.lineWidth = 9
        context.beginPath()
        context.moveTo(previous.x * width, previous.y * height)
        context.lineTo(current.x * width, current.y * height)
        context.stroke()
      }

      // Núcleo branco brilhante.
      context.shadowBlur = 0
      for (let index = 1; index < points.length; index++) {
        const previous = points[index - 1]
        const current = points[index]
        const alpha = Math.max(0, 1 - (now - current.t) / LASER_FADE_MS)
        if (alpha <= 0) continue
        context.globalAlpha = alpha
        context.strokeStyle = '#ffffff'
        context.lineWidth = 2.5
        context.beginPath()
        context.moveTo(previous.x * width, previous.y * height)
        context.lineTo(current.x * width, current.y * height)
        context.stroke()
      }
    }

    context.globalAlpha = 1
    context.shadowBlur = 0
    laserStrokesRef.current = strokes.filter((stroke) => stroke.points.length > 0)

    if (alive || laserDrawingRef.current) {
      laserRafRef.current = window.requestAnimationFrame(renderLaser)
    } else {
      context.clearRect(0, 0, rect.width, rect.height)
      laserRafRef.current = null
    }
  }, [laserColor])

  const ensureLaserLoop = useCallback(() => {
    if (laserRafRef.current == null) {
      laserRafRef.current = window.requestAnimationFrame(renderLaser)
    }
  }, [renderLaser])

  const addDrawingPoint = useCallback((point: PdfPoint) => {
    const interaction = interactionRef.current
    if (!interaction || interaction.kind !== 'drawing') return
    const points = interaction.draft.points
    const last = points[points.length - 1]
    const minStep = interaction.draft.mode === 'marker' ? 0.0024 : 0.0014
    if (last && distance(last, point) < minStep) return
    points.push(point)
    interaction.draft.current = point
  }, [])

  const finishDrawing = useCallback(() => {
    const interaction = interactionRef.current
    if (!interaction || interaction.kind !== 'drawing') return
    const draft = interaction.draft
    const durationMs = performance.now() - interaction.startedAt
    const resolvedMode = resolveDrawingMode(draft, durationMs)

    interactionRef.current = null
    clearDraftCanvas()

    const points = draft.points
    if (resolvedMode === 'circle') {
      const rect = draft.mode === 'circle'
        ? normalizeRect(draft.start, draft.current, 0.025, 0.025)
        : getPointBounds(points)
      if (rect.width < 0.015 || rect.height < 0.015) return
      onCreateAnnotation({
        pageNumber,
        type: 'drawing',
        content: 'Circulo',
        color: draft.color,
        position: rect,
        data: { drawingMode: 'circle', strokeWidthRatio: draft.strokeWidthRatio, opacity: draft.opacity },
      })
      return
    }

    if (resolvedMode === 'line' || resolvedMode === 'dash') {
      if (distance(draft.start, draft.current) < 0.01) return
      onCreateAnnotation({
        pageNumber,
        type: 'drawing',
        content: resolvedMode === 'dash' ? 'Linha tracejada' : 'Linha',
        color: draft.color,
        position: { points: [draft.start, draft.current] },
        data: { drawingMode: resolvedMode, strokeWidthRatio: draft.strokeWidthRatio, opacity: draft.opacity },
      })
      return
    }

    if (points.length < 3) return
    onCreateAnnotation({
      pageNumber,
      type: 'drawing',
      content: draft.mode === 'marker' ? 'Pincel' : 'Caneta',
      color: draft.color,
      position: { points },
      data: { drawingMode: draft.mode, strokeWidthRatio: draft.strokeWidthRatio, opacity: draft.opacity },
    })
  }, [clearDraftCanvas, onCreateAnnotation, pageNumber])

  const finishHighlight = useCallback(() => {
    const interaction = interactionRef.current
    if (!interaction || interaction.kind !== 'highlight') return
    interactionRef.current = null
    clearDraftCanvas()
    const points = interaction.draft.points
    const moved = distance(interaction.draft.start, interaction.draft.current)
    const position = points.length < 2 || moved < 0.01
      ? normalizeRect(interaction.draft.start, {
          x: Math.min(1, interaction.draft.start.x + 0.22),
          y: interaction.draft.start.y,
        }, 0.18, 0.028)
      : { points }
    onCreateAnnotation({
      pageNumber,
      type: 'highlight',
      content: 'Marca texto',
      color: interaction.draft.color,
      position,
      data: { opacity: 0.34, strokeWidthRatio: interaction.draft.strokeWidthRatio },
    })
  }, [clearDraftCanvas, onCreateAnnotation, pageNumber])

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!renderSize || editor) return
    if (event.button !== 0 && event.pointerType !== 'touch' && event.pointerType !== 'pen') return

    if (tool === 'laser') {
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      const point = getPosition(event.clientX, event.clientY)
      laserDrawingRef.current = true
      laserPointerIdRef.current = event.pointerId
      laserStrokesRef.current.push({ points: [{ x: point.x, y: point.y, t: performance.now() }] })
      ensureLaserLoop()
      setSelectedId(null)
      return
    }

    if (tool === 'drawing') {
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      const point = getPosition(event.clientX, event.clientY)
      const rect = overlayRef.current?.getBoundingClientRect()
      const widthRatio = drawingStyle.width / Math.max(rect?.width || 1, 1)
      clearDraftCanvas()
      interactionRef.current = {
        kind: 'drawing',
        startedAt: performance.now(),
        pointerId: event.pointerId,
        draft: {
          points: [point],
          mode: drawingStyle.mode,
          color: drawingStyle.color,
          strokeWidthRatio: widthRatio,
          opacity: drawingStyle.opacity,
          start: point,
          current: point,
          autoShape: drawingStyle.holdToShape,
        },
      }
      renderDraftOnCanvas(interactionRef.current)
      setSelectedId(null)
      return
    }

    if (tool === 'highlight') {
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      const point = getPosition(event.clientX, event.clientY)
      const rect = overlayRef.current?.getBoundingClientRect()
      clearDraftCanvas()
      interactionRef.current = {
        kind: 'highlight',
        pointerId: event.pointerId,
        draft: {
          start: point,
          current: point,
          points: [point],
          strokeWidthRatio: highlightWidth / Math.max(rect?.width || 1, 1),
          color: highlightColor,
        },
      }
      renderDraftOnCanvas(interactionRef.current)
      setSelectedId(null)
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (tool === 'laser' && laserDrawingRef.current) {
      event.preventDefault()
      const stroke = laserStrokesRef.current[laserStrokesRef.current.length - 1]
      if (stroke) {
        const native = event.nativeEvent as PointerEvent & { getCoalescedEvents?: () => PointerEvent[] }
        const events = native.getCoalescedEvents?.() || [native]
        const now = performance.now()
        for (const pointerEvent of events) {
          const point = getPosition(pointerEvent.clientX, pointerEvent.clientY)
          const last = stroke.points[stroke.points.length - 1]
          if (last && distance(last, point) < 0.0012) continue
          stroke.points.push({ x: point.x, y: point.y, t: now })
        }
      }
      ensureLaserLoop()
      return
    }

    const interaction = interactionRef.current
    if (!interaction) return
    event.preventDefault()

    if (interaction.kind === 'drawing') {
      const native = event.nativeEvent as PointerEvent & { getCoalescedEvents?: () => PointerEvent[] }
      const events = native.getCoalescedEvents?.() || [native]
      for (const pointerEvent of events) {
        addDrawingPoint(getPosition(pointerEvent.clientX, pointerEvent.clientY))
      }
      scheduleDraftUpdate()
      return
    }

    const point = getPosition(event.clientX, event.clientY)
    interaction.draft.current = point
    const points = interaction.draft.points
    const last = points[points.length - 1]
    if (!last || distance(last, point) >= 0.0015) points.push(point)
    scheduleDraftUpdate()
  }

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (laserDrawingRef.current && (laserPointerIdRef.current === null || laserPointerIdRef.current === event.pointerId)) {
      event.preventDefault()
      laserDrawingRef.current = false
      laserPointerIdRef.current = null
      try { event.currentTarget.releasePointerCapture(event.pointerId) } catch {}
      ignoreNextClickRef.current = true
      window.setTimeout(() => { ignoreNextClickRef.current = false }, 0)
      ensureLaserLoop()
      return
    }

    const interaction = interactionRef.current
    if (!interaction) return
    event.preventDefault()
    ignoreNextClickRef.current = true
    window.setTimeout(() => { ignoreNextClickRef.current = false }, 0)
    try {
      event.currentTarget.releasePointerCapture(interaction.pointerId)
    } catch {}
    if (interaction.kind === 'drawing') finishDrawing()
    if (interaction.kind === 'highlight') finishHighlight()
  }

  const openTextEditor = (point: PdfPoint, annotation?: PdfAnnotation) => {
    setSelectedId(annotation?.id || null)
    setEditor({
      kind: 'text',
      point,
      annotation,
      content: annotation?.content || '',
      textStyle: {
        fontFamily: annotation?.data?.fontFamily || textStyle.fontFamily,
        fontSize: annotation?.data?.fontSize || textStyle.fontSize,
        color: annotation?.color || textStyle.color,
        bold: annotation?.data?.bold ?? textStyle.bold,
        italic: annotation?.data?.italic ?? textStyle.italic,
        underline: annotation?.data?.underline ?? textStyle.underline,
        align: annotation?.data?.align || textStyle.align,
      },
      noteColor,
    })
  }

  const openNoteEditor = (point: PdfPoint, annotation?: PdfAnnotation) => {
    setSelectedId(annotation?.id || null)
    setEditor({
      kind: 'note',
      point,
      annotation,
      content: annotation?.content || '',
      textStyle,
      noteColor: annotation?.color || annotation?.data?.noteColor || noteColor,
    })
  }

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (ignoreNextClickRef.current || editor) {
      ignoreNextClickRef.current = false
      return
    }
    if (tool === 'cursor' || tool === 'drawing' || tool === 'highlight' || tool === 'eraser' || tool === 'laser') {
      setSelectedId(null)
      return
    }

    const point = getPosition(event.clientX, event.clientY)
    if (tool === 'note') {
      openNoteEditor(point)
      return
    }
    if (tool === 'text') {
      openTextEditor(point)
      return
    }
    if (tool === 'bookmark') {
      onCreateAnnotation({
        pageNumber,
        type: 'bookmark',
        content: 'Marcador',
        color: '#10b981',
        position: { x: point.x, y: point.y, width: 0.05, height: 0.08 },
      })
    }
  }

  const saveEditor = (next: EditorState) => {
    const content = next.content.trim()
    if (!content) {
      setEditor(null)
      return
    }

    if (next.kind === 'note') {
      const patch = {
        pageNumber,
        type: 'note' as AnnotationType,
        content,
        color: next.noteColor,
        position: next.annotation?.position || { x: next.point.x, y: next.point.y, width: 0.11, height: 0.08 },
        data: { noteColor: next.noteColor },
      }
      if (next.annotation) onUpdateAnnotation(next.annotation, patch)
      else onCreateAnnotation(patch)
      setEditor(null)
      return
    }

    const lineCount = Math.max(1, content.split('\n').length)
    const textWidth = Math.min(0.52, Math.max(0.2, Math.min(36, content.length) * 0.009 + 0.1))
    const textHeight = Math.min(0.24, Math.max(0.045, lineCount * (next.textStyle.fontSize / 740) + 0.025))
    const patch = {
      pageNumber,
      type: 'text' as AnnotationType,
      content,
      color: next.textStyle.color,
      position: next.annotation?.position || { x: next.point.x, y: next.point.y, width: textWidth, height: textHeight },
      data: {
        fontFamily: next.textStyle.fontFamily,
        fontSize: next.textStyle.fontSize,
        bold: next.textStyle.bold,
        italic: next.textStyle.italic,
        underline: next.textStyle.underline,
        align: next.textStyle.align,
      },
    }
    if (next.annotation) onUpdateAnnotation(next.annotation, patch)
    else onCreateAnnotation(patch)
    setEditor(null)
  }

  const selectedAnnotation = selectedId ? annotations.find((annotation) => annotation.id === selectedId) || null : null
  const annotationPointerEvents = tool === 'drawing' || tool === 'highlight' || tool === 'laser' ? 'none' : 'auto'

  return (
    <div
      id={`pdf-page-${pageNumber}`}
      ref={wrapperRef}
      data-pdf-page-row="true"
      // A linha de cada página é o container de rolagem horizontal. Sem isso a
      // moldura era clampada em `max-w-full` e ampliar o zoom não mudava nada.
      // `justify-center` num container com overflow deixa a borda esquerda
      // inalcançável (armadilha clássica do flexbox), por isso alternamos para
      // `flex-start` quando a página passa da largura disponível.
      className="pdf-page-fade flex w-full scroll-mt-36 overflow-x-auto px-0 sm:px-2"
      style={{ justifyContent: overflowing ? 'flex-start' : 'center' }}
    >
      <div
        // Sem `backdrop-blur`: o blur fica atrás de um canvas opaco, ou seja,
        // não aparece — mas o navegador recalcula a camada desfocada a cada
        // quadro de pinça e de rolagem. Num celular isso é caro de graça.
        className="relative shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/10 p-2 shadow-2xl shadow-black/35"
        style={{ width: frameOuterWidth }}
      >
        <div className="absolute left-3 top-3 z-10 rounded-lg border border-zinc-200/30 bg-zinc-950/65 px-2 py-1 text-[11px] font-semibold text-zinc-50 backdrop-blur-md">
          Pag. {pageNumber}
        </div>
        <canvas
          ref={canvasRef}
          className="block h-auto w-full rounded-lg bg-white"
          style={{ aspectRatio: `${Math.max(1, pageFrameSize.width)} / ${Math.max(1, pageFrameSize.height)}` }}
        />
        {/* Só na PRIMEIRA pintura. Antes a condição incluía `loading`, que o
            efeito de rasterização liga a cada mudança de escala — resultado:
            um flash branco com spinner por cima da página já desenhada a cada
            passo de zoom. Com o render em offscreen, re-rasterizar não precisa
            mais esconder nada. */}
        {!renderSize && (visible || active) && (
          <div className="absolute inset-2 rounded-lg bg-white/90 flex items-center justify-center">
            <div className="h-7 w-7 rounded-full border-2 border-emerald-700/20 border-t-emerald-700 animate-spin" />
          </div>
        )}
        {/* Rate limit não é erro do leitor: a página volta sozinha. Mostramos
            uma espera calma em vez do cartão vermelho de falha. */}
        {error && waitSeconds > 0 && (
          <div className="absolute inset-2 z-20 flex flex-col items-center justify-center gap-2 rounded-lg bg-amber-950/85 p-6 text-center text-sm text-white">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-200/30 border-t-amber-200" />
            <span className="font-semibold">Muitas páginas de uma vez</span>
            <span className="text-xs text-white/75">
              Retomando em {waitSeconds}s — não precisa fazer nada.
            </span>
          </div>
        )}
        {error && waitSeconds <= 0 && (
          <div className="absolute inset-2 z-20 rounded-lg bg-rose-950/85 flex flex-col items-center justify-center gap-3 p-6 text-center text-sm text-white">
            <span>{error}</span>
            <Button onClick={retryLoad} className="h-8 rounded-xl bg-white/15 px-3 text-xs text-white hover:bg-white/25">
              Tentar novamente
            </Button>
          </div>
        )}
        {!error && renderSize && (
          <div
            ref={overlayRef}
            className="absolute inset-2 rounded-lg"
            onClick={handleOverlayClick}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            style={{
              cursor: tool === 'cursor' ? 'default' : tool === 'eraser' ? ERASER_CURSOR : (tool === 'drawing' || tool === 'laser') ? 'crosshair' : 'copy',
              touchAction: tool === 'drawing' || tool === 'highlight' || tool === 'laser' ? 'none' : 'manipulation',
            }}
          >
            <canvas ref={draftCanvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />
            <AnnotationOverlay
              annotations={annotations}
              selectedAnnotation={selectedAnnotation}
              tool={tool}
              pointerEvents={annotationPointerEvents}
              onSelect={(annotation) => setSelectedId(annotation.id)}
              onEdit={(annotation) => {
                const bounds = getAnnotationBounds(annotation)
                if (annotation.type === 'text') openTextEditor({ x: bounds.x, y: bounds.y }, annotation)
                if (annotation.type === 'note') openNoteEditor({ x: bounds.x, y: bounds.y }, annotation)
              }}
              onDelete={onDeleteAnnotation}
            />
            {editor && (
              <InlineAnnotationEditor
                editor={editor}
                onChange={setEditor}
                onCancel={() => setEditor(null)}
                onSave={saveEditor}
              />
            )}
            <canvas ref={laserCanvasRef} className="absolute inset-0 z-40 h-full w-full pointer-events-none" />
          </div>
        )}
      </div>
    </div>
  )
})

function AnnotationOverlay({
  annotations,
  selectedAnnotation,
  tool,
  pointerEvents,
  onSelect,
  onEdit,
  onDelete,
}: {
  annotations: PdfAnnotation[]
  selectedAnnotation: PdfAnnotation | null
  tool: AnnotationTool
  pointerEvents: 'none' | 'auto'
  onSelect: (annotation: PdfAnnotation) => void
  onEdit: (annotation: PdfAnnotation) => void
  onDelete: (annotation: PdfAnnotation) => void
}) {
  return (
    <>
      {annotations.map((annotation) => (
        <AnnotationItem
          key={annotation.id}
          annotation={annotation}
          selected={selectedAnnotation?.id === annotation.id}
          tool={tool}
          pointerEvents={pointerEvents}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
      {selectedAnnotation && (
        <AnnotationActionBar
          annotation={selectedAnnotation}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </>
  )
}

function AnnotationItem({
  annotation,
  selected,
  tool,
  pointerEvents,
  onSelect,
  onEdit,
  onDelete,
}: {
  annotation: PdfAnnotation
  selected: boolean
  tool: AnnotationTool
  pointerEvents: 'none' | 'auto'
  onSelect: (annotation: PdfAnnotation) => void
  onEdit: (annotation: PdfAnnotation) => void
  onDelete: (annotation: PdfAnnotation) => void
}) {
  const position = annotation.position || {}
  const bounds = getAnnotationBounds(annotation)
  const sharedHandlers = {
    onPointerDown: (event: React.PointerEvent) => event.stopPropagation(),
    onClick: (event: React.MouseEvent) => {
      event.stopPropagation()
      if (tool === 'eraser') {
        onDelete(annotation)
        return
      }
      if ((annotation.type === 'text' || annotation.type === 'note') && event.detail >= 2) {
        onEdit(annotation)
        return
      }
      onSelect(annotation)
    },
  }

  if (annotation.type === 'drawing') {
    return (
      <>
        <DrawingLayer annotation={annotation} />
        <button
          type="button"
          aria-label="Selecionar desenho"
          className={`absolute rounded-md ${selected ? 'border border-emerald-400/80 ring-2 ring-emerald-300/50' : ''}`}
          style={{
            pointerEvents,
            left: `${bounds.x * 100}%`,
            top: `${bounds.y * 100}%`,
            width: `${Math.max(bounds.width, 0.045) * 100}%`,
            height: `${Math.max(bounds.height, 0.045) * 100}%`,
            background: 'transparent',
          }}
          {...sharedHandlers}
        />
      </>
    )
  }

  if (annotation.type === 'highlight') {
    if (position.points?.length) {
      return (
        <>
          <HighlightLayer annotation={annotation} />
          <button
            type="button"
            title="Marca texto"
            className={`absolute rounded-md ${selected ? 'border border-emerald-400/80 ring-2 ring-emerald-300/50' : ''}`}
            style={{
              pointerEvents,
              left: `${bounds.x * 100}%`,
              top: `${bounds.y * 100}%`,
              width: `${Math.max(bounds.width, 0.08) * 100}%`,
              height: `${Math.max(bounds.height, 0.035) * 100}%`,
              background: 'transparent',
            }}
            {...sharedHandlers}
          />
        </>
      )
    }

    return (
      <button
        type="button"
        title="Marca texto"
        className={`absolute rounded-md border transition-colors ${
          selected ? 'border-emerald-400/90 ring-2 ring-emerald-300/50' : 'border-yellow-500/20'
        }`}
        style={{
          pointerEvents,
          left: `${(position.x || 0) * 100}%`,
          top: `${(position.y || 0) * 100}%`,
          width: `${(position.width || 0.08) * 100}%`,
          height: `${(position.height || 0.035) * 100}%`,
          backgroundColor: annotation.color || '#facc15',
          opacity: annotation.data?.opacity || 0.34,
          mixBlendMode: 'multiply',
        }}
        {...sharedHandlers}
      />
    )
  }

  if (annotation.type === 'note') {
    return (
      <button
        type="button"
        className={`absolute flex min-h-9 min-w-9 -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-xl border px-2 py-1 text-left text-[11px] font-semibold text-zinc-900 shadow-lg transition-transform ${
          selected ? 'scale-105 border-emerald-500 ring-2 ring-emerald-300/60' : 'border-amber-500/40'
        }`}
        style={{
          pointerEvents,
          left: `${(position.x || 0) * 100}%`,
          top: `${(position.y || 0) * 100}%`,
          backgroundColor: annotation.color || annotation.data?.noteColor || '#fde68a',
          maxWidth: '13rem',
        }}
        title={annotation.content}
        {...sharedHandlers}
      >
        <MessageSquare className="h-4 w-4 shrink-0" />
        <span className="hidden max-w-[9rem] truncate sm:inline">{annotation.content || 'Nota'}</span>
      </button>
    )
  }

  if (annotation.type === 'bookmark') {
    return (
      <button
        type="button"
        className={`absolute -translate-x-1/2 -translate-y-1/2 text-emerald-600 drop-shadow ${
          selected ? 'rounded-lg ring-2 ring-emerald-300/80' : ''
        }`}
        style={{
          pointerEvents,
          left: `${(position.x || 0) * 100}%`,
          top: `${(position.y || 0) * 100}%`,
        }}
        title="Marcador"
        {...sharedHandlers}
      >
        <Bookmark className="h-8 w-8 fill-emerald-400" />
      </button>
    )
  }

  const style = annotation.data || {}
  return (
    <button
      type="button"
      className={`absolute rounded-md border bg-white/75 px-2 py-1 text-left shadow-sm backdrop-blur-[1px] ${
        selected ? 'border-emerald-500 ring-2 ring-emerald-300/60' : 'border-zinc-900/15'
      }`}
      style={{
        pointerEvents,
        left: `${bounds.x * 100}%`,
        top: `${bounds.y * 100}%`,
        width: `${bounds.width * 100}%`,
        minHeight: `${bounds.height * 100}%`,
        color: annotation.color || '#111827',
        fontFamily: style.fontFamily || 'Inter',
        fontSize: `${style.fontSize || 16}px`,
        fontWeight: style.bold ? 800 : 500,
        fontStyle: style.italic ? 'italic' : 'normal',
        textDecoration: style.underline ? 'underline' : 'none',
        textAlign: style.align || 'left',
        lineHeight: 1.22,
        whiteSpace: 'pre-wrap',
      }}
      title="Duplo toque para editar"
      {...sharedHandlers}
    >
      {annotation.content}
    </button>
  )
}

function HighlightLayer({ annotation }: { annotation: PdfAnnotation }) {
  const points = annotation.position.points || []
  if (points.length < 2) return null
  const strokeWidth = `${((annotation.data?.strokeWidthRatio || 0.018) * 100).toFixed(3)}`
  return (
    <svg className="absolute inset-0 h-full w-full overflow-visible pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path
        d={pointsToSvgPath(points)}
        fill="none"
        stroke={annotation.color || '#facc15'}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={annotation.data?.opacity || 0.34}
        style={{ mixBlendMode: 'multiply' }}
      />
    </svg>
  )
}

function DrawingLayer({ annotation, isDraft }: { annotation: PdfAnnotation; isDraft?: boolean }) {
  const points = annotation.position.points || []
  const mode = annotation.data?.drawingMode || 'free'
  const strokeWidth = `${((annotation.data?.strokeWidthRatio || 0.0048) * 100).toFixed(3)}`
  const opacity = annotation.data?.opacity ?? (mode === 'marker' ? 0.45 : 0.88)
  const dashArray = mode === 'dash' ? '3 3' : undefined
  const common = {
    fill: 'none',
    stroke: annotation.color || '#22c55e',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    opacity: isDraft ? Math.min(1, opacity + 0.08) : opacity,
  }

  if (mode === 'circle') {
    const bounds = getAnnotationBounds(annotation)
    return (
      <svg className="absolute inset-0 h-full w-full overflow-visible pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <ellipse
          cx={(bounds.x + bounds.width / 2) * 100}
          cy={(bounds.y + bounds.height / 2) * 100}
          rx={(bounds.width / 2) * 100}
          ry={(bounds.height / 2) * 100}
          {...common}
        />
      </svg>
    )
  }

  if (points.length < 2) return null
  return (
    <svg className="absolute inset-0 h-full w-full overflow-visible pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path d={pointsToSvgPath(points)} strokeDasharray={dashArray} {...common} />
    </svg>
  )
}

function AnnotationActionBar({
  annotation,
  onEdit,
  onDelete,
}: {
  annotation: PdfAnnotation
  onEdit: (annotation: PdfAnnotation) => void
  onDelete: (annotation: PdfAnnotation) => void
}) {
  const bounds = getAnnotationBounds(annotation)
  const left = Math.min(0.86, Math.max(0.04, bounds.x + bounds.width))
  const top = Math.max(0.02, bounds.y - 0.055)
  const canEdit = annotation.type === 'text' || annotation.type === 'note'

  return (
    <div
      className="absolute z-30 flex items-center gap-1 rounded-xl border border-zinc-900/15 bg-zinc-950/90 p-1 text-white shadow-xl backdrop-blur-md"
      style={{ left: `${left * 100}%`, top: `${top * 100}%`, transform: 'translateX(-100%)' }}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      {canEdit && (
        <button
          type="button"
          className="h-8 rounded-lg px-2 text-xs font-semibold hover:bg-white/10"
          onClick={() => onEdit(annotation)}
        >
          Editar
        </button>
      )}
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-200 hover:bg-rose-500/20 hover:text-rose-100"
        onClick={() => onDelete(annotation)}
        title="Apagar anotacao"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

function InlineAnnotationEditor({
  editor,
  onChange,
  onCancel,
  onSave,
}: {
  editor: EditorState
  onChange: (editor: EditorState) => void
  onCancel: () => void
  onSave: (editor: EditorState) => void
}) {
  const isRightSide = editor.point.x > 0.62
  const isLowerSide = editor.point.y > 0.68
  const isText = editor.kind === 'text'

  return (
    <div
      data-pdf-editor="true"
      className={`absolute z-40 text-zinc-950 shadow-xl ${
        isText
          ? 'w-[min(18rem,calc(100%-1rem))] rounded-md border border-emerald-500/70 bg-white/60 p-1 backdrop-blur-[1px]'
          : 'w-[min(17rem,calc(100%-1rem))] rounded-xl border border-amber-500/35 p-2'
      }`}
      style={{
        left: `${editor.point.x * 100}%`,
        top: `${editor.point.y * 100}%`,
        transform: `${isRightSide ? 'translateX(-100%)' : 'translateX(0)'} ${isLowerSide ? 'translateY(-100%)' : 'translateY(0)'}`,
        backgroundColor: isText ? 'rgba(255,255,255,0.62)' : editor.noteColor,
      }}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {!isText && (
        <div className="mb-2 flex items-center gap-1.5">
          {NOTE_SWATCHES.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange({ ...editor, noteColor: color })}
              className={`h-7 w-7 rounded-lg border ${editor.noteColor === color ? 'border-zinc-950 ring-2 ring-zinc-300' : 'border-zinc-200'}`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      )}

      <div className="absolute -right-1 -top-9 flex items-center gap-1 rounded-lg border border-zinc-900/10 bg-zinc-950/90 p-1 text-white shadow-lg">
        <button type="button" onClick={() => onSave(editor)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-emerald-500/25" title="Salvar">
          <Check className="h-4 w-4" />
        </button>
        <button type="button" onClick={onCancel} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/10" title="Fechar sem salvar">
          <X className="h-4 w-4" />
        </button>
      </div>

      <textarea
        autoFocus
        value={editor.content}
        onChange={(event) => onChange({ ...editor, content: event.target.value })}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onCancel()
          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') onSave(editor)
        }}
        placeholder={isText ? 'Digite aqui...' : 'Escreva sua nota...'}
        className={`w-full resize-none border-0 bg-transparent p-1 outline-none ${
          isText ? 'min-h-14' : 'min-h-24 rounded-lg bg-white/30'
        }`}
        style={isText ? {
          color: editor.textStyle.color,
          fontFamily: editor.textStyle.fontFamily,
          fontSize: editor.textStyle.fontSize,
          fontWeight: editor.textStyle.bold ? 800 : 500,
          fontStyle: editor.textStyle.italic ? 'italic' : 'normal',
          textDecoration: editor.textStyle.underline ? 'underline' : 'none',
          textAlign: editor.textStyle.align,
        } : {
          color: '#1f2937',
          fontSize: 14,
          lineHeight: 1.35,
        }}
      />
    </div>
  )
}

function ToolOptionsBar({
  tool,
  drawingStyle,
  onDrawingStyleChange,
  highlightColor,
  onHighlightColorChange,
  highlightWidth,
  onHighlightWidthChange,
  noteColor,
  onNoteColorChange,
  laserColor,
  onLaserColorChange,
  textStyle,
  onTextStyleChange,
}: {
  tool: AnnotationTool
  drawingStyle: DrawingStyle
  onDrawingStyleChange: (style: DrawingStyle) => void
  highlightColor: string
  onHighlightColorChange: (color: string) => void
  highlightWidth: number
  onHighlightWidthChange: (width: number) => void
  noteColor: string
  onNoteColorChange: (color: string) => void
  laserColor: string
  onLaserColorChange: (color: string) => void
  textStyle: TextStyle
  onTextStyleChange: (style: TextStyle) => void
}) {
  if (!['drawing', 'highlight', 'text', 'note', 'laser'].includes(tool)) return null

  return (
    <div className="mt-1 flex items-center gap-2 overflow-x-auto rounded-xl border border-white/10 bg-white/10 px-2 py-2">
      {tool === 'drawing' && (
        <>
          <div className="flex shrink-0 items-center gap-1">
            <MiniModeButton active={drawingStyle.mode === 'free'} onClick={() => onDrawingStyleChange({ ...drawingStyle, mode: 'free' })} title="Caneta livre">
              <PenLine className="h-4 w-4" />
            </MiniModeButton>
            <MiniModeButton active={drawingStyle.mode === 'marker'} onClick={() => onDrawingStyleChange({ ...drawingStyle, mode: 'marker', opacity: 0.45 })} title="Pincel marcador">
              <Brush className="h-4 w-4" />
            </MiniModeButton>
            <MiniModeButton active={drawingStyle.mode === 'line'} onClick={() => onDrawingStyleChange({ ...drawingStyle, mode: 'line' })} title="Linha reta">
              <Minus className="h-4 w-4" />
            </MiniModeButton>
            <MiniModeButton active={drawingStyle.mode === 'dash'} onClick={() => onDrawingStyleChange({ ...drawingStyle, mode: 'dash' })} title="Linha tracejada">
              <span className="h-px w-5 border-t-2 border-dashed border-current" />
            </MiniModeButton>
            <MiniModeButton active={drawingStyle.mode === 'circle'} onClick={() => onDrawingStyleChange({ ...drawingStyle, mode: 'circle' })} title="Circulo">
              <Circle className="h-4 w-4" />
            </MiniModeButton>
          </div>
          <ColorSwatches colors={COLOR_SWATCHES} value={drawingStyle.color} onChange={(color) => onDrawingStyleChange({ ...drawingStyle, color })} />
          <LabeledRange label="Grossura" min={1} max={18} value={drawingStyle.width} onChange={(value) => onDrawingStyleChange({ ...drawingStyle, width: value })} />
          <LabeledRange label="Opacidade" min={25} max={100} value={Math.round(drawingStyle.opacity * 100)} onChange={(value) => onDrawingStyleChange({ ...drawingStyle, opacity: value / 100 })} />
          <label className="flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-[11px] text-white/75">
            <input
              type="checkbox"
              checked={drawingStyle.holdToShape}
              onChange={(event) => onDrawingStyleChange({ ...drawingStyle, holdToShape: event.target.checked })}
              className="accent-emerald-400"
            />
            Segurar ajusta forma
          </label>
        </>
      )}

      {tool === 'highlight' && (
        <>
          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-white/75"><Highlighter className="h-4 w-4" /> Marca texto</span>
          <ColorSwatches colors={HIGHLIGHT_SWATCHES} value={highlightColor} onChange={onHighlightColorChange} />
          <LabeledRange label="Espessura" min={8} max={48} value={highlightWidth} onChange={onHighlightWidthChange} />
        </>
      )}

      {tool === 'note' && (
        <>
          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-white/75"><MessageSquare className="h-4 w-4" /> Nota</span>
          <ColorSwatches colors={NOTE_SWATCHES} value={noteColor} onChange={onNoteColorChange} />
        </>
      )}

      {tool === 'laser' && (
        <>
          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-white/75"><Zap className="h-4 w-4" /> Laser</span>
          <ColorSwatches colors={LASER_SWATCHES} value={laserColor} onChange={onLaserColorChange} />
          <span className="shrink-0 text-[11px] text-white/55">O traco brilha e some sozinho apos desenhar</span>
        </>
      )}

      {tool === 'text' && (
        <>
          <select
            value={textStyle.fontFamily}
            onChange={(event) => onTextStyleChange({ ...textStyle, fontFamily: event.target.value })}
            className="h-8 shrink-0 rounded-lg border border-white/10 bg-zinc-900 px-2 text-xs text-white outline-none"
          >
            {FONT_OPTIONS.map((font) => <option key={font} value={font}>{font}</option>)}
          </select>
          <LabeledRange label="Tamanho" min={10} max={34} value={textStyle.fontSize} onChange={(value) => onTextStyleChange({ ...textStyle, fontSize: value })} />
          <ColorSwatches colors={COLOR_SWATCHES} value={textStyle.color} onChange={(color) => onTextStyleChange({ ...textStyle, color })} />
          <MiniModeButton active={textStyle.bold} onClick={() => onTextStyleChange({ ...textStyle, bold: !textStyle.bold })} title="Negrito">
            <Bold className="h-4 w-4" />
          </MiniModeButton>
          <MiniModeButton active={textStyle.italic} onClick={() => onTextStyleChange({ ...textStyle, italic: !textStyle.italic })} title="Italico">
            <Italic className="h-4 w-4" />
          </MiniModeButton>
          <MiniModeButton active={textStyle.underline} onClick={() => onTextStyleChange({ ...textStyle, underline: !textStyle.underline })} title="Sublinhado">
            <Underline className="h-4 w-4" />
          </MiniModeButton>
        </>
      )}
    </div>
  )
}

function ColorSwatches({ colors, value, onChange }: { colors: string[]; value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Palette className="h-4 w-4 text-white/55" />
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`h-7 w-7 rounded-lg border ${value === color ? 'border-white ring-2 ring-white/40' : 'border-white/20'}`}
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-7 w-8 rounded-lg border border-white/20 bg-transparent p-0.5"
        title="Cor personalizada"
      />
    </div>
  )
}

function LabeledRange({ label, min, max, value, onChange }: { label: string; min: number; max: number; value: number; onChange: (value: number) => void }) {
  return (
    <label className="flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-[11px] text-white/75">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-24 accent-emerald-400"
      />
      <span className="min-w-6 text-right text-white/85">{value}</span>
    </label>
  )
}

function MiniModeButton({ active, onClick, title, children }: { active: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-white transition-colors ${
        active ? 'border-emerald-300/60 bg-emerald-400/25' : 'border-white/10 bg-white/10 hover:bg-white/15'
      }`}
    >
      {children}
    </button>
  )
}

const AnnotationsPanel = memo(function AnnotationsPanel({
  annotations,
  currentPage,
  showGuide,
  onGoTo,
  onDelete,
  onDeleteAll,
}: {
  annotations: PdfAnnotation[]
  currentPage: number
  showGuide: boolean
  onGoTo: (page: number) => void
  onDelete: (annotation: PdfAnnotation) => void
  onDeleteAll: () => void
}) {
  return (
    <aside
      // Sem `backdrop-blur` (mesmo motivo da coluna de navegação) e com a
      // rolagem contida: no celular este painel fica logo abaixo das páginas, e
      // a inércia ao chegar no fim da lista continuava no documento.
      className="overflow-y-auto border-t border-white/10 bg-black/30 p-3 lg:sticky lg:top-[132px] lg:col-start-3 lg:h-[calc(100vh-132px)] lg:border-l lg:border-t-0"
      style={{ overscrollBehavior: 'contain' }}
    >
      {showGuide && <ToolGuide />}

      <div className="mb-3 mt-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-white">Anotacoes</h2>
          <p className="text-[11px] text-white/55">{annotations.length} privadas neste material</p>
        </div>
        <Button onClick={onDeleteAll} disabled={!annotations.length} size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-white/70 hover:bg-white/10 hover:text-white" title="Deletar todas">
          <Eraser className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {annotations.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
            Use uma ferramenta e toque no PDF para criar sua primeira anotacao.
          </div>
        ) : (
          annotations.map((annotation) => (
            <div
              key={annotation.id}
              className={`rounded-xl border p-3 transition-colors ${
                annotation.pageNumber === currentPage
                  ? 'border-emerald-300/50 bg-emerald-400/15'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <button onClick={() => onGoTo(annotation.pageNumber)} className="w-full text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-emerald-100">Pagina {annotation.pageNumber}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/65">{annotationLabel(annotation.type)}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-white/75">{annotation.content || 'Sem texto'}</p>
              </button>
              <div className="mt-2 flex justify-end">
                <Button onClick={() => onDelete(annotation)} variant="ghost" className="h-8 rounded-lg px-2 text-xs text-rose-200 hover:bg-rose-500/20 hover:text-rose-100">
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Apagar
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  )
})

function ToolGuide() {
  const guideItems = [
    { icon: <MousePointer2 className="h-4 w-4" />, title: 'Navegar', text: 'Move pelo PDF, seleciona anotacoes e abre editar com duplo toque em textos e notas. No celular e no tablet, deslize o dedo para o lado (ou para cima e para baixo, no modo uma pagina por vez) para virar a pagina.' },
    { icon: <Highlighter className="h-4 w-4" />, title: 'Marca texto', text: 'Arraste para grifar uma area. Um toque cria um grifo rapido na linha.' },
    { icon: <PenLine className="h-4 w-4" />, title: 'Caneta', text: 'Desenhe com mouse, dedo ou Apple Pencil. Escolha cor, grossura, pincel, linha, tracejado ou circulo.' },
    { icon: <Zap className="h-4 w-4" />, title: 'Caneta laser', text: 'Aponte durante a leitura: o traco brilha e some sozinho, como um laser. Nao fica salvo.' },
    { icon: <Type className="h-4 w-4" />, title: 'Texto', text: 'Toque no PDF e escreva direto na pagina com fonte, tamanho, cor, negrito, italico e sublinhado.' },
    { icon: <MessageSquare className="h-4 w-4" />, title: 'Nota', text: 'Cria um post-it visual com cores. Toque duas vezes na nota para editar.' },
    { icon: <Eraser className="h-4 w-4" />, title: 'Apagar', text: 'Ative e toque em qualquer anotacao para remover individualmente, ou use o botao do painel.' },
  ]

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="mb-2 flex items-center gap-2">
        <HelpCircle className="h-4 w-4 text-emerald-200" />
        <h2 className="text-sm font-semibold text-white">Guia rapido</h2>
      </div>
      <div className="space-y-2">
        {guideItems.map((item) => (
          <div key={item.title} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-2 rounded-lg bg-black/10 p-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-emerald-100">
              {item.icon}
            </div>
            <div>
              <p className="text-xs font-semibold text-white">{item.title}</p>
              <p className="text-[11px] leading-snug text-white/60">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// Folha inferior do celular. O projeto não tem primitivo de Sheet/Drawer em
// components/ui (nem Radix instalado para isso), então seguimos o mesmo
// desenho do drawer lateral que já existia aqui: backdrop clicável, painel
// preso à borda, respeito à safe-area do PWA.
function ViewerSheet({
  open,
  title,
  onClose,
  children,
  tall,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  tall?: boolean
}) {
  // Esc fecha — no tablet com teclado é o reflexo natural.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label={title}>
      {/* Sem `backdrop-blur`: o véu cobre a tela inteira e o que está atrás dele
          é o material — canvas que termina de rasterizar, página que rola. Cada
          mudança ali obriga o Safari do iOS a reborrar a tela toda, no mesmo
          quadro em que o dedo está arrastando a lista da folha. Um preto mais
          fechado dá o mesmo recuo visual de graça.
          `touch-action: none`: arrastar no véu não deve rolar o material que
          está atrás — sem isso, o gesto vazava para o documento, trocava a
          página atual e disparava a re-renderização do leitor inteiro por baixo
          da folha aberta. */}
      <div
        className="absolute inset-0 bg-black/75"
        style={{ touchAction: 'none' }}
        onClick={onClose}
      />
      {/* Altura em PORCENTAGEM do véu (que é `fixed inset-0`), não em `vh`. No
          Safari do iOS `vh` mede o viewport GRANDE — o de barras escondidas —
          então `78vh` com a barra à mostra empurrava o topo da folha para fora
          da tela e comia as primeiras seções do sumário. A porcentagem resolve
          contra a área realmente visível, sem depender de `dvh`.
          `translateZ(0)`: camada própria de composição, para rolar a lista não
          repintar o material atrás (mesmo motivo da barra inferior).
          Fundo opaco: `bg-zinc-950/97` não gerava regra (fora da escala de
          opacidade do Tailwind) e a folha aparecia transparente por cima da
          página. O padding usa max() porque `.pwa-safe-bottom` aplica env()
          puro, que vale 0 em aparelho sem notch. */}
      <div
        className={`absolute inset-x-0 bottom-0 flex flex-col rounded-t-2xl border-t border-white/15 bg-zinc-950 shadow-2xl ${
          tall ? 'h-[78%]' : 'max-h-[85%]'
        }`}
        style={{
          paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-bold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Folha `tall` = o filho (o painel de navegação) tem a própria área de
            rolagem. Dois contêineres roláveis aninhados no iOS é o clássico
            "a lista trava e depois anda sozinha": o toque começa no de dentro,
            e ao chegar no fim a inércia é entregue ao de fora e daí ao
            documento. Aqui o de fora não rola.
            `overscroll-behavior: contain` no que rola: a rolagem por inércia
            para na borda da lista em vez de continuar no material atrás. */}
        <div
          className={`min-h-0 flex-1 p-4 ${tall ? 'overflow-hidden' : 'overflow-y-auto'}`}
          style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

// Diálogo simples do leitor, no mesmo desenho do ConfirmDialog que já existia
// aqui (o Dialog de components/ui não tem trap de foco nem Esc, e o leitor é
// tela escura própria — não vale arrastar o primitivo genérico para cá).
function ViewerDialog({
  title,
  onClose,
  children,
  wide,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className={`max-h-[85vh] w-full overflow-y-auto rounded-2xl border border-white/15 bg-zinc-950 p-4 text-white shadow-2xl ${wide ? 'max-w-lg' : 'max-w-sm'}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  const groups: Array<{ title: string; items: Array<[string, string]> }> = [
    {
      title: 'Navegar',
      items: [
        ['→  ou  Page Down', 'Próxima página'],
        ['←  ou  Page Up', 'Página anterior'],
        ['Home', 'Primeira página'],
        ['End', 'Última página'],
        ['T', 'Abrir as miniaturas'],
        ['S', 'Abrir o sumário'],
      ],
    },
    {
      title: 'Ver',
      items: [
        ['+  /  −', 'Aumentar / diminuir o tamanho'],
        ['0', 'Ajustar a página à tela'],
        ['F', 'Tela cheia'],
        ['1  /  2  /  3', 'Rolagem contínua / uma página / largura'],
        ['?', 'Abrir esta lista'],
      ],
    },
  ]

  return (
    <ViewerDialog title="Atalhos do teclado" onClose={onClose} wide>
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-emerald-300/80">{group.title}</p>
            <div className="space-y-1">
              {group.items.map(([keys, description]) => (
                <div key={keys} className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-3 py-2">
                  <span className="shrink-0 font-clinical text-xs text-emerald-100">{keys}</span>
                  <span className="text-right text-xs text-white/65">{description}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <p className="text-[11px] text-white/40">
          No celular e no tablet: deslize o dedo para os lados para virar de página — e também para
          cima ou para baixo no modo &quot;uma página por vez&quot;, quando a página já chegou ao fim
          ou ao começo. Para aumentar a letra, use os botões de tamanho em &quot;Modo&quot;.
        </p>
      </div>
    </ViewerDialog>
  )
}

// Explicação para quando o download está desativado pelo admin. O objetivo é
// não deixar o leitor com a sensação de que faltou alguma coisa: dizer por que
// é assim e mostrar o que o leitor faz no lugar. Nada aqui promete acesso
// offline — o leitor precisa de internet, e afirmar o contrário seria mentira.
function DownloadInfoDialog({ onClose, timedAccess }: { onClose: () => void; timedAccess?: TimedAccessView | null }) {
  const points = [
    ['Continua de onde parou', 'Ao voltar, o material abre exatamente na página em que você estava.'],
    ['Suas marcas ficam salvas', 'Grifos, notas, desenhos e marcadores ficam na sua conta e aparecem em qualquer aparelho onde você entrar.'],
    ['Do jeito que enxerga melhor', 'Você escolhe o tamanho da letra e o modo de leitura, e o leitor lembra da sua preferência.'],
  ]

  return (
    <ViewerDialog title="Por que não posso baixar?" onClose={onClose} wide>
      {timedAccess?.isTimed && (
        <div className="mb-3 rounded-xl border border-sky-300/25 bg-sky-500/10 p-3">
          <p className="flex items-center gap-1.5 text-xs font-bold text-sky-200">
            <Clock className="h-3.5 w-3.5" />
            Você adquiriu {timedAccess.label || 'a versão por tempo limitado'}
            {timedAccess.durationLabel ? ` (${timedAccess.durationLabel})` : ''}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-white/70">
            Essa modalidade dá leitura completa aqui no leitor até{' '}
            <strong className="text-white">{timedAccess.expiresAtLabel || 'o fim do prazo'}</strong>, sem download.
            Para ficar com o material para sempre, adquira o acesso vitalício na página do material.
          </p>
        </div>
      )}
      <p className="text-sm leading-relaxed text-white/75">
        Este material é protegido: cada página que você abre recebe uma marca d&apos;água com os
        seus dados. É isso que permite ao autor disponibilizar o conteúdo aqui — por isso a
        leitura acontece dentro do leitor, e não como arquivo solto.
      </p>
      <p className="mt-3 text-sm font-semibold text-white">O que você ganha em troca:</p>
      <div className="mt-2 space-y-2">
        {points.map(([title, text]) => (
          <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs font-bold text-emerald-200">{title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-white/65">{text}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-white/40">
        O leitor precisa de internet para carregar as páginas.
      </p>
    </ViewerDialog>
  )
}

function SheetAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left text-sm font-semibold text-white transition-colors hover:bg-white/10"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-emerald-200">
        {icon}
      </span>
      {label}
    </button>
  )
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string
  body: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-white/15 bg-zinc-950 p-4 text-white shadow-2xl">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-200">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold">{title}</h2>
            <p className="mt-1 text-sm text-white/60">{body}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="h-9 rounded-lg border border-white/10 px-3 text-xs font-semibold text-white/80 hover:bg-white/10">
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-rose-600 px-3 text-xs font-bold text-white hover:bg-rose-700">
            <Trash2 className="h-3.5 w-3.5" /> {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function ToolbarButton({
  children,
  onClick,
  disabled,
  title,
  compact,
  className,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  title: string
  compact?: boolean
  className?: string
}) {
  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`${compact ? 'h-8 w-8 rounded-lg' : 'h-10 w-10 rounded-xl'} shrink-0 border border-white/10 bg-white/10 text-white hover:bg-white/15 hover:text-white disabled:opacity-40 ${className || ''}`}
    >
      {children}
    </Button>
  )
}

function ToolButton({ children, active, onClick, title }: { children: React.ReactNode; active: boolean; onClick: () => void; title: string }) {
  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={onClick}
      title={title}
      className={`h-10 w-10 shrink-0 rounded-xl border text-white hover:text-white ${
        active ? 'border-emerald-300/50 bg-emerald-400/25' : 'border-white/10 bg-white/10 hover:bg-white/15'
      }`}
    >
      {children}
    </Button>
  )
}

// Botão de barra com rótulo escrito (e ícone opcional). Rótulo visível é a
// diferença entre um leitor que se explica sozinho e um que exige descobrir
// tudo por hover — que no celular nem existe.
function ToolbarTextButton({
  children,
  active,
  onClick,
  icon,
  'data-tour': dataTour,
}: {
  children: React.ReactNode
  active?: boolean
  onClick: () => void
  icon?: React.ReactNode
  'data-tour'?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-tour={dataTour}
      className={`flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 text-xs font-semibold transition-colors ${
        active ? 'border-emerald-300/50 bg-emerald-400/25 text-white' : 'border-white/10 bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}
