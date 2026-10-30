'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Flame,
  FlaskConical,
  Microscope,
  PersonStanding,
  Pill,
  ScanLine,
  ShieldCheck,
  Sigma,
  Stethoscope,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { estiloDoChip } from '@/components/sidebar-cores'
import { PORTAS_DO_MANUAL } from '@/components/manual-clinico/casco/modulos'
import '@/components/checkout/checkout-vidro.css'
import '@/components/manual-clinico/casco/manual-vidro.css'
import { PLUS_LABEL } from '@/lib/account-tier'
import { usePublicaAltura } from '@/hooks/use-publica-altura'
import { ProuniCta } from '@/components/prouni/prouni-cta'
import { MANUAL_CLINICO_PRODUCT_ID } from '@/lib/manual-clinico/identidade'
import {
  MODULOS_DO_PACOTE,
  TOTAL_DE_MODULOS,
  apresentarPreco,
  modulosOrdenados,
  outrosModulos,
  precoPorDia,
  precoPorModulo,
  reais,
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
 * Todas as peças são do vidro do Manual (tokens `--ck-*`, ver
 * `components/checkout/checkout-vidro.css`), as mesmas em todas as vitrines.
 * `tom="escuro"` não é outra paleta: só força os tokens escuros, para as
 * vitrines que abrem sobre fundo escuro fixo (Histologia, Anatomia).
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
  Stethoscope,
  Sigma,
}

/** A cor do quadradinho de cada manual — a mesma da barra e do menu lateral. */
function corDoModulo(id: IdDoModulo): string {
  return PORTAS_DO_MANUAL.find((p) => p.id === id)?.cor || 'manualClinico'
}

function ChipDoModulo({ m, className = '' }: { m: ModuloDoPacote; className?: string }) {
  const Icone = ICONES[m.icone]
  return (
    <span className={`sidebar-mini-chip ${className}`} style={estiloDoChip(corDoModulo(m.id))} aria-hidden>
      <Icone />
    </span>
  )
}

/** Raiz de toda peça: dá os tokens do vidro e, no tom escuro, força os escuros. */
function escopo(tom: Tom) {
  return { className: 'ck-escopo', 'data-aparencia': tom === 'escuro' ? 'dark' : undefined } as const
}

const TXT = { color: 'var(--ck-texto)' }
const TXT2 = { color: 'var(--ck-texto-2)' }
const TXT3 = { color: 'var(--ck-texto-3)' }
const VERDE = { color: 'var(--ck-verde)' }

/* ══════════════════════════════ SELO ══════════════════════════════ */

/**
 * O selo de topo — a primeira coisa que a página diz.
 *
 * "N manuais, 1 pagamento" funciona para quem nunca ouviu falar do Manual;
 * "incluso no Manual Clínico" pedia que a pessoa já soubesse o que ele é.
 */
export function SeloDoPacote({ tom = 'tema', className = '' }: { tom?: Tom; className?: string }) {
  const e = escopo(tom)
  return (
    <span {...e} className={`${e.className} ck-chip ${className}`} data-tom="ambar" style={{ height: 28, fontSize: 12.5 }}>
      {TOTAL_DE_MODULOS} manuais · 1 pagamento
    </span>
  )
}

/* ══════════════════════════════ FAIXA ══════════════════════════════ */

/**
 * A correção de expectativa, logo abaixo do herói — numa linha.
 *
 * Quem chega numa vitrine acha que está diante de um produto avulso. Antes isto
 * era um bloco amarelo de cinco linhas ("Leia antes de comparar preço…") em
 * todas as vitrines: o argumento certo no volume errado, que empurrava a
 * própria seção para baixo da dobra. Agora é uma faixa: os nove quadradinhos
 * coloridos (o olho conta antes de ler) e uma frase. Sem preço aqui de
 * propósito: a faixa aumenta o que está sendo pesado, não pesa.
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
  const e = escopo(tom)
  const eu = MODULOS_DO_PACOTE.find((m) => m.id === atual)
  const outros = outrosModulos(atual)

  return (
    <div {...e} className={`${e.className} flex justify-center ${className}`}>
      <p className="mc-incluso" title={`Abre também: ${outros.map((m) => m.nomeCurto).join(', ')}`}>
        <span className="mc-incluso-chips">
          {modulosOrdenados(atual).map((m) => (
            <ChipDoModulo key={m.id} m={m} />
          ))}
        </span>
        <span>
          <strong>{eu?.nomeCurto ?? 'Este manual'}</strong> é 1 dos {TOTAL_DE_MODULOS} manuais do mesmo acesso
          <span className="hidden sm:inline"> — não há venda avulsa</span>.
        </span>
        <Link href="/manual-clinico#portas" className="ck-link inline-flex items-center gap-0.5">
          Ver todos <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </p>
    </div>
  )
}

/* ══════════════════════════════ GRADE ══════════════════════════════ */

/**
 * O que existe dentro de cada um deles — a peça que constrói valor, inteira
 * antes do preço. Números reais do acervo, não adjetivos. O módulo da seção em
 * que a pessoa está vem primeiro e marcado: é a âncora para ler os outros
 * como acréscimo. Cada cartão leva ao próprio manual — explorar também vende.
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
  const e = escopo(tom)
  const modulos = modulosOrdenados(atual)

  return (
    <section {...e} id="pacote" className={`${e.className} scroll-mt-24 ${className}`}>
      <h2 className="mc-secao-titulo" style={TXT}>{titulo}</h2>
      <p className="mc-secao-apoio max-w-2xl" style={TXT2}>
        Nenhum é vendido à parte, nenhum é versão reduzida. Os {TOTAL_DE_MODULOS} abrem juntos, no instante em que
        o pagamento é aprovado.
      </p>

      <div className="mc-portas mt-5">
        {modulos.map((m) => {
          const eOAtual = m.id === atual
          return (
            <Link key={m.id} href={m.href} className="mc-porta" data-atual={eOAtual || undefined}>
              <span className="mc-porta-topo">
                <ChipDoModulo m={m} />
                <span className="min-w-0">
                  <span className="mc-porta-nome block">{m.nomeCurto}</span>
                  <span className="mc-porta-num block">
                    {m.numeros[0].v} {m.numeros[0].r}
                  </span>
                </span>
              </span>
              <span className="mc-porta-texto">{m.destaque}</span>
              <span className="mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t pt-2.5" style={{ borderColor: 'var(--ck-sep)' }}>
                {m.numeros.slice(1).map((n) => (
                  <span key={n.r} className="text-[12px]" style={TXT3}>
                    <b className="font-semibold tabular-nums" style={TXT}>{n.v}</b> {n.r}
                  </span>
                ))}
              </span>
              {eOAtual ? (
                <span className="ck-chip absolute right-3 top-3" style={{ height: 22, fontSize: 11 }}>Você está aqui</span>
              ) : (
                <ArrowRight className="mc-porta-ir h-4 w-4" aria-hidden />
              )}
            </Link>
          )
        })}
      </div>
    </section>
  )
}

/* ══════════════════════ RESUMO EM UMA LINHA ══════════════════════ */

/**
 * A versão curta da grade, para colunas estreitas (checkout): o nome e os
 * números de cada manual, com o quadradinho da cor dele.
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
  const e = escopo(tom)
  const modulos = modulosOrdenados(atual)

  return (
    <ul {...e} className={`${e.className} ck-placa overflow-hidden ${className}`}>
      {modulos.map((m, i) => (
        <li
          key={m.id}
          className="flex items-center gap-3 px-3.5 py-2.5"
          style={i > 0 ? { borderTop: '1px solid var(--ck-sep)' } : undefined}
        >
          <ChipDoModulo m={m} />
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold leading-snug" style={TXT}>{m.nome}</p>
            {/* contain: a linha cortada não empurra a largura mínima das grades em volta. */}
            <p className="mt-0.5 truncate text-[12px] leading-snug [contain:inline-size]" style={TXT3}>
              {m.numeros.map((n) => `${n.v} ${n.r}`).join(' · ')}
            </p>
          </div>
          <Check className="h-4 w-4 shrink-0" style={VERDE} strokeWidth={3} aria-label="Incluso" />
        </li>
      ))}
    </ul>
  )
}

/* ══════════════════════════ CARTÃO LATERAL ══════════════════════════ */

/**
 * O cartão ao lado da prévia, na primeira dobra de cada vitrine.
 *
 * Mostra o que se leva, não quanto custa: quem chegou pela prévia de um módulo
 * ainda não sabe que a mesma compra abre os outros, e um preço lido antes disso
 * vira comparação com o de um atlas avulso. O número vem inteiro mais abaixo,
 * depois do acervo (`OfertaDoPacote`).
 */
export function CartaoDoPacote({
  atual,
  titulo,
  onCheckout,
  isAuthenticated,
  rotulo,
  tom = 'tema',
  className = '',
}: {
  atual: IdDoModulo
  /** "A Semiologia é 1 dos 9 manuais" — dito pelo módulo, com o artigo certo. */
  titulo: React.ReactNode
  onCheckout: () => void
  isAuthenticated: boolean
  /** Texto do botão; o padrão é "Quero os N manuais". */
  rotulo?: React.ReactNode
  tom?: Tom
  className?: string
}) {
  const e = escopo(tom)
  return (
    <div {...e} className={`${e.className} ck-vidro-forte p-5 sm:p-6 ${className}`}>
      <h2 className="font-heading text-lg font-semibold leading-snug tracking-tight" style={TXT}>
        {titulo}
      </h2>
      <p className="mt-1 text-[13px]" style={TXT3}>Todos vêm juntos, no mesmo acesso.</p>
      <ListaDoPacote atual={atual} tom={tom} className="mt-3.5" />
      <button onClick={onCheckout} className="ck-cta mt-4 w-full">
        {rotulo ?? <>Quero os {TOTAL_DE_MODULOS} manuais</>}
        <ArrowRight className="h-4 w-4" />
      </button>
      {!isAuthenticated && (
        <p className="mt-3 text-center text-[12.5px]" style={TXT3}>
          Já tem conta?{' '}
          <Link href="/auth/login" className="ck-link">Entre e veja se já é seu</Link>
        </p>
      )}
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px]" style={TXT3}>
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Pix, cartão ou boleto · pagamento seguro
      </p>
    </div>
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
 * Em miniatura, a sequência da página: o que se recebe (os nove manuais),
 * quanto custa, e a conta que encolhe o número — o total dividido pelos
 * manuais e por dia. Dividir é honesto e desarma a objeção sem mais desconto.
 * A cobrança real vem logo abaixo do número grande, nunca em letra miúda.
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
  const e = escopo(tom)
  const porManual = precoPorModulo(precoFinal)
  const porDia = precoPorDia(precoFinal, mesesDoPlano)
  const preco = apresentarPreco({ precoBase, precoFinal, temLote, mesesDoPlano })

  const garantias = [
    'Acesso liberado na hora em que o pagamento é aprovado',
    `Os ${TOTAL_DE_MODULOS} manuais juntos — não há venda avulsa de nenhum`,
    'Conteúdo novo entra no mesmo acesso, sem cobrança extra',
    ...(isAuthenticated ? [] : ['Sem conta? A Serial Key vai por e-mail e você ativa quando quiser']),
  ]

  return (
    <section {...e} className={`${e.className} ck-vidro-forte p-5 sm:p-7 ${className}`}>
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        {/* ── O que se recebe ── */}
        <div>
          <span className="mc-incluso-chips mb-3 flex">
            {MODULOS_DO_PACOTE.map((m) => (
              <ChipDoModulo key={m.id} m={m} />
            ))}
          </span>
          <h2 className="mc-secao-titulo" style={TXT}>
            Você não escolhe um manual. Leva os {TOTAL_DE_MODULOS}.
          </h2>
          <p className="mt-2 text-sm leading-relaxed" style={TXT2}>
            {NOMES_DO_PACOTE}. Tudo na mesma conta, aberto no mesmo segundo.
          </p>
          <ul className="mt-4 space-y-2">
            {garantias.map((g) => (
              <li key={g} className="flex items-start gap-2 text-[13.5px]" style={TXT2}>
                <Check className="mt-0.5 h-4 w-4 shrink-0" style={VERDE} strokeWidth={3} />
                {g}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Quanto custa ── */}
        <div className="ck-placa p-5">
          {mostrarPreco ? (
            <>
              <p className="text-[13px] font-semibold" style={TXT3}>
                Os {TOTAL_DE_MODULOS} manuais{rotuloPlano ? ` · plano ${rotuloPlano}` : ''}
              </p>
              {/* O número grande é o MENSAL quando o plano tem prazo; a cobrança
                  de verdade vem logo abaixo, legível. Ver `apresentarPreco`. */}
              <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {preco.destaqueRiscado && <span className="ck-riscado">{preco.destaqueRiscado}</span>}
                <span className="ck-total">
                  {preco.destaque}
                  {preco.sufixo && <span className="text-lg font-semibold sm:text-xl">{preco.sufixo}</span>}
                </span>
                {temLote && pctLote > 0 && (
                  <span className="ck-chip" style={{ height: 24 }}>
                    <Flame className="h-3 w-3" /> −{Math.round(pctLote)}%
                  </span>
                )}
              </div>

              <p className="mt-2 text-[13.5px] font-semibold leading-snug" style={TXT2}>{preco.cobranca}</p>

              {porManual != null && (
                <p className="mt-2 text-[13.5px] font-semibold leading-snug" style={VERDE}>
                  Dá {reais(porManual)} por manual{porDia != null ? ` — cerca de ${reais(porDia)} por dia.` : '.'}
                </p>
              )}

              {temLote && rotuloLote && (
                <p className="mt-1.5 text-xs" style={VERDE}>
                  Lote {rotuloLote} — você economiza {reais(precoBase - precoFinal)}.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm" style={TXT2}>
              Acesso liberado para assinantes do Manual Clínico e contas {PLUS_LABEL}.
            </p>
          )}

          {children}

          <button onClick={onCheckout} className="ck-cta ck-cta-largo mt-4">
            {mostrarPreco
              ? `Quero os ${TOTAL_DE_MODULOS} manuais`
              : isAuthenticated
                ? 'Desbloquear o Manual Clínico'
                : 'Comprar e desbloquear'}
            <ArrowRight className="h-4 w-4" />
          </button>

          {/* Desconto PROUNI/FIES do Manual Clínico, quando existe — dito uma
              vez aqui, vale em todas as vitrines. Some sozinho sem benefício. */}
          <ProuniCta
            itemType="manual_clinico"
            itemId={MANUAL_CLINICO_PRODUCT_ID}
            className="mt-4"
            aparencia={tom === 'escuro' ? 'dark' : 'app'}
          />

          <p className="mt-3 flex items-center gap-1.5 text-[12px]" style={TXT3}>
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" style={VERDE} /> Pix, cartão ou boleto · pagamento seguro
          </p>
        </div>
      </div>

      <p className="mt-5 border-t pt-4 text-[12.5px] leading-relaxed" style={{ ...TXT3, borderColor: 'var(--ck-sep)' }}>
        Já assina o Manual Clínico ou tem {PLUS_LABEL}? Então isto já é seu — entre na sua conta que os{' '}
        {TOTAL_DE_MODULOS} manuais abrem inteiros, sem pagar de novo.
      </p>
    </section>
  )
}

/* ══════════════════════════ BARRA FIXA ══════════════════════════ */

/**
 * A barra do celular. Sem ela o preço e o botão somem no primeiro scroll. O
 * rótulo diz "N manuais" porque é o tamanho do que leva que faz decidir.
 */
export function BarraDoPacote({
  onCheckout,
  precoBase,
  precoFinal,
  temLote = false,
  pctLote = 0,
  mesesDoPlano = null,
  mostrarPreco,
  tom = 'tema',
}: {
  onCheckout: () => void
  precoBase: number
  precoFinal: number
  temLote?: boolean
  pctLote?: number
  /** Prazo do plano, para a barra dizer o mesmo que o cartão de preço. */
  mesesDoPlano?: number | null
  mostrarPreco: boolean
  tom?: Tom
}) {
  const e = escopo(tom)
  const porManual = precoPorModulo(precoFinal)
  const preco = apresentarPreco({ precoBase, precoFinal, temLote, mesesDoPlano })
  /*
   * A barra publica a própria altura: o "voltar" flutuante do iOS soma
   * `--gx-barra-inferior-h` ao próprio `bottom` para não pousar em cima do
   * PREÇO. Ver hooks/use-publica-altura.ts.
   */
  const ref = usePublicaAltura<HTMLDivElement>('--gx-barra-inferior-h', true)

  return (
    <div
      ref={ref}
      {...e}
      className={`${e.className} ck-vidro-forte fixed inset-x-2 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-40 px-3 py-2.5 lg:hidden`}
      style={{ borderRadius: 22 }}
    >
      <div className="flex items-center gap-3">
        {mostrarPreco && (
          <div className="min-w-0 pl-1">
            {/* Com mensal em destaque, esta linha vira a cobrança real. */}
            <p className="truncate text-[11.5px] font-semibold" style={preco.sufixo ? TXT3 : VERDE}>
              {preco.sufixo
                ? preco.cobranca
                : temLote && pctLote > 0
                  ? `−${Math.round(pctLote)}% · ${TOTAL_DE_MODULOS} manuais`
                  : porManual != null
                    ? `${TOTAL_DE_MODULOS} manuais · ${reais(porManual)} cada`
                    : `${TOTAL_DE_MODULOS} manuais inclusos`}
            </p>
            {/* Mesmo número do cartão lá em cima: o mensal quando há prazo. */}
            <p className="flex items-baseline gap-1.5">
              {preco.destaqueRiscado && <span className="ck-riscado text-[11px]">{preco.destaqueRiscado}</span>}
              <span className="font-heading text-xl font-semibold leading-tight tabular-nums" style={TXT}>
                {preco.destaque}
                {preco.sufixo && <span className="text-xs font-semibold">{preco.sufixo}</span>}
              </span>
            </p>
          </div>
        )}
        <button onClick={onCheckout} className="ck-cta ml-auto shrink-0" style={{ height: 46, padding: '0 18px', fontSize: 14.5 }}>
          Quero os {TOTAL_DE_MODULOS}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════ FAQ ══════════════════════════════ */

/**
 * Os nomes do pacote escritos por extenso, na ordem canônica.
 *
 * Montado da lista e não digitado: o texto dizia "as sete seções" e nomeava
 * sete manuais muito depois de o pacote ter nove — na mesma tela em que o selo
 * do topo anunciava "9 manuais". Acrescentar um módulo é editar um array, e
 * esta frase acompanha sozinha.
 */
const NOMES_DO_PACOTE = MODULOS_DO_PACOTE.map((m) => m.nomeCurto)
  .join(', ')
  .replace(/, ([^,]*)$/, ' e $1')

const PERGUNTAS_DO_PACOTE = [
  {
    q: `Os ${TOTAL_DE_MODULOS} manuais vêm mesmo na mesma compra?`,
    a: `Vêm. Não é upsell, não é pacote promocional que expira, não é versão de degustação de cada um. É uma compra só, e ela libera as ${TOTAL_DE_MODULOS} seções completas na mesma hora: ${NOMES_DO_PACOTE}.`,
  },
  {
    q: 'Dá para comprar só um deles, mais barato?',
    a: 'Não existe venda avulsa de nenhuma seção — e é por isso que o preço é o que é. Cobrar por cada manual separadamente tornaria cada um mais caro do que o pacote inteiro custa hoje.',
  },
  {
    q: 'Já assino o Manual Clínico. Preciso pagar de novo por algum?',
    a: `Não, por nenhum. Se você já assina o Manual Clínico ou tem ${PLUS_LABEL}, as ${TOTAL_DE_MODULOS} seções já estão liberadas na sua conta. Basta entrar.`,
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
  const e = escopo(tom)
  const [aberta, setAberta] = useState<number | null>(0)

  return (
    <section {...e} className={`${e.className} ${className}`}>
      <h2 className="mc-secao-titulo" style={TXT}>Antes de decidir</h2>
      <p className="mc-secao-apoio" style={TXT2}>As perguntas que todo mundo faz sobre o pacote.</p>
      <div className="ck-vidro mt-5 overflow-hidden">
        {PERGUNTAS_DO_PACOTE.map((f, i) => {
          const estaAberta = aberta === i
          return (
            <div key={f.q} style={i > 0 ? { borderTop: '1px solid var(--ck-sep)' } : undefined}>
              <button
                type="button"
                onClick={() => setAberta(estaAberta ? null : i)}
                aria-expanded={estaAberta}
                className="flex w-full items-start gap-3 px-5 py-4 text-left"
              >
                <span className="min-w-0 flex-1 text-[15px] font-semibold leading-snug" style={TXT}>{f.q}</span>
                <ChevronDown
                  className={`mt-0.5 h-4 w-4 shrink-0 transition-transform duration-300 ${estaAberta ? 'rotate-180' : ''}`}
                  style={TXT3}
                />
              </button>
              {estaAberta && (
                <p className="ck-surge px-5 pb-4 text-[14px] leading-relaxed" style={TXT2}>{f.a}</p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ══════════════════════ AVISO DE JÁ TER ACESSO ══════════════════════ */

/**
 * A objeção mais barata de resolver: "será que eu já tenho isso?" — uma linha.
 */
export function AvisoJaTenho({ tom = 'tema', className = '' }: { tom?: Tom; className?: string }) {
  const e = escopo(tom)
  return (
    <div {...e} className={`${e.className} ck-nota ${className}`}>
      <Check className="h-4 w-4" style={VERDE} strokeWidth={3} />
      <span>
        <strong>Já assina o Manual Clínico ou tem {PLUS_LABEL}?</strong> Então os {TOTAL_DE_MODULOS} manuais já são
        seus — é só entrar na conta.
      </span>
    </div>
  )
}

/* ══════════════════════ FECHAMENTO ══════════════════════ */

/**
 * O último empurrão, no fim da página: depois de rolar uma landing inteira
 * sobre uma seção só, é fácil ter esquecido que a compra abre as outras.
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
  const e = escopo(tom)
  const porManual = precoPorModulo(precoFinal)

  return (
    <section {...e} className={`${e.className} ck-vidro-forte flex flex-col items-center gap-4 p-6 text-center sm:p-10 ${className}`}>
      <span className="mc-incluso-chips flex">
        {MODULOS_DO_PACOTE.map((m) => (
          <ChipDoModulo key={m.id} m={m} />
        ))}
      </span>
      <h2 className="mc-secao-titulo max-w-xl" style={TXT}>
        {TOTAL_DE_MODULOS} manuais completos, um pagamento, acesso na hora
      </h2>
      <p className="max-w-lg text-[15px] leading-relaxed" style={TXT2}>
        {mostrarPreco && porManual != null
          ? `São ${reais(porManual)} por manual — e nenhum é amostra: todos abrem inteiros no instante em que o pagamento é aprovado.`
          : 'Todos abrem inteiros, com o acervo completo, no instante em que o pagamento é aprovado.'}
      </p>
      <button onClick={onCheckout} className="ck-cta">
        {mostrarPreco ? `Levar os ${TOTAL_DE_MODULOS} por ${reais(precoFinal)}` : 'Desbloquear agora'}
        <ArrowRight className="h-4 w-4" />
      </button>
    </section>
  )
}
