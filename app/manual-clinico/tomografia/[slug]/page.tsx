'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Target,
  GraduationCap,
  Crosshair,
  BookOpen,
  Search,
  X,
  Check,
  Info,
  Lightbulb,
  Syringe,
  RotateCcw,
} from 'lucide-react'
import {
  getSubsecao,
  getSecaoDaSubsecao,
  getVizinhas,
  caminhoDoCorte,
  type EstruturaTC,
} from '@/lib/tomografia'
import { VisualizadorTC, type MarcaCorte } from '@/components/tomografia/visualizador'
import { Dossie } from '@/components/tomografia/dossie'
import { QuizTC } from '@/components/tomografia/quiz'
import { ModoTreino } from '@/components/tomografia/treino'
import {
  COR_CATEGORIA,
  ICONES,
  ICONE_CATEGORIA,
  ICONE_PADRAO,
  ROTULO_CATEGORIA,
  tema,
} from '@/components/tomografia/tema'

type Aba = 'estruturas' | 'roteiro' | 'quiz' | 'treino'

export default function SerieTomografiaPage() {
  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <SerieConteudo />
    </AppShell>
  )
}

function SerieConteudo() {
  const params = useParams<{ slug: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const slug = params?.slug

  const sub = useMemo(() => (slug ? getSubsecao(slug) : undefined), [slug])
  if (!sub) notFound()

  const secao = getSecaoDaSubsecao(sub)
  const { anterior, proxima } = getVizinhas(sub.id)
  const t = tema(sub.cor)
  const Icone = ICONES[sub.icone] || ICONE_PADRAO

  const urls = useMemo(
    () => Array.from({ length: sub.totalCortes }, (_, i) => caminhoDoCorte(sub, i + 1)),
    [sub],
  )

  const [corte, setCorte] = useState(1)
  const [selecionada, setSelecionada] = useState<EstruturaTC | null>(null)
  const [aba, setAba] = useState<Aba>('estruturas')
  const [filtro, setFiltro] = useState('')
  const [estudadas, setEstudadas] = useState<Set<string>>(new Set())
  const [folhaAberta, setFolhaAberta] = useState(false)
  const visorRef = useRef<HTMLDivElement>(null)
  const dossieRef = useRef<HTMLDivElement>(null)

  const chaveProgresso = `tomografia-progresso-${sub.id}`

  // Progresso por série no localStorage. É deliberadamente local: serve para o
  // estudante marcar o que já revisou numa sessão longa, não para sincronizar
  // entre dispositivos — o que exigiria backend e não muda a didática.
  useEffect(() => {
    try {
      const bruto = localStorage.getItem(chaveProgresso)
      setEstudadas(bruto ? new Set(JSON.parse(bruto)) : new Set())
    } catch {
      setEstudadas(new Set())
    }
  }, [chaveProgresso])

  const alternarEstudada = useCallback(
    (id: string) => {
      setEstudadas((prev) => {
        const proximo = new Set(prev)
        if (proximo.has(id)) proximo.delete(id)
        else proximo.add(id)
        try {
          localStorage.setItem(chaveProgresso, JSON.stringify([...proximo]))
        } catch {}
        return proximo
      })
    },
    [chaveProgresso],
  )

  function limparProgresso() {
    setEstudadas(new Set())
    try {
      localStorage.removeItem(chaveProgresso)
    } catch {}
  }

  // Abertura direta em uma estrutura vinda da busca da página anterior.
  const jaAplicouQuery = useRef(false)
  useEffect(() => {
    if (jaAplicouQuery.current) return
    const alvo = searchParams?.get('estrutura')
    if (!alvo) return
    const e = sub.estruturas.find((x) => x.id === alvo)
    if (!e) return
    jaAplicouQuery.current = true
    setSelecionada(e)
    if (e.cortes?.length) setCorte(e.cortes[Math.floor(e.cortes.length / 2)])
  }, [searchParams, sub])

  // Trocar de série sem remontar o componente precisa zerar o estado local.
  useEffect(() => {
    setCorte(1)
    setSelecionada(null)
    setAba('estruturas')
    setFiltro('')
    setFolhaAberta(false)
  }, [sub.id])

  const selecionarEstrutura = useCallback(
    (e: EstruturaTC, irParaCorte = true) => {
      setSelecionada(e)
      if (irParaCorte && e.cortes?.length) setCorte(e.cortes[Math.floor(e.cortes.length / 2)])
      if (typeof window === 'undefined') return
      if (window.innerWidth < 1024) {
        // Celular: a ficha vira folha inferior sobre a tela.
        setFolhaAberta(true)
      } else {
        // Desktop: a ficha fica abaixo da lista, então precisa ser trazida à
        // vista — em séries com 20+ estruturas ela nasce fora do viewport.
        // O rAF espera o React montar o painel antes de rolar até ele.
        requestAnimationFrame(() =>
          dossieRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
        )
      }
    },
    [],
  )

  const irParaCorte = useCallback((n: number) => {
    setCorte(n)
    visorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const marcas: MarcaCorte[] = useMemo(() => {
    if (!selecionada?.cortes) return []
    const cor = tema(COR_CATEGORIA[selecionada.categoria]).raw
    return selecionada.cortes.map((c) => ({ corte: c, cor, rotulo: selecionada.nome }))
  }, [selecionada])

  const grupos = useMemo(() => {
    const q = filtro.trim().toLowerCase()
    const filtradas = q
      ? sub.estruturas.filter(
          (e) =>
            e.nome.toLowerCase().includes(q) ||
            (e.sinonimos || []).some((s) => s.toLowerCase().includes(q)),
        )
      : sub.estruturas
    const mapa = new Map<string, EstruturaTC[]>()
    for (const e of filtradas) {
      const lista = mapa.get(e.categoria) || []
      lista.push(e)
      mapa.set(e.categoria, lista)
    }
    return [...mapa.entries()]
  }, [sub.estruturas, filtro])

  const progresso = sub.estruturas.length
    ? Math.round((sub.estruturas.filter((e) => estudadas.has(e.id)).length / sub.estruturas.length) * 100)
    : 0

  return (
    <div className="surface-page min-h-screen pb-20 lg:pb-0">
      {/* ══════════ CABEÇALHO ══════════ */}
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4 pb-5 pt-6">
          <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/manual-clinico" className="transition-colors hover:text-foreground">
              Manual Clínico
            </Link>
            <ChevronRight className="h-3 w-3 opacity-40" />
            <Link href="/manual-clinico/tomografia" className="transition-colors hover:text-foreground">
              Tomografia
            </Link>
            <ChevronRight className="h-3 w-3 opacity-40" />
            <span className="font-medium text-foreground/70">{secao?.titulo}</span>
          </nav>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className={`shrink-0 rounded-xl border ${t.border} ${t.bg} p-2.5`}>
                <Icone className={`h-5 w-5 ${t.text}`} />
              </div>
              <div className="min-w-0">
                <h1 className="font-heading text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                  {sub.titulo}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">{sub.subtitulo}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-muted-foreground/70">
                  <span>{sub.totalCortes} cortes</span>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                  <span>{sub.estruturas.length} estruturas</span>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                  <span>
                    Sentido {sub.orientacao === 'cranio-caudal' ? 'crânio-caudal' : 'caudo-cranial'}
                  </span>
                </div>
              </div>
            </div>

            {progresso > 0 && (
              <div className="shrink-0 rounded-xl border border-border bg-card px-3.5 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Progresso
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-emerald-500 transition-[width]" style={{ width: `${progresso}%` }} />
                  </div>
                  <span className="font-mono text-xs font-bold">{progresso}%</span>
                  <button
                    onClick={limparProgresso}
                    className="rounded p-1 text-muted-foreground/50 transition-colors hover:text-foreground"
                    title="Zerar progresso desta série"
                    aria-label="Zerar progresso desta série"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════ CORPO ══════════ */}
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
          {/* ── Coluna do visualizador ── */}
          <div ref={visorRef} className="space-y-5 lg:sticky lg:top-4">
            <VisualizadorTC
              urls={urls}
              corte={corte}
              onCorteChange={setCorte}
              janelaNativa={sub.janelaPadrao}
              marcas={marcas}
              destaque={selecionada?.nome ?? null}
              orientacao={sub.orientacao}
              serie={sub.titulo}
            />

            <details className="group rounded-xl border border-border bg-card p-4" open>
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold">
                <Syringe className="h-4 w-4 text-primary" />
                Como este exame é feito
                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{sub.protocolo}</p>
            </details>

            <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <p className="editorial-mark mb-2">Por que esta série importa</p>
              <p className="text-sm leading-relaxed text-foreground/85">{sub.introducao}</p>
            </div>
          </div>

          {/* ── Coluna do estudo ── */}
          <div className="space-y-4">
            {/* Abas */}
            <div className="flex gap-1.5 overflow-x-auto rounded-xl border border-border bg-card p-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {(
                [
                  ['estruturas', 'Estruturas', Target],
                  ['roteiro', 'Roteiro', ListChecks],
                  ['quiz', 'Quiz', GraduationCap],
                  ['treino', 'Treino', Crosshair],
                ] as [Aba, string, React.ComponentType<{ className?: string }>][]
              ).map(([id, rotulo, IconeAba]) => (
                <button
                  key={id}
                  onClick={() => setAba(id)}
                  className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition ${
                    aba === id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <IconeAba className="h-3.5 w-3.5" />
                  {rotulo}
                </button>
              ))}
            </div>

            {aba === 'estruturas' && (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    placeholder={`Filtrar entre ${sub.estruturas.length} estruturas...`}
                    className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-9 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/50"
                    aria-label="Filtrar estruturas"
                  />
                  {filtro && (
                    <button
                      onClick={() => setFiltro('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                      aria-label="Limpar filtro"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {grupos.map(([categoria, lista]) => {
                    const tc = tema(COR_CATEGORIA[categoria as keyof typeof COR_CATEGORIA])
                    const IconeCat = ICONE_CATEGORIA[categoria as keyof typeof ICONE_CATEGORIA]
                    return (
                      <div key={categoria}>
                        <p className={`mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${tc.text}`}>
                          <IconeCat className="h-3 w-3" />
                          {ROTULO_CATEGORIA[categoria as keyof typeof ROTULO_CATEGORIA]}
                          <span className="text-muted-foreground/50">({lista.length})</span>
                        </p>
                        <div className="grid gap-1.5">
                          {lista.map((e) => {
                            const ativa = selecionada?.id === e.id
                            const feita = estudadas.has(e.id)
                            return (
                              <button
                                key={e.id}
                                onClick={() => selecionarEstrutura(e)}
                                className={`group flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition ${
                                  ativa
                                    ? `${tc.border} ${tc.bg}`
                                    : 'border-border bg-card hover:border-primary/30 hover:bg-muted/40'
                                }`}
                              >
                                <span
                                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition ${
                                    feita
                                      ? 'border-emerald-500 bg-emerald-500 text-white'
                                      : 'border-muted-foreground/25'
                                  }`}
                                >
                                  {feita && <Check className="h-2.5 w-2.5" />}
                                </span>
                                <span className={`min-w-0 flex-1 truncate text-sm ${ativa ? 'font-semibold' : ''}`}>
                                  {e.nome}
                                </span>
                                {e.cortes?.length ? (
                                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                                    {e.cortes.length > 1
                                      ? `${e.cortes[0]}–${e.cortes[e.cortes.length - 1]}`
                                      : e.cortes[0]}
                                  </span>
                                ) : null}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                  {grupos.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Nenhuma estrutura para &ldquo;{filtro}&rdquo;.
                    </p>
                  )}
                </div>

                {/* Ficha no desktop */}
                {selecionada && (
                  <div ref={dossieRef} className="hidden max-h-[75vh] scroll-mt-4 lg:block">
                    <Dossie
                      estrutura={selecionada}
                      corteAtual={corte}
                      onIrParaCorte={irParaCorte}
                      estudada={estudadas.has(selecionada.id)}
                      onAlternarEstudada={() => alternarEstudada(selecionada.id)}
                      onFechar={() => setSelecionada(null)}
                    />
                  </div>
                )}
              </>
            )}

            {aba === 'roteiro' && <Roteiro sub={sub} />}

            {aba === 'quiz' && <QuizTC key={sub.id} questoes={sub.quiz} />}

            {aba === 'treino' && (
              <ModoTreino key={sub.id} estruturas={sub.estruturas} corteAtual={corte} onIrParaCorte={irParaCorte} />
            )}
          </div>
        </div>

        {/* ══════════ NAVEGAÇÃO ENTRE SÉRIES ══════════ */}
        <div className="mt-10 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
          {anterior ? (
            <Link
              href={`/manual-clinico/tomografia/${anterior.id}`}
              prefetch={false}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/35"
            >
              <ChevronLeft className="h-5 w-5 shrink-0 text-muted-foreground/50 transition-transform group-hover:-translate-x-0.5 group-hover:text-primary" />
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Anterior</p>
                <p className="truncate text-sm font-semibold">{anterior.titulo}</p>
              </div>
            </Link>
          ) : (
            <div className="hidden sm:block" />
          )}
          {proxima && (
            <Link
              href={`/manual-clinico/tomografia/${proxima.id}`}
              prefetch={false}
              className="group flex items-center justify-end gap-3 rounded-xl border border-border bg-card p-4 text-right transition-colors hover:border-primary/35"
            >
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Próxima</p>
                <p className="truncate text-sm font-semibold">{proxima.titulo}</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          )}
        </div>

        <button
          onClick={() => router.push('/manual-clinico/tomografia')}
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Todas as séries
        </button>
      </div>

      {/* ══════════ FICHA COMO FOLHA INFERIOR (celular) ══════════ */}
      {selecionada && folhaAberta && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden" role="dialog" aria-modal="true">
          <button
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={() => setFolhaAberta(false)}
            aria-label="Fechar ficha"
          />
          <div className="relative max-h-[82vh] w-full animate-fade-in-up">
            <Dossie
              estrutura={selecionada}
              corteAtual={corte}
              onIrParaCorte={(n) => {
                irParaCorte(n)
                setFolhaAberta(false)
              }}
              estudada={estudadas.has(selecionada.id)}
              onAlternarEstudada={() => alternarEstudada(selecionada.id)}
              onFechar={() => setFolhaAberta(false)}
              comoFolha
            />
          </div>
        </div>
      )}

      {/* Barra fixa do celular: reabre a ficha da estrutura selecionada */}
      {selecionada && !folhaAberta && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden">
          <button
            onClick={() => setFolhaAberta(true)}
            className="flex w-full items-center gap-2.5 rounded-lg bg-primary px-4 py-2.5 text-left text-sm font-bold text-primary-foreground"
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{selecionada.nome}</span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </button>
        </div>
      )}
    </div>
  )
}

/* ────────────────────────── Roteiro ────────────────────────── */

function Roteiro({ sub }: { sub: NonNullable<ReturnType<typeof getSubsecao>> }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <p className="editorial-mark mb-3">Leitura sistemática</p>
        <ol className="space-y-3">
          {sub.roteiro.map((p, i) => (
            <li key={p.passo} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[11px] font-black text-primary">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-snug">{p.passo.replace(/^\d+\.\s*/, '')}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{p.detalhe}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {sub.perolas && sub.perolas.length > 0 && (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4 sm:p-5">
          <p className="mb-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
            <Lightbulb className="h-3.5 w-3.5" /> Pérolas de prova e de plantão
          </p>
          <ul className="space-y-2.5">
            {sub.perolas.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/85">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 p-3.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Percorra a série inteira seguindo estes passos antes de abrir as fichas. A leitura sistemática é o que
          evita o erro mais comum do iniciante: encontrar a primeira alteração e parar de olhar o resto.
        </p>
      </div>
    </div>
  )
}
