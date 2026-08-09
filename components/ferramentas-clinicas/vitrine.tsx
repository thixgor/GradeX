'use client'

import { useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Crown,
  Flame,
  HeartPulse,
  Layers3,
  Microscope,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from 'lucide-react'
import { usePricingEventState } from '@/components/pricing-events/usePricingEventState'
import { PricingEventCountdown } from '@/components/pricing-events/PricingEventCountdown'
import { PLUS_LABEL } from '@/lib/account-tier'
import type { PlanoResumo } from './use-acesso'

interface SecaoVendaProps {
  onCheckout: () => void
  isAuthenticated: boolean
  planos: PlanoResumo[]
  precoAvulso: number
  produtoAtivo: boolean
  totalFerramentas: number
  totalReferencias: number
}

function formatBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))
}

/** O que a assinatura acrescenta a quem já está usando as calculadoras de graça. */
const OUTROS_MANUAIS = [
  {
    icon: Stethoscope,
    t: '300+ patologias do Manual Clínico',
    d: 'Cada uma com definição, fisiopatologia, quadro clínico, diagnóstico diferencial, exames e conduta — escritas na ordem em que a dúvida aparece no atendimento, não na ordem do índice do livro.',
  },
  {
    icon: HeartPulse,
    t: 'Manual do Eletrocardiograma',
    d: 'Trilha do zero ao laudo com simulador de 12 derivações, traçados fiéis em papel milimetrado e o banco de padrões para treinar reconhecimento.',
  },
  {
    icon: Layers3,
    t: 'Manual de Tomografia',
    d: 'Três exames reais cortados como no aparelho: você rola a pilha corte a corte, com as estruturas comentadas em densidade, janela, morfologia e importância clínica.',
  },
  {
    icon: Microscope,
    t: 'Manual da Histologia',
    d: 'Atlas de lâminas com microscópio interativo, dossiê por estrutura e quizzes — em português, com "o que esta lâmina mostra" escrito em cada uma.',
  },
]

const FAQ = [
  {
    q: 'As calculadoras são realmente gratuitas?',
    a: 'São. Todas elas, sem login, sem cadastro e sem limite de uso. Você acabou de usar esta página inteira sem entrar em nenhuma conta. O que a assinatura do Manual Clínico acrescenta é o resto: as patologias, o ECG, a tomografia e a histologia.',
  },
  {
    q: 'Isso substitui o julgamento clínico?',
    a: 'Não, e a seção inteira é escrita para deixar isso explícito. Escores descrevem probabilidades em populações, não destinos individuais. Cada ferramenta traz as armadilhas de aplicação justamente para você saber quando o número não vale.',
  },
  {
    q: 'De onde vêm as fórmulas?',
    a: 'Do artigo original de derivação, da validação relevante e da diretriz vigente — todas citadas em cada ferramenta, com autor, periódico e ano. Onde a implementação fiel exigiria uma tabela proprietária, a ferramenta diz isso na tela em vez de chutar um valor aproximado.',
  },
  {
    q: 'Meus favoritos ficam salvos?',
    a: 'Ficam no próprio aparelho, sem precisar de conta. Se você limpar os dados do navegador ou trocar de celular, eles não vão junto.',
  },
  {
    q: 'Preciso criar conta para assinar?',
    a: 'Não. A compra por Serial Key funciona sem conta — a chave vai por e-mail e você ativa quando quiser.',
  },
]

/**
 * Faixa de conversão das Ferramentas Clínicas.
 *
 * As 201 calculadoras são abertas: não há o que desbloquear aqui, e fingir que
 * há seria mentir para quem acabou de usá-las. Então esta seção inverte o
 * argumento padrão de página de vendas — em vez de mostrar o que falta, parte
 * do que a pessoa já recebeu de graça para apresentar o que vem junto. Só
 * aparece para quem ainda não assina.
 */
export function SecaoVendaFerramentas({
  onCheckout,
  isAuthenticated,
  planos,
  precoAvulso,
  produtoAtivo,
  totalFerramentas,
  totalReferencias,
}: SecaoVendaProps) {
  const [faqAberta, setFaqAberta] = useState<number | null>(null)

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

  return (
    <section className="mt-14">
      {/* ══════════════════════════ A VIRADA ══════════════════════════ */}
      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-5 sm:p-6">
        <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
          <Check className="h-3.5 w-3.5" /> Sem pegadinha
        </p>
        <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          As {totalFerramentas} ferramentas desta página são livres
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Todas, sem login e sem limite de uso — com a fórmula aberta, o fundamento escrito, as armadilhas de
          aplicação e as {totalReferencias} referências. Não há versão completa escondida atrás de um botão de
          compra: o que você está usando já é o produto inteiro.
        </p>
      </div>

      {/* ══════════════════════════ O QUE VEM JUNTO ══════════════════════════ */}
      <div className="mt-8">
        <p className="editorial-mark mb-2">E se você quiser o resto</p>
        <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          As calculadoras são uma peça do Manual Clínico
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Elas respondem o &ldquo;quanto&rdquo;. O que decide a conduta continua sendo o &ldquo;por quê&rdquo; — e
          é isso que está no resto do Manual.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {OUTROS_MANUAIS.map((m) => (
            <div key={m.t} className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
              <span className="mb-2 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
                <m.icon className="h-4 w-4" />
              </span>
              <p className="text-sm font-bold">{m.t}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{m.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════ PREÇO ══════════════════════════ */}
      <div className="glass-panel mt-8 overflow-hidden rounded-2xl p-5 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
              <Sparkles className="h-3.5 w-3.5" /> Um pagamento, quatro manuais
            </p>
            <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight sm:text-2xl">
              Manual Clínico completo
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              O mesmo acesso libera as patologias, o Manual do Eletrocardiograma, o de Tomografia e o de
              Histologia. As Ferramentas Clínicas seguem abertas para todo mundo, assinante ou não.
            </p>
            <ul className="mt-4 space-y-1.5">
              {[
                'Acesso imediato após o pagamento',
                'Atualizações inclusas enquanto o acesso durar',
                ...(isAuthenticated ? [] : ['Sem conta? A Serial Key vai por e-mail']),
              ].map((b) => (
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
                  Manual Clínico{maisBarato?.label ? ` · plano ${maisBarato.label}` : ''}
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
                Manual Clínico liberado para assinantes e contas {PLUS_LABEL}.
              </p>
            )}

            <button
              onClick={onCheckout}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
            >
              <Crown className="h-4 w-4" />
              {isAuthenticated ? 'Assinar o Manual Clínico' : 'Assinar agora'}
              <ArrowRight className="h-4 w-4" />
            </button>

            <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Pix, cartão ou boleto · pagamento processado com
              segurança.
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════ FAQ ══════════════════════════ */}
      <div className="mt-8">
        <p className="editorial-mark mb-2">Antes de perguntar</p>
        <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">Perguntas honestas</h2>
        <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
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
                {aberta && <p className="px-4 pb-4 text-[13px] leading-relaxed text-muted-foreground">{f.a}</p>}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/**
 * Chamada compacta para as páginas de área.
 *
 * A pessoa veio aqui para calcular alguma coisa; interromper isso com a seção
 * de vendas inteira seria cobrar pedágio numa página que é gratuita. Uma faixa
 * no rodapé basta.
 */
export function FaixaVendaCompacta({
  onCheckout,
  isAuthenticated,
}: {
  onCheckout: () => void
  isAuthenticated: boolean
}) {
  return (
    <div className="mt-10 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
            <BookOpen className="h-3.5 w-3.5" /> Estas calculadoras são gratuitas
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            O Manual Clínico completo acrescenta as 300+ patologias, o Manual do Eletrocardiograma, o de
            Tomografia e o de Histologia.
          </p>
        </div>
        <button
          onClick={onCheckout}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
        >
          <Crown className="h-4 w-4" />
          {isAuthenticated ? 'Assinar' : 'Conhecer o Manual'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
