'use client'

/*
 * /buy — a página de venda dos planos.
 *
 * Duas decisões de apresentação mandam em quase todo o arquivo:
 *
 * 1. O NÚMERO QUE LIDERA É O MENOR NÚMERO HONESTO. Antes a página abria com o
 *    total do período em corpo 32 ("R$ 397,00", "R$ 327,00") e escondia o
 *    equivalente mensal numa linha cinza de 12px. É o enquadramento que mais
 *    afasta: R$ 327 assusta, R$ 54,50 por mês não. Agora o mensal (e o diário,
 *    quando o período é longo) lidera, e o total aparece logo abaixo, sempre —
 *    esconder a cobrança real seria trocar susto por mentira. A conta toda vive
 *    em `lib/buy/pricing.ts`, com teste.
 *
 * 2. /buy VENDE MAIS DE UM PRODUTO. Plus+ e Quest não são degraus da mesma
 *    escada: são produtos diferentes, para gente em momentos diferentes. Por
 *    isso a página não é uma grade de cards concorrendo entre si — é um seletor
 *    no topo e UM painel de oferta por vez, com o comparativo lado a lado logo
 *    depois para quem quiser conferir a diferença. Com um plano só cadastrado,
 *    o seletor e o comparativo somem sozinhos e sobra o painel.
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
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Lock,
  Mail,
  MessageCircle,
  Minus,
  Shield,
  Undo2,
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
  rotuloDeCiclo,
  rotuloDePeriodo,
  type PrecoApresentado,
} from '@/lib/buy/pricing'

const WHATSAPP = '5524992230908'

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
    <AppShell allowGuest headerTitle="Planos" headerSubtitle="Assinaturas DomineAqui">
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
   * clica — assim a recarga do catálogo não joga a escolha dela fora.
   */
  const padrao = useMemo(
    () => catalogo.find((p) => p.highlighted) || catalogo[0],
    [catalogo]
  )
  const selecionado = useMemo(
    () => catalogo.find((p) => p.id === escolhido) || padrao,
    [catalogo, escolhido, padrao]
  )

  /** Para o "a partir de" do topo: a menor mensalidade equivalente do catálogo. */
  const maisBarato = useMemo(() => {
    if (catalogo.length === 0) return undefined
    return catalogo.reduce((menor, atual) =>
      atual.preco.chamada.valor < menor.preco.chamada.valor ? atual : menor
    )
  }, [catalogo])

  const successPlanName = useMemo(
    () => plans.find((p) => p.id === successPlan)?.name,
    [plans, successPlan]
  )

  const mostrarVenda = !loadingSub && !hasActiveSub && catalogo.length > 0

  return (
    <div className="surface-page min-h-full">
      <BarraSuperior onVoltar={() => router.back()} />

      <div className="mx-auto max-w-6xl px-4 pb-32 pt-6 sm:px-6 sm:pb-20 sm:pt-10">
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

        {mostrarVenda && (
          <Abertura
            maisBarato={maisBarato}
            planoUnico={catalogo.length === 1 ? catalogo[0] : null}
            onComprar={handleSelect}
            comprando={selecting}
          />
        )}

        {loadingSub && <EsqueletoDeCarregamento />}

        {mostrarVenda && (
          <>
            <section id="planos" className="scroll-mt-20 pt-14 sm:pt-20">
              <h2 className="font-heading text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
                Escolha o seu.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {catalogo.length > 1
                  ? 'Não são degraus da mesma escada. São produtos diferentes, para gente em momento diferente — abre um e veja tudo o que entra nele.'
                  : 'Um plano, sem pegadinha de letra miúda. Veja exatamente o que entra nele.'}
              </p>

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
                  emAbas={catalogo.length > 1}
                  comprando={selecting === selecionado.id}
                  onComprar={() => handleSelect(selecionado)}
                />
              )}
            </section>

            {catalogo.length > 1 && <Comparativo planos={catalogo} />}

            <Garantia />

            <DepoimentosDeCompra />

            <Faq plano={selecionado} />

            <Fechamento
              plano={selecionado}
              comprando={selecting === selecionado?.id}
              onComprar={() => selecionado && handleSelect(selecionado)}
            />
          </>
        )}

        {!mostrarVenda && !loadingSub && <Faq plano={selecionado} />}

        <p className="mt-12 text-center text-sm text-muted-foreground">
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
        <BarraFixaMobile
          plano={selecionado}
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
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
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

function Abertura({
  maisBarato,
  planoUnico,
  onComprar,
  comprando,
}: {
  maisBarato?: PlanoComPreco
  planoUnico: PlanoComPreco | null
  onComprar: (plan: Plan) => void
  comprando: string | null
}) {
  function irParaPlanos() {
    const alvo = document.getElementById('planos')
    if (!alvo) return
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    alvo.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'start' })
  }

  return (
    <section className="pt-8 sm:pt-10">
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
        <div className="min-w-0">
          <h1
            className="font-heading text-[2rem] font-semibold leading-[1.08] tracking-tight text-foreground sm:text-[2.75rem] lg:text-[3.25rem]"
            style={{ overflowWrap: 'anywhere' }}
          >
            O problema nunca foi falta de material.
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            Foi ter tudo espalhado: o PDF no Drive, o resumo no caderno, a prova antiga
            perdida no grupo do WhatsApp. O que você assina aqui não é mais um arquivo —
            é o lugar onde tudo isso finalmente fica junto, do jeito que dá pra estudar
            na véspera.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            {planoUnico ? (
              <button
                type="button"
                onClick={() => onComprar(planoUnico)}
                disabled={comprando === planoUnico.id}
                className={BOTAO_PRIMARIO}
              >
                {comprando === planoUnico.id
                  ? 'Abrindo checkout…'
                  : rotuloDeBotao('Quero o', planoUnico.name, 'Quero este plano')}
                <ArrowRight className="h-4 w-4 shrink-0" />
              </button>
            ) : (
              <button type="button" onClick={irParaPlanos} className={BOTAO_PRIMARIO}>
                Ver os planos
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            <a
              href="#garantia"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
            >
              <Undo2 className="h-4 w-4 text-primary" />
              Como funciona a garantia
            </a>
          </div>

          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-muted-foreground">
            {[
              { icone: Shield, texto: 'Pagamento pelo Mercado Pago' },
              { icone: Clock, texto: 'Acesso liberado na hora' },
              { icone: Undo2, texto: '7 dias para desistir' },
            ].map(({ icone: Icone, texto }) => (
              <li key={texto} className="inline-flex items-center gap-1.5">
                <Icone className="h-3.5 w-3.5 shrink-0 text-primary" />
                {texto}
              </li>
            ))}
          </ul>
        </div>

        {maisBarato && (
          <aside className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="h-1 w-full bg-secondary" aria-hidden />
            <div className="p-5 sm:p-6">
              <p className="font-clinical text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">
                A partir de
              </p>
              <div className="mt-3">
                <PrecoEmDestaque preco={maisBarato.preco} escala="ficha" />
              </div>
              <p className="mt-4 border-t border-border pt-4 text-[13px] leading-relaxed text-muted-foreground">
                Valor do <strong className="font-semibold text-foreground">{maisBarato.name}</strong>{' '}
                ({maisBarato.periodoRotulo.toLowerCase()}). Pix, cartão ou boleto — e dá pra
                cancelar quando quiser.
              </p>
            </div>
          </aside>
        )}
      </div>
    </section>
  )
}

/**
 * Nomear o produto no botão vende melhor ("Quero o Quest+" > "Quero este
 * plano"), mas o nome vem do admin e pode ser longo. Acima de ~20 caracteres
 * o rótulo quebra em duas linhas num celular de 320px, e botão de duas linhas
 * é o tipo de detalhe que faz a página parecer quebrada bem na hora de pagar.
 */
function rotuloDeBotao(prefixo: string, nome: string, alternativa: string): string {
  const completo = `${prefixo} ${nome}`
  return completo.length > 20 ? alternativa : completo
}

const BOTAO_PRIMARIO =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-secondary-foreground shadow-md shadow-secondary/25 transition hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60'

/* ─────────────────────────── Seletor ─────────────────────────── */

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
   * usa teclado precisa dar Tab por dentro de cada painel para chegar na aba
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
        '-mx-4 mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:overflow-visible sm:px-0',
        // Com dois planos, três colunas deixariam um buraco à direita.
        planos.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'
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
              'group relative w-[78vw] shrink-0 snap-start rounded-2xl border bg-card p-4 text-left transition sm:w-auto',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              ativo
                ? 'border-secondary shadow-md shadow-secondary/15 ring-1 ring-secondary/25'
                : 'border-border shadow-sm hover:border-secondary/40 hover:bg-muted/40'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-clinical text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  {plano.periodoRotulo}
                </p>
                <p className="mt-0.5 truncate text-sm font-bold text-foreground">{plano.name}</p>
              </div>
              {plano.badge && (
                <span className="shrink-0 rounded-md border border-secondary/35 bg-secondary/15 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-secondary">
                  {plano.badge}
                </span>
              )}
            </div>

            <div className="mt-3">
              <PrecoEmDestaque preco={plano.preco} escala="card" />
            </div>

            <span
              className={cn(
                'mt-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide transition',
                ativo ? 'text-secondary' : 'text-muted-foreground group-hover:text-foreground'
              )}
            >
              {ativo ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Aberto abaixo
                </>
              ) : (
                <>
                  Ver o que entra <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ─────────────────────────── Oferta ─────────────────────────── */

function PainelDaOferta({
  plano,
  emAbas,
  comprando,
  onComprar,
}: {
  plano: PlanoComPreco
  /** Com um plano só não existe seletor — e sem seletor não pode haver
   *  `role="tabpanel"`, senão o painel aponta `aria-labelledby` para uma aba
   *  que não está no documento. */
  emAbas: boolean
  comprando: boolean
  onComprar: () => void
}) {
  const semanticaDeAba = emAbas
    ? ({ role: 'tabpanel', 'aria-labelledby': `aba-${plano.id}`, tabIndex: 0 } as const)
    : {}

  return (
    <div
      id="oferta"
      {...semanticaDeAba}
      className="buy-panel-in mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        {/* Coluna do valor: o que a pessoa leva. */}
        <div className="border-b border-border p-5 sm:p-7 lg:border-b-0 lg:border-r">
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

          <h3 className="mt-3 font-heading text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[1.75rem]">
            {plano.name}
          </h3>
          {plano.description && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{plano.description}</p>
          )}

          {plano.features.length > 0 && (
            <>
              <p className="mt-6 font-clinical text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                O que abre no dia do pagamento
              </p>
              {/* Lista numerada de propósito: o benefício de cada linha importa,
                  mas a contagem também — "são 12 coisas" é informação. Sem
                  ícone de "incluso" ao lado: numa lista que só tem o que ESTÁ
                  incluso, o check não informa nada e só deixa a coluna com
                  cara de card de preço genérico. */}
              <ol className="mt-3 divide-y divide-border border-y border-border">
                {plano.features.map((beneficio, i) => (
                  <li key={`${beneficio}-${i}`} className="flex items-start gap-3 py-2.5">
                    <span className="mt-px w-6 shrink-0 font-clinical text-[11px] font-semibold tabular-nums text-secondary">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 text-[13px] leading-snug text-foreground sm:text-sm">
                      {beneficio}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-muted-foreground">
                {plano.features.length}{' '}
                {plano.features.length === 1 ? 'item incluso' : 'itens inclusos'} — todos liberados
                de uma vez, não em etapas.
              </p>
            </>
          )}
        </div>

        {/* Coluna da compra: preço, botão, garantia, meios de pagamento. */}
        <div className="bg-muted/30 p-5 sm:p-7">
          <div className="lg:sticky lg:top-6">
            <PrecoEmDestaque preco={plano.preco} escala="painel" />

            <button
              type="button"
              onClick={onComprar}
              disabled={comprando}
              className={cn(BOTAO_PRIMARIO, 'mt-6 w-full py-4 text-base')}
            >
              {comprando ? 'Abrindo checkout…' : 'Assinar agora'}
              {!comprando && <ChevronRight className="h-4 w-4" />}
            </button>

            <ProuniCta itemType="plus" itemId={plano.id} className="mt-3" />

            <div className="mt-4 flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-3 text-[12px] font-semibold leading-snug text-primary">
              <Undo2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              7 dias para testar. Não serviu, devolvemos 100% — sem perguntas.
            </div>

            <ul className="mt-4 space-y-2 text-[11px] leading-snug text-muted-foreground">
              <li className="flex items-start gap-2">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                Pix, cartão ou boleto, processados pelo Mercado Pago. Seus dados de cartão não
                passam por aqui.
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                Acesso liberado automaticamente no seu e-mail assim que o pagamento é aprovado.
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                {plano.meses === 0
                  ? 'Pagamento único: não existe renovação para cancelar.'
                  : `Renova sozinho a cada ${rotuloDeCiclo(plano.meses)}. Cancele quando quiser e use até o fim do período pago.`}
              </li>
            </ul>
          </div>
        </div>
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
 */
function Comparativo({ planos }: { planos: PlanoComPreco[] }) {
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
    <section className="mt-14 sm:mt-20">
      <h2 className="font-heading text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
        Qual é a diferença, lado a lado.
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        A mesma lista de cada plano, empilhada. O que está com traço não entra naquele plano.
        {planos.length > 1 && (
          <span className="sm:hidden"> Arraste a tabela para o lado para ver as outras colunas.</span>
        )}
      </p>

      {/* `relative` não é enfeite: os rótulos `sr-only` das células são
          `position: absolute`, e sem um ancestral posicionado aqui eles se
          resolvem contra o viewport — escapam do recorte deste contêiner e
          empurram a página inteira 153px para o lado no celular de 320px. */}
      <div className="relative mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[520px] border-collapse text-left">
          <caption className="sr-only">Comparação de benefícios entre os planos</caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="px-4 py-4 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:px-5">
                Benefício
              </th>
              {planos.map((plano) => (
                <th key={plano.id} scope="col" className="w-32 px-3 py-4 align-bottom sm:w-36">
                  <span className="block text-sm font-bold leading-tight text-foreground">
                    {plano.name}
                  </span>
                  <span className="mt-1 block font-clinical text-[11px] tabular-nums text-secondary">
                    R$ {formatarBRL(plano.preco.chamada.valor)}
                    {plano.preco.chamada.unidade === 'unico' ? ' único' : '/mês'}
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
    </section>
  )
}

/* ─────────────────────────── Garantia ─────────────────────────── */

const PASSOS_DA_GARANTIA = [
  {
    titulo: 'Assina e usa tudo',
    texto: 'Sem versão capada, sem “libera em 30 dias”. O plano inteiro abre no pagamento.',
  },
  {
    titulo: 'Não serviu? Fala com a gente',
    texto: 'Uma mensagem no WhatsApp dentro dos 7 dias corridos. Não precisa justificar.',
  },
  {
    titulo: 'Devolvemos 100%',
    texto: 'O valor cheio volta pelo mesmo meio de pagamento. Sem burocracia e sem multa.',
  },
]

function Garantia() {
  return (
    <section id="garantia" className="mt-14 scroll-mt-20 sm:mt-20">
      <div className="overflow-hidden rounded-2xl border border-primary/25 bg-primary/[0.06]">
        <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
          <div className="min-w-0">
            <h2 className="font-heading text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
              Você não decide agora. Decide em 7 dias.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              O risco de assinar é nosso, não seu. Você entra, usa como se já fosse
              assinante antigo, e só depois decide se ficou de pé.
            </p>
          </div>

          <ol className="min-w-0 divide-y divide-primary/20 border-y border-primary/20">
            {PASSOS_DA_GARANTIA.map((passo, i) => (
              <li key={passo.titulo} className="flex items-start gap-4 py-4">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary font-clinical text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">{passo.titulo}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                    {passo.texto}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── FAQ ─────────────────────────── */

/**
 * As perguntas mudam com o plano aberto: dizer "renova a cada 12 meses" numa
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
        }. A renovação é automática pelo Mercado Pago e você pode cancelar quando quiser.`

  return [
    {
      q: `Por que o preço aparece como “por mês” se a cobrança é de uma vez?`,
      a: `Porque as duas informações importam: o mês é o custo real do acesso, a cobrança é o que sai do seu bolso na hora. ${cobranca}`,
    },
    {
      q: 'Posso cancelar a qualquer momento?',
      a: 'Sim, sem multa e sem ligar para ninguém. Você mantém o acesso até o fim do período que já pagou.',
    },
    {
      q: 'Tem garantia mesmo?',
      a: 'Tem. São 7 dias corridos após a compra para testar sem compromisso. Se não for pra você, devolvemos 100% do valor, sem perguntas e sem burocracia.',
    },
    {
      q: 'Quais formas de pagamento?',
      a: 'Pix, cartão e boleto, tudo via Mercado Pago. Os dados do cartão não passam pelo nosso servidor.',
    },
    {
      q: 'Quando o acesso libera?',
      a: 'Assim que o pagamento é aprovado — automático, sem esperar alguém liberar na mão. Pix costuma cair em segundos; boleto depende da compensação bancária.',
    },
    {
      q: 'Dá para testar antes de pagar?',
      a: 'Dá. Novos usuários têm 7 dias gratuitos para conhecer a plataforma antes de decidir qualquer coisa.',
    },
    {
      q: 'Sou bolsista PROUNI ou FIES. Tem desconto?',
      a: 'Em alguns produtos, sim. Quando houver benefício ativo para o plano que você está vendo, aparece um botão de solicitação logo abaixo do preço — é só enviar o comprovante e aguardar a análise.',
    },
  ]
}

function Faq({ plano }: { plano?: PlanoComPreco }) {
  const [aberta, setAberta] = useState<number | null>(0)
  const perguntas = useMemo(() => perguntasDoPlano(plano), [plano])

  return (
    <section className="mt-14 sm:mt-20">
      <h2 className="font-heading text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
        As dúvidas que chegam antes de assinar.
      </h2>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
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
                  className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5"
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
                  <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground sm:px-5">
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

/* ─────────────────────────── Fechamento ─────────────────────────── */

function Fechamento({
  plano,
  comprando,
  onComprar,
}: {
  plano?: PlanoComPreco
  comprando: boolean
  onComprar: () => void
}) {
  if (!plano) return null

  return (
    <section className="mt-14 sm:mt-20">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-9">
        <h2 className="max-w-2xl font-heading text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[2rem]">
          Nos próximos 7 dias, duas coisas podem acontecer.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Ou você entra, usa e a semana de estudo muda de forma — ou você pede o dinheiro
          de volta e não perdeu nada além de sete dias de teste. A única versão dessa
          história em que você sai perdendo é a que termina fechando esta aba.
        </p>

        <div className="mt-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onComprar}
            disabled={comprando}
            className={cn(BOTAO_PRIMARIO, 'w-full py-4 text-base sm:w-auto')}
          >
            {comprando ? 'Abrindo checkout…' : rotuloDeBotao('Assinar o', plano.name, 'Assinar agora')}
            {!comprando && <ArrowRight className="h-4 w-4 shrink-0" />}
          </button>
          <p className="font-clinical text-xs tabular-nums text-muted-foreground">
            R$ {formatarBRL(plano.preco.chamada.valor)}
            {plano.preco.chamada.unidade === 'unico' ? ' · pagamento único' : ' por mês'}
            {plano.preco.diario !== null && ` · R$ ${formatarBRL(plano.preco.diario)} por dia`}
          </p>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── Estados auxiliares ─────────────────────────── */

function BarraFixaMobile({
  plano,
  comprando,
  onComprar,
}: {
  plano: PlanoComPreco
  comprando: boolean
  onComprar: () => void
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden">
      <button
        type="button"
        onClick={onComprar}
        disabled={comprando}
        className="flex w-full items-center justify-between gap-3 rounded-xl bg-secondary px-4 py-3.5 text-left text-secondary-foreground shadow-lg shadow-secondary/25 transition active:scale-[0.99] disabled:opacity-60"
      >
        <span className="min-w-0">
          <span className="block truncate text-[10px] font-black uppercase tracking-wide opacity-85">
            {plano.name}
          </span>
          <span className="text-base font-bold tabular-nums">
            R$ {formatarBRL(plano.preco.chamada.valor)}
            <span className="text-[11px] font-semibold opacity-85">
              {plano.preco.chamada.unidade === 'unico' ? ' único' : '/mês'}
            </span>
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
    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4 sm:p-5">
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
    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
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
    <div className="pt-8 sm:pt-10" aria-hidden>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
        <div className="space-y-4">
          <div className="h-10 w-full animate-pulse rounded-lg bg-muted sm:h-14" />
          <div className="h-10 w-4/5 animate-pulse rounded-lg bg-muted sm:h-14" />
          <div className="h-20 w-full animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="h-56 w-full animate-pulse rounded-2xl bg-muted" />
      </div>
      <div className="mt-10 h-[420px] w-full animate-pulse rounded-2xl bg-muted" />
    </div>
  )
}
