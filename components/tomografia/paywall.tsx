'use client'

import { useMemo, useState } from 'react'
import {
  Crown,
  Lock,
  ArrowRight,
  Check,
  ShieldCheck,
  Flame,
  MousePointerClick,
  ScanLine,
  Crosshair,
  BookOpen,
  GraduationCap,
  Layers3,
  Target,
  Ruler,
  AlertTriangle,
  Stethoscope,
  Compass,
  Sparkles,
} from 'lucide-react'
import { usePricingEventState } from '@/components/pricing-events/usePricingEventState'
import { PricingEventCountdown } from '@/components/pricing-events/PricingEventCountdown'
import { PLUS_LABEL } from '@/lib/account-tier'
import { LogoTomografia } from './logo'
import { PreviaCine } from './previa'
import { tema } from './tema'

export interface PlanoResumo {
  key: string
  label?: string
  price: number
  enabled: boolean
  durationMonths?: number | null
  pricingEventId?: string | null
}

export interface ResumoAtlas {
  cortes: number
  estruturas: number
  series: number
  questoes: number
  secoes: {
    id: string
    titulo: string
    series: number
    estruturas: number
    cortes: number
    titulosSeries: string[]
  }[]
}

interface PaywallProps {
  onCheckout: () => void
  isAuthenticated: boolean
  planos: PlanoResumo[]
  precoAvulso: number
  produtoAtivo: boolean
  resumo?: ResumoAtlas
  /** Nome da série que o visitante tentou abrir, quando veio de um link direto. */
  serieAlvo?: string | null
}

function formatBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))
}

/** Amostras do mecanismo — uma por região, com poucos cortes de cada série. */
const AMOSTRAS: { id: string; regiao: string; pasta: string; ext: string; de: number; ate: number }[] = [
  { id: 'torax', regiao: 'TC de tórax', pasta: '/TC_TORAX/TC_TORAX_CORAÇÃO', ext: 'png', de: 3, ate: 16 },
  {
    id: 'abdome',
    regiao: 'TC de abdome',
    pasta: '/TC_ABDOME/TC_ABDOME_VISCERAS_PARENQUIMATOSAS',
    ext: 'JPG',
    de: 16,
    ate: 32,
  },
  {
    id: 'cranio',
    regiao: 'TC de crânio',
    pasta: '/TC_CRANIO/TC_CRANIO_PARENQUIMA_ENCEFALICO',
    ext: 'PNG',
    de: 5,
    ate: 18,
  },
]

const RECURSOS = [
  {
    icon: MousePointerClick,
    t: 'A pilha inteira no scroll',
    d: 'Roda do mouse, arraste, setas do teclado, PgUp/PgDn e cine com velocidade ajustável — o mesmo gesto da estação de trabalho do radiologista. No celular, o dedo sobre a imagem.',
  },
  {
    icon: ScanLine,
    t: 'Sete janelas para comparar',
    d: 'Mediastinal, pulmonar, óssea, cerebral, angio e hepática, mais brilho, contraste e inversão. Você vê, no mesmo corte, por que a janela é decisão diagnóstica e não ajuste estético.',
  },
  {
    icon: Crosshair,
    t: 'Salto direto para a estrutura',
    d: 'Clique no nome e o visualizador vai ao corte em que ela aparece rotulada, marcando na régua todos os cortes em que ela é visível.',
  },
  {
    icon: BookOpen,
    t: 'Ficha aprofundada em cada estrutura',
    d: 'Morfologia, função, densidade em unidades Hounsfield, janela ideal, como encontrar rolando os cortes, reparos vizinhos, importância clínica, alterações com o aspecto de cada uma na TC e armadilhas de leitura.',
  },
  {
    icon: GraduationCap,
    t: 'Roteiro de leitura sistemática',
    d: 'Cada série tem o passo a passo na ordem em que se deve olhar, mais o protocolo de aquisição do exame e as pérolas de prova e de plantão.',
  },
  {
    icon: Target,
    t: 'Modo treino: encontre o corte',
    d: 'O exercício que mais se parece com a leitura real — recebe o nome da estrutura e você percorre a pilha até achá-la. Mais o quiz de raciocínio ao fim de cada série.',
  },
]

/**
 * Três provas rápidas, ao lado da prévia. São o resumo do argumento para quem
 * decide sem rolar a página — o restante da vitrine detalha cada uma.
 */
const DESTAQUES = [
  {
    icon: Layers3,
    t: 'Exames inteiros, não figuras avulsas',
    d: 'As séries completas de três TCs reais — tórax, abdome e crânio —, cada corte na ordem em que o aparelho reconstruiu.',
  },
  {
    icon: BookOpen,
    t: 'Uma ficha aprofundada por estrutura',
    d: 'Densidade em UH, janela ideal, como achar rolando os cortes, clínica e o aspecto de cada alteração na imagem.',
  },
  {
    icon: Crosshair,
    t: 'Você treina, não só assiste',
    d: 'Quiz de raciocínio em cada série e o modo treino, que dá o nome da estrutura e pede que você encontre o corte.',
  },
]

/** Campos reais de uma ficha, para mostrar a profundidade sem entregar o texto. */
const CAMPOS_FICHA = [
  { icon: Compass, t: 'Como encontrar na imagem', d: 'O caminho para chegar à estrutura rolando os cortes, com os reparos anatômicos que confirmam a identificação.' },
  { icon: ScanLine, t: 'Densidade e janela', d: 'Valores em UH, comportamento com contraste em cada fase e a janela em que a estrutura é melhor avaliada.' },
  { icon: Layers3, t: 'Morfologia e função', d: 'Forma, dimensões, trajeto, relações — e o que o corpo perde quando aquela estrutura falha.' },
  { icon: Stethoscope, t: 'Importância clínica', d: 'O que muda na conduta quando algo acontece ali, escrito para quem vai atender e não só para quem vai provar.' },
  { icon: AlertTriangle, t: 'Alterações na TC', d: 'Cada doença relevante com a tradução visual exata: densidade, forma, realce, o sinal clássico.' },
  { icon: Ruler, t: 'Medidas e armadilhas', d: 'Os números de corte que você precisa decorar e as pseudolesões que fazem o iniciante errar.' },
]

/**
 * Página de vendas do Manual de Tomografia.
 *
 * Duas decisões de conteúdo guiam o layout. A primeira: o produto se vende pelo
 * gesto, não pela lista de recursos — por isso a prévia interativa vem antes de
 * qualquer bullet. A segunda: a objeção real de quem já assina o Manual Clínico
 * não é preço, é "será que já tenho?" — por isso a faixa de inclusão aparece
 * no topo, antes do preço.
 */
export function PaywallTomografia({
  onCheckout,
  isAuthenticated,
  planos,
  precoAvulso,
  produtoAtivo,
  resumo,
  serieAlvo,
}: PaywallProps) {
  const [amostra, setAmostra] = useState(AMOSTRAS[0])

  const habilitados = planos.filter((p) => p.enabled && p.price > 0)
  const maisBarato = habilitados.reduce<PlanoResumo | null>(
    (min, p) => (min == null || p.price < min.price ? p : min),
    null,
  )
  const precoBase = maisBarato?.price ?? precoAvulso ?? 0
  const eventoId = maisBarato?.pricingEventId ?? null
  const { state: evento } = usePricingEventState(eventoId)

  const pctLote = evento?.activeTier?.discountPercent || 0
  const temLote = !!evento?.activeTier && evento?.isActive !== false && pctLote > 0 && precoBase > 0
  const precoFinal = temLote ? Math.max(0, Math.round(precoBase * (1 - pctLote / 100) * 100) / 100) : precoBase
  const mostrarPreco = produtoAtivo && precoBase > 0

  const urls = useMemo(
    () =>
      Array.from({ length: amostra.ate - amostra.de + 1 }, (_, i) =>
        encodeURI(`${amostra.pasta}/${amostra.de + i}.${amostra.ext}`),
      ),
    [amostra],
  )

  const numeros = [
    { v: resumo?.cortes ?? 640, r: 'cortes reais' },
    { v: resumo?.estruturas ?? 272, r: 'estruturas comentadas' },
    { v: resumo?.series ?? 20, r: 'séries' },
    { v: resumo?.questoes ?? 107, r: 'questões' },
  ]

  const beneficios = [
    'Acesso imediato após o pagamento',
    'Leva junto as 300+ patologias do Manual Clínico',
    'O Manual do Eletrocardiograma vem no mesmo pacote',
    'Atualizações do atlas inclusas',
    ...(isAuthenticated ? [] : ['Sem conta? A Serial Key vai por e-mail']),
  ]

  return (
    <>
      {/* pb reserva o espaço da barra fixa do celular */}
      <div className="pb-28 lg:pb-0">
        {/* ══════════ ABERTURA ══════════ */}
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-10">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
              <Crown className="h-3.5 w-3.5" /> {PLUS_LABEL} · incluso no Manual Clínico
            </span>

            <h1 className="sr-only">Manual de Tomografia</h1>
            <LogoTomografia className="mt-4 w-full max-w-[320px] sm:max-w-[400px]" />

            {serieAlvo ? (
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                A série <strong className="font-semibold text-foreground">{serieAlvo}</strong> faz parte do
                Manual de Tomografia — o atlas de TC do Manual Clínico. Ele é privativo de assinantes: não entra
                no teste grátis e não é vendido à parte.
              </p>
            ) : (
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Três exames de tomografia computadorizada reais, cortados como no aparelho: você rola o scroll e
                a pilha avança corte a corte, do ápice pulmonar à pelve, do forame magno ao vértice.
              </p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {numeros.map((n) => (
                <div key={n.r} className="rounded-xl border border-border bg-card px-3 py-2.5">
                  <p className="font-heading text-xl font-semibold tracking-tight text-primary">{n.v}</p>
                  <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{n.r}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4 sm:p-5">
              <p className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-300">
                <Check className="h-4 w-4" /> Já assina o Manual Clínico ou tem {PLUS_LABEL}?
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Então o Manual de Tomografia já é seu — sem custo extra, sem comprar de novo. Basta entrar na
                sua conta que o atlas abre inteiro.
              </p>
            </div>

            <ul className="mt-6 space-y-3">
              {DESTAQUES.map((d) => (
                <li key={d.t} className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 rounded-lg bg-primary/10 p-2 text-primary">
                    <d.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-snug">{d.t}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{d.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Prévia + preço ── */}
          <div className="space-y-5 lg:sticky lg:top-6">
            <div className="rounded-2xl border border-border bg-gradient-to-b from-slate-900 to-slate-950 p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex flex-wrap gap-1.5">
                {AMOSTRAS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAmostra(a)}
                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                      amostra.id === a.id
                        ? 'bg-emerald-400 text-neutral-900'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {a.regiao}
                  </button>
                ))}
              </div>
              <PreviaCine regiao={amostra.regiao} urls={urls} />
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              {mostrarPreco ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Incluso no Manual Clínico
                    {maisBarato?.label ? ` · plano ${maisBarato.label}` : ''}
                  </p>
                  <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    {temLote && (
                      <span className="text-base text-muted-foreground line-through">{formatBRL(precoBase)}</span>
                    )}
                    <span className="font-heading text-3xl font-black tracking-tight text-primary sm:text-4xl">
                      {formatBRL(precoFinal)}
                    </span>
                    {temLote && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        <Flame className="h-3 w-3" /> −{Math.round(pctLote)}%
                      </span>
                    )}
                  </div>
                  {temLote && evento?.activeTier?.label && (
                    <p className="mt-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                      Lote {evento.activeTier.label} — você economiza {formatBRL(precoBase - precoFinal)}.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Acesso liberado para assinantes do Manual Clínico e contas {PLUS_LABEL}.
                </p>
              )}

              {temLote && evento && (
                <div className="mt-3">
                  <PricingEventCountdown state={evento} compact />
                </div>
              )}

              <button
                onClick={onCheckout}
                className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
              >
                <Crown className="h-4 w-4" />
                {isAuthenticated ? 'Desbloquear o Manual Clínico' : 'Comprar e desbloquear'}
                <ArrowRight className="h-4 w-4" />
              </button>

              <ul className="mt-4 space-y-1.5">
                {beneficios.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    {b}
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Pix, cartão ou boleto · pagamento processado com
                segurança.
              </p>
            </div>
          </div>
        </div>

        {/* ══════════ O QUE VOCÊ RECEBE ══════════ */}
        <section className="mt-14">
          <p className="editorial-mark mb-2">O que está do outro lado</p>
          <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            Não é uma galeria de imagens. É uma estação de trabalho com um professor ao lado.
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {RECURSOS.map((r) => (
              <div
                key={r.t}
                className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
              >
                <r.icon className="mb-2 h-5 w-5 text-primary" />
                <p className="text-sm font-bold">{r.t}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{r.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════ AS TRÊS REGIÕES ══════════ */}
        {resumo && resumo.secoes.length > 0 && (
          <section className="mt-14">
            <p className="editorial-mark mb-2">O acervo</p>
            <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
              {resumo.series} séries em três regiões
            </h2>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {resumo.secoes.map((s, i) => {
                const t = tema(['vermelho', 'violeta', 'azul'][i] || 'ardosia')
                return (
                  <div key={s.id} className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className={`bg-gradient-to-b ${t.grad} px-4 py-3`}>
                      <p className="font-heading text-base font-semibold tracking-tight">{s.titulo}</p>
                      <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                        {s.series} séries · {s.estruturas} estruturas · {s.cortes} cortes
                      </p>
                    </div>
                    <ul className="divide-y divide-border">
                      {s.titulosSeries.map((titulo) => (
                        <li key={titulo} className="flex items-center gap-2 px-4 py-2 text-sm">
                          <Lock className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                          <span className="text-muted-foreground">{titulo}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ══════════ PROFUNDIDADE DA FICHA ══════════ */}
        <section className="mt-14">
          <p className="editorial-mark mb-2">A profundidade</p>
          <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            Cada uma das {resumo?.estruturas ?? 272} estruturas tem esta ficha
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Não é uma legenda com o nome da estrutura. É o dossiê completo — o que você leria num tratado, mas
            organizado na ordem em que a dúvida aparece enquanto você olha a imagem.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CAMPOS_FICHA.map((c) => (
              <div key={c.t} className="rounded-xl border border-border bg-muted/30 p-4">
                <c.icon className="mb-2 h-4 w-4 text-primary" />
                <p className="text-sm font-bold">{c.t}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════ FECHAMENTO ══════════ */}
        <section className="mt-14 overflow-hidden rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                <Sparkles className="h-3.5 w-3.5" /> Um pagamento, três manuais
              </p>
              <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                O Manual de Tomografia vem junto com o Manual Clínico
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                O mesmo acesso libera as 300+ patologias do Manual Clínico, o Manual do Eletrocardiograma com
                simulador de 12 derivações e este atlas de TC. Não há venda avulsa nem teste gratuito do atlas —
                ele é indivisível.
              </p>
            </div>
            <button
              onClick={onCheckout}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
            >
              <Crown className="h-4 w-4" />
              {mostrarPreco ? `Desbloquear por ${formatBRL(precoFinal)}` : 'Desbloquear agora'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
          Material educacional. As imagens são cortes de exames reais usados para ensino de anatomia tomográfica
          e não substituem laudo, avaliação clínica ou protocolo institucional.
        </p>
      </div>

      {/* ══════════ BARRA FIXA DO CELULAR ══════════ */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-3">
          {mostrarPreco && (
            <div className="min-w-0">
              <p className="truncate text-[11px] text-muted-foreground">
                {temLote ? `−${Math.round(pctLote)}% no lote atual` : `${PLUS_LABEL} · tudo incluso`}
              </p>
              <p className="flex items-baseline gap-1.5">
                {temLote && (
                  <span className="text-[11px] text-muted-foreground line-through">{formatBRL(precoBase)}</span>
                )}
                <span className="text-lg font-black leading-tight text-primary">{formatBRL(precoFinal)}</span>
              </p>
            </div>
          )}
          <button
            onClick={onCheckout}
            className="ml-auto inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm transition active:scale-[0.98]"
          >
            <Crown className="h-4 w-4" />
            {isAuthenticated ? 'Desbloquear' : 'Comprar agora'}
          </button>
        </div>
      </div>
    </>
  )
}
