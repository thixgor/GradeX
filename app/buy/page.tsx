'use client'

/*
 * /buy — a página de venda dos planos.
 *
 * Três decisões de apresentação mandam em quase todo o arquivo:
 *
 * 1. O NÚMERO QUE LIDERA É O MENOR NÚMERO HONESTO. A página não abre com o
 *    total do período ("R$ 397,00"): abre com o equivalente mensal, e mostra o
 *    total logo abaixo, sempre — esconder a cobrança real seria trocar susto
 *    por mentira. A conta toda vive em `lib/buy/pricing.ts`, com teste.
 *
 * 2. UMA TELA, UMA DECISÃO. Manchete → plano → preço → botão. A faixa de
 *    "checkout seguro", os três selos soltos, a caixa de garantia, a tabela
 *    comparativa e as linhas de rodapé competiam com o botão; viraram uma
 *    fileira de três garantias encostada nele e uma lista do que entra. O
 *    resto (dúvidas, depoimentos) é apoio, para quem for procurar.
 *
 * 3. NO CELULAR, PREÇO E BOTÃO VÊM ANTES DA LISTA. O painel de compra é o
 *    segundo bloco no DOM e só vai para a coluna da direita a partir de `lg`.
 *
 * QUEM JÁ PAGA ALGO não esbarra mais num "você já tem um plano, chama no
 * WhatsApp": o Quest+ vai direto para a oferta de upgrade (/upgrade) quando
 * ela está no ar, e vê os planos Plus+ quando não está; o trial vê a venda
 * normal, com o prazo do teste lembrado em cima. Só o Plus+ vê o aviso.
 *
 * Nada nesta página inventa número: preço, preço "de", período e benefícios
 * saem do catálogo do admin; os depoimentos saem de /api/testimonials e a
 * seção some quando não há nenhum cadastrado.
 */

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Crown,
  GraduationCap,
  Lock,
  MessageCircle,
  Undo2,
  UserCircle2,
  Zap,
} from 'lucide-react'
import { PlanConfig } from '@/lib/types'
import { AppShell } from '@/components/app-shell'
import { FundoIos } from '@/components/materiais/fundo-ios'
import '@/components/upgrade/venda.css'
import { ProuniCta } from '@/components/prouni/prouni-cta'
import { DepoimentosDeCompra } from '@/components/buy/depoimentos'
import {
  apresentarPreco,
  formatarBRL,
  linhaDeApoio,
  normalizarMeses,
  rotuloCurtoDePreco,
  rotuloDeCiclo,
  rotuloDePeriodo,
  type PrecoApresentado,
} from '@/lib/buy/pricing'
import { useProuniGrant, type ProuniConcessaoNaTela } from '@/hooks/use-prouni-grant'
import { useOfertaDeUpgrade } from '@/hooks/use-oferta-de-upgrade'
import { combineDiscountsWithProuni } from '@/lib/prouni-shared'
import { planoEhRecorrente } from '@/lib/payments/subscription-view'
import { normalizeAccountType, PLUS_TIER, QUEST_TIER } from '@/lib/account-tier'

const WHATSAPP = '5524992230908'

/** Acima disso a lista de benefícios vira parede: mostramos parte e um botão. */
const BENEFICIOS_VISIVEIS = 6

interface Plan {
  id: string
  name: string
  period: string
  originalPrice: number
  price: number
  description: string
  features: string[]
  highlighted?: boolean
  badge?: string
  durationMonths?: number
  /** Cargo que o plano concede (plano sem cargo vale Plus+). */
  role?: string
}

/** Fallback exibido enquanto /api/plans não responde (ou se ele falhar). */
const PLANOS_PADRAO: Plan[] = [
  {
    id: 'anual',
    name: 'DomineAqui Plus+',
    period: 'Anual',
    originalPrice: 3128.99,
    price: 397.0,
    description: 'Tenha acesso a TUDO da plataforma por esse valor',
    features: [
      'Manual Clínico',
      'Manual Interativo do Eletrocardiograma',
      'Manual Interativo de Farmacologia',
      'Domine Anatomia (Atlas + modelos 3D)',
      'Todos os Materiais da plataforma (Resumos, etc)',
      'Todos os Flashcards da plataforma',
      'Todas as Provas da Faculdade + Download em PDF',
      'Criação de Provas com IA',
      'Criação de Flashcards com IA',
      'Criação ilimitada de Mapas Mentais',
      'Criação ilimitada de Cronogramas',
    ],
    highlighted: true,
    badge: 'IMPERDÍVEL',
    durationMonths: 12,
  },
]

interface PlanoComPreco extends Plan {
  preco: PrecoApresentado
  meses: number
  periodoRotulo: string
}

function comPreco(plan: Plan): PlanoComPreco {
  const meses = normalizarMeses(plan.durationMonths)
  return {
    ...plan,
    meses,
    periodoRotulo: rotuloDePeriodo(plan.period, meses),
    preco: apresentarPreco({
      preco: plan.price,
      precoOriginal: plan.originalPrice,
      durationMonths: plan.durationMonths,
    }),
  }
}

/**
 * "Plano Anual" → "Anual": o segmento não tem espaço para a palavra repetida.
 * Plano de outro produto (o Quest+) leva o nome curto dele — senão o Quest+
 * Anual e o Plus+ Anual viravam dois segmentos chamados "Anual".
 */
function rotuloDoSegmento(plano: PlanoComPreco): string {
  if (normalizeAccountType(plano.role || PLUS_TIER) !== PLUS_TIER) {
    return plano.name.replace(/^domineaqui\s+/i, '').trim() || plano.name
  }
  return plano.periodoRotulo.replace(/^plano\s+/i, '') || plano.name
}

export default function BuyPage() {
  return (
    // `guestNotice={false}`: o aviso flutuante de visitante do AppShell fica
    // fixado no rodapé do celular, exatamente por cima da barra de compra. Aqui
    // ele é dito por dentro do painel, ao lado do botão, que é onde a
    // informação muda a decisão.
    <AppShell allowGuest vidro guestNotice={false} headerTitle="Planos" headerSubtitle="Assinaturas DomineAqui">
      <BuyContent />
    </AppShell>
  )
}

function BuyContent() {
  const router = useRouter()
  const [selecting, setSelecting] = useState<string | null>(null)
  const [hasActiveSub, setHasActiveSub] = useState(false)
  const [hasRecurringSub, setHasRecurringSub] = useState(false)
  const [sub, setSub] = useState<any>(null)
  const [loadingSub, setLoadingSub] = useState(true)
  const [userName, setUserName] = useState('')
  const [isGuest, setIsGuest] = useState(false)
  const [plans, setPlans] = useState<Plan[]>(PLANOS_PADRAO)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [successPlan, setSuccessPlan] = useState<string | null>(null)
  const [escolhido, setEscolhido] = useState<string | null>(null)

  useEffect(() => {
    loadPlans()
    checkSub()
    loadUser()
    checkSuccess()
  }, [])

  async function loadPlans() {
    try {
      const res = await fetch('/api/plans')
      if (!res.ok) return
      const data = await res.json()
      if (data.planos?.length > 0) {
        setPlans(
          data.planos
            .filter((p: PlanConfig) => !p.oculto)
            .sort((a: PlanConfig, b: PlanConfig) => a.ordem - b.ordem)
            .map((p: PlanConfig) => ({
              id: p.tipo,
              name: p.nome,
              period: p.periodo,
              originalPrice: p.precoOriginal || p.preco,
              price: p.preco,
              description: p.descricao || '',
              features: p.beneficios || [],
              highlighted: p.destaque,
              badge: p.badge,
              durationMonths: p.durationMonths,
              role: p.role,
            }))
        )
      }
    } catch {
      /* mantém PLANOS_PADRAO */
    }
  }

  async function checkSub() {
    try {
      await fetch('/api/user/check-plan-expiration')
      const res = await fetch('/api/user/subscription-status')
      if (res.ok) {
        const d = await res.json()
        setHasActiveSub(d.hasActiveSubscription)
        setHasRecurringSub(d.hasRecurringSubscription)
        if (d.subscription) setSub(d.subscription)
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingSub(false)
    }
  }

  async function loadUser() {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const d = await res.json()
        setUserName(d.user.name)
        setIsGuest(false)
      } else setIsGuest(true)
    } catch {
      setIsGuest(true)
    }
  }

  function checkSuccess() {
    const params = new URLSearchParams(window.location.search)
    if (params.get('purchase') === 'success' || params.get('subscription') === 'success') {
      const plan = localStorage.getItem('lastPurchasedPlan')
      setPaymentSuccess(true)
      if (plan) {
        setSuccessPlan(plan)
        localStorage.removeItem('lastPurchasedPlan')
      }
      setTimeout(checkSub, 1500)
    }
  }

  function handleSelect(plan: Plan) {
    setSelecting(plan.id)
    localStorage.setItem('lastPurchasedPlan', plan.id)
    fetch('/api/analytics/checkout-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'buy_click',
        productId: plan.id,
        productTitle: plan.name,
        productType: 'subscription',
        amount: plan.price,
        source: 'Assinatura',
        metadata: { period: plan.period, durationMonths: plan.durationMonths },
      }),
      keepalive: true,
    }).catch(() => {})
    if (isGuest) {
      router.push(`/comprar?productType=premium&productId=${encodeURIComponent(plan.id)}`)
      return
    }
    router.push(`/buy/checkout?plan=${encodeURIComponent(plan.id)}`)
  }

  /*
   * O que a conta já tem decide o que esta página mostra:
   *  - Quest+  → a oferta de upgrade (/upgrade); sem ela no ar, os Plus+;
   *  - trial   → a venda, com o prazo do teste lembrado em cima;
   *  - Plus+ e cargos pagos do admin → o aviso de plano ativo.
   */
  const tipoAtivo = hasActiveSub && sub ? normalizeAccountType(sub.type) : null
  const ehQuest = tipoAtivo === QUEST_TIER
  const ehTrial = tipoAtivo === 'trial'
  const temPlanoQueCobreTudo = hasActiveSub && !!sub && !ehQuest && !ehTrial

  const ofertaDeUpgrade = useOfertaDeUpgrade({ ativo: ehQuest })
  const vaiParaUpgrade = ehQuest && !!ofertaDeUpgrade?.elegivel
  useEffect(() => {
    if (vaiParaUpgrade) router.replace('/upgrade')
  }, [vaiParaUpgrade, router])
  const decidindoUpgrade = ehQuest && (ofertaDeUpgrade === undefined || vaiParaUpgrade)

  const catalogo = useMemo(
    () =>
      plans
        // Para quem já é Quest+, vender o próprio Quest+ de novo é ruído.
        .filter((p) => !ehQuest || normalizeAccountType(p.role || PLUS_TIER) === PLUS_TIER)
        .map(comPreco),
    [plans, ehQuest]
  )

  /**
   * O plano que abre por padrão: o que o admin destacou, senão o primeiro da
   * ordem que ele definiu. `escolhido` só sobrescreve isso depois que a pessoa
   * clica — assim a recarga do catálogo não joga a escolha dela fora. Abrir já
   * com um plano escolhido é o que faz a compra caber em um clique.
   */
  const padrao = useMemo(
    () => catalogo.find((p) => p.highlighted) || catalogo[0],
    [catalogo]
  )
  const selecionado = useMemo(
    () => catalogo.find((p) => p.id === escolhido) || padrao,
    [catalogo, escolhido, padrao]
  )

  const successPlanName = useMemo(
    () => plans.find((p) => p.id === successPlan)?.name,
    [plans, successPlan]
  )

  /**
   * O desconto PROUNI/FIES já aprovado para o plano aberto.
   *
   * Sem isto a página anunciava o preço de tabela para quem já tinha passado
   * pela análise e ganhado o benefício — e o desconto só reaparecia dentro do
   * checkout. Ver o valor antigo aqui é indistinguível de o benefício ter se
   * perdido, e quem acha que perdeu abre outra solicitação.
   */
  const { concessao: prouniGrant } = useProuniGrant('plus', selecionado?.id || null)
  const oferta = useMemo(
    () => aplicarDescontoProuni(selecionado, prouniGrant),
    [selecionado, prouniGrant]
  )

  const mostrarVenda = !loadingSub && !temPlanoQueCobreTudo && !decidindoUpgrade && catalogo.length > 0

  // A barra de baixo só sobe quando o botão do painel sai da tela.
  const refDoBotao = useRef<HTMLButtonElement>(null)
  const [botaoVisivel, setBotaoVisivel] = useState(true)
  useEffect(() => {
    const alvo = refDoBotao.current
    if (!alvo || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(([e]) => setBotaoVisivel(e.isIntersecting), { threshold: 0 })
    obs.observe(alvo)
    return () => obs.disconnect()
  }, [mostrarVenda])

  const fimDoTeste = ehTrial && sub?.expiresAt ? new Date(sub.expiresAt) : null

  return (
    <FundoIos className="pb-36 lg:pb-16">
      <div className="mx-auto w-full max-w-5xl px-4 pt-4 sm:px-6 sm:pt-6">
        {paymentSuccess && (
          <AvisoDePagamento
            nomeDoPlano={successPlanName}
            onDashboard={() => router.push('/dashboard')}
          />
        )}

        {!loadingSub && temPlanoQueCobreTudo && (
          <PlanoAtivo
            sub={sub}
            recorrente={hasRecurringSub}
            userName={userName}
            onPerfil={() => router.push('/profile')}
          />
        )}

        {(loadingSub || decidindoUpgrade) && <EsqueletoDeCarregamento />}

        {mostrarVenda && selecionado && (
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-10">
            <Abertura fimDoTeste={fimDoTeste} quest={ehQuest} />

            <aside className="venda-sobe venda-sobe-2 min-w-0 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1">
              <PainelDeCompra
                planos={catalogo}
                plano={selecionado}
                onEscolher={setEscolhido}
                preco={oferta.preco ?? selecionado.preco}
                descontoProuni={oferta.desconto}
                rotuloProuni={prouniGrant?.discountLabel || ''}
                visitante={isGuest}
                comprando={selecting === selecionado.id}
                onComprar={() => handleSelect(selecionado)}
                refDoBotao={refDoBotao}
              />
            </aside>

            <div className="venda-sobe venda-sobe-3 min-w-0 space-y-10 lg:col-start-1 lg:row-start-2">
              <OQueEntra key={selecionado.id} plano={selecionado} />
              <DepoimentosDeCompra />
              <Faq plano={selecionado} visitante={isGuest} />
              <p className="ios-rotulo-2 text-center text-[13px]">
                Ficou alguma dúvida?{' '}
                <a
                  href={`https://wa.me/${WHATSAPP}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ios-tinta font-semibold underline-offset-4 hover:underline"
                >
                  Chama no WhatsApp
                </a>{' '}
                — responde gente, não robô.
              </p>
            </div>
          </div>
        )}
      </div>

      {mostrarVenda && selecionado && (
        <BarraFixa
          plano={selecionado}
          preco={oferta.preco ?? selecionado.preco}
          comprando={selecting === selecionado.id}
          onComprar={() => handleSelect(selecionado)}
          visivel={!botaoVisivel}
        />
      )}
    </FundoIos>
  )
}

/* ─────────────────────────── Abertura ─────────────────────────── */

/**
 * Abertura sem botão: o preço e o "Assinar" estão a um palmo daqui (e, no
 * celular, também na barra de baixo). Um botão que só rola a página é um
 * clique cobrado para não entregar nada.
 */
function Abertura({ fimDoTeste, quest }: { fimDoTeste: Date | null; quest: boolean }) {
  const diasDeTeste = fimDoTeste
    ? Math.max(0, Math.ceil((fimDoTeste.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : null
  const testeVitalicio = fimDoTeste !== null && fimDoTeste.getFullYear() >= 9999

  return (
    <header className="venda-sobe min-w-0 lg:col-start-1 lg:row-start-1 lg:pt-6">
      {diasDeTeste !== null && !testeVitalicio && (
        <span className="venda-capsula mb-3">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {diasDeTeste <= 1 ? 'Seu teste grátis acaba hoje' : `Seu teste grátis acaba em ${diasDeTeste} dias`} —
            assine e não perca nada
          </span>
        </span>
      )}
      {quest && (
        <span className="venda-capsula mb-3">
          <Crown className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">Você é Quest+: o Banco continua no Plus+</span>
        </span>
      )}
      <h1 className="ios-titulo-grande" style={{ overflowWrap: 'anywhere' }}>
        O problema nunca foi falta de material.
      </h1>
      <p className="ios-rotulo-2 mt-3 max-w-xl text-[17px] leading-relaxed">
        Foi ter tudo espalhado. Aqui os manuais, os resumos, as provas antigas, os flashcards e a IA ficam no mesmo
        lugar — do jeito que dá pra estudar na véspera.
      </p>
    </header>
  )
}

/* ─────────────────────────── Compra ─────────────────────────── */

/**
 * O preço do plano já com o benefício PROUNI/FIES desta conta.
 *
 * A conta é a MESMA de `/api/payments/orders` — `combineDiscountsWithProuni`,
 * importada dos dois lados justamente para que a página não possa divergir de
 * quem cobra. Aqui ela só serve para a tela dizer a verdade antes do clique.
 *
 * O "de" passa a ser o preço de tabela do plano, porque é ele que dimensiona o
 * benefício para quem o recebeu.
 */
function aplicarDescontoProuni(
  plano: PlanoComPreco | undefined,
  concessao: ProuniConcessaoNaTela | null
): { preco: PrecoApresentado | undefined; desconto: number } {
  if (!plano) return { preco: undefined, desconto: 0 }
  if (!concessao) return { preco: plano.preco, desconto: 0 }

  const beneficios = combineDiscountsWithProuni({
    basePrice: plano.preco.total,
    prouni: concessao,
  })
  if (beneficios.prouniDiscountApplied <= 0) return { preco: plano.preco, desconto: 0 }

  return {
    preco: apresentarPreco({
      preco: beneficios.finalPrice,
      precoOriginal: plano.preco.total,
      durationMonths: plano.durationMonths,
    }),
    desconto: beneficios.prouniDiscountApplied,
  }
}

function PainelDeCompra({
  planos,
  plano,
  onEscolher,
  preco,
  descontoProuni,
  rotuloProuni,
  visitante,
  comprando,
  onComprar,
  refDoBotao,
}: {
  planos: PlanoComPreco[]
  plano: PlanoComPreco
  onEscolher: (id: string) => void
  /** Já com o benefício PROUNI/FIES, quando existe. */
  preco: PrecoApresentado
  descontoProuni: number
  rotuloProuni: string
  visitante: boolean
  comprando: boolean
  onComprar: () => void
  refDoBotao: React.RefObject<HTMLButtonElement | null>
}) {
  const indice = Math.max(0, planos.findIndex((p) => p.id === plano.id))
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  /**
   * Setas navegam entre os planos, como manda o padrão de tablist. Sem isso
   * quem usa teclado precisa dar Tab por dentro do painel para chegar no
   * plano seguinte.
   */
  function aoTeclar(evento: React.KeyboardEvent, i: number) {
    const passo = evento.key === 'ArrowRight' ? 1 : evento.key === 'ArrowLeft' ? -1 : 0
    if (passo === 0) return
    evento.preventDefault()
    const proximo = planos[(i + passo + planos.length) % planos.length]
    onEscolher(proximo.id)
    refs.current[proximo.id]?.focus()
  }

  const temDesconto = preco.descontoPercentual !== null && preco.descontoPercentual > 0

  return (
    <section className="venda-painel" aria-labelledby="painel-titulo">
      {planos.length > 1 && (
        <div
          role="tablist"
          aria-label="Planos disponíveis"
          className="venda-seg mb-5"
          style={{ '--n': planos.length, '--i': indice } as CSSProperties}
        >
          {planos.map((p, i) => {
            const ativo = p.id === plano.id
            return (
              <button
                key={p.id}
                ref={(el) => {
                  refs.current[p.id] = el
                }}
                type="button"
                role="tab"
                id={`aba-${p.id}`}
                aria-selected={ativo}
                tabIndex={ativo ? 0 : -1}
                onKeyDown={(e) => aoTeclar(e, i)}
                onClick={() => onEscolher(p.id)}
                className={planos.length >= 4 ? 'venda-seg-item text-[13px]' : 'venda-seg-item'}
              >
                <span className="max-w-full truncate">{rotuloDoSegmento(p)}</span>
                {/* O mensal de cada um, sem o "R$": é o número que compara
                    planos de prazos diferentes, e cabe em quatro segmentos. */}
                <span className="venda-seg-nota max-w-full truncate">
                  {p.preco.chamada.unidade === 'unico' ? 'único' : `${formatarBRL(p.preco.chamada.valor)}/mês`}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <h2 id="painel-titulo" className="min-w-0 text-[17px] font-semibold leading-snug tracking-[-0.015em]">
          {plano.name}
          <span className="ios-rotulo-2 block text-[13px] font-medium">{plano.periodoRotulo}</span>
        </h2>
        {plano.badge && <span className="ios-selo ios-selo-claro shrink-0">{plano.badge}</span>}
      </div>

      {/* O menor número honesto na frente; o total, sem escapatória, embaixo. */}
      <p className="mt-4 flex flex-wrap items-end gap-x-2 gap-y-1">
        <span className="venda-preco">
          <span className="venda-preco-moeda">R$</span>
          {formatarBRL(preco.chamada.valor)}
        </span>
        <span className="ios-rotulo-2 pb-1 text-[14px] font-semibold">
          {preco.chamada.unidade === 'unico' ? 'pagamento único' : '/mês'}
        </span>
        {temDesconto && <span className="venda-selo-desconto mb-1">−{preco.descontoPercentual}%</span>}
      </p>
      <p className="ios-rotulo-2 mt-2 text-[14px] leading-snug">
        {preco.diario !== null ? `${linhaDeApoio(preco)} Dá R$ ${formatarBRL(preco.diario)} por dia.` : linhaDeApoio(preco)}
      </p>
      {preco.ancora !== null && preco.economia !== null && (
        <p className="ios-rotulo-2 mt-2 flex flex-wrap items-center gap-2 text-[14px]">
          De <s className="tabular-nums">R$ {formatarBRL(preco.ancora)}</s>
          <span className="venda-economia">você economiza R$ {formatarBRL(preco.economia)}</span>
        </p>
      )}

      {descontoProuni > 0 && (
        <p className="ios-tinta mt-2 flex items-start gap-1.5 text-[13px] font-semibold leading-snug">
          <GraduationCap className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            Seu desconto ProUni/FIES{rotuloProuni ? ` de ${rotuloProuni}` : ''} já está neste valor
            {plano.meses > 0 ? ' — o checkout abre no pagamento único, que é onde ele vale' : ''}.
          </span>
        </p>
      )}

      {/* Duas linhas dentro do mesmo botão: a promessa em cima, o dinheiro
          embaixo. Quem chega rolando do celular decide sem ter que subir a
          vista até o bloco de preço de novo. */}
      <button
        ref={refDoBotao}
        type="button"
        onClick={onComprar}
        disabled={comprando}
        className="buy-cta buy-cta-halo mt-5 flex w-full flex-col items-center justify-center gap-0.5 rounded-[18px] px-4 py-3.5 text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60"
      >
        <span className="flex items-center gap-2 text-[17px] font-extrabold tracking-tight">
          {comprando ? 'Abrindo checkout…' : 'Quero garantir meu acesso'}
          {!comprando && <ChevronRight className="buy-cta-seta h-5 w-5" aria-hidden />}
        </span>
        {!comprando && (
          <span className="text-[11px] font-bold uppercase tracking-[0.08em]">
            {rotuloCurtoDePreco(preco)} · acesso na hora
          </span>
        )}
      </button>

      {/* As três respostas que faltam bem na hora de pagar, encostadas no
          botão em vez de espalhadas pela página. */}
      <div className="venda-garantias mt-3">
        <span>
          <Zap className="h-4 w-4" aria-hidden />
          Acesso na hora
        </span>
        <span>
          <Undo2 className="h-4 w-4" aria-hidden />
          7 dias de garantia
        </span>
        <span>
          <Lock className="h-4 w-4" aria-hidden />
          Pix, cartão ou boleto
        </span>
      </div>

      <ProuniCta itemType="plus" itemId={plano.id} className="mt-3" />

      <p className="ios-rotulo-2 mt-3 text-[12px] leading-relaxed">
        {/* Mesma regra do checkout: só {1, 3, 12} meses renovam. */}
        {!visitante && planoEhRecorrente(plano.durationMonths)
          ? 'Pagamento único por padrão: não renova sozinho.'
          : plano.meses === 0
            ? 'Pagamento único: não existe renovação para cancelar.'
            : `Pagamento único por ${rotuloDeCiclo(plano.meses)} de acesso: não renova sozinho.`}{' '}
        Não serviu em 7 dias? Devolvemos 100%, sem justificar nada.
      </p>

      {visitante && (
        <p className="ios-rotulo-2 mt-2 flex items-start gap-2 text-[12px] leading-relaxed">
          <UserCircle2 className="ios-tinta mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {/*
            Sem conta, a compra é ÚNICA e não renova, enquanto a página
            inteira fala em assinatura — a diferença que mais importa.
          */}
          <span>
            Você está como visitante: a compra é única (não renova) e o acesso vai por e-mail.{' '}
            <a
              href="/auth/login?redirect=%2Fbuy"
              className="ios-tinta font-semibold underline-offset-4 hover:underline"
            >
              Entrar na conta
            </a>{' '}
            {planoEhRecorrente(plano.durationMonths)
              ? 'para assinar com renovação automática e acesso imediato.'
              : 'para o acesso cair direto nela, sem Serial Key.'}
          </span>
        </p>
      )}
    </section>
  )
}

/* ─────────────────────────── O que entra ─────────────────────────── */

function OQueEntra({ plano }: { plano: PlanoComPreco }) {
  const [tudoAberto, setTudoAberto] = useState(false)
  if (plano.features.length === 0) return null

  // Truncar para revelar um item só seria pior do que não truncar.
  const truncavel = plano.features.length > BENEFICIOS_VISIVEIS + 1
  const visiveis =
    truncavel && !tudoAberto ? plano.features.slice(0, BENEFICIOS_VISIVEIS) : plano.features
  const ocultos = plano.features.length - visiveis.length

  return (
    <section aria-labelledby="entra-titulo">
      <h2 id="entra-titulo" className="ios-titulo-secao mb-1">
        O que abre no dia do pagamento
      </h2>
      {plano.description && <p className="ios-rotulo-2 mb-3 text-[15px] leading-relaxed">{plano.description}</p>}
      <ul className="ios-lista [--ios-recuo:48px]">
        {visiveis.map((beneficio, i) => (
          <li key={`${beneficio}-${i}`} className="ios-linha min-h-[48px]">
            <span className="venda-icone-linha h-6 w-6 rounded-full">
              <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
            </span>
            <span className="min-w-0 flex-1 text-[15px] leading-snug tracking-[-0.01em]">{beneficio}</span>
          </li>
        ))}
        {truncavel && (
          <li>
            <button
              type="button"
              onClick={() => setTudoAberto((v) => !v)}
              aria-expanded={tudoAberto}
              className="ios-linha ios-tinta w-full justify-center text-[15px] font-semibold"
            >
              {tudoAberto ? 'Mostrar menos' : `Ver os outros ${ocultos} itens`}
              <ChevronDown
                className={tudoAberto ? 'h-4 w-4 rotate-180 transition-transform' : 'h-4 w-4 transition-transform'}
                aria-hidden
              />
            </button>
          </li>
        )}
      </ul>
      <p className="ios-pe-lista">Sem versão capada nem liberação em etapas: entra tudo de uma vez.</p>
    </section>
  )
}

/* ─────────────────────────── Dúvidas ─────────────────────────── */

/**
 * Quatro perguntas: cada uma responde uma coisa que muda a decisão. As
 * respostas mudam com o plano aberto — dizer "renova a cada 12 meses" numa
 * página que está mostrando o plano vitalício é o tipo de detalhe errado que
 * derruba a confiança bem na hora de pagar.
 *
 * `visitante` muda a resposta sobre cobrança, e não é detalhe: quem está
 * deslogado e clica em "Assinar" vai para /comprar, que vende o mesmo plano
 * como Serial Key de pagamento único, sem renovação nenhuma.
 */
function perguntasDoPlano(plano?: PlanoComPreco, visitante = false) {
  const nome = plano?.name || 'o plano'
  const preco = plano?.preco

  /*
   * Só {1, 3, 12} meses viram cobrança recorrente — /buy/checkout e
   * /api/subscriptions conferem {1, 3, 12}, e este texto tem que concordar.
   */
  const renova = !!plano && !visitante && planoEhRecorrente(plano.durationMonths)

  const cobranca = !plano
    ? 'A cobrança e a renovação aparecem no checkout antes de você confirmar qualquer coisa.'
    : plano.meses === 0
      ? `${nome} é pagamento único: R$ ${formatarBRL(preco!.total)} uma vez, sem renovação e sem mensalidade escondida.`
      : visitante
        ? `Comprando sem conta, ${nome} sai por R$ ${formatarBRL(preco!.total)} de uma vez, com acesso por ${rotuloDeCiclo(plano.meses)}${
            preco?.mensal != null ? ` — o que dá R$ ${formatarBRL(preco.mensal)} por mês` : ''
          }. É pagamento único: NÃO renova sozinho e não fica cobrando o seu cartão. Você recebe uma Serial Key por e-mail e ativa quando quiser.${
            planoEhRecorrente(plano.durationMonths)
              ? ' Se preferir a renovação automática, entre na sua conta antes de assinar.'
              : ''
          }`
        : renova
          ? `${nome} sai por R$ ${formatarBRL(preco!.total)} a cada ${rotuloDeCiclo(plano.meses)}${
              preco?.mensal != null
                ? ` — o que dá R$ ${formatarBRL(preco.mensal)} por mês de acesso`
                : ''
            }. O checkout abre no pagamento único (Pix, cartão ou boleto), que não renova. Quando a assinatura no cartão está disponível, você pode escolhê-la: ela renova pelo Mercado Pago e você cancela quando quiser, direto no seu perfil, sem multa, mantendo o acesso até o fim do período já pago.`
          : `${nome} é pagamento único: R$ ${formatarBRL(preco!.total)} uma vez, com acesso por ${rotuloDeCiclo(plano.meses)}${
              preco?.mensal != null ? ` — o que dá R$ ${formatarBRL(preco.mensal)} por mês` : ''
            }. NÃO renova sozinho: quando o prazo acabar, você decide se quer comprar de novo. Nada fica cobrando o seu cartão.`

  return [
    {
      q: 'Quanto sai e quando é cobrado?',
      a: `O número grande é o custo por mês de acesso; a cobrança é de uma vez. ${cobranca}`,
    },
    {
      q: 'E se eu não gostar?',
      a: 'São 7 dias corridos para testar o plano inteiro. Se não for pra você, manda uma mensagem no WhatsApp dentro do prazo e devolvemos 100% do valor pelo mesmo meio de pagamento — sem justificar, sem burocracia e sem multa.',
    },
    {
      q: 'Como eu pago e quando libera?',
      a: 'Pix, cartão ou boleto, tudo pelo Mercado Pago — os dados do cartão não passam pelo nosso servidor. O acesso abre automaticamente assim que o pagamento é aprovado: Pix costuma cair em segundos, boleto depende da compensação bancária.',
    },
    {
      q: 'Dá para testar antes de pagar?',
      a: 'Dá. Novos usuários têm 7 dias gratuitos para conhecer a plataforma antes de decidir qualquer coisa. Bolsista PROUNI ou FIES: quando há benefício ativo para o plano, aparece um botão de solicitação logo abaixo do preço.',
    },
  ]
}

function Faq({ plano, visitante }: { plano?: PlanoComPreco; visitante: boolean }) {
  const [aberta, setAberta] = useState<number | null>(null)
  const perguntas = useMemo(() => perguntasDoPlano(plano, visitante), [plano, visitante])

  return (
    <section aria-labelledby="faq-titulo">
      <h2 id="faq-titulo" className="ios-titulo-secao mb-2.5">
        Dúvidas que chegam antes de assinar
      </h2>
      <div className="ios-lista">
        {perguntas.map((item, i) => {
          const estaAberta = aberta === i
          return (
            <div key={item.q}>
              {/* Separador recuado, como o das listas do sistema. */}
              {i > 0 && <div aria-hidden className="ml-4 h-px bg-[color:var(--ios-separador)]" />}
              <h3>
                <button
                  type="button"
                  aria-expanded={estaAberta}
                  aria-controls={`faq-${i}`}
                  onClick={() => setAberta(estaAberta ? null : i)}
                  className="flex min-h-[52px] w-full items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <span className="text-[15px] font-semibold tracking-[-0.01em]">{item.q}</span>
                  <ChevronDown
                    className={
                      estaAberta
                        ? 'ios-rotulo-3 h-4 w-4 shrink-0 rotate-180 transition-transform duration-200'
                        : 'ios-rotulo-3 h-4 w-4 shrink-0 transition-transform duration-200'
                    }
                    aria-hidden
                  />
                </button>
              </h3>
              <div
                id={`faq-${i}`}
                className="grid transition-[grid-template-rows] duration-300 ease-out"
                style={{ gridTemplateRows: estaAberta ? '1fr' : '0fr' }}
              >
                <div className="min-h-0 overflow-hidden">
                  <p className="ios-rotulo-2 px-4 pb-4 text-[14px] leading-relaxed">{item.a}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ─────────────────────────── Estados auxiliares ─────────────────────────── */

/**
 * Barra de baixo até `lg`: é só a partir daí que o painel de compra fica
 * grudado na lateral. Ela só sobe quando o botão do painel sai da tela — dois
 * botões de comprar visíveis ao mesmo tempo é um botão sobrando.
 */
function BarraFixa({
  plano,
  preco,
  comprando,
  onComprar,
  visivel,
}: {
  plano: PlanoComPreco
  /** O mesmo preço do painel — com o benefício PROUNI/FIES, quando existe. */
  preco: PrecoApresentado
  comprando: boolean
  onComprar: () => void
  visivel: boolean
}) {
  return (
    <div
      className="ios-barra-inferior ios-vidro flex items-center gap-3 p-2 pl-4 lg:hidden"
      data-visivel={visivel ? 'true' : 'false'}
      aria-hidden={!visivel}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold">
          {plano.name} · {rotuloDoSegmento(plano)}
        </span>
        <span className="flex items-baseline gap-1.5 text-[15px] font-bold tabular-nums">
          {rotuloCurtoDePreco(preco)}
          {preco.descontoPercentual !== null && preco.descontoPercentual > 0 && (
            <span className="ios-ambar text-[12px] font-extrabold">−{preco.descontoPercentual}%</span>
          )}
        </span>
      </span>
      <button
        type="button"
        onClick={onComprar}
        disabled={comprando}
        tabIndex={visivel ? 0 : -1}
        className="buy-cta inline-flex h-11 shrink-0 items-center gap-1 rounded-full px-5 text-[15px] font-extrabold text-secondary-foreground disabled:opacity-60"
      >
        {comprando ? 'Abrindo…' : 'Assinar'}
        {!comprando && <ChevronRight className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  )
}

function AvisoDePagamento({
  nomeDoPlano,
  onDashboard,
}: {
  nomeDoPlano?: string
  onDashboard: () => void
}) {
  return (
    <div className="ios-lista venda-sobe mb-6 flex items-start gap-3 p-4 sm:p-5">
      <span className="venda-icone-linha h-10 w-10 rounded-full">
        <Check className="h-5 w-5" strokeWidth={3} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-semibold tracking-[-0.015em]">Pagamento aprovado</p>
        <p className="ios-rotulo-2 mt-1 text-[15px]">
          {nomeDoPlano ? `${nomeDoPlano} ativado` : 'Plano ativado'}. Bora dominar.
        </p>
        <button type="button" onClick={onDashboard} className="ios-botao ios-botao-p mt-3">
          Ir para o dashboard
        </button>
      </div>
    </div>
  )
}

function PlanoAtivo({
  sub,
  recorrente,
  userName,
  onPerfil,
}: {
  sub: any
  recorrente: boolean
  userName: string
  onPerfil: () => void
}) {
  const vitalicio = new Date(sub.expiresAt).getFullYear() >= 9999

  return (
    <section className="venda-sobe mx-auto max-w-xl pt-6 text-center">
      <span className="venda-icone-linha venda-icone-linha-ambar mx-auto h-12 w-12 rounded-2xl">
        <Crown className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="ios-titulo-produto mt-4">Você já tem a plataforma inteira.</h1>
      <p className="ios-rotulo-2 mt-2 text-[16px] leading-relaxed">
        {sub.label || 'Plus+'}
        {' · '}
        {vitalicio ? (
          <strong className="text-[color:var(--ios-rotulo)]">vitalício</strong>
        ) : (
          <>
            até{' '}
            <strong className="text-[color:var(--ios-rotulo)]">
              {new Date(sub.expiresAt).toLocaleDateString('pt-BR')}
            </strong>
          </>
        )}
        {recorrente && ' · renovação automática'}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={onPerfil} className="ios-botao">
          Gerenciar no perfil
        </button>
        <button
          type="button"
          onClick={() => {
            const msg = encodeURIComponent(
              `Olá! Sou ${userName} do DomineAqui e quero falar sobre meu plano.`
            )
            window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, '_blank')
          }}
          className="ios-botao-cinza"
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </button>
      </div>
    </section>
  )
}

function EsqueletoDeCarregamento() {
  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10" aria-hidden>
      <div className="space-y-3 lg:pt-6">
        <div className="ios-esqueleto h-10 w-11/12 rounded-xl" />
        <div className="ios-esqueleto h-10 w-3/4 rounded-xl" />
        <div className="ios-esqueleto h-16 w-full rounded-xl" />
      </div>
      <div className="ios-esqueleto h-[440px] w-full rounded-[28px]" />
    </div>
  )
}
