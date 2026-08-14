'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  ChevronRight,
  CornerDownLeft,
  ImageIcon,
  LayoutGrid,
  Play,
  ScanLine,
  Search,
  Stethoscope,
  Target,
  X,
} from 'lucide-react'
import { LogoRadiologia } from '@/components/radiologia/logo'
import { CantosFilme, FilmeImagem, urlFilme } from '@/components/radiologia/filme'
import { filtrarEstruturas, filtrarEstudos } from '@/lib/radiologia/busca-catalogo'
import type {
  AchadoEstrutura,
} from '@/lib/radiologia/busca-catalogo'
import type {
  CatalogoRaioX as Catalogo,
  EstudoResumo,
  RegiaoResumo,
} from '@/lib/radiologia/catalogo'

type IdRegiao = RegiaoResumo['id']

/**
 * O catálogo chega pronto do servidor.
 *
 * Antes este componente importava `lib/radiologia/raio-x`, e com ele os 172 KB
 * do acervo — inclusive o dossiê aprofundado de cada uma das ~200 estruturas,
 * que a tela de catálogo nunca exibe. Tudo isso era baixado, analisado e
 * executado pelo navegador antes do primeiro pixel. Agora o servidor manda só
 * o recorte que a navegação usa, e este arquivo não carrega dado nenhum.
 */
export function CatalogoRaioX({ catalogo }: { catalogo: Catalogo }) {
  const [busca, setBusca] = useState('')
  const [regiao, setRegiao] = useState<IdRegiao | null>(null)
  const campoBusca = useRef<HTMLInputElement | null>(null)

  const lerRegiaoDaUrl = useCallback((): IdRegiao | null => {
    if (typeof window === 'undefined') return null
    const bruta = new URLSearchParams(window.location.search).get('regiao')
    return bruta && catalogo.regioes.some((item) => item.id === bruta) ? (bruta as IdRegiao) : null
  }, [catalogo])

  // A região vive na URL para o botão "voltar" do navegador funcionar depois de
  // entrar num estudo. `history` direto em vez do router: trocar de região é
  // filtro local e não deve custar um round-trip ao servidor.
  useEffect(() => {
    setRegiao(lerRegiaoDaUrl())
    const aoVoltar = () => setRegiao(lerRegiaoDaUrl())
    window.addEventListener('popstate', aoVoltar)
    return () => window.removeEventListener('popstate', aoVoltar)
  }, [lerRegiaoDaUrl])

  const escolherRegiao = useCallback((proxima: IdRegiao | null) => {
    setRegiao(proxima)
    setBusca('')
    const url = proxima ? `?regiao=${proxima}` : window.location.pathname
    window.history.pushState(null, '', url)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const termo = busca.trim()
  const buscando = termo.length > 0
  const estudosEncontrados = useMemo(
    () => (buscando ? filtrarEstudos(catalogo, termo) : []),
    [buscando, catalogo, termo],
  )
  const estruturasEncontradas = useMemo(
    () => (buscando ? filtrarEstruturas(catalogo, termo) : []),
    [buscando, catalogo, termo],
  )

  const regiaoAtual = regiao ? catalogo.regioes.find((item) => item.id === regiao) ?? null : null
  const estudosDaRegiaoAtual = useMemo(
    () => (regiao ? catalogo.estudos.filter((estudo) => estudo.regiao === regiao) : []),
    [catalogo, regiao],
  )

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
        catalogo={catalogo}
        busca={busca}
        onBusca={setBusca}
        campoBusca={campoBusca}
        regiao={regiao}
        onRegiao={escolherRegiao}
      />

      <main className="container mx-auto max-w-6xl px-4 pb-16 pt-7 sm:pt-9">
        {!buscando && !regiaoAtual && (
          <Link href="/manual-clinico/radiologia/raio-x/casos" className="group mb-8 grid gap-4 overflow-hidden rounded-2xl border border-sky-500/25 bg-gradient-to-br from-sky-500/[0.09] via-card to-violet-500/[0.07] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/10 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500 text-white shadow-lg shadow-sky-500/20"><BookOpenCheck className="h-5 w-5" /></span>
            <span>
              <span className="block text-[10px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400">Nova seção · tórax</span>
              <strong className="mt-1 block font-heading text-lg font-semibold sm:text-xl">Casos e alterações no Raio-X</strong>
              <span className="mt-1.5 block max-w-3xl text-xs leading-relaxed text-muted-foreground sm:text-sm">Cardiomegalia, edema pulmonar, pneumotórax, câncer, mediastino, colapsos, variantes e dispositivos em filmes limpos e marcados, com comparação interativa.</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400">Abrir casos <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
          </Link>
        )}
        {!buscando && !regiaoAtual && (
          <Link href="/manual-clinico/radiologia/raio-x/casos/quiz" className="group mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-sky-500/30 bg-sky-500/[0.05] p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-500/60 hover:shadow-lg hover:shadow-sky-500/10 sm:flex-nowrap sm:p-5">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white shadow-lg shadow-sky-500/20"><Stethoscope className="h-[18px] w-[18px]" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400">Novo · casos clínicos</span>
              <strong className="mt-0.5 block font-heading text-base font-semibold sm:text-lg">O paciente entrou. O que a radiografia mostra?</strong>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground sm:text-sm">A consulta inteira — queixa, história, antecedentes, sinais vitais e exame físico —, o filme de tórax limpo para você identificar o achado e, depois da resposta, o mesmo filme marcado com o comentário aprofundado.</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400">Abrir plantão <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
          </Link>
        )}
        {!buscando && !regiaoAtual && (
          <Link href="/manual-clinico/radiologia/raio-x/quiz" className="group mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/10 sm:flex-nowrap sm:p-5">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400"><Play className="h-[18px] w-[18px]" /></span>
            <span className="min-w-0 flex-1">
              <strong className="block font-heading text-base font-semibold sm:text-lg">Quizzes: identifique a estrutura marcada</strong>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground sm:text-sm">As mesmas demarcações, no sentido inverso — o filme abre com a estrutura acesa e você diz o nome, com resposta comentada aprofundada e o porquê de cada alternativa errada.</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400">Treinar <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
          </Link>
        )}
        {buscando ? (
          <ResultadosBusca
            termo={termo}
            estruturas={estruturasEncontradas}
            estudos={estudosEncontrados}
            onLimpar={() => setBusca('')}
          />
        ) : regiaoAtual ? (
          <DetalheRegiao
            regiao={regiaoAtual}
            estudos={estudosDaRegiaoAtual}
            onVoltar={() => escolherRegiao(null)}
          />
        ) : (
          <GradeRegioes regioes={catalogo.regioes} onEscolher={escolherRegiao} />
        )}
      </main>
    </div>
  )
}

/* ─────────────────────────────── Cabeçalho ─────────────────────────────── */

function Cabecalho({
  catalogo,
  busca,
  onBusca,
  campoBusca,
  regiao,
  onRegiao,
}: {
  catalogo: Catalogo
  busca: string
  onBusca: (valor: string) => void
  campoBusca: React.MutableRefObject<HTMLInputElement | null>
  regiao: IdRegiao | null
  onRegiao: (regiao: IdRegiao | null) => void
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
              <Selo icone={LayoutGrid} texto={`${catalogo.regioes.length} regiões`} />
              <Selo icone={ImageIcon} texto={`${catalogo.estudos.length} incidências`} />
              <Selo icone={Target} texto={`${catalogo.totalEstruturas} demarcações`} />
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

      <TrilhaRegioes regioes={catalogo.regioes} regiao={regiao} onRegiao={onRegiao} />
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
  regioes,
  regiao,
  onRegiao,
}: {
  regioes: RegiaoResumo[]
  regiao: IdRegiao | null
  onRegiao: (regiao: IdRegiao | null) => void
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
          {regioes.map((item) => (
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

function GradeRegioes({
  regioes,
  onEscolher,
}: {
  regioes: RegiaoResumo[]
  onEscolher: (regiao: IdRegiao) => void
}) {
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
        {regioes.map((item, indice) => (
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
  estudos,
  onVoltar,
}: {
  regiao: RegiaoResumo
  estudos: EstudoResumo[]
  onVoltar: () => void
}) {
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
          {regiao.titulo}
        </h2>
        <p className="mt-2.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {regiao.contexto}
        </p>

        {/* O quiz de região só existe onde há mais de uma incidência — com uma
            só, ele seria idêntico ao quiz da própria incidência. */}
        <Link
          href={`/manual-clinico/radiologia/raio-x/quiz/${estudos.length > 1 ? regiao.id : estudos[0]?.id ?? ''}`}
          prefetch={false}
          className="group mt-4 inline-flex items-center gap-2 rounded-lg border border-sky-500/40 bg-card px-3.5 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-500/10 dark:text-sky-300"
        >
          <Play className="h-3.5 w-3.5" />
          Testar {regiao.titulo.toLowerCase()}: {regiao.totalEstruturas} estruturas marcadas
          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {estudos.map((estudo, indice) => (
          <CardEstudo key={estudo.id} estudo={estudo} indice={indice} />
        ))}
      </div>
    </section>
  )
}

function CardEstudo({ estudo, indice }: { estudo: EstudoResumo; indice: number }) {
  const aquecido = useRef(false)

  // O `prefetch` do Link busca o HTML; passar o mouse sobre o card também aquece
  // a variante WebP local usada pelo viewer, então o estudo costuma abrir com
  // a radiografia já pronta no cache do navegador.
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
  estruturas: AchadoEstrutura[]
  estudos: EstudoResumo[]
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
