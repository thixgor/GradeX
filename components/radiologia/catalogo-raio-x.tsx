'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  CornerDownLeft,
  ExternalLink,
  ImageIcon,
  LayoutGrid,
  ScanLine,
  Search,
  Target,
  X,
} from 'lucide-react'
import { LogoRadiologia } from '@/components/radiologia/logo'
import { CantosFilme, FilmeImagem, urlFilme } from '@/components/radiologia/filme'
import {
  buscarEstruturasRaioX,
  buscarEstudosRaioX,
  CREDITO_CLINICAL_ANATOMY,
  ESTUDOS_RAIO_X,
  estudosDaRegiao,
  GUIAS_RAIO_X,
  REGIOES_RAIO_X,
  TOTAL_ESTRUTURAS_RAIO_X,
  type EstudoRaioX,
  type RegiaoRaioX,
} from '@/lib/radiologia/raio-x'

const REGIOES_VALIDAS = new Set(REGIOES_RAIO_X.map((regiao) => regiao.id))

function regiaoDaUrl(): RegiaoRaioX | null {
  if (typeof window === 'undefined') return null
  const bruta = new URLSearchParams(window.location.search).get('regiao')
  return bruta && REGIOES_VALIDAS.has(bruta as RegiaoRaioX) ? (bruta as RegiaoRaioX) : null
}

export function CatalogoRaioX() {
  const [busca, setBusca] = useState('')
  const [regiao, setRegiao] = useState<RegiaoRaioX | null>(null)
  const campoBusca = useRef<HTMLInputElement | null>(null)

  // A região vive na URL para o botão "voltar" do navegador funcionar depois de
  // entrar num estudo. `history` direto em vez do router: trocar de região é
  // filtro local e não deve custar um round-trip ao servidor.
  useEffect(() => {
    setRegiao(regiaoDaUrl())
    const aoVoltar = () => setRegiao(regiaoDaUrl())
    window.addEventListener('popstate', aoVoltar)
    return () => window.removeEventListener('popstate', aoVoltar)
  }, [])

  const escolherRegiao = useCallback((proxima: RegiaoRaioX | null) => {
    setRegiao(proxima)
    setBusca('')
    const url = proxima ? `?regiao=${proxima}` : window.location.pathname
    window.history.pushState(null, '', url)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const termo = busca.trim()
  const buscando = termo.length > 0
  const estudosEncontrados = useMemo(
    () => (buscando ? buscarEstudosRaioX(termo, 'todas') : []),
    [buscando, termo],
  )
  const estruturasEncontradas = useMemo(
    () => (buscando ? buscarEstruturasRaioX(termo) : []),
    [buscando, termo],
  )

  const regiaoAtual = regiao ? REGIOES_RAIO_X.find((item) => item.id === regiao) : null
  const estudosDaRegiaoAtual = regiao ? estudosDaRegiao(regiao) : []

  // "/" foca a busca, como em qualquer ferramenta de consulta.
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      const alvo = evento.target as HTMLElement | null
      const digitando = alvo && /^(INPUT|TEXTAREA)$/.test(alvo.tagName)
      if (evento.key === '/' && !digitando) {
        evento.preventDefault()
        campoBusca.current?.focus()
      }
      if (evento.key === 'Escape' && digitando) setBusca('')
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [])

  return (
    <div className="rx surface-page min-h-screen">
      <Cabecalho
        busca={busca}
        onBusca={setBusca}
        campoBusca={campoBusca}
        regiao={regiao}
        onRegiao={escolherRegiao}
      />

      <main className="container mx-auto max-w-6xl px-4 pb-16 pt-7 sm:pt-9">
        {buscando ? (
          <ResultadosBusca
            termo={termo}
            estruturas={estruturasEncontradas}
            estudos={estudosEncontrados}
            onLimpar={() => setBusca('')}
          />
        ) : regiao && regiaoAtual ? (
          <DetalheRegiao
            regiao={regiao}
            titulo={regiaoAtual.titulo}
            estudos={estudosDaRegiaoAtual}
            onVoltar={() => escolherRegiao(null)}
          />
        ) : (
          <GradeRegioes onEscolher={escolherRegiao} />
        )}

        <Creditos />
      </main>
    </div>
  )
}

/* ─────────────────────────────── Cabeçalho ─────────────────────────────── */

function Cabecalho({
  busca,
  onBusca,
  campoBusca,
  regiao,
  onRegiao,
}: {
  busca: string
  onBusca: (valor: string) => void
  campoBusca: React.MutableRefObject<HTMLInputElement | null>
  regiao: RegiaoRaioX | null
  onRegiao: (regiao: RegiaoRaioX | null) => void
}) {
  return (
    <header className="rx-painel rx-grade rx-varredura relative overflow-hidden border-b border-sky-400/15">
      <div className="container relative mx-auto max-w-6xl px-4 pb-7 pt-6">
        <Link
          href="/manual-clinico/radiologia"
          className="-m-2 inline-flex items-center gap-1.5 rounded-lg p-2 text-sm text-sky-100/60 transition hover:text-sky-100"
        >
          <ArrowLeft className="h-4 w-4" /> Manual de Radiologia
        </Link>

        <div className="mt-5 grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:items-end">
          <div>
            <div className="[filter:invert(1)_hue-rotate(180deg)_brightness(1.2)]">
              <LogoRadiologia className="max-w-[300px]" />
            </div>
            <p className="editorial-mark mt-5 !text-sky-300/80 [&::before]:bg-sky-300/60">
              Atlas de Raio-X · anatomia guiada
            </p>
            <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-white sm:text-[2rem] sm:leading-tight">
              Acenda cada estrutura sobre a radiografia
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-sky-100/65 sm:text-base">
              Escolha uma região, abra a incidência e clique nas estruturas para vê-las demarcadas
              no filme. Cada estrutura vem com dossiê próprio — o que é, como identificar, o que
              avaliar e qual erro ela costuma provocar.
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-bold text-sky-100/70">
              <Selo icone={LayoutGrid} texto={`${REGIOES_RAIO_X.length} regiões`} />
              <Selo icone={ImageIcon} texto={`${ESTUDOS_RAIO_X.length} incidências`} />
              <Selo icone={Target} texto={`${TOTAL_ESTRUTURAS_RAIO_X} demarcações`} />
            </div>
          </div>

          <div className="w-full">
            <label htmlFor="busca-raio-x" className="sr-only">
              Buscar estrutura, exame ou termo em inglês
            </label>
            <div className="group relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-300/70" />
              <input
                id="busca-raio-x"
                ref={campoBusca}
                value={busca}
                onChange={(evento) => onBusca(evento.target.value)}
                placeholder="escafoide, hilo, costophrenic…"
                autoComplete="off"
                className="h-12 w-full rounded-xl border border-sky-400/25 bg-sky-950/40 pl-11 pr-11 text-sm text-white outline-none backdrop-blur transition placeholder:text-sky-200/35 focus:border-sky-400/70 focus:bg-sky-950/60 focus:ring-4 focus:ring-sky-400/10"
              />
              {busca ? (
                <button
                  type="button"
                  onClick={() => onBusca('')}
                  aria-label="Limpar busca"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-sky-200/60 transition hover:bg-sky-400/15 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-sky-400/25 px-1.5 py-0.5 font-clinical text-[10px] text-sky-200/50 sm:block">
                  /
                </kbd>
              )}
            </div>
            <p className="mt-2 pl-1 text-[11px] text-sky-200/45">
              Busca em português e no termo anatômico original.
            </p>
          </div>
        </div>
      </div>

      <TrilhaRegioes regiao={regiao} onRegiao={onRegiao} />
    </header>
  )
}

function Selo({ icone: Icone, texto }: { icone: typeof Target; texto: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-400/[0.07] px-3 py-1.5 backdrop-blur">
      <Icone className="h-3.5 w-3.5 text-sky-300" />
      {texto}
    </span>
  )
}

function TrilhaRegioes({
  regiao,
  onRegiao,
}: {
  regiao: RegiaoRaioX | null
  onRegiao: (regiao: RegiaoRaioX | null) => void
}) {
  return (
    <nav
      aria-label="Regiões do atlas"
      className="relative border-t border-sky-400/10 bg-black/25 backdrop-blur"
    >
      <div className="container mx-auto max-w-6xl px-4">
        <div className="rx-rolagem -mx-1 flex gap-1.5 overflow-x-auto px-1 py-2.5">
          <BotaoTrilha ativo={regiao === null} onClick={() => onRegiao(null)}>
            Todas as regiões
          </BotaoTrilha>
          {REGIOES_RAIO_X.map((item) => (
            <BotaoTrilha key={item.id} ativo={regiao === item.id} onClick={() => onRegiao(item.id)}>
              {item.titulo}
              <span className="ml-1.5 font-clinical text-[10px] opacity-60">
                {item.totalEstudos}
              </span>
            </BotaoTrilha>
          ))}
        </div>
      </div>
    </nav>
  )
}

function BotaoTrilha({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={ativo ? 'true' : undefined}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
        ativo
          ? 'rx-ativo border-sky-400/60 bg-sky-400/15 text-sky-100'
          : 'border-sky-400/15 bg-white/[0.03] text-sky-100/55 hover:border-sky-400/40 hover:text-sky-100'
      }`}
    >
      {children}
    </button>
  )
}

/* ──────────────────────────── Nível 1: regiões ──────────────────────────── */

function GradeRegioes({ onEscolher }: { onEscolher: (regiao: RegiaoRaioX) => void }) {
  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="editorial-mark">Passo 1 de 2</p>
          <h2 className="mt-1.5 font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            Escolha a região
          </h2>
        </div>
        <p className="hidden text-xs text-muted-foreground sm:block">
          As incidências aparecem dentro da região.
        </p>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {REGIOES_RAIO_X.map((item, indice) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onEscolher(item.id)}
            style={{ ['--rx-i' as string]: indice }}
            className="rx-entra group relative flex overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/10"
          >
            <div className="relative w-[38%] shrink-0 overflow-hidden bg-black">
              <FilmeImagem
                src={item.capa}
                alt=""
                larguraMobile={256}
                larguraDesktop={384}
                qualidade={62}
                comEsqueleto
                className="absolute inset-0 h-full w-full object-cover object-top opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-card" />
              <span className="absolute left-2 top-2 font-clinical text-[10px] font-bold tracking-widest text-sky-300/80">
                {String(indice + 1).padStart(2, '0')}
              </span>
            </div>

            <div className="flex min-w-0 flex-1 flex-col p-4">
              <h3 className="font-heading text-base font-semibold leading-tight transition group-hover:text-sky-600 dark:group-hover:text-sky-400">
                {item.titulo}
              </h3>
              <p className="mt-1.5 line-clamp-3 flex-1 text-xs leading-relaxed text-muted-foreground">
                {item.resumo}
              </p>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2.5">
                <span className="font-clinical text-[10px] uppercase tracking-wider text-muted-foreground">
                  {item.totalEstudos} inc · {item.totalEstruturas} estr
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-sky-500 transition group-hover:translate-x-0.5" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

/* ─────────────────────────── Nível 2: incidências ─────────────────────────── */

function DetalheRegiao({
  regiao,
  titulo,
  estudos,
  onVoltar,
}: {
  regiao: RegiaoRaioX
  titulo: string
  estudos: EstudoRaioX[]
  onVoltar: () => void
}) {
  const guia = GUIAS_RAIO_X[regiao]

  return (
    <section>
      <button
        type="button"
        onClick={onVoltar}
        className="-m-2 mb-4 inline-flex items-center gap-1.5 rounded-lg p-2 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Todas as regiões
      </button>

      <div className="rx-entra mb-6 rounded-2xl border border-sky-500/20 bg-sky-500/[0.04] p-5">
        <p className="editorial-mark">Passo 2 de 2 · {estudos.length} incidências</p>
        <h2 className="mt-1.5 font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          {titulo}
        </h2>
        <p className="mt-2.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {guia.contexto}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {estudos.map((estudo, indice) => (
          <CardEstudo key={estudo.id} estudo={estudo} indice={indice} />
        ))}
      </div>
    </section>
  )
}

function CardEstudo({ estudo, indice }: { estudo: EstudoRaioX; indice: number }) {
  const aquecido = useRef(false)

  // O `prefetch` do Link busca o HTML; a radiografia continuaria começando do
  // zero no clique. Passar o mouse sobre o card já puxa o filme na resolução do
  // viewer, então abrir o estudo costuma encontrá-lo pronto no cache.
  const aquecerFilme = useCallback(() => {
    if (aquecido.current) return
    aquecido.current = true
    const imagem = new window.Image()
    imagem.src = urlFilme(estudo.imagem, 1080, 78)
  }, [estudo.imagem])

  return (
    <Link
      href={`/manual-clinico/radiologia/raio-x/${estudo.id}`}
      prefetch
      onMouseEnter={aquecerFilme}
      onFocus={aquecerFilme}
      style={{ ['--rx-i' as string]: indice }}
      className="rx-entra group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/10"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-black">
        <FilmeImagem
          src={estudo.imagem}
          alt={`Radiografia de ${estudo.titulo} em ${estudo.incidencia}`}
          larguraMobile={384}
          larguraDesktop={384}
          qualidade={65}
          comEsqueleto
          className="absolute inset-0 h-full w-full object-contain transition duration-700 group-hover:scale-[1.04]"
        />
        <CantosFilme />
        <span className="absolute left-3 top-3 rounded-full border border-sky-300/25 bg-black/70 px-2.5 py-1 font-clinical text-[10px] font-bold uppercase tracking-widest text-sky-200 backdrop-blur">
          {estudo.incidencia}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
          {estudo.camada}
        </p>
        <h3 className="mt-1 font-heading font-semibold leading-snug">{estudo.titulo}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-muted-foreground">
          {estudo.resumo}
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
          <span className="font-clinical text-[10px] uppercase tracking-wider text-muted-foreground">
            {estudo.estruturas.length} estruturas
          </span>
          <span className="inline-flex items-center gap-1 font-bold text-sky-600 dark:text-sky-400">
            Abrir <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

/* ──────────────────────────────── Busca ──────────────────────────────── */

function ResultadosBusca({
  termo,
  estruturas,
  estudos,
  onLimpar,
}: {
  termo: string
  estruturas: ReturnType<typeof buscarEstruturasRaioX>
  estudos: EstudoRaioX[]
  onLimpar: () => void
}) {
  const vazio = estruturas.length === 0 && estudos.length === 0

  if (vazio) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-16 text-center">
        <Search className="mx-auto h-8 w-8 text-muted-foreground/30" />
        <p className="mt-3 text-sm text-muted-foreground">
          Nada encontrado para <strong className="text-foreground">{termo}</strong>.
        </p>
        <button
          type="button"
          onClick={onLimpar}
          className="mt-4 rounded-full border border-border px-4 py-1.5 text-xs font-bold transition hover:border-sky-500/50"
        >
          Limpar busca
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {estruturas.length > 0 && (
        <section>
          <h2 className="editorial-mark mb-3">
            {estruturas.length} estrutura{estruturas.length === 1 ? '' : 's'} · abre já demarcada
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {estruturas.map(({ estudo, estrutura }, indice) => (
              <Link
                key={`${estudo.id}-${estrutura.slug}`}
                href={`/manual-clinico/radiologia/raio-x/${estudo.id}?estrutura=${estrutura.slug}`}
                prefetch={false}
                style={{ ['--rx-i' as string]: Math.min(indice, 10) }}
                className="rx-entra group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition hover:border-sky-500/50 hover:bg-sky-500/[0.04]"
              >
                <ScanLine className="h-4 w-4 shrink-0 text-sky-500" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{estrutura.nome}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    <em>{estrutura.original}</em> · {estudo.regiaoTitulo} · {estudo.titulo} (
                    {estudo.incidencia})
                  </span>
                </span>
                <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition group-hover:text-sky-500" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {estudos.length > 0 && (
        <section>
          <h2 className="editorial-mark mb-3">
            {estudos.length} incidência{estudos.length === 1 ? '' : 's'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {estudos.map((estudo, indice) => (
              <CardEstudo key={estudo.id} estudo={estudo} indice={Math.min(indice, 10)} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

/* ─────────────────────────────── Créditos ─────────────────────────────── */

function Creditos() {
  return (
    <div className="mt-12 rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-4 text-xs leading-relaxed text-muted-foreground">
      <p className="font-bold text-foreground">Fonte visual e autorização</p>
      <p className="mt-1">
        {CREDITO_CLINICAL_ANATOMY.nota} Documento {CREDITO_CLINICAL_ANATOMY.autorizacao}.{' '}
        <a
          href={CREDITO_CLINICAL_ANATOMY.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-sky-600 underline underline-offset-2 dark:text-sky-400"
        >
          Abrir atlas original <ExternalLink className="h-3 w-3" />
        </a>
      </p>
    </div>
  )
}
