'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check, Zap, Crown, Infinity, Sparkles, AlertCircle,
  MessageCircle, ChevronRight, Shield, Lock, Star,
  BookOpen, Clock, Users, ChevronDown, ChevronUp,
  ArrowLeft,
} from 'lucide-react'
import { PlanConfig } from '@/lib/types'
import { AppShell } from '@/components/app-shell'

/* ─── Paleta Irish Glassmorphism ─────────────────────────── */
const G = {
  bg: 'linear-gradient(145deg,#020c05 0%,#061410 40%,#030a06 100%)',
  card: 'rgba(7,22,11,0.82)',
  cardHighlight: 'rgba(5,30,14,0.92)',
  border: 'rgba(52,211,153,0.18)',
  borderHighlight: 'rgba(52,211,153,0.55)',
  borderGold: 'rgba(251,191,36,0.55)',
  glowGreen: '0 0 40px rgba(52,211,153,0.18)',
  glowGold: '0 0 40px rgba(251,191,36,0.2)',
  inputBg: 'rgba(255,255,255,0.05)',
}

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
    id: 'mensal', name: 'DomineAqui PREMIUM', period: 'Plano Mensal',
    originalPrice: 29.90, price: 24.90,
    description: 'Perfeito para começar',
    features: ['400 Questões Pessoais/dia', '500 Flashcards/dia', 'Cronogramas ilimitados', 'Fórum premium', 'Aulas ao vivo', 'WhatsApp do grupo'],
    durationMonths: 1,
  },
  {
    id: 'trimestral', name: 'DomineAqui PREMIUM', period: 'Plano Trimestral',
    originalPrice: 89.70, price: 69.90, discount: 22,
    discountLabel: 'Economize R$ 18 em 3 meses',
    description: 'Estude com consistência',
    features: ['400 Questões Pessoais/dia', '500 Flashcards/dia', 'Cronogramas ilimitados', 'Fórum premium', 'Aulas ao vivo', 'WhatsApp do grupo'],
    durationMonths: 3,
  },
  {
    id: 'anual', name: 'DomineAqui PREMIUM', period: 'Plano Anual',
    originalPrice: 358.80, price: 159.90, discount: 55,
    discountLabel: 'Só R$ 13,33/mês — melhor valor',
    description: 'Melhor valor do ano',
    features: ['400 Questões Pessoais/dia', '500 Flashcards/dia', 'Cronogramas ilimitados', 'Fórum premium', 'Aulas ao vivo', 'WhatsApp do grupo'],
    highlighted: true, badge: 'MAIS POPULAR',
    durationMonths: 12,
  },
  {
    id: 'vitalicio', name: 'DomineAqui PREMIUM', period: 'Plano Vitalício',
    originalPrice: 1497.00, price: 529.00, discount: 65,
    discountLabel: 'OFERTA LIMITADA — só até fim de 2026',
    description: 'Acesso para sempre',
    features: ['400 Questões Pessoais/dia', '500 Flashcards/dia', 'Cronogramas ilimitados', 'Fórum premium', 'Aulas ao vivo', 'WhatsApp do grupo'],
    highlighted: true, badge: 'OFERTA LIMITADA',
    isLifetime: true,
  },
]

const FAQ_ITEMS = [
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim, sem multa ou burocracia. Você mantém o acesso até o fim do período já pago.' },
  { q: 'Quais formas de pagamento?', a: 'Cartão de crédito, Pix e boleto bancário — tudo via Mercado Pago, a plataforma mais segura do Brasil.' },
  { q: 'O plano vitalício é realmente vitalício?', a: 'Sim, pagamento único e acesso permanente. A oferta é limitada até o 2º semestre de 2026 — depois é retirada definitivamente.' },
  { q: 'Há período de teste?', a: 'Oferecemos 7 dias gratuitos para novos usuários conhecerem a plataforma.' },
  { q: 'Posso pagar com Pix em planos recorrentes?', a: 'Sim! Você pode pagar com Pix, cartão ou boleto em qualquer plano como pagamento único para o período. Para assinatura automática (renovação automática), é necessário cartão de crédito.' },
]

function getPlanIcon(plan: Plan) {
  if (plan.isLifetime) return '♾️'
  if (plan.durationMonths === 12) return '👑'
  if (plan.durationMonths === 3) return '⭐'
  return '⚡'
}

function getPlanMonthly(plan: Plan): string | null {
  if (!plan.durationMonths || plan.durationMonths <= 1) return null
  return (plan.price / plan.durationMonths).toFixed(2).replace('.', ',')
}

export default function BuyPage() {
  return (
    <AppShell>
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
              discount: p.precoOriginal ? Math.round(100 - (p.preco / p.precoOriginal) * 100) : undefined,
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
    } catch {}
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
    } catch {} finally { setLoadingSub(false) }
  }

  async function loadUser() {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) { const d = await res.json(); setUserName(d.user.name) }
    } catch {}
  }

  function checkSuccess() {
    const params = new URLSearchParams(window.location.search)
    if (params.get('purchase') === 'success' || params.get('subscription') === 'success') {
      const plan = localStorage.getItem('lastPurchasedPlan')
      setPaymentSuccess(true)
      if (plan) { setSuccessPlan(plan); localStorage.removeItem('lastPurchasedPlan') }
      setTimeout(checkSub, 1500)
    }
  }

  function handleSelect(plan: Plan) {
    setSelecting(plan.id)
    localStorage.setItem('lastPurchasedPlan', plan.id)
    router.push(`/buy/checkout?plan=${encodeURIComponent(plan.id)}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: G.bg }} className="text-white">

      {/* ── Header ──────────────────────────────── */}
      <header className="sticky top-0 z-50 px-4 py-3 flex items-center gap-3"
        style={{ background: 'rgba(2,10,4,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(52,211,153,0.1)' }}>
        <button onClick={() => router.back()} className="p-2 rounded-xl transition-colors hover:bg-white/5">
          <ArrowLeft className="h-5 w-5 text-emerald-400" />
        </button>
        <div className="flex-1">
          <p className="text-xs text-emerald-400/60 uppercase tracking-widest font-bold">DomineAqui</p>
          <p className="text-sm font-semibold text-white/90">Planos Premium</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#6ee7b7' }}>
          <Lock className="h-3 w-3" /> Pagamento seguro
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-10 pb-24">

        {/* ── Hero ──────────────────────────────── */}
        <div className="text-center mb-12 relative">
          {/* Glow de fundo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-96 h-64 rounded-full opacity-20" style={{ background: 'radial-gradient(ellipse, #34d399 0%, transparent 70%)', filter: 'blur(60px)' }} />
          </div>
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
              style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#6ee7b7' }}>
              <Sparkles className="h-3.5 w-3.5" /> Acesso Completo à Plataforma
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight tracking-tight">
              Seja o Foco.<br />
              <span style={{ background: 'linear-gradient(90deg,#34d399,#6ee7b7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Seja a Referência.
              </span>
            </h1>
            <p className="text-lg text-white/50 max-w-xl mx-auto leading-relaxed">
              O Premium é pra quem não quer só estudar — quer <strong className="text-white/80">dominar</strong>. Escolha seu plano e comece hoje.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              {[
                { icon: <Shield className="h-3.5 w-3.5" />, text: 'Mercado Pago' },
                { icon: <Lock className="h-3.5 w-3.5" />, text: 'Dados criptografados' },
                { icon: <Check className="h-3.5 w-3.5" />, text: 'Cancele quando quiser' },
                { icon: <Users className="h-3.5 w-3.5" />, text: 'Milhares de estudantes' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-xs text-emerald-300/60 font-medium">
                  <span className="text-emerald-400/70">{icon}</span> {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Success banner ─────────────────────── */}
        {paymentSuccess && (
          <div className="mb-10 p-5 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-500"
            style={{ background: 'rgba(6,30,15,0.9)', border: '1px solid rgba(52,211,153,0.4)', boxShadow: '0 0 30px rgba(52,211,153,0.15)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(52,211,153,0.2)', border: '1px solid rgba(52,211,153,0.4)' }}>
              <Check className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-emerald-300 text-lg">🎉 Pagamento Aprovado!</p>
              <p className="text-white/70 text-sm mt-1">Seu plano Premium foi ativado com sucesso. Bons estudos!</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => router.push('/profile')}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(52,211,153,0.2)', border: '1px solid rgba(52,211,153,0.4)', color: '#6ee7b7' }}>
                  Ver Meu Perfil
                </button>
                <button onClick={() => setPaymentSuccess(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white/40 hover:text-white/60 transition-colors">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Active sub banner ─────────────────── */}
        {!loadingSub && hasActiveSub && sub && (
          <div className="mb-10 p-5 rounded-2xl flex items-start gap-4"
            style={{ background: 'rgba(6,25,18,0.9)', border: '1px solid rgba(52,211,153,0.3)', boxShadow: '0 0 20px rgba(52,211,153,0.08)' }}>
            <AlertCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-emerald-300 text-base">Você já tem um plano ativo</p>
              <p className="text-white/60 text-sm mt-1">
                {sub.type === 'premium' ? 'Premium' : 'Trial'}{sub.planType ? ` (${sub.planType})` : ''}{' — '}
                {new Date(sub.expiresAt).getFullYear() >= 9999
                  ? <strong className="text-white/80">Acesso vitalício</strong>
                  : <>ativo até <strong className="text-white/80">{new Date(sub.expiresAt).toLocaleDateString('pt-BR')}</strong></>
                }
                {hasRecurringSub && (
                  <span className="ml-2 text-xs text-emerald-400/70">(renovação automática)</span>
                )}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <button onClick={() => router.push('/profile')}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#6ee7b7' }}>
                  Gerenciar no Perfil
                </button>
                <button onClick={() => {
                  const msg = encodeURIComponent(`Olá! Sou ${userName} do DomineAqui e quero fazer upgrade ou cancelar meu plano.`)
                  window.open(`https://wa.me/5521997770936?text=${msg}`, '_blank')
                }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white/50 hover:text-white/70 transition-colors border border-white/10">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Plans grid ────────────────────────── */}
        {!loadingSub && !hasActiveSub && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 items-stretch">
              {plans.map((plan) => {
                const isGold = plan.isLifetime
                const isHighlight = plan.highlighted
                const monthlyPrice = getPlanMonthly(plan)
                const isSelecting = selecting === plan.id

                return (
                  <div key={plan.id} className="relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                    style={{
                      background: isHighlight ? G.cardHighlight : G.card,
                      border: `1px solid ${isGold ? G.borderGold : isHighlight ? G.borderHighlight : G.border}`,
                      boxShadow: isGold ? `${G.glowGold}, inset 0 1px 0 rgba(255,255,255,0.06)` : isHighlight ? `${G.glowGreen}, inset 0 1px 0 rgba(255,255,255,0.05)` : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                      backdropFilter: 'blur(20px)',
                    }}>

                    {/* Badge */}
                    {plan.badge && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                          style={{
                            background: isGold ? 'rgba(251,191,36,0.2)' : 'rgba(52,211,153,0.2)',
                            border: `1px solid ${isGold ? 'rgba(251,191,36,0.4)' : 'rgba(52,211,153,0.4)'}`,
                            color: isGold ? '#fbbf24' : '#34d399',
                          }}>
                          {plan.badge}
                        </span>
                      </div>
                    )}

                    <div className="p-5 flex flex-col flex-1">
                      {/* Icon + name + period */}
                      <div className="mb-4">
                        <div className="text-3xl mb-2">{getPlanIcon(plan)}</div>
                        <p className="text-xs uppercase tracking-widest font-bold mb-0.5"
                          style={{ color: isGold ? '#fbbf24' : '#34d399' }}>
                          {plan.period}
                        </p>
                        <p className="text-white/80 text-sm font-semibold leading-tight">{plan.name}</p>
                        <p className="text-white/40 text-xs">{plan.description}</p>
                      </div>

                      {/* Price */}
                      <div className="mb-5">
                        <div className="flex items-end gap-2">
                          <span className="text-3xl font-extrabold tracking-tight text-white">
                            R$ {plan.price.toFixed(2).replace('.', ',')}
                          </span>
                          {plan.originalPrice > plan.price && (
                            <span className="text-sm text-white/30 line-through mb-1">
                              R$ {plan.originalPrice.toFixed(2).replace('.', ',')}
                            </span>
                          )}
                        </div>
                        {monthlyPrice && (
                          <p className="text-xs mt-1" style={{ color: isGold ? '#fbbf2480' : '#34d39970' }}>
                            ≈ R$ {monthlyPrice}/mês
                          </p>
                        )}
                        {plan.discount && plan.discount > 0 && (
                          <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-md text-[11px] font-bold"
                            style={{
                              background: isGold ? 'rgba(251,191,36,0.12)' : 'rgba(52,211,153,0.12)',
                              color: isGold ? '#fbbf24' : '#34d399',
                            }}>
                            -{plan.discount}% desconto
                          </div>
                        )}
                      </div>

                      {/* Features */}
                      <ul className="space-y-2 flex-1 mb-6">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                            <Check className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: isGold ? '#fbbf24' : '#34d399' }} />
                            {f}
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <button
                        onClick={() => handleSelect(plan)}
                        disabled={isSelecting}
                        className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
                        style={{
                          background: isSelecting
                            ? 'rgba(52,211,153,0.1)'
                            : isGold
                              ? 'linear-gradient(135deg,#92400e,#d97706,#fbbf24)'
                              : isHighlight
                                ? 'linear-gradient(135deg,#059669,#34d399)'
                                : 'rgba(52,211,153,0.12)',
                          border: `1px solid ${isGold ? 'rgba(251,191,36,0.5)' : 'rgba(52,211,153,0.4)'}`,
                          boxShadow: isHighlight && !isSelecting
                            ? '0 4px 20px rgba(52,211,153,0.3)'
                            : isGold && !isSelecting
                              ? '0 4px 20px rgba(251,191,36,0.25)'
                              : 'none',
                          color: isSelecting ? 'rgba(52,211,153,0.5)' : '#fff',
                        }}>
                        {isSelecting ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Aguarde...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1.5">
                            Escolher este plano <ChevronRight className="h-4 w-4" />
                          </span>
                        )}
                      </button>

                      {/* Sub-label */}
                      <p className="text-center text-[11px] text-white/25 mt-2">
                        {plan.isLifetime ? 'Pagamento único' : 'Pix · Cartão · Boleto'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── Features comparison strip ─────── */}
            <div className="rounded-2xl p-6 mb-12"
              style={{ background: 'rgba(5,20,10,0.7)', border: '1px solid rgba(52,211,153,0.1)', backdropFilter: 'blur(20px)' }}>
              <p className="text-center text-xs uppercase tracking-widest text-emerald-400/60 font-bold mb-5">O que você desbloqueia</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { icon: <BookOpen className="h-5 w-5" />, label: '400 Questões', sub: 'por dia' },
                  { icon: <Sparkles className="h-5 w-5" />, label: '500 Flashcards', sub: 'por dia' },
                  { icon: <Clock className="h-5 w-5" />, label: 'Cronogramas', sub: 'ilimitados' },
                  { icon: <Star className="h-5 w-5" />, label: 'Fórum Premium', sub: 'exclusivo' },
                  { icon: <Users className="h-5 w-5" />, label: 'Aulas ao vivo', sub: 'e pós-aula' },
                  { icon: <MessageCircle className="h-5 w-5" />, label: 'WhatsApp', sub: 'do grupo' },
                ].map(({ icon, label, sub }) => (
                  <div key={label} className="flex flex-col items-center text-center gap-2 py-3 px-2 rounded-xl"
                    style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.08)' }}>
                    <span className="text-emerald-400/70">{icon}</span>
                    <div>
                      <p className="text-white/80 text-xs font-semibold">{label}</p>
                      <p className="text-white/30 text-[10px]">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── FAQ ───────────────────────────────── */}
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-xs uppercase tracking-widest text-emerald-400/60 font-bold mb-6">Perguntas frequentes</p>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="rounded-xl overflow-hidden transition-all"
                style={{ background: 'rgba(5,20,10,0.6)', border: `1px solid ${openFaq === i ? 'rgba(52,211,153,0.3)' : 'rgba(52,211,153,0.1)'}`, backdropFilter: 'blur(16px)' }}>
                <button
                  className="w-full flex items-center justify-between gap-3 p-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="text-sm font-semibold text-white/90">{item.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                    : <ChevronDown className="h-4 w-4 flex-shrink-0 text-white/30" />}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-white/55 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer trust strip ─────────────────── */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {[
            { icon: <Lock className="h-3.5 w-3.5" />, text: 'SSL / TLS' },
            { icon: <Shield className="h-3.5 w-3.5" />, text: 'Mercado Pago' },
            { icon: <Check className="h-3.5 w-3.5" />, text: 'Dados protegidos' },
            { icon: <Clock className="h-3.5 w-3.5" />, text: 'Suporte ativo' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-xs text-white/25">
              <span className="text-white/20">{icon}</span> {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
