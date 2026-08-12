'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Crosshair,
  Grid2x2,
  HeartPulse,
  Layers,
  Rows3,
  ScanSearch,
  Search,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Wind,
  X,
} from 'lucide-react'
import { MiniaturaCasoRaioX } from '@/components/radiologia/caso-raio-x-imagem'
import type { CasoRaioX, CategoriaCasoRaioX, GuiaCategoriaCasoRaioX } from '@/lib/radiologia/casos-raio-x'

/** Quantos blocos de estudo cada caso carrega — calculado no servidor. */
export type ResumoDetalhes = Record<string, { estruturas: number; marcacoes: number }>

type Visao = 'grade' | 'lista'

const normalizar = (texto: string) => texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

/** Classes literais por capítulo — Tailwind precisa das strings inteiras no código. */
const PALETA: Record<
  CategoriaCasoRaioX,
  { sobreFilme: string; chip: string; ponto: string; texto: string; borda: string; brilho: string }
> = {
  cardiovascular: { sobreFilme: 'border-rose-300/45 text-rose-100', chip: 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-300', ponto: 'bg-rose-500', texto: 'text-rose-600 dark:text-rose-300', borda: 'border-rose-500/25', brilho: 'group-hover:border-rose-500/50' },
  variantes: { sobreFilme: 'border-emerald-300/45 text-emerald-100', chip: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300', ponto: 'bg-emerald-500', texto: 'text-emerald-600 dark:text-emerald-300', borda: 'border-emerald-500/25', brilho: 'group-hover:border-emerald-500/50' },
  'vias-aereas': { sobreFilme: 'border-amber-300/45 text-amber-100', chip: 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300', ponto: 'bg-amber-500', texto: 'text-amber-600 dark:text-amber-300', borda: 'border-amber-500/25', brilho: 'group-hover:border-amber-500/50' },
  dispositivos: { sobreFilme: 'border-cyan-300/45 text-cyan-100', chip: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300', ponto: 'bg-cyan-500', texto: 'text-cyan-600 dark:text-cyan-300', borda: 'border-cyan-500/25', brilho: 'group-hover:border-cyan-500/50' },
  pneumotorax: { sobreFilme: 'border-orange-300/45 text-orange-100', chip: 'border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-300', ponto: 'bg-orange-500', texto: 'text-orange-600 dark:text-orange-300', borda: 'border-orange-500/25', brilho: 'group-hover:border-orange-500/50' },
  'cancer-pulmao': { sobreFilme: 'border-violet-300/45 text-violet-100', chip: 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-300', ponto: 'bg-violet-500', texto: 'text-violet-600 dark:text-violet-300', borda: 'border-violet-500/25', brilho: 'group-hover:border-violet-500/50' },
  mediastino: { sobreFilme: 'border-indigo-300/45 text-indigo-100', chip: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300', ponto: 'bg-indigo-500', texto: 'text-indigo-600 dark:text-indigo-300', borda: 'border-indigo-500/25', brilho: 'group-hover:border-indigo-500/50' },
}

const ICONES: Record<CategoriaCasoRaioX, typeof HeartPulse> = {
  cardiovascular: HeartPulse,
  variantes: Layers,
  'vias-aereas': Wind,
  dispositivos: Stethoscope,
  pneumotorax: ShieldAlert,
  'cancer-pulmao': Crosshair,
  mediastino: ScanSearch,
}

export function CatalogoCasosRaioX({
  casos,
  categorias,
  detalhes = {},
}: {
  casos: CasoRaioX[]
  categorias: GuiaCategoriaCasoRaioX[]
  detalhes?: ResumoDetalhes
}) {
  const [categoria, setCategoria] = useState<CategoriaCasoRaioX | null>(null)
  const [busca, setBusca] = useState('')
  const [visao, setVisao] = useState<Visao>('grade')
  const campoBusca = useRef<HTMLInputElement | null>(null)

  const termo = normalizar(busca.trim())

  const visiveis = useMemo(
    () =>
      casos.filter((caso) => {
        if (categoria && caso.categoria !== categoria) return false
        if (!termo) return true
        return normalizar(
          [caso.titulo, caso.resumo, caso.explicacao, caso.categoriaTitulo, ...caso.sinais, ...caso.armadilhas].join(' '),
        ).includes(termo)
      }),
    [casos, categoria, termo],
  )

  /** Sem filtro nem busca, o acervo aparece organizado por capítulo. */
  const agrupado = !categoria && !termo
  const grupos = useMemo(
    () => categorias.map((guia) => ({ guia, itens: casos.filter((caso) => caso.categoria === guia.id) })),
    [casos, categorias],
  )

  const totalImagens = useMemo(() => casos.reduce((n, caso) => n + caso.imagens.length, 0), [casos])
  const totalMarcacoes = useMemo(
    () => Object.values(detalhes).reduce((n, item) => n + item.marcacoes, 0),
    [detalhes],
  )

  // "/" foca a busca, "Esc" limpa — atalho esperado por quem usa o atlas todo dia.
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      const alvo = evento.target as HTMLElement | null
      const digitando = alvo && (/^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName) || alvo.isContentEditable)
      if (evento.key === '/' && !digitando) {
        evento.preventDefault()
        campoBusca.current?.focus()
      } else if (evento.key === 'Escape' && digitando && alvo === campoBusca.current) {
        setBusca('')
        campoBusca.current?.blur()
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [])

  const irParaCapitulo = useCallback((id: CategoriaCasoRaioX) => {
    document.getElementById(`capitulo-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const limpar = useCallback(() => {
    setBusca('')
    setCategoria(null)
  }, [])

  return (
    <div className="rx surface-page min-h-screen">
      {/* ══════════════════ Cabeçalho negatoscópio ══════════════════ */}
      <header className="rx-painel rx-grade rx-varredura relative overflow-hidden border-b border-sky-400/15 text-white">
        <div className="rx-abaixo-flutuantes container relative mx-auto max-w-6xl px-4 pb-8 pt-5 sm:pb-10 sm:pt-6">
          <Link
            href="/manual-clinico/radiologia/raio-x"
            className="-m-2 inline-flex items-center gap-1.5 rounded-lg p-2 text-sm text-sky-100/55 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Atlas de Raio-X
          </Link>

          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end lg:gap-10">
            <div>
              <p className="editorial-mark !text-sky-300/80 [&::before]:bg-sky-300/60">Raio-X de tórax · prática guiada</p>
              <h1 className="mt-2 max-w-3xl font-heading text-3xl font-semibold tracking-tight sm:text-[2.6rem] sm:leading-[1.1]">
                Casos e alterações
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-sky-100/60 sm:text-base">
                Descreva o filme limpo, ligue os marcadores e confira, alteração por alteração, o que cada marcação
                aponta. Cada caso vem com o mecanismo por trás da imagem e a dissecção de cada estrutura envolvida.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-bold text-sky-100/70">
                <Selo icone={Layers}>{categorias.length} capítulos</Selo>
                <Selo icone={Sparkles}>{casos.length} temas</Selo>
                <Selo icone={ScanSearch}>{totalImagens} radiografias</Selo>
                {totalMarcacoes > 0 && <Selo icone={Crosshair}>{totalMarcacoes} marcações comentadas</Selo>}
              </div>
            </div>

            <div>
              <label htmlFor="busca-casos-rx" className="sr-only">Buscar caso, sinal ou diagnóstico</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-300/70" />
                <input
                  id="busca-casos-rx"
                  ref={campoBusca}
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Kerley, pneumotórax, massa hilar…"
                  className="h-12 w-full rounded-xl border border-sky-400/25 bg-sky-950/40 pl-11 pr-16 text-sm text-white outline-none transition placeholder:text-sky-200/35 focus:border-sky-400/70 focus:ring-4 focus:ring-sky-400/10"
                />
                {busca ? (
                  <button
                    type="button"
                    onClick={() => setBusca('')}
                    aria-label="Limpar busca"
                    className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-sky-100/60 transition hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-sky-400/25 px-1.5 py-0.5 font-clinical text-[10px] text-sky-200/50 sm:block">
                    /
                  </kbd>
                )}
              </div>
              <p className="mt-2 text-[11px] text-sky-200/45">
                Busque pelo diagnóstico, sinal radiográfico, estrutura ou armadilha.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ══════════════════ Barra de capítulos ══════════════════ */}
      <nav
        aria-label="Capítulos de casos"
        data-rx-barra
        className="rx-fixo-topo sticky z-30 border-b border-border bg-background/95 shadow-sm backdrop-blur-md"
      >
        <div className="container mx-auto flex max-w-6xl items-center gap-2 px-4 py-2">
          <div className="rx-rolagem -mx-1 flex flex-1 snap-x snap-mandatory gap-1.5 overflow-x-auto px-1 py-1 [mask-image:linear-gradient(90deg,#000_calc(100%-28px),transparent)]">
            <Filtro ativo={!categoria} onClick={() => setCategoria(null)} contagem={casos.length}>
              Todos
            </Filtro>
            {categorias.map((item) => {
              const Icone = ICONES[item.id]
              return (
                <Filtro
                  key={item.id}
                  ativo={categoria === item.id}
                  onClick={() => setCategoria(categoria === item.id ? null : item.id)}
                  contagem={casos.filter((c) => c.categoria === item.id).length}
                  cor={PALETA[item.id]}
                  icone={<Icone className="h-3.5 w-3.5" />}
                >
                  {item.titulo}
                </Filtro>
              )
            })}
          </div>
          <div className="hidden shrink-0 items-center gap-0.5 rounded-lg border border-border p-0.5 sm:flex">
            <BotaoVisao ativo={visao === 'grade'} onClick={() => setVisao('grade')} rotulo="Ver em grade"><Grid2x2 /></BotaoVisao>
            <BotaoVisao ativo={visao === 'lista'} onClick={() => setVisao('lista')} rotulo="Ver em lista"><Rows3 /></BotaoVisao>
          </div>
        </div>
      </nav>

      <main className="container mx-auto max-w-6xl px-4 py-7 sm:py-10">
        {/* Índice de capítulos: o mapa da área, só quando nada está filtrado. */}
        {agrupado && (
          <section aria-label="Índice de capítulos" className="mb-9">
            <p className="editorial-mark">Por onde começar</p>
            <h2 className="mt-1.5 font-heading text-xl font-semibold tracking-tight sm:text-2xl">
              Sete capítulos, uma pergunta cada
            </h2>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {grupos.map(({ guia, itens }, indice) => {
                const Icone = ICONES[guia.id]
                const cor = PALETA[guia.id]
                return (
                  <button
                    key={guia.id}
                    type="button"
                    onClick={() => irParaCapitulo(guia.id)}
                    style={{ ['--rx-i' as string]: indice }}
                    className={`rx-entra group flex items-start gap-3 rounded-2xl border border-border bg-card p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${cor.brilho}`}
                  >
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${cor.chip}`}>
                      <Icone className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <strong className="font-heading text-sm font-semibold leading-tight">{guia.titulo}</strong>
                        <span className="shrink-0 font-clinical text-[10px] text-muted-foreground">{itens.length}</span>
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted-foreground line-clamp-2">
                        {guia.pergunta}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* Guia do capítulo selecionado. */}
        {categoria && !termo && <GuiaCapitulo guia={categorias.find((item) => item.id === categoria)!} />}

        {/* Resultado da busca / capítulo. */}
        {!agrupado && (
          <>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="editorial-mark">{termo ? 'Resultado da busca' : 'Temas do capítulo'}</p>
                <h2 className="mt-1.5 font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                  {visiveis.length} tema{visiveis.length === 1 ? '' : 's'}
                  {termo && <span className="text-muted-foreground"> para “{busca.trim()}”</span>}
                </h2>
              </div>
              {(termo || categoria) && (
                <button
                  type="button"
                  onClick={limpar}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:border-sky-500/50 hover:text-foreground"
                >
                  <X className="h-3 w-3" /> Limpar filtros
                </button>
              )}
            </div>

            {visiveis.length ? (
              <Colecao casos={visiveis} visao={visao} detalhes={detalhes} />
            ) : (
              <div className="rounded-2xl border border-dashed border-border py-16 text-center">
                <Search className="mx-auto h-8 w-8 text-muted-foreground/30" />
                <p className="mt-3 text-sm text-muted-foreground">Nenhum caso corresponde à busca.</p>
                <button
                  type="button"
                  onClick={limpar}
                  className="mt-4 rounded-full border border-border px-4 py-2 text-xs font-bold transition hover:border-sky-500/50"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </>
        )}

        {/* Acervo completo, capítulo a capítulo. */}
        {agrupado &&
          grupos.map(({ guia, itens }) => {
            const Icone = ICONES[guia.id]
            const cor = PALETA[guia.id]
            return (
              <section key={guia.id} id={`capitulo-${guia.id}`} className="rx-ancora pt-3">
                <div className="rx-fixo-abaixo sticky z-20 -mx-4 mb-4 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur-md">
                  <div className="flex items-center gap-2.5">
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border ${cor.chip}`}>
                      <Icone className="h-3.5 w-3.5" />
                    </span>
                    <h2 className="min-w-0 flex-1 truncate font-heading text-base font-semibold tracking-tight sm:text-lg">
                      {guia.titulo}
                    </h2>
                    <span className="shrink-0 font-clinical text-[10px] font-bold text-muted-foreground">
                      {itens.length} temas
                    </span>
                  </div>
                </div>
                <p className="mb-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">{guia.resumo}</p>
                <Colecao casos={itens} visao={visao} detalhes={detalhes} />
                <div className="h-9" />
              </section>
            )
          })}
      </main>
    </div>
  )
}

function Colecao({ casos, visao, detalhes }: { casos: CasoRaioX[]; visao: Visao; detalhes: ResumoDetalhes }) {
  if (visao === 'lista') {
    return (
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {casos.map((caso, indice) => (
          <li key={caso.slug}>
            <LinhaCaso caso={caso} indice={indice} detalhe={detalhes[caso.slug]} />
          </li>
        ))}
      </ul>
    )
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {casos.map((caso, indice) => (
        <CardCaso key={caso.slug} caso={caso} indice={indice} detalhe={detalhes[caso.slug]} />
      ))}
    </div>
  )
}

function GuiaCapitulo({ guia }: { guia: GuiaCategoriaCasoRaioX }) {
  const Icone = ICONES[guia.id]
  const cor = PALETA[guia.id]
  return (
    <section className={`mb-8 overflow-hidden rounded-2xl border bg-card ${cor.borda}`}>
      <div className="grid gap-5 p-5 lg:grid-cols-[0.85fr_1.15fr] lg:p-6">
        <div>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${cor.chip}`}>
            <Icone className="h-3 w-3" /> Pergunta de abertura
          </span>
          <h2 className="mt-3 font-heading text-xl font-semibold leading-snug">{guia.pergunta}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{guia.resumo}</p>
        </div>
        <ol className="grid gap-2 sm:grid-cols-2">
          {guia.roteiro.map((passo, i) => (
            <li key={passo} className="flex gap-2.5 rounded-xl border border-border bg-background/50 p-3 text-xs leading-relaxed text-muted-foreground">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-clinical text-[10px] font-black text-white ${cor.ponto}`}>
                {i + 1}
              </span>
              {passo}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function CardCaso({ caso, indice, detalhe }: { caso: CasoRaioX; indice: number; detalhe?: { estruturas: number; marcacoes: number } }) {
  const cor = PALETA[caso.categoria]
  return (
    <Link
      href={`/manual-clinico/radiologia/raio-x/casos/${caso.slug}`}
      style={{ ['--rx-i' as string]: Math.min(indice, 12) }}
      className={`rx-entra rx-cartao group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-500/5 ${cor.brilho}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-black">
        <MiniaturaCasoRaioX imagem={caso.imagens[0]} className="absolute inset-0 h-full w-full bg-contain transition duration-700 group-hover:scale-[1.04]" />
        <MiniaturaCasoRaioX
          imagem={caso.imagens[0]}
          marcada
          className="rx-cartao-marcada absolute inset-0 h-full w-full bg-contain transition duration-700 group-hover:scale-[1.04]"
        />
        <span aria-hidden className="rx-cartao-lamina" />
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-clinical text-[9px] font-bold uppercase tracking-widest backdrop-blur-sm ${cor.sobreFilme}`} style={{ backgroundColor: 'rgba(0,0,0,.72)' }}>
          <span className={`h-1.5 w-1.5 rounded-full ${cor.ponto}`} />
          {caso.categoriaTitulo}
        </span>
        <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2 py-1 font-clinical text-[9px] font-bold text-white/70 backdrop-blur">
          {caso.imagens.length} {caso.imagens.length === 1 ? 'imagem' : 'imagens'}
        </span>
        {detalhe?.marcacoes ? (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-sky-500/25 px-2 py-1 font-clinical text-[9px] font-bold text-sky-100 opacity-0 backdrop-blur transition duration-300 group-hover:opacity-100">
            <Crosshair className="h-2.5 w-2.5" /> {detalhe.marcacoes} marcações
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-heading text-base font-semibold leading-tight transition group-hover:text-sky-600 dark:group-hover:text-sky-400">
          {caso.titulo}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-muted-foreground">{caso.resumo}</p>
        <span className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[11px] font-bold text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            {detalhe?.estruturas ? <span>{detalhe.estruturas} estruturas</span> : null}
            {caso.armadilhas.length ? <span className="text-amber-600 dark:text-amber-400">{caso.armadilhas.length} armadilhas</span> : null}
          </span>
          <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400">
            Estudar <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </span>
        </span>
      </div>
    </Link>
  )
}

function LinhaCaso({ caso, indice, detalhe }: { caso: CasoRaioX; indice: number; detalhe?: { estruturas: number; marcacoes: number } }) {
  const cor = PALETA[caso.categoria]
  return (
    <Link
      href={`/manual-clinico/radiologia/raio-x/casos/${caso.slug}`}
      style={{ ['--rx-i' as string]: Math.min(indice, 12) }}
      className="rx-entra rx-cartao group flex items-center gap-3.5 p-3 transition hover:bg-muted/40 sm:gap-4 sm:p-4"
    >
      <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-black sm:h-16 sm:w-24">
        <MiniaturaCasoRaioX imagem={caso.imagens[0]} className="absolute inset-0 h-full w-full bg-contain" />
        <MiniaturaCasoRaioX imagem={caso.imagens[0]} marcada className="rx-cartao-marcada absolute inset-0 h-full w-full bg-contain" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${cor.texto}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cor.ponto}`} />
            {caso.categoriaTitulo}
          </span>
        </span>
        <strong className="mt-0.5 block truncate font-heading text-sm font-semibold transition group-hover:text-sky-600 dark:group-hover:text-sky-400 sm:text-base">
          {caso.titulo}
        </strong>
        <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">{caso.resumo}</span>
      </span>
      <span className="hidden shrink-0 items-center gap-3 font-clinical text-[10px] text-muted-foreground md:flex">
        <span>{caso.imagens.length} img</span>
        {detalhe?.marcacoes ? <span>{detalhe.marcacoes} marcações</span> : null}
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-sky-500" />
    </Link>
  )
}

function Selo({ icone: Icone, children }: { icone: typeof Sparkles; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-400/[0.07] px-3 py-1.5">
      <Icone className="h-3 w-3 text-sky-300" />
      {children}
    </span>
  )
}

function Filtro({
  ativo,
  onClick,
  contagem,
  cor,
  icone,
  children,
}: {
  ativo: boolean
  onClick: () => void
  contagem: number
  cor?: (typeof PALETA)[CategoriaCasoRaioX]
  icone?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`inline-flex shrink-0 snap-start items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-2 text-xs font-bold transition ${
        ativo
          ? cor
            ? cor.chip
            : 'border-sky-500/60 bg-sky-500/10 text-sky-700 dark:text-sky-300'
          : 'border-border bg-card text-muted-foreground hover:border-sky-500/40 hover:text-foreground'
      }`}
    >
      {icone}
      {children}
      <span className="font-clinical text-[10px] opacity-60">{contagem}</span>
    </button>
  )
}

function BotaoVisao({ ativo, onClick, rotulo, children }: { ativo: boolean; onClick: () => void; rotulo: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      aria-label={rotulo}
      title={rotulo}
      className={`grid h-8 w-8 place-items-center rounded-md transition [&_svg]:h-3.5 [&_svg]:w-3.5 ${
        ativo ? 'bg-sky-500/15 text-sky-600 dark:text-sky-300' : 'text-muted-foreground hover:bg-muted'
      }`}
    >
      {children}
    </button>
  )
}
