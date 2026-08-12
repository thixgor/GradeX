'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Contrast,
  Crosshair,
  Eye,
  EyeOff,
  Info,
  Keyboard,
  Lightbulb,
  ListChecks,
  Pause,
  Play,
  Ruler,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Target,
  X,
} from 'lucide-react'
import { AreaRadiologia } from '@/components/radiologia/area-radiologia'
import { CantosFilme, FilmeImagem } from '@/components/radiologia/filme'
import { CadernoRadiologico } from '@/components/radiologia/caderno'
import type { IrmaoEstudo } from '@/lib/radiologia/catalogo'
import type {
  EstruturaRaioX,
  EstudoRaioX,
  GuiaRegiaoRaioX,
  NotaEstrutura,
} from '@/lib/radiologia/raio-x'

/** Intervalo do modo automático de revisão. */
const PASSO_TOUR_MS = 2800

/**
 * Quantas demarcações vizinhas entram na rede junto com a atual.
 *
 * Carregar as ~30 sobreposições de um exame de uma vez custava alguns megabytes
 * no primeiro segundo — no celular isso concorre com a própria radiografia e
 * atrasa justamente o que o aluno está esperando. Uma janela em volta do índice
 * atual cobre o passo a passo e as setas do teclado; o restante entra depois,
 * quando o navegador estiver ocioso.
 */
const JANELA_PRECARGA = 2

export interface EstudoRaioXViewProps {
  estudo: EstudoRaioX
  /** Guia de leitura da região — montado no servidor para não vir no bundle. */
  guia: GuiaRegiaoRaioX
  /** Outras incidências da mesma região, para a trilha do cabeçalho. */
  irmaos: IrmaoEstudo[]
  /** Dossiê de cada estrutura deste exame, indexado pelo slug. */
  notas: Record<string, NotaEstrutura>
}

/**
 * Visualizador de uma incidência.
 *
 * Tudo o que ele precisa saber chega por prop. Antes o componente importava
 * `lib/radiologia/raio-x` para pegar três coisas — o guia da região, as
 * incidências vizinhas e o dossiê da estrutura — e por causa disso arrastava o
 * atlas inteiro (os 28 exames e as ~200 fichas aprofundadas) para o bundle de
 * cada uma das 28 páginas. Agora o servidor recorta só o que é desta página.
 */
export function EstudoRaioXView({ estudo, guia, irmaos, notas }: EstudoRaioXViewProps) {
  const [indice, setIndice] = useState(0)
  const [marcando, setMarcando] = useState(true)
  const [invertido, setInvertido] = useState(false)
  const [tour, setTour] = useState(false)
  const [filtro, setFiltro] = useState('')
  const [basePronta, setBasePronta] = useState(false)
  // As sobreposições só entram na rede depois que a radiografia base chega. A
  // partir daí, trocar de estrutura é uma transição de opacidade sobre bytes
  // que já estão no navegador: nunca mais se vê uma demarcação "carregando".
  const [precarregarTodas, setPrecarregarTodas] = useState(false)

  const estrutura = estudo.estruturas[indice]
  const nota = notas[estrutura.slug]
  const total = estudo.estruturas.length

  // Deep-link vindo da busca do catálogo (`?estrutura=escafoide`). Lido do
  // `location` em vez de `useSearchParams` para não forçar Suspense na página.
  useEffect(() => {
    const alvo = new URLSearchParams(window.location.search).get('estrutura')
    if (!alvo) return
    const encontrado = estudo.estruturas.findIndex((item) => item.slug === alvo)
    if (encontrado >= 0) {
      setIndice(encontrado)
      setMarcando(true)
    }
  }, [estudo])

  // Rede de segurança: se a base demorar ou falhar, as sobreposições entram
  // assim mesmo — o aluno não fica preso a um viewer que não responde ao clique.
  //
  // O acervo inteiro do exame só é liberado quando o navegador fica ocioso, e
  // nunca antes da radiografia base: até lá vale a janela em volta do índice
  // atual, que já cobre o clique e as setas.
  useEffect(() => {
    if (!basePronta) {
      const relogio = window.setTimeout(() => setPrecarregarTodas(true), 2500)
      return () => window.clearTimeout(relogio)
    }
    const ocioso = window.requestIdleCallback
    if (typeof ocioso === 'function') {
      const id = ocioso(() => setPrecarregarTodas(true), { timeout: 2000 })
      return () => window.cancelIdleCallback?.(id)
    }
    const relogio = window.setTimeout(() => setPrecarregarTodas(true), 600)
    return () => window.clearTimeout(relogio)
  }, [basePronta])

  const viewer = useRef<HTMLDivElement | null>(null)

  const irPara = useCallback(
    (proximo: number) => {
      setIndice((proximo + total) % total)
      setMarcando(true)
    },
    [total],
  )

  // Escolher pela lista, no celular, sem trazer o filme de volta seria acender
  // uma demarcação fora da tela.
  const aoEscolher = useCallback(
    (posicao: number) => {
      setTour(false)
      irPara(posicao)
      if (window.matchMedia('(max-width: 1023px)').matches) {
        viewer.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    },
    [irPara],
  )

  // O intervalo do tour lê o índice por ref para não se reinscrever a cada
  // troca de estrutura — do contrário o relógio reiniciaria a cada passo.
  const indiceRef = useRef(indice)
  indiceRef.current = indice

  useEffect(() => {
    if (!tour) return
    const relogio = window.setInterval(() => irPara(indiceRef.current + 1), PASSO_TOUR_MS)
    return () => window.clearInterval(relogio)
  }, [tour, irPara])

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      const alvo = evento.target as HTMLElement | null
      if (alvo && /^(INPUT|TEXTAREA)$/.test(alvo.tagName)) return
      if (evento.key === 'ArrowRight') {
        evento.preventDefault()
        setTour(false)
        irPara(indiceRef.current + 1)
      } else if (evento.key === 'ArrowLeft') {
        evento.preventDefault()
        setTour(false)
        irPara(indiceRef.current - 1)
      } else if (evento.key === ' ') {
        evento.preventDefault()
        setMarcando((atual) => !atual)
      } else if (evento.key.toLowerCase() === 'i') {
        setInvertido((atual) => !atual)
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [irPara])

  // Seções do caderno: o exame inteiro, o roteiro da região e cada estrutura.
  const secoesDoCaderno = useMemo(
    () => [
      { id: 'geral', rotulo: 'Exame inteiro' },
      { id: 'leitura', rotulo: 'Roteiro e técnica' },
      ...estudo.estruturas.map((item) => ({ id: item.slug, rotulo: item.nome })),
    ],
    [estudo],
  )

  const consulta = filtro.trim().toLowerCase()
  const visiveis = consulta
    ? estudo.estruturas
        .map((item, posicao) => ({ item, posicao }))
        .filter(({ item }) =>
          `${item.nome} ${item.original}`.toLowerCase().includes(consulta),
        )
    : estudo.estruturas.map((item, posicao) => ({ item, posicao }))

  return (
    // Quem chega por link direto sem acesso vê a landing nomeando a incidência
    // que tentou abrir — é quando a intenção está mais clara.
    <AreaRadiologia alvo={`A incidência ${estudo.titulo} (${estudo.incidencia})`}>
      <div className="rx surface-page min-h-screen">
        <CabecalhoEstudo estudo={estudo} irmaos={irmaos} />

        <main className="container mx-auto max-w-7xl px-4 pb-16">
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.85fr)] lg:items-start">
            {/* ── Negatoscópio ── */}
            {/*
              Sticky só a partir de `lg`: em coluna única a área de grade do
              viewer tem exatamente a altura dele, e sticky não teria curso.
              No celular, escolher uma estrutura na lista rola o filme de volta
              para a tela — ver `aoEscolher`.
            */}
            <div ref={viewer} className="-mx-4 scroll-mt-2 lg:sticky lg:top-4 lg:mx-0">
              <div className="overflow-hidden border-y border-sky-400/20 bg-black shadow-2xl shadow-black/40 lg:rounded-2xl lg:border">
                <BarraFilme
                  estudo={estudo}
                  indice={indice}
                  total={total}
                  marcando={marcando}
                  invertido={invertido}
                  onInverter={() => setInvertido((atual) => !atual)}
                  onMarcar={() => setMarcando((atual) => !atual)}
                />

                <div className="relative h-[44vh] min-h-[240px] w-full overflow-hidden bg-black sm:h-[52vh] lg:h-[min(66vh,700px)]">
                  <FilmeImagem
                    src={estudo.imagem}
                    alt={`Radiografia de ${estudo.titulo} em ${estudo.incidencia}`}
                    larguraMobile={750}
                    larguraDesktop={1080}
                    qualidade={78}
                    prioritaria
                    comEsqueleto
                    onPronta={() => setBasePronta(true)}
                    className={`absolute inset-0 h-full w-full object-contain transition-[filter] duration-500 ${
                      invertido ? 'invert' : ''
                    }`}
                  />

                  {estudo.estruturas.map((item, posicao) => {
                    const selecionada = posicao === indice
                    // Distância circular: no fim da lista a janela continua na
                    // primeira estrutura, que é para onde a seta leva.
                    const bruta = Math.abs(posicao - indice)
                    const distancia = Math.min(bruta, total - bruta)
                    if (!precarregarTodas && distancia > JANELA_PRECARGA) return null
                    const visivel = marcando && selecionada
                    return (
                      <div
                        key={item.slug}
                        aria-hidden={!visivel}
                        className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out ${
                          visivel ? 'rx-pulso opacity-100' : 'opacity-0'
                        }`}
                      >
                        <FilmeImagem
                          src={item.sobreposicao}
                          alt={visivel ? `Demarcação de ${item.nome}` : ''}
                          larguraMobile={750}
                          larguraDesktop={1080}
                          qualidade={78}
                          segundoPlano
                          otimizar={false}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    )
                  })}

                  {/* Varredura de disparo: remonta a cada troca de estrutura. */}
                  {marcando && basePronta && (
                    <span key={`${indice}-${marcando}`} className="rx-disparo" />
                  )}

                  <CantosFilme />

                  <span className="pointer-events-none absolute right-3 top-3 rounded border border-sky-300/25 bg-black/60 px-1.5 py-0.5 font-clinical text-[10px] font-bold tracking-widest text-sky-200/80 backdrop-blur">
                    {estudo.incidencia.toUpperCase()}
                  </span>
                </div>

                <ControlesFilme
                  indice={indice}
                  total={total}
                  tour={tour}
                  estrutura={estrutura}
                  marcando={marcando}
                  onAnterior={() => {
                    setTour(false)
                    irPara(indice - 1)
                  }}
                  onProximo={() => {
                    setTour(false)
                    irPara(indice + 1)
                  }}
                  onTour={() => setTour((atual) => !atual)}
                />
              </div>
            </div>

            {/* ── Lista de estruturas ── */}
            <aside className="flex min-w-0 flex-col gap-4">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
                    <Target className="h-[18px] w-[18px] text-sky-500" /> Estruturas
                    <span className="font-clinical text-[11px] font-normal text-muted-foreground">
                      {total}
                    </span>
                  </h2>
                  <span className="hidden items-center gap-1 font-clinical text-[10px] uppercase tracking-wider text-muted-foreground sm:inline-flex">
                    <Keyboard className="h-3 w-3" /> ← →
                  </span>
                </div>

                {total > 8 && (
                  <div className="relative mb-3">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={filtro}
                      onChange={(evento) => setFiltro(evento.target.value)}
                      placeholder="Filtrar estruturas…"
                      aria-label="Filtrar estruturas deste exame"
                      className="h-9 w-full rounded-lg border border-border bg-muted/30 pl-8 pr-8 text-xs outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/10"
                    />
                    {filtro && (
                      <button
                        type="button"
                        onClick={() => setFiltro('')}
                        aria-label="Limpar filtro"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}

                <div className="rx-rolagem grid max-h-[340px] gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2 lg:max-h-[46vh] lg:grid-cols-1">
                  {visiveis.map(({ item, posicao }) => {
                    const ativa = posicao === indice
                    return (
                      <button
                        key={item.slug}
                        type="button"
                        onClick={() => aoEscolher(posicao)}
                        aria-pressed={ativa}
                        className={`rounded-lg border px-3 py-2 text-left transition ${
                          ativa
                            ? 'rx-ativo border-sky-500 bg-sky-500/10'
                            : 'border-border bg-muted/20 hover:border-sky-500/40 hover:bg-muted/40'
                        }`}
                      >
                        <span
                          className={`block text-[13px] font-bold leading-tight ${
                            ativa ? 'text-sky-700 dark:text-sky-300' : ''
                          }`}
                        >
                          {item.nome}
                        </span>
                        <span className="mt-0.5 block text-[10px] italic leading-tight text-muted-foreground">
                          {item.original}
                        </span>
                      </button>
                    )
                  })}
                  {visiveis.length === 0 && (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                      Nenhuma estrutura corresponde a “{filtro}”.
                    </p>
                  )}
                </div>
              </div>

              {/* No celular o dossiê fica logo abaixo do filme; no desktop,
                  abaixo da lista, onde há espaço vertical de sobra. */}
              <DossieEstrutura
                estrutura={estrutura}
                nota={nota}
                className="order-first lg:order-none"
              />
            </aside>
          </section>

          <GuiaRegiao guia={guia} regiaoTitulo={estudo.regiaoTitulo} />

          <Rodape />
        </main>

        {/* O caderno acompanha o exame: a folha é desta incidência e a ficha
            nasce ancorada na estrutura que está acesa no filme. */}
        <CadernoRadiologico
          escopo="raio-x"
          chave={estudo.id}
          titulo={estudo.titulo}
          subtitulo={`${estudo.regiaoTitulo} · ${estudo.incidencia}`}
          secoes={secoesDoCaderno}
          secaoAtual={estrutura.slug}
        />
      </div>
    </AreaRadiologia>
  )
}

/* ─────────────────────────────── Cabeçalho ─────────────────────────────── */

function CabecalhoEstudo({ estudo, irmaos }: { estudo: EstudoRaioX; irmaos: IrmaoEstudo[] }) {
  return (
    <header className="rx-painel rx-grade relative overflow-hidden border-b border-sky-400/15">
      <div className="container relative mx-auto max-w-7xl px-4 pb-5 pt-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <Link
            href="/manual-clinico/radiologia/raio-x"
            className="-m-1 inline-flex items-center gap-1.5 rounded p-1 text-sky-100/55 transition hover:text-sky-100"
          >
            <ArrowLeft className="h-4 w-4" /> Atlas de Raio-X
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-sky-100/25" />
          <Link
            href={`/manual-clinico/radiologia/raio-x?regiao=${estudo.regiao}`}
            className="-m-1 rounded p-1 text-sky-100/55 transition hover:text-sky-100"
          >
            {estudo.regiaoTitulo}
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="editorial-mark !text-sky-300/80 [&::before]:bg-sky-300/60">
              {estudo.camada}
            </p>
            <h1 className="mt-1.5 font-heading text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {estudo.titulo}
              <span className="ml-2.5 inline-flex translate-y-[-2px] items-center rounded-full border border-sky-300/30 bg-sky-400/10 px-2.5 py-0.5 align-middle font-clinical text-[11px] font-bold uppercase tracking-widest text-sky-200">
                {estudo.incidencia}
              </span>
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-sky-100/60">{estudo.foco}</p>
          </div>

          {/* O quiz é o mesmo acervo no sentido inverso: a marcação acende e o
              nome é o que falta. O atalho fica aqui porque é onde o aluno
              percebe que já percorreu a lista e quer saber se fixou. */}
          <Link
            href={`/manual-clinico/radiologia/raio-x/quiz/${estudo.id}`}
            prefetch={false}
            className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-sky-400/40 bg-sky-400/10 px-4 py-2.5 text-xs font-bold text-sky-100 transition hover:border-sky-400/70 hover:bg-sky-400/20"
          >
            <Play className="h-4 w-4" />
            Testar sem a legenda
            <span className="font-clinical text-[10px] font-normal text-sky-200/60">
              {estudo.estruturas.length} questões
            </span>
          </Link>
        </div>

        {irmaos.length > 1 && (
          <nav aria-label={`Outras incidências de ${estudo.regiaoTitulo}`} className="mt-4">
            <div className="rx-rolagem -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {irmaos.map((irmao) => {
                const atual = irmao.id === estudo.id
                return (
                  <Link
                    key={irmao.id}
                    href={`/manual-clinico/radiologia/raio-x/${irmao.id}`}
                    prefetch
                    aria-current={atual ? 'page' : undefined}
                    className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                      atual
                        ? 'rx-ativo border-sky-400/60 bg-sky-400/15 text-sky-100'
                        : 'border-sky-400/15 bg-white/[0.03] text-sky-100/55 hover:border-sky-400/40 hover:text-sky-100'
                    }`}
                  >
                    {irmao.camada}
                    <span className="ml-1.5 font-clinical text-[10px] opacity-60">
                      {irmao.incidencia}
                    </span>
                  </Link>
                )
              })}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}

/* ──────────────────────────────── Viewer ──────────────────────────────── */

function BarraFilme({
  estudo,
  indice,
  total,
  marcando,
  invertido,
  onInverter,
  onMarcar,
}: {
  estudo: EstudoRaioX
  indice: number
  total: number
  marcando: boolean
  invertido: boolean
  onInverter: () => void
  onMarcar: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-neutral-950 px-3 py-2 text-white">
      <span className="inline-flex min-w-0 items-center gap-2 font-clinical text-[10px] uppercase tracking-widest text-sky-300/80">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-400" />
        </span>
        <span className="truncate">{estudo.regiaoTitulo}</span>
        <span className="hidden text-white/25 sm:inline">·</span>
        <span className="hidden text-white/45 sm:inline">
          {String(indice + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}
        </span>
      </span>

      <div className="flex shrink-0 items-center gap-1">
        <BotaoFilme ativo={invertido} onClick={onInverter} titulo="Inverter o filme (tecla I)">
          <Contrast className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Negativo</span>
        </BotaoFilme>
        <BotaoFilme ativo={!marcando} onClick={onMarcar} titulo="Mostrar ou esconder a demarcação (barra de espaço)">
          {marcando ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{marcando ? 'Sem marcação' : 'Com marcação'}</span>
        </BotaoFilme>
      </div>
    </div>
  )
}

function BotaoFilme({
  ativo,
  onClick,
  titulo,
  children,
}: {
  ativo: boolean
  onClick: () => void
  titulo: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={titulo}
      aria-label={titulo}
      aria-pressed={ativo}
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-bold transition ${
        ativo
          ? 'bg-sky-400/20 text-sky-200'
          : 'text-white/55 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function ControlesFilme({
  indice,
  total,
  tour,
  estrutura,
  marcando,
  onAnterior,
  onProximo,
  onTour,
}: {
  indice: number
  total: number
  tour: boolean
  estrutura: EstruturaRaioX
  marcando: boolean
  onAnterior: () => void
  onProximo: () => void
  onTour: () => void
}) {
  return (
    <div className="border-t border-white/10 bg-neutral-950">
      <div
        className="h-0.5 bg-sky-400/70 transition-[width] duration-500 ease-out"
        style={{ width: `${((indice + 1) / total) * 100}%` }}
      />
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={onAnterior}
          aria-label="Estrutura anterior"
          className="rounded-md p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1 text-center">
          <p
            key={estrutura.slug}
            className="rx-entra truncate text-[13px] font-bold text-sky-200"
          >
            {marcando ? estrutura.nome : 'Filme sem demarcação'}
          </p>
          <p className="truncate font-clinical text-[10px] italic text-white/40">
            {marcando ? estrutura.original : 'reconheça a estrutura antes de acender a marcação'}
          </p>
        </div>

        <button
          type="button"
          onClick={onTour}
          aria-label={tour ? 'Parar revisão automática' : 'Revisar automaticamente'}
          title={tour ? 'Parar revisão automática' : 'Revisar automaticamente'}
          aria-pressed={tour}
          className={`rounded-md p-1.5 transition ${
            tour ? 'bg-sky-400/20 text-sky-200' : 'text-white/60 hover:bg-white/10 hover:text-white'
          }`}
        >
          {tour ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={onProximo}
          aria-label="Próxima estrutura"
          className="rounded-md p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

/* ───────────────────────── Dossiê da estrutura ───────────────────────── */

function DossieEstrutura({
  estrutura,
  nota,
  className = '',
}: {
  estrutura: EstruturaRaioX
  nota: NotaEstrutura
  className?: string
}) {
  return (
    <div
      key={estrutura.slug}
      className={`rx-entra overflow-hidden rounded-2xl border border-sky-500/25 bg-card shadow-sm ${className}`}
    >
      <div className="border-b border-sky-500/20 bg-sky-500/[0.06] px-4 py-3">
        <p className="font-clinical text-[10px] uppercase tracking-widest text-sky-600 dark:text-sky-400">
          Dossiê da estrutura
        </p>
        <h3 className="mt-0.5 font-heading text-base font-semibold leading-tight">
          {estrutura.nome}
        </h3>
        <p className="text-[11px] italic text-muted-foreground">{estrutura.original}</p>
      </div>

      <div className="divide-y divide-border">
        <ItemDossie icone={Info} titulo="O que é" texto={nota.resumo} />
        <ItemDossie icone={Crosshair} titulo="Como identificar no filme" texto={nota.identificar} />
        <ItemDossie icone={Activity} titulo="O que avaliar e por quê" texto={nota.clinica} />
        {nota.alerta && (
          <ItemDossie icone={AlertTriangle} titulo="Armadilha" texto={nota.alerta} destaque />
        )}
      </div>
    </div>
  )
}

function ItemDossie({
  icone: Icone,
  titulo,
  texto,
  destaque = false,
}: {
  icone: typeof Info
  titulo: string
  texto: string
  destaque?: boolean
}) {
  return (
    <div className={`flex gap-3 p-4 ${destaque ? 'bg-amber-500/[0.06]' : ''}`}>
      <Icone
        className={`mt-0.5 h-4 w-4 shrink-0 ${destaque ? 'text-amber-500' : 'text-sky-500'}`}
      />
      <div className="min-w-0">
        <p
          className={`text-[10px] font-black uppercase tracking-wider ${
            destaque ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
          }`}
        >
          {titulo}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-foreground/85">{texto}</p>
      </div>
    </div>
  )
}

/* ─────────────────────────── Guia da região ─────────────────────────── */

function GuiaRegiao({
  guia,
  regiaoTitulo,
}: {
  guia: GuiaRegiaoRaioX
  regiaoTitulo: string
}) {
  return (
    <section className="mt-10">
      <div className="mb-5">
        <p className="editorial-mark">Leitura sistemática · {regiaoTitulo}</p>
        <h2 className="mt-1.5 font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          Como se lê esta região por inteiro
        </h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Bloco icone={BookOpen} titulo="Contexto anatômico">
          <p>{guia.contexto}</p>
        </Bloco>
        <Bloco icone={SlidersHorizontal} titulo="Técnica e posicionamento">
          <p>{guia.tecnica}</p>
        </Bloco>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Bloco icone={ListChecks} titulo="Roteiro de leitura">
          <ol className="space-y-3">
            {guia.roteiro.map((item, posicao) => (
              <li key={item.passo} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500 font-clinical text-[11px] font-black text-white">
                  {posicao + 1}
                </span>
                <span>
                  <strong className="text-foreground">{item.passo}.</strong> {item.detalhe}
                </span>
              </li>
            ))}
          </ol>
        </Bloco>
        <Bloco icone={CheckCircle2} titulo="Critérios de qualidade">
          <Lista itens={guia.qualidade} />
        </Bloco>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Bloco icone={ShieldAlert} titulo="Armadilhas de interpretação" tom="alerta">
          <Lista itens={guia.armadilhas} tom="alerta" />
        </Bloco>
        <Bloco icone={Lightbulb} titulo="Pérolas de alto rendimento">
          <Lista itens={guia.perolas} />
        </Bloco>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Bloco icone={Ruler} titulo="Medidas de referência">
          <ul className="divide-y divide-border">
            {guia.medidas.map((medida) => (
              <li key={medida.rotulo} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5 first:pt-0 last:pb-0">
                <span className="text-[13px] font-bold text-foreground">{medida.rotulo}</span>
                <span className="rounded border border-sky-500/25 bg-sky-500/10 px-1.5 py-0.5 font-clinical text-[11px] font-bold text-sky-700 dark:text-sky-300">
                  {medida.valor}
                </span>
                <span className="w-full text-xs leading-relaxed text-muted-foreground">
                  {medida.nota}
                </span>
              </li>
            ))}
          </ul>
        </Bloco>
        <Bloco icone={ArrowUpRight} titulo="Quando a radiografia não basta">
          <p>{guia.quandoAvancar}</p>
        </Bloco>
      </div>
    </section>
  )
}

function Bloco({
  icone: Icone,
  titulo,
  tom = 'padrao',
  children,
}: {
  icone: typeof Info
  titulo: string
  tom?: 'padrao' | 'alerta'
  children: React.ReactNode
}) {
  const alerta = tom === 'alerta'
  return (
    <div
      className={`rounded-2xl border p-5 ${
        alerta ? 'border-amber-500/25 bg-amber-500/[0.04]' : 'border-border bg-card'
      }`}
    >
      <h3 className="flex items-center gap-2 font-heading text-base font-semibold">
        <Icone className={`h-[18px] w-[18px] ${alerta ? 'text-amber-500' : 'text-sky-500'}`} />
        {titulo}
      </h3>
      <div className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{children}</div>
    </div>
  )
}

function Lista({ itens, tom = 'padrao' }: { itens: string[]; tom?: 'padrao' | 'alerta' }) {
  return (
    <ul className="space-y-2">
      {itens.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span
            className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${
              tom === 'alerta' ? 'bg-amber-500' : 'bg-sky-500'
            }`}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

/* ─────────────────────────────── Rodapé ─────────────────────────────── */

function Rodape() {
  return (
    <section className="mt-8 rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-4 text-xs leading-relaxed text-muted-foreground">
      <p className="font-bold text-foreground">Escopo educacional</p>
      <p className="mt-1">
        Material educacional de anatomia radiográfica. Não substitui laudo médico, avaliação
        clínica, protocolos institucionais nem a escolha do método de imagem apropriado.
      </p>
    </section>
  )
}
