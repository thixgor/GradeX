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
 * Uma linha só, de propósito: a versão anterior era um cartão de 300 px acima
 * do pagamento, com manchete de anúncio ("Espera!", "Você sabia?"), lista e
 * preço grande — empurrava o formulário para baixo da dobra justo de quem já
 * tinha decidido comprar. Agora é o argumento em uma frase, o preço real ao
 * lado e o botão; a lista do que vem fica a um toque.
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
  // Fechado por padrão: a chamada é uma linha. A lista do que vem no Plus+
  // abre quando a pessoa pede — o pagamento continua logo abaixo.
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

  const upgrade = modo === 'upgrade'
  const arg = argumentoDaOferta({
    valorAtual,
    precoPlus: oferta.preco,
    meses: oferta.durationMonths,
  })
  const destino = destinoDaOferta(oferta.tipo, dados.logado)
  const principais = oferta.inclusos.filter((i) => !i.extra)
  const extras = oferta.inclusos.filter((i) => i.extra)
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
        className={cn('ck-escopo ck-plus flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-semibold', className)}
        data-aparencia={aparencia}
      >
        <Crown className="h-4 w-4 flex-none text-amber-600 dark:text-amber-300" aria-hidden />
        <span className="min-w-0 flex-1 truncate" style={{ color: 'var(--ck-texto-2)' }}>
          {upgrade ? 'Upgrade para o Plus+' : `${nomeDoPlano}: a plataforma inteira`} por{' '}
          <strong className="text-foreground">{formatBRL(oferta.preco)}</strong>
        </span>
        <span className="ck-link flex-none">Ver</span>
      </button>
    )
  }

  // ── A manchete: o argumento que mais pesa para ESTA compra, numa linha. ──
  const destaque = 'text-amber-700 dark:text-amber-300'
  let manchete: React.ReactNode
  if (upgrade && contexto === 'plano') {
    manchete = arg.diferenca > 0
      ? <>Por <span className={destaque}>+{formatBRL(arg.diferenca)}</span>, troque o Quest+ pela plataforma inteira</>
      : <>Pelo mesmo valor, troque o Quest+ pela <span className={destaque}>plataforma inteira</span></>
  } else if (upgrade) {
    manchete = <>Você tem o Quest+. No Plus+, <span className={destaque}>isto já vem incluso</span></>
  } else if (arg.tipo === 'mais-barato') {
    manchete = arg.economia > 0
      ? <>O Plus+ sai <span className={destaque}>{formatBRL(arg.economia)} mais barato</span> e libera tudo</>
      : <>Pelo mesmo valor, o Plus+ <span className={destaque}>libera tudo</span></>
  } else if (arg.tipo === 'quase-o-mesmo') {
    manchete = <>Por <span className={destaque}>+{formatBRL(arg.diferenca)}</span>, leve a plataforma inteira</>
  } else {
    manchete = arg.porMes
      ? <>Tudo da plataforma por <span className={destaque}>{formatBRL(arg.porMes)}/mês</span></>
      : <>O Plus+ <span className={destaque}>libera tudo</span> num pagamento só</>
  }

  // O Banco só é citado quando o plano de fato o libera (permissões modulares).
  const temBanco = oferta.inclusos.some((i) => i.chave === 'bancoQuestoes')
  const sujeito = `${oQueEstaSendoComprado(contexto, quantidadeDeItens)} ${jaVem(contexto, quantidadeDeItens)} no ${nomeDoPlano}`
  const cobertura = upgrade && contexto === 'plano'
    ? temBanco
      ? 'O Plus+ já traz o Banco de Questões do Quest+ e soma a plataforma inteira:'
      : 'Com o Plus+ você leva a plataforma inteira:'
    : upgrade
      ? temBanco
        ? `${sujeito}, que mantém o Banco de Questões que você já usa e soma:`
        : `${sujeito}, junto com:`
      : `${sujeito}, junto com:`

  // A linha de preço, sempre com a cobrança real ao lado do "por mês".
  const precoReal = `${formatBRL(oferta.preco)}${
    oferta.durationMonths ? ` por ${oferta.durationMonths} ${oferta.durationMonths === 1 ? 'mês' : 'meses'}` : ''
  }`

  return (
    <section
      aria-label={upgrade ? 'Upgrade para o Plus+' : 'Conheça o Plus+'}
      className={cn('ck-escopo ck-plus', className)}
      data-aberto={verTudo || undefined}
      data-aparencia={aparencia}
    >
      <div className="flex items-center gap-3 p-2.5 pl-3 sm:p-3">
        <span className="ck-plus-coroa" aria-hidden>
          {upgrade ? <Zap className="h-[18px] w-[18px]" /> : <Crown className="h-[18px] w-[18px]" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold leading-snug tracking-tight sm:text-[15px]">{manchete}</p>
          <p className="mt-0.5 truncate text-[12px]" style={{ color: 'var(--ck-texto-3)' }}>
            {oferta.precoOriginal ? (
              <span className="mr-1 line-through">{formatBRL(oferta.precoOriginal)}</span>
            ) : null}
            {nomeDoPlano} · {precoReal}
          </p>
        </div>
        <span className="hidden flex-none sm:block">
          <Link href={destino} onClick={registrarClique} className="ck-plus-cta">
            {upgrade ? 'Fazer upgrade' : 'Conhecer'} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </span>
        <button
          type="button"
          onClick={() => setVerTudo((v) => !v)}
          className="ck-plus-mais"
          aria-expanded={verTudo}
          aria-label={verTudo ? 'Esconder o que vem no Plus+' : 'Ver o que vem no Plus+'}
        >
          <ChevronDown className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {upgrade && dados.renovacaoAutomatica ? (
        <p className="mx-3 mb-2.5 text-[11.5px] leading-snug" style={{ color: 'var(--ck-ambar)' }}>
          Seu Quest+ renova sozinho: depois do upgrade, cancele a renovação no perfil para não pagar os dois.
        </p>
      ) : null}

      <div className="ck-plus-corpo" inert={!verTudo}>
        <div>
          <div className="mx-3 border-t pb-3 pt-3" style={{ borderColor: 'var(--ck-sep)' }}>
            <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--ck-texto-2)' }}>{cobertura}</p>
            <ul className="mt-2 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
              {principais.map((item) => (
                <li key={item.chave} className="flex items-start gap-2 text-[13px] font-medium leading-snug">
                  <Check className="mt-0.5 h-3.5 w-3.5 flex-none" style={{ color: 'var(--ck-verde-claro)' }} strokeWidth={3} aria-hidden />
                  {item.rotulo}
                </li>
              ))}
            </ul>
            {extras.length > 0 && (
              <p className="mt-2 flex items-start gap-1.5 text-[12px] leading-relaxed" style={{ color: 'var(--ck-texto-2)' }}>
                <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-none text-amber-600 dark:text-amber-300" aria-hidden />
                <span>E ainda: {extras.map((e) => e.rotulo).join(', ')}.</span>
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]" style={{ color: 'var(--ck-texto-3)' }}>
                {arg.porMes && arg.porDia ? (
                  <span>≈ {formatBRL(arg.porMes)}/mês · {formatBRL(arg.porDia)} por dia</span>
                ) : null}
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> 7 dias de garantia
                </span>
              </p>
              <button type="button" onClick={() => setAberto(false)} className="ck-link-discreto">
                {upgrade ? 'Agora não' : 'Seguir só com esta compra'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* No celular o botão desce para baixo da linha, largo para o polegar. */}
      <div className="px-2.5 pb-2.5 sm:hidden">
        <Link href={destino} onClick={registrarClique} className="ck-plus-cta w-full justify-center">
          {upgrade ? 'Fazer upgrade para o Plus+' : `Conhecer o ${nomeDoPlano}`} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </section>
  )
}
