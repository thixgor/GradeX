'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, ChevronDown, Crown, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  argumentoDaOferta,
  decidirModo,
  destinoDaOferta,
  type ContextoDaOferta,
  type ItemDaOferta,
  type PerfilDoComprador,
} from '@/lib/plus-oferta'

/**
 * A chamada do Plus+ nos checkouts de compra avulsa (e o upgrade do Quest+).
 *
 * Quem decide se aparece é `decidirModo()` em `lib/plus-oferta.ts`, com os
 * dados de `/api/plus/oferta`: Plus+ não vê nada, Quest+ vê upgrade, o resto
 * vê a oferta — e só quando o plano cobre o que está sendo comprado.
 *
 * Falha em silêncio de propósito, como o `CouponPromo`: enquanto carrega, ou
 * se a busca cair, não desenha nada e o checkout segue igual. Também não
 * desloca a tela depois de montada além do próprio cartão: ele entra acima do
 * grid, onde a pessoa ainda está lendo.
 */

export type AparenciaPlusUpsell = 'app' | 'dark'

interface OfertaPayload {
  tipo: string
  nome: string
  periodo: string
  preco: number
  precoOriginal: number | null
  durationMonths: number | null
  inclusos: ItemDaOferta[]
}

interface RespostaDaOferta {
  perfil: PerfilDoComprador
  logado: boolean
  renovacaoAutomatica?: boolean
  cargoDoPlanoAtual?: string | null
  oferta: OfertaPayload | null
}

interface Props {
  contexto: ContextoDaOferta
  /** Quanto a pessoa vai pagar nesta compra — a base da comparação. */
  valorAtual: number
  /** Itens no carrinho, para a frase "os N itens do seu carrinho". */
  quantidadeDeItens?: number
  /** Tipo do plano sendo comprado, quando o checkout é de plano. */
  planoAtual?: string | null
  aparencia?: AparenciaPlusUpsell
  /** Rótulo da origem no analytics (qual checkout converteu). */
  origem: string
  className?: string
}

interface Pele {
  cartao: string
  selo: string
  titulo: string
  texto: string
  destaque: string
  riscado: string
  preco: string
  miudo: string
  check: string
  item: string
  botao: string
  link: string
  aviso: string
}

const PELES: Record<AparenciaPlusUpsell, Pele> = {
  app: {
    cartao:
      'border-amber-500/35 bg-gradient-to-br from-amber-500/[0.12] via-card to-primary/[0.08] dark:border-amber-300/30',
    selo: 'bg-amber-400 text-amber-950',
    titulo: 'text-foreground',
    texto: 'text-muted-foreground',
    destaque: 'text-amber-700 dark:text-amber-300',
    riscado: 'text-muted-foreground',
    preco: 'text-foreground',
    miudo: 'text-muted-foreground',
    check: 'bg-primary/15 text-primary',
    item: 'text-foreground/90',
    botao: 'bg-amber-400 text-amber-950 hover:bg-amber-300 focus-visible:ring-amber-500',
    link: 'text-muted-foreground hover:text-foreground',
    aviso: 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100',
  },
  dark: {
    cartao: 'border-amber-300/30 bg-gradient-to-br from-amber-300/[0.14] via-white/[0.05] to-emerald-300/[0.08]',
    selo: 'bg-amber-300 text-amber-950',
    titulo: 'text-white',
    texto: 'text-white/65',
    destaque: 'text-amber-200',
    riscado: 'text-white/40',
    preco: 'text-white',
    miudo: 'text-white/50',
    check: 'bg-emerald-300/15 text-emerald-300',
    item: 'text-white/85',
    botao: 'bg-amber-300 text-amber-950 hover:bg-amber-200 focus-visible:ring-amber-300',
    link: 'text-white/50 hover:text-white',
    aviso: 'border-amber-300/30 bg-amber-300/10 text-amber-100',
  },
}

function formatBRL(valor: number): string {
  return `R$ ${Number(valor || 0).toFixed(2).replace('.', ',')}`
}

/** "este material", "estes 3 itens"… — o sujeito da frase de cobertura. */
function oQueEstaSendoComprado(contexto: ContextoDaOferta, quantidade: number): string {
  switch (contexto) {
    case 'material':
      return 'Este material'
    case 'flashcard':
      return 'Este deck de flashcards'
    case 'pacote':
      return 'Este pacote'
    case 'carrinho':
      return quantidade > 1 ? `Os ${quantidade} itens do seu carrinho` : 'O item do seu carrinho'
    case 'manual_clinico':
      return 'O Manual Clínico'
    case 'plano':
      return 'O Banco de Questões'
  }
}

function jaVem(contexto: ContextoDaOferta, quantidade: number): string {
  return contexto === 'carrinho' && quantidade > 1 ? 'já vêm inclusos' : 'já vem incluso'
}

export function PlusUpsell({
  contexto,
  valorAtual,
  quantidadeDeItens = 1,
  planoAtual,
  aparencia = 'app',
  origem,
  className,
}: Props) {
  const [dados, setDados] = useState<RespostaDaOferta | null>(null)
  const [aberto, setAberto] = useState(true)
  const [verTudo, setVerTudo] = useState(false)

  useEffect(() => {
    let ativo = true
    const qs = planoAtual ? `?plano=${encodeURIComponent(planoAtual)}` : ''
    fetch(`/api/plus/oferta${qs}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (ativo) setDados(data)
      })
      .catch(() => {
        if (ativo) setDados(null)
      })
    return () => {
      ativo = false
    }
  }, [planoAtual])

  const oferta = dados?.oferta || null
  const modo = dados
    ? decidirModo({
        perfil: dados.perfil,
        contexto,
        cargoDoPlanoAtual: dados.cargoDoPlanoAtual,
        temPlano: !!oferta,
        inclusos: oferta?.inclusos || [],
      })
    : 'nenhuma'

  if (!dados || !oferta || modo === 'nenhuma') return null

  const pele = PELES[aparencia]
  const upgrade = modo === 'upgrade'
  const arg = argumentoDaOferta({
    valorAtual,
    precoPlus: oferta.preco,
    meses: oferta.durationMonths,
  })
  const destino = destinoDaOferta(oferta.tipo, dados.logado)
  const principais = oferta.inclusos.filter((i) => !i.extra)
  const extras = oferta.inclusos.filter((i) => i.extra)
  // Quatro de cara: no celular o cartão fica acima do formulário, e a lista
  // inteira empurrava o pagamento para longe.
  const visiveis = verTudo ? principais : principais.slice(0, 4)
  const escondidos = principais.length - visiveis.length
  const nomeDoPlano = `Plus+${oferta.periodo ? ` ${oferta.periodo.replace(/^plano\s+/i, '')}` : ''}`

  const registrarClique = () => {
    fetch('/api/analytics/checkout-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'buy_click',
        productId: oferta.tipo,
        productTitle: oferta.nome,
        productType: 'subscription',
        amount: oferta.preco,
        source: `Upsell Plus+ · ${origem}`,
        metadata: { contexto, modo, valorAtual, argumento: arg.tipo },
      }),
      keepalive: true,
    }).catch(() => {})
  }

  // ── Recolhido: uma linha que não some, para quem disse "agora não". ──
  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={cn(
          'flex w-full items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left text-xs font-semibold transition',
          pele.cartao,
          className,
        )}
      >
        <Crown className={cn('h-4 w-4 flex-none', pele.destaque)} aria-hidden />
        <span className={cn('min-w-0 flex-1', pele.texto)}>
          {upgrade ? 'Upgrade para o Plus+' : `${nomeDoPlano}: a plataforma inteira`} por{' '}
          <strong className={pele.titulo}>{formatBRL(oferta.preco)}</strong>
        </span>
        <span className={cn('flex-none underline-offset-4 hover:underline', pele.destaque)}>Ver oferta</span>
      </button>
    )
  }

  // ── A manchete: o argumento que mais pesa para ESTA compra. ──
  let manchete: React.ReactNode
  if (upgrade && contexto === 'plano') {
    const momento = dados.perfil === 'quest' ? 'Antes de renovar o Quest+' : 'Antes de fechar o Quest+'
    manchete = arg.diferenca > 0
      ? <>{momento}: por <span className={pele.destaque}>{formatBRL(arg.diferenca)} a mais</span>, leve a plataforma inteira</>
      : <>{momento}: pelo mesmo valor, <span className={pele.destaque}>leve a plataforma inteira</span></>
  } else if (upgrade) {
    manchete = <>Você já tem o Quest+. Faça o upgrade e <span className={pele.destaque}>desbloqueie todo o resto</span></>
  } else if (arg.tipo === 'mais-barato') {
    manchete = arg.economia > 0
      ? <>Espera! O Plus+ sai <span className={pele.destaque}>{formatBRL(arg.economia)} mais barato</span> que esta compra — e libera tudo</>
      : <>Espera! Pelo mesmo valor, o Plus+ <span className={pele.destaque}>libera a plataforma inteira</span></>
  } else if (arg.tipo === 'quase-o-mesmo') {
    manchete = <>Por só <span className={pele.destaque}>{formatBRL(arg.diferenca)} a mais</span>, leve a plataforma inteira</>
  } else {
    manchete = arg.porMes
      ? <>Você sabia? Por <span className={pele.destaque}>{formatBRL(arg.porMes)}/mês</span> você leva TUDO da plataforma</>
      : <>Você sabia? O Plus+ <span className={pele.destaque}>libera TUDO da plataforma</span> num pagamento só</>
  }

  // O Banco só é citado quando o plano de fato o libera (permissões modulares).
  const temBanco = oferta.inclusos.some((i) => i.chave === 'bancoQuestoes')
  const sujeito = `${oQueEstaSendoComprado(contexto, quantidadeDeItens)} ${jaVem(contexto, quantidadeDeItens)} no ${nomeDoPlano}`
  const cobertura = upgrade && contexto === 'plano'
    ? temBanco
      ? 'O Plus+ já traz o Banco de Questões do Quest+ — e soma a plataforma inteira:'
      : 'Com o Plus+ você leva a plataforma inteira:'
    : upgrade
      ? temBanco
        ? `${sujeito}, que mantém o Banco de Questões que você já usa e soma todo o resto:`
        : `${sujeito}, junto com todo o resto:`
      : `${sujeito} — junto com:`

  return (
    <section
      aria-label={upgrade ? 'Upgrade para o Plus+' : 'Conheça o Plus+'}
      className={cn('relative overflow-hidden rounded-2xl border p-4 shadow-sm sm:p-5', pele.cartao, className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide shadow-sm',
            pele.selo,
          )}
        >
          <Crown className="h-3 w-3" aria-hidden />
          {upgrade ? 'Upgrade Quest+ → Plus+' : `DomineAqui ${nomeDoPlano}`}
        </span>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className={cn('text-[11px] font-semibold transition', pele.link)}
        >
          Agora não
        </button>
      </div>

      <h2 className={cn('mt-3 font-heading text-lg font-semibold leading-snug tracking-tight sm:text-xl', pele.titulo)}>
        {manchete}
      </h2>
      <p className={cn('mt-1.5 text-xs leading-relaxed sm:text-[13px]', pele.texto)}>{cobertura}</p>

      <ul className="mt-3 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {visiveis.map((item) => (
          <li key={item.chave} className={cn('flex items-start gap-2 text-[13px] font-medium leading-snug', pele.item)}>
            <span className={cn('mt-px flex h-4 w-4 flex-none items-center justify-center rounded-full', pele.check)}>
              <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
            </span>
            {item.rotulo}
          </li>
        ))}
      </ul>
      {escondidos > 0 && (
        <button
          type="button"
          onClick={() => setVerTudo(true)}
          className={cn('mt-2 inline-flex items-center gap-1 text-xs font-bold transition', pele.destaque)}
        >
          Ver {escondidos === 1 ? 'mais 1 incluído' : `mais ${escondidos} incluídos`} <ChevronDown className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
      {extras.length > 0 && (verTudo || escondidos === 0) && (
        <p className={cn('mt-2 flex items-start gap-1.5 text-xs leading-relaxed', pele.texto)}>
          <Sparkles className={cn('mt-0.5 h-3.5 w-3.5 flex-none', pele.destaque)} aria-hidden />
          <span>
            E ainda: {extras.map((e) => e.rotulo).join(', ')}.
          </span>
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {oferta.precoOriginal ? (
            <p className={cn('text-xs font-semibold tabular-nums line-through', pele.riscado)}>
              {formatBRL(oferta.precoOriginal)}
            </p>
          ) : null}
          <p className={cn('font-heading text-2xl font-semibold tabular-nums tracking-tight', pele.preco)}>
            {formatBRL(oferta.preco)}
            {oferta.durationMonths ? (
              <span className={cn('ml-1.5 text-xs font-semibold', pele.miudo)}>
                por {oferta.durationMonths} {oferta.durationMonths === 1 ? 'mês' : 'meses'}
              </span>
            ) : null}
          </p>
          {arg.porMes && arg.porDia ? (
            <p className={cn('text-[11px] font-bold', pele.destaque)}>
              ≈ {formatBRL(arg.porMes)}/mês · cerca de {formatBRL(arg.porDia)} por dia
            </p>
          ) : null}
        </div>

        <Link
          href={destino}
          onClick={registrarClique}
          className={cn(
            'inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black shadow-sm transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
            pele.botao,
          )}
        >
          {upgrade ? <Zap className="h-4 w-4" aria-hidden /> : <Crown className="h-4 w-4" aria-hidden />}
          {upgrade ? 'Fazer upgrade para o Plus+' : `Quero o ${nomeDoPlano}`}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {upgrade && dados.renovacaoAutomatica ? (
        <p className={cn('mt-3 rounded-lg border px-3 py-2 text-[11px] leading-relaxed', pele.aviso)}>
          Seu Quest+ tem renovação automática. Depois do upgrade, cancele-a no seu perfil para não pagar os dois.
        </p>
      ) : null}

      <p className={cn('mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]', pele.miudo)}>
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> 7 dias de garantia
        </span>
        <span>
          {upgrade
            ? 'O prazo do Plus+ começa a contar no pagamento.'
            : 'Prefere seguir só com esta compra? É só continuar abaixo.'}
        </span>
      </p>
    </section>
  )
}
