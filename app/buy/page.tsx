'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check,
  AlertCircle,
  MessageCircle,
  ChevronRight,
  Shield,
  Lock,
  ChevronDown,
  ArrowLeft,
  Sparkles,
  Crown,
  Infinity as InfinityIcon,
  Zap,
  Star,
  Clock,
} from 'lucide-react'
import { PlanConfig } from '@/lib/types'
import { AppShell } from '@/components/app-shell'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

interface Plan {
  id: string
  name: string
  period: string
  originalPrice: number
  price: number
  discount?: number
  discountLabel?: string
  description: string
  features: string[]
  highlighted?: boolean
  badge?: string
  isLifetime?: boolean
  durationMonths?: number
}

const defaultPlans: Plan[] = [
  {
    id: 'mensal',
    name: 'DomineAqui PREMIUM',
    period: 'Mensal',
    originalPrice: 29.9,
    price: 24.9,
    description: 'Flexível para testar o ritmo',
    features: [
      '400 Questões Pessoais/dia',
      '500 Flashcards/dia',
      'Cronogramas ilimitados',
      'Fórum premium',
      'Aulas ao vivo',
      'WhatsApp do grupo',
    ],
    durationMonths: 1,
  },
  {
    id: 'trimestral',
    name: 'DomineAqui PREMIUM',
    period: 'Trimestral',
    originalPrice: 89.7,
    price: 69.9,
    discount: 22,
    discountLabel: 'Economize em 3 meses',
    description: 'Consistência sem travar o bolso',
    features: [
      '400 Questões Pessoais/dia',
      '500 Flashcards/dia',
      'Cronogramas ilimitados',
      'Fórum premium',
      'Aulas ao vivo',
      'WhatsApp do grupo',
    ],
    durationMonths: 3,
  },
  {
    id: 'anual',
    name: 'DomineAqui PREMIUM',
    period: 'Anual',
    originalPrice: 358.8,
    price: 159.9,
    discount: 55,
    discountLabel: 'Melhor custo por mês',
    description: 'O plano que a maioria escolhe',
    features: [
      '400 Questões Pessoais/dia',
      '500 Flashcards/dia',
      'Cronogramas ilimitados',
      'Fórum premium',
      'Aulas ao vivo',
      'WhatsApp do grupo',
    ],
    highlighted: true,
    badge: 'MAIS ESCOLHIDO',
    durationMonths: 12,
  },
  {
    id: 'vitalicio',
    name: 'DomineAqui PREMIUM',
    period: 'Vitalício',
    originalPrice: 1497.0,
    price: 529.0,
    discount: 65,
    discountLabel: 'Oferta até fim de 2026',
    description: 'Paga uma vez. Domina pra sempre.',
    features: [
      '400 Questões Pessoais/dia',
      '500 Flashcards/dia',
      'Cronogramas ilimitados',
      'Fórum premium',
      'Aulas ao vivo',
      'WhatsApp do grupo',
    ],
    highlighted: true,
    badge: 'OFERTA LIMITADA',
    isLifetime: true,
  },
]

const FAQ_ITEMS = [
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim, sem multa. Você mantém o acesso até o fim do período já pago.',
  },
  {
    q: 'Quais formas de pagamento?',
    a: 'Pix, cartão e boleto via Mercado Pago.',
  },
  {
    q: 'O vitalício é de verdade?',
    a: 'Sim: pagamento único e acesso permanente. Oferta limitada até o 2º semestre de 2026.',
  },
  {
    q: 'Tem teste?',
    a: 'Novos usuários têm 7 dias gratuitos para conhecer a plataforma.',
  },
]

function PlanIcon({ plan }: { plan: Plan }) {
  if (plan.isLifetime) return <InfinityIcon className="h-5 w-5" />
  if (plan.durationMonths === 12) return <Crown className="h-5 w-5" />
  if (plan.durationMonths === 3) return <Star className="h-5 w-5" />
  return <Zap className="h-5 w-5" />
}

function formatBRL(value: number) {
  return value.toFixed(2).replace('.', ',')
}

function getPlanMonthly(plan: Plan): string | null {
  if (!plan.durationMonths || plan.durationMonths <= 1) return null
  return (plan.price / plan.durationMonths).toFixed(2).replace('.', ',')
}

export default function BuyPage() {
  return (
    <AppShell allowGuest headerTitle="Premium" headerSubtitle="Assinatura DomineAqui">
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
  const [plans, setPlans] = useState<Plan[]>(defaultPlans)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [successPlan, setSuccessPlan] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

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
              discount: p.precoOriginal
                ? Math.round(100 - (p.preco / p.precoOriginal) * 100)
                : undefined,
              discountLabel: p.descricao,
              description: p.descricao || '',
              features: p.beneficios || [],
              highlighted: p.destaque,
              badge: p.badge,
              isLifetime: !p.durationMonths || p.durationMonths === 0,
              durationMonths: p.durationMonths,
            }))
        )
      }
    } catch {
      /* defaults */
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

  const popular = useMemo(
    () => plans.find((p) => p.highlighted && !p.isLifetime) || plans.find((p) => p.highlighted) || plans[0],
    [plans]
  )

  return (
    <div className="surface-page min-h-full">
      {/* Compact top bar */}
      <div className="border-b border-border bg-card/60">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card hover:bg-muted transition"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-secondary">Premium</p>
            <p className="truncate text-sm font-semibold text-foreground sm:hidden">Escolha seu plano</p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground">
            <Lock className="h-3 w-3 text-primary" /> Checkout seguro
          </span>
          <ThemeToggle className="sm:hidden" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 sm:pb-16 sm:pt-10">
        {/* Hero — short, punchy, no feature dumps */}
        <section className="relative mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm sm:mb-10">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 70% at 10% 0%, rgba(70,129,82,0.18), transparent 55%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(206,89,41,0.12), transparent 50%)',
            }}
            aria-hidden
          />
          <div className="relative px-5 py-8 text-center sm:px-10 sm:py-11">
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-secondary">
              <Sparkles className="h-3.5 w-3.5" />
              Acesso imediato após o pagamento
            </div>
            <h1 className="font-heading text-[1.85rem] font-semibold leading-[1.12] tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
              A diferença entre estudar
              <br className="hidden sm:block" />
              <span className="text-primary"> e chegar na prova no piloto automático.</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Escolha o prazo. Ative o Premium. Comece a treinar no ritmo de quem passa —
              sem planilha, sem caos, sem enrolação.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/80 px-2.5 py-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" /> Mercado Pago
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/80 px-2.5 py-1.5">
                <Check className="h-3.5 w-3.5 text-primary" /> Cancele quando quiser
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/80 px-2.5 py-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" /> Ativação na hora
              </span>
            </div>
          </div>
        </section>

        {paymentSuccess && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Check className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-lg font-semibold text-foreground">Pagamento aprovado</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Premium ativado{successPlan ? ` (${successPlan})` : ''}. Bora dominar.
              </p>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
              >
                Ir para o dashboard
              </button>
            </div>
          </div>
        )}

        {!loadingSub && hasActiveSub && sub && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">Você já tem um plano ativo</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {sub.type === 'premium' ? 'Premium' : 'Trial'}
                {sub.planType ? ` (${sub.planType})` : ''}
                {' · '}
                {new Date(sub.expiresAt).getFullYear() >= 9999 ? (
                  <strong className="text-foreground">vitalício</strong>
                ) : (
                  <>
                    até{' '}
                    <strong className="text-foreground">
                      {new Date(sub.expiresAt).toLocaleDateString('pt-BR')}
                    </strong>
                  </>
                )}
                {hasRecurringSub && (
                  <span className="ml-1 text-xs text-primary">· renovação automática</span>
                )}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => router.push('/profile')}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
                >
                  Gerenciar no perfil
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const msg = encodeURIComponent(
                      `Olá! Sou ${userName} do DomineAqui e quero falar sobre meu plano.`
                    )
                    window.open(`https://wa.me/5521997770936?text=${msg}`, '_blank')
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Plans — the only place benefits live */}
        {loadingSub ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[420px] animate-pulse rounded-2xl border border-border bg-card" />
            ))}
          </div>
        ) : (
          !hasActiveSub && (
            <>
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <p className="editorial-mark mb-1">Planos</p>
                  <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
                    Escolha quanto tempo você quer de vantagem
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {plans.map((plan) => {
                  const isGold = !!plan.isLifetime
                  const isHighlight = !!plan.highlighted
                  const monthly = getPlanMonthly(plan)
                  const isSelecting = selecting === plan.id

                  return (
                    <article
                      key={plan.id}
                      className={cn(
                        'relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-200',
                        'hover:-translate-y-1 hover:shadow-lg',
                        isGold
                          ? 'border-amber-500/50 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/20'
                          : isHighlight
                            ? 'border-secondary/50 shadow-md shadow-secondary/15 ring-1 ring-secondary/20 lg:scale-[1.02] lg:z-[1]'
                            : 'border-border shadow-sm'
                      )}
                    >
                      <div
                        className={cn(
                          'h-1.5 w-full',
                          isGold
                            ? 'bg-gradient-to-r from-amber-700 via-amber-400 to-amber-600'
                            : isHighlight
                              ? 'bg-secondary'
                              : 'bg-border'
                        )}
                      />

                      {plan.badge && (
                        <div className="absolute right-3 top-4 z-[1]">
                          <span
                            className={cn(
                              'rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide',
                              isGold
                                ? 'border border-amber-500/35 bg-amber-500/15 text-amber-800 dark:text-amber-200'
                                : 'border border-secondary/35 bg-secondary/15 text-secondary'
                            )}
                          >
                            {plan.badge}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-1 flex-col p-5 pt-6">
                        <div
                          className={cn(
                            'mb-3 flex h-11 w-11 items-center justify-center rounded-xl border',
                            isGold
                              ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300'
                              : isHighlight
                                ? 'border-secondary/30 bg-secondary/10 text-secondary'
                                : 'border-primary/25 bg-primary/10 text-primary'
                          )}
                        >
                          <PlanIcon plan={plan} />
                        </div>

                        <p
                          className={cn(
                            'font-clinical text-[10px] font-bold uppercase tracking-[0.16em]',
                            isGold
                              ? 'text-amber-600 dark:text-amber-400'
                              : isHighlight
                                ? 'text-secondary'
                                : 'text-primary'
                          )}
                        >
                          {plan.period}
                        </p>
                        <h3 className="mt-1 text-base font-bold leading-snug text-foreground">
                          {plan.name}
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">{plan.description}</p>

                        <div className="mt-4 mb-1">
                          <div className="flex items-end gap-2 flex-wrap">
                            <span className="font-heading text-[2rem] font-semibold leading-none tabular-nums tracking-tight text-foreground">
                              R$ {formatBRL(plan.price)}
                            </span>
                            {plan.originalPrice > plan.price && (
                              <span className="mb-0.5 text-sm text-muted-foreground line-through tabular-nums">
                                R$ {formatBRL(plan.originalPrice)}
                              </span>
                            )}
                          </div>
                          {monthly && (
                            <p className="mt-1.5 text-xs font-medium text-muted-foreground">
                              ≈ R$ {monthly}/mês
                            </p>
                          )}
                          {plan.discount && plan.discount > 0 && (
                            <span
                              className={cn(
                                'mt-2 inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold',
                                isGold
                                  ? 'bg-amber-500/12 text-amber-700 dark:text-amber-300'
                                  : 'bg-primary/10 text-primary'
                              )}
                            >
                              −{plan.discount}%
                              {plan.discountLabel ? ` · ${plan.discountLabel}` : ''}
                            </span>
                          )}
                        </div>

                        <ul className="mt-4 mb-6 flex-1 space-y-2.5 border-t border-border pt-4">
                          {plan.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-[13px] leading-snug text-foreground/90">
                              <Check
                                className={cn(
                                  'mt-0.5 h-4 w-4 shrink-0',
                                  isGold
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : isHighlight
                                      ? 'text-secondary'
                                      : 'text-primary'
                                )}
                              />
                              {f}
                            </li>
                          ))}
                        </ul>

                        <button
                          type="button"
                          onClick={() => handleSelect(plan)}
                          disabled={isSelecting}
                          className={cn(
                            'inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-3.5 text-sm font-bold transition active:scale-[0.98] disabled:opacity-60',
                            isGold
                              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25 hover:bg-amber-500'
                              : isHighlight
                                ? 'bg-secondary text-secondary-foreground shadow-md shadow-secondary/30 hover:bg-secondary/90'
                                : 'border border-border bg-muted/70 text-foreground hover:bg-muted'
                          )}
                        >
                          {isSelecting ? (
                            'Abrindo checkout…'
                          ) : (
                            <>
                              Quero este plano
                              <ChevronRight className="h-4 w-4" />
                            </>
                          )}
                        </button>
                        <p className="mt-2 text-center text-[11px] text-muted-foreground">
                          {plan.isLifetime ? 'Pagamento único · acesso permanente' : 'Pix · cartão · boleto'}
                        </p>
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          )
        )}

        {/* Minimal trust — no feature dump */}
        <div className="mx-auto mt-10 max-w-lg text-center">
          <p className="text-sm text-muted-foreground">
            Dúvida antes de assinar?{' '}
            <a
              href="https://wa.me/5521997770936"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:underline"
            >
              Fale no WhatsApp
            </a>
          </p>
        </div>

        {/* FAQ compact */}
        <section className="mx-auto mt-10 max-w-2xl">
          <h2 className="mb-4 text-center font-heading text-xl font-semibold text-foreground">
            Perguntas rápidas
          </h2>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {FAQ_ITEMS.map((item, i) => {
              const open = openFaq === i
              return (
                <div key={i} className="border-b border-border last:border-b-0">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-5"
                    onClick={() => setOpenFaq(open ? null : i)}
                  >
                    <span className="text-sm font-semibold text-foreground">{item.q}</span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 text-secondary transition-transform',
                        open && 'rotate-180'
                      )}
                    />
                  </button>
                  <div
                    className="grid transition-[grid-template-rows] duration-300 ease-out"
                    style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
                  >
                    <div className="overflow-hidden min-h-0">
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
      </div>

      {/* Mobile sticky — popular plan only */}
      {!loadingSub && !hasActiveSub && popular && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md sm:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => handleSelect(popular)}
            disabled={selecting === popular.id}
            className="flex w-full items-center justify-between gap-3 rounded-xl bg-secondary px-4 py-3.5 text-left text-secondary-foreground shadow-lg shadow-secondary/30 active:scale-[0.99] disabled:opacity-60"
          >
            <span>
              <span className="block text-[10px] font-black uppercase tracking-wide opacity-85">
                {popular.badge || popular.period}
              </span>
              <span className="text-base font-bold tabular-nums">
                R$ {formatBRL(popular.price)}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-bold">
              Assinar agora <ChevronRight className="h-4 w-4" />
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
