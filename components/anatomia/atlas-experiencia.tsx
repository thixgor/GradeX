'use client'

/**
 * Experiência completa do Atlas de Anatomia.
 *
 * Vive fora da página de propósito: é aqui que entram o catálogo do acervo
 * (quase 900 KB de JSON) e todo o visualizador. A página só monta este
 * componente depois que o servidor confirma a assinatura, então quem cai na
 * landing de vendas nunca baixa o produto.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { PranchaInterativa } from '@/components/anatomia/prancha-interativa'
import { FichaMarcador, FichaVazia } from '@/components/anatomia/ficha-estrutura'
import {
  ATLAS_CATALOG,
  ATLAS_SYSTEMS,
  ATLAS_TOTALS,
  flattenCollections,
  type AtlasCollection,
  type AtlasPiece,
  type AtlasSystem,
} from '@/lib/atlas-anatomia/catalogo'
import { getMarkerInsight } from '@/lib/atlas-anatomia/insights'
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  GraduationCap,
  Layers,
  LayoutGrid,
  Search,
  Sparkles,
  X,
} from 'lucide-react'

type Colecao = AtlasCollection & { breadcrumb: string[] }

const normalizar = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

function folhas(sistema: AtlasSystem): Colecao[] {
  return flattenCollections(sistema.collections).filter(colecao => colecao.pieces?.length)
}

interface Regiao {
  /** `null` quando a própria coleção é a região (sistemas sem subdivisão). */
  titulo: string | null
  colecoes: Colecao[]
  pranchas: number
  marcadores: number
}

/**
 * Agrupa as coleções do sistema pela primeira parte do caminho.
 *
 * O acervo é irregular de propósito: o esquelético se divide em Crânio, Tronco
 * e membros, enquanto o respiratório vai direto em Nariz, Faringe, Laringe.
 * Aqui os dois casos viram a mesma coisa — uma lista de regiões —, e é isso que
 * permite oferecer o mesmo passo de escolha para os dez sistemas.
 */
function regioes(colecoes: Colecao[]): Regiao[] {
  const ordem: string[] = []
  const mapa = new Map<string, Colecao[]>()

  for (const colecao of colecoes) {
    // Sem subdivisão, a coleção é a própria região — a chave usa o slug para
    // duas coleções de mesmo nome não se fundirem.
    const chave = colecao.breadcrumb.length > 1 ? colecao.breadcrumb[0] : `\u0000${colecao.slug}`
    if (!mapa.has(chave)) {
      mapa.set(chave, [])
      ordem.push(chave)
    }
    mapa.get(chave)!.push(colecao)
  }

  return ordem.map(chave => {
    const itens = mapa.get(chave)!
    return {
      titulo: chave.startsWith('\u0000') ? null : chave,
      colecoes: itens,
      pranchas: itens.reduce((total, item) => total + (item.pieces?.length || 0), 0),
      marcadores: itens.reduce(
        (total, item) => total + (item.pieces || []).reduce((soma, peca) => soma + peca.markers.length, 0),
        0,
      ),
    }
  })
}

function contarPranchas(sistema: AtlasSystem) {
  return folhas(sistema).reduce((total, colecao) => total + (colecao.pieces?.length || 0), 0)
}

/* ══════════════════════════ Escolha do sistema ══════════════════════════ */

function CartaoSistema({ sistema, onAbrir }: { sistema: AtlasSystem; onAbrir: () => void }) {
  const pranchas = contarPranchas(sistema)
  const colecoes = folhas(sistema).length

  return (
    <button
      type="button"
      onClick={onAbrir}
      className="group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-left shadow-lg transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <Image
        src={sistema.cover}
        alt=""
        fill
        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 240px"
        className="object-cover opacity-70 transition duration-700 group-hover:scale-110 group-hover:opacity-90"
      />
      {/* A capa do acervo traz o nome do sistema impresso em corpo grande; o
          escurecimento deixa a imagem falar e o rótulo do card ser lido. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" aria-hidden />
      <div className="relative p-3.5 sm:p-4">
        <h3 className="font-heading text-lg font-semibold leading-tight tracking-tight text-white sm:text-xl">
          {sistema.title}
        </h3>
        <p className="mt-1 text-[11px] font-medium text-white/60">
          {pranchas} prancha{pranchas !== 1 ? 's' : ''} · {colecoes} coleç{colecoes !== 1 ? 'ões' : 'ão'}
        </p>
        <span className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-primary-foreground/90">
          <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur transition group-hover:bg-white/25">
            Explorar <ArrowRight className="ml-0.5 inline h-3 w-3" />
          </span>
        </span>
      </div>
    </button>
  )
}

function EscolhaDeSistema({ onEscolher }: { onEscolher: (sistema: AtlasSystem) => void }) {
  return (
    <main className="surface-page min-h-screen">
      <header className="relative overflow-hidden border-b border-border bg-slate-950">
        <div className="absolute inset-0 grid grid-cols-5 opacity-25" aria-hidden>
          {ATLAS_SYSTEMS.slice(0, 5).map(sistema => (
            <div key={sistema.slug} className="relative">
              <Image src={sistema.cover} alt="" fill sizes="20vw" className="object-cover" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/60" aria-hidden />

        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-7 sm:pb-14 sm:pt-9">
          <Link
            href="/anatomia"
            className="mb-7 inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Domine Anatomia
          </Link>
          <div className="mb-3">
            <p className="editorial-mark !text-amber-300">Atlas de Anatomia · acervo UFJF</p>
          </div>
          <h1 className="font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
            Escolha o sistema
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
            {ATLAS_TOTALS.pieces} pranchas reais com {ATLAS_TOTALS.markers.toLocaleString('pt-BR')} estruturas marcadas.
            Toque em qualquer marcador e receba localização, função, vascularização, inervação e correlação clínica.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold text-white/70">
            {[
              `${ATLAS_SYSTEMS.length} sistemas`,
              `${ATLAS_TOTALS.pieces} pranchas`,
              `${ATLAS_TOTALS.markers.toLocaleString('pt-BR')} marcadores`,
            ].map(rotulo => (
              <span key={rotulo} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur">
                {rotulo}
              </span>
            ))}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {ATLAS_SYSTEMS.map(sistema => (
            <CartaoSistema key={sistema.slug} sistema={sistema} onAbrir={() => onEscolher(sistema)} />
          ))}
        </div>
        <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
          Acervo: {ATLAS_CATALOG.source.name}. Uso integral autorizado ao Domine Aqui em 12/08/2026. Os aprofundamentos
          de cada estrutura são conteúdo editorial do GradeX.
        </p>
      </section>
    </main>
  )
}

/* ══════════════════════════ Escolha da região ══════════════════════════ */

/**
 * Passo entre o sistema e a prancha.
 *
 * Antes, escolher "Esquelético" jogava o aluno direto na primeira coleção do
 * crânio, e a existência de Tronco, Membro Superior e Membro Inferior só ficava
 * visível para quem abrisse o índice lateral. Agora o sistema mostra do que ele
 * é feito, e o aluno escolhe por onde entrar.
 */
function EscolhaDeRegiao({
  sistema,
  onAbrirColecao,
  onTrocarSistema,
}: {
  sistema: AtlasSystem
  onAbrirColecao: (slug: string) => void
  onTrocarSistema: () => void
}) {
  const listaRegioes = useMemo(() => regioes(folhas(sistema)), [sistema])
  const totalPranchas = listaRegioes.reduce((total, regiao) => total + regiao.pranchas, 0)
  const totalMarcadores = listaRegioes.reduce((total, regiao) => total + regiao.marcadores, 0)

  return (
    <main className="surface-page min-h-screen">
      <header className="relative isolate overflow-hidden border-b border-border bg-slate-950">
        <Image
          src={sistema.cover}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/55" aria-hidden />

        <div className="relative mx-auto max-w-6xl px-4 pb-9 pt-7 sm:pb-12 sm:pt-9">
          <button
            type="button"
            onClick={onTrocarSistema}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/55 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Todos os sistemas
          </button>

          <div className="mb-3">
            <p className="editorial-mark !text-amber-300">Sistema {sistema.title}</p>
          </div>
          <h1 className="font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl">
            Por onde você quer começar?
          </h1>
          <p className="mt-3.5 max-w-2xl text-base leading-relaxed text-white/65">
            {listaRegioes.length} {listaRegioes.length === 1 ? 'região' : 'regiões'} · {totalPranchas} pranchas ·{' '}
            {totalMarcadores.toLocaleString('pt-BR')} estruturas marcadas.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-7 sm:py-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {listaRegioes.map(regiao => {
            // Região sem subdivisão abre a prancha direto: um clique, não dois.
            if (!regiao.titulo) {
              const unica = regiao.colecoes[0]
              return (
                <button
                  key={unica.slug}
                  type="button"
                  onClick={() => onAbrirColecao(unica.slug)}
                  className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-lg"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Layers className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-heading text-lg font-semibold leading-tight tracking-tight">
                      {unica.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {regiao.pranchas} prancha{regiao.pranchas !== 1 ? 's' : ''} ·{' '}
                      {regiao.marcadores.toLocaleString('pt-BR')} estruturas
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              )
            }

            return (
              <div
                key={regiao.titulo}
                className="flex flex-col rounded-2xl border border-border bg-card p-4 transition hover:border-primary/35"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Layers className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-heading text-lg font-semibold leading-tight tracking-tight">{regiao.titulo}</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {regiao.colecoes.length} coleç{regiao.colecoes.length !== 1 ? 'ões' : 'ão'} ·{' '}
                      {regiao.pranchas} pranchas
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  {regiao.colecoes.map(colecao => (
                    <button
                      key={colecao.slug}
                      type="button"
                      onClick={() => onAbrirColecao(colecao.slug)}
                      className="group flex w-full items-center justify-between gap-2 rounded-xl border border-transparent bg-muted/40 px-3 py-2 text-left transition hover:border-primary/30 hover:bg-primary/10"
                    >
                      <span className="min-w-0 truncate text-[13px] font-semibold">{colecao.title}</span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <span className="rounded-md bg-background px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-muted-foreground">
                          {colecao.pieces?.length || 0}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}

/* ══════════════════════════ Área de estudo ══════════════════════════ */

interface Resultado {
  colecao: Colecao
  peca: AtlasPiece
  indicePeca: number
  indiceMarcador: number
  titulo: string
}

function AreaDeEstudo({
  sistema,
  slugColecao,
  onAbrirColecao,
  onVoltarParaRegioes,
  onTrocarSistema,
}: {
  sistema: AtlasSystem
  slugColecao: string
  onAbrirColecao: (slug: string) => void
  onVoltarParaRegioes: () => void
  onTrocarSistema: () => void
}) {
  const colecoes = useMemo(() => folhas(sistema), [sistema])
  const [indicePeca, setIndicePeca] = useState(0)
  const [indiceMarcador, setIndiceMarcador] = useState<number | null>(null)
  const [busca, setBusca] = useState('')
  const [modoEstudo, setModoEstudo] = useState(false)
  const [gavetaAberta, setGavetaAberta] = useState(false)
  const [indiceVisivel, setIndiceVisivel] = useState(false)
  const palcoRef = useRef<HTMLDivElement>(null)

  const colecao = colecoes.find(item => item.slug === slugColecao) || colecoes[0] || null
  const pecas = colecao?.pieces || []
  const peca: AtlasPiece | null = pecas[indicePeca] || pecas[0] || null
  const marcador = indiceMarcador === null ? null : peca?.markers[indiceMarcador] || null

  const insight = useMemo(() => {
    if (!marcador || !colecao) return null
    return getMarkerInsight(marcador, {
      sistema: sistema.slug,
      caminho: colecao.breadcrumb,
      prancha: peca?.title,
    })
  }, [marcador, colecao, sistema.slug, peca?.title])

  /** Busca por estrutura em todo o sistema, e não só na coleção aberta. */
  const resultados = useMemo<Resultado[]>(() => {
    const termo = normalizar(busca)
    if (termo.length < 2) return []
    const encontrados: Resultado[] = []
    for (const item of colecoes) {
      ;(item.pieces || []).forEach((umaPeca, posicaoPeca) => {
        umaPeca.markers.forEach((umMarcador, posicaoMarcador) => {
          if (encontrados.length >= 40) return
          if (normalizar(umMarcador.title).includes(termo)) {
            encontrados.push({
              colecao: item,
              peca: umaPeca,
              indicePeca: posicaoPeca,
              indiceMarcador: posicaoMarcador,
              titulo: umMarcador.title,
            })
          }
        })
      })
    }
    return encontrados
  }, [busca, colecoes])

  const selecionarMarcador = useCallback((indice: number | null) => {
    setIndiceMarcador(indice)
    setGavetaAberta(indice !== null)
  }, [])

  const trocarPeca = useCallback(
    (indice: number) => {
      setIndicePeca(Math.min(Math.max(indice, 0), Math.max(pecas.length - 1, 0)))
      setIndiceMarcador(null)
      setGavetaAberta(false)
    },
    [pecas.length],
  )

  function abrirResultado(resultado: Resultado) {
    if (resultado.colecao.slug !== slugColecao) onAbrirColecao(resultado.colecao.slug)
    setIndicePeca(resultado.indicePeca)
    setIndiceMarcador(resultado.indiceMarcador)
    setGavetaAberta(true)
    setBusca('')
    palcoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Setas trocam de prancha e Esc fecha a ficha — atalhos esperados num visualizador.
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      const alvo = evento.target as HTMLElement | null
      if (alvo && ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName)) return
      if (evento.key === 'ArrowRight') trocarPeca(indicePeca + 1)
      else if (evento.key === 'ArrowLeft') trocarPeca(indicePeca - 1)
      else if (evento.key === 'Escape') selecionarMarcador(null)
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [indicePeca, trocarPeca, selecionarMarcador])

  const agrupadas = useMemo(() => {
    const grupos = new Map<string, Colecao[]>()
    for (const item of colecoes) {
      const grupo = item.breadcrumb.length > 1 ? item.breadcrumb[0] : 'Coleções'
      grupos.set(grupo, [...(grupos.get(grupo) || []), item])
    }
    return [...grupos.entries()]
  }, [colecoes])

  return (
    <main className="surface-page min-h-screen pb-24 xl:pb-0">
      {/* ── Barra superior ── */}
      {/* O AppShell mantém controles flutuantes fixos nos cantos superiores
          (menu à esquerda abaixo de `lg`, tema e modo leve à direita). A barra
          reserva esse espaço para não ter botão coberto em nenhuma largura. */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-[1600px] items-center gap-2 py-2.5 pl-[3.75rem] pr-[9.75rem] sm:gap-3 sm:py-3 lg:pl-4">
          <button
            type="button"
            onClick={onTrocarSistema}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Sistemas</span>
          </button>

          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={onVoltarParaRegioes}
              className="flex max-w-full items-center gap-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary transition hover:text-primary/75"
            >
              <span className="truncate">{sistema.title}</span>
              <ChevronRight className="h-3 w-3 shrink-0 opacity-60" />
              <span className="hidden shrink-0 sm:inline">regiões</span>
            </button>
            <h1 className="truncate font-heading text-base font-semibold leading-tight sm:text-lg">
              {colecao?.title || sistema.title}
            </h1>
          </div>

          <div className="relative hidden min-w-0 max-w-sm flex-1 lg:block">
            <BuscaDeEstrutura valor={busca} onMudar={setBusca} resultados={resultados} onAbrir={abrirResultado} />
          </div>

          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <BotaoModoEstudo ativo={modoEstudo} onClick={() => setModoEstudo(atual => !atual)} />
            <BotaoIndice ativo={indiceVisivel} onClick={() => setIndiceVisivel(atual => !atual)} />
          </div>
        </div>

        {/* Em telas estreitas, busca e ações descem para uma segunda linha, que
            usa a largura inteira sem disputar espaço com os flutuantes. */}
        <div className="flex items-center gap-2 border-t border-border px-3 py-2 lg:hidden">
          <div className="min-w-0 flex-1">
            <BuscaDeEstrutura valor={busca} onMudar={setBusca} resultados={resultados} onAbrir={abrirResultado} />
          </div>
          <div className="flex shrink-0 items-center gap-2 md:hidden">
            <BotaoModoEstudo ativo={modoEstudo} onClick={() => setModoEstudo(atual => !atual)} />
            <BotaoIndice ativo={indiceVisivel} onClick={() => setIndiceVisivel(atual => !atual)} />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-4 px-3 py-4 sm:px-4 sm:py-5 xl:grid-cols-[264px_minmax(0,1fr)_390px]">
        {/* ── Índice de coleções ── */}
        <aside
          className={`${indiceVisivel ? 'block' : 'hidden'} xl:block xl:sticky xl:top-[76px] xl:max-h-[calc(100vh-92px)] xl:overflow-y-auto`}
        >
          <nav className="rounded-2xl border border-border bg-card p-2">
            {agrupadas.map(([grupo, itens]) => (
              <div key={grupo} className="mb-2 last:mb-0">
                <p className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground/70">
                  {grupo}
                </p>
                <div className="space-y-0.5">
                  {itens.map(item => {
                    const ativa = item.slug === colecao?.slug
                    const total = item.pieces?.length || 0
                    return (
                      <button
                        key={item.slug}
                        type="button"
                        onClick={() => {
                          onAbrirColecao(item.slug)
                          setIndicePeca(0)
                          setIndiceMarcador(null)
                          setIndiceVisivel(false)
                        }}
                        className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left transition ${
                          ativa
                            ? 'bg-primary/12 text-foreground ring-1 ring-inset ring-primary/25'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                        }`}
                      >
                        <span className="min-w-0 truncate text-[13px] font-semibold leading-tight">{item.title}</span>
                        <span
                          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                            ativa ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground/70'
                          }`}
                        >
                          {total}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* ── Palco ── */}
        <section ref={palcoRef} className="min-w-0 scroll-mt-24">
          {colecao && peca ? (
            <>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {colecao.breadcrumb.slice(0, -1).join(' · ') || sistema.title}
                  </p>
                  <h2 className="font-heading text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
                    {colecao.title}
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">{peca.title}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                  <Layers className="h-3.5 w-3.5" />
                  {indicePeca + 1} / {pecas.length}
                </span>
              </div>

              <PranchaInterativa
                imagem={peca.image}
                alt={`${colecao.title}: ${peca.title}`}
                marcadores={peca.markers}
                indiceAtivo={indiceMarcador}
                onSelecionar={selecionarMarcador}
                modoEstudo={modoEstudo}
                chaveDaPeca={peca.id}
                prioridade
              />

              {/* Navegação entre pranchas */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => trocarPeca(indicePeca - 1)}
                  disabled={indicePeca === 0}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Prancha anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {pecas.map((item, indice) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => trocarPeca(indice)}
                      title={item.title}
                      className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-slate-950 transition ${
                        indice === indicePeca
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-border opacity-60 hover:opacity-100'
                      }`}
                    >
                      <Image src={item.image} alt="" fill sizes="56px" className="object-contain" />
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => trocarPeca(indicePeca + 1)}
                  disabled={indicePeca >= pecas.length - 1}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Próxima prancha"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Lista de estruturas da prancha */}
              <div className="mt-4 rounded-2xl border border-border bg-card p-3 sm:p-4">
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                    Estruturas desta prancha
                  </h3>
                  <span className="text-[11px] font-bold text-muted-foreground/70">{peca.markers.length}</span>
                </div>
                {peca.markers.length === 0 ? (
                  <p className="py-2 text-sm text-muted-foreground">Esta prancha não tem marcadores no acervo.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {peca.markers.map((item, indice) => {
                      const ativo = indice === indiceMarcador
                      return (
                        <button
                          key={`${item.title}-${indice}`}
                          type="button"
                          onClick={() => selecionarMarcador(ativo ? null : indice)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left text-xs font-medium transition ${
                            ativo
                              ? 'border-amber-500/50 bg-amber-500/15 text-amber-800 dark:text-amber-200'
                              : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-black tabular-nums ${
                              ativo ? 'bg-amber-500 text-amber-950' : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {indice + 1}
                          </span>
                          {modoEstudo && !ativo ? '• • •' : item.title}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Ficha embutida em telas médias (a lateral só existe no xl) */}
              <div className="mt-4 xl:hidden">
                {insight && marcador ? (
                  <FichaMarcador
                    titulo={marcador.title}
                    numero={(indiceMarcador || 0) + 1}
                    insight={insight}
                    chave={`${peca?.id}:${indiceMarcador}`}
                  />
                ) : (
                  <FichaVazia compacta />
                )}
              </div>
            </>
          ) : (
            <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
              Escolha uma coleção no índice para abrir as pranchas.
            </div>
          )}
        </section>

        {/* ── Ficha (desktop largo) ── */}
        <aside className="hidden xl:block">
          <div className="sticky top-[76px] max-h-[calc(100vh-92px)] overflow-y-auto pb-4">
            {insight && marcador ? (
              <FichaMarcador
                titulo={marcador.title}
                numero={(indiceMarcador || 0) + 1}
                insight={insight}
                chave={`${peca?.id}:${indiceMarcador}`}
              />
            ) : (
              <FichaVazia />
            )}
            <div className="mt-3 rounded-xl border border-border bg-card p-3">
              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-foreground">
                <GraduationCap className="h-3.5 w-3.5 text-primary" /> Uso educacional
              </p>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Pranchas do acervo da UFJF, com autorização de uso integral. Os aprofundamentos de cada estrutura são
                conteúdo editorial do GradeX e não substituem avaliação clínica.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Gaveta do celular ── */}
      {marcador && insight && (
        <div className={`fixed inset-x-0 bottom-0 z-50 xl:hidden ${gavetaAberta ? '' : 'pointer-events-none'}`}>
          <div
            className={`transition-transform duration-300 ease-out ${gavetaAberta ? 'translate-y-0' : 'translate-y-full'}`}
          >
            <div className="mx-auto max-h-[72vh] max-w-3xl overflow-y-auto rounded-t-3xl border-x border-t border-border bg-card shadow-[0_-8px_40px_rgba(0,0,0,0.28)]">
              <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card/95 px-4 py-2.5 backdrop-blur">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-primary">
                  <Sparkles className="h-3.5 w-3.5" /> Estrutura selecionada
                </span>
                <button
                  type="button"
                  onClick={() => setGavetaAberta(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:text-foreground"
                  aria-label="Fechar ficha"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-3">
                <FichaMarcador
                  titulo={marcador.title}
                  numero={(indiceMarcador || 0) + 1}
                  insight={insight}
                  chave={`${peca?.id}:${indiceMarcador}`}
                  compacta
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function BotaoModoEstudo({ ativo, onClick }: { ativo: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      title="Esconde os números da prancha para você tentar nomear cada estrutura"
      className={`flex h-9 shrink-0 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-bold transition ${
        ativo
          ? 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300'
          : 'border-border bg-card text-muted-foreground hover:text-foreground'
      }`}
    >
      {ativo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      <span className="hidden xl:inline">Modo estudo</span>
    </button>
  )
}

function BotaoIndice({ ativo, onClick }: { ativo: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      aria-label="Abrir índice de coleções"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition xl:hidden ${
        ativo ? 'border-primary/40 bg-primary/12 text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground'
      }`}
    >
      <LayoutGrid className="h-4 w-4" />
    </button>
  )
}

/* ══════════════════════════ Busca ══════════════════════════ */

function BuscaDeEstrutura({
  valor,
  onMudar,
  resultados,
  onAbrir,
}: {
  valor: string
  onMudar: (valor: string) => void
  resultados: Resultado[]
  onAbrir: (resultado: Resultado) => void
}) {
  const [focada, setFocada] = useState(false)
  const aberta = focada && valor.trim().length >= 2

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={valor}
        onChange={evento => onMudar(evento.target.value)}
        onFocus={() => setFocada(true)}
        onBlur={() => window.setTimeout(() => setFocada(false), 150)}
        placeholder="Buscar estrutura neste sistema..."
        aria-label="Buscar estrutura"
        className="h-9 w-full rounded-xl border border-border bg-card pl-9 pr-8 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
      />
      {valor && (
        <button
          type="button"
          onClick={() => onMudar('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
          aria-label="Limpar busca"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {aberta && (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-50 max-h-80 overflow-y-auto rounded-2xl border border-border bg-popover p-1.5 shadow-xl">
          {resultados.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              Nenhuma estrutura encontrada para “{valor}”.
            </p>
          ) : (
            resultados.map(resultado => (
              <button
                key={`${resultado.peca.id}-${resultado.indiceMarcador}`}
                type="button"
                onMouseDown={evento => evento.preventDefault()}
                onClick={() => onAbrir(resultado)}
                className="flex w-full flex-col gap-0.5 rounded-xl px-3 py-2 text-left transition hover:bg-muted"
              >
                <span className="text-sm font-semibold leading-tight">{resultado.titulo}</span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {resultado.colecao.title} · {resultado.peca.title}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════ Página ══════════════════════════ */

export default function AtlasExperiencia() {
  const router = useRouter()
  const parametros = useSearchParams()
  const sistema = ATLAS_SYSTEMS.find(item => item.slug === parametros.get('sistema')) || null
  const slugColecao = parametros.get('colecao') || ''

  // Sistema e coleção vivem na URL. Além de tornar o link compartilhável, é o
  // que faz o botão voltar do navegador desfazer um passo por vez —
  // prancha → regiões → sistemas — em vez de sair da seção de uma vez.
  function navegar(sistemaSlug: string | null, colecaoSlug?: string | null) {
    if (!sistemaSlug) {
      router.push('/anatomia/atlas-anatomia')
      return
    }
    const destino = colecaoSlug
      ? `/anatomia/atlas-anatomia?sistema=${sistemaSlug}&colecao=${colecaoSlug}`
      : `/anatomia/atlas-anatomia?sistema=${sistemaSlug}`
    router.push(destino)
  }

  if (!sistema) return <EscolhaDeSistema onEscolher={proximo => navegar(proximo.slug)} />

  const colecaoValida = folhas(sistema).some(item => item.slug === slugColecao)
  if (!colecaoValida) {
    return (
      <EscolhaDeRegiao
        key={sistema.slug}
        sistema={sistema}
        onAbrirColecao={slug => navegar(sistema.slug, slug)}
        onTrocarSistema={() => navegar(null)}
      />
    )
  }

  return (
    <AreaDeEstudo
      key={`${sistema.slug}:${slugColecao}`}
      sistema={sistema}
      slugColecao={slugColecao}
      onAbrirColecao={slug => navegar(sistema.slug, slug)}
      onVoltarParaRegioes={() => navegar(sistema.slug)}
      onTrocarSistema={() => navegar(null)}
    />
  )
}

