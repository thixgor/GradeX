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
import { FichaEstrutura, FichaVazia } from '@/components/anatomia/ficha-estrutura'
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

/* ══════════════════════════ Área de estudo ══════════════════════════ */

interface Resultado {
  colecao: Colecao
  peca: AtlasPiece
  indicePeca: number
  indiceMarcador: number
  titulo: string
}

function AreaDeEstudo({ sistema, onTrocarSistema }: { sistema: AtlasSystem; onTrocarSistema: () => void }) {
  const colecoes = useMemo(() => folhas(sistema), [sistema])
  const [slugColecao, setSlugColecao] = useState(() => colecoes[0]?.slug || '')
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

  useEffect(() => {
    setSlugColecao(colecoes[0]?.slug || '')
    setIndicePeca(0)
    setIndiceMarcador(null)
    setBusca('')
  }, [colecoes])

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
    setSlugColecao(resultado.colecao.slug)
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
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Atlas de Anatomia</p>
            <h1 className="truncate font-heading text-base font-semibold leading-tight sm:text-lg">{sistema.title}</h1>
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
                          setSlugColecao(item.slug)
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
                  <FichaEstrutura titulo={marcador.title} numero={(indiceMarcador || 0) + 1} insight={insight} />
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
              <FichaEstrutura titulo={marcador.title} numero={(indiceMarcador || 0) + 1} insight={insight} />
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
                <FichaEstrutura titulo={marcador.title} numero={(indiceMarcador || 0) + 1} insight={insight} compacta />
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
  const slug = parametros.get('sistema')
  const sistema = ATLAS_SYSTEMS.find(item => item.slug === slug) || null

  // O sistema vive na URL: assim o aluno consegue voltar, compartilhar o link e
  // chegar direto de um atalho da página inicial da seção.
  function abrir(proximo: AtlasSystem | null) {
    router.replace(proximo ? `/anatomia/atlas-anatomia?sistema=${proximo.slug}` : '/anatomia/atlas-anatomia', {
      scroll: true,
    })
  }

  if (!sistema) return <EscolhaDeSistema onEscolher={abrir} />
  return <AreaDeEstudo key={sistema.slug} sistema={sistema} onTrocarSistema={() => abrir(null)} />
}

