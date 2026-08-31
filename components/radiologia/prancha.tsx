'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Contrast,
  Eye,
  EyeOff,
  HelpCircle,
  Layers,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  Ruler,
  Stethoscope,
  Target,
  X,
} from 'lucide-react'
import { AreaRadiologia } from '@/components/radiologia/area-radiologia'
import { CadernoRadiologico } from '@/components/radiologia/caderno'
import { CantosFilme, FilmeImagem } from '@/components/radiologia/filme'
import type {
  ConvencaoGrafica,
  IrmaPrancha,
  ItemChave,
  PranchaRadiologica,
} from '@/lib/radiologia/pranchas'

/**
 * Visualizador de uma prancha de anatomia pulmonar.
 *
 * A prancha é uma figura fechada — a demarcação já está pintada, com chave e
 * nota de rodapé dentro da imagem. O que este componente acrescenta é o que a
 * figura não cabe, e uma coisa que ela não pode fazer sozinha: apagar-se.
 *
 * Daí as três decisões do desenho:
 *
 * 1. **O filme limpo é o estado que importa.** O botão "sem marcadores" troca a
 *    prancha pela mesma radiografia crua. É o gesto do atlas inteiro — primeiro
 *    reconhecer, depois conferir — e sem ele a figura só ensina a reconhecer a
 *    figura.
 * 2. **A chave de cores é navegável.** Cada quadradinho é um botão que abre o
 *    dossiê do território: onde achar, o que ele ensina, que erro ele provoca.
 *    A cor do quadrado é a cor exata amostrada da imagem, para que a
 *    correspondência seja visual e não de legenda.
 * 3. **A lupa é obrigatória.** São 1122 × 1402 px de figura com rótulos
 *    pequenos; sem ampliação em tela cheia, metade do conteúdo é ilegível no
 *    celular.
 *
 * Tudo o que ele sabe chega por prop: o módulo `lib/radiologia/pranchas` é
 * importado só pelo componente de servidor, e por isso o dossiê das outras três
 * pranchas nunca entra neste bundle.
 */

export interface PranchaViewProps {
  prancha: PranchaRadiologica
  /** As quatro pranchas, para a trilha do cabeçalho. */
  irmas: IrmaPrancha[]
}

export function PranchaView({ prancha, irmas }: PranchaViewProps) {
  const [marcando, setMarcando] = useState(true)
  const [invertido, setInvertido] = useState(false)
  const [ampliada, setAmpliada] = useState(false)
  const [territorio, setTerritorio] = useState<ItemChave | null>(null)
  const visor = useRef<HTMLDivElement | null>(null)

  const todosItens = prancha.grupos.flatMap((grupo) => grupo.itens)

  // Deep-link vindo do catálogo (`?territorio=s6-lid`). Lido do `location` em
  // vez de `useSearchParams` para não obrigar a página a nascer em Suspense.
  useEffect(() => {
    const alvo = new URLSearchParams(window.location.search).get('territorio')
    if (!alvo) return
    const achado = todosItens.find((item) => item.slug === alvo)
    if (achado) setTerritorio(achado)
    // `prancha.slug` basta como dependência: a lista de itens é derivada dele.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prancha.slug])

  // Em coluna única a chave de cores fica abaixo do filme; escolher um
  // território precisa trazer a imagem de volta para a tela, senão o dossiê
  // abre num lugar que o aluno não está olhando.
  const escolher = useCallback((item: ItemChave) => {
    setTerritorio((atual) => (atual?.slug === item.slug ? null : item))
    setMarcando(true)
    if (window.matchMedia('(max-width: 1279px)').matches) {
      visor.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const secoesDoCaderno = [
    { id: 'geral', rotulo: 'A prancha inteira' },
    ...prancha.grupos.map((grupo) => ({ id: grupo.id, rotulo: grupo.titulo })),
    ...todosItens.map((item) => ({ id: item.slug, rotulo: `${item.sigla} · ${item.nome}` })),
  ]

  return (
    <AreaRadiologia alvo={`A prancha “${prancha.titulo}”`}>
      <div className="rx surface-page min-h-screen">
        <Cabecalho prancha={prancha} irmas={irmas} />

        <main className="container mx-auto max-w-7xl px-4 pb-16">
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,0.9fr)] xl:items-start">
            {/* ── Negatoscópio ── */}
            <div ref={visor} className="-mx-4 scroll-mt-2 sm:mx-0 xl:sticky xl:top-4">
              <div className="overflow-hidden border-y border-sky-400/20 bg-black shadow-2xl shadow-black/40 sm:rounded-2xl sm:border">
                <BarraFilme
                  prancha={prancha}
                  marcando={marcando}
                  invertido={invertido}
                  onMarcar={() => setMarcando((atual) => !atual)}
                  onInverter={() => setInvertido((atual) => !atual)}
                  onAmpliar={() => setAmpliada(true)}
                />

                <div className="relative h-[52vh] min-h-[300px] w-full overflow-hidden bg-black sm:h-[60vh] xl:h-[min(74vh,820px)]">
                  {/* As duas imagens ficam montadas ao mesmo tempo e trocam por
                      opacidade: a partir do segundo toque, alternar entre filme
                      limpo e prancha é instantâneo, sem recarregar nada. */}
                  <div
                    className={`absolute inset-0 transition-opacity duration-300 ${
                      marcando ? 'opacity-100' : 'opacity-0'
                    }`}
                    aria-hidden={!marcando}
                  >
                    <FilmeImagem
                      src={prancha.imagem}
                      alt={marcando ? prancha.altImagem : ''}
                      larguraMobile={750}
                      larguraDesktop={1200}
                      qualidade={82}
                      prioritaria
                      comEsqueleto
                      className={`absolute inset-0 h-full w-full object-contain transition-[filter] duration-500 ${
                        invertido ? 'invert' : ''
                      }`}
                    />
                  </div>

                  <div
                    className={`absolute inset-0 transition-opacity duration-300 ${
                      marcando ? 'opacity-0' : 'opacity-100'
                    }`}
                    aria-hidden={marcando}
                  >
                    <FilmeImagem
                      src={prancha.imagemLimpa}
                      alt={marcando ? '' : prancha.altImagemLimpa}
                      larguraMobile={640}
                      larguraDesktop={828}
                      qualidade={82}
                      segundoPlano
                      className={`absolute inset-0 h-full w-full object-contain transition-[filter] duration-500 ${
                        invertido ? 'invert' : ''
                      }`}
                    />
                  </div>

                  <CantosFilme />

                  <span className="pointer-events-none absolute right-3 top-3 rounded border border-sky-300/25 bg-black/60 px-1.5 py-0.5 font-clinical text-[10px] font-bold tracking-widest text-sky-200/80 backdrop-blur">
                    {prancha.incidencia.toUpperCase()}
                  </span>

                  {!marcando && (
                    <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-amber-300/30 bg-black/70 px-3 py-1 text-[11px] font-bold text-amber-200 backdrop-blur">
                      Filme limpo — delimite antes de acender
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setAmpliada(true)}
                  className="flex w-full items-center justify-center gap-2 border-t border-white/10 bg-neutral-950 px-3 py-2.5 font-clinical text-[11px] uppercase tracking-widest text-sky-300/80 transition hover:bg-neutral-900 hover:text-sky-200"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  Ampliar em tela cheia · {prancha.largura} × {prancha.altura}
                </button>
              </div>

              <LegendaFigura prancha={prancha} />
            </div>

            {/* ── Chave de cores e dossiê ── */}
            <aside className="flex flex-col gap-4">
              <ChaveDeCores
                prancha={prancha}
                territorio={territorio}
                onEscolher={escolher}
                className="order-2 xl:order-none"
              />
              <DossieTerritorio
                territorio={territorio}
                total={todosItens.length}
                className="order-1 xl:order-none"
              />
              <Convencoes convencoes={prancha.convencoes} className="order-3" />
            </aside>
          </section>

          <Leitura prancha={prancha} />
          <Clinica prancha={prancha} />
          <ArmadilhasELimites prancha={prancha} />
          <Checagem prancha={prancha} />
          <Relacionadas prancha={prancha} irmas={irmas} />
          <Rodape />
        </main>

        <CadernoRadiologico
          escopo="pranchas"
          chave={prancha.slug}
          titulo={prancha.titulo}
          subtitulo={`Figura ${prancha.figura} · ${prancha.incidencia}`}
          secoes={secoesDoCaderno}
          secaoAtual={territorio?.slug ?? 'geral'}
        />

        {ampliada && (
          <Lupa
            src={marcando ? prancha.imagem : prancha.imagemLimpa}
            alt={marcando ? prancha.altImagem : prancha.altImagemLimpa}
            invertido={invertido}
            titulo={`${prancha.titulo} — ${marcando ? 'com marcadores' : 'filme limpo'}`}
            onFechar={() => setAmpliada(false)}
          />
        )}
      </div>
    </AreaRadiologia>
  )
}

/* ─────────────────────────────── Cabeçalho ─────────────────────────────── */

function Cabecalho({ prancha, irmas }: { prancha: PranchaRadiologica; irmas: IrmaPrancha[] }) {
  return (
    <header className="rx-painel rx-grade relative overflow-hidden border-b border-sky-400/15">
      <div className="rx-abaixo-flutuantes container relative mx-auto max-w-7xl px-4 pb-5 pt-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <Link
            href="/manual-clinico/radiologia/pranchas"
            className="-m-1 inline-flex items-center gap-1.5 rounded p-1 text-sky-100/55 transition hover:text-sky-100"
          >
            <ArrowLeft className="h-4 w-4" /> Pranchas de anatomia pulmonar
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-sky-100/25" />
          <span className="p-1 text-sky-100/55">{prancha.temaTitulo}</span>
        </div>

        <div className="mt-4 max-w-4xl">
          <p className="editorial-mark !text-sky-300/80 [&::before]:bg-sky-300/60">
            Figura {prancha.figura} · {prancha.temaTitulo}
          </p>
          <h1 className="mt-1.5 font-heading text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {prancha.titulo}
            <span className="ml-2.5 inline-flex translate-y-[-2px] items-center rounded-full border border-sky-300/30 bg-sky-400/10 px-2.5 py-0.5 align-middle font-clinical text-[11px] font-bold uppercase tracking-widest text-sky-200">
              {prancha.incidencia}
            </span>
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-sky-100/60">{prancha.subtitulo}</p>
        </div>

        <nav aria-label="As quatro pranchas" className="mt-4">
          <div className="rx-rolagem -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {irmas.map((irma) => {
              const atual = irma.slug === prancha.slug
              return (
                <Link
                  key={irma.slug}
                  href={`/manual-clinico/radiologia/pranchas/${irma.slug}`}
                  prefetch
                  aria-current={atual ? 'page' : undefined}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    atual
                      ? 'rx-ativo border-sky-400/60 bg-sky-400/15 text-sky-100'
                      : 'border-sky-400/15 bg-white/[0.03] text-sky-100/55 hover:border-sky-400/40 hover:text-sky-100'
                  }`}
                >
                  <span className="font-clinical text-[10px] opacity-60">Fig. {irma.figura}</span>{' '}
                  {irma.titulo}
                  <span className="ml-1.5 font-clinical text-[10px] opacity-60">
                    {irma.incidencia}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </header>
  )
}

/* ──────────────────────────────── Viewer ──────────────────────────────── */

function BarraFilme({
  prancha,
  marcando,
  invertido,
  onMarcar,
  onInverter,
  onAmpliar,
}: {
  prancha: PranchaRadiologica
  marcando: boolean
  invertido: boolean
  onMarcar: () => void
  onInverter: () => void
  onAmpliar: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-neutral-950 px-3 py-2 text-white">
      <span className="inline-flex min-w-0 items-center gap-2 font-clinical text-[10px] uppercase tracking-widest text-sky-300/80">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-400" />
        </span>
        <span className="truncate">Figura {prancha.figura}</span>
        <span className="hidden text-white/25 sm:inline">·</span>
        <span className="hidden truncate sm:inline">{prancha.temaTitulo}</span>
      </span>

      <div className="flex shrink-0 items-center gap-1.5">
        <BotaoBarra ativo={!marcando} onClick={onMarcar} rotulo="Alternar marcadores">
          {marcando ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{marcando ? 'Sem marcadores' : 'Com marcadores'}</span>
        </BotaoBarra>
        <BotaoBarra ativo={invertido} onClick={onInverter} rotulo="Inverter o filme">
          <Contrast className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Negativo</span>
        </BotaoBarra>
        <BotaoBarra ativo={false} onClick={onAmpliar} rotulo="Ampliar">
          <Maximize2 className="h-3.5 w-3.5" />
        </BotaoBarra>
      </div>
    </div>
  )
}

function BotaoBarra({
  ativo,
  onClick,
  rotulo,
  children,
}: {
  ativo: boolean
  onClick: () => void
  rotulo: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      aria-label={rotulo}
      title={rotulo}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
        ativo
          ? 'border-sky-400/60 bg-sky-400/20 text-sky-100'
          : 'border-white/15 bg-white/[0.04] text-white/70 hover:border-sky-400/40 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * Lupa em tela cheia.
 *
 * Roda, arrasta e pinça sobre a imagem original — sem passar pelo otimizador,
 * porque ampliar uma versão já reduzida devolveria borrão justamente nos
 * rótulos pequenos, que é o motivo de existir a lupa.
 */
function Lupa({
  src,
  alt,
  invertido,
  titulo,
  onFechar,
}: {
  src: string
  alt: string
  invertido: boolean
  titulo: string
  onFechar: () => void
}) {
  const [escala, setEscala] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const arrasto = useRef<{ x: number; y: number; px: number; py: number } | null>(null)
  const pinca = useRef<{ distancia: number; escala: number } | null>(null)

  const reset = useCallback(() => {
    setEscala(1)
    setPos({ x: 0, y: 0 })
  }, [])

  const ajustar = useCallback((delta: number) => {
    setEscala((atual) => {
      const nova = Math.min(6, Math.max(1, atual + delta))
      if (nova === 1) setPos({ x: 0, y: 0 })
      return nova
    })
  }, [])

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onFechar()
      if (evento.key === '+' || evento.key === '=') ajustar(0.4)
      if (evento.key === '-') ajustar(-0.4)
      if (evento.key === '0') reset()
    }
    window.addEventListener('keydown', aoTeclar)
    // Enquanto a lupa está aberta, o corpo não rola atrás dela.
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = anterior
    }
  }, [ajustar, onFechar, reset])

  const distanciaEntre = (toques: React.TouchList) => {
    const [a, b] = [toques[0], toques[1]]
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-3 py-2.5">
        <span className="min-w-0 truncate font-clinical text-[11px] uppercase tracking-widest text-sky-300/80">
          {titulo}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          <BotaoBarra ativo={false} onClick={() => ajustar(-0.4)} rotulo="Reduzir">
            <Minus className="h-3.5 w-3.5" />
          </BotaoBarra>
          <span className="w-11 text-center font-clinical text-[11px] text-white/60">
            {Math.round(escala * 100)}%
          </span>
          <BotaoBarra ativo={false} onClick={() => ajustar(0.4)} rotulo="Ampliar">
            <Plus className="h-3.5 w-3.5" />
          </BotaoBarra>
          <BotaoBarra ativo={false} onClick={reset} rotulo="Enquadrar de novo">
            <RotateCcw className="h-3.5 w-3.5" />
          </BotaoBarra>
          <BotaoBarra ativo={false} onClick={onFechar} rotulo="Fechar">
            <X className="h-3.5 w-3.5" />
          </BotaoBarra>
        </div>
      </div>

      <div
        className="relative flex-1 overflow-hidden"
        style={{ cursor: escala > 1 ? 'grab' : 'zoom-in' }}
        onWheel={(evento) => ajustar(evento.deltaY < 0 ? 0.3 : -0.3)}
        onDoubleClick={() => (escala > 1 ? reset() : ajustar(1.5))}
        onPointerDown={(evento) => {
          if (escala <= 1) return
          arrasto.current = { x: evento.clientX, y: evento.clientY, px: pos.x, py: pos.y }
          evento.currentTarget.setPointerCapture(evento.pointerId)
        }}
        onPointerMove={(evento) => {
          if (!arrasto.current) return
          setPos({
            x: arrasto.current.px + (evento.clientX - arrasto.current.x),
            y: arrasto.current.py + (evento.clientY - arrasto.current.y),
          })
        }}
        onPointerUp={() => {
          arrasto.current = null
        }}
        onTouchStart={(evento) => {
          if (evento.touches.length === 2) {
            pinca.current = { distancia: distanciaEntre(evento.touches), escala }
          }
        }}
        onTouchMove={(evento) => {
          if (evento.touches.length !== 2 || !pinca.current) return
          const fator = distanciaEntre(evento.touches) / pinca.current.distancia
          setEscala(Math.min(6, Math.max(1, pinca.current.escala * fator)))
        }}
        onTouchEnd={() => {
          pinca.current = null
        }}
      >
        {/* A transformação vai no wrapper, não na imagem: assim o
            `object-contain` continua fazendo o enquadramento e o zoom é uma
            única propriedade animável, sem recalcular layout a cada pixel de
            arrasto. `otimizar={false}` porque a lupa serve a imagem original,
            em resolução plena — ampliar uma versão já reduzida devolveria
            borrão justamente nos rótulos pequenos. */}
        <div
          className="absolute inset-0 will-change-transform"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${escala})`,
            transformOrigin: 'center center',
          }}
        >
          <FilmeImagem
            src={src}
            alt={alt}
            larguraMobile={1200}
            larguraDesktop={1920}
            qualidade={90}
            otimizar={false}
            prioritaria
            semTransicao
            className={`absolute inset-0 h-full w-full select-none object-contain ${
              invertido ? 'invert' : ''
            }`}
          />
        </div>
      </div>

      <p className="shrink-0 border-t border-white/10 px-3 py-2 text-center text-[11px] text-white/40">
        Roda do mouse ou pinça para ampliar · arraste para mover · duplo clique reenquadra ·{' '}
        <kbd className="rounded border border-white/20 px-1">Esc</kbd> fecha
      </p>
    </div>
  )
}

/* ──────────────────────────── Chave de cores ──────────────────────────── */

function ChaveDeCores({
  prancha,
  territorio,
  onEscolher,
  className = '',
}: {
  prancha: PranchaRadiologica
  territorio: ItemChave | null
  onEscolher: (item: ItemChave) => void
  className?: string
}) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-4 shadow-sm ${className}`}>
      <p className="editorial-mark mb-1">Chave de cores</p>
      <h2 className="font-heading text-base font-semibold">Clique numa cor para abrir o dossiê</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Os quadrados usam a cor exata da mancha na figura. A família cromática é a do lobo de
        origem — é o que deixa a hierarquia visível sem legenda.
      </p>

      <div className="rx-rolagem mt-3.5 max-h-[46vh] space-y-3.5 overflow-y-auto pr-1 xl:max-h-[52vh]">
        {prancha.grupos.map((grupo) => (
          <div key={grupo.id}>
            <div className="flex items-baseline gap-2">
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 translate-y-[1px] rounded-sm"
                style={{ backgroundColor: grupo.cor }}
              />
              <h3 className="font-heading text-[13px] font-bold">{grupo.titulo}</h3>
              <span className="font-clinical text-[10px] uppercase tracking-wider text-muted-foreground">
                {grupo.sigla}
              </span>
            </div>
            <p className="mt-0.5 pl-[18px] text-[11px] leading-relaxed text-muted-foreground">
              {grupo.nota}
            </p>

            <ul className="mt-2 space-y-1">
              {grupo.itens.map((item) => {
                const ativo = territorio?.slug === item.slug
                return (
                  <li key={item.slug}>
                    <button
                      type="button"
                      onClick={() => onEscolher(item)}
                      aria-pressed={ativo}
                      className={`flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-1.5 text-left transition ${
                        ativo
                          ? 'rx-ativo border-sky-500 bg-sky-500/10'
                          : 'border-border bg-muted/20 hover:border-sky-500/40 hover:bg-muted/40'
                      }`}
                    >
                      <span
                        aria-hidden
                        className="h-4 w-4 shrink-0 rounded-[3px] ring-1 ring-inset ring-black/20"
                        style={{ backgroundColor: item.cor }}
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-[12.5px] font-bold leading-tight ${
                            ativo ? 'text-sky-700 dark:text-sky-300' : ''
                          }`}
                        >
                          <span className="font-clinical">{item.sigla}</span>
                          <span className="mx-1 opacity-40">·</span>
                          {item.nome}
                        </span>
                        <span className="mt-0.5 block text-[10px] italic leading-tight text-muted-foreground">
                          {item.original}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function DossieTerritorio({
  territorio,
  total,
  className = '',
}: {
  territorio: ItemChave | null
  total: number
  className?: string
}) {
  if (!territorio) {
    return (
      <div
        className={`rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-center ${className}`}
      >
        <Target className="mx-auto h-5 w-5 text-muted-foreground/60" />
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Escolha um dos <strong className="font-bold text-foreground">{total} territórios</strong>{' '}
          da chave para ler onde encontrá-lo na figura, o que ele ensina e qual erro ele costuma
          provocar.
        </p>
      </div>
    )
  }

  return (
    <div
      key={territorio.slug}
      className={`rx-entra overflow-hidden rounded-2xl border border-sky-500/25 bg-card shadow-sm ${className}`}
    >
      <div
        className="flex items-center gap-2.5 px-4 py-3"
        style={{ backgroundColor: `${territorio.cor}1f` }}
      >
        <span
          aria-hidden
          className="h-6 w-6 shrink-0 rounded-md ring-1 ring-inset ring-black/20"
          style={{ backgroundColor: territorio.cor }}
        />
        <div className="min-w-0">
          <h3 className="truncate font-heading text-sm font-semibold">
            <span className="font-clinical">{territorio.sigla}</span>
            <span className="mx-1 opacity-40">·</span>
            {territorio.nome}
          </h3>
          <p className="truncate text-[11px] italic text-muted-foreground">{territorio.original}</p>
        </div>
      </div>

      <dl className="space-y-3 p-4">
        <Verbete icone={Ruler} termo="Onde está na figura" texto={territorio.onde} />
        <Verbete icone={BookOpen} termo="O que ele ensina" texto={territorio.leitura} />
        {territorio.armadilha && (
          <Verbete
            icone={AlertTriangle}
            termo="Armadilha"
            texto={territorio.armadilha}
            alerta
          />
        )}
      </dl>
    </div>
  )
}

function Verbete({
  icone: Icone,
  termo,
  texto,
  alerta = false,
}: {
  icone: typeof Ruler
  termo: string
  texto: string
  alerta?: boolean
}) {
  return (
    <div className={alerta ? 'rounded-lg border border-amber-500/25 bg-amber-500/[0.06] p-2.5' : ''}>
      <dt
        className={`flex items-center gap-1.5 font-clinical text-[10px] uppercase tracking-widest ${
          alerta ? 'text-amber-600 dark:text-amber-400' : 'text-sky-600 dark:text-sky-400'
        }`}
      >
        <Icone className="h-3 w-3" />
        {termo}
      </dt>
      <dd className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{texto}</dd>
    </div>
  )
}

function Convencoes({
  convencoes,
  className = '',
}: {
  convencoes: ConvencaoGrafica[]
  className?: string
}) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-4 shadow-sm ${className}`}>
      <p className="editorial-mark mb-1">Convenções gráficas</p>
      <h2 className="font-heading text-base font-semibold">O que cada traço quer dizer</h2>
      <dl className="mt-3 space-y-2.5">
        {convencoes.map((convencao) => (
          <div key={convencao.nome} className="flex gap-3">
            <span className="mt-0.5 shrink-0">
              <AmostraGrafica tipo={convencao.amostra} />
            </span>
            <div className="min-w-0">
              <dt className="text-[12.5px] font-bold leading-tight">{convencao.nome}</dt>
              <dd className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
                {convencao.significado}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** Miniatura do traço, desenhada em SVG para reproduzir o da figura. */
function AmostraGrafica({ tipo }: { tipo: ConvencaoGrafica['amostra'] }) {
  const comum = 'block rounded-[3px] border border-border bg-neutral-900'
  return (
    <svg width="34" height="20" viewBox="0 0 34 20" className={comum} aria-hidden>
      {tipo === 'linha-solida' && (
        <line x1="3" y1="10" x2="31" y2="10" stroke="#fff" strokeWidth="2" />
      )}
      {tipo === 'linha-tracejada' && (
        <line
          x1="3"
          y1="10"
          x2="31"
          y2="10"
          stroke="#fff"
          strokeWidth="2"
          strokeDasharray="5 4"
        />
      )}
      {tipo === 'hachura' && (
        <>
          <defs>
            <pattern id="amostra-hachura" width="5" height="5" patternUnits="userSpaceOnUse">
              <line x1="0" y1="5" x2="5" y2="0" stroke="#fff" strokeWidth="1.2" />
            </pattern>
          </defs>
          <rect x="3" y="3" width="28" height="14" fill="url(#amostra-hachura)" />
          <rect x="3" y="3" width="28" height="14" fill="none" stroke="#fff" strokeWidth="1" />
        </>
      )}
      {tipo === 'fantasma' && (
        <rect
          x="3"
          y="3"
          width="28"
          height="14"
          fill="#ffffff33"
          stroke="#fff"
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />
      )}
      {tipo === 'seta' && (
        <>
          <line x1="4" y1="10" x2="30" y2="10" stroke="#fff" strokeWidth="1.5" />
          <path d="M4 10 l5 -3 v6 z" fill="#fff" />
          <path d="M30 10 l-5 -3 v6 z" fill="#fff" />
        </>
      )}
    </svg>
  )
}

/* ────────────────────────────── Texto longo ────────────────────────────── */

function LegendaFigura({ prancha }: { prancha: PranchaRadiologica }) {
  return (
    <div className="mx-4 mt-3 rounded-xl border border-border bg-card p-4 sm:mx-0">
      <p className="editorial-mark mb-1.5">Legenda da figura</p>
      <p className="text-[12.5px] leading-relaxed text-muted-foreground">
        <strong className="font-bold text-foreground">Figura {prancha.figura}.</strong>{' '}
        {prancha.legenda.replace(/^Figura \d+\.\s*/, '')}
      </p>
    </div>
  )
}

function Secao({
  etiqueta,
  titulo,
  icone: Icone,
  children,
}: {
  etiqueta: string
  titulo: string
  icone: typeof BookOpen
  children: React.ReactNode
}) {
  return (
    <section className="mt-11">
      <p className="editorial-mark mb-2 inline-flex items-center gap-1.5">
        <Icone className="h-3.5 w-3.5" />
        {etiqueta}
      </p>
      <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">{titulo}</h2>
      {children}
    </section>
  )
}

function Leitura({ prancha }: { prancha: PranchaRadiologica }) {
  return (
    <Secao etiqueta="Como ler esta prancha" titulo="O percurso, na ordem" icone={Layers}>
      <ol className="mt-5 space-y-3.5">
        {prancha.leitura.map((bloco, indice) => (
          <li
            key={bloco.titulo}
            className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[auto_1fr] sm:p-5"
          >
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 font-heading text-sm font-bold text-sky-600 dark:text-sky-400">
              {indice + 1}
            </span>
            <div>
              <h3 className="font-heading text-[15px] font-semibold">{bloco.titulo}</h3>
              {bloco.paragrafos.map((paragrafo) => (
                <p
                  key={paragrafo.slice(0, 40)}
                  className="mt-2 text-[13px] leading-relaxed text-muted-foreground"
                >
                  {paragrafo}
                </p>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </Secao>
  )
}

function Clinica({ prancha }: { prancha: PranchaRadiologica }) {
  return (
    <Secao
      etiqueta="Tradução clínica"
      titulo="O que isso muda diante de um paciente"
      icone={Stethoscope}
    >
      <div className="mt-5 grid gap-3.5 lg:grid-cols-2">
        {prancha.clinica.map((bloco) => (
          <article
            key={bloco.titulo}
            className="rounded-2xl border border-sky-500/20 bg-sky-500/[0.04] p-4 sm:p-5"
          >
            <h3 className="font-heading text-[15px] font-semibold">{bloco.titulo}</h3>
            {bloco.paragrafos.map((paragrafo) => (
              <p
                key={paragrafo.slice(0, 40)}
                className="mt-2 text-[13px] leading-relaxed text-muted-foreground"
              >
                {paragrafo}
              </p>
            ))}
          </article>
        ))}
      </div>
    </Secao>
  )
}

function ArmadilhasELimites({ prancha }: { prancha: PranchaRadiologica }) {
  return (
    <Secao
      etiqueta="Antes de laudar"
      titulo="Onde a leitura costuma errar"
      icone={AlertTriangle}
    >
      <div className="mt-5 grid gap-3.5 lg:grid-cols-2">
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.05] p-4 sm:p-5">
          <h3 className="flex items-center gap-2 font-heading text-[15px] font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            Armadilhas
          </h3>
          <ul className="mt-3 space-y-2">
            {prancha.armadilhas.map((item) => (
              <li key={item} className="flex gap-2.5 text-[13px] leading-relaxed text-muted-foreground">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/70" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <h3 className="flex items-center gap-2 font-heading text-[15px] font-semibold">
            <Ruler className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            O que esta prancha não mostra
          </h3>
          <ul className="mt-3 space-y-2">
            {prancha.limites.map((item) => (
              <li key={item} className="flex gap-2.5 text-[13px] leading-relaxed text-muted-foreground">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500/60" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Secao>
  )
}

function Checagem({ prancha }: { prancha: PranchaRadiologica }) {
  return (
    <Secao
      etiqueta="Autoavaliação"
      titulo="Responda antes de abrir"
      icone={HelpCircle}
    >
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Volte o filme para “sem marcadores” e responda de memória. A resposta só aparece quando
        você abre — a ideia é justamente medir o que você localiza sozinho.
      </p>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {prancha.checagem.map((par) => (
          <details
            key={par.pergunta}
            className="group rounded-2xl border border-border bg-card p-4 transition-colors open:border-sky-500/40 hover:border-sky-500/35"
          >
            <summary className="flex cursor-pointer list-none items-start gap-2.5 font-heading text-[14px] font-semibold [&::-webkit-details-marker]:hidden">
              <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
              <span className="flex-1">{par.pergunta}</span>
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-90" />
            </summary>
            <p className="mt-3 border-t border-border pt-3 text-[13px] leading-relaxed text-muted-foreground">
              {par.resposta}
            </p>
          </details>
        ))}
      </div>
    </Secao>
  )
}

function Relacionadas({
  prancha,
  irmas,
}: {
  prancha: PranchaRadiologica
  irmas: IrmaPrancha[]
}) {
  const proximas = prancha.relacionadas
    .map((slug) => irmas.find((irma) => irma.slug === slug))
    .filter((irma): irma is IrmaPrancha => Boolean(irma))

  if (proximas.length === 0) return null

  return (
    <section className="mt-11">
      <p className="editorial-mark mb-2">Continue o raciocínio</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {proximas.map((irma) => (
          <Link
            key={irma.slug}
            href={`/manual-clinico/radiologia/pranchas/${irma.slug}`}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/10"
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 font-clinical text-[11px] font-black text-sky-600 dark:text-sky-400">
              F{irma.figura}
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block font-heading text-[15px] font-semibold">{irma.titulo}</strong>
              <span className="text-xs text-muted-foreground">Incidência {irma.incidencia}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </section>
  )
}

function Rodape() {
  return (
    <p className="mt-11 rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-4 text-xs leading-relaxed text-muted-foreground">
      <strong className="font-bold text-foreground">Escopo educacional.</strong> Prancha de anatomia
      radiológica com demarcação esquemática sobre radiografia real. Os limites lobares tracejados e
      todos os limites segmentares são projeções didáticas, não achados de imagem. Não substitui
      laudo médico, avaliação clínica nem a escolha do método apropriado.
    </p>
  )
}
