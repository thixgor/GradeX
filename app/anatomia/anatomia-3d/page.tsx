'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { PreviaModelo, useMiniaturas } from '@/components/anatomia/previa-modelo'
import {
  ArrowLeft,
  ArrowRight,
  Box,
  GraduationCap,
  LayoutGrid,
  Rows3,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import {
  CATEGORIAS,
  MODELOS,
  FONTE,
  TOTAL_MODELOS,
  getDestaques,
  getModelosPorCategoria,
  type CategoriaId,
  type Modelo3D,
} from '@/lib/anatomia-3d/modelos'
import { TEMA, ICONS, FALLBACK_ICON, corDaCategoria } from '@/components/anatomia-3d/tema'

const normalizar = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

/* ══════════════════════════ Cards ══════════════════════════ */

function CardModelo({
  modelo,
  indice,
  miniatura,
}: {
  modelo: Modelo3D
  indice: number
  miniatura?: string
}) {
  const tema = TEMA[corDaCategoria(modelo.categoriaId)]
  const categoria = CATEGORIAS.find(item => item.id === modelo.categoriaId)
  const Icone = categoria ? ICONS[categoria.icon] : FALLBACK_ICON

  return (
    <Link
      href={`/anatomia/anatomia-3d/${modelo.slug}`}
      prefetch={false}
      style={{ animationDelay: `${Math.min(indice, 12) * 40}ms` }}
      className={`group relative flex animate-fade-in-up flex-col overflow-hidden rounded-2xl border border-border bg-card opacity-0 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${tema.hoverBorder}`}
    >
      <PreviaModelo
        titulo={modelo.titulo}
        sketchfabId={modelo.sketchfabId}
        miniatura={miniatura}
        gradiente={tema.grad}
        corIcone={tema.text}
        fundoIcone={tema.bg}
        icone={Icone}
        prioridade={indice < 3}
      />

      {modelo.destaque && (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-400/25 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-100 backdrop-blur">
          <Sparkles className="h-3 w-3" /> Destaque
        </span>
      )}

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold leading-snug tracking-tight">{modelo.titulo}</h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">{modelo.legenda}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground/60">
            <GraduationCap className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{FONTE}</span>
          </span>
          <span className={`inline-flex shrink-0 items-center gap-1 text-xs font-bold ${tema.text}`}>
            Ver anatomia <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

function LinhaModelo({ modelo, miniatura }: { modelo: Modelo3D; miniatura?: string }) {
  const tema = TEMA[corDaCategoria(modelo.categoriaId)]
  const categoria = CATEGORIAS.find(item => item.id === modelo.categoriaId)
  const Icone = categoria ? ICONS[categoria.icon] : FALLBACK_ICON

  return (
    <Link
      href={`/anatomia/anatomia-3d/${modelo.slug}`}
      prefetch={false}
      className={`group flex items-stretch gap-3 overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-md ${tema.hoverBorder}`}
    >
      <div className="w-28 shrink-0 sm:w-36">
        <PreviaModelo
          titulo={modelo.titulo}
          sketchfabId={modelo.sketchfabId}
          miniatura={miniatura}
          gradiente={tema.grad}
          corIcone={tema.text}
          fundoIcone={tema.bg}
          icone={Icone}
          giroAoPassar={false}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center py-3 pr-3">
        <h3 className="truncate font-semibold leading-snug">{modelo.titulo}</h3>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{modelo.legenda}</p>
        <span className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold ${tema.text}`}>
          {categoria?.titulo}
        </span>
      </div>
      <ArrowRight className="my-auto mr-3 h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

/* ══════════════════════════ Página ══════════════════════════ */

export default function Anatomia3DPage() {
  return (
    <AppShell allowGuest showHeader={false}>
      <Conteudo />
    </AppShell>
  )
}

function Conteudo() {
  const [busca, setBusca] = useState('')
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaId | null>(null)
  const [visao, setVisao] = useState<'grade' | 'lista'>('grade')
  const observando = useRef(false)

  const destaques = useMemo(() => getDestaques(), [])
  const miniaturas = useMiniaturas(useMemo(() => MODELOS.map(modelo => modelo.sketchfabId), []))

  const termo = normalizar(busca.trim())
  const resultados = useMemo(() => {
    if (!termo) return []
    return MODELOS.filter(modelo =>
      [modelo.titulo, modelo.legenda, modelo.resumo].some(campo => normalizar(campo).includes(termo)),
    )
  }, [termo])

  // Destaca na barra fixa a categoria que está na tela.
  useEffect(() => {
    if (termo || observando.current) return
    observando.current = true
    const secoes = CATEGORIAS.map(categoria => document.getElementById(`cat-${categoria.id}`)).filter(
      Boolean,
    ) as HTMLElement[]
    const observador = new IntersectionObserver(
      entradas => {
        const visivel = entradas
          .filter(entrada => entrada.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visivel) setCategoriaAtiva(visivel.target.id.replace('cat-', '') as CategoriaId)
      },
      { rootMargin: '-40% 0px -55% 0px' },
    )
    secoes.forEach(secao => observador.observe(secao))
    return () => {
      observador.disconnect()
      observando.current = false
    }
  }, [termo])

  function irPara(id: CategoriaId) {
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function renderizar(modelos: Modelo3D[]) {
    if (visao === 'lista') {
      return (
        <div className="grid gap-2 lg:grid-cols-2">
          {modelos.map(modelo => (
            <LinhaModelo
              key={modelo.slug}
              modelo={modelo}
              miniatura={modelo.sketchfabId ? miniaturas[modelo.sketchfabId] : undefined}
            />
          ))}
        </div>
      )
    }
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {modelos.map((modelo, indice) => (
          <CardModelo
            key={modelo.slug}
            modelo={modelo}
            indice={indice}
            miniatura={modelo.sketchfabId ? miniaturas[modelo.sketchfabId] : undefined}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="surface-page min-h-screen">
      {/* ── Hero ── */}
      <header className="relative overflow-hidden border-b border-border bg-slate-950">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_10%,rgba(34,211,238,0.22),transparent_60%),radial-gradient(ellipse_50%_50%_at_85%_25%,rgba(99,102,241,0.22),transparent_60%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-9 pt-7 sm:pb-12 sm:pt-9">
          <Link
            href="/anatomia"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/55 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Domine Anatomia
          </Link>

          <div className="mb-3">
            <p className="editorial-mark !text-cyan-300">Domine Anatomia · modelos interativos</p>
          </div>
          <h1 className="font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Anatomia 3D
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
            {TOTAL_MODELOS} peças anatômicas rotacionáveis em 360°, organizadas por sistema e acompanhadas de uma
            explicação aprofundada. Passe o cursor sobre um card para ver o modelo girar antes mesmo de abri-lo.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/12 px-3 py-1.5 text-cyan-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
              {TOTAL_MODELOS} modelos
            </span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-white/70">
              {CATEGORIAS.length} categorias
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-white/70">
              <GraduationCap className="h-3.5 w-3.5" /> {FONTE}
            </span>
          </div>

          <div className="relative mt-6 max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
            <input
              value={busca}
              onChange={evento => setBusca(evento.target.value)}
              placeholder="Buscar modelo (coração, vértebra T5, laringe...)"
              aria-label="Buscar modelo 3D"
              className="w-full rounded-2xl border border-white/15 bg-white/10 py-3.5 pl-12 pr-11 text-base text-white outline-none backdrop-blur transition placeholder:text-white/35 focus:border-cyan-400/50 focus:bg-white/15"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-1.5 text-white/70 transition hover:bg-white/25 hover:text-white"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Barra de categorias ── */}
      {!termo && (
        <div className="sticky top-0 z-30 border-b border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 supports-[backdrop-filter]:backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4">
            <div className="flex flex-1 gap-2 overflow-x-auto py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CATEGORIAS.map(categoria => {
                const tema = TEMA[categoria.cor]
                const ativa = categoriaAtiva === categoria.id
                const quantidade = getModelosPorCategoria(categoria.id).length
                if (quantidade === 0) return null
                return (
                  <button
                    key={categoria.id}
                    type="button"
                    onClick={() => irPara(categoria.id)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      ativa ? tema.chipActive : `border-border bg-card ${tema.text} hover:bg-muted`
                    }`}
                  >
                    {categoria.titulo}
                    <span
                      className={`rounded-full px-1.5 text-[10px] tabular-nums ${
                        ativa ? 'bg-white/25' : 'bg-muted-foreground/15'
                      }`}
                    >
                      {quantidade}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="hidden shrink-0 items-center gap-0.5 rounded-lg border border-border bg-card p-0.5 sm:flex">
              <BotaoVisao ativo={visao === 'grade'} onClick={() => setVisao('grade')} rotulo="Ver em grade">
                <LayoutGrid className="h-4 w-4" />
              </BotaoVisao>
              <BotaoVisao ativo={visao === 'lista'} onClick={() => setVisao('lista')} rotulo="Ver em lista">
                <Rows3 className="h-4 w-4" />
              </BotaoVisao>
            </div>
          </div>
        </div>
      )}

      {/* ── Conteúdo ── */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        {termo ? (
          <div>
            <p className="mb-5 text-sm text-muted-foreground">
              {resultados.length > 0
                ? `${resultados.length} modelo${resultados.length !== 1 ? 's' : ''} para “${busca}”`
                : `Nenhum modelo encontrado para “${busca}”`}
            </p>
            {resultados.length > 0 ? (
              renderizar(resultados)
            ) : (
              <div className="py-16 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                  <Box className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Tente outro termo, como um sistema ou o nome de um osso.
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            {destaques.length > 0 && (
              <section className="mb-12">
                <div className="mb-5 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <h2 className="font-heading text-xl font-semibold tracking-tight">Em destaque</h2>
                </div>
                {renderizar(destaques)}
              </section>
            )}

            <div className="space-y-14">
              {CATEGORIAS.map(categoria => {
                const modelos = getModelosPorCategoria(categoria.id)
                if (modelos.length === 0) return null
                const tema = TEMA[categoria.cor]
                const Icone = ICONS[categoria.icon]
                return (
                  <section key={categoria.id} id={`cat-${categoria.id}`} className="scroll-mt-20">
                    <div className="mb-5 flex items-center gap-4">
                      <div className={`rounded-xl border ${tema.border} ${tema.bg} p-3`}>
                        <Icone className={`h-6 w-6 ${tema.text}`} />
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-heading text-xl font-semibold leading-tight tracking-tight">
                          {categoria.titulo}
                        </h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {categoria.subtitulo} · {modelos.length} modelo{modelos.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    {renderizar(modelos)}
                  </section>
                )
              })}
            </div>
          </>
        )}

        <div className="mt-16 border-t border-border pt-6 text-center">
          <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <GraduationCap className="h-4 w-4 text-primary" />
            Todos os modelos anatômicos têm como fonte a <strong className="font-semibold">{FONTE}</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}

function BotaoVisao({
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
      title={rotulo}
      aria-label={rotulo}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
        ativo ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
      }`}
    >
      {children}
    </button>
  )
}
