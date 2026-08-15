'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { usePricingEventState } from '@/components/pricing-events/usePricingEventState'
import { FaixaDoPacote, GradeDoPacote, ListaDoPacote } from '@/components/manual-clinico/pacote'
import { TOTAL_DE_MODULOS, precoPorModulo } from '@/lib/manual-clinico/pacote'
import { PranchaInterativa } from '@/components/anatomia/prancha-interativa'
import { FichaMarcador } from '@/components/anatomia/ficha-estrutura'
import type { ResumoAnatomia, RespostaAcessoAnatomia } from '@/lib/anatomia/tipos'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Crown,
  Droplets,
  Flame,
  GraduationCap,
  Layers,
  Lock,
  MapPin,
  Maximize2,
  MousePointerClick,
  RotateCw,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  Zap,
} from 'lucide-react'

/**
 * Landing de vendas de Domine Anatomia.
 *
 * É o que o visitante sem login e o usuário sem assinatura veem no lugar da
 * seção. A régua aqui foi mostrar em vez de descrever: no meio da página existe
 * uma prancha de verdade, com os marcadores funcionando e a ficha completa de
 * cada estrutura dela. Quem chega consegue usar o produto antes de decidir — o
 * que fica do outro lado do muro são as outras 417 pranchas e os 98 modelos.
 *
 * A página é a mesma para as três rotas da seção; o parâmetro `secao` só ajusta
 * o texto de entrada para quem caiu direto no Atlas ou na Anatomia 3D.
 */

function reais(valor: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor || 0))
}

const CAMADAS = [
  { icone: MapPin, titulo: 'Localização', texto: 'Onde a estrutura está, em que plano vive e o que tem em volta.' },
  { icone: Target, titulo: 'Função', texto: 'O que ela faz — e exatamente o que se perde quando falha.' },
  { icone: Droplets, titulo: 'Vascularização', texto: 'Quem irriga, quem drena e por onde o sangue chega e sai.' },
  { icone: Zap, titulo: 'Inervação', texto: 'Nervo, raiz de origem e o déficit que a lesão produz.' },
  { icone: Layers, titulo: 'Relações', texto: 'Os vizinhos que explicam o risco cirúrgico e o achado de imagem.' },
  { icone: Stethoscope, titulo: 'Correlação clínica', texto: 'O que cai na prova, na enfermaria e no centro cirúrgico.' },
]

const PERGUNTAS = [
  {
    q: 'Domine Anatomia é vendido separado?',
    a: 'Não — e nenhuma outra seção é. É tudo numa compra só: além do Domine Anatomia, o mesmo pagamento abre as 300+ patologias do Manual Clínico, a Farmacologia, o Manual do Eletrocardiograma, o Manual de Radiologia, o Manual de Histologia, os Exames Laboratoriais e as 201 Ferramentas Clínicas. Tudo isso também já vem incluído nas contas DomineAqui Plus+.',
  },
  {
    q: 'Preciso ter conta para comprar?',
    a: 'Não. A compra pode ser feita sem conta: a Serial Key chega no seu e-mail e libera o acesso. Se você já tem conta, o acesso aparece assim que o pagamento é confirmado.',
  },
  {
    q: 'De onde vêm as pranchas?',
    a: 'Do acervo integral do Atlas Interativo de Anatomia Humana, usado mediante autorização escrita. Os aprofundamentos de cada estrutura — localização, função, vascularização, inervação e clínica — são conteúdo editorial do GradeX.',
  },
  {
    q: 'Funciona no celular?',
    a: 'Sim. A prancha tem zoom, arraste e tela cheia, e a ficha da estrutura abre numa gaveta pensada para a tela pequena. Os modelos 3D giram com o dedo.',
  },
]

export interface VitrineAnatomiaProps {
  dados: RespostaAcessoAnatomia
  secao?: 'hub' | 'atlas' | 'modelos'
}

export function VitrineAnatomia({ dados, secao = 'hub' }: VitrineAnatomiaProps) {
  const router = useRouter()
  const catalogo = dados.catalogo
  const autenticado = dados.isAuthenticated

  const planosAtivos = (dados.product?.plans || []).filter(plano => plano.enabled && plano.price > 0)
  const planoMaisBarato = planosAtivos.reduce<(typeof planosAtivos)[number] | null>(
    (menor, plano) => (menor == null || plano.price < menor.price ? plano : menor),
    null,
  )
  const precoBase = planoMaisBarato?.price ?? dados.product?.currentPrice ?? 0
  const eventoId = planoMaisBarato?.pricingEventId || dados.product?.pricingEventId || null
  const { state: evento } = usePricingEventState(eventoId)

  const descontoPct = evento?.activeTier?.discountPercent || 0
  const temLote = Boolean(evento?.activeTier) && evento?.isActive !== false && descontoPct > 0 && precoBase > 0
  const precoFinal = temLote ? Math.max(0, Math.round(precoBase * (1 - descontoPct / 100) * 100) / 100) : precoBase
  const mostrarPreco = dados.product?.isActive !== false && precoBase > 0

  function irParaCheckout() {
    router.push('/manual-clinico/checkout')
  }

  const rotuloCta = `Quero os ${TOTAL_DE_MODULOS} manuais`
  // O total sobre sete — o número que se compara com o preço de um atlas avulso.
  const porManual = precoPorModulo(precoFinal)

  const chamadas = {
    hub: {
      olho: 'Seção premium · Manual Clínico',
      titulo: 'Domine Anatomia',
      linha:
        'O corpo humano em duas linguagens que se completam: pranchas reais com cada estrutura marcada e explicada, e modelos tridimensionais que você gira na mão.',
    },
    atlas: {
      olho: 'Atlas de Anatomia · acervo completo',
      titulo: 'O atlas que responde',
      linha:
        'Pranchas anatômicas reais com as estruturas marcadas. Toque em qualquer marcador e receba a ficha inteira — não só o nome.',
    },
    modelos: {
      olho: 'Anatomia 3D · modelos interativos',
      titulo: 'Anatomia que você gira',
      linha:
        'Peças anatômicas rotacionáveis em 360°, organizadas por sistema e acompanhadas de uma explicação aprofundada em cada uma.',
    },
  }[secao]

  return (
    <div className="surface-page min-h-screen pb-28 lg:pb-0">
      {/* ══════════════ Hero ══════════════ */}
      <header className="relative isolate overflow-hidden bg-slate-950">
        <div className="absolute inset-0 grid grid-cols-3 opacity-40 sm:grid-cols-6" aria-hidden>
          {catalogo.sistemas.slice(0, 6).map((sistema, indice) => (
            <div key={sistema.slug} className="relative">
              <Image
                src={sistema.capa}
                alt=""
                fill
                priority={indice < 3}
                sizes="(max-width: 640px) 34vw, 17vw"
                className="object-cover grayscale-[0.3]"
              />
            </div>
          ))}
        </div>
        <div
          className="absolute inset-0 bg-[linear-gradient(to_top,#020617_14%,rgba(2,6,23,0.94)_52%,rgba(2,6,23,0.66)_100%)]"
          aria-hidden
        />
        <div className="pointer-events-none absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl" aria-hidden />

        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-7 sm:pb-16 sm:pt-9">
          <button
            type="button"
            onClick={() => router.push('/manual-clinico')}
            className="mb-7 inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao Manual Clínico
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-400/12 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-amber-300">
              <Crown className="h-3.5 w-3.5" /> {TOTAL_DE_MODULOS} manuais · 1 pagamento único
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">{chamadas.olho}</span>
          </div>

          <h1 className="mt-4 max-w-4xl font-heading text-[2.6rem] font-semibold leading-[0.98] tracking-tight text-white sm:text-6xl lg:text-7xl">
            {chamadas.titulo}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">{chamadas.linha}</p>

          <dl className="mt-8 grid max-w-3xl grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
            {[
              { valor: catalogo.totalPranchas.toLocaleString('pt-BR'), rotulo: 'pranchas reais' },
              { valor: catalogo.totalMarcadores.toLocaleString('pt-BR'), rotulo: 'estruturas com ficha' },
              { valor: catalogo.totalModelos.toLocaleString('pt-BR'), rotulo: 'modelos 3D' },
              { valor: catalogo.totalSistemas.toLocaleString('pt-BR'), rotulo: 'sistemas' },
            ].map(item => (
              <div key={item.rotulo} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur">
                <dt className="font-heading text-2xl font-semibold tabular-nums text-white sm:text-3xl">{item.valor}</dt>
                <dd className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-white/50">{item.rotulo}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={irParaCheckout}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg transition hover:bg-primary/90 active:scale-[0.98]"
            >
              <Crown className="h-4 w-4" />
              {rotuloCta}
              <ArrowRight className="h-4 w-4" />
            </button>
            {/* Sem preço na primeira dobra: aqui a pessoa ainda não sabe que a
                mesma compra abre outros seis manuais, e o número lido antes
                disso vira comparação com o preço de um atlas avulso. */}
            <p className="text-sm text-white/60">
              Domine Anatomia é <span className="font-black text-white">1 dos {TOTAL_DE_MODULOS} manuais</span>{' '}
              que este acesso abre
            </p>
          </div>

          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/45">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> {TOTAL_DE_MODULOS} manuais na mesma compra
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> Incluso no DomineAqui Plus+
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> Acesso imediato
            </span>
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-8">
        <FaixaDoPacote atual="anatomia" />
      </div>

      {/* ══════════════ Amostra grátis: uma prancha de verdade ══════════════ */}
      {catalogo.amostra && (
        <AmostraInterativa amostra={catalogo.amostra} totalPranchas={catalogo.totalPranchas} />
      )}

      {/* ══════════════ O que cada marcador entrega ══════════════ */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Um marcador, seis camadas</p>
            <h2 className="mt-1.5 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              O nome da estrutura é só o começo
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Um atlas comum diz que aquilo é o braquiorradial e para por aí. Aqui, o mesmo marcador abre a ficha
              inteira — inclusive o detalhe que cai em prova: é um flexor, mas quem o inerva é o nervo dos extensores.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CAMADAS.map(camada => (
              <div key={camada.titulo} className="flex gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/35">
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

      {/* ══════════════ As duas experiências ══════════════ */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="mb-7 max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">O que vem junto</p>
          <h2 className="mt-1.5 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Duas áreas, uma anatomia integrada
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <BlocoExperiencia
            icone={BookOpen}
            selo="Atlas de Anatomia"
            titulo="Explore peça por peça"
            descricao={`${catalogo.totalPranchas} pranchas do acervo com ${catalogo.totalMarcadores.toLocaleString('pt-BR')} marcadores clicáveis, distribuídas em ${catalogo.totalSistemas} sistemas.`}
            recursos={[
              { icone: Maximize2, texto: 'Zoom, arraste e tela cheia em cada prancha' },
              { icone: Search, texto: 'Busca de estrutura em todo o sistema' },
              { icone: Target, texto: 'Quiz de identificação com resposta comentada' },
              { icone: Stethoscope, texto: 'Ficha completa em cada estrutura marcada' },
            ]}
            tom="primary"
          />
          <BlocoExperiencia
            icone={RotateCw}
            selo="Anatomia 3D"
            titulo="Gire, aproxime, compreenda"
            descricao={`${catalogo.totalModelos} modelos rotacionáveis em 360°, organizados em ${catalogo.categorias.length} categorias, cada um com explicação anatômica aprofundada.`}
            recursos={[
              { icone: RotateCw, texto: 'Interação em 360° com pinça e arraste' },
              { icone: Sparkles, texto: 'Prévia do modelo já na capa do card' },
              { icone: Layers, texto: 'Explicação dividida em seções por peça' },
              { icone: MousePointerClick, texto: 'Peças relacionadas para encadear o estudo' },
            ]}
            tom="cyan"
          />
        </div>
      </section>

      {/* ══════════════ Sistemas ══════════════ */}
      <section className="border-t border-border bg-muted/25">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <div className="mb-6 max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">O acervo inteiro</p>
            <h2 className="mt-1.5 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Os {catalogo.totalSistemas} sistemas que você desbloqueia
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {catalogo.sistemas.map(sistema => (
              <div
                key={sistema.slug}
                className="group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-md"
              >
                <Image
                  src={sistema.capa}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
                  className="object-cover opacity-60 transition duration-700 group-hover:scale-105 group-hover:opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" aria-hidden />
                <span className="absolute right-2.5 top-2.5 rounded-full bg-black/50 p-1.5 text-white/70 backdrop-blur">
                  <Lock className="h-3.5 w-3.5" />
                </span>
                <div className="relative p-3">
                  <h3 className="font-heading text-base font-semibold leading-tight text-white sm:text-lg">
                    {sistema.titulo}
                  </h3>
                  <p className="mt-0.5 text-[11px] font-medium text-white/55">
                    {sistema.pranchas} pranchas · {sistema.marcadores.toLocaleString('pt-BR')} estruturas
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-1.5">
            {catalogo.categorias.map(categoria => (
              <span
                key={categoria.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground"
              >
                {categoria.titulo}
                <span className="font-bold tabular-nums text-primary">{categoria.quantidade}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ O pacote: o valor inteiro, antes do preço ══════════════ */}
      <section className="mx-auto max-w-6xl px-4 pt-12 sm:pt-16">
        <GradeDoPacote atual="anatomia" />
      </section>

      {/* ══════════════ Preço ══════════════ */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="space-y-5">
            <div className="relative overflow-hidden rounded-2xl border border-amber-500/25 bg-card p-5 shadow-sm sm:p-7">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" aria-hidden />
              <div className="flex items-start gap-3">
                <span className="shrink-0 rounded-xl bg-amber-400/15 p-2.5 text-amber-600 dark:text-amber-400">
                  <Lock className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="editorial-mark">A oferta inteira</p>
                  <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                    Você não escolhe um manual. Você leva os {TOTAL_DE_MODULOS}.
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Nenhuma seção é vendida à parte. O mesmo pagamento que abre as {catalogo.totalPranchas}{' '}
                    pranchas e os {catalogo.totalModelos} modelos daqui abre também as 300+ patologias do{' '}
                    <strong className="text-foreground">Manual Clínico</strong>, a Farmacologia, o simulador de
                    ECG, o Manual de Radiologia, o Manual de Histologia e as Ferramentas Clínicas — e tudo isso
                    já vem incluso nas contas <strong className="text-foreground">DomineAqui Plus+</strong>.
                  </p>
                </div>
              </div>

              <ListaDoPacote atual="anatomia" className="mt-5" />
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <h3 className="font-heading text-base font-semibold tracking-tight">Perguntas frequentes</h3>
              <div className="mt-3 divide-y divide-border">
                {PERGUNTAS.map(item => (
                  <Pergunta key={item.q} pergunta={item.q} resposta={item.a} />
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
            {mostrarPreco ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Os {TOTAL_DE_MODULOS} manuais por
                  {planoMaisBarato?.label ? ` · plano ${planoMaisBarato.label}` : ''}
                </p>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  {temLote && <span className="text-base text-muted-foreground line-through">{reais(precoBase)}</span>}
                  <span className="text-3xl font-black tracking-tight text-primary sm:text-4xl">{reais(precoFinal)}</span>
                  {temLote && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      <Flame className="h-3 w-3" /> −{Math.round(descontoPct)}%
                    </span>
                  )}
                </div>
                {porManual != null && (
                  <p className="mt-2 text-[13px] font-bold leading-snug text-emerald-700 dark:text-emerald-300">
                    Dá {reais(porManual)} por manual.
                  </p>
                )}
                {temLote && evento?.activeTier?.label && (
                  <p className="mt-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                    Lote {evento.activeTier.label} — você economiza {reais(precoBase - precoFinal)}.
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Acesso liberado para assinantes do Manual Clínico e contas DomineAqui Plus+.
              </p>
            )}

            <button
              type="button"
              onClick={irParaCheckout}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
            >
              <Crown className="h-4 w-4" />
              {rotuloCta}
              <ArrowRight className="h-4 w-4" />
            </button>

            <ul className="mt-4 space-y-1.5">
              {[
                'Acesso imediato após o pagamento',
                `As ${catalogo.totalPranchas} pranchas e os ${catalogo.totalModelos} modelos inclusos`,
                `Os ${TOTAL_DE_MODULOS} manuais juntos — não há venda avulsa de nenhum`,
                'Conteúdo novo entra no mesmo acesso, sem cobrança extra',
                ...(autenticado ? [] : ['Sem conta? A Serial Key vai por e-mail']),
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Pix, cartão ou boleto · pagamento processado com
              segurança.
            </p>
          </div>
        </div>

        <p className="mt-10 flex flex-wrap items-center justify-center gap-2 text-center text-xs leading-relaxed text-muted-foreground">
          <GraduationCap className="h-4 w-4 shrink-0 text-primary" />
          Conteúdo educacional. As pranchas vêm do acervo integral do Atlas de Anatomia, usado mediante
          autorização escrita.
        </p>
      </section>

      {/* ══════════════ Barra fixa do celular ══════════════ */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-3">
          {mostrarPreco && (
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                {temLote
                  ? `−${Math.round(descontoPct)}% · ${TOTAL_DE_MODULOS} manuais`
                  : `${TOTAL_DE_MODULOS} manuais inclusos`}
              </p>
              <p className="flex items-baseline gap-1.5">
                {temLote && <span className="text-[11px] text-muted-foreground line-through">{reais(precoBase)}</span>}
                <span className="text-lg font-black leading-tight text-primary">{reais(precoFinal)}</span>
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={irParaCheckout}
            className="ml-auto inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm transition active:scale-[0.98]"
          >
            <Crown className="h-4 w-4" />
            Quero os {TOTAL_DE_MODULOS}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════ Amostra ══════════════════════════ */

function AmostraInterativa({
  amostra,
  totalPranchas,
}: {
  amostra: NonNullable<ResumoAnatomia['amostra']>
  totalPranchas: number
}) {
  const [indice, setIndice] = useState<number | null>(amostra.indiceDestaque)
  const marcador = indice === null ? null : amostra.prancha.markers[indice] || null
  const insight = indice === null ? null : amostra.fichas[indice] || null

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <div className="mb-7 max-w-2xl">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          <Sparkles className="h-3.5 w-3.5" /> Amostra liberada
        </span>
        <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Experimente antes: esta prancha é sua
        </h2>
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Uma prancha de verdade do acervo, com os marcadores funcionando. Aproxime, arraste e toque em qualquer número
          para ler a ficha completa da estrutura — exatamente como o assinante vê nas outras{' '}
          {Math.max(totalPranchas - 1, 0).toLocaleString('pt-BR')}.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
        <div className="min-w-0">
          <div className="mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {amostra.sistema} · {amostra.colecao}
            </p>
            <h3 className="font-heading text-lg font-semibold leading-tight tracking-tight sm:text-xl">
              {amostra.prancha.title}
            </h3>
          </div>

          <PranchaInterativa
            imagem={amostra.prancha.image}
            alt={`${amostra.colecao}: ${amostra.prancha.title}`}
            marcadores={amostra.prancha.markers}
            indiceAtivo={indice}
            onSelecionar={setIndice}
            modoEstudo={false}
            chaveDaPeca={amostra.prancha.id}
          />

          <div className="mt-3 flex flex-wrap gap-1.5">
            {amostra.prancha.markers.map((item, posicao) => {
              const ativo = posicao === indice
              return (
                <button
                  key={`${item.title}-${posicao}`}
                  type="button"
                  onClick={() => setIndice(ativo ? null : posicao)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left text-xs font-medium transition ${
                    ativo
                      ? 'border-amber-500/50 bg-amber-500/15 text-amber-800 dark:text-amber-200'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-black tabular-nums ${
                      ativo ? 'bg-amber-500 text-amber-950' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {posicao + 1}
                  </span>
                  {item.title}
                </button>
              )
            })}
          </div>
        </div>

        <div className="lg:sticky lg:top-6">
          {marcador && insight ? (
            <FichaMarcador
              titulo={marcador.title}
              numero={(indice || 0) + 1}
              insight={insight}
              chave={`${amostra.prancha.id}:${indice}`}
            />
          ) : (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/25 p-6 text-center">
              <span className="rounded-2xl bg-sky-500/10 p-3 text-sky-600 dark:text-sky-400">
                <MousePointerClick className="h-6 w-6" />
              </span>
              <h3 className="mt-3 font-heading text-lg font-semibold tracking-tight">Toque em um marcador</h3>
              <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted-foreground">
                A ficha completa da estrutura aparece aqui.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/* ══════════════════════════ Blocos ══════════════════════════ */

function BlocoExperiencia({
  icone: Icone,
  selo,
  titulo,
  descricao,
  recursos,
  tom,
}: {
  icone: React.ComponentType<{ className?: string }>
  selo: string
  titulo: string
  descricao: string
  recursos: Array<{ icone: React.ComponentType<{ className?: string }>; texto: string }>
  tom: 'primary' | 'cyan'
}) {
  const cores =
    tom === 'cyan'
      ? {
          selo: 'border-cyan-500/25 bg-cyan-500/12 text-cyan-600 dark:text-cyan-300',
          icone: 'text-cyan-600 dark:text-cyan-400',
          borda: 'hover:border-cyan-500/40',
        }
      : {
          selo: 'border-primary/25 bg-primary/12 text-primary',
          icone: 'text-primary',
          borda: 'hover:border-primary/40',
        }

  return (
    <div className={`flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm transition sm:p-7 ${cores.borda}`}>
      <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wider ${cores.selo}`}>
        <Icone className="h-3.5 w-3.5" /> {selo}
      </span>
      <h3 className="mt-3.5 font-heading text-2xl font-semibold tracking-tight">{titulo}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{descricao}</p>
      <ul className="mt-5 space-y-2.5">
        {recursos.map(recurso => (
          <li key={recurso.texto} className="flex items-start gap-2.5 text-sm">
            <recurso.icone className={`mt-0.5 h-4 w-4 shrink-0 ${cores.icone}`} />
            <span className="text-muted-foreground">{recurso.texto}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Pergunta({ pergunta, resposta }: { pergunta: string; resposta: string }) {
  const [aberta, setAberta] = useState(false)
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <button
        type="button"
        onClick={() => setAberta(atual => !atual)}
        aria-expanded={aberta}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="text-sm font-semibold leading-snug">{pergunta}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${aberta ? 'rotate-180' : ''}`} />
      </button>
      {aberta && <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{resposta}</p>}
    </div>
  )
}
