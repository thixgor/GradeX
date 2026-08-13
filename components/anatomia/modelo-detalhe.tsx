'use client'

/**
 * Página de um modelo 3D. Montada apenas para assinantes — a explicação
 * aprofundada de cada peça é conteúdo pago.
 */

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMiniaturas } from '@/components/anatomia/previa-modelo'
import {
  ArrowLeft,
  ArrowRight,
  Box,
  ChevronRight,
  GraduationCap,
  Maximize2,
  Play,
  RotateCw,
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
 * montado quando o aluno toca no palco. Evita peso desnecessário e, em telas de
 * toque, garante que o arraste em 360° só capture o gesto depois que ele decide
 * interagir — sem travar o scroll vertical da página.
 *
 * Enquanto isso, o palco mostra a miniatura oficial do modelo, para o aluno já
 * ver a peça de que se trata antes de carregar o embed.
 */
function Visualizador3D({ modelo, miniatura }: { modelo: Modelo3D; miniatura?: string }) {
  const [ativo, setAtivo] = useState(false)
  const src = embedUrl(modelo.sketchfabId)
  const tema = TEMA[corDaCategoria(modelo.categoriaId)]

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-xl sm:aspect-[16/10]">
      {!src ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
          <Box className="h-9 w-9 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Modelo 3D indisponível no momento.</p>
        </div>
      ) : ativo ? (
        <iframe
          title={modelo.titulo}
          src={`${src}?autostart=1&autospin=0.2&ui_theme=dark&dnt=1`}
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
          className="group/embed absolute inset-0 flex flex-col items-center justify-center gap-4"
          aria-label={`Carregar modelo 3D: ${modelo.titulo}`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${tema.grad}`} aria-hidden />
          {miniatura && (
            // eslint-disable-next-line @next/next/no-img-element -- imagem servida pela CDN do Sketchfab, fora dos domínios do next/image
            <img
              src={miniatura}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-60 transition duration-700 group-hover/embed:scale-105 group-hover/embed:opacity-75"
            />
          )}
          <div
            className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" aria-hidden />

          <div className="relative flex flex-col items-center gap-3">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/12 backdrop-blur transition-transform duration-300 group-hover/embed:scale-110">
              <Play className="ml-1 h-7 w-7 fill-white text-white" />
            </span>
            <span className="text-center">
              <span className="block text-base font-bold text-white">Carregar modelo 3D</span>
              <span className="mt-0.5 block text-xs text-white/60">Gire, aproxime e explore em 360°</span>
            </span>
          </div>
        </button>
      )}
    </div>
  )
}

function CardRelacionado({ modelo }: { modelo: Modelo3D }) {
  const tema = TEMA[corDaCategoria(modelo.categoriaId)]
  const categoria = CATEGORIAS.find(item => item.id === modelo.categoriaId)
  const Icone = categoria ? ICONS[categoria.icon] : FALLBACK_ICON
  return (
    <Link
      href={`/anatomia/anatomia-3d/${modelo.slug}`}
      prefetch={false}
      className={`group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition hover:shadow-md ${tema.hoverBorder}`}
    >
      <span className={`shrink-0 rounded-lg border ${tema.border} ${tema.bg} p-2`}>
        <Icone className={`h-4 w-4 ${tema.text}`} />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{modelo.titulo}</span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

export default function ModeloDetalhe() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const slug = typeof params?.slug === 'string' ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : ''
  const modelo = getModeloBySlug(slug)
  const miniaturas = useMiniaturas([modelo?.sketchfabId ?? null])

  if (!modelo) {
    return (
      <div className="surface-page min-h-screen">
        <div className="container mx-auto max-w-3xl px-4 py-20 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
            <Box className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <h1 className="mb-1 text-xl font-bold">Modelo não encontrado</h1>
          <p className="mb-6 text-sm text-muted-foreground">Este modelo 3D não existe ou foi movido.</p>
          <button
            type="button"
            onClick={() => router.push('/anatomia/anatomia-3d')}
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
  const Icone = ICONS[categoria.icon] || FALLBACK_ICON
  const relacionados = getRelacionados(modelo)
  const miniatura = modelo.sketchfabId ? miniaturas[modelo.sketchfabId] : undefined

  return (
    <div className="surface-page min-h-screen">
      {/* ── Cabeçalho ── */}
      <header className="relative overflow-hidden border-b border-border">
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tema.grad}`} aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-background" aria-hidden />

        <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-6">
          <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/anatomia" className="transition-colors hover:text-foreground">
              Domine Anatomia
            </Link>
            <ChevronRight className="h-3.5 w-3.5 opacity-50" />
            <Link href="/anatomia/anatomia-3d" className="transition-colors hover:text-foreground">
              Anatomia 3D
            </Link>
            <ChevronRight className="h-3.5 w-3.5 opacity-50" />
            <span className="font-medium text-foreground">{modelo.titulo}</span>
          </nav>

          <Link
            href={`/anatomia/anatomia-3d#cat-${modelo.categoriaId}`}
            className={`mb-4 inline-flex items-center gap-1.5 rounded-full border ${tema.border} ${tema.bg} px-3 py-1 text-xs font-semibold ${tema.text}`}
          >
            <Icone className="h-3.5 w-3.5" /> {categoria.titulo}
          </Link>

          <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            {modelo.titulo}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">{modelo.resumo}</p>
        </div>
      </header>

      {/* ── Corpo ── */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-6">
              <Visualizador3D modelo={modelo} miniatura={miniatura} />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Maximize2 className="h-3.5 w-3.5" /> Arraste para girar · pinça ou rolagem para aproximar
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <GraduationCap className="h-3.5 w-3.5 text-primary" /> Fonte: {FONTE}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <span className={`rounded-lg ${tema.bg} p-1.5`}>
                <RotateCw className={`h-4 w-4 ${tema.text}`} />
              </span>
              <h2 className="font-heading text-lg font-semibold tracking-tight">Anatomia aprofundada</h2>
            </div>

            <div className="space-y-4">
              {modelo.secoes.map((secao, indice) => (
                <section key={secao.titulo} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
                  <div className="mb-2 flex items-center gap-2.5">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${tema.bg} text-[11px] font-black tabular-nums ${tema.text}`}
                    >
                      {indice + 1}
                    </span>
                    <h3 className="font-bold leading-snug">{secao.titulo}</h3>
                  </div>
                  <div className="space-y-2 sm:pl-8">
                    {secao.paragrafos.map(paragrafo => (
                      <p key={paragrafo.slice(0, 40)} className="text-sm leading-relaxed text-muted-foreground">
                        {paragrafo}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <p className="mt-5 rounded-xl border border-border bg-muted/40 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
              Conteúdo com finalidade educacional. Modelo 3D cedido para estudo — Fonte: {FONTE}.
            </p>
          </div>
        </div>

        {relacionados.length > 0 && (
          <section className="mt-14 border-t border-border pt-8">
            <div className="mb-4 flex items-center gap-2">
              <Box className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-lg font-semibold tracking-tight">Mais de {categoria.titulo}</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {relacionados.map(item => (
                <CardRelacionado key={item.slug} modelo={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
