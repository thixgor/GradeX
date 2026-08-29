'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Crown,
  GraduationCap,
  Layers3,
  MousePointerClick,
  ScanLine,
  Search,
  Sparkles,
  Target,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { LogoTomografia } from '@/components/tomografia/logo'
import {
  COR_CATEGORIA,
  ICONES,
  ICONE_PADRAO,
  ROTULO_CATEGORIA,
  tema,
} from '@/components/tomografia/tema'
import { buscarNoIndice } from '@/lib/tomografia/catalogo'
import type { CatalogoTC, EstruturaIndexada, SecaoResumo, SerieResumo } from '@/lib/tomografia/catalogo'
import { PLUS_LABEL } from '@/lib/account-tier'

/**
 * Índice do atlas de tomografia.
 *
 * Recebe do servidor o recorte do acervo — títulos, capas, contagens e o índice
 * de busca. O conteúdo das fichas, os roteiros e os quizzes ficam onde sempre
 * estiveram: nas páginas de série, carregados quando o aluno realmente abre uma.
 */
export function CatalogoTomografia({ catalogo }: { catalogo: CatalogoTC }) {
  const [busca, setBusca] = useState('')

  const resultados = useMemo(() => buscarNoIndice(catalogo.indice, busca), [catalogo.indice, busca])
  const buscando = busca.trim().length >= 2

  return (
    <div className="surface-page min-h-screen">
      {/* ══════════ HERO ══════════ */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-muted/30" aria-hidden />
        {/* Trama de "corte" ao fundo — evoca papel milimetrado de estação de trabalho */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.18]"
          aria-hidden
          style={{
            backgroundImage:
              'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            color: 'rgb(148 163 184 / 0.18)',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent)',
          }}
        />

        <div className="rx-abaixo-flutuantes container relative z-10 mx-auto max-w-6xl px-4 pb-10 pt-8">
          <Link
            href="/manual-clinico/radiologia"
            className="-m-3 mb-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao Manual de Radiologia
          </Link>

          <div className="max-w-3xl">
            <p className="editorial-mark mb-3">Manual de Radiologia · Tomografia computadorizada</p>
            <h1 className="sr-only">Tomografia Computadorizada - Manual de Radiologia</h1>
            <LogoTomografia className="mt-1 w-full max-w-[340px] sm:max-w-[420px]" />

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Três exames de tomografia computadorizada reais, cortados como no aparelho: role o scroll e a
              pilha avança corte a corte. Cada estrutura vem com morfologia, função, densidade em unidades
              Hounsfield, janela ideal, como encontrá-la na imagem, o que muda quando ela adoece e o aspecto
              de cada alteração na TC.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                <Crown className="h-3.5 w-3.5" /> {PLUS_LABEL} · acesso liberado
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                {catalogo.totais.cortes} cortes reais
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground">
                <Target className="h-3.5 w-3.5 text-primary" /> {catalogo.totais.estruturas} estruturas
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground">
                <Layers3 className="h-3.5 w-3.5 text-primary" /> {catalogo.totais.series} séries
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground">
                <GraduationCap className="h-3.5 w-3.5 text-primary" /> {catalogo.totais.questoes} questões
              </span>
            </div>

            {/* Busca */}
            <div className="mt-6 max-w-xl">
              {/* o campo flutua sobre a textura do cabeçalho: é onde o vidro
                  tem o que refratar, e por isso ele ganha o material aqui e
                  não nos vinte cartões de série (blur em cada cartão custaria
                  o scroll do celular). */}
              <div className="glass-panel group relative flex items-center overflow-hidden rounded-xl transition-colors focus-within:border-primary/50">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
                <Input
                  placeholder="Buscar estrutura (veia porta, cápsula interna, apêndice...)"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="h-14 border-0 bg-transparent pl-12 pr-12 text-base ring-0 placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                  aria-label="Buscar estrutura anatômica"
                />
                {busca && (
                  <button
                    onClick={() => setBusca('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-muted p-1 text-muted-foreground transition-colors hover:bg-muted-foreground/20 hover:text-foreground"
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

      <div className="container mx-auto max-w-6xl px-4 py-8">
        {buscando ? (
          <ResultadosBusca termo={busca} resultados={resultados} />
        ) : (
          <>
            <ComoUsar />
            <div className="mt-12 space-y-14">
              {catalogo.secoes.map((secao) => (
                <SecaoBloco key={secao.id} secao={secao} />
              ))}
            </div>
            <Fundamentos />
          </>
        )}
      </div>
    </div>
  )
}

/* ────────────────────────── Como usar ────────────────────────── */

const PASSOS = [
  {
    icon: MousePointerClick,
    t: 'Role para percorrer os cortes',
    d: 'A roda do mouse, o arraste vertical ou as setas do teclado avançam a pilha — o mesmo gesto de uma estação de trabalho. No celular, arraste o dedo sobre a imagem.',
  },
  {
    icon: ScanLine,
    t: 'Troque a janela e veja outro exame',
    d: 'O mesmo corte muda completamente entre janela pulmonar, mediastinal, óssea e cerebral. Os presets mostram por que a janela é uma decisão diagnóstica, não um ajuste estético.',
  },
  {
    icon: Target,
    t: 'Clique numa estrutura e vá ao corte dela',
    d: 'A lista lateral leva direto ao corte em que a estrutura aparece rotulada, e marca na régua todos os cortes em que ela é visível.',
  },
  {
    icon: BookOpen,
    t: 'Estude o dossiê e teste-se',
    d: 'Cada estrutura tem morfologia, função, densidade, janela, reparos, clínica e alterações. No fim, um quiz e o modo treino, em que você tem de achar o corte.',
  },
]

function ComoUsar() {
  return (
    <section>
      <div className="mb-5">
        <p className="editorial-mark mb-2">Antes de começar</p>
        <h2 className="font-heading text-xl font-semibold tracking-tight">Como usar o visualizador</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {PASSOS.map((p) => (
          <div key={p.t} className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
            <p.icon className="mb-2 h-5 w-5 text-primary" />
            <p className="text-sm font-bold">{p.t}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.d}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ────────────────────────── Seção ────────────────────────── */

function SecaoBloco({ secao }: { secao: SecaoResumo }) {
  const t = tema(secao.cor)
  const Icone = ICONES[secao.icone] || ICONE_PADRAO

  return (
    <section id={`secao-${secao.id}`} className="scroll-mt-20">
      <div className="mb-5 flex items-start gap-4">
        <div className={`shrink-0 rounded-xl border ${t.border} ${t.bg} p-3`}>
          <Icone className={`h-6 w-6 ${t.text}`} />
        </div>
        <div className="min-w-0">
          <h2 className="font-heading text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
            {secao.titulo}
          </h2>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            {secao.series.length} séries · {secao.totalEstruturas} estruturas · {secao.totalCortes} cortes
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{secao.descricao}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {secao.series.map((serie, i) => (
          <CardSerie key={serie.id} serie={serie} index={i} />
        ))}
      </div>
    </section>
  )
}

function CardSerie({ serie, index }: { serie: SerieResumo; index: number }) {
  const t = tema(serie.cor)
  const Icone = ICONES[serie.icone] || ICONE_PADRAO

  return (
    <Link
      href={`/manual-clinico/radiologia/tomografia/${serie.id}`}
      prefetch={false}
      style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
      className={`group relative flex animate-fade-in-up flex-col overflow-hidden rounded-xl border border-border bg-card opacity-0 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${t.hoverBorder}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={serie.capa}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
        />
        <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/50 px-2 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-white/90 backdrop-blur">
          <Layers3 className="h-3 w-3" /> {serie.totalCortes} cortes
        </div>
        <div className={`absolute right-3 top-3 rounded-lg border border-white/10 ${t.bg} p-2 backdrop-blur-sm`}>
          <Icone className={`h-4 w-4 ${t.text}`} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold leading-snug transition-colors group-hover:text-foreground">{serie.titulo}</h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">{serie.subtitulo}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground/60">
            {serie.totalEstruturas} estruturas
          </span>
          <span className={`inline-flex items-center gap-1 text-xs font-bold ${t.text}`}>
            Abrir série <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

/* ────────────────────────── Busca ────────────────────────── */

function ResultadosBusca({ termo, resultados }: { termo: string; resultados: EstruturaIndexada[] }) {
  if (resultados.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
          <Search className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <p className="text-sm text-muted-foreground">
          Nenhuma estrutura encontrada para &ldquo;{termo}&rdquo;. Tente o nome anatômico, um sinônimo ou parte dele.
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-5 text-sm text-muted-foreground">
        {resultados.length} estrutura{resultados.length !== 1 ? 's' : ''} para &ldquo;{termo}&rdquo;
      </p>
      <div className="grid gap-2.5">
        {resultados.map((estrutura) => {
          const t = tema(COR_CATEGORIA[estrutura.categoria])
          return (
            <Link
              key={`${estrutura.serieId}-${estrutura.id}`}
              href={`/manual-clinico/radiologia/tomografia/${estrutura.serieId}?estrutura=${estrutura.id}`}
              prefetch={false}
              className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <span className={`mt-0.5 shrink-0 rounded-lg ${t.bg} px-2 py-1 text-[10px] font-black uppercase tracking-wide ${t.text}`}>
                {ROTULO_CATEGORIA[estrutura.categoria]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug transition-colors group-hover:text-primary">
                  {estrutura.nome}
                </p>
                <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {estrutura.resumo}
                </p>
                <p className="mt-1.5 text-[11px] font-medium text-muted-foreground/60">{estrutura.serieTitulo}</p>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/* ────────────────────────── Fundamentos ────────────────────────── */

const HU = [
  { t: 'Ar', v: '−1000', cor: 'bg-neutral-900 text-white' },
  { t: 'Pulmão', v: '−850 a −900', cor: 'bg-neutral-800 text-white' },
  { t: 'Gordura', v: '−100 a −50', cor: 'bg-neutral-700 text-white' },
  { t: 'Água / líquor', v: '0', cor: 'bg-neutral-600 text-white' },
  { t: 'Líquido simples', v: '0 a 20', cor: 'bg-neutral-500 text-white' },
  { t: 'Substância branca', v: '25 a 35', cor: 'bg-neutral-400 text-neutral-900' },
  { t: 'Substância cinzenta', v: '35 a 45', cor: 'bg-neutral-300 text-neutral-900' },
  { t: 'Músculo', v: '40 a 60', cor: 'bg-neutral-300 text-neutral-900' },
  { t: 'Sangue agudo', v: '50 a 80', cor: 'bg-neutral-200 text-neutral-900' },
  { t: 'Fígado', v: '50 a 70', cor: 'bg-neutral-200 text-neutral-900' },
  { t: 'Contraste iodado', v: '100 a 400', cor: 'bg-neutral-100 text-neutral-900' },
  { t: 'Osso cortical', v: '> 700', cor: 'bg-white text-neutral-900 border border-neutral-300' },
]

function Fundamentos() {
  return (
    <section className="mt-16 border-t border-border pt-10">
      <div className="mb-6">
        <p className="editorial-mark mb-2">Fundamentos</p>
        <h2 className="font-heading text-xl font-semibold tracking-tight">A escala Hounsfield em uma tabela</h2>
        <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Toda a leitura de uma TC se reduz a comparar densidades. A escala é calibrada em dois pontos fixos —
          a água vale 0 UH e o ar vale −1000 UH — e tudo o mais se posiciona entre eles. Decorar esta tabela é
          o atalho mais rentável do aprendizado: ela transforma &ldquo;mais claro&rdquo; e &ldquo;mais escuro&rdquo; em números, e
          números em diagnóstico.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
        {HU.map((h) => (
          <div key={h.t} className="overflow-hidden rounded-lg border border-border">
            <div className={`px-3 py-4 text-center font-mono text-sm font-bold ${h.cor}`}>{h.v}</div>
            <div className="bg-card px-3 py-2 text-center text-xs font-medium">{h.t}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <Sparkles className="mb-2 h-4 w-4 text-primary" />
          <p className="text-sm font-bold">Por que a janela muda tudo</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            O olho humano distingue cerca de 60 tons de cinza, e a escala Hounsfield tem 4000 valores. A janela
            escolhe qual faixa desses 4000 será mapeada nos 60 tons: fora dela, tudo vira branco ou preto. É por
            isso que o mesmo corte, em janelas diferentes, é literalmente outro exame.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <ScanLine className="mb-2 h-4 w-4 text-primary" />
          <p className="text-sm font-bold">Por que a fase de contraste importa</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            O contraste não é um corante permanente: ele circula. Arterial (25–35 s), pancreática (40 s),
            portal (70 s), nefrográfica (90 s), excretora (7–10 min). Pedir ou ler a fase errada é o erro mais
            comum do abdome — e é o que faz um cálculo desaparecer ou uma lesão nunca aparecer.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <Target className="mb-2 h-4 w-4 text-primary" />
          <p className="text-sm font-bold">Por que rolar a série inteira</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Um corte isolado não diz se algo é tubo ou nódulo, se é contínuo ou focal, se a fissura migra para
            a frente. A leitura tomográfica é um movimento, não uma foto — e é exatamente por isso que este
            manual foi construído em torno do scroll.
          </p>
        </div>
      </div>

      <p className="mt-8 border-t border-border pt-5 text-center text-xs leading-relaxed text-muted-foreground">
        Material educacional. As imagens são cortes de exames reais usados para ensino de anatomia
        tomográfica e não substituem laudo, avaliação clínica ou protocolo institucional.
      </p>
    </section>
  )
}
