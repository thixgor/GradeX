'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { ResumoAnatomia } from '@/lib/anatomia/tipos'
import { lerUltimaVisita, type UltimaVisita } from '@/lib/anatomia/ultima-visita'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Boxes,
  Compass,
  Droplets,
  GraduationCap,
  History,
  Layers,
  MapPin,
  RotateCw,
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
 *
 * A ordem da página é a ordem da decisão de quem já pagou e voltou para
 * estudar, e não a de uma página de vendas:
 *
 * 1. **Continuar de onde parou** — o caminho de um toque, quando existe.
 * 2. **As três portas** (Atlas, 3D, Quiz) lado a lado, com o mesmo peso.
 * 3. **Os dez sistemas**, que levam direto ao acervo daquele sistema.
 *
 * O texto que explica o que a seção entrega desceu para o fim: quem está aqui
 * já comprou, e ler de novo a proposta antes de achar o botão é pedágio.
 */

const CAMADAS = [
  { icone: MapPin, titulo: 'Localização', texto: 'Onde está e o que tem em volta.' },
  { icone: Target, titulo: 'Função', texto: 'O que faz — e o que se perde quando falha.' },
  { icone: Droplets, titulo: 'Vascularização', texto: 'Quem irriga, quem drena e por onde.' },
  { icone: Zap, titulo: 'Inervação', texto: 'Nervo, raiz e o déficit da lesão.' },
  { icone: Layers, titulo: 'Relações', texto: 'Os vizinhos que explicam o risco cirúrgico.' },
  { icone: Stethoscope, titulo: 'Clínica', texto: 'A prova, a enfermaria e o centro cirúrgico.' },
]

/* ══════════════════════════ Retomada ══════════════════════════ */

/**
 * O atalho de volta ao último lugar aberto.
 *
 * Só existe depois da hidratação — `localStorage` não existe no servidor, e
 * renderizar o cartão no HTML inicial daria divergência de marcação.
 */
function ContinuarDeOndeParou() {
  const [visita, setVisita] = useState<UltimaVisita | null>(null)

  useEffect(() => {
    setVisita(lerUltimaVisita())
  }, [])

  if (!visita) return null

  const Icone = visita.tipo === 'modelo' ? RotateCw : BookOpen

  return (
    <Link
      href={visita.href}
      className="vidro vidro-brilho relevo relevo-toca group flex items-center gap-3 rounded-[22px] p-3.5 sm:p-4"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
        <Icone className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
          <History className="h-3 w-3" /> Continuar de onde parou
        </span>
        <span className="mt-0.5 block truncate font-heading text-base font-semibold leading-tight sm:text-lg">
          {visita.titulo}
        </span>
        {visita.detalhe && (
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{visita.detalhe}</span>
        )}
      </span>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:translate-x-0.5">
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  )
}

/* ══════════════════════════ Portas ══════════════════════════ */

function Porta({
  href,
  etiqueta,
  titulo,
  texto,
  icone: Icone,
  acento,
  children,
}: {
  href: string
  etiqueta: string
  titulo: string
  texto: string
  icone: typeof BookOpen
  /** Cor do selo e do call-to-action — diferencia as três portas de relance. */
  acento: string
  /** Faixa visual do topo do cartão. */
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="vidro vidro-brilho relevo relevo-toca group flex flex-col overflow-hidden rounded-[26px]"
    >
      <div className="relative h-36 overflow-hidden sm:h-40">{children}</div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <span
          className={`mb-2.5 inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${acento}`}
        >
          <Icone className="h-3.5 w-3.5" /> {etiqueta}
        </span>
        <h3 className="font-heading text-xl font-semibold leading-tight tracking-tight sm:text-2xl">{titulo}</h3>
        <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-muted-foreground">{texto}</p>
        <span className="mt-3.5 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
          Abrir
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  )
}

/* ══════════════════════════ Página ══════════════════════════ */

export function HubAnatomia({ catalogo }: { catalogo: ResumoAnatomia }) {
  const destaques = catalogo.destaques.slice(0, 4)
  const totalEstruturas = catalogo.totalMarcadores + catalogo.totalModelos

  return (
    <main className="surface-page anatomia-ambiente min-h-screen">
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
          className="absolute inset-0 bg-[linear-gradient(to_top,#020617_10%,rgba(2,6,23,0.9)_52%,rgba(2,6,23,0.58)_100%)]"
          aria-hidden
        />
        <div className="pointer-events-none absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" aria-hidden />

        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-7 sm:pb-14 sm:pt-9">
          <Link
            href="/manual-clinico"
            className="mb-7 inline-flex items-center gap-1.5 text-sm text-white/55 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao Manual Clínico
          </Link>

          <p className="editorial-mark !text-amber-300">Estudo visual e interativo</p>
          <h1 className="mt-3 max-w-4xl font-heading text-[2.6rem] font-semibold leading-[0.98] tracking-tight text-white sm:text-6xl">
            Domine Anatomia
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/70 sm:text-lg">
            Pranchas reais com cada estrutura marcada e explicada, e peças tridimensionais que você gira na mão.
            Toque num marcador e receba a ficha inteira.
          </p>

          <dl className="mt-7 grid max-w-2xl grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { valor: catalogo.totalPranchas.toLocaleString('pt-BR'), rotulo: 'pranchas' },
              { valor: totalEstruturas.toLocaleString('pt-BR'), rotulo: 'estruturas' },
              { valor: catalogo.totalModelos.toLocaleString('pt-BR'), rotulo: 'modelos 3D' },
              { valor: catalogo.totalSistemas.toLocaleString('pt-BR'), rotulo: 'sistemas' },
            ].map(item => (
              <div key={item.rotulo} className="anatomia-vidro-escuro rounded-2xl p-3">
                <dt className="font-heading text-2xl font-semibold tabular-nums text-white sm:text-3xl">{item.valor}</dt>
                <dd className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-white/55">{item.rotulo}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ══════════ Retomada + três portas ══════════ */}
      <section className="mx-auto max-w-6xl px-4 py-6 sm:py-9">
        <div className="mb-4">
          <ContinuarDeOndeParou />
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <Porta
            href="/anatomia/atlas-anatomia"
            etiqueta="Atlas de Anatomia"
            titulo="Explore peça por peça"
            texto={`${catalogo.totalPranchas} pranchas com ${catalogo.totalMarcadores.toLocaleString('pt-BR')} marcadores clicáveis, zoom, tela cheia e modo de estudo.`}
            icone={BookOpen}
            acento="border-primary/25 bg-primary/12 text-primary"
          >
            <div className="absolute inset-0 grid grid-cols-3">
              {catalogo.sistemas.slice(0, 3).map(sistema => (
                <div key={sistema.slug} className="relative overflow-hidden bg-slate-950">
                  <Image
                    src={sistema.capa}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 33vw, 160px"
                    className="object-cover transition duration-700 group-hover:scale-110"
                  />
                </div>
              ))}
            </div>
            <div className="absolute inset-0 bg-slate-950/40" aria-hidden />
          </Porta>

          <Porta
            href="/anatomia/anatomia-3d"
            etiqueta="Anatomia 3D"
            titulo="Gire, aproxime, compreenda"
            texto={`${catalogo.totalModelos} modelos em 360° em ${catalogo.categorias.length} categorias, cada um com explicação aprofundada.`}
            icone={RotateCw}
            acento="border-cyan-500/25 bg-cyan-500/12 text-cyan-600 dark:text-cyan-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-950 via-slate-950 to-indigo-950" aria-hidden />
            <div
              className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]"
              aria-hidden
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="anatomia-vidro-escuro flex h-24 w-24 items-center justify-center rounded-[1.75rem] text-cyan-200 transition duration-700 group-hover:rotate-12 group-hover:scale-110">
                <Boxes className="h-12 w-12" strokeWidth={1.2} />
              </span>
            </div>
          </Porta>

          <Porta
            href="/anatomia/atlas-anatomia/quiz"
            etiqueta="Quiz de identificação"
            titulo="Teste o que já sabe"
            texto="A prancha aparece com um marcador só, sem rótulo, e você diz que estrutura é. Cada resposta vem comentada."
            icone={Target}
            acento="border-amber-500/25 bg-amber-500/12 text-amber-700 dark:text-amber-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-slate-950 to-emerald-950" aria-hidden />
            <div
              className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]"
              aria-hidden
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="anatomia-vidro-escuro flex h-24 w-24 items-center justify-center rounded-[1.75rem] text-amber-200 transition duration-700 group-hover:scale-110">
                <Target className="h-12 w-12" strokeWidth={1.2} />
              </span>
            </div>
          </Porta>
        </div>
      </section>

      {/* ══════════ Atalho por sistema ══════════ */}
      <section className="mx-auto max-w-6xl px-4 pb-8 sm:pb-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
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
              className="relevo relevo-toca group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-[22px] border border-white/10 bg-slate-950"
            >
              <Image
                src={sistema.capa}
                alt=""
                fill
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
                className="object-cover opacity-70 transition duration-700 group-hover:scale-110 group-hover:opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" aria-hidden />
              <div className="relative p-3">
                <h3 className="font-heading text-base font-semibold leading-tight text-white sm:text-lg">
                  {sistema.titulo}
                </h3>
                <p className="mt-0.5 text-[11px] font-medium text-white/55">
                  {sistema.pranchas} pranchas · {sistema.marcadores.toLocaleString('pt-BR')} estruturas
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════ Destaques 3D ══════════ */}
      {destaques.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-8 sm:pb-12">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
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
                className="vidro-leve vidro-brilho relevo relevo-toca group flex flex-col rounded-[22px] p-4"
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
        </section>
      )}

      {/* ══════════ O que cada marcador entrega ══════════ */}
      <section className="mx-auto max-w-6xl px-4 pb-10 sm:pb-14">
        <div className="vidro vidro-brilho relevo rounded-[26px] p-5 sm:p-7">
          <div className="mb-5 max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Um marcador, seis camadas</p>
            <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight sm:text-2xl">
              O nome da estrutura é só o começo
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Um atlas comum diz que aquilo é o braquiorradial. Aqui, o mesmo marcador abre uma ficha com tudo o que
              se cobra dele — inclusive o detalhe de ser um flexor inervado pelo nervo radial.
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {CAMADAS.map(camada => (
              <div key={camada.titulo} className="flex gap-3 rounded-2xl border border-border/60 bg-card/50 p-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <camada.icone className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold leading-tight">{camada.titulo}</h3>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{camada.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-3xl px-4 pb-12 text-center">
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
