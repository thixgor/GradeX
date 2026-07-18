'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  GraduationCap,
  Maximize2,
  Box,
  ChevronRight,
} from 'lucide-react'
import {
  CATEGORIAS,
  FONTE,
  embedUrl,
  getCategoria,
  getModeloBySlug,
  getRelacionados,
  type Modelo3D,
} from '@/lib/anatomia-3d/modelos'
import { TEMA, ICONS, FALLBACK_ICON, corDaCategoria } from '@/components/anatomia-3d/tema'

/**
 * Visualizador 3D com carregamento sob demanda: o iframe do Sketchfab só é
 * montado quando o usuário toca no placeholder. Evita peso desnecessário e, em
 * telas de toque, garante que o arraste em 360° só capture o gesto depois que o
 * usuário decide interagir — sem travar o scroll vertical da página.
 */
function Visualizador3D({ modelo }: { modelo: Modelo3D }) {
  const [ativo, setAtivo] = useState(false)
  const src = embedUrl(modelo.sketchfabId)
  const tema = TEMA[corDaCategoria(modelo.categoriaId)]

  return (
    <div className={`relative w-full aspect-[4/3] sm:aspect-[16/10] overflow-hidden rounded-2xl border border-white/[0.1] bg-black/30`}>
      {!src ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
          <Box className="h-9 w-9 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Modelo 3D indisponível no momento.</p>
        </div>
      ) : ativo ? (
        <iframe
          title={modelo.titulo}
          src={src}
          loading="lazy"
          frameBorder={0}
          allow="autoplay; fullscreen; xr-spatial-tracking"
          allowFullScreen
          // Prefixos de fornecedor mantidos conforme o formato de embed do Sketchfab.
          {...({ mozallowfullscreen: 'true', webkitallowfullscreen: 'true' } as any)}
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAtivo(true)}
          className={`group/embed absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br ${tema.grad}`}
          aria-label={`Carregar modelo 3D: ${modelo.titulo}`}
        >
          <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:18px_18px]" />
          <div className={`relative rounded-full border border-white/15 ${tema.bg} p-6 transition-transform duration-300 group-hover/embed:scale-110`}>
            <RotateCw className={`h-9 w-9 ${tema.text}`} />
          </div>
          <div className="relative text-center">
            <p className="text-base font-bold text-foreground">Carregar modelo 3D</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Toque para girar, aproximar e explorar em 360°</p>
          </div>
        </button>
      )}
    </div>
  )
}

function RelacionadoCard({ modelo }: { modelo: Modelo3D }) {
  const tema = TEMA[corDaCategoria(modelo.categoriaId)]
  const cat = CATEGORIAS.find(c => c.id === modelo.categoriaId)
  const Icon = cat ? ICONS[cat.icon] : FALLBACK_ICON
  return (
    <Link
      href={`/manual-clinico/anatomia-3d/${modelo.slug}`}
      prefetch={false}
      className={`group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 transition-all hover:bg-white/[0.05] ${tema.hoverBorder}`}
    >
      <div className={`shrink-0 rounded-lg border border-white/10 ${tema.bg} p-2`}>
        <Icon className={`h-4 w-4 ${tema.text}`} />
      </div>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{modelo.titulo}</span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

export default function ModeloDetalhePage() {
  return (
    <AppShell allowGuest showHeader={false}>
      <ModeloDetalheContent />
    </AppShell>
  )
}

function ModeloDetalheContent() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const slug = typeof params?.slug === 'string' ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : ''
  const modelo = getModeloBySlug(slug)

  if (!modelo) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-20 max-w-3xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 mb-4">
            <Box className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <h1 className="text-xl font-bold mb-1">Modelo não encontrado</h1>
          <p className="text-muted-foreground text-sm mb-6">Este modelo 3D não existe ou foi movido.</p>
          <button
            onClick={() => router.push('/manual-clinico/anatomia-3d')}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar à Anatomia 3D
          </button>
        </div>
      </div>
    )
  }

  const categoria = getCategoria(modelo.categoriaId)
  const tema = TEMA[categoria.cor]
  const Icon = ICONS[categoria.icon] || FALLBACK_ICON
  const relacionados = getRelacionados(modelo)

  return (
    <div className="min-h-screen bg-background">
      {/* ══════════ HERO ══════════ */}
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tema.grad}`} aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-background" aria-hidden />
        <div className="relative z-10 container mx-auto px-4 pt-6 pb-8 max-w-6xl">
          {/* Breadcrumb / voltar */}
          <div className="mb-5 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/manual-clinico" className="hover:text-foreground transition-colors">Manual Clínico</Link>
            <ChevronRight className="h-3.5 w-3.5 opacity-50" />
            <Link href="/manual-clinico/anatomia-3d" className="hover:text-foreground transition-colors">Anatomia 3D</Link>
            <ChevronRight className="h-3.5 w-3.5 opacity-50" />
            <span className="text-foreground font-medium">{modelo.titulo}</span>
          </div>

          <button
            onClick={() => router.push('/manual-clinico/anatomia-3d')}
            className={`mb-4 inline-flex items-center gap-1.5 rounded-full border ${tema.border} ${tema.bg} px-3 py-1 text-xs font-semibold ${tema.text}`}
          >
            <Icon className="h-3.5 w-3.5" /> {categoria.titulo}
          </button>

          <h1 className="text-3xl sm:text-4xl font-bold font-heading tracking-tight leading-tight">{modelo.titulo}</h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground leading-relaxed">{modelo.resumo}</p>
        </div>
      </div>

      {/* ══════════ CORPO ══════════ */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Visualizador (sticky no desktop) */}
          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-6">
              <Visualizador3D modelo={modelo} />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Maximize2 className="h-3.5 w-3.5" /> Arraste para girar · pinça/scroll para aproximar
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <GraduationCap className="h-3.5 w-3.5 text-primary" /> Fonte: {FONTE}
                </span>
              </div>
            </div>
          </div>

          {/* Explicação anatômica */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className={`rounded-lg ${tema.bg} p-1.5`}>
                <Icon className={`h-4 w-4 ${tema.text}`} />
              </div>
              <h2 className="text-lg font-bold">Anatomia aprofundada</h2>
            </div>

            <div className="space-y-5">
              {modelo.secoes.map((secao, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 sm:p-5"
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${tema.bg} text-[11px] font-black ${tema.text}`}>
                      {i + 1}
                    </span>
                    <h3 className="font-bold leading-snug">{secao.titulo}</h3>
                  </div>
                  <div className="space-y-2 pl-8">
                    {secao.paragrafos.map((p, j) => (
                      <p key={j} className="text-sm text-muted-foreground leading-relaxed">{p}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[11px] leading-relaxed text-muted-foreground/70">
              Conteúdo com finalidade educacional. Modelo 3D cedido para estudo — Fonte: {FONTE}.
            </p>
          </div>
        </div>

        {/* Relacionados */}
        {relacionados.length > 0 && (
          <section className="mt-14 border-t border-white/[0.06] pt-8">
            <div className="flex items-center gap-2 mb-4">
              <Box className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Mais de {categoria.titulo}</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {relacionados.map(m => (
                <RelacionadoCard key={m.slug} modelo={m} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
