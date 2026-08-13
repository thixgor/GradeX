'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  ArrowRight,
  Search,
  X,
  Sparkles,
  RotateCw,
  GraduationCap,
  Box,
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

function ModeloCard({ modelo, index }: { modelo: Modelo3D; index: number }) {
  const tema = TEMA[corDaCategoria(modelo.categoriaId)]
  const cat = CATEGORIAS.find(c => c.id === modelo.categoriaId)
  const Icon = cat ? ICONS[cat.icon] : FALLBACK_ICON

  return (
    <Link
      href={`/manual-clinico/anatomia-3d/${modelo.slug}`}
      prefetch={false}
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
      className={`group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card opacity-0 animate-fade-in-up shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${tema.hoverBorder}`}
    >
      {/* Thumbnail 3D (leve — sem iframe; o viewer fica na página de detalhe) */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${tema.grad}`} />
        <div className="absolute inset-0 opacity-[0.15] [background-image:radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:16px_16px]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`rounded-2xl border border-white/10 ${tema.bg} p-5 backdrop-blur-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
            <Icon className={`h-10 w-10 ${tema.text}`} />
          </div>
        </div>
        <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/30 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white/90 backdrop-blur">
          <RotateCw className="h-3 w-3" /> 3D
        </div>
        {modelo.destaque && (
          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-400/20 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-200 backdrop-blur">
            <Sparkles className="h-3 w-3" /> Destaque
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold leading-snug transition-colors group-hover:text-foreground">{modelo.titulo}</h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted-foreground leading-relaxed">{modelo.legenda}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/60">
            <GraduationCap className="h-3.5 w-3.5" /> {FONTE}
          </span>
          <span className={`inline-flex items-center gap-1 text-xs font-bold ${tema.text}`}>
            Ver anatomia <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function Anatomia3DPage() {
  return (
    <AppShell allowGuest showHeader={false}>
      <Anatomia3DContent />
    </AppShell>
  )
}

function Anatomia3DContent() {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [catAtiva, setCatAtiva] = useState<CategoriaId | null>(null)
  const destaques = useMemo(() => getDestaques(), [])
  const observando = useRef(false)

  const termo = busca.trim().toLowerCase()
  const resultados = useMemo(() => {
    if (!termo) return []
    return MODELOS.filter(
      m =>
        m.titulo.toLowerCase().includes(termo) ||
        m.legenda.toLowerCase().includes(termo) ||
        m.resumo.toLowerCase().includes(termo),
    )
  }, [termo])

  // Destaca a categoria visível na navegação fixa (efeito "scrollspy").
  useEffect(() => {
    if (termo || observando.current) return
    observando.current = true
    const secoes = CATEGORIAS.map(c => document.getElementById(`cat-${c.id}`)).filter(Boolean) as HTMLElement[]
    const obs = new IntersectionObserver(
      entries => {
        const visivel = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visivel) setCatAtiva(visivel.target.id.replace('cat-', '') as CategoriaId)
      },
      { rootMargin: '-40% 0px -55% 0px' },
    )
    secoes.forEach(s => obs.observe(s))
    return () => {
      obs.disconnect()
      observando.current = false
    }
  }, [termo])

  function irParaCategoria(id: CategoriaId) {
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="surface-page min-h-screen">
      {/* ══════════ HERO ══════════ */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-muted/30" aria-hidden />

        <div className="relative z-10 container mx-auto px-4 pt-8 pb-10 max-w-6xl">
          <button
            onClick={() => router.push('/manual-clinico/anatomia-3d')}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao Domine Anatomia
          </button>

          <div className="max-w-3xl">
            <p className="editorial-mark mb-3">Domine Anatomia · modelos 3D interativos</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold font-heading leading-[1.05] tracking-tight text-foreground">
              Anatomia 3D
            </h1>
            <p className="mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              {TOTAL_MODELOS} modelos anatômicos rotacionáveis em 360°, dissecados por sistema e acompanhados de uma
              explicação clínica aprofundada em cada peça. Gire, aproxime e estude — do coração às vértebras torácicas.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-bold text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                {TOTAL_MODELOS} modelos
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground">
                {CATEGORIAS.length} categorias
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground">
                <GraduationCap className="h-3.5 w-3.5 text-primary" /> Fonte: {FONTE}
              </span>
            </div>

            {/* Busca */}
            <div className="mt-6 max-w-xl">
              <div className="relative group flex items-center bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-colors focus-within:border-primary/50">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
                <Input
                  placeholder="Buscar modelo (coração, vértebra T5, laringe...)"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  className="pl-12 pr-12 h-14 text-base bg-transparent border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40"
                  aria-label="Buscar modelo 3D"
                />
                {busca && (
                  <button
                    onClick={() => setBusca('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-muted hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Limpar busca"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ NAVEGAÇÃO FIXA POR CATEGORIA ══════════ */}
      {!termo && (
        <div className="sticky top-0 z-30 border-b border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 supports-[backdrop-filter]:backdrop-blur-md">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex gap-2 overflow-x-auto py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {CATEGORIAS.map(cat => {
                const tema = TEMA[cat.cor]
                const ativa = catAtiva === cat.id
                const n = getModelosPorCategoria(cat.id).length
                if (n === 0) return null
                return (
                  <button
                    key={cat.id}
                    onClick={() => irParaCategoria(cat.id)}
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      ativa ? tema.chipActive : `bg-card ${tema.text} border-border hover:bg-muted`
                    }`}
                  >
                    {cat.titulo}
                    <span className={`rounded-full px-1.5 text-[10px] ${ativa ? 'bg-white/25' : 'bg-muted-foreground/15'}`}>{n}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ CONTEÚDO ══════════ */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {termo ? (
          /* ── Resultados de busca ── */
          <div>
            <p className="mb-5 text-sm text-muted-foreground">
              {resultados.length > 0
                ? `${resultados.length} modelo${resultados.length !== 1 ? 's' : ''} para "${busca}"`
                : `Nenhum modelo encontrado para "${busca}"`}
            </p>
            {resultados.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {resultados.map((m, i) => (
                  <ModeloCard key={m.slug} modelo={m} index={i} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 mb-4">
                  <Box className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground text-sm">Tente outro termo, como um sistema ou o nome de um osso.</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* ── Em destaque ── */}
            {destaques.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-2 mb-5">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <h2 className="text-xl font-heading font-semibold tracking-tight">Em destaque</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {destaques.map((m, i) => (
                    <ModeloCard key={m.slug} modelo={m} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Categorias ── */}
            <div className="space-y-14">
              {CATEGORIAS.map(cat => {
                const modelos = getModelosPorCategoria(cat.id)
                if (modelos.length === 0) return null
                const tema = TEMA[cat.cor]
                const Icon = ICONS[cat.icon]
                return (
                  <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-20">
                    <div className="flex items-center gap-4 mb-5">
                      <div className={`rounded-xl border ${tema.border} ${tema.bg} p-3`}>
                        <Icon className={`h-6 w-6 ${tema.text}`} />
                      </div>
                      <div>
                        <h2 className="text-xl font-heading font-semibold tracking-tight leading-tight">{cat.titulo}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {cat.subtitulo} · {modelos.length} modelo{modelos.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {modelos.map((m, i) => (
                        <ModeloCard key={m.slug} modelo={m} index={i} />
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          </>
        )}

        {/* Atribuição no rodapé */}
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
