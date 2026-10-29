'use client'

/*
 * /buy/checkout — a segunda (e última) tela da compra de um plano.
 *
 * Quem chega aqui já escolheu. Então a tela existe para uma coisa só: pagar.
 * Tudo o que não ajuda a pagar foi recolhido ou removido — o resumo cabe em um
 * cartão curto, a lista de benefícios vira um "ver o que entra" fechado, e o
 * cupom deixou de ocupar dois blocos permanentes (a faixa da campanha e um
 * formulário sempre aberto) para virar um link que só se abre quem tem código.
 *
 * No celular a ordem do DOM é resumo curto → pagamento → detalhes. Antes a
 * lista inteira de benefícios ficava entre o preço e o formulário.
 */

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Loader2,
  ChevronLeft,
  ChevronDown,
  CreditCard,
  Zap,
  Check,
  Lock,
  Tag,
  X,
  Clock,
  GraduationCap,
  Crown,
  ShieldCheck,
} from 'lucide-react'
import { MercadoPagoCheckout } from '@/components/payments/mercado-pago-checkout'
import type { PlanConfig } from '@/lib/types'
import { AppShell } from '@/components/app-shell'
import { CheckoutAccountNotice } from '@/components/checkout/checkout-account-notice'
import { CouponPromo } from '@/components/checkout/coupon-promo'
import { useProuniGrant } from '@/hooks/use-prouni-grant'
import { ProuniCta } from '@/components/prouni/prouni-cta'
import { BarraDePagamento } from '@/components/checkout/barra-de-pagamento'
import { PlusUpsell } from '@/components/checkout/plus-upsell'
import { CabecaDoCheckout, MundoDoCheckout, TrilhaDoCheckout } from '@/components/checkout/mundo-do-checkout'
import { SeloDePago } from '@/components/checkout/marca-no-pagamento'
import { LogoAnimada } from '@/components/marca/logo-animada'
import { combineDiscountsWithProuni } from '@/lib/prouni-shared'
import {
  computeCheckoutCharge,
  computeSubscriptionCharge,
  DEFAULT_FEE_POLICY,
  formatBrl,
  type CheckoutCharge,
  type FeePolicy,
} from '@/lib/payments/fees'
import {
  CardTerminal,
  EMPTY_CARD_FIELDS,
  splitExpiry,
  validateCard,
  type CardFields,
  type TerminalStatus,
} from '@/components/payments/card-terminal'
import { formatCpf, isValidCpf, onlyCpfDigits } from '@/lib/cpf'
import {
  planoEhRecorrente,
  rotuloCurtoDeCiclo,
  rotuloDeCicloDeCobranca,
  rotuloDePeriodoDeCobranca,
  type MesesDeRecorrencia,
} from '@/lib/payments/subscription-view'
import { cn } from '@/lib/utils'
import { cardTokenError, detalhesDoErroDeToken } from '@/lib/payments/card-token-errors'
import { relatarFalhaDeCartao } from '@/lib/payments/relatar-falha-cartao'
import { carregarScriptAntifraude, esperarDeviceId } from '@/lib/payments/device-id'
import { invalidFieldsFrom } from '@/lib/payments/invalid-fields'
import { useOfertaDeUpgrade } from '@/hooks/use-oferta-de-upgrade'
import { disputarPrecoDoUpgrade } from '@/lib/upgrade-quest'

type PayMode = 'subscription' | 'one_time'

interface AppliedCoupon {
  couponId: string
  code: string
  label?: string
  amountBeforeCoupon: number
  discountAmount: number
  amountAfterCoupon: number
}

function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

/** Estimativa de total no Pix — o meio que o formulário abre selecionado. */
function estimarCobrancaNoPix(baseAmount: number, policy: FeePolicy): CheckoutCharge {
  return computeCheckoutCharge({
    baseAmount,
    paymentMethodId: 'pix',
    installments: 1,
    hasCardToken: false,
    policy,
  })
}

export default function BuyCheckoutPage() {
  return (
    <AppShell>
      <BuyCheckoutContent />
    </AppShell>
  )
}

function BuyCheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get('plan') || ''
  const veioDoUpgrade = searchParams.get('origem') === 'upgrade'
  const [plan, setPlan] = useState<PlanConfig | null>(null)
  const [publicKey, setPublicKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [planoERecorrente, setPlanoERecorrente] = useState(false)
  // Abre no avulso. Ver o comentário em `setPayMode` dentro do carregamento.
  const [payMode, setPayMode] = useState<PayMode>('one_time')
  const [verDetalhes, setVerDetalhes] = useState(false)

  /*
   * Regras de cobrança que a TELA precisa saber antes de cobrar.
   *
   * `subscriptionsEnabled` é um toggle do painel que só era validado no
   * servidor. Com ele desligado, a opção "Assinatura" continuava na tela: a
   * pessoa digitava cartão, validade, CVV e CPF e só ao enviar recebia
   * "Assinaturas não estão disponíveis no momento", sem nenhuma pista de que a
   * opção ao lado funcionaria. Agora o seletor inteiro some.
   *
   * `feePolicy` é a mesma tabela que o formulário de pagamento usa para somar a
   * taxa operacional. Ela vem para cá porque o RESUMO precisa mostrar o mesmo
   * total que o botão de pagar — ver `totalDoResumo` mais abaixo.
   */
  const [feePolicy, setFeePolicy] = useState<FeePolicy>(DEFAULT_FEE_POLICY)
  const [subscriptionsEnabled, setSubscriptionsEnabled] = useState(true)
  const [charge, setCharge] = useState<CheckoutCharge | null>(null)

  // Só é assinatura de verdade se o plano for recorrente E o painel permitir.
  const isRecurring = planoERecorrente && subscriptionsEnabled

  // Cupom: só se aplica ao pagamento único — a assinatura recorrente cobra o
  // cartão pelo mesmo valor fixo em toda renovação (preapproval do Mercado
  // Pago), e não existe hoje um jeito de descontar só a primeira cobrança sem
  // o desconto voltar sozinho no mês seguinte. Aplicar o cupom ali venderia um
  // preço que a cobrança real não respeitaria.
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [couponAberto, setCouponAberto] = useState(false)
  const couponSupported = payMode === 'one_time'

  /**
   * Desconto PROUNI/FIES aprovado para este plano.
   *
   * Vale pelas mesmas razões do cupom, e com o mesmo limite: só o pagamento
   * único o respeita. A assinatura recorrente é um preapproval do Mercado Pago
   * que cobra o mesmo valor em toda renovação — descontar ali venderia o
   * benefício de uso único como se fosse permanente.
   *
   * Antes existia aqui um efeito que TROCAVA a tela para o pagamento único
   * quando havia concessão, porque o padrão era a assinatura e o benefício
   * ficava escondido atrás de uma escolha que a pessoa não sabia que precisava
   * fazer. Com o avulso virando o padrão para todo mundo, o efeito virou
   * redundante e saiu: quem tem o benefício já cai onde ele vale.
   */
  const { concessao: prouniGrant } = useProuniGrant('plus', planId)
  const prouniSupported = payMode === 'one_time'

  /**
   * Upgrade Quest+ → Plus+: o preço com o desconto de quem já é Quest+.
   *
   * Mesma regra do cupom e do PROUNI: só no pagamento único, e disputa com
   * eles pelo menor preço (`disputarPrecoDoUpgrade`, a MESMA função que
   * /api/payments/orders usa para cobrar). Bolsista PROUNI/FIES tem um
   * terceiro preço, o do benefício com o extra de upgrade por cima, que vem
   * calculado pelo servidor na mesma resposta. A tela espera esta resposta antes
   * de mostrar o preço — anunciar o cheio e cobrar o de upgrade seria o mesmo
   * defeito de resumo e botão discordando, só que ao contrário.
   */
  const ofertaDeUpgrade = useOfertaDeUpgrade()

  const escolherModo = (modo: PayMode) => setPayMode(modo)

  // O upgrade do Quest+ (PlusUpsell) troca o `?plan=` sem sair da rota: um
  // cupom validado para o plano anterior não vale automaticamente no novo.
  useEffect(() => {
    setAppliedCoupon(null)
  }, [planId])

  useEffect(() => {
    if (!planId) {
      setError('Plano não informado')
      setLoading(false)
      return
    }
    Promise.all([
      fetch('/api/plans').then(r => r.json()),
      fetch('/api/payments/public-key').then(r => r.json()),
      // Falhar aqui não pode derrubar a venda: cai nos defaults, que são os
      // mesmos que o servidor aplica quando não há configuração salva.
      fetch('/api/payments/fees').then(r => r.json()).catch(() => null),
    ])
      .then(([planosResp, pkResp, feesResp]) => {
        const found = (planosResp.planos || []).find((p: PlanConfig) => p.tipo === planId)
        if (!found) {
          setError('Plano não encontrado')
          return
        }
        setPlan(found)
        setPublicKey(pkResp.publicKey || '')

        if (feesResp?.policy) setFeePolicy(feesResp.policy)
        const assinaturaLiberada = feesResp?.checkout?.subscriptionsEnabled !== false
        setSubscriptionsEnabled(assinaturaLiberada)

        const recorrente = planoEhRecorrente(found.durationMonths)
        setPlanoERecorrente(recorrente)
        /*
         * A tela ABRE no pagamento único, mesmo quando a assinatura está
         * disponível. É a opção sem compromisso: cobra uma vez, aceita Pix e
         * boleto além do cartão, e não deixa nada renovando no cartão de quem
         * só queria comprar. Quem quer a recorrência escolhe — deixá-la
         * pré-marcada era vender assinatura a quem não pediu.
         */
        setPayMode('one_time')
      })
      .catch(err => setError(String(err?.message || err)))
      .finally(() => setLoading(false))
  }, [planId])

  /*
   * `checkout_view` era sempre emitido como `productType: 'subscription'`,
   * mesmo quando a pessoa terminava pagando no modo avulso — e a escolha entre
   * recorrente e único, que muda preço, taxa e retenção, não aparecia em lugar
   * nenhum dos dados. Agora o modo vai no payload, e o evento é reemitido
   * quando ele muda.
   */
  useEffect(() => {
    if (!plan) return
    fetch('/api/analytics/checkout-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'checkout_view',
        productId: plan.tipo,
        productTitle: plan.nome,
        productType: payMode === 'subscription' ? 'subscription' : 'plan',
        amount: plan.preco,
        source: 'Assinatura',
        metadata: {
          period: plan.periodo,
          durationMonths: plan.durationMonths,
          payMode,
          subscriptionsEnabled,
        },
      }),
      keepalive: true,
    }).catch(() => {})
  }, [plan, payMode, subscriptionsEnabled])

  /*
   * Destino do atalho do celular (ver components/checkout/barra-de-pagamento).
   *
   * Fica ACIMA dos `return` de carregamento e de erro logo abaixo, e não
   * junto do resto do cálculo: `useRef` é hook, e hook que nasce depois de
   * um return antecipado só é chamado em ALGUNS renders — na primeira
   * pintura (carregando) ele não roda, na seguinte roda, e o React quebra a
   * tela inteira com o erro #310 por ver a contagem de hooks mudar.
   */
  const refDoPagamento = useRef<HTMLDivElement>(null)

  if (loading || ofertaDeUpgrade === undefined) {
    return (
      <MundoDoCheckout>
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 py-6">
          <LogoAnimada tamanho="compacto" nome={false} modo="gerando" flutua={false} inclinacao="nenhuma" />
          <p className="text-sm font-medium text-muted-foreground">Preparando o seu pedido…</p>
        </div>
      </MundoDoCheckout>
    )
  }

  if (error || !plan) {
    return (
      <MundoDoCheckout>
        <div className="min-h-full px-4 py-6 sm:px-6">
          <div className="ck-vidro-forte ck-entra mx-auto mt-10 max-w-md p-6 text-center">
            <p className="ck-h1" style={{ fontSize: 24 }}>Não encontramos este plano</p>
            <p className="ck-sub">{error || 'Plano não disponível.'}</p>
            <button type="button" onClick={() => router.push('/buy')} className="ck-botao mt-5">
              <ChevronLeft className="h-4 w-4" /> Ver os planos
            </button>
          </div>
        </div>
      </MundoDoCheckout>
    )
  }

  const months = plan.durationMonths || 0
  const periodLabel = plan.periodo || rotuloDePeriodoDeCobranca(months)
  const cicloLabel = rotuloDeCicloDeCobranca(months)
  const beneficios: string[] = Array.isArray((plan as any).features) ? (plan as any).features : []

  const baseAmount = Number(plan.preco) || 0
  // A MESMA conta que /api/payments/orders faz para cobrar. Planos não têm
  // lote, então aqui cupom e PROUNI só disputam entre si pelo maior desconto —
  // e o empate favorece o benefício, como no servidor.
  const combinado = combineDiscountsWithProuni({
    basePrice: baseAmount,
    couponDiscountAmount: couponSupported && appliedCoupon ? appliedCoupon.discountAmount : 0,
    prouni: prouniSupported ? prouniGrant : null,
  })
  const planoDoUpgrade = ofertaDeUpgrade?.elegivel
    ? ofertaDeUpgrade.planos?.find((p) => p.tipo === plan.tipo) || null
    : null
  const unico = payMode === 'one_time'
  const disputaDoUpgrade = disputarPrecoDoUpgrade({
    precoAtual: combinado.finalPrice,
    precoUpgrade: unico && planoDoUpgrade ? planoDoUpgrade.precoUpgrade : null,
    precoBolsista: unico && planoDoUpgrade ? planoDoUpgrade.precoBolsista : null,
  })
  // Upgrade comum ou de bolsista: nos dois o cupom não entra.
  const upgradeVenceu = disputaDoUpgrade.fonte !== 'cupom-ou-prouni'
  // De bolsista: o PROUNI/FIES entra inteiro e o extra de upgrade vem por cima.
  const bolsistaVenceu = disputaDoUpgrade.fonte === 'bolsista'
  const payableAmount = disputaDoUpgrade.preco
  const couponDiscountAmount = upgradeVenceu ? 0 : combinado.couponDiscountApplied
  const prouniDiscountAmount = bolsistaVenceu
    ? Math.round((baseAmount - (planoDoUpgrade?.precoComProuni ?? baseAmount)) * 100) / 100
    : upgradeVenceu
      ? 0
      : combinado.prouniDiscountApplied
  const upgradeDiscountAmount = upgradeVenceu
    ? Math.round((baseAmount - prouniDiscountAmount - payableAmount) * 100) / 100
    : 0
  // Quest+ com renovação automática: o MP recusaria uma segunda assinatura
  // (409). O upgrade é pagamento único, e ele mesmo encerra a do Quest+.
  const assinaturaBloqueada = !!ofertaDeUpgrade?.quest?.recorrente

  /*
   * O TOTAL QUE VAI SER COBRADO — o mesmo do botão de pagar.
   *
   * No pagamento único o Mercado Pago cobra uma taxa operacional por meio
   * escolhido (0,99% no Pix, R$ 3,49 no boleto, 4,98% no crédito; no parcelado
   * os juros são do Mercado Pago, pagos pelo comprador), e essa taxa é somada ao preço de tabela. O formulário de
   * pagamento já mostrava a conta discriminada; este resumo, não — exibia o
   * preço-base em corpo três vezes maior, ao lado de um botão dizendo outro
   * número. Quem não lia a linha da taxa achava que tinha sido cobrado a mais.
   *
   * `charge` chega do formulário via `onChargeChange` e reflete o meio e o
   * parcelamento realmente selecionados. Enquanto ele não chega, estimamos pelo
   * Pix — que é o meio que a tela abre e o mais barato, então o número só sobe
   * quando a pessoa escolhe outro, nunca surpreende para cima sem aviso.
   *
   * A ASSINATURA TAMBÉM tem taxa, desde que o repasse passou a valer para ela:
   * o preapproval é sempre crédito à vista, então é a taxa de crédito 1x, e
   * ela incide em toda renovação. `computeSubscriptionCharge` roda aqui e no
   * servidor que cria o preapproval — mesma função, mesmo número.
   */
  const chargeEstimadoPix = estimarCobrancaNoPix(payableAmount, feePolicy)
  /** O que cada ciclo da assinatura cobra: preço de tabela + taxa de crédito. */
  const chargeDaAssinatura = computeSubscriptionCharge(baseAmount, feePolicy)
  /*
   * Só aceita o total vindo do formulário se ele foi calculado sobre o preço
   * ATUAL. Sem essa checagem, aplicar ou remover um cupom deixava o resumo
   * mostrando o total anterior pelo instante entre a mudança de preço e a
   * remontagem do formulário — e um resumo que pisca um valor errado no meio
   * do checkout é pior que um resumo com estimativa.
   */
  const chargeValido = charge && charge.baseAmount === payableAmount ? charge : null
  const chargeExibido =
    payMode === 'one_time' ? chargeValido || chargeEstimadoPix : chargeDaAssinatura
  const totalDoResumo = chargeExibido.totalAmount
  const taxaDoResumo = chargeExibido.feeAmount

  /** Total do modo "Pagamento único" no cenário mais barato (Pix), para o seletor. */
  const totalUnicoMaisBarato = chargeEstimadoPix.totalAmount

  // `override` é o caminho do chamativo: a faixa manda o código direto, sem
  // depender do que está digitado no campo.
  const applyCoupon = async (override?: string) => {
    const normalized = (override ?? couponCode).trim()
    if (!normalized) return
    if (override) setCouponCode(override.toUpperCase())
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalized, itemType: 'plus', itemId: plan.tipo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Cupom inválido')
      setAppliedCoupon(data)
      setCouponCode(data.code || normalized.toUpperCase())
    } catch (err: any) {
      setCouponError(err?.message || 'Erro ao aplicar cupom')
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  return (
    <MundoDoCheckout>
    <div className="min-h-full px-4 pb-12 pt-4 sm:px-6 sm:pt-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <CabecaDoCheckout
          voltar={{
            rotulo: veioDoUpgrade && planoDoUpgrade ? 'Voltar à oferta' : 'Planos',
            onClick: () => router.push(veioDoUpgrade && planoDoUpgrade ? '/upgrade' : '/buy'),
          }}
          trilha={<TrilhaDoCheckout atual="pagamento" />}
          titulo={planoDoUpgrade ? 'Finalizar upgrade' : 'Finalizar compra'}
          subtitulo="Confira o valor e escolha como pagar. O acesso entra na sua conta assim que o pagamento cai."
        />

        {/* O desconto de upgrade dito antes de qualquer número: quem veio do
            e-mail precisa ver que a oferta seguiu com ele até aqui. */}
        {planoDoUpgrade && (
          <p className="ck-aviso ck-entra mt-5" style={{ '--ordem': 1 } as React.CSSProperties}>
            <Crown className="h-4 w-4" aria-hidden />
            <span>
              {bolsistaVenceu ? (
                <>
                  <strong className="font-bold">
                    Bolsista PROUNI/FIES: seu desconto + {ofertaDeUpgrade?.descontoExtraBolsista}% extra de upgrade já
                    estão no preço.
                  </strong>{' '}
                  O benefício é usado nesta compra, e o Quest+ que você já pagou não se perde.
                </>
              ) : upgradeVenceu ? (
                <>
                  <strong className="font-bold">Seu desconto de upgrade de {ofertaDeUpgrade?.descontoPercentual}% já está no preço.</strong>{' '}
                  O Plus+ começa no pagamento, e o Quest+ que você já pagou não se perde.
                </>
              ) : payMode !== 'one_time' ? (
                <>
                  O desconto de upgrade de {ofertaDeUpgrade?.descontoPercentual}% vale no{' '}
                  <strong className="font-bold">Pagamento único</strong>.
                </>
              ) : (
                <>Você está usando um desconto maior que o de upgrade — vale sempre o melhor para você.</>
              )}
            </span>
          </p>
        )}

        {/* Só aparece quando o plano escolhido é o Quest+: aí a conversa é o
            upgrade para o Plus+. Para qualquer ciclo do Plus+ não desenha nada. */}
        <PlusUpsell
          contexto="plano"
          valorAtual={payableAmount}
          planoAtual={plan.tipo}
          origem="Checkout de plano"
          className="mt-5"
        />

        {/* No celular o cartão de pagamento cai inteiro embaixo do resumo —
            ver components/checkout/barra-de-pagamento.

            O valor é `totalDoResumo`, e não `payableAmount`: é o número que o
            botão de pagar cobra, com a taxa do meio escolhido já somada.
            Anunciar o preço-base numa barra fixa e cobrar outro no fim é
            exatamente o defeito que o resumo desta tela já tinha corrigido. */}
        <BarraDePagamento
          alvo={refDoPagamento}
          valor={formatBRL(totalDoResumo)}
          rotulo="Pagar agora"
        />

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-start lg:gap-6">
          {/* O pedido, como um recibo. Curto de propósito: quem chegou aqui já
              leu a página de vendas — o que falta é conferir o valor e pagar. */}
          {/* O sticky fica num invólucro: o vidro precisa do `position:
              relative` dele para a quina de luz. */}
          <div className="lg:sticky lg:top-24">
          <aside
            className="ck-vidro ck-entra p-5 sm:p-6"
            style={{ '--ordem': 2 } as React.CSSProperties}
            aria-label="Resumo do pedido"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold" style={{ color: 'var(--ck-texto-3)' }}>Seu pedido</p>
                <h2 className="mt-1 font-heading text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-[22px]">
                  {plan.nome}
                </h2>
              </div>
              <span className="ck-chip shrink-0">{periodLabel}</span>
            </div>

            <div className="ck-recibo mt-5">
              <div className="ck-recibo-linha">
                <span className="truncate">{plan.nome}</span>
                <span>{formatBRL(baseAmount)}</span>
              </div>
              {prouniDiscountAmount > 0 && (
                <div className="ck-recibo-linha" data-tom="desconto">
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="truncate">
                      ProUni/FIES{prouniGrant?.discountLabel ? ` (${prouniGrant.discountLabel})` : ''}
                    </span>
                  </span>
                  <span>− {formatBRL(prouniDiscountAmount)}</span>
                </div>
              )}
              {upgradeDiscountAmount > 0 && (
                <div className="ck-recibo-linha" data-tom="upgrade">
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <Crown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="truncate">
                      {bolsistaVenceu
                        ? `Extra de upgrade para bolsista (${ofertaDeUpgrade?.descontoExtraBolsista}%)`
                        : `Upgrade Quest+ (${ofertaDeUpgrade?.descontoPercentual}%)`}
                    </span>
                  </span>
                  <span>− {formatBRL(upgradeDiscountAmount)}</span>
                </div>
              )}
              {appliedCoupon && couponSupported && couponDiscountAmount > 0 && (
                <div className="ck-recibo-linha" data-tom="desconto">
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="truncate">Cupom {appliedCoupon.code}</span>
                  </span>
                  <span>− {formatBRL(couponDiscountAmount)}</span>
                </div>
              )}
              {/* A taxa aberta, e não embutida num número maior sem explicação. */}
              {taxaDoResumo > 0 && chargeExibido && (
                <div className="ck-recibo-linha">
                  <span>{chargeExibido.label}</span>
                  <span>+ {formatBrl(taxaDoResumo)}</span>
                </div>
              )}
            </div>

            <div className="ck-picote" aria-hidden />

            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-foreground">Total</p>
                <p className="text-xs" style={{ color: 'var(--ck-texto-3)' }}>
                  {months > 0 && payMode === 'subscription' ? `a cada ${cicloLabel}` : 'pagamento único'}
                </p>
              </div>
              <div className="text-right">
                {baseAmount > payableAmount && <p className="ck-riscado">{formatBRL(baseAmount)}</p>}
                <p className="ck-total" aria-live="polite">{formatBRL(totalDoResumo)}</p>
              </div>
            </div>

            {payMode === 'one_time' && !chargeValido && taxaDoResumo > 0 && (
              <p className="mt-2 text-[11.5px] leading-snug" style={{ color: 'var(--ck-texto-3)' }}>
                Estimativa no Pix. O valor final muda conforme o meio de pagamento escolhido.
              </p>
            )}
            {payMode === 'subscription' && taxaDoResumo > 0 && (
              <p className="mt-2 text-[11.5px] leading-snug" style={{ color: 'var(--ck-texto-3)' }}>
                Este é o valor de cada cobrança, e ele se repete a cada {cicloLabel}.
              </p>
            )}

            {appliedCoupon && couponSupported && couponDiscountAmount <= 0 && (
              <p className="mt-3 text-xs font-semibold" style={{ color: 'var(--ck-texto-2)' }}>
                {upgradeVenceu
                  ? `Cupom ${appliedCoupon.code} guardado — o seu desconto de upgrade, que é maior, é o que vale no preço. Os descontos não somam.`
                  : `Cupom ${appliedCoupon.code} registrado na compra — o seu desconto ProUni/FIES, que é maior, é o que vale no preço.`}
              </p>
            )}

            {/* O benefício existe mas a pessoa está na assinatura recorrente:
                dizer onde ele vale é mais útil que sumir com ele da tela. */}
            {prouniGrant && !prouniSupported && !planoDoUpgrade && (
              <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--ck-texto-2)' }}>
                Seu desconto ProUni/FIES{prouniGrant.discountLabel ? ` de ${prouniGrant.discountLabel}` : ''} vale
                no “Pagamento único” — a assinatura recorrente cobra sempre o valor cheio, em toda renovação.
              </p>
            )}

            {couponSupported && (
              <CouponPromo
                itens={[{ itemType: 'plus', itemId: plan.tipo }]}
                onAplicar={(code) => applyCoupon(code)}
                codigoAplicado={appliedCoupon?.code || null}
                className="mt-4"
              />
            )}

            {/* A oferta PROUNI/FIES deste plano, para quem AINDA não tem a
                concessão. Quem já tem vê o abatimento no recibo acima e não
                precisa do convite de novo — por isso o `!prouniGrant`. O
                chamativo some sozinho quando o admin não configurou benefício
                para este plano (ver ProuniCta), e ele é quem diz que o
                desconto sai de uma solicitação aprovada na conta, não de um
                código digitado aqui. */}
            {!prouniGrant && (
              <ProuniCta itemType="plus" itemId={plan.tipo} className="mt-4" />
            )}

            {/* Cupom: um link, não um bloco. Quem não tem código não precisa
                olhar para um campo vazio no meio do caminho até o pagamento. */}
            <div className="mt-4">
              {!couponSupported ? (
                <p className="text-xs leading-relaxed" style={{ color: 'var(--ck-texto-3)' }}>
                  {appliedCoupon
                    ? `Cupom ${appliedCoupon.code} guardado — escolha "Pagamento único" para aplicá-lo.`
                    : 'Cupom vale no "Pagamento único" — a assinatura recorrente cobra sempre o valor cheio.'}
                </p>
              ) : appliedCoupon ? (
                <div className="ck-placa flex items-center justify-between gap-2.5 px-3.5 py-2.5">
                  <p className="inline-flex min-w-0 items-center gap-1.5 truncate text-[13px] font-semibold" style={{ color: 'var(--ck-verde)' }}>
                    <Check className="h-4 w-4 shrink-0" strokeWidth={3} aria-hidden />
                    {upgradeVenceu
                      ? `${appliedCoupon.code} · não soma com o upgrade`
                      : `${appliedCoupon.code} aplicado · ${formatBRL(appliedCoupon.discountAmount)} de desconto`}
                  </p>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-destructive transition hover:underline"
                  >
                    <X className="h-3.5 w-3.5" /> Remover
                  </button>
                </div>
              ) : couponAberto ? (
                <div className="ck-surge">
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                      onKeyDown={(e) => { if (e.key === 'Enter') applyCoupon() }}
                      disabled={couponLoading}
                      placeholder="Código do cupom"
                      aria-label="Código do cupom"
                      aria-invalid={couponError ? true : undefined}
                      className="ck-campo ck-mono min-w-0 flex-1 uppercase"
                      style={{ height: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => applyCoupon()}
                      disabled={couponLoading || !couponCode.trim()}
                      className="ck-botao"
                    >
                      {couponLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Aplicar
                    </button>
                  </div>
                  {couponError ? <p className="ck-ajuda" data-erro>{couponError}</p> : null}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCouponAberto(true)}
                  className="ck-link inline-flex items-center gap-1.5"
                >
                  <Tag className="h-3.5 w-3.5" /> Tenho um cupom
                </button>
              )}
            </div>

            {beneficios.length > 0 && (
              <div className="mt-4 border-t pt-3" style={{ borderColor: 'var(--ck-sep)' }}>
                <button
                  type="button"
                  onClick={() => setVerDetalhes((v) => !v)}
                  aria-expanded={verDetalhes}
                  aria-controls="beneficios-do-plano"
                  className="flex w-full items-center justify-between gap-2 py-1 text-left text-[13px] font-semibold transition hover:text-foreground"
                  style={{ color: 'var(--ck-texto-2)' }}
                >
                  O que vem no plano ({beneficios.length})
                  <ChevronDown
                    className={cn('h-4 w-4 shrink-0 transition-transform duration-300', verDetalhes && 'rotate-180')}
                    aria-hidden
                  />
                </button>
                {verDetalhes && (
                  <ul id="beneficios-do-plano" className="ck-surge mt-2 flex flex-col gap-2">
                    {beneficios.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] leading-snug text-foreground/85">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: 'var(--ck-verde-claro)' }} strokeWidth={3} aria-hidden />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <p className="mt-4 flex items-center gap-2 text-xs" style={{ color: 'var(--ck-texto-3)' }}>
              <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: 'var(--ck-verde-claro)' }} aria-hidden />
              Ambiente seguro do Mercado Pago · não guardamos o seu cartão
            </p>
          </aside>
          </div>

          {/* Pagamento */}
          <section
            ref={refDoPagamento}
            className="ck-vidro-forte ck-entra p-4 sm:p-6"
            style={{ '--ordem': 3 } as React.CSSProperties}
            aria-label="Pagamento"
          >
            {isRecurring && !assinaturaBloqueada && (
              <div className="mb-5">
                <h2 className="mb-3 font-heading text-lg font-semibold tracking-tight text-foreground">
                  Como você prefere pagar?
                </h2>
                {/*
                  Cada opção mostra o VALOR que ela cobra. Os dois modos custam
                  diferente — a assinatura cobra o preço de tabela limpo e o
                  pagamento único soma a taxa do meio escolhido — e o seletor
                  antigo falava só de conveniência ("renova sozinho", "Pix,
                  cartão ou boleto"). A pessoa achava que escolhia um meio de
                  pagamento e escolhia, sem saber, um preço.
                */}
                <div className="grid grid-cols-2 gap-2.5">
                  <OpcaoDePagamento
                    ativo={payMode === 'one_time'}
                    onClick={() => escolherModo('one_time')}
                    icone={Zap}
                    titulo="Pagamento único"
                    valor={`a partir de ${formatBrl(totalUnicoMaisBarato)}`}
                    detalhe="Pix, cartão ou boleto · cobra uma vez, não renova"
                    selo={planoDoUpgrade ? 'Com seu desconto de upgrade' : prouniGrant ? 'Com seu desconto' : 'Recomendado'}
                  />
                  <OpcaoDePagamento
                    ativo={payMode === 'subscription'}
                    onClick={() => escolherModo('subscription')}
                    icone={CreditCard}
                    titulo="Assinatura"
                    valor={`${formatBrl(chargeDaAssinatura.totalAmount)} a cada ${cicloLabel}`}
                    detalhe={
                      planoDoUpgrade || prouniGrant
                        ? 'Cartão · renova sozinho · sem o seu desconto'
                        : 'Cartão · renova sozinho até você cancelar'
                    }
                  />
                </div>
              </div>
            )}

            <CheckoutAccountNotice className="mb-5" />

            {payMode === 'subscription' && isRecurring && !assinaturaBloqueada ? (
              <SubscriptionCheckout
                plan={plan}
                publicKey={publicKey}
                months={months as MesesDeRecorrencia}
                feePolicy={feePolicy}
              />
            ) : (
              <MercadoPagoCheckout
                key={`buy-${payableAmount}-${appliedCoupon?.code || 'sem-cupom'}-${prouniDiscountAmount}`}
                publicKey={publicKey}
                amount={payableAmount}
                description={`${plan.nome} — ${periodLabel}`}
                endpoint="/api/payments/orders"
                extraBody={{
                  type: 'plan',
                  refId: plan.tipo,
                  couponCode: appliedCoupon?.code,
                }}
                // O resumo ao lado mostra este mesmo total, taxa inclusa.
                onChargeChange={setCharge}
                analytics={{
                  productId: plan.tipo,
                  productTitle: plan.nome,
                  productType: 'subscription',
                  source: 'Assinatura',
                }}
                onApproved={() => setTimeout(() => router.push('/profile?purchase=success'), 1500)}
              />
            )}
          </section>
        </div>
      </div>
    </div>
    </MundoDoCheckout>
  )
}

function OpcaoDePagamento({
  ativo,
  onClick,
  icone: Icone,
  titulo,
  valor,
  detalhe,
  selo,
}: {
  ativo: boolean
  onClick: () => void
  icone: typeof CreditCard
  titulo: string
  /** Quanto esta opção cobra. É a informação que decide a escolha. */
  valor: string
  detalhe: string
  selo?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className="ck-opcao"
      data-ativo={ativo || undefined}
    >
      <span className="ck-opcao-radio" aria-hidden />
      <span className="flex items-center gap-1.5 pr-6">
        <Icone className="h-4 w-4 shrink-0" style={{ color: ativo ? 'var(--ck-verde)' : 'var(--ck-texto-3)' }} aria-hidden />
        <span className="text-[14px] font-semibold leading-tight text-foreground">{titulo}</span>
      </span>
      <span className="mt-1 block text-[14px] font-semibold tabular-nums leading-snug text-foreground">{valor}</span>
      <span className="mt-0.5 block text-[12px] leading-snug" style={{ color: 'var(--ck-texto-3)' }}>{detalhe}</span>
      {selo && <span className="ck-chip mt-2 self-start" style={{ height: 22, fontSize: 11 }}>{selo}</span>}
    </button>
  )
}
/**
 * Assinatura recorrente — o preapproval do Mercado Pago exige cartão.
 *
 * ESTE FORMULÁRIO ERA O SEGUNDO da plataforma, e o mais fraco. O resto dos
 * checkouts usa o `CardTerminal`: máscara de número por bandeira, validade num
 * campo só (MM/AA), Luhn conferido enquanto digita, avanço automático entre
 * campos e CPF validado com `isValidCpf`. Aqui havia uma pilha de inputs sem
 * máscara nenhuma, um campo de ano de 4 dígitos (erro clássico de digitação),
 * CPF sem validação e as mensagens cruas do SDK do Mercado Pago vazando para o
 * comprador. Agora é o mesmo terminal, com a mesma tokenização.
 *
 * O ESTADO PENDENTE também era tratado errado: quando o Mercado Pago devolvia
 * algo diferente de `authorized`, a tela mostrava "Assinatura criada,
 * aguardando autorização do cartão" dentro da CAIXA VERMELHA DE ERRO, com o
 * botão ainda ativo — sendo que a assinatura já existia. Quem reenviava tomava
 * um 409 ("Você já possui uma assinatura ativa ou pendente"): dois erros
 * vermelhos seguidos para um caso de sucesso parcial, e a leitura natural era
 * "paguei duas vezes". Agora o pendente tem estado próprio, tom neutro e o
 * formulário sai da tela.
 */
function SubscriptionCheckout({
  plan,
  publicKey,
  months,
  feePolicy,
}: {
  plan: PlanConfig
  publicKey: string
  months: MesesDeRecorrencia
  feePolicy: FeePolicy
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<'ativa' | 'pendente' | null>(null)
  const [mpInstance, setMpInstance] = useState<any>(null)

  const [card, setCard] = useState<CardFields>(EMPTY_CARD_FIELDS)
  const [focado, setFocado] = useState<keyof CardFields | null>(null)
  const [cpf, setCpf] = useState('')
  const [cpfTocado, setCpfTocado] = useState(false)

  const cicloCurto = rotuloCurtoDeCiclo(months)
  const cicloLongo = rotuloDeCicloDeCobranca(months)

  /*
   * O que cada cobrança realmente tira do cartão: preço de tabela + taxa
   * operacional. Mesma função que /api/subscriptions usa para montar o
   * preapproval — anunciar `plan.preco` aqui e cobrar outro valor no Mercado
   * Pago é o defeito que este cálculo existe para impedir.
   */
  const cobranca = computeSubscriptionCharge(Number(plan.preco) || 0, feePolicy)

  const validacao = validateCard(card)
  const cpfDigits = onlyCpfDigits(cpf)
  const cpfOk = isValidCpf(cpfDigits)
  const cpfErrado = cpfTocado && cpfDigits.length > 0 && !cpfOk
  const cpfFaltando = cpfTocado && cpfDigits.length === 0
  const podeEnviar = !submitting && !!mpInstance && validacao.complete && cpfOk

  const statusDoTerminal: TerminalStatus = submitting
    ? 'processing'
    : validacao.complete
      ? 'ready'
      : card.number
        ? 'filling'
        : 'idle'

  // Script de segurança do Mercado Pago (device ID do antifraude). Sem ele a
  // assinatura chegava sem identificação do aparelho e caía mais em high_risk.
  useEffect(() => {
    carregarScriptAntifraude()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const init = () => {
      // @ts-ignore
      if (window.MercadoPago) setMpInstance(new window.MercadoPago(publicKey, { locale: 'pt-BR' }))
    }
    // @ts-ignore
    if (window.MercadoPago) init()
    else {
      const s = document.createElement('script')
      s.src = 'https://sdk.mercadopago.com/js/v2'
      s.async = true
      s.onload = init
      document.head.appendChild(s)
    }
  }, [publicKey])

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!podeEnviar) {
      setCpfTocado(true)
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      if (!mpInstance) throw new Error('O formulário de pagamento ainda está carregando. Tente de novo em instantes.')

      const { month, year } = splitExpiry(card.expiry)
      // Falha na validação do cartão → log de recusas do Analytics (dispara e esquece).
      const relatarFalhaTokenizacao = (d: { codigos: string[]; mensagem?: string }) =>
        relatarFalhaDeCartao({
          etapa: 'tokenizacao',
          origemDoFormulario: 'assinatura',
          ...d,
          numeroDoCartao: card.number,
          valor: cobranca.totalAmount,
          produto: plan.nome,
          endpoint: '/api/subscriptions',
        })
      // Com autopreenchimento dá para chegar aqui antes de o script gerar o
      // device ID: espera um pouco por ele.
      const deviceId = await esperarDeviceId()
      const tk = await mpInstance.createCardToken({
        cardNumber: card.number.replace(/\s/g, ''),
        cardholderName: card.holder.trim().replace(/\s+/g, ' '),
        cardExpirationMonth: month,
        cardExpirationYear: year,
        securityCode: card.cvv,
        identificationType: 'CPF',
        identificationNumber: cpfDigits,
      }).catch((err: unknown) => {
        relatarFalhaTokenizacao(detalhesDoErroDeToken(err))
        throw cardTokenError(err)
      })
      // Sem token não há o que mandar: seguir daria "Dados inválidos" no servidor.
      if (!tk?.id) {
        relatarFalhaTokenizacao(detalhesDoErroDeToken(tk))
        throw cardTokenError(tk)
      }

      fetch('/api/analytics/checkout-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'checkout_submit',
          productId: plan.tipo,
          productTitle: plan.nome,
          productType: 'subscription',
          // O valor COBRADO, não o de tabela — é o que o painel soma.
          amount: cobranca.totalAmount,
          paymentMethod: 'credit_card',
          source: 'Assinatura',
          metadata: {
            recurring: true,
            payMode: 'subscription',
            baseAmount: cobranca.baseAmount,
            feeAmount: cobranca.feeAmount,
          },
        }),
        keepalive: true,
      }).catch(() => {})

      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.tipo, cardTokenId: tk.id, ...(deviceId ? { deviceId } : {}) }),
      })
      // Resposta que não é JSON é a plataforma cortando a função — a assinatura
      // pode ter sido criada. Não mandar "tentar de novo" no escuro.
      const data = await res.json().catch(() => null)
      if (!data) {
        throw new Error(
          'Não recebemos a resposta a tempo. Antes de tentar de novo, confira em alguns minutos o seu perfil ou o app do banco — se a assinatura aparecer, está tudo certo.'
        )
      }
      if (!res.ok) {
        const campos = invalidFieldsFrom(data?.details)
        throw new Error(
          campos.length > 0
            ? `${data.error} (${campos.join(', ')}). Recarregue a página e tente de novo.`
            : data.error || 'Não foi possível criar a assinatura. Confira os dados do cartão.'
        )
      }

      if (data.status === 'authorized') {
        setResultado('ativa')
        setTimeout(() => (window.location.href = '/profile?subscription=success'), 1500)
      } else {
        // A assinatura EXISTE. Reenviar daqui só produziria um 409.
        setResultado('pendente')
      }
    } catch (err: any) {
      setError(mensagemDeErro(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (resultado === 'ativa') {
    return (
      <div className="ck-surge flex flex-col items-center gap-3 py-6 text-center" aria-live="polite">
        <SeloDePago />
        <p className="ck-h1" style={{ fontSize: 24 }}>Assinatura ativada</p>
        <p className="ck-sub" style={{ marginTop: 0 }}>Levando você para o seu perfil…</p>
      </div>
    )
  }

  if (resultado === 'pendente') {
    return (
      <div className="ck-placa ck-surge p-5 text-center sm:p-6">
        <span
          className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-[18px]"
          style={{ background: 'var(--ck-verde-fundo)', color: 'var(--ck-verde)' }}
          aria-hidden
        >
          <Clock className="h-7 w-7" />
        </span>
        <p className="font-heading text-lg font-semibold text-foreground">
          Assinatura criada — falta a autorização do seu banco
        </p>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--ck-texto-2)' }}>
          Está tudo certo do nosso lado: o cartão foi enviado ao Mercado Pago e agora depende do seu banco
          liberar a cobrança. <strong className="text-foreground">Não envie de novo</strong> — a assinatura já
          existe e uma segunda tentativa seria recusada. Você recebe um e-mail assim que for aprovada.
        </p>
        <button type="button" onClick={() => (window.location.href = '/profile')} className="ck-botao mt-5">
          Acompanhar no meu perfil
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="ck-escopo flex flex-col gap-4">
      <p className="ck-nota">
        <Clock className="h-4 w-4" aria-hidden />
        <span>
          Você será cobrado{' '}
          <strong>{formatBrl(cobranca.totalAmount)}</strong> a cada{' '}
          {cicloLongo}, no mesmo cartão, até você cancelar.{' '}
          {/*
            "Cancele quando quiser no seu perfil" era texto puro, sem link — e o
            perfil não tinha nada sobre a assinatura para quem chegasse lá. Agora
            o endereço existe e a frase leva até ele.
          */}
          <a href="/profile" className="ck-link" style={{ fontSize: 'inherit' }}>
            Cancele quando quiser no seu perfil
          </a>
          , sem multa, mantendo o acesso até o fim do período já pago.
        </span>
      </p>

      {/* A taxa aberta, e não embutida num total sem explicação. */}
      {cobranca.feeAmount > 0 && (
        <div className="ck-placa ck-recibo px-4 py-3" style={{ fontSize: 12.5 }}>
          <div className="ck-recibo-linha">
            <span>{plan.nome}</span>
            <span>{formatBrl(cobranca.baseAmount)}</span>
          </div>
          <div className="ck-recibo-linha">
            <span>{cobranca.label}</span>
            <span>+ {formatBrl(cobranca.feeAmount)}</span>
          </div>
          <div className="ck-recibo-linha border-t pt-2 text-[13.5px] font-semibold text-foreground" style={{ borderColor: 'var(--ck-sep)' }}>
            <span>Total por cobrança</span>
            <span>{formatBrl(cobranca.totalAmount)}</span>
          </div>
        </div>
      )}

      <CardTerminal
        fields={card}
        onChange={setCard}
        amountLabel={formatBrl(cobranca.totalAmount)}
        installmentLabel={`a cada ${cicloLongo}`}
        focused={focado}
        onFocusedChange={setFocado}
        status={statusDoTerminal}
        disabled={submitting}
      >
        <div>
          <label htmlFor="docNumber" className="ck-rotulo">
            CPF do titular
          </label>
          <input
            id="docNumber"
            name="docNumber"
            inputMode="numeric"
            autoComplete="off"
            required
            disabled={submitting}
            value={formatCpf(cpf)}
            onChange={(e) => setCpf(onlyCpfDigits(e.target.value))}
            onBlur={() => setCpfTocado(true)}
            placeholder="000.000.000-00"
            aria-invalid={cpfErrado || cpfFaltando}
            className="ck-campo ck-mono"
          />
          {cpfErrado ? (
            <span className="ck-ajuda" data-erro>
              CPF inválido. Confira os números digitados.
            </span>
          ) : cpfFaltando ? (
            <span className="ck-ajuda" data-erro>
              Informe o CPF do titular do cartão.
            </span>
          ) : (
            <span className="ck-ajuda">
              O Mercado Pago exige o documento do titular para cobrar no cartão.
            </span>
          )}
        </div>
      </CardTerminal>

      {error && (
        <div role="alert" className="ck-erro ck-surge">
          {error}
        </div>
      )}

      {/* O último botão do funil, onde o dinheiro sai: o mesmo laranja de
          todos os checkouts, com o valor e o ciclo escritos nele. */}
      <button type="submit" disabled={!podeEnviar} className="ck-cta ck-cta-largo">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        Ativar assinatura · {formatBrl(cobranca.totalAmount)}/{cicloCurto}
      </button>

      <div className="ck-confianca">
        <span><Lock className="h-3 w-3" /> Pagamento seguro pelo Mercado Pago</span>
        <span><ShieldCheck className="h-3 w-3" /> Cancele quando quiser</span>
      </div>

      {/* O mesmo rodapé legal que o formulário de pagamento único já traz. */}
      <p className="-mt-1 text-center text-xs leading-relaxed" style={{ color: 'var(--ck-texto-3)' }}>
        Ao ativar a assinatura você concorda com os{' '}
        <a href="/termos-de-servico" target="_blank" rel="noopener noreferrer" className="ck-link" style={{ fontSize: 12 }}>
          Termos de Serviço
        </a>{' '}
        e a{' '}
        <a href="/politica-de-privacidade" target="_blank" rel="noopener noreferrer" className="ck-link" style={{ fontSize: 12 }}>
          Política de Privacidade
        </a>
        .
      </p>
    </form>
  )
}

/**
 * Traduz o que o SDK do Mercado Pago devolve.
 *
 * O SDK responde com códigos (`invalid_card_number`, `cc_rejected_...`) e às
 * vezes em inglês. Mostrar isso cru para quem está pagando não diz o que fazer
 * — e "o que fazer" é a única coisa que importa numa mensagem de erro.
 */
function mensagemDeErro(err: any): string {
  const bruto = String(err?.message || err?.[0]?.description || err || '')
  const codigo = bruto.toLowerCase()

  if (codigo.includes('card_number')) return 'Número do cartão inválido. Confira os dígitos.'
  if (codigo.includes('expiration')) return 'Validade inválida. Confira o mês e o ano do cartão.'
  if (codigo.includes('security_code') || codigo.includes('cvv'))
    return 'Código de segurança inválido. Ele fica no verso do cartão.'
  if (codigo.includes('cardholder') || codigo.includes('holder'))
    return 'Nome do titular inválido. Digite exatamente como está impresso no cartão.'
  if (codigo.includes('identification') || codigo.includes('doc'))
    return 'CPF inválido para este cartão. Use o CPF do titular.'
  if (codigo.includes('insufficient')) return 'Cartão sem limite disponível. Tente outro cartão.'
  if (codigo.includes('rejected') || codigo.includes('recus'))
    return 'O banco recusou o cartão. Tente outro cartão ou fale com o seu banco.'
  if (codigo.includes('já possui') || codigo.includes('409'))
    return 'Você já tem uma assinatura ativa ou pendente. Confira no seu perfil antes de criar outra.'
  if (codigo.includes('não estão disponíveis') || codigo.includes('nao estao disponiveis'))
    return 'As assinaturas estão temporariamente indisponíveis. Use a opção "Pagamento único" ao lado.'

  // Sobrou algo que não sabemos traduzir: devolver o texto do servidor é
  // melhor que uma frase genérica, desde que ele já venha em português.
  return bruto && /[áàâãéêíóôõúç ]/i.test(bruto) ? bruto : 'Não foi possível ativar a assinatura. Confira os dados e tente de novo.'
}
