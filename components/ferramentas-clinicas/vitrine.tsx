'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Crown,
  Flame,
  Gauge,
  Lock,
  Search,
  ShieldCheck,
  Sigma,
  Smartphone,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react'
import { usePricingEventState } from '@/components/pricing-events/usePricingEventState'
import { PricingEventCountdown } from '@/components/pricing-events/PricingEventCountdown'
import { PLUS_LABEL } from '@/lib/account-tier'
import type { ResumoFerramentas } from '@/app/api/manual-clinico/ferramentas/route'
import type { PlanoResumo } from './use-acesso'
import { ICONES, ICONE_PADRAO, tema } from './tema'
import { DemoFerramentas } from './demo'

interface VitrineProps {
  onCheckout: () => void
  isAuthenticated: boolean
  planos: PlanoResumo[]
  precoAvulso: number
  produtoAtivo: boolean
  resumo?: ResumoFerramentas
  /** Área que o visitante tentou abrir, quando chegou por link direto. */
  areaAlvo?: string | null
}

function formatBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))
}

const DESTAQUES = [
  {
    icon: Zap,
    t: 'Responde enquanto você digita',
    d: 'Não existe botão de calcular. O número muda a cada tecla, e é isso que transforma a conta em raciocínio: dá para perguntar "e se o bicarbonato fosse 12?" e ver a resposta antes de terminar de pensar na pergunta.',
  },
  {
    icon: Sigma,
    t: 'A conta fica aberta',
    d: 'Cada resultado mostra os valores intermediários, não só o final. A fórmula aparece ao lado, em texto, para conferir, aprender e reproduzir no papel quando o celular não estiver na mão.',
  },
  {
    icon: AlertTriangle,
    t: 'Diz quando o número mente',
    d: 'Toda ferramenta traz o que invalida o cálculo, em que população não foi estudada e que erro sistemático esperar. É a parte que as calculadoras costumam omitir — e é a que decide se você deve confiar no resultado.',
  },
  {
    icon: BookOpen,
    t: 'Referência para cada uma',
    d: 'O artigo de derivação, a validação relevante e a diretriz vigente. Quando o consenso mudou, o texto conta o que mudou e por quê, em vez de fingir que a fórmula sempre foi aquela.',
  },
]

const DORES = [
  {
    q: '"Qual era o ponto de corte mesmo?"',
    a: 'Você lembra que existe um escore para aquilo, não lembra dos critérios, e o paciente está na sua frente. A busca no celular devolve uma calculadora em inglês, sem dizer de onde veio nem em quem foi validada.',
  },
  {
    q: '"O número deu 4. E daí?"',
    a: 'A calculadora entrega o valor e cala. Não diz o que ele significa nesta população, o que fazer com ele, nem se algum dado que você digitou tornou o resultado inválido.',
  },
  {
    q: '"Será que copiei a fórmula certa?"',
    a: 'Conta feita na margem da folha de evolução, com a fórmula lembrada de memória. Sem a conta aberta, um erro de sinal ou de unidade passa despercebido e vira conduta.',
  },
]

const FAQ = [
  {
    q: 'Isso substitui o julgamento clínico?',
    a: 'Não, e a seção inteira é escrita para deixar isso explícito. Escores descrevem probabilidades em populações, não destinos individuais. Cada ferramenta traz as armadilhas de aplicação justamente para você saber quando o número não vale.',
  },
  {
    q: 'De onde vêm as fórmulas?',
    a: 'Do artigo original de derivação, da validação relevante e da diretriz vigente — todas citadas em cada ferramenta, com autor, periódico e ano. Onde a implementação fiel exigiria uma tabela proprietária, a ferramenta diz isso na tela em vez de chutar um valor aproximado.',
  },
  {
    q: 'Funciona bem no celular?',
    a: 'Foi desenhado primeiro para o celular na beira do leito: teclado numérico com decimal, alvos de toque grandes e uma faixa fixa que mantém o resultado à vista enquanto você percorre o formulário. Funciona igual em tablet, notebook e desktop.',
  },
  {
    q: 'Já assino o Manual Clínico. Preciso pagar de novo?',
    a: `Não. As Ferramentas Clínicas já estão inclusas na sua assinatura, como o Manual do Eletrocardiograma e o Manual de Tomografia. Basta entrar na conta que a seção abre inteira.`,
  },
  {
    q: 'Preciso criar conta para comprar?',
    a: 'Não. A compra por Serial Key funciona sem conta — a chave vai por e-mail e você ativa quando quiser.',
  },
]

/**
 * Página de vendas das Ferramentas Clínicas.
 *
 * A estrutura segue de uma constatação: uma calculadora não se vende por
 * descrição, se vende pelo uso. Por isso três ferramentas de verdade vêm
 * completas e funcionando logo abaixo da abertura — antes de qualquer lista de
 * recursos, antes do preço. Quem mexeu nos campos e viu a conta abrir já sabe
 * o que está comprando; o resto da página só responde objeções.
 */
export function VitrineFerramentas({
  onCheckout,
  isAuthenticated,
  planos,
  precoAvulso,
  produtoAtivo,
  resumo,
  areaAlvo,
}: VitrineProps) {
  const [areaAberta, setAreaAberta] = useState<string | null>(null)
  const [faqAberta, setFaqAberta] = useState<number | null>(0)

  const habilitados = planos.filter((p) => p.enabled && p.price > 0)
  const maisBarato = habilitados.reduce<PlanoResumo | null>(
    (min, p) => (min == null || p.price < min.price ? p : min),
    null,
  )
  const precoBase = maisBarato?.price ?? precoAvulso ?? 0
  const { state: evento } = usePricingEventState(maisBarato?.pricingEventId ?? null)

  const pctLote = evento?.activeTier?.discountPercent || 0
  const temLote = !!evento?.activeTier && evento?.isActive !== false && pctLote > 0 && precoBase > 0
  const precoFinal = temLote ? Math.max(0, Math.round(precoBase * (1 - pctLote / 100) * 100) / 100) : precoBase
  const mostrarPreco = produtoAtivo && precoBase > 0

  const nFerramentas = resumo?.ferramentas ?? 201
  const nAreas = resumo?.areas ?? 15
  const nReferencias = resumo?.referencias ?? 300
  const nArmadilhas = resumo?.comArmadilhas ?? 180

  // Quando todas as ferramentas têm armadilhas — que é o caso — repetir o
  // mesmo número duas vezes na fileira enfraquece os dois. "100%" diz melhor.
  const todasComArmadilhas = nArmadilhas >= nFerramentas
  const numeros = [
    { v: String(nFerramentas), r: 'ferramentas' },
    { v: String(nAreas), r: 'áreas clínicas' },
    { v: String(nReferencias), r: 'referências citadas' },
    todasComArmadilhas
      ? { v: '100%', r: 'com armadilhas escritas' }
      : { v: String(nArmadilhas), r: 'com armadilhas escritas' },
  ]

  const beneficios = [
    'Acesso imediato após o pagamento',
    'Leva junto as 300+ patologias do Manual Clínico',
    'O Manual do Eletrocardiograma e o de Tomografia vêm no mesmo pacote',
    'Ferramentas novas entram sem custo extra',
    ...(isAuthenticated ? [] : ['Sem conta? A Serial Key vai por e-mail']),
  ]

  const botaoPrincipal = (
    <button
      onClick={onCheckout}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
    >
      <Crown className="h-4 w-4" />
      {isAuthenticated ? 'Desbloquear o Manual Clínico' : 'Comprar e desbloquear'}
      <ArrowRight className="h-4 w-4" />
    </button>
  )

  return (
    <>
      {/* pb reserva o espaço da barra fixa do celular */}
      <div className="pb-28 lg:pb-0">
        {/* ══════════════════════════ ABERTURA ══════════════════════════ */}
        <section>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
            <Crown className="h-3.5 w-3.5" /> {PLUS_LABEL} · incluso no Manual Clínico
          </span>

          <h1 className="mt-4 font-heading text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
            {nFerramentas} calculadoras clínicas
            <span className="block text-primary">com a conta aberta.</span>
          </h1>

          {areaAlvo ? (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              <strong className="font-semibold text-foreground">{areaAlvo}</strong> faz parte das Ferramentas
              Clínicas — a seção de calculadoras e escores do Manual Clínico. É privativa de assinantes e não é
              vendida à parte.
            </p>
          ) : (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Gasometria, escores de risco, ajuste de dose, ventilação, sepse, obstetrícia, pediatria. Cada uma
              responde em tempo real, mostra a fórmula, explica o fundamento fisiopatológico, avisa o que
              invalida o resultado e cita de onde veio.
            </p>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {numeros.map((n) => (
              <div key={n.r} className="rounded-xl border border-border bg-card px-3 py-2.5">
                <p className="font-heading text-2xl font-semibold tracking-tight text-primary">{n.v}</p>
                <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{n.r}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4 sm:p-5">
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-300">
              <Check className="h-4 w-4" /> Já assina o Manual Clínico ou tem {PLUS_LABEL}?
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Então as Ferramentas Clínicas já são suas — sem custo extra, sem comprar de novo. Basta entrar na
              sua conta que a seção abre inteira.
            </p>
          </div>
        </section>

        {/* ══════════════════════════ DEMONSTRAÇÃO ══════════════════════════ */}
        <section className="mt-12">
          <p className="editorial-mark mb-2">Experimente antes</p>
          <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            Três ferramentas liberadas. Sem cadastro, sem truque.
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Não é um vídeo nem uma imagem de demonstração — é o produto rodando nesta página. Digite valores e
            veja a conta se abrir, a interpretação aparecer e as referências no rodapé.
          </p>
          <div className="mt-5">
            <DemoFerramentas />
          </div>
        </section>

        {/* ══════════════════════════ O PROBLEMA ══════════════════════════ */}
        <section className="mt-14">
          <p className="editorial-mark mb-2">Por que isto existe</p>
          <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            O problema nunca foi fazer a conta
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            É saber se a conta se aplica ao paciente que está na sua frente. Nenhuma calculadora responde isso —
            elas devolvem um número e vão embora.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {DORES.map((d) => (
              <div key={d.q} className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="font-heading text-sm font-semibold leading-snug text-foreground">{d.q}</p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{d.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════ O QUE MUDA ══════════════════════════ */}
        <section className="mt-14">
          <p className="editorial-mark mb-2">O que está do outro lado</p>
          <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            Quatro coisas que toda ferramenta entrega
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {DESTAQUES.map((d) => (
              <div key={d.t} className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
                <span className="mb-2 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
                  <d.icon className="h-4 w-4" />
                </span>
                <p className="text-sm font-bold">{d.t}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{d.d}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Search, t: 'Busca que perdoa', d: 'Digite "winter", "anion gap", "CHA2DS2" ou o parâmetro que quer calcular. Acentos e siglas não atrapalham.' },
              { icon: Star, t: 'Favoritos', d: 'As que você usa todo plantão ficam salvas na abertura da seção, a um toque.' },
              { icon: Smartphone, t: 'Feito para a beira do leito', d: 'Teclado decimal, alvo de toque grande e o resultado fixo à vista enquanto você preenche.' },
            ].map((r) => (
              <div key={r.t} className="rounded-xl border border-border bg-muted/30 p-4">
                <r.icon className="mb-2 h-4 w-4 text-primary" />
                <p className="text-sm font-bold">{r.t}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{r.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════ O CATÁLOGO ══════════════════════════ */}
        {resumo && resumo.categorias.length > 0 && (
          <section className="mt-14">
            <p className="editorial-mark mb-2">O catálogo inteiro</p>
            <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
              {nFerramentas} ferramentas em {nAreas} áreas
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Nada de lista genérica: abaixo está o nome de cada uma. Toque numa área para ver tudo o que ela
              contém.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {resumo.categorias.map((c) => {
                const t = tema(c.cor)
                const Icone = ICONES[c.icone] || ICONE_PADRAO
                const aberta = areaAberta === c.id
                const visiveis = aberta ? c.nomes : c.nomes.slice(0, 6)
                return (
                  <div key={c.id} className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className={`bg-gradient-to-b ${t.grad} px-4 py-3`}>
                      <div className="flex items-start gap-2.5">
                        <span className={`shrink-0 rounded-lg border ${t.border} ${t.bg} p-1.5`}>
                          <Icone className={`h-4 w-4 ${t.text}`} />
                        </span>
                        <div className="min-w-0">
                          <p className="font-heading text-sm font-semibold leading-snug tracking-tight">{c.nome}</p>
                          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                            {c.total} ferramenta{c.total !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                    <ul className="divide-y divide-border">
                      {visiveis.map((nome) => (
                        <li key={nome} className="flex items-start gap-2 px-4 py-2 text-[12.5px] leading-snug">
                          <Lock className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/40" />
                          <span className="text-muted-foreground">{nome}</span>
                        </li>
                      ))}
                    </ul>
                    {c.nomes.length > 6 && (
                      <button
                        type="button"
                        onClick={() => setAreaAberta(aberta ? null : c.id)}
                        aria-expanded={aberta}
                        className="flex h-10 w-full items-center justify-center gap-1.5 border-t border-border text-[12px] font-bold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                      >
                        {aberta ? 'Recolher' : `Ver as outras ${c.nomes.length - 6}`}
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${aberta ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ══════════════════════════ PREÇO ══════════════════════════ */}
        <section className="mt-14">
          <div className="glass-panel overflow-hidden rounded-2xl p-5 sm:p-7">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  <Sparkles className="h-3.5 w-3.5" /> Um pagamento, quatro manuais
                </p>
                <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                  As Ferramentas Clínicas vêm junto com o Manual Clínico
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  O mesmo acesso libera as 300+ patologias do Manual Clínico, o Manual do Eletrocardiograma com
                  simulador de 12 derivações, o Manual de Tomografia e estas {nFerramentas} calculadoras. Não há
                  venda avulsa desta seção.
                </p>
                <ul className="mt-4 space-y-1.5">
                  {beneficios.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-[12.5px] text-muted-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
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
                    {temLote && evento && (
                      <div className="mt-3">
                        <PricingEventCountdown state={evento} compact />
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Acesso liberado para assinantes do Manual Clínico e contas {PLUS_LABEL}.
                  </p>
                )}

                <div className="mt-4">{botaoPrincipal}</div>

                <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Pix, cartão ou boleto · pagamento processado
                  com segurança.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════ FAQ ══════════════════════════ */}
        <section className="mt-14">
          <p className="editorial-mark mb-2">Antes de decidir</p>
          <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">Perguntas honestas</h2>
          <div className="mt-5 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {FAQ.map((f, i) => {
              const aberta = faqAberta === i
              return (
                <div key={f.q}>
                  <button
                    type="button"
                    onClick={() => setFaqAberta(aberta ? null : i)}
                    aria-expanded={aberta}
                    className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
                  >
                    <span className="min-w-0 flex-1 text-[13.5px] font-semibold leading-snug">{f.q}</span>
                    <ChevronDown
                      className={`mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform ${aberta ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {aberta && (
                    <p className="px-4 pb-4 text-[13px] leading-relaxed text-muted-foreground">{f.a}</p>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* ══════════════════════════ FECHAMENTO ══════════════════════════ */}
        <section className="mt-14 overflow-hidden rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                <Gauge className="h-3.5 w-3.5" /> A conta que você faz todo plantão
              </p>
              <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                {nFerramentas} ferramentas, {nReferencias} referências, nenhuma caixa-preta
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Você já experimentou três delas nesta página. As outras {nFerramentas - 3} funcionam do mesmo
                jeito — com a fórmula à mostra, o fundamento escrito e o aviso de quando o número não vale.
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
          Material educacional. Escores descrevem probabilidades em populações e não substituem julgamento
          clínico, protocolo institucional nem a bula do medicamento.
        </p>
      </div>

      {/* ══════════════════════════ BARRA FIXA DO CELULAR ══════════════════════════ */}
      <div className="glass-panel fixed inset-x-0 bottom-0 z-40 rounded-none border-x-0 border-b-0 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 lg:hidden">
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
