'use client'

import { useState } from 'react'
import {
  Activity,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Crown,
  Flame,
  FlaskConical,
  Layers,
  Microscope,
  PersonStanding,
  Pill,
  ScanLine,
  ShieldCheck,
  Sigma,
  Sparkles,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PLUS_LABEL } from '@/lib/account-tier'
import {
  MODULOS_DO_PACOTE,
  TOTAL_DE_MODULOS,
  modulosOrdenados,
  outrosModulos,
  precoPorDia,
  precoPorModulo,
  type IdDoModulo,
  type ModuloDoPacote,
} from '@/lib/manual-clinico/pacote'

/**
 * As peças de venda que todas as vitrines do Manual Clínico compartilham.
 *
 * Cada seção tinha a própria página, e cada página vendia a si mesma. Quem caía
 * na Histologia lia sobre 1.318 lâminas, via um preço e ia embora achando que
 * aquilo era um produto avulso — sem descobrir que o mesmo pagamento abre
 * os outros manuais. O que faltava não era desconto: era a informação de que
 * a compra é uma só.
 *
 * A ordem aqui é deliberada e vale para todas as vitrines: primeiro a faixa que
 * diz que a compra é conjunta, depois a grade com o que cada manual tem dentro,
 * e **só então** o preço. Preço mostrado antes do valor vira comparação com
 * outro preço; mostrado depois, vira comparação com o que se recebe.
 *
 * ## Sobre o tom
 *
 * As vitrines não compartilham paleta: Ferramentas e Radiologia usam os tokens
 * de tema (viram claro e escuro com o resto do site), Anatomia e Histologia
 * abrem sobre herói escuro fixo, e o checkout é verde-escuro. Em vez de uma variante por vitrine, cada componente aceita `tom`: `'tema'` segue os tokens, `'escuro'`
 * usa superfícies claras sobre fundo escuro fixo.
 */

type Tom = 'tema' | 'escuro'

const ICONES: Record<ModuloDoPacote['icone'], LucideIcon> = {
  BookOpen,
  FlaskConical,
  Pill,
  Activity,
  ScanLine,
  Microscope,
  PersonStanding,
  Sigma,
}

/** Classes de superfície por tom — o único lugar que conhece as duas paletas. */
const T = {
  tema: {
    cartao: 'border-border bg-card',
    cartaoSuave: 'border-border bg-muted/30',
    texto: 'text-foreground',
    fraco: 'text-muted-foreground',
    apagado: 'text-muted-foreground/60',
    divisor: 'divide-border',
    borda: 'border-border',
    destaqueBorda: 'border-emerald-500/30',
    destaqueFundo: 'bg-emerald-500/[0.07]',
    destaqueTexto: 'text-emerald-700 dark:text-emerald-300',
    ambarBorda: 'border-amber-500/25',
    ambarFundo: 'bg-amber-500/[0.07]',
    ambarTexto: 'text-amber-700 dark:text-amber-300',
    precoTexto: 'text-primary',
    riscado: 'text-muted-foreground/70',
    botao: 'bg-primary text-primary-foreground hover:bg-primary/90',
  },
  escuro: {
    cartao: 'border-white/10 bg-white/[0.055]',
    cartaoSuave: 'border-white/10 bg-white/[0.03]',
    texto: 'text-white',
    fraco: 'text-white/60',
    apagado: 'text-white/40',
    divisor: 'divide-white/10',
    borda: 'border-white/10',
    destaqueBorda: 'border-emerald-300/30',
    destaqueFundo: 'bg-emerald-300/[0.09]',
    destaqueTexto: 'text-emerald-300',
    ambarBorda: 'border-amber-300/30',
    ambarFundo: 'bg-amber-300/[0.09]',
    ambarTexto: 'text-amber-300',
    precoTexto: 'text-emerald-200',
    riscado: 'text-white/40',
    botao: 'bg-emerald-300 text-emerald-950 hover:bg-emerald-200',
  },
} as const

function reais(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))
}

/* ══════════════════════════════ SELO ══════════════════════════════ */

/**
 * O selo de topo — a primeira coisa que a página diz.
 *
 * Substitui o "incluso no Manual Clínico" que as vitrines usavam. A diferença
 * é a direção da frase: "incluso" pede que a pessoa já saiba o que é o Manual
 * Clínico; "N manuais, 1 pagamento" funciona para quem nunca ouviu falar dele.
 */
export function SeloDoPacote({ tom = 'tema', className = '' }: { tom?: Tom; className?: string }) {
  const t = T[tom]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${t.ambarBorda} ${t.ambarFundo} px-3 py-1.5 text-[11px] font-black uppercase tracking-wider ${t.ambarTexto} ${className}`}
    >
      <Crown className="h-3.5 w-3.5" /> {TOTAL_DE_MODULOS} manuais · 1 pagamento único
    </span>
  )
}

/* ══════════════════════════════ FAIXA ══════════════════════════════ */

/**
 * A correção de expectativa, logo abaixo do herói.
 *
 * Quem chega numa vitrine acha que está diante de um produto. A faixa diz, na
 * primeira dobra, que não está — e nomeia os outros seis para que o argumento
 * seja verificável em vez de vago. Sem preço aqui de propósito: esta faixa
 * existe para aumentar o que está sendo pesado, não para pesar.
 */
export function FaixaDoPacote({
  atual,
  tom = 'tema',
  className = '',
}: {
  atual: IdDoModulo
  tom?: Tom
  className?: string
}) {
  const t = T[tom]
  const eu = MODULOS_DO_PACOTE.find((m) => m.id === atual)
  const outros = outrosModulos(atual)

  return (
    <div className={`overflow-hidden rounded-2xl border ${t.ambarBorda} ${t.ambarFundo} p-4 sm:p-5 ${className}`}>
      <p className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-wider ${t.ambarTexto}`}>
        <Sparkles className="h-3.5 w-3.5" /> Leia antes de comparar preço
      </p>
      <h2 className={`mt-2 font-heading text-lg font-semibold leading-snug tracking-tight sm:text-xl ${t.texto}`}>
        {eu?.nome ?? 'Este manual'} não é vendido separado — ele vem com outros {outros.length}.
      </h2>
      <p className={`mt-2 text-sm leading-relaxed ${t.fraco}`}>
        Não existe compra avulsa de nenhuma seção. O mesmo pagamento que abre {eu?.nomeCurto ?? 'esta seção'} abre
        também{' '}
        {outros.map((m, i) => (
          <span key={m.id}>
            <strong className={`font-semibold ${t.texto}`}>{m.nomeCurto}</strong>
            {i < outros.length - 2 ? ', ' : i === outros.length - 2 ? ' e ' : ''}
          </span>
        ))}
        . Todos os manuais numa conta só — e quem já assina o Manual Clínico ou tem {PLUS_LABEL} já tem tudo isto sem
        pagar de novo.
      </p>
      <ul className="mt-3.5 flex flex-wrap gap-1.5">
        {outros.map((m) => {
          const Icone = ICONES[m.icone]
          return (
            <li
              key={m.id}
              className={`inline-flex items-center gap-1.5 rounded-full border ${t.borda} ${t.cartao} px-2.5 py-1 text-[11.5px] font-semibold ${t.texto}`}
            >
              <Icone className={`h-3.5 w-3.5 ${t.ambarTexto}`} />
              {m.nomeCurto}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ══════════════════════════════ GRADE ══════════════════════════════ */

/**
 * O que existe dentro de cada um deles.
 *
 * É a peça que constrói valor, e por isso vem inteira antes do preço. Cada
 * cartão traz números reais do acervo — não adjetivos — porque a pessoa que
 * está decidindo quer saber o tamanho do que recebe, e "conteúdo completo e
 * atualizado" não tem tamanho.
 *
 * O módulo da seção em que a pessoa está vem primeiro e marcado: é o que ela
 * reconhece, e serve de âncora para ler os outros seis como acréscimo.
 */
export function GradeDoPacote({
  atual,
  tom = 'tema',
  titulo = 'Um pagamento abre todos',
  className = '',
}: {
  atual?: IdDoModulo | null
  tom?: Tom
  titulo?: string
  className?: string
}) {
  const t = T[tom]
  const modulos = modulosOrdenados(atual)

  return (
    <section className={className}>
      <p className={`editorial-mark mb-2 ${tom === 'escuro' ? 'text-white/50' : ''}`}>O que entra na compra</p>
      <h2 className={`font-heading text-xl font-semibold tracking-tight sm:text-2xl ${t.texto}`}>{titulo}</h2>
      <p className={`mt-1.5 max-w-2xl text-sm leading-relaxed ${t.fraco}`}>
        Nenhum deles é vendido à parte, e nenhum é uma versão reduzida do outro. São manuais completos,
        liberados juntos no mesmo instante em que o pagamento é aprovado.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modulos.map((m) => {
          const Icone = ICONES[m.icone]
          const eOAtual = m.id === atual
          return (
            <article
              key={m.id}
              className={`relative flex flex-col overflow-hidden rounded-2xl border p-4 transition-colors ${
                eOAtual ? `${t.destaqueBorda} ${t.destaqueFundo}` : `${t.cartao} hover:border-primary/30`
              }`}
            >
              {eOAtual && (
                <span
                  className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border ${t.destaqueBorda} px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider ${t.destaqueTexto}`}
                >
                  Você está aqui
                </span>
              )}
              <span className={`mb-2.5 inline-flex w-fit rounded-lg p-2 ${eOAtual ? t.destaqueTexto : t.ambarTexto} ${t.cartaoSuave} border`}>
                <Icone className="h-4 w-4" />
              </span>
              <h3 className={`font-heading text-[15px] font-semibold leading-snug tracking-tight ${t.texto}`}>
                {m.nome}
              </h3>
              <p className={`mt-1.5 text-[12.5px] leading-relaxed ${t.fraco}`}>{m.chamada}</p>
              <p className={`mt-2 text-[12px] font-medium leading-relaxed ${t.destaqueTexto}`}>{m.destaque}</p>
              <dl className={`mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t ${t.borda} pt-3`}>
                {m.numeros.map((n) => (
                  <div key={n.r}>
                    <dt className={`font-heading text-base font-semibold leading-none tabular-nums ${t.texto}`}>
                      {n.v}
                    </dt>
                    <dd className={`mt-0.5 text-[10.5px] leading-tight ${t.apagado}`}>{n.r}</dd>
                  </div>
                ))}
              </dl>
              <p className={`mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold ${t.destaqueTexto}`}>
                <Check className="h-3.5 w-3.5" /> {eOAtual ? 'É o que você veio buscar' : 'Vem junto, sem custo extra'}
              </p>
            </article>
          )
        })}
      </div>
    </section>
  )
}

/* ══════════════════════ RESUMO EM UMA LINHA ══════════════════════ */

/**
 * A versão curta da grade, para onde não cabe a grade inteira.
 *
 * Usada no checkout e nas colunas estreitas: sete linhas com o nome e o número
 * mais forte de cada manual. Faz o mesmo trabalho — mostrar que a compra é
 * conjunta e tem tamanho — ocupando um quinto do espaço.
 */
export function ListaDoPacote({
  atual,
  tom = 'tema',
  className = '',
}: {
  atual?: IdDoModulo | null
  tom?: Tom
  className?: string
}) {
  const t = T[tom]
  const modulos = modulosOrdenados(atual)

  return (
    <ul className={`divide-y overflow-hidden rounded-2xl border ${t.divisor} ${t.borda} ${t.cartao} ${className}`}>
      {modulos.map((m) => {
        const Icone = ICONES[m.icone]
        return (
          <li key={m.id} className="flex items-start gap-3 px-4 py-3">
            <span className={`mt-0.5 shrink-0 ${t.ambarTexto}`}>
              <Icone className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-[13.5px] font-bold leading-snug ${t.texto}`}>{m.nome}</p>
              <p className={`mt-0.5 text-[11.5px] leading-snug ${t.fraco}`}>
                {m.numeros.map((n) => `${n.v} ${n.r}`).join(' · ')}
              </p>
            </div>
            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${t.destaqueTexto}`} aria-label="Incluso" />
          </li>
        )
      })}
    </ul>
  )
}

/* ══════════════════════════════ OFERTA ══════════════════════════════ */

export interface OfertaProps {
  onCheckout: () => void
  isAuthenticated: boolean
  /** Preço cheio do plano mais barato habilitado. */
  precoBase: number
  /** Preço já com o desconto do lote aplicado (igual ao base quando não há lote). */
  precoFinal: number
  /** Há lote ativo descontando o preço? */
  temLote?: boolean
  /** Percentual do lote, para o selo de desconto. */
  pctLote?: number
  /** Rótulo do lote ("Lote 2", "Turma de abril"). */
  rotuloLote?: string | null
  /** Rótulo do plano cujo preço está sendo mostrado ("Semestral"). */
  rotuloPlano?: string | null
  /** Duração do plano em meses — vira o custo por dia. Vazio = vitalício. */
  mesesDoPlano?: number | null
  /** Falso quando a venda está pausada: mostra explicação em vez de preço. */
  mostrarPreco: boolean
  tom?: Tom
  className?: string
  /** Bloco extra abaixo do botão (contagem regressiva do lote, selos, etc.). */
  children?: React.ReactNode
}

/**
 * O bloco de preço — e ele só aparece depois do valor.
 *
 * A sequência interna repete, em miniatura, a sequência da página: primeiro o
 * que se recebe (todos os manuais, somados), depois quanto custa, e por último a
 * conta que encolhe o número — o total dividido por sete, e o custo por dia
 * quando o plano tem prazo. Dividir é honesto e desarma a objeção sem precisar
 * de mais desconto: o que se compara com o preço de um manual avulso não é o
 * total, é o total sobre sete.
 */
export function OfertaDoPacote({
  onCheckout,
  isAuthenticated,
  precoBase,
  precoFinal,
  temLote = false,
  pctLote = 0,
  rotuloLote = null,
  rotuloPlano = null,
  mesesDoPlano = null,
  mostrarPreco,
  tom = 'tema',
  className = '',
  children,
}: OfertaProps) {
  const t = T[tom]
  const porManual = precoPorModulo(precoFinal)
  const porDia = precoPorDia(precoFinal, mesesDoPlano)

  const garantias = [
    'Acesso liberado na hora em que o pagamento é aprovado',
    `Os ${TOTAL_DE_MODULOS} manuais juntos — não há venda avulsa de nenhum`,
    'Conteúdo novo entra no mesmo acesso, sem cobrança extra',
    ...(isAuthenticated ? [] : ['Sem conta? A Serial Key vai por e-mail e você ativa quando quiser']),
  ]

  return (
    <section className={`overflow-hidden rounded-2xl border ${t.ambarBorda} ${t.ambarFundo} p-5 sm:p-7 ${className}`}>
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        {/* ── O que se recebe ── */}
        <div>
          <p className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-wider ${t.ambarTexto}`}>
            <Layers className="h-3.5 w-3.5" /> A oferta inteira
          </p>
          <h2 className={`mt-2 font-heading text-xl font-semibold leading-snug tracking-tight sm:text-2xl ${t.texto}`}>
            Você não escolhe um manual. Você leva os {TOTAL_DE_MODULOS}.
          </h2>
          <p className={`mt-2 text-sm leading-relaxed ${t.fraco}`}>
            Patologias, farmacologia, eletrocardiograma, radiologia, histologia, anatomia e as calculadoras
            clínicas. Tudo na mesma conta, aberto no mesmo segundo.
          </p>
          <ul className="mt-4 space-y-1.5">
            {garantias.map((g) => (
              <li key={g} className={`flex items-start gap-2 text-[12.5px] ${t.fraco}`}>
                <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${t.destaqueTexto}`} />
                {g}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Quanto custa ── */}
        <div className={`rounded-2xl border ${t.borda} ${t.cartao} p-5`}>
          {mostrarPreco ? (
            <>
              <p className={`text-xs font-semibold uppercase tracking-wider ${t.apagado}`}>
                Os {TOTAL_DE_MODULOS} manuais por
                {rotuloPlano ? ` · plano ${rotuloPlano}` : ''}
              </p>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {temLote && <span className={`text-base line-through ${t.riscado}`}>{reais(precoBase)}</span>}
                <span className={`font-heading text-3xl font-black tracking-tight sm:text-4xl ${t.precoTexto}`}>
                  {reais(precoFinal)}
                </span>
                {temLote && pctLote > 0 && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${t.destaqueFundo} ${t.destaqueTexto}`}
                  >
                    <Flame className="h-3 w-3" /> −{Math.round(pctLote)}%
                  </span>
                )}
              </div>

              {porManual != null && (
                <p className={`mt-2 text-[13px] font-bold leading-snug ${t.destaqueTexto}`}>
                  Dá {reais(porManual)} por manual
                  {porDia != null ? ` — cerca de ${reais(porDia)} por dia.` : '.'}
                </p>
              )}

              {temLote && rotuloLote && (
                <p className={`mt-1.5 text-xs ${t.destaqueTexto}`}>
                  Lote {rotuloLote} — você economiza {reais(precoBase - precoFinal)}.
                </p>
              )}
            </>
          ) : (
            <p className={`text-sm ${t.fraco}`}>
              Acesso liberado para assinantes do Manual Clínico e contas {PLUS_LABEL}.
            </p>
          )}

          {children}

          <button
            onClick={onCheckout}
            className={`mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md px-6 text-sm font-bold shadow-sm transition active:scale-[0.98] ${t.botao}`}
          >
            <Crown className="h-4 w-4" />
            {mostrarPreco
              ? `Quero os ${TOTAL_DE_MODULOS} manuais`
              : isAuthenticated
                ? 'Desbloquear o Manual Clínico'
                : 'Comprar e desbloquear'}
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className={`mt-3 flex items-center gap-1.5 border-t ${t.borda} pt-3 text-[11px] ${t.apagado}`}>
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Pix, cartão ou boleto · pagamento processado com
            segurança.
          </p>
        </div>
      </div>

      <p className={`mt-5 border-t ${t.borda} pt-4 text-[12px] leading-relaxed ${t.apagado}`}>
        Já assina o Manual Clínico ou tem {PLUS_LABEL}? Então isto já é seu — entre na sua conta que as{' '}
        {TOTAL_DE_MODULOS} seções abrem inteiras, sem pagar de novo.
      </p>
    </section>
  )
}

/* ══════════════════════════ BARRA FIXA ══════════════════════════ */

/**
 * A barra do celular. Sem ela o preço e o botão somem no primeiro scroll.
 *
 * O rótulo diz "N manuais" em vez do nome da seção porque é aqui que a pessoa
 * decide, e o que a faz decidir é o tamanho do que leva — não o nome da página
 * em que está.
 */
export function BarraDoPacote({
  onCheckout,
  precoBase,
  precoFinal,
  temLote = false,
  pctLote = 0,
  mostrarPreco,
  tom = 'tema',
}: {
  onCheckout: () => void
  precoBase: number
  precoFinal: number
  temLote?: boolean
  pctLote?: number
  mostrarPreco: boolean
  tom?: Tom
}) {
  const t = T[tom]
  const porManual = precoPorModulo(precoFinal)

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t ${t.borda} px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden ${
        tom === 'escuro' ? 'bg-[#04130b]/95' : 'bg-background/95'
      }`}
    >
      <div className="flex items-center gap-3">
        {mostrarPreco && (
          <div className="min-w-0">
            <p className={`truncate text-[11px] font-bold ${t.destaqueTexto}`}>
              {temLote && pctLote > 0
                ? `−${Math.round(pctLote)}% · ${TOTAL_DE_MODULOS} manuais`
                : porManual != null
                  ? `${TOTAL_DE_MODULOS} manuais · ${reais(porManual)} cada`
                  : `${TOTAL_DE_MODULOS} manuais inclusos`}
            </p>
            <p className="flex items-baseline gap-1.5">
              {temLote && <span className={`text-[11px] line-through ${t.riscado}`}>{reais(precoBase)}</span>}
              <span className={`text-lg font-black leading-tight ${t.precoTexto}`}>{reais(precoFinal)}</span>
            </p>
          </div>
        )}
        <button
          onClick={onCheckout}
          className={`ml-auto inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-md px-4 text-sm font-bold shadow-sm transition active:scale-[0.98] ${t.botao}`}
        >
          <Crown className="h-4 w-4" />
          Quero os {TOTAL_DE_MODULOS}
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════ FAQ ══════════════════════════════ */

const PERGUNTAS_DO_PACOTE = [
  {
    q: `Os ${TOTAL_DE_MODULOS} manuais vêm mesmo na mesma compra?`,
    a: 'Vêm. Não é upsell, não é pacote promocional que expira, não é versão de degustação de cada um. É uma compra só, e ela libera as sete seções completas na mesma hora: Manual Clínico, Farmacologia, Eletrocardiograma, Radiologia, Histologia, Domine Anatomia e Ferramentas Clínicas.',
  },
  {
    q: 'Dá para comprar só um deles, mais barato?',
    a: 'Não existe venda avulsa de nenhuma seção — e é por isso que o preço é o que é. Cobrar por cada manual separadamente tornaria cada um mais caro do que o pacote inteiro custa hoje.',
  },
  {
    q: 'Já assino o Manual Clínico. Preciso pagar de novo por algum?',
    a: `Não, por nenhum. Se você já assina o Manual Clínico ou tem ${PLUS_LABEL}, as sete seções já estão liberadas na sua conta. Basta entrar.`,
  },
  {
    q: 'O que entra depois eu pago à parte?',
    a: 'Não. Lâmina nova, incidência nova, ferramenta nova, fármaco novo: entra no mesmo acesso que você já comprou, sem cobrança adicional.',
  },
  {
    q: 'Preciso criar conta para comprar?',
    a: 'Não. A compra por Serial Key funciona sem conta: a chave vai para o seu e-mail e você ativa quando quiser, no aparelho que quiser.',
  },
]

/** As objeções que aparecem quando a oferta passa a ser conjunta. */
export function PerguntasDoPacote({ tom = 'tema', className = '' }: { tom?: Tom; className?: string }) {
  const t = T[tom]
  const [aberta, setAberta] = useState<number | null>(0)

  return (
    <section className={className}>
      <p className={`editorial-mark mb-2 ${tom === 'escuro' ? 'text-white/50' : ''}`}>Antes de decidir</p>
      <h2 className={`font-heading text-xl font-semibold tracking-tight sm:text-2xl ${t.texto}`}>
        As perguntas que todo mundo faz sobre o pacote
      </h2>
      <div className={`mt-5 divide-y overflow-hidden rounded-xl border ${t.divisor} ${t.borda} ${t.cartao}`}>
        {PERGUNTAS_DO_PACOTE.map((f, i) => {
          const estaAberta = aberta === i
          return (
            <div key={f.q}>
              <button
                type="button"
                onClick={() => setAberta(estaAberta ? null : i)}
                aria-expanded={estaAberta}
                className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors ${
                  tom === 'escuro' ? 'hover:bg-white/[0.04]' : 'hover:bg-muted/40'
                }`}
              >
                <span className={`min-w-0 flex-1 text-[13.5px] font-semibold leading-snug ${t.texto}`}>{f.q}</span>
                <ChevronDown
                  className={`mt-0.5 h-4 w-4 shrink-0 ${t.apagado} transition-transform ${estaAberta ? 'rotate-180' : ''}`}
                />
              </button>
              {estaAberta && <p className={`px-4 pb-4 text-[13px] leading-relaxed ${t.fraco}`}>{f.a}</p>}
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ══════════════════════ AVISO DE JÁ TER ACESSO ══════════════════════ */

/**
 * A objeção mais barata de resolver: "será que eu já tenho isso?".
 *
 * Quem já assina e cai numa seção trancada por engano (sessão expirada, outro
 * navegador) precisa dessa informação antes de considerar comprar de novo.
 */
export function AvisoJaTenho({ tom = 'tema', className = '' }: { tom?: Tom; className?: string }) {
  const t = T[tom]
  return (
    <div className={`rounded-2xl border ${t.destaqueBorda} ${t.destaqueFundo} p-4 sm:p-5 ${className}`}>
      <p className={`flex items-center gap-2 text-sm font-bold ${t.destaqueTexto}`}>
        <Check className="h-4 w-4" /> Já assina o Manual Clínico ou tem {PLUS_LABEL}?
      </p>
      <p className={`mt-1.5 text-sm leading-relaxed ${t.fraco}`}>
        Então os {TOTAL_DE_MODULOS} manuais já são seus — sem custo extra e sem comprar de novo. Basta entrar na sua
        conta que as seções abrem inteiras.
      </p>
    </div>
  )
}

/* ══════════════════════ FECHAMENTO ══════════════════════ */

/**
 * O último empurrão, no fim da página.
 *
 * Repete o tamanho do pacote porque, depois de rolar uma landing inteira sobre
 * uma seção só, é fácil ter esquecido que a compra abre outras seis.
 */
export function FechamentoDoPacote({
  onCheckout,
  precoFinal,
  mostrarPreco,
  tom = 'tema',
  className = '',
}: {
  onCheckout: () => void
  precoFinal: number
  mostrarPreco: boolean
  tom?: Tom
  className?: string
}) {
  const t = T[tom]
  const porManual = precoPorModulo(precoFinal)

  return (
    <section className={`overflow-hidden rounded-2xl border ${t.ambarBorda} ${t.ambarFundo} p-5 sm:p-7 ${className}`}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <p className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-wider ${t.ambarTexto}`}>
            <Zap className="h-3.5 w-3.5" /> Última coisa
          </p>
          <h2 className={`mt-2 font-heading text-xl font-semibold tracking-tight sm:text-2xl ${t.texto}`}>
            {TOTAL_DE_MODULOS} manuais completos, um pagamento, acesso na hora
          </h2>
          <p className={`mt-2 text-sm leading-relaxed ${t.fraco}`}>
            {mostrarPreco && porManual != null
              ? `São ${reais(porManual)} por manual — e nenhum deles é uma amostra: todos abrem inteiros, com o acervo completo, no instante em que o pagamento é aprovado.`
              : 'Todos abrem inteiros, com o acervo completo, no instante em que o pagamento é aprovado.'}
          </p>
        </div>
        <button
          onClick={onCheckout}
          className={`inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-md px-6 text-sm font-bold shadow-sm transition active:scale-[0.98] ${t.botao}`}
        >
          <Crown className="h-4 w-4" />
          {mostrarPreco ? `Levar os ${TOTAL_DE_MODULOS} por ${reais(precoFinal)}` : 'Desbloquear agora'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}
