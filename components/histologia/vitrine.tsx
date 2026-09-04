'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Columns2,
  Crown,
  Eye,
  Flame,
  FlaskConical,
  GraduationCap,
  Layers,
  ListChecks,
  Lock,
  Microscope,
  MousePointerClick,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  X,
  Zap,
} from 'lucide-react'

import { usePricingEventState } from '@/components/pricing-events/usePricingEventState'
import { FaixaDoPacote, GradeDoPacote, ListaDoPacote } from '@/components/manual-clinico/pacote'
import { TOTAL_DE_MODULOS, precoPorModulo } from '@/lib/manual-clinico/pacote'
import { MANUAL_CLINICO_PRODUCT_ID } from '@/lib/manual-clinico/identidade'
import { ProuniCta } from '@/components/prouni/prouni-cta'
import { LogoDaHistologia } from '@/components/histologia/marca'
import { setorDe, tema } from '@/components/histologia/tema'
import { AVISO_EDUCACIONAL, CREDITO_BASE } from '@/lib/histologia/licenca'
import type {
  AcessoDaVitrine,
  AmostraDaVitrine,
  DadosDaVitrine,
  SetorDaVitrine,
  TotaisDaVitrine,
} from '@/lib/histologia/vitrine-tipos'

/**
 * Landing de vendas do Manual da Histologia.
 *
 * É o que o visitante sem login e o usuário sem assinatura veem no lugar do
 * módulo, na mesma URL — o link continua valendo, e o buscador continua tendo o
 * que indexar.
 *
 * ## A régua desta página
 *
 * Histologia se vende mostrando lâmina, não adjetivo. Por isso o argumento
 * central não é um parágrafo: é o palco no meio da página, com uma lâmina real
 * do acervo e as camadas de marcação **funcionando**. Quem chega acende as
 * estruturas com o dedo antes de decidir. O que fica do outro lado do muro são
 * as outras 1.319 lâminas.
 *
 * A direção de arte é a do módulo, não a do checkout: campo escuro, retícula do
 * micrômetro, e as três cores da bancada — petróleo para o instrumento,
 * hematoxilina para estrutura, eosina para avaliação. A página parece o produto
 * que ela vende, o que é em si um argumento.
 *
 * ## O que esta página nunca faz
 *
 * Prometer o que o módulo não entrega. Os números vêm do currículo real, a
 * amostra é uma lâmina de verdade, e o rodapé mantém intacto o crédito exigido
 * pela licença do acervo — inclusive aqui, onde ninguém pagou ainda.
 */

function reais(valor: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number(valor || 0),
  )
}

const DESTINO_CHECKOUT = '/manual-clinico/checkout'
const DESTINO_LOGIN = '/auth/login?redirect=%2Fmanual-clinico%2Fhistologia'

export function VitrineDaHistologia({
  acesso,
  dados,
}: {
  acesso: AcessoDaVitrine
  dados: DadosDaVitrine
}) {
  const router = useRouter()
  const { totais } = dados

  // O lote que desconta o preço está amarrado ao plano, não ao produto — então
  // o "a partir de" precisa carregar o plano inteiro, e não só o valor.
  const planosAtivos = (acesso.produto?.plans || []).filter((p) => p.enabled && p.price > 0)
  const planoMaisBarato = planosAtivos.reduce<(typeof planosAtivos)[number] | null>(
    (menor, plano) => (menor == null || plano.price < menor.price ? plano : menor),
    null,
  )
  const precoBase = planoMaisBarato?.price ?? acesso.produto?.currentPrice ?? 0
  const eventoId = planoMaisBarato?.pricingEventId || acesso.produto?.pricingEventId || null
  const { state: evento } = usePricingEventState(eventoId)

  const desconto = evento?.activeTier?.discountPercent || 0
  const temLote = Boolean(evento?.activeTier) && evento?.isActive !== false && desconto > 0 && precoBase > 0
  const precoFinal = temLote
    ? Math.max(0, Math.round(precoBase * (1 - desconto / 100) * 100) / 100)
    : precoBase
  const mostrarPreco = acesso.produto?.isActive !== false && precoBase > 0

  const rotuloCta = `Quero os ${TOTAL_DE_MODULOS} manuais`

  function irParaCheckout() {
    router.push(DESTINO_CHECKOUT)
  }

  return (
    <div className="surface-page min-h-screen pb-28 lg:pb-0">
      <Hero
        amostra={dados.amostra}
        totais={totais}
        autenticado={acesso.autenticado}
        rotuloCta={rotuloCta}
        mostrarPreco={mostrarPreco}
        precoBase={precoBase}
        precoFinal={precoFinal}
        temLote={temLote}
        aoComprar={irParaCheckout}
      />

      {/* O serviço de acesso caiu: quem já assina precisa saber que o problema
          não é a assinatura dele — e que recarregar resolve. */}
      {acesso.motivo === 'indisponivel' && (
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <p className="histologia-cartao flex flex-wrap items-center gap-2 border-amber-500/40 p-3.5 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
            Não conseguimos confirmar sua assinatura agora. Se você já assina, recarregue a página
            em instantes — o acesso volta sozinho.
          </p>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 pt-8">
        <FaixaDoPacote atual="histologia" />
      </div>

      {dados.amostra && <Amostra amostra={dados.amostra} totalDeLaminas={totais.laminas} />}

      <PorQueTrava />

      <OQueDesbloqueia totais={totais} />

      <Setores setores={dados.setores} totais={totais} />

      <SemComparacao />

      {/* O valor inteiro antes do número: a grade de todos os manuais é a última
          coisa que a pessoa lê antes de ver quanto custa. */}
      <section className="mx-auto max-w-6xl px-4 pt-14">
        <GradeDoPacote atual="histologia" />
      </section>

      <Preco
        acesso={acesso}
        totais={totais}
        rotuloCta={rotuloCta}
        mostrarPreco={mostrarPreco}
        precoBase={precoBase}
        precoFinal={precoFinal}
        temLote={temLote}
        desconto={desconto}
        rotuloDoLote={evento?.activeTier?.label ?? null}
        planoMaisBarato={planoMaisBarato?.label ?? null}
        aoComprar={irParaCheckout}
      />

      <Creditos />

      <BarraDoCelular
        rotuloCta={acesso.autenticado ? 'Desbloquear' : 'Comprar agora'}
        mostrarPreco={mostrarPreco}
        precoBase={precoBase}
        precoFinal={precoFinal}
        temLote={temLote}
        desconto={desconto}
        aoComprar={irParaCheckout}
      />
    </div>
  )
}

/* ══════════════════════════════ Hero ══════════════════════════════ */

/**
 * O campo do microscópio como abertura.
 *
 * A lâmina da amostra entra desfocada e escurecida no fundo, dentro de uma
 * vinheta circular que imita a ocular. Não é enfeite: é a primeira coisa que
 * diz, sem texto, que este produto é um microscópio — e a mesma imagem aparece
 * nítida e utilizável logo abaixo, o que transforma a decoração em promessa
 * cumprida a uma rolagem de distância.
 */
function Hero({
  amostra,
  totais,
  autenticado,
  rotuloCta,
  mostrarPreco,
  precoBase,
  precoFinal,
  temLote,
  aoComprar,
}: {
  amostra: AmostraDaVitrine | null
  totais: TotaisDaVitrine
  autenticado: boolean
  rotuloCta: string
  mostrarPreco: boolean
  precoBase: number
  precoFinal: number
  temLote: boolean
  aoComprar: () => void
}) {
  return (
    <header className="relative isolate overflow-hidden bg-[#070C0B]">
      {amostra && (
        <div className="absolute inset-0" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={amostra.url}
            alt=""
            className="h-full w-full scale-125 object-cover opacity-70 blur-[1px]"
          />
        </div>
      )}

      {/* Vinheta da ocular: o campo redondo e a queda de luz para a borda. O
          centro fica quase limpo — é a lâmina que precisa aparecer ali — e o
          escurecimento se concentra onde o texto pousa. */}
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 62% 70% at 72% 26%, rgba(7,12,11,0) 0%, rgba(7,12,11,0.55) 46%, rgba(7,12,11,0.94) 78%, #070C0B 100%)',
        }}
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(to_top,#070C0B_8%,rgba(7,12,11,0.92)_40%,rgba(7,12,11,0.60)_74%,rgba(7,12,11,0.30)_100%)]"
        aria-hidden
      />
      {/* Retícula do micrômetro ocular, esmaecida para as bordas. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        aria-hidden
        style={{
          backgroundImage:
            'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          color: 'rgb(70 174 170 / 0.55)',
          maskImage: 'radial-gradient(ellipse 78% 68% at 50% 20%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 78% 68% at 50% 20%, black, transparent)',
        }}
      />
      <div
        className="pointer-events-none absolute -left-28 top-1/4 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 -top-16 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-6 sm:pb-20 sm:pt-8">
        <div>
          <Link
            href="/manual-clinico"
            className="-m-3 inline-flex items-center gap-1.5 rounded-lg p-3 text-sm text-white/55 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar ao Manual Clínico
          </Link>
        </div>

        <div className="mt-5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-400/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-amber-300 backdrop-blur">
            <Crown className="h-3.5 w-3.5" aria-hidden /> {TOTAL_DE_MODULOS} manuais · 1 pagamento único
          </span>
        </div>

        <h1 className="sr-only">Manual da Histologia</h1>
        {/* O logotipo é desenhado para fundo claro — o "Histologia" é azul
            escuro e some no campo. Em vez de refazer a marca, ela ganha a
            etiqueta fosca que toda lâmina de vidro tem numa ponta: resolve o
            contraste e é exatamente o objeto que o módulo vende. */}
        <span className="mt-5 block w-fit rounded-lg bg-[#F6F1E8] px-4 py-3 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.8)] ring-1 ring-white/25">
          <LogoDaHistologia className="h-auto w-[150px] sm:w-[175px]" />
        </span>

        <p className="mt-6 max-w-3xl font-heading text-[2rem] font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
          Na prova prática ninguém pergunta a definição.
          <span className="block text-teal-300">Perguntam o que é isso na lâmina.</span>
        </p>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
          {totais.laminas.toLocaleString('pt-BR')} lâminas reais num microscópio de verdade dentro
          do navegador — zoom, objetivas de 4× a 100×, foco e iluminação. Você acende as{' '}
          {totais.estruturas.toLocaleString('pt-BR')} estruturas sobre a imagem, uma a uma, até
          saber achá-las sozinho com a camada desligada.
        </p>

        <dl className="mt-8 grid max-w-3xl grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {[
            { valor: totais.laminas.toLocaleString('pt-BR'), rotulo: 'lâminas reais' },
            { valor: totais.estruturas.toLocaleString('pt-BR'), rotulo: 'estruturas marcadas' },
            { valor: totais.questoes.toLocaleString('pt-BR'), rotulo: 'questões de identificação' },
            { valor: totais.doencas.toLocaleString('pt-BR'), rotulo: 'doenças na histopatologia' },
          ].map((item) => (
            <div
              key={item.rotulo}
              className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur"
            >
              <dt className="font-heading text-2xl font-semibold tabular-nums text-white sm:text-3xl">
                {item.valor}
              </dt>
              <dd className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-white/50">
                {item.rotulo}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={aoComprar}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-teal-500 px-6 text-sm font-bold text-teal-950 shadow-[0_10px_30px_-10px_rgba(45,212,191,0.7)] transition hover:bg-teal-400 active:scale-[0.98]"
          >
            <Crown className="h-4 w-4" aria-hidden />
            {rotuloCta}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>

          {/* Sem preço na primeira dobra de propósito: aqui a pessoa ainda não
              sabe que a mesma compra abre outros seis manuais, e um número lido
              antes disso vira comparação com o preço de um atlas avulso. O valor
              aparece inteiro na seção da oferta, depois do acervo. */}
          <p className="text-sm text-white/60">
            A Histologia é <span className="font-black text-white">1 dos {TOTAL_DE_MODULOS} manuais</span> que
            este acesso abre
          </p>

          {!autenticado && (
            <Link
              href={DESTINO_LOGIN}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/15 px-5 text-sm font-bold text-white/80 transition hover:border-white/35 hover:text-white"
            >
              Já assino — entrar
            </Link>
          )}
        </div>

        <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-white/45">
          {[
            `${TOTAL_DE_MODULOS} manuais na mesma compra`,
            'Nenhum é vendido separado',
            'Incluso no DomineAqui Plus+',
            'Acesso imediato',
          ].map((item) => (
            <li key={item} className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-teal-400" aria-hidden /> {item}
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}

/* ═══════════════════════════ Amostra ═══════════════════════════ */

/**
 * O palco: uma lâmina de verdade, com as camadas funcionando.
 *
 * As camadas de marcação são imagens do próprio acervo, sobrepostas em
 * `inset-0` sobre a base — exatamente como no microscópio do módulo. É a mesma
 * invariante: uma imagem, várias camadas irmãs no mesmo contêiner, sem
 * possibilidade de desalinhamento.
 *
 * A explicação da estrutura aparece junto, quando existe. Quando não existe, a
 * interface diz que não existe: inventar texto aqui seria mentir na vitrine
 * sobre o que o assinante vai encontrar lá dentro.
 */
function Amostra({
  amostra,
  totalDeLaminas,
}: {
  amostra: AmostraDaVitrine
  totalDeLaminas: number
}) {
  const [ativa, setAtiva] = useState<string | null>(amostra.camadas[0]?.id ?? null)
  const camada = amostra.camadas.find((c) => c.id === ativa) ?? null
  const restantes = Math.max(totalDeLaminas - 1, 0)

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16" aria-labelledby="amostra">
      <div className="mb-7 max-w-2xl">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          <Sparkles className="h-3.5 w-3.5" aria-hidden /> Amostra liberada · sem login
        </span>
        <h2
          id="amostra"
          className="mt-3 font-heading text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          Acenda uma estrutura agora. Esta lâmina é sua.
        </h2>
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Uma lâmina real do acervo, com as camadas de marcação funcionando. Toque num rótulo e a
          estrutura acende sobre a imagem — é assim que o assinante estuda as outras{' '}
          {restantes.toLocaleString('pt-BR')}.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="min-w-0">
          <div className="mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {amostra.trilha}
            </p>
            <h3 className="font-heading text-lg font-semibold leading-tight tracking-tight sm:text-xl">
              {amostra.titulo}
            </h3>
          </div>

          {/* O palco. Fundo preto porque é o que existe em volta do corte no
              campo iluminado — e porque uma fotomicrografia sobre branco perde
              contraste justamente nas bordas do tecido. */}
          <div className="relative overflow-hidden rounded-xl border border-border bg-[#0d1210]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={amostra.url}
              alt={amostra.alt}
              sizes="(max-width: 1024px) 100vw, 720px"
              className="block aspect-[4/3] w-full object-cover"
            />
            {camada && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={camada.url}
                alt=""
                aria-hidden
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              />
            )}

            {/* O que está aceso, dito em texto. Cor sozinha não informa — e a
                camada vermelha do acervo some sobre campo eosinofílico. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/85 to-transparent p-3">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-black/60 px-2.5 py-1.5 text-[11px] font-bold text-white backdrop-blur">
                <Eye className="h-3.5 w-3.5 text-rose-300" aria-hidden />
                {camada ? camada.rotulo : 'Nenhuma camada acesa'}
              </span>
              {amostra.coloracoes.length > 0 && (
                <span className="ml-auto rounded-md bg-black/50 px-2 py-1 text-[10px] font-medium text-white/70 backdrop-blur">
                  {amostra.coloracoes.join(' · ')}
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {amostra.camadas.map((item) => {
              const acesa = item.id === ativa
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAtiva(acesa ? null : item.id)}
                  aria-pressed={acesa}
                  className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition ${
                    acesa
                      ? 'border-rose-500/50 bg-rose-500/15 text-rose-800 dark:text-rose-200'
                      : 'border-border bg-card text-muted-foreground hover:border-teal-500/45 hover:text-foreground'
                  }`}
                >
                  {acesa ? (
                    <X className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  ) : (
                    <Target className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  )}
                  {item.rotulo}
                  {!item.traduzido && (
                    <span className="rounded bg-muted px-1 text-[9px] font-bold uppercase text-muted-foreground">
                      en
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="lg:sticky lg:top-6">
          {camada ? (
            <div className="histologia-cartao p-5">
              <p className="editorial-mark mb-2">Estrutura acesa</p>
              <h3 className="font-heading text-lg font-semibold leading-tight tracking-tight">
                {camada.rotulo}
              </h3>
              {camada.explicacao ? (
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {camada.explicacao}
                </p>
              ) : (
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  Esta camada ainda não tem texto em português revisado. O módulo mostra a lacuna em
                  vez de preenchê-la com tradução automática.
                </p>
              )}
              <p className="mt-4 flex items-start gap-2 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                No módulo, esta mesma lâmina abre no microscópio completo: zoom até 100×, foco,
                iluminação, contraste e todas as camadas ao mesmo tempo.
              </p>
            </div>
          ) : (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/25 p-6 text-center">
              <span className="rounded-2xl bg-teal-500/10 p-3 text-teal-700 dark:text-teal-300">
                <MousePointerClick className="h-6 w-6" aria-hidden />
              </span>
              <h3 className="mt-3 font-heading text-lg font-semibold tracking-tight">
                Toque num rótulo
              </h3>
              <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted-foreground">
                A estrutura acende sobre a lâmina e a explicação aparece aqui.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════ Por que a lâmina trava ═══════════════════════ */

const TRAVAS = [
  {
    icone: Eye,
    titulo: 'Você sabe a teoria e trava na imagem',
    texto:
      'Descrever epitélio pseudoestratificado é fácil. Reconhecê-lo num corte oblíquo, com artefato de retração, é outra habilidade — e ela só se treina olhando lâmina.',
  },
  {
    icone: Layers,
    titulo: 'O PDF mostra a foto perfeita',
    texto:
      'A lâmina da prova tem dobra, bolha, faca cega e corte fora do plano. Quem só viu a figura ideal do livro não reconhece o mesmo tecido quando ele aparece torto.',
  },
  {
    icone: FlaskConical,
    titulo: 'Ninguém te ensinou a ler o processamento',
    texto:
      'Metade do que aparece na imagem vem da fixação, do micrótomo e do corante — não do tecido. Sem isso, artefato vira achado e achado vira artefato.',
  },
]

function PorQueTrava() {
  return (
    <section className="border-y border-border bg-muted/30" aria-labelledby="travas">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="mb-8 max-w-2xl">
          <p className="editorial-mark mb-2">O problema real</p>
          <h2 id="travas" className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Histologia não se decora. Se treina o olho.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            E o olho não treina em resumo. Treina em lâmina, repetidamente, com alguém apontando
            onde olhar — até você não precisar mais de ninguém apontando.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {TRAVAS.map((trava) => (
            <div key={trava.titulo} className="histologia-cartao p-5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-300">
                <trava.icone className="h-4 w-4" aria-hidden />
              </span>
              <h3 className="mt-3 text-sm font-bold leading-snug">{trava.titulo}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {trava.texto}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════ O que você desbloqueia ═══════════════════════ */

function OQueDesbloqueia({ totais }: { totais: TotaisDaVitrine }) {
  const recursos = [
    {
      icone: Microscope,
      cor: 'petroleo' as const,
      titulo: 'Microscópio virtual',
      texto:
        'Objetivas de 4× a 100× com as proporções reais de campo, foco micrométrico simulado, iluminação e contraste. Ande pela lâmina com o dedo, como na bancada.',
    },
    {
      icone: Target,
      cor: 'eosina' as const,
      titulo: `${totais.estruturas.toLocaleString('pt-BR')} estruturas que acendem`,
      texto:
        'Cada marcação é uma camada sobre a imagem. Acenda para aprender, apague para se testar — o mesmo gesto serve para estudar e para conferir se fixou.',
    },
    {
      icone: Search,
      cor: 'hematoxilina' as const,
      titulo: 'Atlas pesquisável por estrutura',
      texto:
        'Digite "corpúsculo de Hassall" e caia direto no corte onde ele aparece. Busca por lâmina, seção, estrutura e quiz, no módulo inteiro.',
    },
    {
      icone: FlaskConical,
      cor: 'petroleo' as const,
      titulo: `${totais.laboratorios} laboratórios de preparo`,
      texto:
        'Fixação, inclusão, microtomia, coloração e artefatos. É o capítulo que explica por que a lâmina tem a cara que tem — e o que é artefato antes de você chamar de achado.',
    },
    {
      icone: ListChecks,
      cor: 'eosina' as const,
      titulo: `${totais.quizzes} quizzes · ${totais.questoes} questões`,
      texto:
        'Identificação sobre fotomicrografia real, em modo prática (devolutiva na hora) ou prova (relatório de erros no fim). O gabarito não vem no HTML.',
    },
    {
      icone: Stethoscope,
      cor: 'hematoxilina' as const,
      titulo: `Histopatologia · ${totais.doencas} doenças`,
      texto: `Da agressão ao achado na lâmina, e do achado ao sintoma. ${totais.capitulosVisuais.toLocaleString('pt-BR')} capítulos visuais em ${totais.sistemasPatologicos} sistemas, com o normal ao lado do patológico.`,
    },
  ]

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16" aria-labelledby="desbloqueia">
      <div className="mb-8 max-w-2xl">
        <p className="editorial-mark mb-2">O que entra na assinatura</p>
        <h2 id="desbloqueia" className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Seis ferramentas, um único objetivo
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Fazer você reconhecer o tecido sozinho, sem legenda, na hora em que o professor gira o
          revólver do microscópio e pergunta.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {recursos.map((recurso) => {
          const t = tema(recurso.cor)
          return (
            <div key={recurso.titulo} className={`histologia-cartao p-5 transition ${t.hover}`}>
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${t.fundo} ${t.texto}`}
              >
                <recurso.icone className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-3.5 font-heading text-base font-semibold leading-snug tracking-tight">
                {recurso.titulo}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {recurso.texto}
              </p>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5 rounded-xl border border-violet-500/25 bg-violet-500/[0.06] p-4">
        <Columns2 className="h-5 w-5 shrink-0 text-violet-700 dark:text-violet-300" aria-hidden />
        <p className="text-sm leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Normal × patológico, lado a lado.</strong> Cada
          capítulo da histopatologia abre com a lâmina normal ao lado e diz, em texto, exatamente o
          que mudou — que é a única comparação que ensina a ver a diferença.
        </p>
      </div>
    </section>
  )
}

/* ═══════════════════════════ Setores ═══════════════════════════ */

function Setores({ setores, totais }: { setores: SetorDaVitrine[]; totais: TotaisDaVitrine }) {
  return (
    <section className="border-t border-border bg-muted/25" aria-labelledby="setores">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="mb-6 max-w-2xl">
          <p className="editorial-mark mb-2">O currículo inteiro</p>
          <h2 id="setores" className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Do preparo da lâmina ao órgão inteiro
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {totais.setores} setores e {totais.subsetores} assuntos, na ordem em que a matéria se
            constrói — e não na ordem alfabética de um índice.
          </p>
        </div>

        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {setores.map((setor, i) => {
            const t = tema(setorDe(setor.slug).cor)
            return (
              <li
                key={setor.slug}
                className="group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-xl border border-white/10 bg-[#0d1210] shadow-md"
              >
                {setor.capa ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={setor.capa}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 640px) 45vw, 260px"
                    className="absolute inset-0 h-full w-full object-cover opacity-60 transition duration-700 group-hover:scale-105 group-hover:opacity-75"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Microscope className="h-6 w-6 text-white/20" aria-hidden />
                  </span>
                )}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/25"
                  aria-hidden
                />
                <span
                  className={`absolute left-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-full border bg-black/70 font-heading text-xs font-black backdrop-blur ${t.borda} ${t.texto}`}
                >
                  {i + 1}
                </span>
                <span className="absolute right-2.5 top-2.5 rounded-full bg-black/55 p-1.5 text-white/70 backdrop-blur">
                  <Lock className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div className="relative p-3">
                  <h3 className="font-heading text-base font-semibold leading-tight text-white sm:text-lg">
                    {setor.titulo}
                  </h3>
                  <p className="mt-0.5 text-[11px] font-medium text-white/55">
                    {setor.laminas.toLocaleString('pt-BR')} lâminas ·{' '}
                    {setor.estruturas.toLocaleString('pt-BR')} estruturas
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

/* ══════════════════════ Antes e depois ══════════════════════ */

const SEM = [
  'Foto ideal do livro, sempre no mesmo corte e no mesmo aumento.',
  'Legenda embaixo da imagem — você lê a resposta antes de tentar.',
  'Artefato e achado misturados, sem ninguém explicar a diferença.',
  'Zero treino sob pressão: você descobre que não sabe na prova.',
]

const COM = [
  'Lâmina real, com todos os defeitos que a lâmina da prova também tem.',
  'Camada que você acende e apaga — treina reconhecer, não reconhecer legenda.',
  'Laboratório dedicado a preparo e artefato, antes de você errar por causa deles.',
  'Modo prova com relatório de erros e link de volta para a lâmina onde você errou.',
]

function SemComparacao() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16" aria-labelledby="comparacao">
      <div className="mb-7 max-w-2xl">
        <p className="editorial-mark mb-2">A diferença prática</p>
        <h2 id="comparacao" className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          O que muda no dia da prática
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="histologia-cartao p-5 sm:p-6">
          <p className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-muted-foreground">
            <X className="h-3.5 w-3.5" aria-hidden /> Estudando por PDF
          </p>
          <ul className="mt-4 space-y-2.5">
            {SEM.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="histologia-cartao border-teal-600/35 p-5 sm:p-6">
          <p className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-teal-700 dark:text-teal-300">
            <Zap className="h-3.5 w-3.5" aria-hidden /> Com o Manual da Histologia
          </p>
          <ul className="mt-4 space-y-2.5">
            {COM.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" aria-hidden />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════ Preço ═══════════════════════════ */

const PERGUNTAS = [
  {
    q: 'O Manual da Histologia é vendido separado?',
    a: 'Não — e nenhuma outra seção é. É tudo numa compra só: além da Histologia, o mesmo pagamento abre as patologias do Manual Clínico, a Farmacologia, o Manual do Eletrocardiograma, o Manual de Radiologia, os Exames Laboratoriais, o Domine Anatomia e as Ferramentas Clínicas. Tudo isso também já vem incluído nas contas DomineAqui Plus+.',
  },
  {
    q: 'Preciso ter conta para comprar?',
    a: 'Não. A compra pode ser feita sem conta: a Serial Key chega no seu e-mail e libera o acesso. Se você já tem conta, o acesso aparece assim que o pagamento é confirmado.',
  },
  {
    q: 'Funciona no celular?',
    a: 'Sim. O microscópio tem zoom com pinça, arraste com o dedo e tela cheia; as camadas de marcação ficam coladas ao palco, para acender e apagar sem tirar a lâmina do campo de visão.',
  },
  {
    q: 'De onde vêm as lâminas?',
    a: 'Do acervo Digital Histology, da Virginia Commonwealth University School of Medicine, publicado sob licença Creative Commons BY-NC-SA 4.0. O crédito, a proveniência e o hash de cada imagem ficam a um clique, no rodapé de cada lâmina.',
  },
  {
    q: 'O conteúdo já foi revisado?',
    a: 'O conteúdo complementar em português segue marcado como pendente de revisão biomédica, e cada página diz isso na própria tela. Preferimos mostrar a lacuna a fingir que ela não existe — as lâminas e as marcações são as do acervo original.',
  },
]

function Preco({
  acesso,
  totais,
  rotuloCta,
  mostrarPreco,
  precoBase,
  precoFinal,
  temLote,
  desconto,
  rotuloDoLote,
  planoMaisBarato,
  aoComprar,
}: {
  acesso: AcessoDaVitrine
  totais: TotaisDaVitrine
  rotuloCta: string
  mostrarPreco: boolean
  precoBase: number
  precoFinal: number
  temLote: boolean
  desconto: number
  rotuloDoLote: string | null
  planoMaisBarato: string | null
  aoComprar: () => void
}) {
  // O total sobre sete: é o número que se compara com o preço de um manual
  // avulso, e o que desarma a objeção sem precisar de mais desconto.
  const porManual = precoPorModulo(precoFinal)

  return (
    <section className="border-t border-border bg-muted/25" aria-labelledby="preco">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="space-y-5">
            <div className="relative overflow-hidden rounded-2xl border border-amber-500/25 bg-card p-5 shadow-sm sm:p-7">
              <div
                className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent"
                aria-hidden
              />
              <div className="flex items-start gap-3">
                <span className="shrink-0 rounded-xl bg-amber-400/15 p-2.5 text-amber-600 dark:text-amber-400">
                  <Lock className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="editorial-mark">A oferta inteira</p>
                  <h2
                    id="preco"
                    className="mt-2 font-heading text-xl font-semibold tracking-tight sm:text-2xl"
                  >
                    Você não escolhe um manual. Você leva os {TOTAL_DE_MODULOS}.
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Nenhuma seção é vendida à parte. O mesmo pagamento que abre as{' '}
                    {totais.laminas.toLocaleString('pt-BR')} lâminas daqui abre também as patologias do{' '}
                    <strong className="text-foreground">Manual Clínico</strong>, a Farmacologia, o
                    Eletrocardiograma, a Radiologia, o Domine Anatomia e as Ferramentas Clínicas — e tudo isso
                    já vem incluso nas contas{' '}
                    <strong className="text-foreground">DomineAqui Plus+</strong>.
                  </p>
                </div>
              </div>

              <ListaDoPacote atual="histologia" className="mt-5" />
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <h3 className="font-heading text-base font-semibold tracking-tight">
                Perguntas frequentes
              </h3>
              <div className="mt-3 divide-y divide-border">
                {PERGUNTAS.map((item) => (
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
                  {planoMaisBarato ? ` · plano ${planoMaisBarato}` : ''}
                </p>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  {temLote && (
                    <span className="text-base text-muted-foreground line-through">
                      {reais(precoBase)}
                    </span>
                  )}
                  <span className="text-3xl font-black tracking-tight text-teal-700 dark:text-teal-300 sm:text-4xl">
                    {reais(precoFinal)}
                  </span>
                  {temLote && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      <Flame className="h-3 w-3" aria-hidden /> −{Math.round(desconto)}%
                    </span>
                  )}
                </div>
                {porManual != null && (
                  <p className="mt-2 text-[13px] font-bold leading-snug text-teal-700 dark:text-teal-300">
                    Dá {reais(porManual)} por manual.
                  </p>
                )}
                {temLote && rotuloDoLote && (
                  <p className="mt-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                    Lote {rotuloDoLote} — você economiza {reais(precoBase - precoFinal)}.
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
              onClick={aoComprar}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 active:scale-[0.98]"
            >
              <Crown className="h-4 w-4" aria-hidden />
              {rotuloCta}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>

            <ul className="mt-4 space-y-1.5">
              {[
                'Acesso imediato após o pagamento',
                `As ${totais.laminas.toLocaleString('pt-BR')} lâminas e os ${totais.quizzes} quizzes inclusos`,
                `Os ${TOTAL_DE_MODULOS} manuais juntos — não há venda avulsa de nenhum`,
                'Conteúdo novo entra no mesmo acesso, sem cobrança extra',
                ...(acesso.autenticado ? [] : ['Sem conta? A Serial Key vai por e-mail']),
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>

            {/* Desconto PROUNI/FIES do Manual Clínico, quando existe. Some
                sozinho quando não há (ver ProuniCta). */}
            <ProuniCta
              itemType="manual_clinico"
              itemId={MANUAL_CLINICO_PRODUCT_ID}
              className="mt-4"
            />

            <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden /> Pix, cartão ou boleto ·
              pagamento processado com segurança.
            </p>

            {!acesso.autenticado && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Já assina?{' '}
                <Link href={DESTINO_LOGIN} className="font-bold text-teal-700 hover:underline dark:text-teal-300">
                  Entrar na conta
                </Link>
              </p>
            )}
          </div>
        </div>

        <p className="mt-10 flex flex-wrap items-center justify-center gap-2 text-center text-xs leading-relaxed text-muted-foreground">
          <GraduationCap className="h-4 w-4 shrink-0 text-teal-700 dark:text-teal-300" aria-hidden />
          {AVISO_EDUCACIONAL}
        </p>
      </div>
    </section>
  )
}

function Pergunta({ pergunta, resposta }: { pergunta: string; resposta: string }) {
  const [aberta, setAberta] = useState(false)
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <button
        type="button"
        onClick={() => setAberta((atual) => !atual)}
        aria-expanded={aberta}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="text-sm font-semibold leading-snug">{pergunta}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${aberta ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {aberta && <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{resposta}</p>}
    </div>
  )
}

/* ═══════════════════════════ Créditos ═══════════════════════════ */

/**
 * O crédito do acervo aparece **também aqui**, na página de quem ainda não
 * pagou. A obrigação de atribuição da licença não começa depois da compra.
 */
function Creditos() {
  return (
    <footer className="mx-auto max-w-6xl px-4 pb-14">
      <div className="border-t border-border pt-6">
        <p className="text-xs leading-relaxed text-muted-foreground">{CREDITO_BASE}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Créditos específicos, proveniência e hash de cada imagem ficam a um clique, no rodapé de
          cada lâmina.
        </p>
      </div>
    </footer>
  )
}

/* ═══════════════════════ Barra fixa do celular ═══════════════════════ */

function BarraDoCelular({
  rotuloCta,
  mostrarPreco,
  precoBase,
  precoFinal,
  temLote,
  desconto,
  aoComprar,
}: {
  rotuloCta: string
  mostrarPreco: boolean
  precoBase: number
  precoFinal: number
  temLote: boolean
  desconto: number
  aoComprar: () => void
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden">
      <div className="flex items-center gap-3">
        {mostrarPreco && (
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold text-teal-700 dark:text-teal-300">
              {temLote
                ? `−${Math.round(desconto)}% · ${TOTAL_DE_MODULOS} manuais`
                : `${TOTAL_DE_MODULOS} manuais inclusos`}
            </p>
            <p className="flex items-baseline gap-1.5">
              {temLote && (
                <span className="text-[11px] text-muted-foreground line-through">
                  {reais(precoBase)}
                </span>
              )}
              <span className="text-lg font-black leading-tight text-teal-700 dark:text-teal-300">
                {reais(precoFinal)}
              </span>
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={aoComprar}
          className="ml-auto inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-md bg-teal-700 px-4 text-sm font-bold text-white shadow-sm transition active:scale-[0.98]"
        >
          <Crown className="h-4 w-4" aria-hidden />
          {rotuloCta}
        </button>
      </div>
    </div>
  )
}
