'use client'

/*
 * /buy — a página de venda dos planos.
 *
 * Três decisões de apresentação mandam em quase todo o arquivo:
 *
 * 1. O NÚMERO QUE LIDERA É O MENOR NÚMERO HONESTO. A página não abre com o
 *    total do período ("R$ 397,00", "R$ 327,00"): abre com o equivalente
 *    mensal, e mostra o total logo abaixo, sempre — esconder a cobrança real
 *    seria trocar susto por mentira. A conta toda vive em `lib/buy/pricing.ts`,
 *    com teste.
 *
 * 2. UMA TELA, UMA DECISÃO. A versão anterior tinha nove seções: abertura com
 *    dois botões, ficha de "a partir de", seletor com o preço inteiro repetido
 *    em cada aba, painel da oferta, comparativo, garantia em três passos,
 *    depoimentos, sete perguntas e um fechamento com o mesmo botão de novo. O
 *    mesmo preço aparecia quatro vezes antes de qualquer clique. Agora existe
 *    UM caminho: manchete curta → pastilhas de plano → painel com preço, botão
 *    e o que entra. Tudo o mais (comparativo, dúvidas) é conteúdo de apoio,
 *    recolhido, para quem for procurar.
 *
 * 3. NO CELULAR, PREÇO E BOTÃO VÊM ANTES DA LISTA. A coluna de compra é a
 *    primeira no DOM e vai para a direita só a partir de `lg`. Antes era
 *    preciso rolar onze benefícios para descobrir quanto custava.
 *
 * Nada nesta página inventa número: preço, preço "de", período e benefícios
 * saem do catálogo do admin; os depoimentos saem de /api/testimonials e a
 * seção some quando não há nenhum cadastrado.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  GraduationCap,
  Lock,
  MessageCircle,
  Minus,
  Plus,
  Shield,
  Undo2,
  UserCircle2,
} from 'lucide-react'
import { PlanConfig } from '@/lib/types'
import { AppShell } from '@/components/app-shell'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'
import { ProuniCta } from '@/components/prouni/prouni-cta'
import { PrecoEmDestaque } from '@/components/buy/preco-em-destaque'
import { DepoimentosDeCompra } from '@/components/buy/depoimentos'
import {
  apresentarPreco,
  chaveDeBeneficio,
  formatarBRL,
  normalizarMeses,
  rotuloCurtoDePreco,
  rotuloDeCiclo,
  rotuloDePeriodo,
  type PrecoApresentado,
} from '@/lib/buy/pricing'
import { useProuniGrant, type ProuniConcessaoNaTela } from '@/hooks/use-prouni-grant'
import { combineDiscountsWithProuni } from '@/lib/prouni-shared'

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

export default function BuyPage() {
  return (
    // `guestNotice={false}`: o aviso flutuante de visitante do AppShell fica
    // fixado no rodapé do celular, exatamente por cima da barra de compra. Aqui
    // ele é dito por dentro do painel, ao lado do botão, que é onde a
    // informação muda a decisão.
    <AppShell allowGuest guestNotice={false} headerTitle="Planos" headerSubtitle="Assinaturas DomineAqui">
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

  const catalogo = useMemo(() => plans.map(comPreco), [plans])

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

  const mostrarVenda = !loadingSub && !hasActiveSub && catalogo.length > 0

  return (
    <div className="surface-page min-h-full">
      <BarraSuperior onVoltar={() => router.back()} />

      <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 sm:px-6 sm:pt-7 lg:pb-16">
        {paymentSuccess && (
          <AvisoDePagamento
            nomeDoPlano={successPlanName}
            onDashboard={() => router.push('/dashboard')}
          />
        )}

        {!loadingSub && hasActiveSub && sub && (
          <PlanoAtivo
            sub={sub}
            recorrente={hasRecurringSub}
            userName={userName}
            onPerfil={() => router.push('/profile')}
          />
        )}

        {loadingSub && <EsqueletoDeCarregamento />}

        {mostrarVenda && (
          <>
            <Abertura />

            {catalogo.length > 1 && (
              <SeletorDePlanos
                planos={catalogo}
                selecionadoId={selecionado.id}
                onEscolher={setEscolhido}
              />
            )}

            {selecionado && (
              <PainelDaOferta
                key={selecionado.id}
                plano={selecionado}
                preco={oferta.preco ?? selecionado.preco}
                descontoProuni={oferta.desconto}
                rotuloProuni={prouniGrant?.discountLabel || ''}
                emAbas={catalogo.length > 1}
                visitante={isGuest}
                comprando={selecting === selecionado.id}
                onComprar={() => handleSelect(selecionado)}
              />
            )}

            {catalogo.length > 1 && <Comparativo planos={catalogo} />}

            <DepoimentosDeCompra />
          </>
        )}

        {!loadingSub && <Faq plano={selecionado} />}

        <p className="mt-10 text-center text-[13px] text-muted-foreground">
          Ficou alguma dúvida?{' '}
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Chama no WhatsApp
          </a>
          {' '}— responde gente, não robô.
        </p>
      </div>

      {mostrarVenda && selecionado && (
        <BarraFixa
          plano={selecionado}
          preco={oferta.preco ?? selecionado.preco}
          comprando={selecting === selecionado.id}
          onComprar={() => handleSelect(selecionado)}
        />
      )}
    </div>
  )
}

/* ─────────────────────────── Topo ─────────────────────────── */

function BarraSuperior({ onVoltar }: { onVoltar: () => void }) {
  return (
    <div className="border-b border-border bg-card/60">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5 sm:px-6">
        <button
          type="button"
          onClick={onVoltar}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        {/* O AppShell já escreve "Planos" no cabeçalho; repetir aqui só
            gastaria a linha. Ela vale mais como selo de segurança, que é a
            informação que falta bem na hora de decidir pagar. */}
        <span className="inline-flex min-w-0 flex-1 items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
          <Lock className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          <span className="truncate">Checkout seguro · Mercado Pago</span>
        </span>
        <ThemeToggle className="sm:hidden" />
      </div>
    </div>
  )
}

/* ─────────────────────────── Abertura ─────────────────────────── */

const SELOS = [
  { icone: Shield, texto: 'Mercado Pago' },
  { icone: Clock, texto: 'Acesso na hora' },
  { icone: Undo2, texto: '7 dias de garantia' },
]

/**
 * Abertura sem botão: o preço e o "Assinar" estão a um palmo daqui (e, no
 * celular, também na barra fixa). Um botão que só rola a página é um clique
 * cobrado para não entregar nada.
 */
function Abertura() {
  return (
    <section className="pt-4 sm:pt-6">
      <h1
        className="max-w-2xl font-heading text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-foreground sm:text-[2.25rem] lg:text-[2.5rem]"
        style={{ overflowWrap: 'anywhere' }}
      >
        O problema nunca foi falta de material.
      </h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
        Foi ter tudo espalhado. Aqui os manuais, os resumos, as provas antigas, os
        flashcards e a IA ficam no mesmo lugar — do jeito que dá pra estudar na véspera.
      </p>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-semibold text-muted-foreground sm:text-xs">
        {SELOS.map(({ icone: Icone, texto }) => (
          <li key={texto} className="inline-flex items-center gap-1.5">
            <Icone className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            {texto}
          </li>
        ))}
      </ul>
    </section>
  )
}

const BOTAO_PRIMARIO =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-secondary-foreground shadow-md shadow-secondary/25 transition hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60'

/* ─────────────────────────── Seletor ─────────────────────────── */

/**
 * Pastilhas, não cartões. Cada aba mostra o mínimo para escolher — período,
 * nome e a mensalidade — porque o preço inteiro (total, diário, preço "de")
 * já aparece no painel logo abaixo. Repetir o bloco de preço em cada aba era
 * mostrar o mesmo dinheiro quatro vezes antes do primeiro clique.
 */
function SeletorDePlanos({
  planos,
  selecionadoId,
  onEscolher,
}: {
  planos: PlanoComPreco[]
  selecionadoId: string
  onEscolher: (id: string) => void
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  /**
   * Setas navegam entre as abas, como manda o padrão de tablist. Sem isso quem
   * usa teclado precisa dar Tab por dentro do painel para chegar na aba
   * seguinte.
   */
  function aoTeclar(evento: React.KeyboardEvent, indice: number) {
    const passo = evento.key === 'ArrowRight' ? 1 : evento.key === 'ArrowLeft' ? -1 : 0
    if (passo === 0) return
    evento.preventDefault()
    const proximo = planos[(indice + passo + planos.length) % planos.length]
    onEscolher(proximo.id)
    refs.current[proximo.id]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label="Planos disponíveis"
      className={cn(
        // Sangria até a borda no celular: o próximo plano fica cortado na
        // lateral, que é a dica de "dá para arrastar".
        '-mx-4 mt-6 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:overflow-visible sm:px-0',
        planos.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'
      )}
    >
      {planos.map((plano, indice) => {
        const ativo = plano.id === selecionadoId
        return (
          <button
            key={plano.id}
            ref={(el) => {
              refs.current[plano.id] = el
            }}
            type="button"
            role="tab"
            id={`aba-${plano.id}`}
            aria-selected={ativo}
            aria-controls="oferta"
            tabIndex={ativo ? 0 : -1}
            onKeyDown={(e) => aoTeclar(e, indice)}
            onClick={() => onEscolher(plano.id)}
            className={cn(
              'group relative w-[62vw] shrink-0 snap-start rounded-xl border px-3.5 py-3 text-left transition sm:w-auto',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              ativo
                ? 'border-secondary bg-secondary/10 shadow-sm ring-1 ring-secondary/25'
                : 'border-border bg-card hover:border-secondary/40 hover:bg-muted/40'
            )}
          >
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  'font-clinical text-[10px] font-bold uppercase tracking-[0.14em]',
                  ativo ? 'text-secondary' : 'text-muted-foreground'
                )}
              >
                {plano.periodoRotulo}
              </span>
              {plano.badge && (
                <span className="truncate rounded bg-secondary/15 px-1.5 py-px text-[9px] font-black uppercase tracking-wide text-secondary">
                  {plano.badge}
                </span>
              )}
              {ativo && <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-secondary" aria-hidden />}
            </span>
            <span className="mt-1 block truncate text-sm font-bold text-foreground">
              {plano.name}
            </span>
            <span className="mt-0.5 block font-clinical text-[13px] font-semibold tabular-nums text-muted-foreground">
              {rotuloCurtoDePreco(plano.preco)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ─────────────────────────── Oferta ─────────────────────────── */

/**
 * O preço do plano já com o benefício PROUNI/FIES desta conta.
 *
 * A conta é a MESMA de `/api/payments/orders` — `combineDiscountsWithProuni`,
 * importada dos dois lados justamente para que a página não possa divergir de
 * quem cobra. Aqui ela só serve para a tela dizer a verdade antes do clique.
 *
 * O "de" passa a ser o preço de tabela do plano, porque é ele que dimensiona o
 * benefício para quem o recebeu. O `precoOriginal` do catálogo continua sendo o
 * âncora nas pastilhas e no comparativo, onde os planos aparecem sem conta.
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

function PainelDaOferta({
  plano,
  preco,
  descontoProuni,
  rotuloProuni,
  emAbas,
  visitante,
  comprando,
  onComprar,
}: {
  plano: PlanoComPreco
  /** Já com o benefício PROUNI/FIES, quando existe. */
  preco: PrecoApresentado
  descontoProuni: number
  rotuloProuni: string
  /** Com um plano só não existe seletor — e sem seletor não pode haver
   *  `role="tabpanel"`, senão o painel aponta `aria-labelledby` para uma aba
   *  que não está no documento. */
  emAbas: boolean
  visitante: boolean
  comprando: boolean
  onComprar: () => void
}) {
  const [tudoAberto, setTudoAberto] = useState(false)

  const semanticaDeAba = emAbas
    ? ({ role: 'tabpanel', 'aria-labelledby': `aba-${plano.id}`, tabIndex: 0 } as const)
    : {}

  // Truncar para revelar um item só seria pior do que não truncar.
  const truncavel = plano.features.length > BENEFICIOS_VISIVEIS + 1
  const visiveis =
    truncavel && !tudoAberto ? plano.features.slice(0, BENEFICIOS_VISIVEIS) : plano.features
  const ocultos = plano.features.length - visiveis.length

  return (
    <div
      id="oferta"
      {...semanticaDeAba}
      className="buy-panel-in mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]"
    >
      {/* Coluna da compra. Primeira no DOM: no celular, preço e botão vêm
          antes da lista. A partir de `lg` ela vai para a direita. */}
      <div className="border-b border-border bg-muted/30 p-5 sm:p-6 lg:order-2 lg:border-b-0 lg:border-l">
        <div className="lg:sticky lg:top-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-primary/10 px-2 py-0.5 font-clinical text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              {plano.periodoRotulo}
            </span>
            {plano.badge && (
              <span className="rounded-md border border-secondary/35 bg-secondary/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-secondary">
                {plano.badge}
              </span>
            )}
          </div>

          <h2 className="mt-2 font-heading text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
            {plano.name}
          </h2>

          <div className="mt-4">
            <PrecoEmDestaque preco={preco} />
          </div>

          {descontoProuni > 0 && (
            <p className="mt-2 flex items-start gap-1.5 text-[13px] font-semibold leading-snug text-emerald-600 dark:text-emerald-400">
              <GraduationCap className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                Seu desconto ProUni/FIES{rotuloProuni ? ` de ${rotuloProuni}` : ''} já está neste valor
                {plano.meses > 0 ? ' — o checkout abre no pagamento único, que é onde ele vale' : ''}.
              </span>
            </p>
          )}

          <button
            type="button"
            onClick={onComprar}
            disabled={comprando}
            className={cn(BOTAO_PRIMARIO, 'mt-5 w-full py-4 text-base')}
          >
            {comprando ? 'Abrindo checkout…' : 'Assinar agora'}
            {!comprando && <ChevronRight className="h-4 w-4" />}
          </button>

          <ProuniCta itemType="plus" itemId={plano.id} className="mt-3" />

          <p className="mt-3 flex items-start gap-2 text-[12px] font-semibold leading-snug text-primary">
            <Undo2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            7 dias para testar. Não serviu, devolvemos 100%.
          </p>

          {/* Duas linhas, não cinco: o que sai do bolso e o que acontece
              depois. O resto (criptografia, e-mail de liberação) está nas
              dúvidas, que é onde alguém vai procurar por isso. */}
          <p className="mt-3 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
            Pix, cartão ou boleto pelo Mercado Pago.{' '}
            {plano.meses === 0
              ? 'Pagamento único: não existe renovação para cancelar.'
              : `Renova a cada ${rotuloDeCiclo(plano.meses)} e você cancela quando quiser.`}
          </p>

          {visitante && (
            <p className="mt-2 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
              <UserCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              <span>
                Você está como visitante: o acesso vai por e-mail.{' '}
                <a
                  href="/auth/login?redirect=%2Fbuy"
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Entrar na conta
                </a>{' '}
                para cair direto nela.
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Coluna do valor: o que a pessoa leva. */}
      <div className="p-5 sm:p-6 lg:order-1">
        {plano.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{plano.description}</p>
        )}

        {plano.features.length > 0 && (
          <>
            <p
              className={cn(
                'font-clinical text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground',
                plano.description ? 'mt-5' : ''
              )}
            >
              O que abre no dia do pagamento
            </p>

            {/* Sem divisórias e em duas colunas no tablet: onze linhas
                separadas por régua viravam parede. O check à esquerda diz o
                que a régua não dizia — que tudo ali está incluso. */}
            <ul className="mt-3 grid gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-1">
              {visiveis.map((beneficio, i) => (
                <li key={`${beneficio}-${i}`} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0 text-[13px] leading-snug text-foreground sm:text-sm">
                    {beneficio}
                  </span>
                </li>
              ))}
            </ul>

            {truncavel && (
              <button
                type="button"
                onClick={() => setTudoAberto((v) => !v)}
                aria-expanded={tudoAberto}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-[13px] font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
              >
                {tudoAberto ? (
                  <>
                    <Minus className="h-3.5 w-3.5 text-secondary" aria-hidden /> Mostrar menos
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5 text-secondary" aria-hidden />
                    Ver os outros {ocultos} itens
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────── Comparativo ─────────────────────────── */

/**
 * Tabela lado a lado, montada a partir da união dos benefícios que o admin
 * digitou. Os textos são normalizados (`chaveDeBeneficio`) antes de casar as
 * linhas, senão uma diferença de caixa ou acento criaria duas linhas para o
 * mesmo benefício.
 *
 * Vem fechada. É conferência, não argumento: quem já escolheu não precisa
 * rolar uma tabela inteira para chegar às dúvidas.
 */
function Comparativo({ planos }: { planos: PlanoComPreco[] }) {
  const [aberto, setAberto] = useState(false)

  const linhas = useMemo(() => {
    const mapa = new Map<string, { rotulo: string; tem: Set<string> }>()
    for (const plano of planos) {
      for (const beneficio of plano.features) {
        const chave = chaveDeBeneficio(beneficio)
        if (!chave) continue
        const atual = mapa.get(chave)
        if (atual) atual.tem.add(plano.id)
        else mapa.set(chave, { rotulo: beneficio, tem: new Set([plano.id]) })
      }
    }
    return Array.from(mapa.values())
  }, [planos])

  if (linhas.length === 0) return null

  return (
    <section className="mt-8">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls="comparativo"
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left shadow-sm transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-5"
      >
        <span className="min-w-0">
          <span className="block text-sm font-bold text-foreground">
            Comparar os {planos.length} planos, lado a lado
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            A lista de cada um, empilhada. O que está com traço não entra.
          </span>
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-secondary transition-transform duration-200',
            aberto && 'rotate-180'
          )}
          aria-hidden
        />
      </button>

      {aberto && (
        /* `relative` não é enfeite: os rótulos `sr-only` das células são
           `position: absolute`, e sem um ancestral posicionado aqui eles se
           resolvem contra o viewport — escapam do recorte deste contêiner e
           empurram a página inteira 153px para o lado no celular de 320px. */
        <div
          id="comparativo"
          className="relative mt-3 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm"
        >
          <table className="w-full min-w-[520px] border-collapse text-left">
            <caption className="sr-only">Comparação de benefícios entre os planos</caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="px-4 py-4 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:px-5">
                  Benefício
                </th>
                {planos.map((plano) => (
                  <th key={plano.id} scope="col" className="w-32 px-3 py-4 align-bottom sm:w-36">
                    {/* O período vai no cabeçalho porque o mesmo produto pode
                        estar à venda em dois prazos: sem ele, duas colunas
                        vizinhas se chamariam "DomineAqui Plus+". */}
                    <span className="block font-clinical text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      {plano.periodoRotulo}
                    </span>
                    <span className="mt-0.5 block text-sm font-bold leading-tight text-foreground">
                      {plano.name}
                    </span>
                    <span className="mt-1 block font-clinical text-[11px] tabular-nums text-secondary">
                      {rotuloCurtoDePreco(plano.preco)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha) => (
                <tr key={linha.rotulo} className="border-b border-border last:border-b-0">
                  <th
                    scope="row"
                    className="px-4 py-3 text-[13px] font-medium leading-snug text-foreground sm:px-5"
                  >
                    {linha.rotulo}
                  </th>
                  {planos.map((plano) => {
                    const incluso = linha.tem.has(plano.id)
                    return (
                      // O ícone é decorativo e o estado vai num texto invisível:
                      // `aria-label` em <svg> não é anunciado de forma confiável,
                      // e uma célula muda é uma célula sem resposta no leitor.
                      <td key={plano.id} className="px-3 py-3 text-center">
                        {incluso ? (
                          <Check className="mx-auto h-4 w-4 text-primary" aria-hidden />
                        ) : (
                          <Minus className="mx-auto h-4 w-4 text-muted-foreground" aria-hidden />
                        )}
                        <span className="sr-only">{incluso ? 'Incluso' : 'Não incluso'}</span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

/* ─────────────────────────── Dúvidas ─────────────────────────── */

/**
 * Cinco perguntas, não sete: cada uma responde uma coisa que muda a decisão.
 * As respostas mudam com o plano aberto — dizer "renova a cada 12 meses" numa
 * página que está mostrando o plano vitalício é o tipo de detalhe errado que
 * derruba a confiança bem na hora de pagar.
 */
function perguntasDoPlano(plano?: PlanoComPreco) {
  const nome = plano?.name || 'o plano'
  const preco = plano?.preco

  const cobranca = !plano
    ? 'A cobrança e a renovação aparecem no checkout antes de você confirmar qualquer coisa.'
    : plano.meses === 0
      ? `${nome} é pagamento único: R$ ${formatarBRL(preco!.total)} uma vez, sem renovação e sem mensalidade escondida.`
      : `${nome} é cobrado em R$ ${formatarBRL(preco!.total)} a cada ${rotuloDeCiclo(plano.meses)}${
          preco?.mensal != null
            ? ` — o que dá R$ ${formatarBRL(preco.mensal)} por mês de acesso`
            : ''
        }. A renovação é automática pelo Mercado Pago e você cancela quando quiser, sem multa e sem ligar para ninguém, mantendo o acesso até o fim do período já pago.`

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
      q: 'Entra tudo de uma vez mesmo?',
      a: 'Entra. Não existe versão capada nem liberação em etapas: no dia do pagamento você abre todos os itens da lista acima.',
    },
    {
      q: 'Dá para testar antes de pagar?',
      a: 'Dá. Novos usuários têm 7 dias gratuitos para conhecer a plataforma antes de decidir qualquer coisa. Bolsista PROUNI ou FIES: quando há benefício ativo para o plano, aparece um botão de solicitação logo abaixo do preço.',
    },
  ]
}

function Faq({ plano }: { plano?: PlanoComPreco }) {
  const [aberta, setAberta] = useState<number | null>(null)
  const perguntas = useMemo(() => perguntasDoPlano(plano), [plano])

  return (
    <section className="mt-8">
      <h2 className="font-heading text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
        Dúvidas que chegam antes de assinar
      </h2>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {perguntas.map((item, i) => {
          const estaAberta = aberta === i
          return (
            <div key={item.q} className="border-b border-border last:border-b-0">
              <h3>
                <button
                  type="button"
                  aria-expanded={estaAberta}
                  aria-controls={`faq-${i}`}
                  onClick={() => setAberta(estaAberta ? null : i)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5"
                >
                  <span className="text-sm font-semibold text-foreground">{item.q}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-secondary transition-transform duration-200',
                      estaAberta && 'rotate-180'
                    )}
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
                  <p className="px-4 pb-4 text-[13px] leading-relaxed text-muted-foreground sm:px-5 sm:text-sm">
                    {item.a}
                  </p>
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
 * Barra fixa até `lg`: é só a partir daí que a coluna de compra fica grudada
 * na lateral. No tablet em retrato o botão do painel some da tela do mesmo
 * jeito que no celular — e um botão que sumiu é um botão que não converte.
 */
function BarraFixa({
  plano,
  preco,
  comprando,
  onComprar,
}: {
  plano: PlanoComPreco
  /** O mesmo preço do painel — com o benefício PROUNI/FIES, quando existe. */
  preco: PrecoApresentado
  comprando: boolean
  onComprar: () => void
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
      <button
        type="button"
        onClick={onComprar}
        disabled={comprando}
        className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 rounded-xl bg-secondary px-4 py-3.5 text-left text-secondary-foreground shadow-lg shadow-secondary/25 transition active:scale-[0.99] disabled:opacity-60"
      >
        <span className="min-w-0">
          <span className="block truncate text-[10px] font-black uppercase tracking-wide opacity-85">
            {plano.name}
          </span>
          <span className="block truncate text-base font-bold tabular-nums">
            {rotuloCurtoDePreco(preco)}
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold">
          {comprando ? 'Abrindo…' : 'Assinar'}
          {!comprando && <ChevronRight className="h-4 w-4" />}
        </span>
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
    <div className="mt-5 flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4 sm:p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Check className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-heading text-lg font-semibold text-foreground">Pagamento aprovado</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {nomeDoPlano ? `${nomeDoPlano} ativado` : 'Plano ativado'}. Bora dominar.
        </p>
        <button
          type="button"
          onClick={onDashboard}
          className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
        >
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
    <div className="mt-5 flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">Você já tem um plano ativo</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {sub.label || (sub.type === 'trial' ? 'Trial' : 'Plus+')}
          {sub.planType ? ` (${sub.planType})` : ''}
          {' · '}
          {vitalicio ? (
            <strong className="text-foreground">vitalício</strong>
          ) : (
            <>
              até{' '}
              <strong className="text-foreground">
                {new Date(sub.expiresAt).toLocaleDateString('pt-BR')}
              </strong>
            </>
          )}
          {recorrente && <span className="ml-1 text-xs text-primary">· renovação automática</span>}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onPerfil}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
          >
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
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}

function EsqueletoDeCarregamento() {
  return (
    <div className="pt-4 sm:pt-6" aria-hidden>
      <div className="space-y-3">
        <div className="h-8 w-4/5 animate-pulse rounded-lg bg-muted sm:h-10" />
        <div className="h-14 w-full animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="mt-6 h-[420px] w-full animate-pulse rounded-2xl bg-muted lg:h-[360px]" />
    </div>
  )
}
