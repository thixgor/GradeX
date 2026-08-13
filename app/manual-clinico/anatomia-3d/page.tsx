import Image from 'next/image'
import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { ATLAS_TOTALS } from '@/lib/atlas-anatomia/catalogo'
import { CATEGORIAS, TOTAL_MODELOS } from '@/lib/anatomia-3d/modelos'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Box,
  GraduationCap,
  MapPin,
  RotateCw,
  Sparkles,
} from 'lucide-react'

const atlasCovers = [
  '/atlas-anatomia/capa/capa-circulatorio.png',
  '/atlas-anatomia/capa/capa-nervoso.png',
  '/atlas-anatomia/capa/capa-muscular.png',
]

export default function DomineAnatomiaPage() {
  return (
    <AppShell allowGuest showHeader={false}>
      <main className="surface-page min-h-screen">
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-muted/30" aria-hidden />
          <div
            className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
            aria-hidden
          />

          <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-8 sm:pb-16">
            <Link
              href="/manual-clinico"
              className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar ao Manual Clínico
            </Link>

            <div className="max-w-3xl">
              <p className="editorial-mark mb-3">Manual Clínico · estudo visual e interativo</p>
              <h1 className="font-heading text-4xl font-semibold leading-[1.04] tracking-tight text-foreground sm:text-6xl">
                Domine Anatomia
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Escolha como explorar o corpo humano: em pranchas anatômicas reais, com estruturas marcadas e
                contexto clínico, ou em modelos tridimensionais que você pode girar e aproximar.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Escolha uma experiência</p>
              <h2 className="mt-1 font-heading text-2xl font-semibold tracking-tight">Como você quer estudar hoje?</h2>
            </div>
            <span className="hidden text-xs text-muted-foreground sm:inline">Duas áreas, uma anatomia integrada</span>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Link
              href="/manual-clinico/anatomia-3d/atlas"
              className="group relative min-h-[430px] overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
            >
              <div className="absolute inset-x-0 top-0 grid h-52 grid-cols-3 overflow-hidden">
                {atlasCovers.map((cover, index) => (
                  <div key={cover} className="relative overflow-hidden">
                    <Image
                      src={cover}
                      alt=""
                      fill
                      priority={index === 0}
                      sizes="(max-width: 1024px) 33vw, 180px"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                  </div>
                ))}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/10 to-card" />
              </div>

              <div className="relative flex h-full min-h-[430px] flex-col justify-end p-6 sm:p-8">
                <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-primary">
                  <BookOpen className="h-3.5 w-3.5" /> Atlas de Anatomia
                </div>
                <h3 className="font-heading text-3xl font-semibold tracking-tight">Explore peça por peça</h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {ATLAS_TOTALS.pieces} pranchas hospedadas no GradeX, com {ATLAS_TOTALS.markers.toLocaleString('pt-BR')} marcadores
                  clicáveis, posicionamento anatômico, função e correlação clínica.
                </p>
                <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> estruturas marcadas
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-primary" /> acervo UFJF autorizado
                  </span>
                </div>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary">
                  Abrir Atlas de Anatomia
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>

            <Link
              href="/manual-clinico/anatomia-3d/modelos"
              className="group relative min-h-[430px] overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-xl"
            >
              <div className="absolute inset-x-0 top-0 h-52 overflow-hidden bg-gradient-to-br from-cyan-950 via-slate-950 to-indigo-950">
                <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative flex h-32 w-32 items-center justify-center rounded-[2rem] border border-cyan-300/20 bg-cyan-400/10 text-cyan-200 shadow-2xl backdrop-blur transition duration-700 group-hover:rotate-6 group-hover:scale-110">
                    <Box className="h-16 w-16" strokeWidth={1.3} />
                    <Sparkles className="absolute -right-3 -top-3 h-7 w-7 text-amber-300" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/5 to-card" />
              </div>

              <div className="relative flex h-full min-h-[430px] flex-col justify-end p-6 sm:p-8">
                <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-300">
                  <RotateCw className="h-3.5 w-3.5" /> Anatomia 3D
                </div>
                <h3 className="font-heading text-3xl font-semibold tracking-tight">Gire, aproxime, compreenda</h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {TOTAL_MODELOS} modelos em 360°, organizados em {CATEGORIAS.length} categorias e acompanhados de
                  explicações anatômicas aprofundadas.
                </p>
                <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
                    <RotateCw className="h-3.5 w-3.5 text-cyan-600" /> interação em 360°
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-600" /> explicação aprofundada
                  </span>
                </div>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-cyan-600 dark:text-cyan-300">
                  Abrir Anatomia 3D
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </div>

          <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
            Conteúdo educacional. O Atlas de Anatomia utiliza o acervo integral da UFJF mediante autorização escrita.
          </p>
        </section>
      </main>
    </AppShell>
  )
}
