'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { AppShell, useAppShell } from '@/components/app-shell'
import { usePricingEventState } from '@/components/pricing-events/usePricingEventState'
import {
  AvisoJaTenho,
  BarraDoPacote,
  FaixaDoPacote,
  FechamentoDoPacote,
  GradeDoPacote,
  OfertaDoPacote,
  PerguntasDoPacote,
  SeloDoPacote,
} from '@/components/manual-clinico/pacote'
import { TOTAL_DE_MODULOS } from '@/lib/manual-clinico/pacote'
import {
  Activity, ArrowLeft, Crown, ArrowRight, Loader2, Gauge, Ruler,
  GraduationCap, Check, ShieldCheck, Zap,
} from 'lucide-react'

// Carregado sob demanda apenas quando o acesso é confirmado — o simulador
// (motor de ECG + banco de traçados) não é enviado a quem não é assinante.
const EcgSimulator = dynamic(() => import('@/components/ecg/ecg-simulator').then((m) => m.EcgSimulator), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
})

interface ProductPlan {
  key: string
  label?: string
  price: number
  enabled: boolean
  durationMonths?: number | null
  pricingEventId?: string | null
}

interface CatalogSummary {
  total: number
  emergencies: number
  categories: { name: string; count: number }[]
}

interface AccessResp {
  isAuthenticated: boolean
  access: { hasFullAccess: boolean; reason: string; includedPlan: string | null }
  product: {
    label: string
    ctaText: string
    isActive: boolean
    currentPrice: number
    hasActivePromotion: boolean
    price: number
    pricingEventId?: string | null
    plans?: ProductPlan[]
  }
  catalog?: CatalogSummary
}

const PREVIEW_IMAGE = '/img/eletro/simulador-ecg-preview.webp'

export default function EletrocardiogramaPage() {
  return (
    // guestNotice desligado: o aviso flutuante do shell é `position: fixed` no
    // canto inferior direito e cobria o preview do simulador no desktop e a
    // barra de compra no celular. Aqui ele também é redundante e fora de
    // contexto — fala de catálogo, download e viewer de PDF, enquanto o paywall
    // desta página já explica, no lugar certo, o que está trancado e como abrir.
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <EcgManualContent />
    </AppShell>
  )
}

function EcgManualContent() {
  const router = useRouter()
  const { user, loading: shellLoading } = useAppShell()
  const [data, setData] = useState<AccessResp | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    fetch('/api/manual-clinico/eletrocardiograma')
      .then((r) => r.json())
      .then((d) => { if (alive) { setData(d); setLoaded(true) } })
      .catch(() => { if (alive) setLoaded(true) })
    return () => { alive = false }
  }, [])

  const ready = loaded && !shellLoading
  const hasAccess = data?.access?.hasFullAccess === true
  const isAuthenticated = !!user

  // Destino único: o middleware é quem manda quem não tem sessão para /comprar
  // (venda por Serial Key, sem conta). Duplicar essa decisão aqui só criava mais
  // um lugar para desencontrar da regra do servidor.
  function goToCheckout() {
    router.push('/manual-clinico/checkout')
  }

  // Plano mais barato entre os habilitados — é o "a partir de" que a landing
  // também anuncia. Guarda o plano inteiro (e não só o preço) porque o lote
  // que desconta o valor está amarrado ao plano, não ao produto.
  const enabledPlans = (data?.product?.plans || []).filter((p) => p.enabled && p.price > 0)
  const cheapestPlan = enabledPlans.reduce<ProductPlan | null>(
    (min, p) => (min == null || p.price < min.price ? p : min),
    null
  )
  const basePrice = cheapestPlan?.price ?? data?.product?.currentPrice ?? 0
  const eventId = cheapestPlan?.pricingEventId || data?.product?.pricingEventId || null

  return (
    <div className="surface-page min-h-screen">
      {/* HERO */}
      <div className="relative overflow-hidden border-b border-border bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4 pb-6 pt-6">
          <button onClick={() => router.push('/manual-clinico')} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar ao Manual Clínico
          </button>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <SeloDoPacote />
              <h1 className="sr-only">Manual do Eletrocardiograma</h1>
              <>
                <img
                  src="/img/eletro/manual-eletrocardiograma-light.webp"
                  alt="Manual do Eletrocardiograma"
                  width={958}
                  height={461}
                  className="mt-1.5 block h-auto w-full max-w-[320px] dark:hidden sm:max-w-[380px]"
                />
                <img
                  src="/img/eletro/manual-eletrocardiograma-dark.webp"
                  alt="Manual do Eletrocardiograma"
                  width={958}
                  height={461}
                  className="mt-1.5 hidden h-auto w-full max-w-[320px] dark:block sm:max-w-[380px]"
                />
              </>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Trilha de ensino interativa — do nó sinusal ao laudo, construindo o traçado onda por onda — mais o simulador de ECG: 12 derivações geradas matematicamente em tempo real, medidas automáticas, régua, modo monitor e banco de traçados com critérios diagnósticos internacionais.
              </p>
            </div>
            {ready && hasAccess && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                <Crown className="h-4 w-4" /> Acesso liberado
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-6">
        {!ready ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : hasAccess ? (
          <EcgSimulator />
        ) : (
          <Paywall
            onCheckout={goToCheckout}
            isAuthenticated={isAuthenticated}
            basePrice={basePrice}
            eventId={eventId}
            planLabel={cheapestPlan?.label || null}
            planMonths={cheapestPlan?.durationMonths ?? null}
            isActive={data?.product?.isActive !== false}
            catalog={data?.catalog}
          />
        )}
      </div>
    </div>
  )
}

const FEATURES = [
  { icon: GraduationCap, t: 'Trilha de ensino do zero ao laudo', d: '11 módulos e 27 lições que constroem o traçado onda por onda, com laboratórios interativos, XP e progresso.' },
  { icon: Activity, t: '12 derivações em tempo real', d: 'Traçados vetoriais gerados por parâmetros eletrofisiológicos — nunca imagens prontas.' },
  { icon: Gauge, t: 'Papel milimetrado real', d: 'Velocidades 25/50/100 mm/s e ganhos 5/10/20 mm/mV, calibração 10 mm = 1 mV.' },
  { icon: Ruler, t: 'Medidas automáticas e régua', d: 'FC, PR, QRS, QT, QTc, eixo e amplitudes; paquímetro para medir intervalos.' },
]

/**
 * Tela que o visitante e o usuário sem assinatura veem no lugar do simulador.
 * Duas colunas no desktop (argumento à esquerda, prova visual + preço à direita,
 * este último grudado enquanto se rola) e uma pilha no celular, onde o preço e o
 * botão também ficam numa barra fixa — sem ela o CTA some depois do primeiro
 * scroll e a pessoa fica sem saber quanto custa.
 */
function Paywall({
  onCheckout, isAuthenticated, basePrice, eventId, planLabel, planMonths, isActive, catalog,
}: {
  onCheckout: () => void
  isAuthenticated: boolean
  basePrice: number
  eventId: string | null
  planLabel: string | null
  planMonths: number | null
  isActive: boolean
  catalog?: CatalogSummary
}) {
  const { state: pricingEvent } = usePricingEventState(eventId)

  const tierPct = pricingEvent?.activeTier?.discountPercent || 0
  const hasTier = !!pricingEvent?.activeTier && pricingEvent?.isActive !== false && tierPct > 0 && basePrice > 0
  const finalPrice = hasTier
    ? Math.max(0, Math.round(basePrice * (1 - tierPct / 100) * 100) / 100)
    : basePrice
  const showPrice = isActive && basePrice > 0

  // Visitante não vai para o login: /comprar é compra sem conta, com a Serial
  // Key indo por e-mail. O rótulo antigo ("Entrar e desbloquear") prometia uma
  // tela de login que não aparece — e agora que o aviso de visitante saiu daqui,
  // esta é a única explicação do fluxo que a pessoa recebe.
  const ctaLabel = isAuthenticated ? 'Desbloquear o Manual Clínico' : 'Comprar e desbloquear'
  const totalTracings = catalog?.total ?? 90

  const perks = [
    'Acesso imediato após o pagamento',
    `Os ${totalTracings} traçados e as atualizações inclusos`,
    `Os outros ${TOTAL_DE_MODULOS - 1} manuais vêm juntos, sem custo extra`,
    'Nenhuma seção é vendida à parte',
    ...(isAuthenticated ? [] : ['Sem conta? A Serial Key vai por e-mail']),
  ]

  return (
    <>
      {/* pb no celular reserva o espaço da barra fixa, senão ela cobre o rodapé do card */}
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-8">
        {/* ── Coluna do argumento ── */}
        <div className="space-y-6">
          <FaixaDoPacote atual="eletrocardiograma" />

          <AvisoJaTenho />

          {/* Prova visual — no celular vem cedo, antes da lista de recursos */}
          <SimulatorPreview className="lg:hidden" />

          <div className="grid gap-3 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.t} className="rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:border-primary/30">
                <f.icon className="mb-2 h-5 w-5 text-primary" />
                <p className="text-sm font-bold">{f.t}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>

          {catalog && catalog.categories.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-heading text-base font-semibold tracking-tight">
                  {catalog.total} traçados comentados
                </h3>
                {catalog.emergencies > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                    <Zap className="h-3.5 w-3.5" /> {catalog.emergencies} de emergência
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Cada padrão vem com critérios diagnósticos segundo AHA, ACC, ESC e SBC.
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {catalog.categories.map((c) => (
                  <li
                    key={c.name}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs"
                  >
                    <span className="font-medium">{c.name}</span>
                    <span className="font-mono text-[11px] font-bold text-primary">{c.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── Coluna da prova visual + preço ── */}
        <div className="space-y-5 lg:sticky lg:top-6">
          <SimulatorPreview className="hidden lg:block" />

          {/* Aqui o cartão mostra o que se leva, não quanto custa: quem chegou
              pelo simulador ainda não sabe que a mesma compra abre outros seis
              manuais, e o preço lido antes disso vira comparação com o preço de
              um curso de ECG avulso. O número vem inteiro logo abaixo. */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              O que a compra abre
            </p>
            <h3 className="mt-1.5 font-heading text-lg font-semibold leading-snug tracking-tight">
              O Eletrocardiograma é 1 dos {TOTAL_DE_MODULOS} manuais
            </h3>
            <ul className="mt-4 space-y-1.5">
              {perks.map((t) => (
                <li key={t} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  {t}
                </li>
              ))}
            </ul>
            <button
              onClick={onCheckout}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
            >
              <Crown className="h-4 w-4" />
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Pix, cartão ou boleto · pagamento processado com segurança.
            </p>
          </div>
        </div>
      </div>

      {/* ── O valor inteiro, e só então o preço ── */}
      <GradeDoPacote atual="eletrocardiograma" className="mt-14" />

      <OfertaDoPacote
        className="mt-10"
        onCheckout={onCheckout}
        isAuthenticated={isAuthenticated}
        precoBase={basePrice}
        precoFinal={finalPrice}
        temLote={hasTier}
        pctLote={tierPct}
        rotuloLote={pricingEvent?.activeTier?.label ?? null}
        rotuloPlano={planLabel}
        mesesDoPlano={planMonths}
        mostrarPreco={showPrice}
      />

      <PerguntasDoPacote className="mt-14" />

      <FechamentoDoPacote
        className="mt-10 mb-28 lg:mb-0"
        onCheckout={onCheckout}
        precoFinal={finalPrice}
        mostrarPreco={showPrice}
      />

      {/* Barra fixa do celular: mantém preço e CTA sempre à mão. */}
      <BarraDoPacote
        onCheckout={onCheckout}
        precoBase={basePrice}
        precoFinal={finalPrice}
        temLote={hasTier}
        pctLote={tierPct}
        mostrarPreco={showPrice}
      />
    </>
  )
}

/** Print real do simulador em moldura de aparelho — mostra o que se compra. */
function SimulatorPreview({ className = '' }: { className?: string }) {
  return (
    <figure className={`m-0 ${className}`}>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-slate-900 to-slate-950 p-5 shadow-sm">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(52,211,153,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.6) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
          aria-hidden
        />
        <img
          src={PREVIEW_IMAGE}
          alt="Simulador de ECG do Manual Clínico: 12 derivações em papel milimetrado, com medidas de FC, PR e QRS calculadas automaticamente."
          width={760}
          height={1647}
          loading="lazy"
          decoding="async"
          className="relative mx-auto block h-auto w-full max-w-[260px] rounded-xl border border-white/10 shadow-2xl"
        />
      </div>
      <figcaption className="mt-2 text-center text-[11px] text-muted-foreground">
        Tela real do simulador — medidas calculadas a partir do traçado gerado.
      </figcaption>
    </figure>
  )
}
