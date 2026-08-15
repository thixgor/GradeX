'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ResumoAnatomia } from '@/lib/anatomia/tipos'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Boxes,
  Compass,
  Droplets,
  GraduationCap,
  Layers,
  MapPin,
  RotateCw,
  Sparkles,
  Stethoscope,
  Target,
  Zap,
} from 'lucide-react'

/**
 * Página inicial de Domine Anatomia para quem assina.
 *
 * Toda a matéria-prima vem do resumo de `/api/anatomia` — títulos, capas e
 * contagens. Nenhum import do catálogo aqui: o hub é a primeira tela da seção e
 * não tem por que arrastar 900 KB de acervo só para listar dez sistemas.
 */

const CAMADAS = [
  { icone: MapPin, titulo: 'Localização', texto: 'Onde a estrutura está e o que ela tem em volta.' },
  { icone: Target, titulo: 'Função', texto: 'O que ela faz — e o que se perde quando falha.' },
  { icone: Droplets, titulo: 'Vascularização', texto: 'Quem irriga, quem drena e por onde.' },
  { icone: Zap, titulo: 'Inervação', texto: 'Nervo, raiz e o déficit que a lesão produz.' },
  { icone: Layers, titulo: 'Relações', texto: 'Os vizinhos que explicam o risco cirúrgico.' },
  { icone: Stethoscope, titulo: 'Clínica', texto: 'A prova, a enfermaria e o centro cirúrgico.' },
]

export function HubAnatomia({ catalogo }: { catalogo: ResumoAnatomia }) {
  const destaques = catalogo.destaques.slice(0, 4)
  const totalEstruturas = catalogo.totalMarcadores + catalogo.totalModelos

  return (
    <main className="surface-page min-h-screen">
      {/* ══════════ Hero ══════════ */}
      <section className="relative isolate overflow-hidden bg-slate-950">
        {/* Mural de capas reais do acervo: é anatomia, tem que se ver anatomia. */}
        <div className="absolute inset-0 grid grid-cols-3 opacity-40 sm:grid-cols-6" aria-hidden>
          {catalogo.sistemas.slice(0, 6).map((sistema, indice) => (
            <div key={sistema.slug} className="relative">
              <Image
                src={sistema.capa}
                alt=""
                fill
                priority={indice < 3}
                sizes="(max-width: 640px) 34vw, 17vw"
                className="object-cover grayscale-[0.25]"
              />
            </div>
          ))}
        </div>
        <div
          className="absolute inset-0 bg-[linear-gradient(to_top,#020617_12%,rgba(2,6,23,0.92)_48%,rgba(2,6,23,0.62)_100%)]"
          aria-hidden
        />
        <div className="pointer-events-none absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" aria-hidden />

        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-7 sm:pb-20 sm:pt-9">
          <Link
            href="/manual-clinico"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao Manual Clínico
          </Link>

          <div className="mb-4">
            <p className="editorial-mark !text-amber-300">Estudo visual e interativo</p>
          </div>
          <h1 className="max-w-4xl font-heading text-[2.75rem] font-semibold leading-[0.98] tracking-tight text-white sm:text-7xl">
            Domine Anatomia
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
            O corpo humano em duas linguagens que se completam: pranchas reais com cada estrutura marcada e explicada,
            e modelos tridimensionais que você gira na mão. Toque em qualquer estrutura e receba a ficha inteira —
            localização, função, vascularização, inervação e correlação clínica.
          </p>

          <dl className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { valor: catalogo.totalPranchas.toLocaleString('pt-BR'), rotulo: 'pranchas' },
              { valor: totalEstruturas.toLocaleString('pt-BR'), rotulo: 'estruturas' },
              { valor: catalogo.totalModelos.toLocaleString('pt-BR'), rotulo: 'modelos 3D' },
              { valor: catalogo.totalSistemas.toLocaleString('pt-BR'), rotulo: 'sistemas' },
            ].map(item => (
              <div key={item.rotulo} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur">
                <dt className="font-heading text-2xl font-semibold tabular-nums text-white sm:text-3xl">{item.valor}</dt>
                <dd className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-white/50">{item.rotulo}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ══════════ Duas experiências ══════════ */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Escolha uma experiência</p>
            <h2 className="mt-1 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Como você quer estudar hoje?
            </h2>
          </div>
          <span className="hidden text-xs text-muted-foreground sm:inline">Duas áreas, uma anatomia integrada</span>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Link
            href="/anatomia/atlas-anatomia"
            className="group relative isolate flex min-h-[420px] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-2xl"
          >
            <div className="relative h-56 overflow-hidden bg-slate-950">
              <div className="absolute inset-0 grid grid-cols-3">
                {catalogo.sistemas.slice(0, 3).map(sistema => (
                  <div key={sistema.slug} className="relative overflow-hidden">
                    <Image
                      src={sistema.capa}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 33vw, 200px"
                      className="object-cover transition duration-700 group-hover:scale-110"
                    />
                  </div>
                ))}
              </div>
              {/* As capas do acervo já trazem o nome do sistema impresso; o
                  escurecimento evita que essa tipografia dispute com o título
                  do card. */}
              <div className="absolute inset-0 bg-slate-950/45" aria-hidden />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/45 to-transparent" aria-hidden />
            </div>

            <div className="relative -mt-10 flex flex-1 flex-col p-6 sm:p-7">
              <span className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-primary/25 bg-primary/12 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-primary backdrop-blur">
                <BookOpen className="h-3.5 w-3.5" /> Atlas de Anatomia
              </span>
              <h3 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Explore peça por peça</h3>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                {catalogo.totalPranchas} pranchas do acervo com{' '}
                {catalogo.totalMarcadores.toLocaleString('pt-BR')} marcadores clicáveis. Zoom, tela cheia e um modo de
                estudo que esconde os rótulos para você tentar nomear antes de conferir.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                {['zoom e tela cheia', 'modo estudo', 'busca por estrutura', 'acervo autorizado'].map(item => (
                  <span key={item} className="rounded-full bg-muted px-2.5 py-1 font-medium">
                    {item}
                  </span>
                ))}
              </div>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary">
                Abrir o Atlas
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>

          <Link
            href="/anatomia/anatomia-3d"
            className="group relative isolate flex min-h-[420px] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-2xl"
          >
            <div className="relative h-56 overflow-hidden bg-gradient-to-br from-cyan-950 via-slate-950 to-indigo-950">
              <div
                className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]"
                aria-hidden
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative flex h-32 w-32 items-center justify-center rounded-[2rem] border border-cyan-300/20 bg-cyan-400/10 text-cyan-200 shadow-2xl backdrop-blur transition duration-700 group-hover:rotate-12 group-hover:scale-110">
                  <Boxes className="h-16 w-16" strokeWidth={1.2} />
                  <Sparkles className="absolute -right-3 -top-3 h-7 w-7 text-amber-300" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/25 to-transparent" aria-hidden />
            </div>

            <div className="relative -mt-10 flex flex-1 flex-col p-6 sm:p-7">
              <span className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/12 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-cyan-600 backdrop-blur dark:text-cyan-300">
                <RotateCw className="h-3.5 w-3.5" /> Anatomia 3D
              </span>
              <h3 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                Gire, aproxime, compreenda
              </h3>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                {catalogo.totalModelos} modelos em 360° distribuídos em {catalogo.categorias.length} categorias, cada um
                com uma explicação anatômica aprofundada. A capa já mostra a peça, e o modelo começa a girar quando o
                cursor para em cima.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                {['prévia na capa', 'interação 360°', 'explicação por seções', 'peças relacionadas'].map(item => (
                  <span key={item} className="rounded-full bg-muted px-2.5 py-1 font-medium">
                    {item}
                  </span>
                ))}
              </div>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-cyan-600 dark:text-cyan-300">
                Abrir a Anatomia 3D
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ══════════ Treino ══════════ */}
      <section className="mx-auto max-w-6xl px-4 pb-2">
        <Link
          href="/anatomia/atlas-anatomia/quiz"
          className="group flex flex-col gap-3 rounded-3xl border border-primary/25 bg-primary/[0.07] p-5 transition hover:border-primary/50 hover:bg-primary/10 sm:flex-row sm:items-center sm:p-6"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Target className="h-6 w-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-heading text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
              Quiz de identificação
            </span>
            <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
              A prancha aparece com um marcador só, sem rótulo, e você diz que estrutura é. Cada resposta vem comentada:
              o raciocínio de identificação, o aprofundamento e o porquê de cada alternativa errada.
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-primary">
            Treinar agora <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </section>

      {/* ══════════ O que cada estrutura entrega ══════════ */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <div className="mb-7 max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Um marcador, seis camadas</p>
            <h2 className="mt-1 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              O nome da estrutura é só o começo
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Um atlas comum diz que aquilo é o braquiorradial. Aqui, o mesmo marcador abre uma ficha com tudo o que se
              cobra dele — inclusive o detalhe de ser um flexor inervado pelo nervo radial.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CAMADAS.map(camada => (
              <div
                key={camada.titulo}
                className="flex gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/35"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <camada.icone className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold leading-tight">{camada.titulo}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{camada.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ Atalho por sistema ══════════ */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Ir direto ao ponto</p>
            <h2 className="mt-1 font-heading text-2xl font-semibold tracking-tight">Comece por um sistema</h2>
          </div>
          <Link
            href="/anatomia/atlas-anatomia"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary transition hover:gap-2.5"
          >
            Ver todos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {catalogo.sistemas.map(sistema => (
            <Link
              key={sistema.slug}
              href={`/anatomia/atlas-anatomia?sistema=${sistema.slug}`}
              className="group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-md transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl"
            >
              <Image
                src={sistema.capa}
                alt=""
                fill
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
                className="object-cover opacity-70 transition duration-700 group-hover:scale-110 group-hover:opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/25" aria-hidden />
              <div className="relative p-3">
                <h3 className="font-heading text-base font-semibold leading-tight text-white sm:text-lg">
                  {sistema.titulo}
                </h3>
                <p className="mt-0.5 text-[11px] font-medium text-white/55">{sistema.pranchas} pranchas</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════ Destaques 3D ══════════ */}
      {destaques.length > 0 && (
        <section className="border-t border-border bg-muted/25">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">
                  Modelos em destaque
                </p>
                <h2 className="mt-1 font-heading text-2xl font-semibold tracking-tight">Peças para girar agora</h2>
              </div>
              <Link
                href="/anatomia/anatomia-3d"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-cyan-600 transition hover:gap-2.5 dark:text-cyan-400"
              >
                Ver os {catalogo.totalModelos} modelos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {destaques.map(modelo => (
                <Link
                  key={modelo.slug}
                  href={`/anatomia/anatomia-3d/${modelo.slug}`}
                  prefetch={false}
                  className="group flex flex-col rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-cyan-500/40 hover:shadow-lg"
                >
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                    <RotateCw className="h-5 w-5" />
                  </span>
                  <h3 className="text-sm font-bold leading-snug">{modelo.titulo}</h3>
                  <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
                    {modelo.legenda}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-cyan-600 dark:text-cyan-400">
                    Abrir <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="mx-auto max-w-3xl px-4 py-10 text-center">
        <p className="inline-flex flex-wrap items-center justify-center gap-2 text-xs leading-relaxed text-muted-foreground">
          <Compass className="h-4 w-4 shrink-0 text-primary" />
          Conteúdo educacional. As pranchas vêm do acervo integral do Atlas de Anatomia, usado mediante
          autorização escrita.
          <GraduationCap className="h-4 w-4 shrink-0 text-primary" />
        </p>
      </footer>
    </main>
  )
}
