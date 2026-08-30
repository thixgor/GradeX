import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Crown,
  ImageIcon,
  Layers3,
  ListChecks,
  StickyNote,
  Target,
} from 'lucide-react'
import { LogoRadiologia } from '@/components/radiologia/logo'
import { CantosFilme, FilmeImagem } from '@/components/radiologia/filme'

/**
 * Home do Manual de Radiologia.
 *
 * Componente de servidor de propósito: a página só precisa de nomes, contagens
 * e caminhos de imagem, e todos eles nascem de dois módulos de dado enormes
 * (`lib/tomografia`, 780 KB, e `lib/radiologia/raio-x`, 172 KB). Enquanto esta
 * página era `'use client'`, os dois iam inteiros para o bundle do navegador —
 * o aluno baixava, analisava e executava quase 1 MB de fonte para ver dois
 * cartões e três números. Aqui os dados ficam no servidor e o que atravessa a
 * rede é o HTML já pronto.
 *
 * A identidade é a do negatoscópio: painel escuro com retícula e lâmina de luz
 * no alto, tira de filme com as regiões reais, e o conteúdo claro logo abaixo —
 * a mesma linguagem do atlas de Raio-X, para que a home não pareça de outro
 * produto.
 */

export interface ModalidadeHome {
  href: string
  etiqueta: string
  titulo: string
  descricao: string
  capa: string
  metricas: { valor: string; rotulo: string }[]
  itens: string[]
  cta: string
}

export interface AtalhoHome {
  href: string
  titulo: string
  detalhe: string
}

export interface HomeRadiologiaProps {
  totais: {
    incidencias: number
    series: number
    cortes: number
    estruturas: number
  }
  tira: { src: string; alt: string }[]
  raioX: ModalidadeHome
  tomografia: ModalidadeHome
  atalhosRaioX: AtalhoHome[]
  atalhosTomografia: AtalhoHome[]
}

const COMO_ESTUDAR = [
  {
    icone: Target,
    titulo: 'Reconheça antes de acender',
    texto:
      'Abra a incidência com a demarcação desligada, percorra o filme e só então acenda a estrutura. É a única forma de descobrir o que você realmente identifica sozinho.',
  },
  {
    icone: ListChecks,
    titulo: 'Leia sempre na mesma ordem',
    texto:
      'Cada região traz o roteiro sistemático e os critérios de qualidade técnica. A ordem fixa é o que evita o erro clássico: achar a primeira alteração e parar de olhar o resto.',
  },
  {
    icone: BookOpen,
    titulo: 'Estude a estrutura, não a legenda',
    texto:
      'Toda estrutura tem dossiê: o que é, como identificar na imagem, o que avaliar e por quê, e a armadilha que ela costuma provocar em quem está começando.',
  },
  {
    icone: StickyNote,
    titulo: 'Anote no caderno do exame',
    texto:
      'Cada série e cada incidência tem um caderno pautado próprio. A anotação nasce ancorada na estrutura que você estava olhando e continua lá quando você voltar.',
  },
]

export function HomeRadiologia({
  totais,
  tira,
  raioX,
  tomografia,
  atalhosRaioX,
  atalhosTomografia,
}: HomeRadiologiaProps) {
  return (
    <div className="rx surface-page min-h-screen">
      {/* ══════════ NEGATOSCÓPIO ══════════ */}
      <header className="rx-painel rx-grade rx-varredura relative overflow-hidden border-b border-sky-400/15">
        <div className="rx-abaixo-flutuantes container relative mx-auto max-w-6xl px-4 pb-8 pt-6 sm:pb-10">
          <Link
            href="/manual-clinico"
            className="-m-2 inline-flex items-center gap-1.5 rounded-lg p-2 text-sm text-sky-100/55 transition hover:text-sky-100"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao Manual Clínico
          </Link>

          <div className="mt-5 max-w-3xl">
            <div className="[filter:invert(1)_hue-rotate(180deg)_brightness(1.2)]">
              <LogoRadiologia className="max-w-[280px] sm:max-w-[330px]" />
            </div>
            {/* O SVG do logo já traz margem interna: `mt-1` aqui equivale ao
                respiro de `mt-5` em qualquer outro bloco. */}
            <p className="editorial-mark mt-1 !text-sky-300/80 [&::before]:bg-sky-300/60">
              Manual Clínico · Diagnóstico por imagem
            </p>
            <h1 className="mt-2 font-heading text-[1.65rem] font-semibold leading-tight tracking-tight text-white sm:text-4xl">
              A anatomia como ela aparece na imagem
            </h1>
            <p className="mt-3.5 max-w-2xl text-sm leading-relaxed text-sky-100/65 sm:text-base">
              Duas modalidades no mesmo manual. Percorra pilhas reais de tomografia corte a corte, como numa
              estação de trabalho, e acenda cada estrutura diretamente sobre {totais.incidencias} incidências
              radiográficas — com técnica, roteiro de leitura, armadilhas e correlação anatômica.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <Selo destaque>
                <Crown className="h-3.5 w-3.5" /> Acesso do Manual Clínico
              </Selo>
              <Selo>
                <ImageIcon className="h-3.5 w-3.5 text-sky-300" /> {totais.incidencias} incidências
              </Selo>
              <Selo>
                <Layers3 className="h-3.5 w-3.5 text-sky-300" /> {totais.series} séries · {totais.cortes} cortes
              </Selo>
              <Selo>
                <Target className="h-3.5 w-3.5 text-sky-300" /> {totais.estruturas} estruturas
              </Selo>
            </div>
          </div>
        </div>

        {/* Tira de filme: as regiões reais do acervo, no formato em que a
            radiologia guarda imagem desde sempre. Rola no toque em telas
            pequenas e ocupa a largura inteira nas grandes. */}
        <div className="rx-tira relative border-t border-sky-400/10">
          <div className="rx-rolagem flex gap-2 overflow-x-auto px-4 py-3.5">
            {tira.map((quadro) => (
              <div
                key={quadro.src}
                className="relative aspect-[3/4] w-[86px] shrink-0 overflow-hidden rounded-sm bg-black sm:w-[104px]"
              >
                <FilmeImagem
                  src={quadro.src}
                  alt={quadro.alt}
                  larguraMobile={256}
                  larguraDesktop={256}
                  qualidade={58}
                  comEsqueleto
                  className="absolute inset-0 h-full w-full object-cover object-top opacity-70"
                />
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-9 sm:py-11">
        {/* ══════════ MODALIDADES ══════════ */}
        <div className="mb-5">
          <p className="editorial-mark mb-2">Escolha a modalidade</p>
          <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            Do volume ao filme, sem perder a anatomia
          </h2>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <CartaoModalidade modalidade={raioX} tom="sky" />
          <CartaoModalidade modalidade={tomografia} tom="violet" />
        </div>

        {/* ══════════ ATALHOS ══════════ */}
        {/* items-start: a coluna da TC tem três regiões e a do Raio-X tem nove;
            sem isso o cartão menor esticaria até a altura do maior. */}
        <section className="mt-11 grid items-start gap-5 xl:grid-cols-2">
          <BlocoAtalhos
            etiqueta="Regiões do atlas de Raio-X"
            icone={ImageIcon}
            tom="sky"
            atalhos={atalhosRaioX}
            verTudo={{ href: raioX.href, rotulo: 'Ver todas as regiões' }}
          />
          <BlocoAtalhos
            etiqueta="Regiões da tomografia"
            icone={Layers3}
            tom="violet"
            atalhos={atalhosTomografia}
            verTudo={{ href: tomografia.href, rotulo: 'Ver todas as séries' }}
          />
        </section>

        {/* ══════════ COMO ESTUDAR ══════════ */}
        <section className="mt-12">
          <p className="editorial-mark mb-2">Como usar este manual</p>
          <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            Quatro hábitos que separam quem vê de quem lê
          </h2>
          <div className="mt-5 grid gap-3.5 sm:grid-cols-2 2xl:grid-cols-4">
            {COMO_ESTUDAR.map(({ icone: Icone, titulo, texto }) => (
              <div
                key={titulo}
                className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-sky-500/35"
              >
                <span className="inline-flex rounded-lg bg-sky-500/10 p-2 text-sky-600 dark:text-sky-400">
                  <Icone className="h-4 w-4" />
                </span>
                <h3 className="mt-2.5 font-heading text-sm font-semibold">{titulo}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{texto}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-11 rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-4 text-xs leading-relaxed text-muted-foreground">
          <strong className="font-bold text-foreground">Escopo educacional.</strong> Material de anatomia
          radiológica. Não substitui laudo médico, avaliação clínica, protocolos institucionais nem a escolha
          do método de imagem apropriado.
        </p>
      </main>
    </div>
  )
}

/* ─────────────────────────────── Peças ─────────────────────────────── */

function Selo({ children, destaque = false }: { children: React.ReactNode; destaque?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold backdrop-blur ${
        destaque
          ? 'border-amber-300/30 bg-amber-400/10 text-amber-200'
          : 'border-sky-400/20 bg-sky-400/[0.07] text-sky-100/75'
      }`}
    >
      {children}
    </span>
  )
}

const TONS = {
  sky: {
    borda: 'border-sky-500/25',
    hover: 'hover:border-sky-500/55',
    sombra: 'hover:shadow-sky-500/10',
    texto: 'text-sky-600 dark:text-sky-400',
    fundo: 'bg-sky-500/10',
    etiqueta: 'bg-sky-500/90',
  },
  violet: {
    borda: 'border-violet-500/25',
    hover: 'hover:border-violet-500/55',
    sombra: 'hover:shadow-violet-500/10',
    texto: 'text-violet-600 dark:text-violet-400',
    fundo: 'bg-violet-500/10',
    etiqueta: 'bg-violet-500/90',
  },
} as const

function CartaoModalidade({
  modalidade,
  tom,
}: {
  modalidade: ModalidadeHome
  tom: keyof typeof TONS
}) {
  const t = TONS[tom]
  return (
    <Link
      href={modalidade.href}
      className={`group flex flex-col overflow-hidden rounded-2xl border ${t.borda} bg-card shadow-sm transition duration-300 hover:-translate-y-1 ${t.hover} hover:shadow-lg ${t.sombra}`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-black sm:aspect-[16/9]">
        <FilmeImagem
          src={modalidade.capa}
          alt=""
          larguraMobile={640}
          larguraDesktop={640}
          qualidade={66}
          comEsqueleto
          className="absolute inset-0 h-full w-full object-contain transition duration-700 group-hover:scale-[1.04]"
        />
        <CantosFilme />
        <span
          className={`absolute left-3 top-3 rounded-full border border-white/15 ${t.etiqueta} px-3 py-1 font-clinical text-[10px] font-black uppercase tracking-widest text-white shadow backdrop-blur`}
        >
          {modalidade.etiqueta}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="font-heading text-lg font-semibold sm:text-xl">{modalidade.titulo}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{modalidade.descricao}</p>

        <dl className="mt-4 grid grid-cols-3 gap-2">
          {modalidade.metricas.map((m) => (
            <div key={m.rotulo} className="rounded-lg border border-border bg-muted/30 px-2.5 py-2">
              <dt className="sr-only">{m.rotulo}</dt>
              <dd>
                <span className={`block font-heading text-lg font-semibold leading-none ${t.texto}`}>
                  {m.valor}
                </span>
                <span className="mt-1 block font-clinical text-[10px] uppercase tracking-wider text-muted-foreground">
                  {m.rotulo}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <ul className="mt-4 flex-1 space-y-1.5">
          {modalidade.itens.map((item) => (
            <li key={item} className="flex gap-2.5 text-xs leading-relaxed text-muted-foreground">
              <span className={`mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full ${t.fundo} ring-1 ring-current`} />
              {item}
            </li>
          ))}
        </ul>

        <span className={`mt-5 inline-flex items-center gap-1 text-sm font-bold ${t.texto}`}>
          {modalidade.cta}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}

function BlocoAtalhos({
  etiqueta,
  icone: Icone,
  tom,
  atalhos,
  verTudo,
}: {
  etiqueta: string
  icone: typeof ImageIcon
  tom: keyof typeof TONS
  atalhos: AtalhoHome[]
  verTudo: { href: string; rotulo: string }
}) {
  const t = TONS[tom]
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider ${t.texto}`}>
          <Icone className="h-3.5 w-3.5" /> {etiqueta}
        </p>
        <Link
          href={verTudo.href}
          className="shrink-0 text-[11px] font-bold text-muted-foreground transition hover:text-foreground"
        >
          {verTudo.rotulo} →
        </Link>
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2">
        {atalhos.map((atalho) => (
          <Link
            key={atalho.href}
            href={atalho.href}
            className={`group flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 transition ${t.hover} hover:bg-muted/40`}
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-bold">{atalho.titulo}</span>
              <span className="block truncate font-clinical text-[10px] uppercase tracking-wider text-muted-foreground">
                {atalho.detalhe}
              </span>
            </span>
            <ArrowRight
              className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 ${t.texto}`}
            />
          </Link>
        ))}
      </div>
    </div>
  )
}
